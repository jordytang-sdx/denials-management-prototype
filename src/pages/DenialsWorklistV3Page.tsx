import { useState, useMemo } from 'react'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, IconButton, Tooltip, Tabs, Tab, Avatar,
  InputAdornment, TextField, Checkbox, Popover, List, ListItemButton,
  ListItemText, Divider,
} from '@mui/material'
import {
  ArrowUpward, ArrowDownward, SwapVert,
  StickyNote2Outlined, NoteAltOutlined, SearchOutlined,
  Check, KeyboardArrowDown, FilterAltOutlined,
} from '@mui/icons-material'
import { type DenialRecord, type DenialState, type TeamMember, TEAM_MEMBERS, KRISTA } from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type SortCol = 'patient' | 'deniedAmount' | 'deadline' | 'daysInQueue'
type Sort = { col: SortCol; dir: SortDir } | null

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: DenialState[] = ['Queue', 'InProgress', 'Submitted', 'Overturned', 'Closed']

const TAB_LABELS: Record<DenialState, string> = {
  Queue: 'Queue', InProgress: 'In Progress', Submitted: 'Submitted',
  Overturned: 'Overturned', Closed: 'Closed', Archive: 'Archive',
}

const TODAY = new Date('2026-04-02')

const ASSIGNABLE_MEMBERS = TEAM_MEMBERS

const APPEAL_LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  L1: { bg: '#e8f2f5', color: '#157d9d' },
  L2: { bg: '#fef3ea', color: '#b86823' },
  L3: { bg: '#fbedee', color: '#9f383e' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((TODAY.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function formatPatientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
}

const DRG_INDICATOR: Record<string, string> = {
  '191': 'MCC', '192': 'CC', '193': 'Base',
  '194': 'MCC', '195': 'CC', '196': 'Base',
  '291': 'CC',  '292': 'Base', '293': 'Base',
  '309': 'MCC', '310': 'CC',  '311': 'Base',
  '470': 'Base', '483': 'MCC',
}

function formatDrgSubtype(subtype: string): { typeLabel: string; changeLabel: string } | null {
  const m = subtype.match(/^(MS-DRG|APR-DRG)\s+(\d+)\s*→\s*(\d+)/)
  if (!m) return null
  const [, prefix, from, to] = m
  const fromInd = DRG_INDICATOR[from]
  const toInd = DRG_INDICATOR[to]
  return {
    typeLabel: `DRG Downgrade (${prefix})`,
    changeLabel: `DRG ${from}${fromInd ? ` (${fromInd})` : ''} → ${to}${toInd ? ` (${toInd})` : ''}`,
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir?: SortDir }) {
  if (!active) return <SwapVert sx={{ fontSize: 14, opacity: 0.35, ml: 0.25, verticalAlign: 'middle' }} />
  return dir === 'asc'
    ? <ArrowUpward sx={{ fontSize: 12, ml: 0.25, verticalAlign: 'middle' }} />
    : <ArrowDownward sx={{ fontSize: 12, ml: 0.25, verticalAlign: 'middle' }} />
}

interface SortableHeaderProps {
  col: SortCol
  label: string
  align?: 'left' | 'right'
  sort: Sort
  onSort: (col: SortCol) => void
}

function SortableHeader({ col, label, align = 'left', sort, onSort }: SortableHeaderProps) {
  return (
    <TableCell
      onClick={() => onSort(col)}
      sx={{ cursor: 'pointer', textAlign: align, userSelect: 'none', whiteSpace: 'nowrap', '&:hover': { color: 'var(--colors-text-primary)' } }}
    >
      {label}<SortIcon active={sort?.col === col} dir={sort?.col === col ? sort.dir : undefined} />
    </TableCell>
  )
}

// ─── Shared cell renderers ─────────────────────────────────────────────────────

function PatientCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
        {formatPatientName(d.patient.name)}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>
        {d.claim.har}
      </Typography>
    </TableCell>
  )
}

function PayerCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell>
      <Typography sx={{ fontSize: '0.875rem' }}>{d.payer}</Typography>
    </TableCell>
  )
}

