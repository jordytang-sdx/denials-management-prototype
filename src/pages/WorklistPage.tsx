import { useState, useMemo, useRef } from 'react'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Avatar, IconButton, Tooltip, Popover,
  ListItemButton, ListItemText, ListItemAvatar, Checkbox,
  Divider, RadioGroup, FormControlLabel, Radio, TextField,
  Button, FormGroup, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, InputAdornment,
} from '@mui/material'
import {
  WarningAmberOutlined,
  EditOutlined,
  ArrowUpward,
  ArrowDownward,
  FilterList,
  SwapVert,
  CalendarMonthOutlined,
  NoteAltOutlined,
  StickyNote2Outlined,
  TrendingUpOutlined,
  AccessTimeOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@mui/icons-material'
import { TEAM_MEMBERS, type DenialRecord, type TeamMember, type DenialState } from '../data/denials'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc'
export type SortCol = 'patient' | 'deniedAmount' | 'deadline'
export type WorklistSort = { colId: SortCol; dir: SortDir } | null
export type WorklistActiveTab = DenialState

export interface WorklistFilters {
  payer: string[]
  denialType: string[]
  assignedTo: string[]
  status: string[]
  needsAttentionOnly: boolean
}

export const DEFAULT_WORKLIST_FILTERS: WorklistFilters = {
  payer: [], denialType: [], assignedTo: [], status: [], needsAttentionOnly: false,
}

interface ColPopoverState {
  anchor: HTMLElement
  colId: string
}

interface InlinePopoverState {
  anchor: HTMLElement
  denialId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: WorklistActiveTab[] = ['Intake', 'Active', 'Submitted', 'Resolved', 'Closed', 'Archived']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - TODAY.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

// ─── State colors ─────────────────────────────────────────────────────────────

const STATE_COLORS: Record<DenialState, { bg: string; color: string }> = {
  Intake:    { bg: '#EDF2F7', color: '#4A5568' },
  Active:    { bg: '#EBF4FF', color: '#2C5282' },
  Submitted: { bg: '#E6FFFA', color: '#276749' },
  Resolved:  { bg: '#F0FFF4', color: '#22543D' },
  Closed:    { bg: '#F7FAFC', color: '#718096' },
  Archived:  { bg: '#F3F0FF', color: '#6B46C1' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeadlineCells({ days, dateStr }: { days: number; dateStr: string }) {
  const urgency = days < 0 ? 'error' : days <= 7 ? 'warning' : 'text.secondary'
  const label = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {formatDate(dateStr)}
      </Typography>
      <Typography variant="caption" sx={{ color: urgency === 'text.secondary' ? 'text.secondary' : urgency + '.main' }}>
        {label}
      </Typography>
    </>
  )
}

function AssigneeDisplay({ member }: { member: TeamMember | null }) {
  if (!member) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        Unassigned
      </Typography>
    )
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: 'primary.light' }}>
        {member.initials}
      </Avatar>
      <Typography variant="body2">{member.name}</Typography>
    </Box>
  )
}

// ─── Column Header ────────────────────────────────────────────────────────────

interface ColHeaderProps {
  label: string
  colId: string
  sortable?: boolean
  filterable?: boolean
  activeSort: { colId: string; dir: SortDir } | null
  hasFilter: boolean
  onOpen: (e: React.MouseEvent<HTMLElement>, colId: string) => void
  align?: 'left' | 'right'
  width?: number | string
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface WorklistPageProps {
  denials: DenialRecord[]
  onDenialsChange: React.Dispatch<React.SetStateAction<DenialRecord[]>>
  onSelectDenial: (id: string) => void
  activeTab: WorklistActiveTab
  onActiveTabChange: (tab: WorklistActiveTab) => void
  sort: WorklistSort
  onSortChange: (sort: WorklistSort) => void
  filters: WorklistFilters
  onFiltersChange: (filters: WorklistFilters) => void
}

export default function WorklistPage({ denials, onDenialsChange: setDenials, onSelectDenial, activeTab: activeState, onActiveTabChange: setActiveState, sort, onSortChange: setSort, filters, onFiltersChange: setFilters }: WorklistPageProps) {

  // Column popover
  const [colPopover, setColPopover] = useState<ColPopoverState | null>(null)

  // Inline edit popovers
  const [assigneePopover, setAssigneePopover] = useState<InlinePopoverState | null>(null)
  const [deadlinePopover, setDeadlinePopover] = useState<InlinePopoverState | null>(null)
  const deadlineDraftRef = useRef<string>('')

  // Notes modal
  const [notesModal, setNotesModal] = useState<{ denialId: string; draft: string } | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // ── State tab handler ───────────────────────────────────────────────────────

  function handleStateChange(_: React.SyntheticEvent, newState: WorklistActiveTab) {
    setActiveState(newState)
    setFilters(prev => ({ ...prev, status: [] }))
  }

  // ── Derived filter options ──────────────────────────────────────────────────

  const inState = useMemo(() =>
    denials.filter(d => d.state === activeState),
  [denials, activeState])

  const allPayers      = useMemo(() => [...new Set(inState.map(d => d.payer))].sort(), [inState])
  const allDenialTypes = useMemo(() => [...new Set(inState.map(d => d.denialType))].sort(), [inState])
  const allAssignees   = useMemo(() => {
    const names = inState.map(d => d.assignedTo?.name ?? 'Unassigned')
    return [...new Set(names)].sort()
  }, [inState])
  const allStatuses    = useMemo(() => [...new Set(inState.map(d => d.status))].sort(), [inState])

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let rows = [...inState]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(r =>
        r.patient.name.toLowerCase().includes(q) ||
        r.claimId.toLowerCase().includes(q) ||
        r.payer.toLowerCase().includes(q) ||
        r.denialType.toLowerCase().includes(q)
      )
    }

