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
  EditOutlined,
  ArrowUpward,
  ArrowDownward,
  FilterList,
  SwapVert,
  CalendarMonthOutlined,
  NoteAltOutlined,
  StickyNote2Outlined,
  SearchOutlined,
  CloseOutlined,
  ErrorOutlineOutlined,
  AddOutlined,
  ViewColumnOutlined,
} from '@mui/icons-material'
import {
  TEAM_MEMBERS, type DenialRecord, type TeamMember, type DenialState,
  type PaymentStatus, type PacketStatus,
} from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc'
export type SortCol = 'patient' | 'deniedAmount' | 'paidAmount' | 'deadline' | 'priorityScore' | 'responseDueDate'
export type WorklistSort = { colId: SortCol; dir: SortDir } | null
export type WorklistActiveTab = DenialState

export interface WorklistFilters {
  payer: string[]
  lineOfBusiness: string[]
  denialType: string[]
  assignedTo: string[]
  paymentStatus: string[]
  appealLevel: string[]
  closedStatus: string[]
}

export const DEFAULT_WORKLIST_FILTERS: WorklistFilters = {
  payer: [], lineOfBusiness: [], denialType: [], assignedTo: [], paymentStatus: [], appealLevel: [], closedStatus: [],
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

const TABS: WorklistActiveTab[] = ['Queue', 'InProgress', 'Submitted', 'Overturned', 'Closed']

const TAB_LABELS: Record<WorklistActiveTab, string> = {
  Queue:      'Queue',
  InProgress: 'In Progress',
  Submitted:  'Submitted',
  Overturned: 'Overturned',
  Closed:     'Closed',
  Archive:    'Archive',
}

const TODAY = new Date('2026-04-02')

const TAB_OPTIONAL_COLS: Partial<Record<WorklistActiveTab, Array<{ id: string; label: string }>>> = {
  Queue: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'priorityScore',  label: 'Priority Score' },
    { id: 'assignedTo',     label: 'Assigned To' },
    { id: 'dos',            label: 'Date of Service' },
  ],
  InProgress: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'priorityScore',  label: 'Priority Score' },
    { id: 'dos',            label: 'Date of Service' },
  ],
  Submitted: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'assignedTo',     label: 'Assigned To' },
    { id: 'priorityScore',  label: 'Priority Score' },
    { id: 'dos',            label: 'Date of Service' },
  ],
  Overturned: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'paymentStatus',  label: 'Payment Status' },
    { id: 'dos',            label: 'Date of Service' },
    { id: 'assignedTo',     label: 'Assigned To' },
  ],
  Closed: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'dos',            label: 'Date of Service' },
    { id: 'assignedTo',     label: 'Assigned To' },
  ],
  Archive: [
    { id: 'lineOfBusiness', label: 'Line of Business' },
    { id: 'dos',            label: 'Date of Service' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - TODAY.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function daysSince(dateStr: string): number {
  const diffMs = TODAY.getTime() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function formatPatientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  const lastName = parts[parts.length - 1]!
  const firstName = parts.slice(0, -1).join(' ')
  return `${lastName}, ${firstName}`
}

// ─── State colors ─────────────────────────────────────────────────────────────

const STATE_COLORS: Partial<Record<DenialState, { bg: string; color: string; border: string }>> = {
  Queue:      { bg: '#e8f2f5', color: '#157d9d', border: '#157d9d' },
  InProgress: { bg: '#fef3ea', color: '#b86823', border: '#b86823' },
  Submitted:  { bg: '#ebf5fb', color: '#2776a1', border: '#2776a1' },
  Overturned: { bg: '#eaf6f4', color: '#227a6c', border: '#227a6c' },
  Closed:     { bg: '#f1f4f6', color: '#636a6f', border: '#e2e6e9' },
  Archive:    { bg: '#f1f4f6', color: '#939a9f', border: '#e2e6e9' },
}

const APPEAL_LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  L1: { bg: 'var(--colors-badge-variant-info-background)',    color: 'var(--colors-badge-variant-info-text)',    border: '1px solid var(--colors-badge-variant-info-border)' },
  L2: { bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' },
  L3: { bg: 'var(--colors-badge-variant-error-background)',   color: 'var(--colors-badge-variant-error-text)',   border: '1px solid var(--colors-badge-variant-error-border)' },
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; color: string; border: string }> = {
  Pending:  { bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' },
  Received: { bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: '1px solid var(--colors-badge-variant-success-border)' },
}

const PACKET_STATUS_COLORS: Record<PacketStatus, { bg: string; color: string; border: string }> = {
  'Assembling':        { bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' },
  'Ready for Review':  { bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: '1px solid var(--colors-badge-variant-success-border)' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeadlineCells({ days, dateStr }: { days: number; dateStr: string }) {
  const isOverdue = days < 0
  const isUrgent  = days >= 0 && days <= 7
  const color = isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'text.secondary'
  const label = isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
        {formatDate(dateStr)}
      </Typography>
      <Typography variant="caption" sx={{ color }}>
        {label}
      </Typography>
    </>
  )
}

function ResponseDueCells({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr)
  const isOverdue = days < 0
  const isUrgent  = days >= 0 && days <= 7
  const color = isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'text.secondary'
  const label = isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
        {formatDate(dateStr)}
      </Typography>
      <Typography variant="caption" sx={{ color }}>{label}</Typography>
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

function AppealLevelChip({ level }: { level: string }) {
  const colors = APPEAL_LEVEL_COLORS[level] ?? { bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }
  return (
    <Chip
      label={level}
      size="small"
      sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: colors.bg, color: colors.color, border: colors.border, '& .MuiChip-label': { px: 0.75 } }}
    />
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

// ─── Patient Cell (shared across tabs) ───────────────────────────────────────

function PatientCell({ denial, activeState }: { denial: DenialRecord; activeState?: WorklistActiveTab }) {
  const displayName = formatPatientName(denial.patient.name)
  const showReturned = activeState === 'Queue' && denial.status === 'Returned — Upheld'
  return (
    <TableCell sx={{ py: 1.25 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
        {displayName}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {denial.claim.har}
      </Typography>
      {showReturned && (
        <Chip
          label="↩ L1 Upheld"
          size="small"
          sx={{ mt: 0.5, height: 16, fontSize: '0.6rem', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)', '& .MuiChip-label': { px: 0.75 } }}
        />
      )}
    </TableCell>
  )
}

function DenialTypeCell({ denial }: { denial: DenialRecord }) {
  const typeConfig = getDenialTypeConfig(denial.denialType)
  return (
    <TableCell sx={{ py: 1.25 }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3, color: typeConfig.color }}>
        {denial.denialType}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
        {denial.denialSubtype}
      </Typography>
    </TableCell>
  )
}

// ─── Optional column helpers ──────────────────────────────────────────────────

const OPTIONAL_COL_HEADER_CONFIG: Record<string, { label: string; sortable?: boolean; filterable?: boolean; align?: 'left' | 'right'; width: number }> = {
  lineOfBusiness: { label: 'Line of Business', filterable: true, width: 145 },
  priorityScore:  { label: 'Priority',         sortable: true, align: 'right', width: 90 },
  dos:            { label: 'DOS',              width: 110 },
  assignedTo:     { label: 'Assigned To',      filterable: true, width: 140 },
  paymentStatus:  { label: 'Payment Status',   filterable: true, width: 130 },
}

function OptionalColHeader({ colId, activeSort, hasFilter, onOpen }: {
  colId: string
  activeSort: WorklistSort
  hasFilter: boolean
  onOpen: (e: React.MouseEvent<HTMLElement>, colId: string) => void
}) {
  const cfg = OPTIONAL_COL_HEADER_CONFIG[colId]
  if (!cfg) return null
  return (
    <ColHeader
      label={cfg.label} colId={colId}
      sortable={cfg.sortable} filterable={cfg.filterable}
      activeSort={activeSort} hasFilter={hasFilter}
      onOpen={onOpen} align={cfg.align} width={cfg.width}
    />
  )
}

function OptionalColCell({ colId, denial }: { colId: string; denial: DenialRecord }) {
  if (colId === 'lineOfBusiness') return (
    <TableCell sx={{ py: 1.25 }}>
      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>{denial.lineOfBusiness}</Typography>
    </TableCell>
  )
  if (colId === 'priorityScore') return (
    <TableCell align="right" sx={{ py: 1.25 }}>
      {denial.priorityScore !== undefined ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Box sx={{ width: 36, height: 5, borderRadius: 1, bgcolor: '#e2e6e9', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', borderRadius: 1, width: `${denial.priorityScore}%`, bgcolor: denial.priorityScore >= 80 ? 'error.main' : denial.priorityScore >= 60 ? 'warning.main' : 'primary.light' }} />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: denial.priorityScore >= 80 ? 'error.main' : denial.priorityScore >= 60 ? 'warning.main' : 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: 20 }}>
            {denial.priorityScore}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
      )}
    </TableCell>
  )
  if (colId === 'dos') return (
    <TableCell sx={{ py: 1.25 }}>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateShort(denial.dos)}</Typography>
    </TableCell>
  )
  if (colId === 'assignedTo') return (
    <TableCell sx={{ py: 1.25 }}>
      <AssigneeDisplay member={denial.assignedTo} />
    </TableCell>
  )
  if (colId === 'paymentStatus') return (
    <TableCell sx={{ py: 1.25 }}>
      {denial.paymentStatus ? (
        <Chip label={denial.paymentStatus} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: PAYMENT_STATUS_COLORS[denial.paymentStatus].bg, color: PAYMENT_STATUS_COLORS[denial.paymentStatus].color, border: PAYMENT_STATUS_COLORS[denial.paymentStatus].border, '& .MuiChip-label': { px: 0.75 } }} />
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
      )}
    </TableCell>
  )
  return <TableCell sx={{ py: 1.25 }} />
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

export default function WorklistPage({
  denials, onDenialsChange: setDenials, onSelectDenial, activeTab: activeState,
  onActiveTabChange: setActiveState, sort, onSortChange: setSort, filters, onFiltersChange: setFilters,
}: WorklistPageProps) {

  // Column popover
  const [colPopover, setColPopover] = useState<ColPopoverState | null>(null)

  // Per-tab optional columns
  const [tabOptionalCols, setTabOptionalCols] = useState<Partial<Record<WorklistActiveTab, string[]>>>({})
  const [addColAnchor, setAddColAnchor] = useState<HTMLElement | null>(null)

  // Inline edit popovers
  const [assigneePopover, setAssigneePopover] = useState<InlinePopoverState | null>(null)
  const [deadlinePopover, setDeadlinePopover] = useState<InlinePopoverState | null>(null)
  const deadlineDraftRef = useRef<string>('')

  // Notes modal
  const [notesModal, setNotesModal] = useState<{ denialId: string; draft: string } | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // ── Tab handler ─────────────────────────────────────────────────────────────

  function handleStateChange(_: React.SyntheticEvent, newState: WorklistActiveTab) {
    setActiveState(newState)
    setFilters({ ...DEFAULT_WORKLIST_FILTERS })
    setSort(null)
  }

  // ── Derived filter options ──────────────────────────────────────────────────

  const inState = useMemo(() =>
    denials.filter(d => d.state === activeState),
  [denials, activeState])

  const allPayers      = useMemo(() => [...new Set(inState.map(d => d.payer))].sort(), [inState])
  const allLoBs        = useMemo(() => [...new Set(inState.map(d => d.lineOfBusiness))].sort(), [inState])
  const allDenialTypes = useMemo(() => [...new Set(inState.map(d => d.denialType))].sort(), [inState])
  const allAssignees   = useMemo(() => {
    const names = inState.map(d => d.assignedTo?.name ?? 'Unassigned')
    return [...new Set(names)].sort()
  }, [inState])
  const allPaymentStatuses = useMemo(() => [...new Set(inState.map(d => d.paymentStatus).filter(Boolean))].sort(), [inState]) as PaymentStatus[]
  const allAppealLevels    = useMemo(() => [...new Set(inState.map(d => d.appealLevel))].sort(), [inState])
  const allClosedStatuses  = useMemo(() => [...new Set(inState.map(d => d.status).filter(Boolean))].sort() as string[], [inState])

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let rows = [...inState]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      rows = rows.filter(r =>
        r.patient.name.toLowerCase().includes(q) ||
        r.claim.har.toLowerCase().includes(q) ||
        r.claim.claimId.toLowerCase().includes(q) ||
        r.payer.toLowerCase().includes(q) ||
        r.denialType.toLowerCase().includes(q)
      )
    }

    if (filters.payer.length > 0)         rows = rows.filter(r => filters.payer.includes(r.payer))
    if (filters.lineOfBusiness.length > 0) rows = rows.filter(r => filters.lineOfBusiness.includes(r.lineOfBusiness))
    if (filters.denialType.length > 0)    rows = rows.filter(r => filters.denialType.includes(r.denialType))
    if (filters.assignedTo.length > 0)    rows = rows.filter(r => filters.assignedTo.includes(r.assignedTo?.name ?? 'Unassigned'))
    if (filters.paymentStatus.length > 0) rows = rows.filter(r => r.paymentStatus && filters.paymentStatus.includes(r.paymentStatus))
    if (filters.appealLevel.length > 0)   rows = rows.filter(r => filters.appealLevel.includes(r.appealLevel))
    if (filters.closedStatus.length > 0)  rows = rows.filter(r => filters.closedStatus.includes(r.status))

    if (sort) {
      rows.sort((a, b) => {
        let cmp = 0
        if      (sort.colId === 'patient')         cmp = formatPatientName(a.patient.name).localeCompare(formatPatientName(b.patient.name))
        else if (sort.colId === 'deniedAmount')     cmp = a.deniedAmount - b.deniedAmount
        else if (sort.colId === 'paidAmount')       cmp = (a.paidAmount ?? 0) - (b.paidAmount ?? 0)
        else if (sort.colId === 'deadline')         cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        else if (sort.colId === 'priorityScore')    cmp = (a.priorityScore ?? 0) - (b.priorityScore ?? 0)
        else if (sort.colId === 'responseDueDate')  cmp = new Date(a.responseDueDate ?? '').getTime() - new Date(b.responseDueDate ?? '').getTime()
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

  function toggleFilterValue(key: keyof WorklistFilters, value: string) {
    setFilters(prev => {
      const current = prev[key]
      return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }
    })
  }

  function clearColumnFilter(key: keyof WorklistFilters) {
    setFilters(prev => ({ ...prev, [key]: [] }))
    closeColPopover()
  }

  function getOptionalCols(tab: WorklistActiveTab): string[] {
    return tabOptionalCols[tab] ?? []
  }

  function toggleOptionalCol(tab: WorklistActiveTab, colId: string) {
    setTabOptionalCols(prev => {
      const current = prev[tab] ?? []
      const next = current.includes(colId) ? current.filter(id => id !== colId) : [...current, colId]
      return { ...prev, [tab]: next }
    })
  }

  function removeOptionalCol(tab: WorklistActiveTab, colId: string) {
    setTabOptionalCols(prev => ({ ...prev, [tab]: (prev[tab] ?? []).filter(id => id !== colId) }))
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
    lineOfBusiness: filters.lineOfBusiness.length > 0,
    denialType:     filters.denialType.length > 0,
    assignedTo:     filters.assignedTo.length > 0,
    paymentStatus:  filters.paymentStatus.length > 0,
    appealLevel:    filters.appealLevel.length > 0,
    closedStatus:   filters.closedStatus.length > 0,
  }

  const tabCount = (t: WorklistActiveTab) => denials.filter(d => d.state === t).length

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Page header */}
      <Box sx={{ px: 3, height: 56, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>Denials Worklist</Typography>
      </Box>

      {/* State tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
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
                  <span>{TAB_LABELS[tab]}</span>
                  <Chip
                    label={tabCount(tab)}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6875rem', fontWeight: 'var(--font-weights-regular)' as unknown as number, '& .MuiChip-label': { px: 0.75 } }}
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
          placeholder="Search by patient, HAR, payer, or denial type…"
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
        <Table stickyHeader size="small" sx={{ width: '100%', minWidth: 960, tableLayout: 'fixed' }}>

          {/* ── Queue ── */}
          {activeState === 'Queue' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR" colId="patient"      sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={175} />
                <ColHeader label="Payer"         colId="payer"        filterable activeSort={sort} hasFilter={activeFilters.payer}      onOpen={openColPopover} width={140} />
                <ColHeader label="Denial Type"   colId="denialType"   filterable activeSort={sort} hasFilter={activeFilters.denialType} onOpen={openColPopover} width={200} />
                <ColHeader label="Denied"        colId="deniedAmount" sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={100} />
                <ColHeader label="Appeal Level"  colId="appealLevel"  filterable activeSort={sort} hasFilter={activeFilters.appealLevel} onOpen={openColPopover} width={100} />
                <ColHeader label="Deadline"      colId="deadline"     sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={130} />
                <ColHeader label="Days in Queue" colId="daysInQueue"             activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={95} />
                {getOptionalCols('Queue').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : colId === 'assignedTo' ? activeFilters.assignedTo : false} onOpen={openColPopover} />
                ))}
                <ColHeader label="Notes" colId="notes" activeSort={sort} hasFilter={false} onOpen={openColPopover} align="right" width={55} />
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton
                      size="small"
                      onClick={e => setAddColAnchor(e.currentTarget)}
                      sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                    >
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          {/* ── In Progress ── */}
          {activeState === 'InProgress' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR"    colId="patient"       sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={160} />
                <ColHeader label="Payer"            colId="payer"         filterable activeSort={sort} hasFilter={activeFilters.payer}       onOpen={openColPopover} width={130} />
                <ColHeader label="Denial Type"      colId="denialType"    filterable activeSort={sort} hasFilter={activeFilters.denialType}  onOpen={openColPopover} width={185} />
                <ColHeader label="Denied"           colId="deniedAmount"  sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} align="right" width={90} />
                <ColHeader label="Assigned To"      colId="assignedTo"    filterable activeSort={sort} hasFilter={activeFilters.assignedTo}  onOpen={openColPopover} width={130} />
                <ColHeader label="Appeal Level"     colId="appealLevel"   filterable activeSort={sort} hasFilter={activeFilters.appealLevel} onOpen={openColPopover} width={90} />
                <ColHeader label="Packet"           colId="packetStatus"             activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={130} />
                <ColHeader label="Deadline"         colId="deadline"      sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={115} />
                {getOptionalCols('InProgress').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : false} onOpen={openColPopover} />
                ))}
                <ColHeader label="Notes"            colId="notes"                    activeSort={sort} hasFilter={false}                    onOpen={openColPopover} align="right" width={50} />
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          {/* ── Submitted ── */}
          {activeState === 'Submitted' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR"    colId="patient"        sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={160} />
                <ColHeader label="Payer"            colId="payer"          filterable activeSort={sort} hasFilter={activeFilters.payer}      onOpen={openColPopover} width={140} />
                <ColHeader label="Denial Type"      colId="denialType"     filterable activeSort={sort} hasFilter={activeFilters.denialType} onOpen={openColPopover} width={185} />
                <ColHeader label="Denied"           colId="deniedAmount"   sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={90} />
                <ColHeader label="Appeal Level"     colId="appealLevel"    filterable activeSort={sort} hasFilter={activeFilters.appealLevel} onOpen={openColPopover} width={90} />
                <ColHeader label="Submitted"        colId="submissionDate"            activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={100} />
                <ColHeader label="Response Due"     colId="responseDueDate" sortable  activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={120} />
                <ColHeader label="Days Waiting"     colId="daysWaiting"               activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={90} />
                {getOptionalCols('Submitted').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : colId === 'assignedTo' ? activeFilters.assignedTo : false} onOpen={openColPopover} />
                ))}
                <ColHeader label="Notes"            colId="notes"                     activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={50} />
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          {/* ── Overturned ── */}
          {activeState === 'Overturned' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR"    colId="patient"        sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={160} />
                <ColHeader label="Payer"            colId="payer"          filterable activeSort={sort} hasFilter={activeFilters.payer}       onOpen={openColPopover} width={140} />
                <ColHeader label="Denial Type"      colId="denialType"     filterable activeSort={sort} hasFilter={activeFilters.denialType}  onOpen={openColPopover} width={185} />
                <ColHeader label="Denied"           colId="deniedAmount"   sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} align="right" width={90} />
                <ColHeader label="Recovered"        colId="paidAmount"     sortable   activeSort={sort} hasFilter={false}                    onOpen={openColPopover} align="right" width={95} />
                <ColHeader label="Appeal Level"     colId="appealLevel"    filterable activeSort={sort} hasFilter={activeFilters.appealLevel} onOpen={openColPopover} width={90} />
                <ColHeader label="Overturn Date"    colId="overturnDate"              activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={110} />
                <ColHeader label="Payment Received" colId="paymentReceivedDate"       activeSort={sort} hasFilter={false}                    onOpen={openColPopover} width={130} />
                {getOptionalCols('Overturned').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : colId === 'paymentStatus' ? activeFilters.paymentStatus : false} onOpen={openColPopover} />
                ))}
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          {/* ── Closed ── */}
          {activeState === 'Closed' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR"    colId="patient"        sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={160} />
                <ColHeader label="Payer"            colId="payer"          filterable activeSort={sort} hasFilter={activeFilters.payer}      onOpen={openColPopover} width={140} />
                <ColHeader label="Denial Type"      colId="denialType"     filterable activeSort={sort} hasFilter={activeFilters.denialType} onOpen={openColPopover} width={185} />
                <ColHeader label="Denied"           colId="deniedAmount"   sortable   activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={90} />
                <ColHeader label="Appeal Level"     colId="appealLevel"    filterable activeSort={sort} hasFilter={activeFilters.appealLevel} onOpen={openColPopover} width={90} />
                <ColHeader label="Close Reason"     colId="closeReason"   filterable  activeSort={sort} hasFilter={activeFilters.closedStatus} onOpen={openColPopover} width={160} />
                <ColHeader label="Closed Date"      colId="closedDate"                activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={110} />
                {getOptionalCols('Closed').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : colId === 'assignedTo' ? activeFilters.assignedTo : false} onOpen={openColPopover} />
                ))}
                <ColHeader label="Notes"            colId="notes"                     activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={50} />
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          {/* ── Archive ── */}
          {activeState === 'Archive' && (
            <TableHead>
              <TableRow>
                <ColHeader label="Patient / HAR"  colId="patient"       sortable  activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={170} />
                <ColHeader label="Payer"          colId="payer"         filterable activeSort={sort} hasFilter={activeFilters.payer}     onOpen={openColPopover} width={140} />
                <ColHeader label="Denial Type"    colId="denialType"    filterable activeSort={sort} hasFilter={activeFilters.denialType} onOpen={openColPopover} width={195} />
                <ColHeader label="Denied"         colId="deniedAmount"  sortable  activeSort={sort} hasFilter={false}                   onOpen={openColPopover} align="right" width={100} />
                <ColHeader label="Archive Reason" colId="archiveReason"           activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={160} />
                <ColHeader label="Archived By"    colId="archivedBy"              activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={130} />
                <ColHeader label="Archived Date"  colId="archivedDate"            activeSort={sort} hasFilter={false}                   onOpen={openColPopover} width={120} />
                {getOptionalCols('Archive').map(colId => (
                  <OptionalColHeader key={colId} colId={colId} activeSort={sort} hasFilter={colId === 'lineOfBusiness' ? activeFilters.lineOfBusiness : false} onOpen={openColPopover} />
                ))}
                <TableCell sx={{ width: 48, py: 1.25, px: 1 }}>
                  <Tooltip title="Add column" placement="top">
                    <IconButton size="small" onClick={e => setAddColAnchor(e.currentTarget)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                      <AddOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
          )}

          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ py: 6, textAlign: 'center', color: 'text.disabled', border: 'none' }}>
                  <Typography variant="body2">No denials match the current filters.</Typography>
                </TableCell>
              </TableRow>
            ) : displayed.map(denial => {
              const typeConfig = getDenialTypeConfig(denial.denialType)

              return (
                <TableRow
                  key={denial.id}
                  hover
                  onClick={() => onSelectDenial(denial.id)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${typeConfig.color}`,
                    '& td:first-of-type': { pl: '12px' },
                  }}
                >
                  {/* ── Queue row ── */}
                  {activeState === 'Queue' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <AppealLevelChip level={denial.appealLevel} />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <DeadlineCells days={daysUntil(denial.deadline)} dateStr={denial.deadline} />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                        {daysSince(denial.createdAt)}d
                      </Typography>
                    </TableCell>
                    {getOptionalCols('Queue').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Tooltip title={denial.notes || 'Add a note'} placement="left" arrow>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); setNotesModal({ denialId: denial.id, draft: denial.notes }) }}
                          sx={{ color: denial.notes ? 'secondary.main' : 'text.disabled' }}
                        >
                          {denial.notes ? <StickyNote2Outlined sx={{ fontSize: 18 }} /> : <NoteAltOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

                  {/* ── In Progress row ── */}
                  {activeState === 'InProgress' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    {/* Assignee */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        onClick={e => { e.stopPropagation(); setAssigneePopover({ anchor: e.currentTarget, denialId: denial.id }) }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <AssigneeDisplay member={denial.assignedTo} />
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, p: 0.25, color: 'text.secondary' }}
                          onClick={e => { e.stopPropagation(); setAssigneePopover({ anchor: e.currentTarget, denialId: denial.id }) }}
                        >
                          <EditOutlined sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <AppealLevelChip level={denial.appealLevel} />
                    </TableCell>
                    {/* Packet Status */}
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.packetStatus ? (
                        <Chip
                          label={denial.packetStatus}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.7rem', fontWeight: 'var(--font-weights-regular)' as unknown as number,
                            bgcolor: PACKET_STATUS_COLORS[denial.packetStatus].bg,
                            color: PACKET_STATUS_COLORS[denial.packetStatus].color,
                            border: PACKET_STATUS_COLORS[denial.packetStatus].border,
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    {/* Deadline */}
                    <TableCell sx={{ py: 1.25 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        onClick={e => { e.stopPropagation(); deadlineDraftRef.current = denial.deadline; setDeadlinePopover({ anchor: e.currentTarget, denialId: denial.id }) }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <DeadlineCells days={daysUntil(denial.deadline)} dateStr={denial.deadline} />
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, p: 0.25, color: 'text.secondary' }}
                          onClick={e => { e.stopPropagation(); deadlineDraftRef.current = denial.deadline; setDeadlinePopover({ anchor: e.currentTarget, denialId: denial.id }) }}
                        >
                          <CalendarMonthOutlined sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    {getOptionalCols('InProgress').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Tooltip title={denial.notes || 'Add a note'} placement="left" arrow>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); setNotesModal({ denialId: denial.id, draft: denial.notes }) }}
                          sx={{ color: denial.notes ? 'secondary.main' : 'text.disabled' }}
                        >
                          {denial.notes ? <StickyNote2Outlined sx={{ fontSize: 18 }} /> : <NoteAltOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

                  {/* ── Submitted row ── */}
                  {activeState === 'Submitted' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <AppealLevelChip level={denial.appealLevel} />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.submissionDate ? (
                        <Typography variant="body2">{formatDateShort(denial.submissionDate)}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    {/* Response Due */}
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.responseDueDate ? (
                        <ResponseDueCells dateStr={denial.responseDueDate} />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                        {denial.submissionDate ? `${daysSince(denial.submissionDate)}d` : '—'}
                      </Typography>
                    </TableCell>
                    {getOptionalCols('Submitted').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Tooltip title={denial.notes || 'Add a note'} placement="left" arrow>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); setNotesModal({ denialId: denial.id, draft: denial.notes }) }}
                          sx={{ color: denial.notes ? 'secondary.main' : 'text.disabled' }}
                        >
                          {denial.notes ? <StickyNote2Outlined sx={{ fontSize: 18 }} /> : <NoteAltOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

                  {/* ── Overturned row ── */}
                  {activeState === 'Overturned' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'error.main' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      {denial.paidAmount !== undefined ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'success.dark' }}>
                          {formatCurrency(denial.paidAmount)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>Pending</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <AppealLevelChip level={denial.appealLevel} />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.overturnDate ? (
                        <Typography variant="body2">{formatDateShort(denial.overturnDate)}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.paymentReceivedDate ? (
                        <Typography variant="body2">{formatDateShort(denial.paymentReceivedDate)}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.75rem' }}>Awaiting</Typography>
                      )}
                    </TableCell>
                    {getOptionalCols('Overturned').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

                  {/* ── Closed row ── */}
                  {activeState === 'Closed' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <AppealLevelChip level={denial.appealLevel} />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.closeReason ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{denial.closeReason}</Typography>
                      ) : denial.status ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{denial.status}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.closedDate ? (
                        <Typography variant="body2">{formatDateShort(denial.closedDate)}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    {getOptionalCols('Closed').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Tooltip title={denial.notes || ''} placement="left" arrow>
                        <IconButton size="small" sx={{ color: denial.notes ? 'secondary.main' : 'text.disabled' }}>
                          {denial.notes ? <StickyNote2Outlined sx={{ fontSize: 18 }} /> : <NoteAltOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

                  {/* ── Archive row ── */}
                  {activeState === 'Archive' && <>
                    <PatientCell denial={denial} activeState={activeState} />
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" noWrap>{denial.payer}</Typography>
                    </TableCell>
                    <DenialTypeCell denial={denial} />
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(denial.deniedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.archiveReason ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{denial.archiveReason}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      {denial.archivedBy ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{denial.archivedBy}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                    </TableCell>
                    {getOptionalCols('Archive').map(colId => (
                      <OptionalColCell key={colId} colId={colId} denial={denial} />
                    ))}
                    <TableCell sx={{ py: 1.25 }} />
                  </>}

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
        {activeFilters.lineOfBusiness && (
          <Chip size="small" label={`LoB: ${filters.lineOfBusiness.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, lineOfBusiness: [] }))} />
        )}
        {activeFilters.denialType && (
          <Chip size="small" label={`Type: ${filters.denialType.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, denialType: [] }))} />
        )}
        {activeFilters.assignedTo && (
          <Chip size="small" label={`Assigned: ${filters.assignedTo.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, assignedTo: [] }))} />
        )}
        {activeFilters.paymentStatus && (
          <Chip size="small" label={`Payment: ${filters.paymentStatus.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, paymentStatus: [] }))} />
        )}
        {activeFilters.appealLevel && (
          <Chip size="small" label={`Level: ${filters.appealLevel.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, appealLevel: [] }))} />
        )}
        {activeFilters.closedStatus && (
          <Chip size="small" label={`Close Reason: ${filters.closedStatus.join(', ')}`} onDelete={() => setFilters(p => ({ ...p, closedStatus: [] }))} />
        )}

        <Box sx={{ flex: 1 }} />

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {displayed.length} of {inState.length}
        </Typography>
      </Box>

      {/* ── Add Column Popover ───────────────────────────────────────────────── */}
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
            {(TAB_OPTIONAL_COLS[activeState] ?? []).map(col => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    size="small"
                    checked={getOptionalCols(activeState).includes(col.id)}
                    onChange={() => toggleOptionalCol(activeState, col.id)}
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
          const isSortable = ['patient', 'deniedAmount', 'paidAmount', 'deadline', 'priorityScore', 'responseDueDate'].includes(colId)
          const isRemovableCol = getOptionalCols(activeState).includes(colId)
          const filterKey: keyof WorklistFilters | null =
            colId === 'payer'          ? 'payer' :
            colId === 'lineOfBusiness' ? 'lineOfBusiness' :
            colId === 'denialType'     ? 'denialType' :
            colId === 'assignedTo'     ? 'assignedTo' :
            colId === 'paymentStatus'  ? 'paymentStatus' :
            colId === 'appealLevel'    ? 'appealLevel' :
            colId === 'closeReason'    ? 'closedStatus' :
            null

          const filterOptions: string[] =
            filterKey === 'payer'          ? allPayers :
            filterKey === 'lineOfBusiness' ? allLoBs :
            filterKey === 'denialType'     ? allDenialTypes :
            filterKey === 'assignedTo'     ? allAssignees :
            filterKey === 'paymentStatus'  ? allPaymentStatuses :
            filterKey === 'appealLevel'    ? allAppealLevels :
            filterKey === 'closedStatus'   ? allClosedStatuses :
            []
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
                    {[{ val: 'asc',  label: colId === 'deniedAmount' || colId === 'paidAmount' || colId === 'priorityScore' ? 'Low → High'    : colId === 'deadline' || colId === 'responseDueDate' ? 'Earliest first' : 'A → Z' },
                      { val: 'desc', label: colId === 'deniedAmount' || colId === 'paidAmount' || colId === 'priorityScore' ? 'High → Low'    : colId === 'deadline' || colId === 'responseDueDate' ? 'Latest first'   : 'Z → A' },
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
                      <Button size="small" variant="text" onClick={clearSort} sx={{ fontSize: '0.75rem', p: 0 }}>
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
                      <Button size="small" onClick={() => clearColumnFilter(filterKey)} sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0 }}>
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
              {isRemovableCol && (
                <>
                  {(isSortable || filterKey) && <Divider sx={{ my: 0.5 }} />}
                  <ListItemButton
                    dense
                    onClick={() => removeOptionalCol(activeState, colId)}
                    sx={{ px: 1.5, py: 0.75 }}
                  >
                    <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
                      Remove column
                    </Typography>
                  </ListItemButton>
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
                {formatPatientName(denial.patient.name)} · {denial.claim.har} · {denial.payer}
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
              <Button variant="text" onClick={() => setNotesModal(null)}>Cancel</Button>
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
              <Button size="small" variant="text" onClick={() => setDeadlinePopover(null)}>Cancel</Button>
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