function DenialTypeCell({ d }: { d: DenialRecord }) {
  const cfg = getDenialTypeConfig(d.denialType)
  const drg = d.denialType === 'DRG Downgrade' && d.denialSubtype
    ? formatDrgSubtype(d.denialSubtype)
    : null
  return (
    <TableCell>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cfg.color }}>
        {drg ? drg.typeLabel : d.denialType}
      </Typography>
      {drg ? (
        <Typography sx={{ fontSize: '0.75rem', color: cfg.color }}>
          {drg.changeLabel}
        </Typography>
      ) : d.denialSubtype ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {d.denialSubtype}
        </Typography>
      ) : null}
    </TableCell>
  )
}

function DeniedCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell align="right">
      <Typography sx={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(d.deniedAmount)}
      </Typography>
    </TableCell>
  )
}

function AppealLevelCell({ d }: { d: DenialRecord }) {
  const colors = APPEAL_LEVEL_COLORS[d.appealLevel] ?? { bg: '#f1f4f6', color: '#636a6f' }
  return (
    <TableCell>
      <Chip
        label={d.appealLevel}
        size="small"
        sx={{
          height: 22, fontSize: '0.75rem', fontWeight: 600,
          bgcolor: colors.bg, color: colors.color,
          border: `1px solid ${colors.color}`,
          '& .MuiChip-label': { px: 0.875 },
        }}
      />
    </TableCell>
  )
}

function DeadlineCell({ d }: { d: DenialRecord }) {
  const left = daysUntil(d.deadline)
  const overdue = left < 0
  const urgent = !overdue && left <= 7
  return (
    <TableCell>
      <Typography sx={{ fontSize: '0.875rem', color: overdue ? 'error.main' : urgent ? 'warning.dark' : 'text.primary' }}>
        {formatDate(d.deadline)}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: overdue ? 'error.light' : 'text.secondary' }}>
        {overdue ? `${Math.abs(left)}d overdue` : left === 0 ? 'Today' : `${left}d left`}
      </Typography>
    </TableCell>
  )
}

function NotesCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell>
      <Tooltip title={d.notes || 'No notes'} placement="left">
        <IconButton size="small" sx={{ color: d.notes ? 'var(--colors-ocean-4)' : 'text.disabled' }}>
          {d.notes
            ? <StickyNote2Outlined sx={{ fontSize: 16 }} />
            : <NoteAltOutlined sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
    </TableCell>
  )
}

// ─── Filter Button ────────────────────────────────────────────────────────────

interface FilterButtonProps {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}