    if (filters.status.length > 0) {
      rows = rows.filter(r => filters.status.includes(r.status))
    }
    if (filters.needsAttentionOnly) {
      rows = rows.filter(r => r.needsAttention)
    }
    if (filters.payer.length > 0) {
      rows = rows.filter(r => filters.payer.includes(r.payer))
    }
    if (filters.denialType.length > 0) {
      rows = rows.filter(r => filters.denialType.includes(r.denialType))
    }
    if (filters.assignedTo.length > 0) {
      rows = rows.filter(r => filters.assignedTo.includes(r.assignedTo?.name ?? 'Unassigned'))
    }

    if (sort) {
      rows.sort((a, b) => {
        let cmp = 0
        if (sort.colId === 'patient')      cmp = a.patient.name.localeCompare(b.patient.name)
        else if (sort.colId === 'deniedAmount') cmp = a.deniedAmount - b.deniedAmount
        else if (sort.colId === 'deadline')    cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }

    return rows
  }, [inState, filters, sort, searchQuery])


  // ── Column popover handlers ─────────────────────────────────────────────────

  function openColPopover(e: React.MouseEvent<HTMLElement>, colId: string) {
    setColPopover({ anchor: e.currentTarget, colId })
  }
  function closeColPopover() { setColPopover(null) }

  function handleSort(colId: SortCol, dir: SortDir) { setSort({ colId, dir }); closeColPopover() }
  function clearSort() { setSort(null); closeColPopover() }

