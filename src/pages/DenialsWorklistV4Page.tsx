import { useState, useMemo } from 'react'
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, IconButton, Tooltip,
  InputAdornment, TextField, Avatar, Checkbox, Popover, List, ListItemButton,
  ListItemText, Divider,
} from '@mui/material'
import {
  ArrowUpward, ArrowDownward, SwapVert,
  StickyNote2Outlined, NoteAltOutlined, SearchOutlined,
  Check, KeyboardArrowDown, FilterAltOutlined, ViewColumnOutlined,
} from '@mui/icons-material'
import { type DenialRecord, type DenialState, type TeamMember, TEAM_MEMBERS, KRISTA } from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type SortCol = 'patient' | 'deadline' | 'daysInQueue'
type Sort = { col: SortCol; dir: SortDir } | null

type ColumnKey =
  | 'payer' | 'class' | 'denialType' | 'deniedAmount' | 'appealLevel'
  | 'assignedTo' | 'reviewComplete'
  | 'dos' | 'createdAt' | 'carc' | 'rarc' | 'claimId' | 'mrn' | 'priorityScore' | 'nextAction'

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultOn: boolean }[] = [
  { key: 'payer',          label: 'Payer',           defaultOn: true  },
  { key: 'class',          label: 'Class',           defaultOn: true  },
  { key: 'denialType',     label: 'Denial Type',     defaultOn: true  },
  { key: 'deniedAmount',   label: 'Denied Amount',   defaultOn: true  },
  { key: 'appealLevel',    label: 'Appeal Level',    defaultOn: true  },
  { key: 'assignedTo',     label: 'Assigned To',     defaultOn: true  },
  { key: 'reviewComplete', label: 'Review Complete', defaultOn: true  },
  { key: 'dos',            label: 'Date of Service', defaultOn: false },
  { key: 'createdAt',      label: 'Ingested Date',   defaultOn: false },
  { key: 'carc',           label: 'CARC Code',       defaultOn: false },
  { key: 'rarc',           label: 'RARC Code',       defaultOn: false },
  { key: 'claimId',        label: 'Claim ID',        defaultOn: false },
  { key: 'mrn',            label: 'MRN',             defaultOn: false },
  { key: 'priorityScore',  label: 'Priority Score',  defaultOn: false },
  { key: 'nextAction',     label: 'Next Action',     defaultOn: false },
]

const DEFAULT_COLUMNS = new Set<ColumnKey>(ALL_COLUMNS.filter(c => c.defaultOn).map(c => c.key))

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_CHIPS = ['Ready', 'Submitted', 'Closed', 'Overturned', 'Upheld', 'Will not appeal', 'Archived'] as const
type StageChip = typeof STAGE_CHIPS[number]

function matchesStageChip(d: DenialRecord, chip: StageChip): boolean {
  if (chip === 'Ready')           return d.state === 'InProgress' || d.state === 'Queue'
  if (chip === 'Submitted')       return d.state === 'Submitted'
  if (chip === 'Closed')          return d.state === 'Closed'
  if (chip === 'Overturned')      return d.state === 'Overturned'
  if (chip === 'Upheld')          return (d.status ?? '').toLowerCase().includes('upheld')
  if (chip === 'Will not appeal') return d.status === 'Upheld - Will Not Appeal' || d.status === 'Will Not Appeal'
  if (chip === 'Archived')        return d.state === 'Archive'
  return false
}

const STAGE_LABELS: Record<DenialState, string> = {
  Queue: 'Ready', InProgress: 'Ready', Submitted: 'Submitted',
  Overturned: 'Overturned', Closed: 'Closed', Archive: 'Archived',
}