function FilterButton({ label, options, value, onChange }: FilterButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const active = value.length > 0
  return (
    <>
      <Box
        component="button"
        onClick={e => setAnchor(e.currentTarget as HTMLElement)}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.25, py: 0.5, borderRadius: '6px',
          border: '1px solid',
          borderColor: active ? 'var(--colors-ocean-4)' : 'var(--colors-grey-4)',
          bgcolor: active ? 'var(--colors-ocean-1)' : 'transparent',
          color: active ? 'var(--colors-ocean-4)' : 'text.secondary',
          fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
          fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          lineHeight: 1.4, whiteSpace: 'nowrap',
          transition: 'background-color 0.1s, border-color 0.1s',
          '&:hover': { bgcolor: active ? 'var(--colors-ocean-2)' : 'action.hover' },
        }}
      >
        {label}
        {active && (
          <Box component="span" sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 16, height: 16, px: 0.5, ml: 0.25,
            borderRadius: '10px', bgcolor: 'var(--colors-ocean-4)', color: '#fff',
            fontSize: '0.6875rem', fontWeight: 700,
          }}>
            {value.length}
          </Box>
        )}
        <KeyboardArrowDown sx={{ fontSize: 14, ml: 0.25 }} />
      </Box>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 0.5, minWidth: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            border: '1px solid var(--colors-grey-4)', borderRadius: '8px',
          },
        }}
      >
        <List dense disablePadding sx={{ py: 0.5 }}>
          {options.map(opt => {
            const checked = value.includes(opt)
            return (
              <ListItemButton
                key={opt}
                onClick={() => onChange(checked ? value.filter(v => v !== opt) : [...value, opt])}
                sx={{ px: 1.5, py: 0.375 }}
              >
                <Checkbox
                  size="small" checked={checked} disableRipple
                  sx={{ p: 0, mr: 1.25, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }}
                />
                <ListItemText primary={opt} primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </ListItemButton>
            )
          })}
        </List>
        {active && (
          <>
            <Divider />
            <Box sx={{ px: 1.5, py: 0.75 }}>
              <Typography
                variant="caption"
                onClick={() => { onChange([]); setAnchor(null) }}
                sx={{ cursor: 'pointer', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
              >
                Clear filter
              </Typography>
            </Box>
          </>
        )}
      </Popover>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  denials: DenialRecord[]
  onSelectDenial?: (id: string) => void
}

export default function DenialsWorklistV3Page({ denials, onSelectDenial }: Props) {
  const [activeTab, setActiveTab] = useState<DenialState>('Queue')
  const [sort, setSort] = useState<Sort>(null)
  const [search, setSearch] = useState('')
  const [payerFilter, setPayerFilter] = useState<string[]>([])
  const [denialTypeFilter, setDenialTypeFilter] = useState<string[]>([])
  const [appealLevelFilter, setAppealLevelFilter] = useState<string[]>([])
  const [lobFilter, setLobFilter] = useState<string[]>([])
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>([])
  const [assignOverrides, setAssignOverrides] = useState<Record<string, TeamMember | null>>({})
  const [assignAnchor, setAssignAnchor] = useState<{ el: HTMLElement; denialId: string } | null>(null)

  function effectiveAssignee(d: DenialRecord): TeamMember | null {
    if (d.id in assignOverrides) return assignOverrides[d.id] ?? null
    return d.assignedTo ?? null
  }

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    return (r: DenialRecord) =>
      r.patient.name.toLowerCase().includes(q) ||
      r.claim.har.toLowerCase().includes(q) ||
      r.payer.toLowerCase().includes(q) ||
      r.denialType.toLowerCase().includes(q)
  }, [search])

  const payerOptions = useMemo(() =>
    [...new Set(denials.map(d => d.payer))].sort(),
  [denials])

  const denialTypeOptions = useMemo(() =>
    [...new Set(denials.map(d => d.denialType))].sort(),
  [denials])

  const lobOptions = useMemo(() =>
    [...new Set(denials.map(d => d.lineOfBusiness))].sort(),
  [denials])

  const assignedToOptions = useMemo(() => {
    const names = [...new Set(denials.filter(d => d.assignedTo).map(d => d.assignedTo!.name))].sort()
    if (denials.some(d => !d.assignedTo)) names.push('Unassigned')
    return names
  }, [denials])

  const tabCounts = useMemo(() =>
    Object.fromEntries(TABS.map(t => [t, denials.filter(d =>
      d.state === t &&
      (!searchMatches || searchMatches(d)) &&
      (payerFilter.length === 0 || payerFilter.includes(d.payer)) &&
      (denialTypeFilter.length === 0 || denialTypeFilter.includes(d.denialType)) &&
      (appealLevelFilter.length === 0 || appealLevelFilter.includes(d.appealLevel)) &&
      (lobFilter.length === 0 || lobFilter.includes(d.lineOfBusiness)) &&
      (assignedToFilter.length === 0 || assignedToFilter.some(n => n === 'Unassigned' ? !d.assignedTo : d.assignedTo?.name === n))
    ).length])),
  [denials, searchMatches, payerFilter, denialTypeFilter, appealLevelFilter, lobFilter, assignedToFilter])

  const displayed = useMemo(() => {
    let rows = denials.filter(d =>
      d.state === activeTab &&
      (!searchMatches || searchMatches(d)) &&
      (payerFilter.length === 0 || payerFilter.includes(d.payer)) &&
      (denialTypeFilter.length === 0 || denialTypeFilter.includes(d.denialType)) &&
      (appealLevelFilter.length === 0 || appealLevelFilter.includes(d.appealLevel)) &&
      (lobFilter.length === 0 || lobFilter.includes(d.lineOfBusiness)) &&
      (assignedToFilter.length === 0 || assignedToFilter.some(n => n === 'Unassigned' ? !d.assignedTo : d.assignedTo?.name === n))
    )
    if (sort) {
      rows = [...rows].sort((a, b) => {
        let cmp = 0
        if (sort.col === 'patient')           cmp = formatPatientName(a.patient.name).localeCompare(formatPatientName(b.patient.name))
        else if (sort.col === 'deniedAmount') cmp = a.deniedAmount - b.deniedAmount
        else if (sort.col === 'deadline')     cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        else if (sort.col === 'daysInQueue')  cmp = daysSince(a.createdAt) - daysSince(b.createdAt)
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [denials, activeTab, searchMatches, sort, payerFilter, denialTypeFilter, appealLevelFilter, lobFilter, assignedToFilter])

  function toggleSort(col: SortCol) {
    setSort(prev =>
      prev?.col === col
        ? prev.dir === 'asc' ? { col, dir: 'desc' } : null
        : { col, dir: 'asc' }
    )
  }

  function handleTabChange(_: React.SyntheticEvent, v: DenialState) {
    setActiveTab(v)
    setSort(null)
  }

  // ── Column header sets per tab ─────────────────────────────────────────────

  const sharedSort = { sort, onSort: toggleSort }

  function renderAssigneeCell(d: DenialRecord) {
    const assignee = effectiveAssignee(d)
    return (
      <TableCell sx={{ py: 0.5 }}>
        <Box
          component="button"
          onClick={e => { e.stopPropagation(); setAssignAnchor({ el: e.currentTarget as HTMLElement, denialId: d.id }) }}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            background: 'none', border: '1px solid transparent', cursor: 'pointer',
            borderRadius: '6px', px: 0.75, py: 0.375, mx: -0.75,
            '&:hover': { borderColor: 'var(--colors-grey-4)', bgcolor: 'var(--colors-grey-3)' },
            transition: 'border-color 0.1s, background-color 0.1s',
          }}
        >
          {assignee ? (
            <>
              <Avatar sx={{ width: 22, height: 22, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'var(--colors-ocean-1)', color: 'var(--colors-ocean-4)' }}>
                {assignee.initials}
              </Avatar>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
                {assignee.name}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled', fontStyle: 'italic' }}>
              Assign…
            </Typography>
          )}
          <KeyboardArrowDown sx={{ fontSize: 14, color: 'text.disabled', ml: 0.25 }} />
        </Box>
      </TableCell>
    )
  }

  function renderHeaders() {
    const shared = (
      <>
        <SortableHeader col="patient" label="Patient / HAR" {...sharedSort} />
        <TableCell>Payer</TableCell>
        <TableCell>Denial Type</TableCell>
        <SortableHeader col="deniedAmount" label="Denied" align="right" {...sharedSort} />
      </>
    )
    if (activeTab === 'Queue') return (
      <TableRow>
        {shared}
        <TableCell>Appeal Level</TableCell>
        <SortableHeader col="deadline" label="Deadline" {...sharedSort} />
        <SortableHeader col="daysInQueue" label="Days in Queue" align="right" {...sharedSort} />
        <TableCell>Assigned To</TableCell>
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
    if (activeTab === 'InProgress') return (
      <TableRow>
        {shared}
        <TableCell>Assigned To</TableCell>
        <TableCell>Appeal Level</TableCell>
        <SortableHeader col="deadline" label="Deadline" {...sharedSort} />
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
    if (activeTab === 'Submitted') return (
      <TableRow>
        {shared}
        <TableCell>Appeal Level</TableCell>
        <TableCell>Submitted</TableCell>
        <TableCell>Response Due</TableCell>
        <TableCell>Assigned To</TableCell>
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
    if (activeTab === 'Overturned') return (
      <TableRow>
        {shared}
        <TableCell align="right">Recovered</TableCell>
        <TableCell>Appeal Level</TableCell>
        <TableCell>Overturn Date</TableCell>
        <TableCell>Assigned To</TableCell>
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
    return (
      <TableRow>
        {shared}
        <TableCell>Appeal Level</TableCell>
        <TableCell>Close Reason</TableCell>
        <TableCell>Closed Date</TableCell>
        <TableCell>Assigned To</TableCell>
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
  }

  // ── Row renderers per tab ──────────────────────────────────────────────────

  function renderRow(d: DenialRecord) {
    const rowProps = {
      key: d.id,
      onClick: () => onSelectDenial?.(d.id),
      sx: { cursor: onSelectDenial ? 'pointer' : 'default' },
    }

    const shared = (
      <>
        <PatientCell d={d} />
        <PayerCell d={d} />
        <DenialTypeCell d={d} />
        <DeniedCell d={d} />
      </>
    )

    if (activeTab === 'Queue') return (
      <TableRow {...rowProps}>
        {shared}
        <AppealLevelCell d={d} />
        <DeadlineCell d={d} />
        <TableCell align="right">
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {daysSince(d.createdAt)}d
          </Typography>
        </TableCell>
        {renderAssigneeCell(d)}
        <NotesCell d={d} />
      </TableRow>
    )

    if (activeTab === 'InProgress') return (
      <TableRow {...rowProps}>
        {shared}
        {renderAssigneeCell(d)}
        <AppealLevelCell d={d} />
        <DeadlineCell d={d} />
        <NotesCell d={d} />
      </TableRow>
    )

    if (activeTab === 'Submitted') return (
      <TableRow {...rowProps}>
        {shared}
        <AppealLevelCell d={d} />
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem' }}>
            {d.submissionDate ? formatDate(d.submissionDate) : '—'}
          </Typography>
        </TableCell>
        <TableCell>
          {d.responseDueDate ? (
            <>
              <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(d.responseDueDate)}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {daysUntil(d.responseDueDate)}d left
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>—</Typography>
          )}
        </TableCell>
        {renderAssigneeCell(d)}
        <NotesCell d={d} />
      </TableRow>
    )

    if (activeTab === 'Overturned') return (
      <TableRow {...rowProps}>
        {shared}
        <TableCell align="right">
          <Typography sx={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: 'success.dark' }}>
            {d.paidAmount != null ? formatCurrency(d.paidAmount) : '—'}
          </Typography>
        </TableCell>
        <AppealLevelCell d={d} />
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem' }}>
            {d.overturnDate ? formatDate(d.overturnDate) : '—'}
          </Typography>
        </TableCell>
        {renderAssigneeCell(d)}
        <NotesCell d={d} />
      </TableRow>
    )

    return (
      <TableRow {...rowProps}>
        {shared}
        <AppealLevelCell d={d} />
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {d.closeReason ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem' }}>
            {d.closedDate ? formatDate(d.closedDate) : '—'}
          </Typography>
        </TableCell>
        {renderAssigneeCell(d)}
        <NotesCell d={d} />
      </TableRow>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search + Filters — global across all tabs */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Search by patient, HAR, payer, or denial type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 380 }}
        />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
        <FilterAltOutlined sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
        <FilterButton label="Payer" options={payerOptions} value={payerFilter} onChange={setPayerFilter} />
        <FilterButton label="Denial Type" options={denialTypeOptions} value={denialTypeFilter} onChange={setDenialTypeFilter} />
        <FilterButton label="Appeal Level" options={['L1', 'L2', 'L3']} value={appealLevelFilter} onChange={setAppealLevelFilter} />
        <FilterButton label="Line of Business" options={lobOptions} value={lobFilter} onChange={setLobFilter} />
        <FilterButton label="Assigned to" options={assignedToOptions} value={assignedToFilter} onChange={setAssignedToFilter} />
        {(payerFilter.length > 0 || denialTypeFilter.length > 0 || appealLevelFilter.length > 0 || lobFilter.length > 0 || assignedToFilter.length > 0) && (
          <Typography
            variant="caption"
            onClick={() => { setPayerFilter([]); setDenialTypeFilter([]); setAppealLevelFilter([]); setLobFilter([]); setAssignedToFilter([]) }}
            sx={{ ml: 0.5, color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'text.secondary' }, whiteSpace: 'nowrap' }}
          >
            Clear all
          </Typography>
        )}
      </Box>

      {/* Tabs — counts reflect active search */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 40 }}>
          {TABS.map(tab => (
            <Tab
              key={tab}
              value={tab}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {TAB_LABELS[tab]}
                  <Chip
                    label={tabCounts[tab] ?? 0}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.6875rem', fontWeight: 600,
                      bgcolor: activeTab === tab ? 'var(--colors-ocean-1)' : 'rgba(0,0,0,0.06)',
                      color: activeTab === tab ? 'var(--colors-ocean-4)' : 'var(--colors-text-secondary)',
                      '& .MuiChip-label': { px: 0.625 },
                    }}
                  />
                </Box>
              }
              sx={{ minHeight: 40, py: 0, px: 2 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>{renderHeaders()}</TableHead>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.disabled">
                    {searchMatches
                      ? `No results for "${search.trim()}" in this tab — try another tab or clear the search`
                      : 'No records in this tab'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayed.map(d => renderRow(d))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assignee picker */}
      {(() => {
        const popoverDenial = assignAnchor ? denials.find(d => d.id === assignAnchor.denialId) ?? null : null
        const currentAssignee = popoverDenial ? effectiveAssignee(popoverDenial) : null
        return (
          <Popover
            open={!!assignAnchor}
            anchorEl={assignAnchor?.el ?? null}
            onClose={() => setAssignAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                width: 220, mt: 0.5,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                border: '1px solid var(--colors-grey-4)',
                borderRadius: '8px',
              },
            }}
          >
            <List dense disablePadding sx={{ py: 0.5 }}>
              {ASSIGNABLE_MEMBERS.map(m => {
                const isMe = m.id === KRISTA.id
                const isSelected = currentAssignee?.id === m.id
                return (
                  <ListItemButton
                    key={m.id}
                    selected={isSelected}
                    onClick={() => {
                      if (assignAnchor) {
                        setAssignOverrides(prev => ({ ...prev, [assignAnchor.denialId]: m }))
                        setAssignAnchor(null)
                      }
                    }}
                    sx={{
                      px: 1.5, py: 0.75,
                      '&.Mui-selected': { bgcolor: 'var(--colors-ocean-1)' },
                      '&.Mui-selected:hover': { bgcolor: 'var(--colors-ocean-2)' },
                    }}
                  >
                    <Avatar sx={{
                      width: 26, height: 26, fontSize: '0.6875rem', fontWeight: 600, mr: 1.25, flexShrink: 0,
                      bgcolor: isSelected ? 'var(--colors-ocean-4)' : 'var(--colors-grey-4)',
                      color: isSelected ? '#ffffff' : 'var(--colors-text-secondary)',
                    }}>
                      {m.initials}
                    </Avatar>
                    <ListItemText
                      primary={isMe ? `${m.name} (me)` : m.name}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400 }}
                    />
                    {isSelected && <Check sx={{ fontSize: 16, color: 'var(--colors-ocean-4)', ml: 0.5 }} />}
                  </ListItemButton>
                )
              })}
              {currentAssignee && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <ListItemButton
                    onClick={() => {
                      if (assignAnchor) {
                        setAssignOverrides(prev => ({ ...prev, [assignAnchor.denialId]: null }))
                        setAssignAnchor(null)
                      }
                    }}
                    sx={{ px: 1.5, py: 0.75 }}
                  >
                    <ListItemText
                      primary="Unassign"
                      primaryTypographyProps={{ fontSize: '0.875rem', color: 'text.secondary' }}
                    />
                  </ListItemButton>
                </>
              )}
            </List>
          </Popover>
        )
      })()}
    </Box>
  )
}
