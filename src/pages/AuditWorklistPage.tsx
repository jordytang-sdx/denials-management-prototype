import { useState, useMemo } from 'react'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Avatar, Tabs, Tab, TextField, InputAdornment,
  IconButton, Popover, RadioGroup, FormControlLabel, Radio, FormGroup,
  Checkbox, Divider, Button, ListItemButton, Tooltip,
} from '@mui/material'
import {
  ArrowUpward, ArrowDownward, SwapVert, FilterList,
  SearchOutlined, CloseOutlined, AddOutlined, ViewColumnOutlined,
} from '@mui/icons-material'
import { type AuditRecord, type AuditState } from '../data/audits'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type SortCol = 'patient' | 'amountAtRisk' | 'proposedRecoupment' | 'deadline'
type AuditSort = { colId: SortCol; dir: SortDir } | null

interface AuditFilters {
  auditType: string[]
  payer: string[]
  assignedTo: string[]
}

interface ColPopoverState {
  anchor: HTMLElement
  colId: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: AuditState[] = ['NoticeReceived', 'RecordsPending', 'UnderReview', 'FindingsIssued', 'Disputed', 'Closed']

const TAB_LABELS: Record<AuditState, string> = {
  NoticeReceived: 'Notice Received',
  RecordsPending: 'Records Pending',
  UnderReview:    'Under Review',
  FindingsIssued: 'Findings Issued',
  Disputed:       'Disputed',
  Closed:         'Closed',
}

const STATE_COLORS: Record<AuditState, { bg: string; color: string }> = {
  NoticeReceived: { bg: '#fef3ea', color: '#b86823' },
  RecordsPending: { bg: '#fef3ea', color: '#b86823' },
  UnderReview:    { bg: '#ebf5fb', color: '#2776a1' },
  FindingsIssued: { bg: '#fbedee', color: '#9f383e' },
  Disputed:       { bg: '#F5F3FF', color: '#6D28D9' },
  Closed:         { bg: '#f1f4f6', color: '#636a6f' },
}

const AUDIT_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  RAC:        { color: '#157d9d', bg: '#e8f2f5' },
  MAC:        { color: '#227a6c', bg: '#eaf6f4' },
  OIG:        { color: '#9f383e', bg: '#fbedee' },
  Commercial: { color: '#7C3AED', bg: '#F5F3FF' },
  Internal:   { color: '#636a6f', bg: '#f1f4f6' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

function deadlineColor(days: number): string {
  if (days < 0)  return '#DC2626'
  if (days <= 7) return '#B45309'
  return '#374151'
}

function formatPatientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  const lastName = parts[parts.length - 1]!
  const firstName = parts.slice(0, -1).join(' ')
  return `${lastName}, ${firstName}`
}

const AUDIT_OPTIONAL_COLS: Array<{ id: string; label: string }> = [
  { id: 'lineOfBusiness', label: 'Line of Business' },
  { id: 'dos',            label: 'Date of Service' },
]

// ── Column Header ─────────────────────────────────────────────────────────────

interface ColHeaderProps {
  label: string
  colId: string
  sortable?: boolean
  filterable?: boolean
  activeSort: AuditSort
  hasFilter: boolean
  onOpen: (e: React.MouseEvent<HTMLElement>, colId: string) => void
  align?: 'left' | 'right'
  width?: number
}

function ColHeader({ label, colId, sortable, filterable, activeSort, hasFilter, onOpen, align = 'left', width }: ColHeaderProps) {
  const isActive = activeSort?.colId === colId
  const isInteractive = sortable || filterable

  return (
    <TableCell
      align={align}
      sx={{
        width,
        cursor: isInteractive ? 'pointer' : 'default',
        userSelect: 'none',
        py: 1.25,
        bgcolor: hasFilter ? 'rgba(21,125,157,0.05)' : undefined,
        borderBottom: hasFilter ? '2px solid' : undefined,
        borderBottomColor: hasFilter ? 'primary.main' : undefined,
        '&:hover': isInteractive ? { bgcolor: hasFilter ? 'rgba(21,125,157,0.08)' : 'rgba(21,125,157,0.04)' } : undefined,
      }}
      onClick={isInteractive ? (e) => onOpen(e, colId) : undefined}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: hasFilter || isActive ? 700 : 600,
            letterSpacing: '0.06em',
            color: isActive || hasFilter ? 'primary.main' : 'text.secondary',
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
        {isActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'primary.main', borderRadius: 0.75, px: 0.5, py: 0.25 }}>
            {activeSort?.dir === 'asc'
              ? <ArrowUpward sx={{ fontSize: 12, color: '#fff' }} />
              : <ArrowDownward sx={{ fontSize: 12, color: '#fff' }} />}
          </Box>
        )}
        {filterable && hasFilter && !isActive && (
          <FilterList sx={{ fontSize: 14, color: 'primary.main' }} />
        )}
        {isInteractive && !isActive && !hasFilter && (
          <SwapVert sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.55 }} />
        )}
      </Box>
    </TableCell>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  audits: AuditRecord[]
  onSelectAudit: (id: string) => void
}