const STAGE_COLORS: Record<DenialState, { bg: string; color: string; border: string }> = {
  Queue:      { bg: 'var(--colors-badge-variant-info-background)',    color: 'var(--colors-badge-variant-info-text)',    border: 'var(--colors-badge-variant-info-border)'    },
  InProgress: { bg: 'var(--colors-badge-variant-info-background)',    color: 'var(--colors-badge-variant-info-text)',    border: 'var(--colors-badge-variant-info-border)'    },
  Submitted:  { bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: 'var(--colors-badge-variant-warning-border)' },
  Closed:     { bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: 'var(--colors-badge-variant-default-border)' },
  Overturned: { bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: 'var(--colors-badge-variant-success-border)' },
  Archive:    { bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: 'var(--colors-badge-variant-default-border)' },
}

const TODAY = new Date('2026-04-02')

const ALLOWED_DENIAL_TYPES = ['DRG Downgrade', 'Medical Necessity']

const ASSIGNABLE_MEMBERS = TEAM_MEMBERS

const APPEAL_LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  L1: { bg: 'var(--colors-badge-variant-info-background)',    color: 'var(--colors-badge-variant-info-text)',    border: '1px solid var(--colors-badge-variant-info-border)' },
  L2: { bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' },
  L3: { bg: 'var(--colors-badge-variant-error-background)',   color: 'var(--colors-badge-variant-error-text)',   border: '1px solid var(--colors-badge-variant-error-border)' },
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
      <Typography variant="inherit" sx={{ fontWeight: 'var(--font-weights-medium)' }}>
        {formatPatientName(d.patient.name)}
      </Typography>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {d.claim.har}
      </Typography>
    </TableCell>
  )
}

function PayerCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell>{d.payer}</TableCell>
  )
}

function DenialTypeCell({ d }: { d: DenialRecord }) {
  const cfg = getDenialTypeConfig(d.denialType)
  const drg = d.denialType === 'DRG Downgrade' && d.denialSubtype
    ? formatDrgSubtype(d.denialSubtype)
    : null
  return (
    <TableCell>
      <Typography variant="inherit" sx={{ fontWeight: 'var(--font-weights-medium)', color: cfg.color }}>
        {drg ? drg.typeLabel : d.denialType}
      </Typography>
      {drg && (
        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: cfg.color }}>
          {drg.changeLabel}
        </Typography>
      )}
    </TableCell>
  )
}

function ClassCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell sx={{ color: 'text.secondary' }}>
      {d.lineOfBusiness}
    </TableCell>
  )
}

function DeniedCell({ d }: { d: DenialRecord }) {
  return (
    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatCurrency(d.deniedAmount)}
    </TableCell>
  )
}

