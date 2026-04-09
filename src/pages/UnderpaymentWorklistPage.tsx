import { useState, useMemo } from 'react'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Avatar, Tabs, Tab, TextField, InputAdornment,
  IconButton, Popover, RadioGroup, FormControlLabel, Radio, FormGroup,
  Checkbox, Divider, Button, ListItemButton,
} from '@mui/material'
import {
  ArrowUpward, ArrowDownward, SwapVert, FilterList,
  SearchOutlined, CloseOutlined,
} from '@mui/icons-material'
import {
  SEED_UNDERPAYMENTS,
  type UnderpaymentRecord,
  type UnderpaymentState,
} from '../data/underpayments'
import { getCategoryConfig } from '../data/underpaymentCategoryConfig'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type SortCol = 'patient' | 'varianceAmount' | 'billedAmount' | 'paidAmount' | 'deadline'
type UPSort = { colId: SortCol; dir: SortDir } | null

interface UPFilters {
  category: string[]
  subtype: string[]
  assignedTo: string[]
}

interface ColPopoverState {
  anchor: HTMLElement
  colId: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: UnderpaymentState[] = ['Active', 'Submitted', 'Won', 'Recovered', 'Closed', 'Archived']

const STATE_COLORS: Partial<Record<UnderpaymentState, { bg: string; color: string }>> = {
  Active:    { bg: '#EBF4FF', color: '#2C5282' },
  Submitted: { bg: '#E6FFFA', color: '#276749' },
  Won:       { bg: '#F0FFF4', color: '#22543D' },
  Recovered: { bg: '#DCFCE7', color: '#14532D' },
  Closed:    { bg: '#F7FAFC', color: '#718096' },
  Archived:  { bg: '#F3F0FF', color: '#6B46C1' },
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
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

// ── Column Header ─────────────────────────────────────────────────────────────

interface ColHeaderProps {
  label: string
  colId: string
  sortable?: boolean
  filterable?: boolean
  activeSort: UPSort
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
        bgcolor: hasFilter ? 'rgba(27,58,92,0.05)' : undefined,
        borderBottom: hasFilter ? '2px solid' : undefined,
        borderBottomColor: hasFilter ? 'primary.main' : undefined,
        '&:hover': isInteractive ? { bgcolor: hasFilter ? 'rgba(27,58,92,0.08)' : 'rgba(27,58,92,0.04)' } : undefined,
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
  onSelectUnderpayment: (id: string) => void
}

export default function UnderpaymentWorklistPage({ onSelectUnderpayment }: Props) {
  const [activeTab, setActiveTab] = useState<UnderpaymentState>('Active')
  const [sort, setSort] = useState<UPSort>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<UPFilters>({ category: [], subtype: [], assignedTo: [] })
  const [colPopover, setColPopover] = useState<ColPopoverState | null>(null)

  const inState = useMemo(
    () => SEED_UNDERPAYMENTS.filter(u => u.state === activeTab),
    [activeTab]
  )

  // Derived filter options from the current tab's records
  const allCategories  = useMemo(() => [...new Set(inState.map(r => r.category))].sort(), [inState])
  const allSubtypes    = useMemo(() => [...new Set(inState.map(r => r.subtype))].sort(), [inState])
  const allAssignees   = useMemo(() => [...new Set(inState.map(r => r.assignedTo?.name ?? 'Unassigned'))].sort(), [inState])

  const displayed = useMemo(() => {
    let rows = [...inState]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(r =>
        r.patient.name.toLowerCase().includes(q) ||
        r.claim.har.toLowerCase().includes(q) ||
        r.payer.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.subtype.toLowerCase().includes(q)
      )
    }

    if (filters.category.length > 0) {
      rows = rows.filter(r => filters.category.includes(r.category))
    }
    if (filters.subtype.length > 0) {
      rows = rows.filter(r => filters.subtype.includes(r.subtype))
    }
    if (filters.assignedTo.length > 0) {
      rows = rows.filter(r => filters.assignedTo.includes(r.assignedTo?.name ?? 'Unassigned'))
    }

    if (sort) {
      rows.sort((a, b) => {
        let cmp = 0
        if (sort.colId === 'patient')            cmp = a.patient.name.localeCompare(b.patient.name)
        else if (sort.colId === 'varianceAmount') cmp = a.varianceAmount - b.varianceAmount
        else if (sort.colId === 'billedAmount')   cmp = a.billedAmount - b.billedAmount
        else if (sort.colId === 'paidAmount')     cmp = a.paidAmount - b.paidAmount
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

  function toggleFilter(key: keyof UPFilters, value: string) {
    setFilters(prev => {
      const current = prev[key]
      return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }
    })
  }

  function clearColumnFilter(key: keyof UPFilters) {
    setFilters(prev => ({ ...prev, [key]: [] }))
    closeColPopover()
  }

  const activeFilters = {
    category:   filters.category.length > 0,
    subtype:    filters.subtype.length > 0,
    assignedTo: filters.assignedTo.length > 0,
  }

  const tabCount = (t: UnderpaymentState) => SEED_UNDERPAYMENTS.filter(u => u.state === t).length
  const isTerminal = (s: UnderpaymentState) => s === 'Won' || s === 'Recovered' || s === 'Closed' || s === 'Archived'

  // ── Popover content ─────────────────────────────────────────────────────────

  function renderPopoverContent() {
    if (!colPopover) return null
    const { colId } = colPopover
    const isSortable = ['patient', 'varianceAmount', 'billedAmount', 'paidAmount', 'deadline'].includes(colId)
    const filterKey: keyof UPFilters | null =
      colId === 'category' ? 'category' :
      colId === 'subtype' ? 'subtype' :
      colId === 'assignedTo' ? 'assignedTo' : null
    const filterOptions =
      colId === 'category' ? allCategories :
      colId === 'subtype' ? allSubtypes :
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
                { val: 'asc',  label: ['varianceAmount', 'billedAmount', 'paidAmount'].includes(colId) ? 'Low → High' : colId === 'deadline' ? 'Earliest first' : 'A → Z' },
                { val: 'desc', label: ['varianceAmount', 'billedAmount', 'paidAmount'].includes(colId) ? 'High → Low' : colId === 'deadline' ? 'Latest first' : 'Z → A' },
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
          onChange={(_, v) => { setActiveTab(v); setFilters({ category: [], subtype: [], assignedTo: [] }) }}
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
          {TABS.map(tab => (
            <Tab
              key={tab}
              value={tab}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>{tab}</span>
                  <Chip
                    label={tabCount(tab)}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Search bar */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search by patient, HAR, payer, category…"
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
          sx={{ width: 380, '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.625 } }}
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ width: '100%', minWidth: 1060, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <ColHeader label="Patient"    colId="patient"        sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={155} />
              <ColHeader label="HAR"        colId="har"                       activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={105} />
              <ColHeader label="Payer"      colId="payer"                     activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={140} />
              <ColHeader label="Category"   colId="category"       filterable activeSort={sort} hasFilter={activeFilters.category}  onOpen={openColPopover} width={190} />
              <ColHeader label="Subtype"    colId="subtype"        filterable activeSort={sort} hasFilter={activeFilters.subtype}   onOpen={openColPopover} width={190} />
              <ColHeader label="Billed"     colId="billedAmount"   sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={90} />
              <ColHeader label="Paid"       colId="paidAmount"     sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={90} />
              <ColHeader label="Variance"   colId="varianceAmount" sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={100} />
              {isTerminal(activeTab) && (
                <ColHeader label="Recovered" colId="recoveredAmount"          activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={100} />
              )}
              <ColHeader label="Assigned To" colId="assignedTo"   filterable activeSort={sort} hasFilter={activeFilters.assignedTo} onOpen={openColPopover} width={135} />
            </TableRow>
          </TableHead>

          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  <Typography variant="body2">No underpayments match the current filters.</Typography>
                </TableCell>
              </TableRow>
            ) : displayed.map(record => {
              const catConfig = getCategoryConfig(record.category)

              return (
                <TableRow
                  key={record.id}
                  hover
                  onClick={() => onSelectUnderpayment(record.id)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${catConfig.color}`,
                    '& td:first-of-type': { pl: '12px' },
                  }}
                >
                  {/* Patient */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{record.patient.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{record.patient.mrn}</Typography>
                  </TableCell>

                  {/* HAR */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{record.claim.har}</Typography>
                  </TableCell>

                  {/* Payer */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" noWrap>{record.payer}</Typography>
                    {record.lineOfBusiness && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{record.lineOfBusiness}</Typography>
                    )}
                  </TableCell>

                  {/* Category */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: 1, bgcolor: catConfig.bg, flexShrink: 0,
                      }}>
                        <catConfig.Icon sx={{ fontSize: 14, color: catConfig.color }} />
                      </Box>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3, color: catConfig.color }}>
                        {record.category}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Subtype */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>{record.subtype}</Typography>
                  </TableCell>

                  {/* Billed */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {formatCurrency(record.billedAmount)}
                    </Typography>
                  </TableCell>

                  {/* Paid */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {formatCurrency(record.paidAmount)}
                    </Typography>
                  </TableCell>

                  {/* Variance */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'error.dark' }}>
                      {formatCurrency(record.varianceAmount)}
                    </Typography>
                  </TableCell>

                  {/* Recovered — terminal tabs only */}
                  {isTerminal(activeTab) && (
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      {record.recoveredAmount !== undefined ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'success.dark' }}>
                          {formatCurrency(record.recoveredAmount)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                  )}

                  {/* Assigned To */}
                  <TableCell sx={{ py: 1.25 }}>
                    {record.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: 'primary.light' }}>
                          {record.assignedTo.initials}
                        </Avatar>
                        <Typography variant="body2">{record.assignedTo.name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Typography>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom bar */}
      <Box sx={{ px: 3, py: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', flexShrink: 0 }}>
        {activeFilters.category && (
          <Chip size="small" label={`Category: ${filters.category.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, category: [] }))} />
        )}
        {activeFilters.subtype && (
          <Chip size="small" label={`Subtype: ${filters.subtype.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, subtype: [] }))} />
        )}
        {activeFilters.assignedTo && (
          <Chip size="small" label={`Assigned: ${filters.assignedTo.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, assignedTo: [] }))} />
        )}

        <Box sx={{ flex: 1 }} />

        {displayed.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Total variance: <strong style={{ color: '#991B1B' }}>
              {formatCurrency(displayed.reduce((s, r) => s + r.varianceAmount, 0))}
            </strong>
          </Typography>
        )}
        {activeTab === 'Recovered' && displayed.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary">·</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Recovered: <strong style={{ color: '#14532D' }}>
                {formatCurrency(displayed.reduce((s, r) => s + (r.recoveredAmount ?? 0), 0))}
              </strong>
            </Typography>
          </>
        )}

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {displayed.length} of {inState.length}
        </Typography>
      </Box>

      {/* ── Column Popover ──────────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(colPopover)}
        anchorEl={colPopover?.anchor}
        onClose={closeColPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 1.5 } } }}
      >
        {renderPopoverContent()}
      </Popover>

    </Box>
  )
}