  function toggleFilterValue(key: keyof Pick<Filters, 'payer' | 'denialType' | 'assignedTo'>, value: string) {
    setFilters(prev => {
      const current = prev[key]
      return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }
    })
  }

  function clearColumnFilter(key: keyof Pick<Filters, 'payer' | 'denialType' | 'assignedTo'>) {
    setFilters(prev => ({ ...prev, [key]: [] }))
    closeColPopover()
  }

  // ── Inline edit handlers ────────────────────────────────────────────────────

  function handleAssigneeChange(denialId: string, member: TeamMember | null) {
    setDenials(prev => prev.map(d => d.id === denialId ? { ...d, assignedTo: member } : d))
    setAssigneePopover(null)
  }

  function handleSaveNotes(denialId: string, notes: string) {
    setDenials(prev => prev.map(d => d.id === denialId ? { ...d, notes } : d))
    setNotesModal(null)
  }

  function handleDeadlineChange(denialId: string, newDate: string) {
    setDenials(prev => prev.map(d => d.id === denialId ? { ...d, deadline: newDate } : d))
    setDeadlinePopover(null)
  }

  // ── Active filter flags ─────────────────────────────────────────────────────

  const activeFilters = {
    payer:          filters.payer.length > 0,
    denialType:     filters.denialType.length > 0,
    assignedTo:     filters.assignedTo.length > 0,
    status:         filters.status.length > 0,
    needsAttention: filters.needsAttentionOnly,
  }

  const tabCount = (t: WorklistActiveTab) => denials.filter(d => d.state === t).length

  // ── Summary strip metrics ───────────────────────────────────────────────────

  const summaryMetrics = useMemo(() => {
    const open = denials.filter(d => d.state === 'Intake' || d.state === 'Active' || d.state === 'Submitted')
    const atRisk = open.reduce((sum, d) => sum + d.deniedAmount, 0)
    const overdue = open.filter(d => daysUntil(d.deadline) < 0).length
    const dueThisWeek = open.filter(d => { const days = daysUntil(d.deadline); return days >= 0 && days <= 7 }).length
    const attention = open.filter(d => d.needsAttention).length
    const resolvedCount = denials.filter(d => d.state === 'Resolved' || d.state === 'Closed').length
    return { atRisk, overdue, dueThisWeek, attention, resolvedCount }
  }, [denials])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header: title + KPI tiles ──────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'stretch',
        bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
        flexShrink: 0, minHeight: 60,
      }}>
        {/* KPI tiles */}
        {[
          {
            label: 'At Risk',
            value: formatCurrency(summaryMetrics.atRisk),
            sub: 'open denials',
            icon: <TrendingUpOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />,
            highlight: false,
          },
          {
            label: 'Overdue',
            value: String(summaryMetrics.overdue),
            sub: 'past deadline',
            icon: <AccessTimeOutlined sx={{ fontSize: 13, color: summaryMetrics.overdue > 0 ? 'error.main' : 'text.disabled' }} />,
            highlight: summaryMetrics.overdue > 0,
            highlightColor: 'error.main',
          },
          {
            label: 'Due This Week',
            value: String(summaryMetrics.dueThisWeek),
            sub: 'within 7 days',
            icon: <CalendarMonthOutlined sx={{ fontSize: 13, color: summaryMetrics.dueThisWeek > 0 ? 'warning.main' : 'text.disabled' }} />,
            highlight: summaryMetrics.dueThisWeek > 0,
            highlightColor: 'warning.main',
          },
          {
            label: 'Needs Attention',
            value: String(summaryMetrics.attention),
            sub: 'flagged items',
            icon: <WarningAmberOutlined sx={{ fontSize: 13, color: summaryMetrics.attention > 0 ? 'warning.main' : 'text.disabled' }} />,
            highlight: summaryMetrics.attention > 0,
            highlightColor: 'warning.main',
          },
          {
            label: 'Resolved / Closed',
            value: String(summaryMetrics.resolvedCount),
            sub: 'this period',
            icon: <TrendingUpOutlined sx={{ fontSize: 13, color: 'success.main' }} />,
            highlight: false,
          },
        ].map((tile, i, arr) => (
          <Box
            key={tile.label}
            sx={{
              flex: i === 0 ? '1.4 1 0' : '1 1 0',
              px: 2, py: 1,
              borderRight: i < arr.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.125,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {tile.icon}
              <Typography variant="overline" sx={{ fontSize: '0.575rem', color: 'text.secondary', letterSpacing: '0.07em', lineHeight: 1 }}>
                {tile.label}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.2,
                color: tile.highlight ? (tile as { highlightColor?: string }).highlightColor : 'text.primary',
              }}
            >
              {tile.value}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
              {tile.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* State tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>

        {/* Primary state tabs */}
        <Tabs
          value={activeState}
          onChange={handleStateChange}
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

      {/* Search toolbar */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search by patient, claim ID, payer, or denial type…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
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
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <ColHeader label="Patient"       colId="patient"      sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={148} />
              <ColHeader label="Claim ID"      colId="claimId"                 activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={126} />
              <ColHeader label="Payer"         colId="payer"        filterable activeSort={sort} hasFilter={activeFilters.payer}      onOpen={openColPopover} />
              <ColHeader label="Denial Type"   colId="denialType"   filterable activeSort={sort} hasFilter={activeFilters.denialType} onOpen={openColPopover} />
              <ColHeader label="Denied Amount" colId="deniedAmount" sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={132} align="right" />
              <ColHeader label="Deadline"      colId="deadline"     sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={132} />
              <ColHeader label="Status"        colId="status"       filterable activeSort={sort} hasFilter={activeFilters.status}    onOpen={openColPopover} width={168} />
              <ColHeader label="Assigned To"   colId="assignedTo"   filterable activeSort={sort} hasFilter={activeFilters.assignedTo} onOpen={openColPopover} width={134} />
              <ColHeader label="Notes"         colId="notes"                   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={58}  align="right" />
              {/* Attention toggle — icon only */}
              <TableCell
                align="center"
                sx={{
                  width: 44, py: 1.25,
                  bgcolor: activeFilters.needsAttention ? 'rgba(183,119,13,0.07)' : undefined,
                  borderBottom: activeFilters.needsAttention ? '2px solid' : undefined,
                  borderBottomColor: activeFilters.needsAttention ? 'warning.main' : undefined,
                }}
              >
                <Tooltip title={activeFilters.needsAttention ? 'Showing flagged only — click to clear' : 'Show flagged only'} placement="left">
                  <IconButton
                    size="small"
                    onClick={() => setFilters(prev => ({ ...prev, needsAttentionOnly: !prev.needsAttentionOnly }))}
                    sx={{
                      p: 0.25,
                      color: activeFilters.needsAttention ? 'warning.main' : 'text.disabled',
                      opacity: activeFilters.needsAttention ? 1 : 0.45,
                      '&:hover': { opacity: 1, color: 'warning.main', bgcolor: 'transparent' },
                    }}
                  >
                    <WarningAmberOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ py: 6, textAlign: 'center', color: 'text.disabled', border: 'none' }}>
                  <Typography variant="body2">No denials match the current filters.</Typography>
                </TableCell>
              </TableRow>
            ) : displayed.map(denial => {
              const days = daysUntil(denial.deadline)
              const stateStyle = STATE_COLORS[denial.state]

              return (
                <TableRow
                  key={denial.id}
                  hover
                  onClick={() => onSelectDenial(denial.id)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: denial.needsAttention ? '3px solid' : '3px solid transparent',
                    borderLeftColor: denial.needsAttention ? 'warning.main' : 'transparent',
                    '& td:first-of-type': { pl: denial.needsAttention ? '13px' : '16px' },
                  }}
                >
                  {/* Patient */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                      {denial.patient.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {denial.patient.mrn}
                    </Typography>
                  </TableCell>

                  {/* Claim ID + HAR */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {denial.claim.claimId}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                      {denial.claim.har}
                    </Typography>
                  </TableCell>

                  {/* Payer */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2">{denial.payer}</Typography>
                  </TableCell>

                  {/* Denial Type / Subtype */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                      {denial.denialType}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {denial.denialSubtype}
                    </Typography>
                  </TableCell>

                  {/* Denied Amount */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(denial.deniedAmount)}
                    </Typography>
                  </TableCell>

                  {/* Deadline */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      onClick={e => {
                        e.stopPropagation()
                        deadlineDraftRef.current = denial.deadline
                        setDeadlinePopover({ anchor: e.currentTarget, denialId: denial.id })
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <DeadlineCells days={days} dateStr={denial.deadline} />
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, p: 0.25, color: 'text.secondary' }}
                        onClick={e => {
                          e.stopPropagation()
                          deadlineDraftRef.current = denial.deadline
                          setDeadlinePopover({ anchor: e.currentTarget, denialId: denial.id })
                        }}
                      >
                        <CalendarMonthOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  </TableCell>

                  {/* Status */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={denial.status}
                      size="small"
                      sx={{
                        bgcolor: stateStyle.bg,
                        color: stateStyle.color,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 20,
                        border: 'none',
                      }}
                    />
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell sx={{ py: 1.25 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      onClick={e => {
                        e.stopPropagation()
                        setAssigneePopover({ anchor: e.currentTarget, denialId: denial.id })
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <AssigneeDisplay member={denial.assignedTo} />
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, p: 0.25, color: 'text.secondary' }}
                        onClick={e => {
                          e.stopPropagation()
                          setAssigneePopover({ anchor: e.currentTarget, denialId: denial.id })
                        }}
                      >
                        <EditOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  </TableCell>

                  {/* Notes */}
                  <TableCell align="right" sx={{ py: 1.25 }}>
                    <Tooltip title={denial.notes || 'Add a note'} placement="left" arrow>
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation()
                          setNotesModal({ denialId: denial.id, draft: denial.notes })
                        }}
                        sx={{ color: denial.notes ? 'secondary.main' : 'text.disabled' }}
                      >
                        {denial.notes
                          ? <StickyNote2Outlined sx={{ fontSize: 18 }} />
                          : <NoteAltOutlined sx={{ fontSize: 18 }} />
                        }
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  {/* Needs Attention */}
                  <TableCell align="center" sx={{ py: 1.25 }}>
                    {denial.needsAttention && (
                      <Tooltip
                        title={
                          <Box>
                            {denial.needsAttentionReasons.map((r, i) => (
                              <Typography key={i} variant="caption" sx={{ display: 'block' }}>• {r}</Typography>
                            ))}
                          </Box>
                        }
                        placement="left"
                        arrow
                      >
                        <WarningAmberOutlined sx={{ fontSize: 18, color: 'warning.main', display: 'block', ml: 'auto' }} />
                      </Tooltip>
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
        {activeFilters.payer && (
          <Chip size="small" label={`Payer: ${filters.payer.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, payer: [] }))} />
        )}
        {activeFilters.denialType && (
          <Chip size="small" label={`Type: ${filters.denialType.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, denialType: [] }))} />
        )}
        {activeFilters.assignedTo && (
          <Chip size="small" label={`Assigned: ${filters.assignedTo.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, assignedTo: [] }))} />
        )}
        {activeFilters.needsAttention && (
          <Chip size="small" icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />} label="Needs Attention" color="warning" onDelete={() => setFilters(p => ({ ...p, needsAttentionOnly: false }))} />
        )}

        <Box sx={{ flex: 1 }} />

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {displayed.length} of {inState.length}
        </Typography>
      </Box>

      {/* ── Column Popover ─────────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(colPopover)}
        anchorEl={colPopover?.anchor}
        onClose={closeColPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 1.5 } } }}
      >
        {colPopover && (() => {
          const { colId } = colPopover
          const isSortable = ['patient', 'deniedAmount', 'deadline'].includes(colId)
          const filterKey = colId === 'payer' ? 'payer' : colId === 'denialType' ? 'denialType' : colId === 'assignedTo' ? 'assignedTo' : colId === 'status' ? 'status' : null
          const filterOptions = colId === 'payer' ? allPayers : colId === 'denialType' ? allDenialTypes : colId === 'assignedTo' ? allAssignees : colId === 'status' ? allStatuses : []
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
                    {[{ val: 'asc', label: colId === 'deniedAmount' ? 'Low → High' : colId === 'deadline' ? 'Earliest first' : 'A → Z' },
                      { val: 'desc', label: colId === 'deniedAmount' ? 'High → Low' : colId === 'deadline' ? 'Latest first' : 'Z → A' }
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
                            onChange={() => toggleFilterValue(filterKey, val)}
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
        })()}
      </Popover>

      {/* ── Assignee Popover ──────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(assigneePopover)}
        anchorEl={assigneePopover?.anchor}
        onClose={() => setAssigneePopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 220, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 1.5 } } }}
      >
        {assigneePopover && (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="overline" sx={{ px: 1.5, pt: 0.75, pb: 0.25, display: 'block', fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>
              Assign To
            </Typography>
            <ListItemButton dense sx={{ px: 1.5, py: 0.75 }} onClick={() => handleAssigneeChange(assigneePopover.denialId, null)}>
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: 'grey.300', color: 'text.secondary' }}>—</Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Unassigned</Typography>} />
            </ListItemButton>
            <Divider sx={{ my: 0.25 }} />
            {TEAM_MEMBERS.map(member => {
              const denial = denials.find(d => d.id === assigneePopover.denialId)
              const isSelected = denial?.assignedTo?.id === member.id
              return (
                <ListItemButton
                  key={member.id}
                  dense
                  selected={isSelected}
                  sx={{ px: 1.5, py: 0.75 }}
                  onClick={() => handleAssigneeChange(assigneePopover.denialId, member)}
                >
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: 'primary.light' }}>
                      {member.initials}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Typography variant="body2">{member.name}</Typography>} />
                </ListItemButton>
              )
            })}
          </Box>
        )}
      </Popover>

      {/* ── Notes Modal ───────────────────────────────────────────────────────── */}
      {notesModal && (() => {
        const denial = denials.find(d => d.id === notesModal.denialId)!
        return (
          <Dialog open onClose={() => setNotesModal(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
            <DialogTitle sx={{ pb: 0.5 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Notes</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {denial.patient.name} · {denial.id} · {denial.payer}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <TextField
                multiline rows={6} fullWidth
                placeholder="Add a note..."
                value={notesModal.draft}
                onChange={e => setNotesModal(prev => prev ? { ...prev, draft: e.target.value } : null)}
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem', lineHeight: 1.6 } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="text" onClick={() => setNotesModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button variant="contained" disableElevation onClick={() => handleSaveNotes(notesModal.denialId, notesModal.draft)}>Save</Button>
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* ── Deadline Popover ──────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(deadlinePopover)}
        anchorEl={deadlinePopover?.anchor}
        onClose={() => setDeadlinePopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, mt: 0.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: 1.5 } } }}
      >
        {deadlinePopover && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>
              Edit Deadline
            </Typography>
            <TextField
              type="date" size="small"
              defaultValue={denials.find(d => d.id === deadlinePopover.denialId)?.deadline ?? ''}
              onChange={e => { deadlineDraftRef.current = e.target.value }}
              sx={{ width: 180 }}
              slotProps={{ htmlInput: { min: new Date().toISOString().split('T')[0] } }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" variant="text" onClick={() => setDeadlinePopover(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button size="small" variant="contained" disableElevation
                onClick={() => { if (deadlineDraftRef.current) handleDeadlineChange(deadlinePopover.denialId, deadlineDraftRef.current) }}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}
      </Popover>

    </Box>
  )
}