function AppealLevelCell({ d }: { d: DenialRecord }) {
  const colors = APPEAL_LEVEL_COLORS[d.appealLevel] ?? { bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }
  return (
    <TableCell>
      <Chip
        label={d.appealLevel}
        size="small"
        sx={{
          height: 22, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number,
          bgcolor: colors.bg, color: colors.color, border: colors.border,
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
      <Typography variant="inherit" sx={{ color: overdue ? 'error.main' : urgent ? 'warning.dark' : 'text.primary' }}>
        {formatDate(d.deadline)}
      </Typography>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: overdue ? 'error.light' : 'text.secondary' }}>
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

// ─── Columns Button ───────────────────────────────────────────────────────────

interface ColumnButtonProps {
  visibleColumns: Set<ColumnKey>
  onToggle: (key: ColumnKey) => void
  onReset: () => void
}

function ColumnsButton({ visibleColumns, onToggle, onReset }: ColumnButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const isCustomized = ALL_COLUMNS.some(c => c.defaultOn !== visibleColumns.has(c.key))
  return (
    <>
      <Box
        component="button"
        onClick={e => setAnchor(e.currentTarget as HTMLElement)}
        sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.25, py: 0.5, borderRadius: 'var(--radii-sm)',
          border: '1px solid',
          borderColor: isCustomized ? 'var(--colors-ocean-4)' : 'var(--colors-grey-4)',
          bgcolor: isCustomized ? 'var(--colors-ocean-1)' : 'transparent',
          color: isCustomized ? 'var(--colors-ocean-4)' : 'text.secondary',
          fontSize: 'var(--font-sizes-14)', fontWeight: isCustomized ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
          fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          lineHeight: 1.4, whiteSpace: 'nowrap',
          transition: 'background-color 0.1s, border-color 0.1s',
          '&:hover': { bgcolor: isCustomized ? 'var(--colors-ocean-2)' : 'action.hover' },
        }}
      >
        <ViewColumnOutlined sx={{ fontSize: 15, mr: 0.25 }} />
        Columns
        <KeyboardArrowDown sx={{ fontSize: 14, ml: 0.25 }} />
      </Box>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.5, minWidth: 220,
            boxShadow: 'var(--shadows-medium)',
            border: '1px solid var(--colors-grey-4)', borderRadius: 'var(--radii-md)',
          },
        }}
      >
        <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Columns
          </Typography>
        </Box>
        <List dense disablePadding sx={{ py: 0.5 }}>
          {ALL_COLUMNS.map(({ key, label }) => {
            const checked = visibleColumns.has(key)
            return (
              <ListItemButton key={key} onClick={() => onToggle(key)} sx={{ px: 1.5, py: 0.375 }}>
                <Checkbox
                  size="small" checked={checked} disableRipple
                  sx={{ p: 0, mr: 1.25, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }}
                />
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: 'var(--font-sizes-14)' }} />
              </ListItemButton>
            )
          })}
        </List>
        {isCustomized && (
          <>
            <Divider />
            <Box sx={{ px: 1.5, py: 0.75 }}>
              <Typography
                variant="caption"
                onClick={() => { onReset(); setAnchor(null) }}
                sx={{ cursor: 'pointer', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
              >
                Reset to default
              </Typography>
            </Box>
          </>
        )}
      </Popover>
    </>
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
          px: 1.25, py: 0.5, borderRadius: 'var(--radii-sm)',
          border: '1px solid',
          borderColor: active ? 'var(--colors-ocean-4)' : 'var(--colors-grey-4)',
          bgcolor: active ? 'var(--colors-ocean-1)' : 'transparent',
          color: active ? 'var(--colors-ocean-4)' : 'text.secondary',
          fontSize: 'var(--font-sizes-14)', fontWeight: active ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
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
            borderRadius: 'var(--radii-pill)', bgcolor: 'var(--colors-ocean-4)', color: 'var(--colors-grey-1)',
            fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)',
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
            boxShadow: 'var(--shadows-medium)',
            border: '1px solid var(--colors-grey-4)', borderRadius: 'var(--radii-md)',
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
                <ListItemText primary={opt} primaryTypographyProps={{ fontSize: 'var(--font-sizes-14)' }} />
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
  onSelectDenial?: (id: string, fromTab: DenialState) => void
  reviewCompleteIds?: Set<string>
  initialTab?: DenialState
  assignedToMe?: boolean
  onAssignedToMeChange?: (v: boolean) => void
  onAssign?: (denialId: string, member: TeamMember | null) => void
}