export default function AuditWorklistPage({ audits, onSelectAudit }: Props) {
  const [activeTab, setActiveTab] = useState<AuditState>('NoticeReceived')
  const [sort, setSort] = useState<AuditSort>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<AuditFilters>({ auditType: [], payer: [], assignedTo: [] })
  const [colPopover, setColPopover] = useState<ColPopoverState | null>(null)
  const [optionalCols, setOptionalCols] = useState<string[]>([])
  const [addColAnchor, setAddColAnchor] = useState<HTMLElement | null>(null)

  const inState = useMemo(
    () => audits.filter(a => a.state === activeTab),
    [audits, activeTab]
  )

  const allAuditTypes = useMemo(() => [...new Set(inState.map(r => r.auditType))].sort(), [inState])
  const allPayers     = useMemo(() => [...new Set(inState.map(r => r.payer))].sort(), [inState])
  const allAssignees  = useMemo(() => [...new Set(inState.map(r => r.assignedTo?.name ?? 'Unassigned'))].sort(), [inState])

  const displayed = useMemo(() => {
    let rows = [...inState]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(r =>
        r.patient.name.toLowerCase().includes(q) ||
        r.claim.har.toLowerCase().includes(q) ||
        r.payer.toLowerCase().includes(q) ||
        r.auditType.toLowerCase().includes(q) ||
        (r.auditBody ?? '').toLowerCase().includes(q)
      )
    }

    if (filters.auditType.length > 0) rows = rows.filter(r => filters.auditType.includes(r.auditType))
    if (filters.payer.length > 0)     rows = rows.filter(r => filters.payer.includes(r.payer))
    if (filters.assignedTo.length > 0) {
      rows = rows.filter(r => filters.assignedTo.includes(r.assignedTo?.name ?? 'Unassigned'))
    }

    if (sort) {
      rows.sort((a, b) => {
        let cmp = 0
        if (sort.colId === 'patient')             cmp = formatPatientName(a.patient.name).localeCompare(formatPatientName(b.patient.name))
        else if (sort.colId === 'amountAtRisk')   cmp = a.amountAtRisk - b.amountAtRisk
        else if (sort.colId === 'proposedRecoupment') cmp = (a.proposedRecoupment ?? 0) - (b.proposedRecoupment ?? 0)
        else if (sort.colId === 'deadline')       cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }

    return rows
  }, [inState, sort, searchQuery, filters])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openColPopover(e: React.MouseEvent<HTMLElement>, colId: string) {
    setColPopover({ anchor: e.currentTarget, colId })
  }
  function closeColPopover() { setColPopover(null) }

  function handleSort(colId: SortCol, dir: SortDir) { setSort({ colId, dir }); closeColPopover() }
  function clearSort() { setSort(null); closeColPopover() }

  function toggleFilter(key: keyof AuditFilters, value: string) {
    setFilters(prev => {
      const current = prev[key]
      return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }
    })
  }

  function clearColumnFilter(key: keyof AuditFilters) {
    setFilters(prev => ({ ...prev, [key]: [] }))
    closeColPopover()
  }

  const activeFilters = {
    auditType:  filters.auditType.length > 0,
    payer:      filters.payer.length > 0,
    assignedTo: filters.assignedTo.length > 0,
  }

  const tabCount = (t: AuditState) => audits.filter(a => a.state === t).length
  const isClosed = activeTab === 'Closed'
  const showProposedRecoupment = activeTab === 'FindingsIssued' || activeTab === 'Disputed' || activeTab === 'Closed'

  // ── Popover content ─────────────────────────────────────────────────────────

  function renderPopoverContent() {
    if (!colPopover) return null
    const { colId } = colPopover
    const isSortable = ['patient', 'amountAtRisk', 'proposedRecoupment', 'deadline'].includes(colId)
    const filterKey: keyof AuditFilters | null =
      colId === 'auditType' ? 'auditType' :
      colId === 'payer' ? 'payer' :
      colId === 'assignedTo' ? 'assignedTo' : null
    const filterOptions =
      colId === 'auditType' ? allAuditTypes :
      colId === 'payer'     ? allPayers :
      colId === 'assignedTo' ? allAssignees : []
    const currentFilterValues = filterKey ? filters[filterKey] : []

    return (
      <Box sx={{ py: 0.5 }}>
        {isSortable && (
          <>
            <Box sx={{ px: 1.5, py: 0.75 }}>
              <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>
                Sort
              </Typography>
            </Box>
            <RadioGroup value={sort?.colId === colId ? sort.dir : ''}>
              {[
                { val: 'asc',  label: ['amountAtRisk', 'proposedRecoupment'].includes(colId) ? 'Low → High' : colId === 'deadline' ? 'Earliest first' : 'A → Z' },
                { val: 'desc', label: ['amountAtRisk', 'proposedRecoupment'].includes(colId) ? 'High → Low' : colId === 'deadline' ? 'Latest first' : 'Z → A' },
              ].map(opt => (
                <ListItemButton key={opt.val} dense onClick={() => handleSort(colId as SortCol, opt.val as SortDir)} sx={{ px: 1.5, py: 0.5 }}>
                  <FormControlLabel
                    value={opt.val}
                    control={<Radio size="small" sx={{ p: 0.5 }} />}
                    label={<Typography variant="body2">{opt.label}</Typography>}
                    sx={{ m: 0, gap: 1, pointerEvents: 'none' }}
                  />
                </ListItemButton>
              ))}
            </RadioGroup>
            {sort?.colId === colId && (
              <Box sx={{ px: 1.5, pb: 0.75 }}>
                <Button size="small" variant="text" onClick={clearSort} sx={{ fontSize: '0.75rem', p: 0, color: 'text.secondary' }}>
                  Clear sort
                </Button>
              </Box>
            )}
            {filterKey && <Divider sx={{ my: 0.5 }} />}
          </>
        )}

        {filterKey && (
          <>
            <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>
                Filter
              </Typography>
              {currentFilterValues.length > 0 && (
                <Button size="small" onClick={() => clearColumnFilter(filterKey)} sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'text.secondary' }}>
                  Clear
                </Button>
              )}
            </Box>
            <FormGroup sx={{ px: 1.5 }}>
              {filterOptions.map(val => (
                <FormControlLabel
                  key={val}
                  control={
                    <Checkbox
                      size="small"
                      checked={currentFilterValues.includes(val)}
                      onChange={() => toggleFilter(filterKey, val)}
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={<Typography variant="body2">{val}</Typography>}
                  sx={{ mb: 0.25, gap: 0.5 }}
                />
              ))}
            </FormGroup>
            <Box sx={{ height: 8 }} />
          </>
        )}
      </Box>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* State tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setFilters({ auditType: [], payer: [], assignedTo: [] }) }}
          sx={{
            minHeight: 40,
            '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' },
            '& .MuiTab-root': {
              minHeight: 40, py: 0, px: 2,
              fontSize: '0.8125rem', fontWeight: 500,
              textTransform: 'none', letterSpacing: 0,
            },
          }}
        >
          {TABS.map(tab => {
            const count = tabCount(tab)
            return (
              <Tab
                key={tab}
                value={tab}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <span>{TAB_LABELS[tab]}</span>
                    {count > 0 && (
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 16, fontSize: '0.6875rem', fontWeight: 600,
                          '& .MuiChip-label': { px: 0.75 },
                          bgcolor: activeTab === tab ? STATE_COLORS[tab].bg : undefined,
                          color: activeTab === tab ? STATE_COLORS[tab].color : undefined,
                        }}
                      />
                    )}
                  </Box>
                }
              />
            )
          })}
        </Tabs>
      </Box>

      {/* Search bar */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search by patient, HAR, payer, audit type, auditor…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                  <CloseOutlined sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{ width: 420, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.625 } }}
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ width: '100%', minWidth: 1100, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <ColHeader label="Patient / HAR" colId="patient"    sortable   activeSort={sort} hasFilter={false}                  onOpen={openColPopover} width={170} />
              <ColHeader label="Audit Type"    colId="auditType"  filterable activeSort={sort} hasFilter={activeFilters.auditType} onOpen={openColPopover} width={115} />
              <ColHeader label="Payer"         colId="payer"      filterable activeSort={sort} hasFilter={activeFilters.payer}     onOpen={openColPopover} width={160} />
              <ColHeader label="Auditor"       colId="auditor"               activeSort={sort} hasFilter={false}                  onOpen={openColPopover} width={150} />
              <ColHeader label="DOS"           colId="dos"                   activeSort={sort} hasFilter={false}                  onOpen={openColPopover} width={100} />
              <ColHeader label="At Risk"       colId="amountAtRisk" sortable activeSort={sort} hasFilter={false}                  onOpen={openColPopover} align="right" width={100} />
              {showProposedRecoupment && (
                <ColHeader label={isClosed ? 'Recovered' : 'Proposed Recoup.'} colId="proposedRecoupment" sortable activeSort={sort} hasFilter={false} onOpen={openColPopover} align="right" width={130} />
              )}
              <ColHeader label="Status"        colId="status"                activeSort={sort} hasFilter={false}                  onOpen={openColPopover} width={210} />
              <ColHeader label="Deadline"      colId="deadline"   sortable   activeSort={sort} hasFilter={false}                  onOpen={openColPopover} width={105} />
              <ColHeader label="Assigned To"   colId="assignedTo" filterable activeSort={sort} hasFilter={activeFilters.assignedTo} onOpen={openColPopover} width={140} />
              {optionalCols.includes('lineOfBusiness') && (
                <ColHeader label="Line of Business" colId="lineOfBusiness" activeSort={sort} hasFilter={false} onOpen={openColPopover} width={145} />
              )}
              <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                <Tooltip title="Add column" placement="top">
                  <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                    <AddOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  <Typography variant="body2">No audit cases in this stage.</Typography>
                </TableCell>
              </TableRow>
            ) : displayed.map(record => {
              const typeColors = AUDIT_TYPE_COLORS[record.auditType] ?? AUDIT_TYPE_COLORS['Internal']!
              const days = daysUntil(record.deadline)
              const stateColors = STATE_COLORS[record.state]

              return (
                <TableRow
                  key={record.id}
                  hover
                  onClick={() => onSelectAudit(record.id)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${typeColors.color}`,
                    '& td:first-of-type': { pl: '12px' },
                  }}
                >
                  {/* Patient / HAR */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{formatPatientName(record.patient.name)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' }}>{record.claim.har}</Typography>
                  </TableCell>

                  {/* Audit Type */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={record.auditType}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.6875rem', fontWeight: 700,
                        bgcolor: typeColors.bg, color: typeColors.color,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </TableCell>

                  {/* Payer */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" noWrap>{record.payer}</Typography>
                  </TableCell>

                  {/* Auditor */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" noWrap sx={{ color: record.auditBody ? 'text.primary' : 'text.disabled', fontStyle: record.auditBody ? 'normal' : 'italic' }}>
                      {record.auditBody ?? '—'}
                    </Typography>
                  </TableCell>

                  {/* DOS */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem' }}>
                      {formatDate(record.dos)}
                    </Typography>
                  </TableCell>

                  {/* At Risk */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'error.dark' }}>
                      {formatCurrency(record.amountAtRisk)}
                    </Typography>
                  </TableCell>

                  {/* Proposed Recoupment / Recovered */}
                  {showProposedRecoupment && (
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      {isClosed ? (
                        record.recoveredAmount != null ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'success.dark' }}>
                            {formatCurrency(record.recoveredAmount)}
                          </Typography>
                        ) : record.settledAmount != null ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'warning.dark' }}>
                            {formatCurrency(record.settledAmount)} settled
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                        )
                      ) : record.proposedRecoupment != null ? (
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'error.main' }}>
                          {formatCurrency(record.proposedRecoupment)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                  )}

                  {/* Status */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={record.status}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.6875rem', fontWeight: 500,
                        bgcolor: stateColors.bg, color: stateColors.color,
                        '& .MuiChip-label': { px: 1 },
                        maxWidth: '100%',
                      }}
                    />
                  </TableCell>

                  {/* Deadline */}
                  <TableCell sx={{ py: 1.25 }}>
                    {record.state === 'Closed' ? (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem', color: deadlineColor(days), fontWeight: days <= 7 ? 600 : 400 }}>
                          {formatDate(record.deadline)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: deadlineColor(days) }}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell sx={{ py: 1.25 }}>
                    {record.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: '#C2410C20', color: '#C2410C' }}>
                          {record.assignedTo.initials}
                        </Avatar>
                        <Typography variant="body2" noWrap>{record.assignedTo.name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Typography>
                    )}
                  </TableCell>

                  {/* Optional cols */}
                  {optionalCols.includes('lineOfBusiness') && (
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>{record.lineOfBusiness ?? '—'}</Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ py: 1.25 }} />
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom bar */}
      <Box sx={{ px: 3, py: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', flexShrink: 0 }}>
        {activeFilters.auditType && (
          <Chip size="small" label={`Audit Type: ${filters.auditType.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, auditType: [] }))} />
        )}
        {activeFilters.payer && (
          <Chip size="small" label={`Payer: ${filters.payer.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, payer: [] }))} />
        )}
        {activeFilters.assignedTo && (
          <Chip size="small" label={`Assigned: ${filters.assignedTo.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, assignedTo: [] }))} />
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {displayed.length} of {inState.length} case{inState.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Column filter popover */}
      <Popover
        open={Boolean(colPopover)}
        anchorEl={colPopover?.anchor}
        onClose={closeColPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, mt: 0.5, minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } } }}
      >
        {renderPopoverContent()}
      </Popover>

      {/* Add Column popover */}
      <Popover
        open={Boolean(addColAnchor)}
        anchorEl={addColAnchor}
        onClose={() => setAddColAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 1.5 } } }}
      >
        <Box sx={{ py: 1 }}>
          <Box sx={{ px: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ViewColumnOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>
              Add Column
            </Typography>
          </Box>
          <Divider sx={{ mb: 0.5 }} />
          <FormGroup sx={{ px: 1.5 }}>
            {AUDIT_OPTIONAL_COLS.map(col => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    size="small"
                    checked={optionalCols.includes(col.id)}
                    onChange={() => setOptionalCols(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])}
                    sx={{ p: 0.5 }}
                  />
                }
                label={<Typography variant="body2">{col.label}</Typography>}
                sx={{ mb: 0.25, gap: 0.5 }}
              />
            ))}
          </FormGroup>
          <Box sx={{ height: 6 }} />
        </Box>
      </Popover>

    </Box>
  )
}