export default function DenialsWorklistV4Page({ denials, onSelectDenial, reviewCompleteIds, assignedToMe: assignedToMeProp, onAssignedToMeChange, onAssign }: Props) {
  const [stageFilter, setStageFilter] = useState<StageChip[]>([])
  const [sort, setSort] = useState<Sort>(null)
  const [search, setSearch] = useState('')
  const [assignedToMeLocal, setAssignedToMeLocal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(DEFAULT_COLUMNS)
  const [assignAnchor, setAssignAnchor] = useState<{ el: HTMLElement; denialId: string } | null>(null)
  const [payerFilter, setPayerFilter] = useState<string[]>([])
  const [denialTypeFilter, setDenialTypeFilter] = useState<string[]>([])
  const [appealLevelFilter, setAppealLevelFilter] = useState<string[]>([])
  const [lobFilter, setLobFilter] = useState<string[]>([])
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>([])

  const assignedToMe = assignedToMeProp ?? assignedToMeLocal
  const setAssignedToMe = onAssignedToMeChange ?? setAssignedToMeLocal

  const col = (key: ColumnKey) => visibleColumns.has(key)
  function toggleColumn(key: ColumnKey) {
    setVisibleColumns(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  function isAssignedToMe(d: DenialRecord): boolean {
    return d.assignedTo?.id === KRISTA.id
  }

  function effectiveAssignee(d: DenialRecord): TeamMember | null {
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
    [...new Set(denials.filter(d => ALLOWED_DENIAL_TYPES.includes(d.denialType)).map(d => d.payer))].sort(),
  [denials])

  const denialTypeOptions = useMemo(() =>
    [...new Set(denials.filter(d => ALLOWED_DENIAL_TYPES.includes(d.denialType)).map(d => d.denialType))].sort(),
  [denials])

  const lobOptions = useMemo(() =>
    [...new Set(denials.filter(d => ALLOWED_DENIAL_TYPES.includes(d.denialType)).map(d => d.lineOfBusiness))].sort(),
  [denials])

  const assignedToOptions = useMemo(() => {
    const scoped = denials.filter(d => ALLOWED_DENIAL_TYPES.includes(d.denialType))
    const names = [...new Set(scoped.filter(d => d.assignedTo).map(d => d.assignedTo!.name))].sort()
    if (scoped.some(d => !d.assignedTo)) names.push('Unassigned')
    return names
  }, [denials])

  const displayed = useMemo(() => {
    let rows = denials.filter(d =>
      ALLOWED_DENIAL_TYPES.includes(d.denialType) &&
      (stageFilter.length === 0 || stageFilter.some(c => matchesStageChip(d, c))) &&
      (!searchMatches || searchMatches(d)) &&
      (!assignedToMe || isAssignedToMe(d)) &&
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
        else if (sort.col === 'deadline')     cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        else if (sort.col === 'daysInQueue')  cmp = daysSince(a.createdAt) - daysSince(b.createdAt)
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [denials, stageFilter, searchMatches, sort, assignedToMe, payerFilter, denialTypeFilter, appealLevelFilter, lobFilter, assignedToFilter])

  function toggleSort(col: SortCol) {
    setSort(prev =>
      prev?.col === col
        ? prev.dir === 'asc' ? { col, dir: 'desc' } : null
        : { col, dir: 'asc' }
    )
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
            borderRadius: 'var(--radii-sm)', px: 0.75, py: 0.375, mx: -0.75,
            '&:hover': { borderColor: 'var(--colors-grey-4)', bgcolor: 'var(--colors-grey-3)' },
            transition: 'border-color 0.1s, background-color 0.1s',
          }}
        >
          {assignee ? (
            <>
              <Avatar sx={{ width: 22, height: 22, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', bgcolor: 'var(--colors-ocean-1)', color: 'var(--colors-ocean-4)' }}>
                {assignee.initials}
              </Avatar>
              <Typography variant="inherit" sx={{ color: 'text.primary' }}>
                {assignee.name}
              </Typography>
            </>
          ) : (
            <Typography variant="inherit" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              Assign…
            </Typography>
          )}
          <KeyboardArrowDown sx={{ fontSize: 14, color: 'text.disabled', ml: 0.25 }} />
        </Box>
      </TableCell>
    )
  }

  function renderHeaders() {
    return (
      <TableRow>
        <SortableHeader col="patient" label="Patient / HAR" {...sharedSort} />
        {col('payer')        && <TableCell>Payer</TableCell>}
        {col('class')        && <TableCell>Class</TableCell>}
        {col('denialType')   && <TableCell>Denial Type</TableCell>}
        {col('deniedAmount') && <TableCell align="right">Denied Amount</TableCell>}
        {col('dos')           && <TableCell>Date of Service</TableCell>}
        {col('createdAt')     && <TableCell>Ingested Date</TableCell>}
        {col('carc')          && <TableCell>CARC</TableCell>}
        {col('rarc')          && <TableCell>RARC</TableCell>}
        {col('claimId')       && <TableCell>Claim ID</TableCell>}
        {col('mrn')           && <TableCell>MRN</TableCell>}
        {col('priorityScore') && <TableCell>Priority</TableCell>}
        {col('nextAction')    && <TableCell>Next Action</TableCell>}
        {col('appealLevel') && <TableCell>Appeal Level</TableCell>}
        <TableCell>Stage</TableCell>
        <SortableHeader col="deadline" label="Key Date" {...sharedSort} />
        {col('assignedTo') && <TableCell>Assigned To</TableCell>}
        <TableCell sx={{ width: 48 }} />
      </TableRow>
    )
  }

  function renderStageCell(d: DenialRecord) {
    const c = STAGE_COLORS[d.state]
    const label = STAGE_LABELS[d.state]
    const showStatus =
      (d.state === 'Closed' || d.state === 'Archive') && (d.status || d.closeReason || d.archiveReason)
    const sublabel = d.state === 'Archive'
      ? (d.archiveReason ?? d.status)
      : d.state === 'Closed'
        ? (d.closeReason ?? d.status)
        : null
    return (
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-start' }}>
          <Chip
            label={label}
            size="small"
            sx={{
              height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)',
              bgcolor: c.bg, color: c.color,
              border: '1px solid', borderColor: c.border,
              '& .MuiChip-label': { px: 0.875 },
            }}
          />
          {showStatus && sublabel && (
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', lineHeight: 1.2 }}>
              {sublabel}
            </Typography>
          )}
        </Box>
      </TableCell>
    )
  }

  function renderKeyDateCell(d: DenialRecord) {
    if (d.state === 'InProgress' || d.state === 'Queue') {
      return <DeadlineCell d={d} />
    }
    if (d.state === 'Submitted') {
      return (
        <TableCell>
          {d.responseDueDate ? (
            <>
              {formatDate(d.responseDueDate)}
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                Response due
              </Typography>
            </>
          ) : d.submissionDate ? (
            <>
              {formatDate(d.submissionDate)}
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                Submitted
              </Typography>
            </>
          ) : (
            <Typography variant="inherit" sx={{ color: 'text.disabled' }}>—</Typography>
          )}
        </TableCell>
      )
    }
    if (d.state === 'Overturned') {
      return (
        <TableCell>
          {d.overturnDate ? (
            <>
              {formatDate(d.overturnDate)}
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                Overturned
              </Typography>
            </>
          ) : <Typography variant="inherit" sx={{ color: 'text.disabled' }}>—</Typography>}
        </TableCell>
      )
    }
    return (
      <TableCell>
        {d.closedDate ? (
          <>
            {formatDate(d.closedDate)}
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
              {d.state === 'Archive' ? 'Archived' : 'Closed'}
            </Typography>
          </>
        ) : <Typography variant="inherit" sx={{ color: 'text.disabled' }}>—</Typography>}
      </TableCell>
    )
  }

  function renderRow(d: DenialRecord) {
    const rowProps = {
      key: d.id,
      onClick: () => onSelectDenial?.(d.id, d.state),
      sx: { cursor: onSelectDenial ? 'pointer' : 'default' },
    }

    return (
      <TableRow {...rowProps}>
        <PatientCell d={d} />
        {col('payer')        && <PayerCell d={d} />}
        {col('class')        && <ClassCell d={d} />}
        {col('denialType')   && <DenialTypeCell d={d} />}
        {col('deniedAmount') && <DeniedCell d={d} />}
        {col('dos')           && <TableCell>{d.dos ? formatDate(d.dos) : '—'}</TableCell>}
        {col('createdAt')     && <TableCell>{d.createdAt ? formatDate(d.createdAt) : '—'}</TableCell>}
        {col('carc')          && <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{d.carc || '—'}</TableCell>}
        {col('rarc')          && <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{d.rarc || '—'}</TableCell>}
        {col('claimId')       && <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{d.claim.claimId || '—'}</TableCell>}
        {col('mrn')           && <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{d.patient.mrn || '—'}</TableCell>}
        {col('priorityScore') && <TableCell>{d.priorityScore ?? '—'}</TableCell>}
        {col('nextAction')    && <TableCell sx={{ color: 'text.secondary' }}>{d.nextAction || '—'}</TableCell>}
        {col('appealLevel') && <AppealLevelCell d={d} />}
        {renderStageCell(d)}
        {renderKeyDateCell(d)}
        {col('assignedTo') && renderAssigneeCell(d)}
        <NotesCell d={d} />
      </TableRow>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search + Filters */}
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
        <Box sx={{ flex: 1 }} />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
        <ColumnsButton
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
          onReset={() => setVisibleColumns(new Set(DEFAULT_COLUMNS))}
        />
      </Box>

      {/* Quick-filter chips + Assigned to me toggle */}
      <Box sx={{ px: 2, py: 0.875, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        {STAGE_CHIPS.map(chip => {
          const active = stageFilter.includes(chip)
          return (
            <Chip
              key={chip}
              label={chip}
              size="small"
              onClick={() => setStageFilter(prev => active ? prev.filter(s => s !== chip) : [...prev, chip])}
              sx={{
                height: 24, fontSize: 'var(--font-sizes-12)', fontWeight: active ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)', cursor: 'pointer',
                bgcolor: active ? 'var(--colors-ocean-1)' : 'transparent',
                color: active ? 'var(--colors-ocean-4)' : 'text.secondary',
                border: '1px solid',
                borderColor: active ? 'var(--colors-ocean-4)' : 'divider',
                '& .MuiChip-label': { px: 1 },
                '&:hover': { bgcolor: active ? 'var(--colors-ocean-2)' : 'action.hover' },
              }}
            />
          )
        })}
        {stageFilter.length > 0 && (
          <Typography
            variant="caption"
            onClick={() => setStageFilter([])}
            sx={{ ml: 0.5, color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
          >
            Clear
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Box
          component="button"
          onClick={() => setAssignedToMe(p => !p)}
          sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            px: '12px', py: '6px', borderRadius: 'var(--radii-sm)',
            border: 'none', cursor: 'pointer', outline: 'none',
            bgcolor: assignedToMe ? 'var(--colors-ocean-1)' : 'transparent',
            color: assignedToMe ? 'var(--colors-text-primary)' : 'var(--colors-text-secondary)',
            fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-regular)', fontFamily: 'inherit',
            lineHeight: '14px', whiteSpace: 'nowrap',
            transition: 'background-color 0.1s',
            '&:hover': { bgcolor: assignedToMe ? 'var(--colors-ocean-2)' : 'var(--colors-grey-3)' },
          }}
        >
          Assigned to me
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>{renderHeaders()}</TableHead>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.disabled">
                    {searchMatches
                      ? `No results for "${search.trim()}" — try clearing filters or the search`
                      : 'No records match the current filters'}
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
                boxShadow: 'var(--shadows-medium)',
                border: '1px solid var(--colors-grey-4)',
                borderRadius: 'var(--radii-md)',
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
                        onAssign?.(assignAnchor.denialId, m)
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
                      width: 26, height: 26, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', mr: 1.25, flexShrink: 0,
                      bgcolor: isSelected ? 'var(--colors-ocean-4)' : 'var(--colors-grey-4)',
                      color: isSelected ? 'var(--colors-grey-1)' : 'var(--colors-text-secondary)',
                    }}>
                      {m.initials}
                    </Avatar>
                    <ListItemText
                      primary={isMe ? `${m.name} (me)` : m.name}
                      primaryTypographyProps={{ fontSize: 'var(--font-sizes-14)', fontWeight: isSelected ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)' }}
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
                        onAssign?.(assignAnchor.denialId, null)
                        setAssignAnchor(null)
                      }
                    }}
                    sx={{ px: 1.5, py: 0.75 }}
                  >
                    <ListItemText
                      primary="Unassign"
                      primaryTypographyProps={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary' }}
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
