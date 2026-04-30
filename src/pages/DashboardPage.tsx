import { useState } from 'react'
import {
  Box, Typography, Paper, Chip, Avatar,
  Select, MenuItem, FormControl, InputLabel,
  ToggleButtonGroup, ToggleButton, Table, TableBody,
  TableCell, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, Button,
} from '@mui/material'
import {
  AccessTimeOutlined, PersonOutlined, LightbulbOutlined,
  ExpandMoreOutlined, ListAltOutlined, PaymentsOutlined, GavelOutlined,
  ArrowForwardIosOutlined,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter,
  ZAxis, ReferenceLine, ComposedChart, Cell,
} from 'recharts'
import { type DenialRecord } from '../data/denials'
import { DENIAL_OUTCOMES } from '../data/denialDetail'
import { type UnderpaymentRecord } from '../data/underpayments'
import { type AuditRecord } from '../data/audits'
import { type FeatureFlags } from '../data/featureFlags'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY_DATE = new Date('2026-04-03')
const MTD_START  = new Date('2026-04-01')
const CURRENT_USER_INITIALS = 'JT'

const DENIAL_OPEN   = ['Queue', 'InProgress', 'Submitted']
const UP_ACTIVE     = ['Active', 'Submitted']
const UP_OPEN       = ['Active', 'Submitted', 'Won']
const AUDIT_ACTIVE  = ['NoticeReceived', 'RecordsPending', 'UnderReview', 'FindingsIssued', 'Disputed']

const MOD = {
  denials:      { main: '#b86823', bg: '#fef3ea', border: '#f58a2e', light: '#fef3ea', label: 'Denials',      badge: 'D', icon: <ListAltOutlined sx={{ fontSize: 14 }} /> },
  underpayments:{ main: '#157d9d', bg: '#e8f2f5', border: '#b6d7e1', light: '#e8f2f5', label: 'Underpayments', badge: 'U', icon: <PaymentsOutlined sx={{ fontSize: 14 }} /> },
  audits:       { main: '#7C3AED', bg: '#F5F3FF', border: '#8B5CF6', light: '#EDE9FE', label: 'Audits',       badge: 'A', icon: <GavelOutlined sx={{ fontSize: 14 }} /> },
} as const

// ── Static trend data (illustrative) ─────────────────────────────────────────

const PAYER_SCORECARD = [
  { payer: 'BCBS',             denialRate: 18.2, overturnRate: 64, avgDays: 28, atRisk: 142000, tag: 'Improving',      tagColor: '#22543D', tagBg: '#C6F6D5' },
  { payer: 'UnitedHealthcare', denialRate: 22.4, overturnRate: 41, avgDays: 45, atRisk: 218000, tag: 'Aggressive',     tagColor: '#9B2C2C', tagBg: '#FED7D7' },
  { payer: 'Cigna',            denialRate: 16.8, overturnRate: 58, avgDays: 32, atRisk:  87000, tag: 'Consistent',     tagColor: '#2C5282', tagBg: '#BEE3F8' },
  { payer: 'Aetna',            denialRate: 19.1, overturnRate: 53, avgDays: 38, atRisk: 165000, tag: 'Worsening',      tagColor: '#744210', tagBg: '#FEFCBF' },
  { payer: 'Humana',           denialRate: 14.3, overturnRate: 71, avgDays: 22, atRisk:  54000, tag: 'Best Performer', tagColor: '#1A365D', tagBg: '#BEE3F8' },
  { payer: 'Palmetto GBA',     denialRate: 28.7, overturnRate: 38, avgDays: 62, atRisk: 312000, tag: 'High Risk',      tagColor: '#9B2C2C', tagBg: '#FED7D7' },
]

const FUNNEL_DATA = [
  { stage: 'Gross Denied',         amount: 985, color: '#2C5282', note: 'Starting point' },
  { stage: 'Appealed',             amount: 803, color: '#553C9A', note: '82% of gross' },
  { stage: 'Overturned',           amount: 429, color: '#22543D', note: '44% of gross — recovered' },
  { stage: 'Not Appealed',         amount: 182, color: '#9B2C2C', note: 'Immediate write-off' },
  { stage: 'Appealed & Upheld',    amount: 247, color: '#C05621', note: 'Lost on appeal' },
  { stage: 'Outstanding/Residual', amount: 127, color: '#718096', note: 'Still unresolved' },
]

const PREVENTION_OPPS = [
  { rank: 1, opportunity: 'Obtain prior auth before inpatient admissions',    owner: 'Auth',    saving: 218000, type: 'Authorization' },
  { rank: 2, opportunity: 'Strengthen CDI for sepsis / respiratory criteria', owner: 'CDI',     saving: 164000, type: 'Medical Necessity' },
  { rank: 3, opportunity: 'Fix DRG coding workflow for CC/MCC capture',       owner: 'Coding',  saving: 141000, type: 'DRG Downgrade' },
  { rank: 4, opportunity: 'Automate claim submission within 10-day window',   owner: 'Billing', saving:  87000, type: 'Timely Filing' },
  { rank: 5, opportunity: 'Reconcile UHC auth criteria for cardiac procedures',owner: 'Auth',   saving:  73000, type: 'Authorization' },
]

const PREVENTION_OWNER_COLORS: Record<string, { bg: string; color: string }> = {
  CDI:     { bg: '#BEE3F8', color: '#2C5282' },
  Auth:    { bg: '#FEFCBF', color: '#744210' },
  Coding:  { bg: '#C6F6D5', color: '#22543D' },
  Billing: { bg: '#FED7D7', color: '#9B2C2C' },
}

const AGING_DATA = [
  { bucket: '0–30 days',   amount: 187000, writeoff:  12000 },
  { bucket: '31–60 days',  amount: 142000, writeoff:  35000 },
  { bucket: '61–90 days',  amount:  98000, writeoff:  58000 },
  { bucket: '91–120 days', amount:  64000, writeoff:  48000 },
  { bucket: '120+ days',   amount:  43000, writeoff:  38000 },
]

const EXPLORER_BY_PAYER = [
  { x: 'BCBS',         deniedAmount: 142000, volume: 47, overturnRate: 64, avgDays: 28, recoveryRate: 71 },
  { x: 'UHC',          deniedAmount: 218000, volume: 63, overturnRate: 41, avgDays: 45, recoveryRate: 48 },
  { x: 'Cigna',        deniedAmount:  87000, volume: 31, overturnRate: 58, avgDays: 32, recoveryRate: 65 },
  { x: 'Aetna',        deniedAmount: 165000, volume: 52, overturnRate: 53, avgDays: 38, recoveryRate: 58 },
  { x: 'Humana',       deniedAmount:  54000, volume: 24, overturnRate: 71, avgDays: 22, recoveryRate: 76 },
  { x: 'Palmetto GBA', deniedAmount: 312000, volume: 41, overturnRate: 38, avgDays: 62, recoveryRate: 42 },
]
const EXPLORER_BY_TYPE = [
  { x: 'Med Nec',       deniedAmount: 287000, volume: 58, overturnRate: 54, avgDays: 38, recoveryRate: 62 },
  { x: 'Authorization', deniedAmount: 193000, volume: 44, overturnRate: 41, avgDays: 42, recoveryRate: 55 },
  { x: 'DRG Downgrade', deniedAmount: 164000, volume: 28, overturnRate: 68, avgDays: 29, recoveryRate: 74 },
  { x: 'Coding Error',  deniedAmount:  98000, volume: 35, overturnRate: 82, avgDays: 18, recoveryRate: 85 },
  { x: 'Timely Filing', deniedAmount:  64000, volume: 18, overturnRate: 35, avgDays: 12, recoveryRate: 38 },
  { x: 'Other',         deniedAmount:  72000, volume: 23, overturnRate: 49, avgDays: 25, recoveryRate: 52 },
]
const EXPLORER_BY_MONTH = [
  { x: "Oct '25", deniedAmount: 142000, volume: 35, overturnRate: 48, avgDays: 34, recoveryRate: 55 },
  { x: "Nov '25", deniedAmount: 171000, volume: 43, overturnRate: 52, avgDays: 36, recoveryRate: 58 },
  { x: "Dec '25", deniedAmount: 128000, volume: 29, overturnRate: 55, avgDays: 31, recoveryRate: 62 },
  { x: "Jan '26", deniedAmount: 198000, volume: 53, overturnRate: 44, avgDays: 41, recoveryRate: 51 },
  { x: "Feb '26", deniedAmount: 167000, volume: 40, overturnRate: 57, avgDays: 35, recoveryRate: 63 },
  { x: "Mar '26", deniedAmount: 185000, volume: 48, overturnRate: 59, avgDays: 33, recoveryRate: 65 },
]
const EXPLORER_BY_SERVICE = [
  { x: 'Inpatient',  deniedAmount: 412000, volume: 68, overturnRate: 56, avgDays: 42, recoveryRate: 61 },
  { x: 'Outpatient', deniedAmount: 218000, volume: 83, overturnRate: 61, avgDays: 28, recoveryRate: 67 },
  { x: 'ED',         deniedAmount:  97000, volume: 44, overturnRate: 48, avgDays: 19, recoveryRate: 54 },
  { x: 'Behavioral', deniedAmount:  74000, volume: 22, overturnRate: 42, avgDays: 35, recoveryRate: 49 },
  { x: 'Radiology',  deniedAmount:  54000, volume: 35, overturnRate: 63, avgDays: 22, recoveryRate: 70 },
  { x: 'Surgery',    deniedAmount: 123000, volume: 29, overturnRate: 52, avgDays: 38, recoveryRate: 58 },
]

const INSIGHTS = [
  { text: 'Palmetto GBA denials up 34% QoQ — 62-day avg resolution is 2× system average; escalate to exec review.', color: '#9B2C2C' },
  { text: 'Coding Error denials overturn at 82% — every dollar spent appealing these returns $4.20. Accelerate appeal routing.', color: '#22543D' },
  { text: 'UHC cardiac auth denials contributed $73K in preventable write-offs last quarter; auth team alignment needed.', color: '#744210' },
  { text: 'BCBS overturn rate improved from 51% → 64% over 6 months — CDI protocol changes are working.', color: '#2C5282' },
]

const EXPLORER_COLORS = ['#2C5282', '#22543D', '#744210', '#553C9A', '#9B2C2C', '#276749']

type YMetric    = 'Denied Amount' | 'Volume' | 'Overturn Rate' | 'Days to Resolution' | 'Recovery Rate'
type XDimension = 'Payer' | 'Denial Type' | 'Month' | 'Service Line'
type ChartType  = 'Bar' | 'Line' | 'Scatter'

const METRIC_KEY: Record<YMetric, string> = {
  'Denied Amount': 'deniedAmount', 'Volume': 'volume', 'Overturn Rate': 'overturnRate',
  'Days to Resolution': 'avgDays', 'Recovery Rate': 'recoveryRate',
}
const METRIC_UNIT: Record<YMetric, string> = {
  'Denied Amount': '$', 'Volume': '', 'Overturn Rate': '%', 'Days to Resolution': 'd', 'Recovery Rate': '%',
}
const EXPLORER_DATA: Record<XDimension, typeof EXPLORER_BY_PAYER> = {
  'Payer': EXPLORER_BY_PAYER, 'Denial Type': EXPLORER_BY_TYPE, 'Month': EXPLORER_BY_MONTH, 'Service Line': EXPLORER_BY_SERVICE,
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeadlineRow {
  id: string
  caseType: 'denial' | 'underpayment' | 'audit'
  patientName: string
  caseId: string
  payer: string
  state: string
  deadline: string
  amount: number
  assigneeInitials: string | null
  assigneeName: string | null
}

interface DashboardPageProps {
  denials: DenialRecord[]
  underpayments: UnderpaymentRecord[]
  audits: AuditRecord[]
  features: FeatureFlags
  userRole: 'Manager' | 'FrontlineWorker'
  onNavigate: (nav: 'Denials' | 'Underpayments' | 'Audits') => void
  onSelectCase: (type: 'denial' | 'underpayment' | 'audit', id: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - TODAY_DATE.getTime()) / 86400000)
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function deadlineLabel(days: number) {
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return '1 day'
  return `${days} days`
}

function deadlineColor(days: number): { text: string; bg: string } {
  if (days < 0)   return { text: '#9B2C2C', bg: '#FED7D7' }
  if (days <= 2)  return { text: '#C05621', bg: '#FEEBC8' }
  if (days <= 7)  return { text: '#744210', bg: '#FEFCBF' }
  if (days <= 14) return { text: '#2D3748', bg: '#EDF2F7' }
  return { text: '#718096', bg: '#F7FAFC' }
}

function formatMetric(metric: YMetric, v: number): string {
  if (metric === 'Denied Amount') return formatCurrency(v)
  if (metric === 'Overturn Rate' || metric === 'Recovery Rate') return `${v}%`
  if (metric === 'Days to Resolution') return `${v}d`
  return `${v}`
}

// ── Shared mini-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
      {children}
    </Typography>
  )
}

function MiniBar({ fraction, color }: { fraction: number; color: string }) {
  return (
    <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 1.5, height: 6 }}>
      <Box sx={{ width: `${Math.max(fraction * 100, fraction > 0 ? 2 : 0)}%`, height: 6, borderRadius: 1.5, bgcolor: color, transition: 'width 0.3s' }} />
    </Box>
  )
}

function TypeBadge({ type }: { type: 'denial' | 'underpayment' | 'audit' }) {
  const key = type === 'denial' ? 'denials' : type === 'underpayment' ? 'underpayments' : 'audits'
  const m = MOD[key]
  return (
    <Box sx={{
      width: 20, height: 20, borderRadius: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: m.light, color: m.main, fontSize: '0.6rem', fontWeight: 800, flexShrink: 0,
    }}>
      {m.badge}
    </Box>
  )
}

function ChartCard({ title, children, height = 220, action }: { title: string; children: React.ReactNode; height?: number; action?: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  )
}

// ── Section A: Revenue Exposure Summary ──────────────────────────────────────

interface ExposureColProps {
  type: 'denials' | 'underpayments' | 'audits'
  amount: number
  count: number
  sub1Label: string
  sub1Value: string
  onClick: () => void
}

function ExposureCol({ type, amount, count, sub1Label, sub1Value, onClick }: ExposureColProps) {
  const m = MOD[type]
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1, px: 3, py: 2.5, cursor: 'pointer', borderRadius: 1.5,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: m.light },
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <Box sx={{ color: m.main, display: 'flex', alignItems: 'center' }}>{m.icon}</Box>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: m.main, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {m.label}
        </Typography>
        <ArrowForwardIosOutlined sx={{ fontSize: 10, color: m.main, ml: 'auto' }} />
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, mb: 0.5 }}>
        {formatCurrency(amount)}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {count} open case{count !== 1 ? 's' : ''}
      </Typography>
      <Typography variant="caption" sx={{ color: m.main, fontWeight: 600 }}>
        {sub1Label}: {sub1Value}
      </Typography>
    </Box>
  )
}

interface RevenueExposureSummaryProps {
  denials: DenialRecord[]
  underpayments: UnderpaymentRecord[]
  audits: AuditRecord[]
  features: FeatureFlags
  onNavigate: (nav: 'Denials' | 'Underpayments' | 'Audits') => void
}

function RevenueExposureSummary({ denials, underpayments, audits, features, onNavigate }: RevenueExposureSummaryProps) {
  const enabledCount = [features.denials, features.underpayments, features.audits].filter(Boolean).length

  const openDenials  = denials.filter(d => DENIAL_OPEN.includes(d.state))
  const denialAtRisk = openDenials.reduce((s, d) => s + d.deniedAmount, 0)
  const denialOverdue = openDenials.filter(d => daysUntil(d.deadline) < 0).length

  const upOpen    = underpayments.filter(u => UP_ACTIVE.includes(u.state))
  const upAtRisk  = upOpen.reduce((s, u) => s + u.varianceAmount, 0)
  const upMTD     = underpayments.filter(u => u.state === 'Recovered' && new Date(u.createdAt) >= MTD_START).reduce((s, u) => s + (u.recoveredAmount ?? 0), 0)

  const openAudits   = audits.filter(a => AUDIT_ACTIVE.includes(a.state))
  const auditAtRisk  = openAudits.reduce((s, a) => s + a.amountAtRisk, 0)
  const auditRecoup  = audits.filter(a => a.state === 'FindingsIssued' || a.state === 'Disputed').reduce((s, a) => s + (a.proposedRecoupment ?? 0), 0)

  const total = (features.denials ? denialAtRisk : 0) + (features.underpayments ? upAtRisk : 0) + (features.audits ? auditAtRisk : 0)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch', divideX: '1px solid' }}>
        {features.denials && (
          <ExposureCol
            type="denials"
            amount={denialAtRisk}
            count={openDenials.length}
            sub1Label="Overdue"
            sub1Value={`${denialOverdue} cases`}
            onClick={() => onNavigate('Denials')}
          />
        )}
        {features.denials && (features.underpayments || features.audits) && (
          <Box sx={{ width: '1px', bgcolor: 'divider', flexShrink: 0 }} />
        )}
        {features.underpayments && (
          <ExposureCol
            type="underpayments"
            amount={upAtRisk}
            count={upOpen.length}
            sub1Label="Recovered MTD"
            sub1Value={formatCurrency(upMTD)}
            onClick={() => onNavigate('Underpayments')}
          />
        )}
        {features.underpayments && features.audits && (
          <Box sx={{ width: '1px', bgcolor: 'divider', flexShrink: 0 }} />
        )}
        {features.audits && (
          <ExposureCol
            type="audits"
            amount={auditAtRisk}
            count={openAudits.length}
            sub1Label="Proposed recoupment"
            sub1Value={formatCurrency(auditRecoup)}
            onClick={() => onNavigate('Audits')}
          />
        )}
      </Box>
      {enabledCount >= 2 && (
        <Box sx={{ px: 3, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
            Total Revenue at Risk
          </Typography>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
            {formatCurrency(total)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
            Snapshot as of {formatDate(TODAY_DATE.toISOString())}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

// ── Section B: KPI Tile Row ───────────────────────────────────────────────────

function KpiTile({
  label, value, sub, accentColor = '#64748B', onClick,
}: {
  label: string; value: string; sub?: string; accentColor?: string; onClick?: () => void
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2, borderRadius: 2, flex: 1, minWidth: 130,
        borderLeft: `3px solid ${accentColor}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        '&:hover': onClick ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : {},
      }}
    >
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>{sub}</Typography>
      )}
    </Paper>
  )
}

interface KpiTileRowProps {
  denials: DenialRecord[]
  underpayments: UnderpaymentRecord[]
  audits: AuditRecord[]
  features: FeatureFlags
  onNavigate: (nav: 'Denials' | 'Underpayments' | 'Audits') => void
}

function KpiTileRow({ denials, underpayments, audits, features, onNavigate }: KpiTileRowProps) {
  const enabledCount = [features.denials, features.underpayments, features.audits].filter(Boolean).length

  // Denial metrics
  const openDenials   = denials.filter(d => DENIAL_OPEN.includes(d.state))
  const denialAtRisk  = openDenials.reduce((s, d) => s + d.deniedAmount, 0)
  const dueThisWeek   = openDenials.filter(d => { const days = daysUntil(d.deadline); return days >= 0 && days <= 7 })
  const denialOverdue = openDenials.filter(d => daysUntil(d.deadline) < 0)
  const terminal      = denials.filter(d => d.state === 'Overturned' || d.state === 'Closed')
  const overturned    = terminal.filter(d => d.state === 'Overturned')
  const outcomes      = Object.values(DENIAL_OUTCOMES)
  const totalRecovered  = outcomes.reduce((s, o) => s + o.recoveredAmount, 0)
  const totalWrittenOff = outcomes.reduce((s, o) => s + o.writtenOffAmount, 0)
  const recoveryRate    = totalRecovered + totalWrittenOff > 0
    ? Math.round((totalRecovered / (totalRecovered + totalWrittenOff)) * 100) : 0

  // UP metrics
  const upOpen   = underpayments.filter(u => UP_ACTIVE.includes(u.state))
  const upAtRisk = upOpen.reduce((s, u) => s + u.varianceAmount, 0)
  const upWon    = underpayments.filter(u => u.state === 'Recovered')
  const upRecoveredTotal = upWon.reduce((s, u) => s + (u.recoveredAmount ?? 0), 0)
  const upRecoveredBase  = underpayments.filter(u => u.state === 'Recovered' || u.state === 'Closed').reduce((s, u) => s + u.varianceAmount, 0)
  const upRecoveryRate   = upRecoveredBase > 0 ? Math.round((upRecoveredTotal / upRecoveredBase) * 100) : 0

  // Audit metrics
  const openAudits  = audits.filter(a => AUDIT_ACTIVE.includes(a.state))
  const auditAtRisk = openAudits.reduce((s, a) => s + a.amountAtRisk, 0)
  const auditsDue   = openAudits.filter(a => { const days = daysUntil(a.deadline); return days >= 0 && days <= 14 })
  const auditsOverdue = openAudits.filter(a => daysUntil(a.deadline) < 0)

  // Cross-type total
  const totalAtRisk = (features.denials ? denialAtRisk : 0) + (features.underpayments ? upAtRisk : 0) + (features.audits ? auditAtRisk : 0)

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      {enabledCount >= 2 && (
        <KpiTile
          label="Total Revenue at Risk"
          value={formatCurrency(totalAtRisk)}
          sub={`across ${enabledCount} modules`}
          accentColor="#64748B"
        />
      )}
      {features.denials && (
        <KpiTile label="Open Denials"  value={String(openDenials.length)} sub={`${formatCurrency(denialAtRisk)} at risk`} accentColor={MOD.denials.main} onClick={() => onNavigate('Denials')} />
      )}
      {features.denials && (
        <KpiTile
          label="Denial Recovery Rate"
          value={`${recoveryRate}%`}
          sub="trailing 90 days"
          accentColor={MOD.denials.main}
        />
      )}
      {features.denials && (
        <KpiTile
          label="Due This Week"
          value={String(dueThisWeek.length)}
          sub={denialOverdue.length > 0 ? `${denialOverdue.length} overdue` : 'denials'}
          accentColor={denialOverdue.length > 0 ? '#9B2C2C' : MOD.denials.main}
        />
      )}
      {features.underpayments && (
        <KpiTile label="Variance at Risk" value={formatCurrency(upAtRisk)} sub={`${upOpen.length} active underpayments`} accentColor={MOD.underpayments.main} onClick={() => onNavigate('Underpayments')} />
      )}
      {features.underpayments && (
        <KpiTile label="UP Recovery Rate" value={`${upRecoveryRate}%`} sub={`${formatCurrency(upRecoveredTotal)} recovered`} accentColor={MOD.underpayments.main} />
      )}
      {features.audits && (
        <KpiTile label="Audit Exposure" value={formatCurrency(auditAtRisk)} sub={`${openAudits.length} active audits`} accentColor={MOD.audits.main} onClick={() => onNavigate('Audits')} />
      )}
      {features.audits && (
        <KpiTile
          label="Audits Due (14d)"
          value={String(auditsDue.length)}
          sub={auditsOverdue.length > 0 ? `${auditsOverdue.length} overdue` : 'for response'}
          accentColor={auditsOverdue.length > 0 ? '#9B2C2C' : MOD.audits.main}
        />
      )}
    </Box>
  )
}

// ── Section C: Upcoming Deadlines ────────────────────────────────────────────

type TypeFilter    = 'all' | 'denial' | 'underpayment' | 'audit'
type AssigneeFilter = 'all' | 'mine' | 'unassigned'

function buildDeadlineRows(
  denials: DenialRecord[], underpayments: UnderpaymentRecord[], audits: AuditRecord[],
  features: FeatureFlags, typeFilter: TypeFilter, assigneeFilter: AssigneeFilter,
): DeadlineRow[] {
  const rows: DeadlineRow[] = []
  const windowDays = 30

  if (features.denials && (typeFilter === 'all' || typeFilter === 'denial')) {
    denials
      .filter(d => DENIAL_OPEN.includes(d.state))
      .filter(d => daysUntil(d.deadline) <= windowDays)
      .filter(d => {
        if (assigneeFilter === 'mine')      return d.assignedTo?.initials === CURRENT_USER_INITIALS
        if (assigneeFilter === 'unassigned') return !d.assignedTo
        return true
      })
      .forEach(d => rows.push({
        id: d.id, caseType: 'denial', patientName: d.patient.name, caseId: d.id,
        payer: d.payer, state: d.state, deadline: d.deadline, amount: d.deniedAmount,
        assigneeInitials: d.assignedTo?.initials ?? null, assigneeName: d.assignedTo?.name ?? null,
      }))
  }

  if (features.underpayments && (typeFilter === 'all' || typeFilter === 'underpayment')) {
    underpayments
      .filter(u => UP_ACTIVE.includes(u.state))
      .filter(u => daysUntil(u.deadline) <= windowDays)
      .filter(u => {
        if (assigneeFilter === 'mine')      return u.assignedTo?.initials === CURRENT_USER_INITIALS
        if (assigneeFilter === 'unassigned') return !u.assignedTo
        return true
      })
      .forEach(u => rows.push({
        id: u.id, caseType: 'underpayment', patientName: u.patient.name, caseId: u.id,
        payer: u.payer, state: u.state, deadline: u.deadline, amount: u.varianceAmount,
        assigneeInitials: u.assignedTo?.initials ?? null, assigneeName: u.assignedTo?.name ?? null,
      }))
  }

  if (features.audits && (typeFilter === 'all' || typeFilter === 'audit')) {
    audits
      .filter(a => AUDIT_ACTIVE.includes(a.state))
      .filter(a => daysUntil(a.deadline) <= windowDays)
      .filter(a => {
        if (assigneeFilter === 'mine')      return a.assignedTo?.initials === CURRENT_USER_INITIALS
        if (assigneeFilter === 'unassigned') return !a.assignedTo
        return true
      })
      .forEach(a => rows.push({
        id: a.id, caseType: 'audit', patientName: a.patient.name, caseId: a.id,
        payer: a.payer, state: a.state, deadline: a.deadline, amount: a.amountAtRisk,
        assigneeInitials: a.assignedTo?.initials ?? null, assigneeName: a.assignedTo?.name ?? null,
      }))
  }

  return rows.sort((a, b) => {
    const dA = daysUntil(a.deadline), dB = daysUntil(b.deadline)
    if (dA < 0 && dB >= 0) return -1
    if (dB < 0 && dA >= 0) return 1
    return dA - dB
  })
}

interface UpcomingDeadlinesProps {
  denials: DenialRecord[]
  underpayments: UnderpaymentRecord[]
  audits: AuditRecord[]
  features: FeatureFlags
  showAssigneeFilter?: boolean
  onSelectCase: (type: 'denial' | 'underpayment' | 'audit', id: string) => void
}

function UpcomingDeadlines({ denials, underpayments, audits, features, showAssigneeFilter = true, onSelectCase }: UpcomingDeadlinesProps) {
  const [typeFilter, setTypeFilter]       = useState<TypeFilter>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all')
  const [showAll, setShowAll]             = useState(false)

  const enabledCount = [features.denials, features.underpayments, features.audits].filter(Boolean).length
  const rows = buildDeadlineRows(denials, underpayments, audits, features, typeFilter, assigneeFilter)
  const visible = showAll ? rows : rows.slice(0, 10)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
        <SectionLabel>Upcoming Deadlines</SectionLabel>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {enabledCount >= 2 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {(['all', ...(features.denials ? ['denial'] : []), ...(features.underpayments ? ['underpayment'] : []), ...(features.audits ? ['audit'] : [])] as TypeFilter[]).map(t => (
                <Chip
                  key={t}
                  label={t === 'all' ? 'All' : t === 'denial' ? 'Denials' : t === 'underpayment' ? 'Underpay.' : 'Audits'}
                  size="small"
                  onClick={() => setTypeFilter(t)}
                  sx={{
                    height: 24, fontSize: '0.75rem', cursor: 'pointer',
                    bgcolor: typeFilter === t ? '#1E293B' : 'transparent',
                    color: typeFilter === t ? '#fff' : 'text.secondary',
                    border: '1px solid', borderColor: typeFilter === t ? '#1E293B' : 'divider',
                  }}
                />
              ))}
            </Box>
          )}
          {showAssigneeFilter && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {(['all', 'mine', 'unassigned'] as AssigneeFilter[]).map(a => (
                <Chip
                  key={a}
                  label={a === 'all' ? 'All' : a === 'mine' ? 'Mine' : 'Unassigned'}
                  size="small"
                  onClick={() => setAssigneeFilter(a)}
                  sx={{
                    height: 24, fontSize: '0.75rem', cursor: 'pointer',
                    bgcolor: assigneeFilter === a ? '#e8f2f5' : 'transparent',
                    color: assigneeFilter === a ? '#157d9d' : 'text.secondary',
                    border: '1px solid', borderColor: assigneeFilter === a ? '#b6d7e1' : 'divider',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {visible.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">No upcoming deadlines in the next 30 days</Typography>
        </Box>
      ) : visible.map(row => {
        const days = daysUntil(row.deadline)
        const dc   = deadlineColor(days)
        return (
          <Box
            key={row.id}
            onClick={() => onSelectCase(row.caseType, row.id)}
            sx={{
              px: 2.5, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center',
              borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer',
              '&:last-child': { borderBottom: 'none' },
              '&:hover': { bgcolor: 'grey.50' },
              ...(days < 0 ? { borderLeft: '3px solid #DC2626' } : {}),
            }}
          >
            <TypeBadge type={row.caseType} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.patientName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>{row.payer}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={row.state} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: 'grey.100', color: 'text.secondary' }} />
                {row.assigneeName && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>{row.assigneeName}</Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>{formatCurrency(row.amount)}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mt: 0.25 }}>
                <AccessTimeOutlined sx={{ fontSize: 11, color: dc.text }} />
                <Chip
                  label={`${formatDate(row.deadline)} · ${deadlineLabel(days)}`}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: dc.bg, color: dc.text }}
                />
              </Box>
            </Box>
          </Box>
        )
      })}

      {rows.length > 10 && (
        <Box sx={{ px: 2.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Button size="small" onClick={() => setShowAll(v => !v)} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {showAll ? 'Show less' : `Show ${rows.length - 10} more`}
          </Button>
        </Box>
      )}
    </Paper>
  )
}

// ── Section D: Pipeline by State ─────────────────────────────────────────────

function PipelinePanel({
  type, states, records, onNavigate,
}: {
  type: 'denials' | 'underpayments' | 'audits'
  states: { key: string; label: string; terminal?: boolean }[]
  records: { state: string; amount: number; createdAt: string }[]
  onNavigate: (nav: 'Denials' | 'Underpayments' | 'Audits') => void
}) {
  const m = MOD[type]
  const openRecords = records.filter(r => !states.find(s => s.key === r.state)?.terminal)
  const openCount = openRecords.length
  const openAmount = openRecords.reduce((s, r) => s + r.amount, 0)

  const maxCount = Math.max(...states.map(s => records.filter(r => r.state === s.key).length), 1)

  const navTarget = type === 'denials' ? 'Denials' : type === 'underpayments' ? 'Underpayments' : 'Audits'

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ color: m.main }}>{m.icon}</Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{m.label} Pipeline</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{openCount} open</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: m.main }}>{formatCurrency(openAmount)}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {states.map(({ key, label, terminal }) => {
          const count = records.filter(r => r.state === key).length
          return (
            <Box
              key={key}
              onClick={() => count > 0 && onNavigate(navTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: count > 0 ? 'pointer' : 'default', opacity: terminal ? 0.35 : 1, borderRadius: 1, px: 0.5, py: 0.25, '&:hover': count > 0 ? { bgcolor: m.light } : {} }}
            >
              <Typography variant="body2" sx={{ width: 100, flexShrink: 0, fontSize: '0.775rem', color: 'text.secondary' }}>{label}</Typography>
              <MiniBar fraction={count / maxCount} color={m.main} />
              <Typography variant="body2" sx={{ width: 24, flexShrink: 0, fontWeight: count > 0 ? 700 : 400, textAlign: 'right', fontSize: '0.8rem', color: count > 0 ? 'text.primary' : 'text.disabled' }}>{count}</Typography>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

const DENIAL_PIPELINE_STATES = [
  { key: 'Queue',      label: 'Queue' },
  { key: 'InProgress', label: 'In Progress' },
  { key: 'Submitted',  label: 'Submitted' },
  { key: 'Overturned', label: 'Overturned', terminal: true },
  { key: 'Closed',     label: 'Closed',     terminal: true },
  { key: 'Archive',    label: 'Archived',   terminal: true },
]
const UP_PIPELINE_STATES = [
  { key: 'Active',   label: 'Active' },
  { key: 'Submitted',label: 'Submitted' },
  { key: 'Won',      label: 'Won' },
  { key: 'Recovered',label: 'Recovered', terminal: true },
  { key: 'Closed',   label: 'Closed',    terminal: true },
  { key: 'Archived', label: 'Archived',  terminal: true },
]
const AUDIT_PIPELINE_STATES = [
  { key: 'NoticeReceived', label: 'Notice Received' },
  { key: 'RecordsPending', label: 'Records Pending' },
  { key: 'UnderReview',    label: 'Under Review' },
  { key: 'FindingsIssued', label: 'Findings Issued' },
  { key: 'Disputed',       label: 'Disputed' },
  { key: 'Closed',         label: 'Closed',   terminal: true },
]

interface PipelineByStateProps {
  denials: DenialRecord[]
  underpayments: UnderpaymentRecord[]
  audits: AuditRecord[]
  features: FeatureFlags
  onNavigate: (nav: 'Denials' | 'Underpayments' | 'Audits') => void
}

function PipelineByState({ denials, underpayments, audits, features, onNavigate }: PipelineByStateProps) {
  return (
    <Box>
      <SectionLabel>Pipeline by State</SectionLabel>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {features.denials && (
          <PipelinePanel
            type="denials"
            states={DENIAL_PIPELINE_STATES}
            records={denials.map(d => ({ state: d.state, amount: d.deniedAmount, createdAt: d.createdAt }))}
            onNavigate={onNavigate}
          />
        )}
        {features.underpayments && (
          <PipelinePanel
            type="underpayments"
            states={UP_PIPELINE_STATES}
            records={underpayments.map(u => ({ state: u.state, amount: u.varianceAmount, createdAt: u.createdAt }))}
            onNavigate={onNavigate}
          />
        )}
        {features.audits && (
          <PipelinePanel
            type="audits"
            states={AUDIT_PIPELINE_STATES}
            records={audits.map(a => ({ state: a.state, amount: a.amountAtRisk, createdAt: a.createdAt }))}
            onNavigate={onNavigate}
          />
        )}
      </Box>
    </Box>
  )
}

// ── Section E: Team Workload ──────────────────────────────────────────────────

interface PersonRow {
  name: string
  initials: string
  openDenials: number
  openUPs: number
  openAudits: number
  total: number
  dueThisWeek: number
  overdue: number
  dollarResponsibility: number
}

function TeamWorkload({ denials, underpayments, audits, features }: { denials: DenialRecord[]; underpayments: UnderpaymentRecord[]; audits: AuditRecord[]; features: FeatureFlags }) {
  const [view, setView] = useState<'person' | 'payer'>('person')

  // Build person rows
  const personMap = new Map<string, PersonRow>()
  const getOrCreate = (name: string, initials: string) => {
    if (!personMap.has(name)) personMap.set(name, { name, initials, openDenials: 0, openUPs: 0, openAudits: 0, total: 0, dueThisWeek: 0, overdue: 0, dollarResponsibility: 0 })
    return personMap.get(name)!
  }

  if (features.denials) {
    denials.filter(d => DENIAL_OPEN.includes(d.state)).forEach(d => {
      const p = getOrCreate(d.assignedTo?.name ?? 'Unassigned', d.assignedTo?.initials ?? '—')
      p.openDenials++; p.total++; p.dollarResponsibility += d.deniedAmount
      const days = daysUntil(d.deadline)
      if (days < 0) p.overdue++
      else if (days <= 7) p.dueThisWeek++
    })
  }
  if (features.underpayments) {
    underpayments.filter(u => UP_ACTIVE.includes(u.state)).forEach(u => {
      const p = getOrCreate(u.assignedTo?.name ?? 'Unassigned', u.assignedTo?.initials ?? '—')
      p.openUPs++; p.total++; p.dollarResponsibility += u.varianceAmount
      const days = daysUntil(u.deadline)
      if (days < 0) p.overdue++
      else if (days <= 7) p.dueThisWeek++
    })
  }
  if (features.audits) {
    audits.filter(a => AUDIT_ACTIVE.includes(a.state)).forEach(a => {
      const p = getOrCreate(a.assignedTo?.name ?? 'Unassigned', a.assignedTo?.initials ?? '—')
      p.openAudits++; p.total++; p.dollarResponsibility += a.amountAtRisk
      const days = daysUntil(a.deadline)
      if (days < 0) p.overdue++
      else if (days <= 7) p.dueThisWeek++
    })
  }

  const personRows = [...personMap.values()]
    .sort((a, b) => b.overdue - a.overdue || b.dueThisWeek - a.dueThisWeek || b.total - a.total)
  const assignedRows = personRows.filter(r => r.name !== 'Unassigned')
  const unassigned   = personRows.find(r => r.name === 'Unassigned')

  // Payer view
  interface PayerRow { payer: string; denials: number; denialAmt: number; ups: number; upAmt: number; audits: number; auditAmt: number; total: number; totalAmt: number }
  const payerMap = new Map<string, PayerRow>()
  const getPayer = (payer: string): PayerRow => {
    if (!payerMap.has(payer)) payerMap.set(payer, { payer, denials: 0, denialAmt: 0, ups: 0, upAmt: 0, audits: 0, auditAmt: 0, total: 0, totalAmt: 0 })
    return payerMap.get(payer)!
  }
  if (features.denials) denials.filter(d => DENIAL_OPEN.includes(d.state)).forEach(d => { const p = getPayer(d.payer); p.denials++; p.denialAmt += d.deniedAmount; p.total++; p.totalAmt += d.deniedAmount })
  if (features.underpayments) underpayments.filter(u => UP_ACTIVE.includes(u.state)).forEach(u => { const p = getPayer(u.payer); p.ups++; p.upAmt += u.varianceAmount; p.total++; p.totalAmt += u.varianceAmount })
  if (features.audits) audits.filter(a => AUDIT_ACTIVE.includes(a.state)).forEach(a => { const p = getPayer(a.payer); p.audits++; p.auditAmt += a.amountAtRisk; p.total++; p.totalAmt += a.amountAtRisk })
  const payerRows = [...payerMap.values()].sort((a, b) => b.totalAmt - a.totalAmt)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <SectionLabel>Team Workload</SectionLabel>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="person" sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>By Person</ToggleButton>
          <ToggleButton value="payer"  sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, textTransform: 'none', fontWeight: 600 }}>By Payer</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {view === 'person' ? (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafb' }}>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Team Member</TableCell>
              {features.denials      && <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.denials.main }}>Denials</TableCell>}
              {features.underpayments && <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.underpayments.main }}>UPs</TableCell>}
              {features.audits       && <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.audits.main }}>Audits</TableCell>}
              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Total</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Due / Week</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#9B2C2C' }}>Overdue</TableCell>
              <TableCell align="right"  sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Exposure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignedRows.map(r => (
              <TableRow key={r.name} hover sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ py: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: 'primary.main' }}>{r.initials}</Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>{r.name}</Typography>
                  </Box>
                </TableCell>
                {features.denials       && <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{r.openDenials || '—'}</TableCell>}
                {features.underpayments && <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{r.openUPs || '—'}</TableCell>}
                {features.audits        && <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{r.openAudits || '—'}</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.total}</TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                  {r.dueThisWeek > 0 ? <Chip label={r.dueThisWeek} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E', '& .MuiChip-label': { px: 0.75 } }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                  {r.overdue > 0 ? <Chip label={r.overdue} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FED7D7', color: '#9B2C2C', '& .MuiChip-label': { px: 0.75 } }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(r.dollarResponsibility)}</TableCell>
              </TableRow>
            ))}
            {unassigned && unassigned.total > 0 && (
              <TableRow sx={{ bgcolor: '#FFFBEB', cursor: 'pointer' }}>
                <TableCell sx={{ py: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutlined sx={{ fontSize: 22, color: '#D97706' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400E', fontSize: '0.8125rem' }}>Unassigned</Typography>
                  </Box>
                </TableCell>
                {features.denials       && <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>{unassigned.openDenials || '—'}</TableCell>}
                {features.underpayments && <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>{unassigned.openUPs || '—'}</TableCell>}
                {features.audits        && <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>{unassigned.openAudits || '—'}</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400E' }}>{unassigned.total}</TableCell>
                <TableCell align="center"><Chip label={unassigned.dueThisWeek} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E', '& .MuiChip-label': { px: 0.75 } }} /></TableCell>
                <TableCell align="center">{unassigned.overdue > 0 && <Chip label={unassigned.overdue} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FED7D7', color: '#9B2C2C', '& .MuiChip-label': { px: 0.75 } }} />}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#92400E', fontSize: '0.8rem' }}>{formatCurrency(unassigned.dollarResponsibility)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafb' }}>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Payer</TableCell>
              {features.denials       && <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.denials.main }}>Denials ($)</TableCell>}
              {features.underpayments && <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.underpayments.main }}>Underpayments ($)</TableCell>}
              {features.audits        && <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, color: MOD.audits.main }}>Audits ($)</TableCell>}
              <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>Total Exposure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payerRows.map(r => (
              <TableRow key={r.payer} hover sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', py: 1.25 }}>{r.payer}</TableCell>
                {features.denials       && <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{r.denials > 0 ? `${r.denials} · ${formatCurrency(r.denialAmt)}` : '—'}</TableCell>}
                {features.underpayments && <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{r.ups > 0    ? `${r.ups} · ${formatCurrency(r.upAmt)}` : '—'}</TableCell>}
                {features.audits        && <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{r.audits > 0 ? `${r.audits} · ${formatCurrency(r.auditAmt)}` : '—'}</TableCell>}
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(r.totalAmt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}

// ── Section G: Trends (preserved, collapsible) ────────────────────────────────

function denialRateColor(v: number) { return v >= 25 ? '#FED7D7' : v >= 19 ? '#FEFCBF' : '#C6F6D5' }
function overturnRateColor(v: number) { return v >= 60 ? '#C6F6D5' : v >= 45 ? '#FEFCBF' : '#FED7D7' }
function avgDaysColor(v: number) { return v >= 50 ? '#FED7D7' : v >= 35 ? '#FEFCBF' : '#C6F6D5' }

function InsightBanner() {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FAFBFF' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LightbulbOutlined sx={{ fontSize: 16, color: '#744210' }} />
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
          Key Insights
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {INSIGHTS.map((ins, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
            <Box sx={{ width: 3, flexShrink: 0, borderRadius: 4, bgcolor: ins.color, alignSelf: 'stretch', minHeight: 14 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '0.8125rem' }}>{ins.text}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

function HistoricalPayerScorecard() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>Payer Scorecard (L12M Illustrative)</SectionLabel>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.7rem' }}>Illustrative trend data</Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            {['Payer', 'Denial Rate', 'Overturn Rate', 'Avg Days', 'At-Risk $', 'Behavior'].map(h => (
              <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 1, whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {PAYER_SCORECARD.map(row => (
            <TableRow key={row.payer} hover>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', py: 1.25 }}>{row.payer}</TableCell>
              <TableCell sx={{ py: 1.25 }}><Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: denialRateColor(row.denialRate), fontWeight: 600, fontSize: '0.8rem' }}>{row.denialRate}%</Box></TableCell>
              <TableCell sx={{ py: 1.25 }}><Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: overturnRateColor(row.overturnRate), fontWeight: 600, fontSize: '0.8rem' }}>{row.overturnRate}%</Box></TableCell>
              <TableCell sx={{ py: 1.25 }}><Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: avgDaysColor(row.avgDays), fontWeight: 600, fontSize: '0.8rem' }}>{row.avgDays}d</Box></TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1.25 }}>{formatCurrency(row.atRisk)}</TableCell>
              <TableCell sx={{ py: 1.25 }}><Chip label={row.tag} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 1 }, bgcolor: row.tagBg, color: row.tagColor }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

function FunnelChart() {
  const max = FUNNEL_DATA[0]!.amount
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <SectionLabel>Loss → Recovery Pipeline (YTD Illustrative)</SectionLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {FUNNEL_DATA.map(row => (
          <Box key={row.stage}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.2 }}>{row.stage}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>{row.note}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: row.color, ml: 1 }}>${row.amount}K</Typography>
            </Box>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 12 }}>
              <Box sx={{ width: `${(row.amount / max) * 100}%`, height: 12, borderRadius: 1, bgcolor: row.color, transition: 'width 0.4s ease' }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

function PreventionOpportunities({ denials }: { denials: DenialRecord[] }) {
  // Derive live root causes from denial data
  const typeMap = new Map<string, { count: number; amount: number }>()
  denials.filter(d => DENIAL_OPEN.includes(d.state) || d.state === 'Closed').forEach(d => {
    const e = typeMap.get(d.denialType) ?? { count: 0, amount: 0 }
    typeMap.set(d.denialType, { count: e.count + 1, amount: e.amount + d.deniedAmount })
  })
  const liveTop5 = [...typeMap.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>Upstream Prevention Opportunities</SectionLabel>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>Ranked by annual savings projection</Typography>
      </Box>
      {PREVENTION_OPPS.map((opp, idx) => {
        const live = liveTop5[idx]
        const ownerStyle = PREVENTION_OWNER_COLORS[opp.owner] ?? { bg: '#EDF2F7', color: '#2D3748' }
        return (
          <Box key={opp.rank} sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.disabled', width: 16, flexShrink: 0 }}>#{opp.rank}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.3 }}>{opp.opportunity}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {live ? `${live[1].count} cases · ${formatCurrency(live[1].amount)} in system` : opp.type}
              </Typography>
            </Box>
            <Chip label={opp.owner} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, flexShrink: 0, bgcolor: ownerStyle.bg, color: ownerStyle.color }} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#22543D', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>{formatCurrency(opp.saving)}</Typography>
          </Box>
        )
      })}
    </Paper>
  )
}

function MetricExplorer() {
  const [yMetric, setYMetric]     = useState<YMetric>('Denied Amount')
  const [xDim, setXDim]           = useState<XDimension>('Payer')
  const [chartType, setChartType] = useState<ChartType>('Bar')

  const data    = EXPLORER_DATA[xDim]
  const dataKey = METRIC_KEY[yMetric]
  const unit    = METRIC_UNIT[yMetric]
  const fmt     = (v: number) => formatMetric(yMetric, v)

  const scatterPoints = EXPLORER_BY_PAYER.map((d, i) => ({
    x: d.volume, y: d[dataKey as keyof typeof d] as number, z: d.deniedAmount / 1000,
    label: d.x, color: EXPLORER_COLORS[i % EXPLORER_COLORS.length]!,
  }))

  const controls = (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {chartType !== 'Scatter' && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>X Axis</InputLabel>
          <Select value={xDim} label="X Axis" onChange={e => setXDim(e.target.value as XDimension)} sx={{ fontSize: '0.8rem' }}>
            {(['Payer', 'Denial Type', 'Month', 'Service Line'] as XDimension[]).map(d => <MenuItem key={d} value={d} sx={{ fontSize: '0.8rem' }}>{d}</MenuItem>)}
          </Select>
        </FormControl>
      )}
      <FormControl size="small" sx={{ minWidth: 155 }}>
        <InputLabel sx={{ fontSize: '0.75rem' }}>Y Metric</InputLabel>
        <Select value={yMetric} label="Y Metric" onChange={e => setYMetric(e.target.value as YMetric)} sx={{ fontSize: '0.8rem' }}>
          {(['Denied Amount', 'Volume', 'Overturn Rate', 'Days to Resolution', 'Recovery Rate'] as YMetric[]).map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>)}
        </Select>
      </FormControl>
      <ToggleButtonGroup value={chartType} exclusive onChange={(_, v) => v && setChartType(v as ChartType)} size="small">
        {(['Bar', 'Line', 'Scatter'] as ChartType[]).map(t => <ToggleButton key={t} value={t} sx={{ fontSize: '0.75rem', px: 1.5, py: 0.625, textTransform: 'none', fontWeight: 600 }}>{t}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
  )

  return (
    <ChartCard title="Metric Explorer (Illustrative)" height={280} action={controls}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'Scatter' ? (
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="x" name="Volume" type="number" tick={{ fontSize: 11 }} label={{ value: 'Denial Volume', position: 'insideBottom', offset: -4, fontSize: 11 }} />
            <YAxis dataKey="y" name={yMetric} type="number" tick={{ fontSize: 11 }} tickFormatter={v => unit === '$' ? formatCurrency(v) : `${v}${unit}`} />
            <ZAxis dataKey="z" range={[60, 400]} name="Denied $K" />
            <RTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12, borderRadius: 8 }}
              content={({ payload }) => {
                if (!payload?.length) return null
                const p = payload[0]?.payload as typeof scatterPoints[0]
                if (!p) return null
                return <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, fontSize: '0.75rem' }}><Typography sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>{p.label}</Typography><Box>Volume: {p.x}</Box><Box>{yMetric}: {fmt(p.y)}</Box><Box>Denied: {formatCurrency(p.z * 1000)}</Box></Box>
              }}
            />
            <ReferenceLine y={scatterPoints.reduce((s, d) => s + d.y, 0) / scatterPoints.length} stroke="#9B2C2C" strokeDasharray="4 2" label={{ value: 'Avg', position: 'insideTopRight', fontSize: 10, fill: '#9B2C2C' }} />
            {scatterPoints.map((point, i) => <Scatter key={i} data={[point]} fill={point.color} opacity={0.85} />)}
          </ScatterChart>
        ) : chartType === 'Line' ? (
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => unit === '$' ? formatCurrency(v) : `${v}${unit}`} />
            <RTooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line dataKey={dataKey} stroke="#2C5282" strokeWidth={2} dot={{ r: 4, fill: '#2C5282' }} activeDot={{ r: 5 }} name={yMetric} />
          </LineChart>
        ) : (
          <BarChart data={data} barSize={28} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => unit === '$' ? formatCurrency(v) : `${v}${unit}`} />
            <RTooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} name={yMetric}>
              {data.map((_, i) => <Cell key={i} fill={EXPLORER_COLORS[i % EXPLORER_COLORS.length]!} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  )
}

function AgingAndWriteoffRisk() {
  const totalAtRisk   = AGING_DATA.reduce((s, d) => s + d.amount, 0)
  const totalWriteoff = AGING_DATA.reduce((s, d) => s + d.writeoff, 0)
  const maxAmount     = Math.max(...AGING_DATA.map(d => d.amount))
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <SectionLabel>Denial Aging & Write-off Risk (Illustrative)</SectionLabel>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>Total at Risk</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#9B2C2C' }}>{formatCurrency(totalAtRisk)}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {AGING_DATA.map(row => (
          <Box key={row.bucket}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', minWidth: 90 }}>{row.bucket}</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#9B2C2C' }}>{formatCurrency(row.writeoff)} write-off risk</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 52, textAlign: 'right' }}>{formatCurrency(row.amount)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, height: 10 }}>
              <Box sx={{ width: `${((row.amount - row.writeoff) / maxAmount) * 100}%`, bgcolor: row.bucket === '0–30 days' ? '#276749' : row.bucket === '31–60 days' ? '#3182CE' : '#C05621', borderRadius: '3px 0 0 3px' }} />
              <Box sx={{ width: `${(row.writeoff / maxAmount) * 100}%`, bgcolor: '#9B2C2C', opacity: 0.7, borderRadius: '0 3px 3px 0' }} />
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Box sx={{ width: 12, height: 8, bgcolor: '#276749', borderRadius: 0.5 }} /><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Recoverable</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Box sx={{ width: 12, height: 8, bgcolor: '#9B2C2C', opacity: 0.7, borderRadius: 0.5 }} /><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Projected write-off</Typography></Box>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#9B2C2C', fontSize: '0.75rem' }}>{formatCurrency(totalWriteoff)} projected write-off</Typography>
      </Box>
    </Paper>
  )
}

function TrendsSection({ denials, features }: { denials: DenialRecord[]; features: FeatureFlags }) {
  return (
    <Accordion variant="outlined" sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ px: 2.5, py: 1 }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>Trends &amp; Prevention</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>Payer scorecard, recovery funnel, aging risk, metric explorer</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, bgcolor: '#FFFBEB', borderRadius: 1.5, border: '1px solid #FDE68A' }}>
          <Typography variant="caption" sx={{ color: '#92400E', fontSize: '0.75rem' }}>
            Trend charts below use illustrative 12-month data for demo purposes.
            Live pipeline metrics appear in the sections above.
          </Typography>
        </Box>
        <InsightBanner />
        <HistoricalPayerScorecard />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
          <FunnelChart />
          <ChartCard title="Monthly Volume & Overturn Rate" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={EXPLORER_BY_MONTH} margin={{ top: 5, right: 24, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="x" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="vol" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, name: string) => name === 'Overturn Rate' ? `${v}%` : v} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="#BEE3F8" radius={[3, 3, 0, 0]} barSize={20} />
                <Line yAxisId="rate" dataKey="overturnRate" name="Overturn Rate" stroke="#22543D" strokeWidth={2} dot={{ r: 3, fill: '#22543D' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
        {features.denials && <PreventionOpportunities denials={denials} />}
        <MetricExplorer />
        <AgingAndWriteoffRisk />
      </AccordionDetails>
    </Accordion>
  )
}

// ── FrontlineWorker View ──────────────────────────────────────────────────────

interface FWQueueItem {
  id: string
  caseType: 'denial' | 'underpayment' | 'audit'
  patientName: string
  caseId: string
  payer: string
  state: string
  deadline: string
  amount: number
  urgencyTier: 1 | 2 | 3 | 4
}

function buildFWQueue(denials: DenialRecord[], underpayments: UnderpaymentRecord[], audits: AuditRecord[], features: FeatureFlags): FWQueueItem[] {
  const items: FWQueueItem[] = []

  const tier = (deadline: string): 1 | 2 | 3 | 4 => {
    const d = daysUntil(deadline)
    if (d < 0)  return 1
    if (d <= 2) return 2
    if (d <= 7) return 3
    return 4
  }

  if (features.denials) {
    denials.filter(d => DENIAL_OPEN.includes(d.state) && d.assignedTo?.initials === CURRENT_USER_INITIALS).forEach(d => items.push({
      id: d.id, caseType: 'denial', patientName: d.patient.name, caseId: d.id,
      payer: d.payer, state: d.state, deadline: d.deadline, amount: d.deniedAmount,
      urgencyTier: tier(d.deadline),
    }))
  }
  if (features.underpayments) {
    underpayments.filter(u => UP_OPEN.includes(u.state) && u.assignedTo?.initials === CURRENT_USER_INITIALS).forEach(u => items.push({
      id: u.id, caseType: 'underpayment', patientName: u.patient.name, caseId: u.id,
      payer: u.payer, state: u.state, deadline: u.deadline, amount: u.varianceAmount,
      urgencyTier: tier(u.deadline),
    }))
  }
  if (features.audits) {
    audits.filter(a => AUDIT_ACTIVE.includes(a.state) && a.assignedTo?.initials === CURRENT_USER_INITIALS).forEach(a => items.push({
      id: a.id, caseType: 'audit', patientName: a.patient.name, caseId: a.id,
      payer: a.payer, state: a.state, deadline: a.deadline, amount: a.amountAtRisk,
      urgencyTier: tier(a.deadline),
    }))
  }

  return items.sort((a, b) => a.urgencyTier - b.urgencyTier || b.amount - a.amount)
}

const TIER_BORDER: Record<number, string> = { 1: '#DC2626', 2: '#EA580C', 3: '#CA8A04', 4: 'transparent' }

function FrontlineView({ denials, underpayments, audits, features, onSelectCase }: {
  denials: DenialRecord[]; underpayments: UnderpaymentRecord[]; audits: AuditRecord[];
  features: FeatureFlags; onSelectCase: (type: 'denial' | 'underpayment' | 'audit', id: string) => void
}) {
  const enabledCount = [features.denials, features.underpayments, features.audits].filter(Boolean).length
  const [typeFilter, setTypeFilter] = useState<'all' | 'denial' | 'underpayment' | 'audit'>('all')

  const allItems = buildFWQueue(denials, underpayments, audits, features)
  const items = allItems.filter(item => typeFilter === 'all' || item.caseType === typeFilter)

  // W2: upcoming deadlines grouped by bucket
  const myDeadlines = buildDeadlineRows(denials, underpayments, audits, features, 'all', 'mine')

  const buckets: { label: string; items: DeadlineRow[] }[] = []
  const today = myDeadlines.filter(r => { const d = daysUntil(r.deadline); return d < 0 })
  const tomorrow = myDeadlines.filter(r => daysUntil(r.deadline) === 0 || daysUntil(r.deadline) === 1)
  const thisWeek  = myDeadlines.filter(r => { const d = daysUntil(r.deadline); return d >= 2 && d <= 7 })
  const nextWeek  = myDeadlines.filter(r => { const d = daysUntil(r.deadline); return d >= 8 && d <= 14 })
  const later     = myDeadlines.filter(r => { const d = daysUntil(r.deadline); return d > 14 })

  if (today.length)    buckets.push({ label: 'Overdue', items: today })
  if (tomorrow.length) buckets.push({ label: `Today / Tomorrow (${formatDate(TODAY_DATE.toISOString())})`, items: tomorrow })
  if (thisWeek.length) buckets.push({ label: 'This Week', items: thisWeek })
  if (nextWeek.length) buckets.push({ label: 'Next Week', items: nextWeek })
  if (later.length)    buckets.push({ label: 'Later', items: later })

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflow: 'auto', flex: 1 }}>

      {/* W1: My Queue Today */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>Your Queue</Typography>
            <Typography variant="caption" color="text.secondary">{allItems.length} open cases assigned to you</Typography>
          </Box>
          {enabledCount >= 2 && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              {(['all', ...(features.denials ? ['denial'] : []), ...(features.underpayments ? ['underpayment'] : []), ...(features.audits ? ['audit'] : [])] as const).map(t => (
                <Chip
                  key={t}
                  label={t === 'all' ? 'All' : t === 'denial' ? 'Denials' : t === 'underpayment' ? 'Underpay.' : 'Audits'}
                  size="small"
                  onClick={() => setTypeFilter(t as typeof typeFilter)}
                  sx={{
                    height: 24, fontSize: '0.75rem', cursor: 'pointer',
                    bgcolor: typeFilter === t ? '#1E293B' : 'transparent',
                    color: typeFilter === t ? '#fff' : 'text.secondary',
                    border: '1px solid', borderColor: typeFilter === t ? '#1E293B' : 'divider',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>You have no cases assigned to you right now.</Typography>
            <Typography variant="body2" color="text.secondary">Cases assigned to you will appear here automatically.</Typography>
          </Box>
        ) : items.map(item => {
          const days = daysUntil(item.deadline)
          const dc   = deadlineColor(days)
          return (
            <Box
              key={item.id}
              onClick={() => onSelectCase(item.caseType, item.id)}
              sx={{
                px: 2.5, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer',
                borderLeft: `3px solid ${TIER_BORDER[item.urgencyTier]}`,
                '&:last-child': { borderBottom: 'none' },
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <TypeBadge type={item.caseType} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.patientName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{item.payer}</Typography>
                </Box>
                <Chip label={item.state} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: 'grey.100', color: 'text.secondary' }} />
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</Typography>
                <Chip
                  label={`${formatDate(item.deadline)} · ${deadlineLabel(days)}`}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, mt: 0.25, '& .MuiChip-label': { px: 0.75 }, bgcolor: dc.bg, color: dc.text }}
                />
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={e => { e.stopPropagation(); onSelectCase(item.caseType, item.id) }}
                sx={{ flexShrink: 0, fontSize: '0.7rem', py: 0.375, px: 1, textTransform: 'none', fontWeight: 600, borderRadius: 1 }}
              >
                Open
              </Button>
            </Box>
          )
        })}
      </Paper>

      {/* W2: My Upcoming Deadlines */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>Your Upcoming Deadlines</Typography>
          <Typography variant="caption" color="text.secondary">Next 30 days</Typography>
        </Box>

        {buckets.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">No upcoming deadlines</Typography>
          </Box>
        ) : buckets.map(bucket => (
          <Box key={bucket.label}>
            <Box sx={{ px: 2.5, py: 0.75, bgcolor: '#f8fafb', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: bucket.label === 'Overdue' ? '#9B2C2C' : 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {bucket.label}
              </Typography>
            </Box>
            {bucket.items.map(row => {
              const days = daysUntil(row.deadline)
              const dc   = deadlineColor(days)
              return (
                <Box
                  key={row.id}
                  onClick={() => onSelectCase(row.caseType, row.id)}
                  sx={{ px: 2.5, py: 1.25, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }, '&:last-child': { borderBottom: 'none' } }}
                >
                  <TypeBadge type={row.caseType} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.patientName}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.payer} · {formatCurrency(row.amount)}</Typography>
                  </Box>
                  <Chip label={`${formatDate(row.deadline)} · ${deadlineLabel(days)}`} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: dc.bg, color: dc.text }} />
                </Box>
              )
            })}
          </Box>
        ))}
      </Paper>
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage({ denials, underpayments, audits, features, userRole, onNavigate, onSelectCase }: DashboardPageProps) {

  if (userRole === 'FrontlineWorker') {
    return (
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <FrontlineView denials={denials} underpayments={underpayments} audits={audits} features={features} onSelectCase={onSelectCase} />
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* A: Revenue Exposure Summary */}
        <RevenueExposureSummary denials={denials} underpayments={underpayments} audits={audits} features={features} onNavigate={onNavigate} />

        {/* B: KPI Tiles */}
        <KpiTileRow denials={denials} underpayments={underpayments} audits={audits} features={features} onNavigate={onNavigate} />

        {/* C: Upcoming Deadlines */}
        <UpcomingDeadlines denials={denials} underpayments={underpayments} audits={audits} features={features} onSelectCase={onSelectCase} />

        {/* D: Pipeline by State */}
        <PipelineByState denials={denials} underpayments={underpayments} audits={audits} features={features} onNavigate={onNavigate} />

        {/* E: Team Workload */}
        <TeamWorkload denials={denials} underpayments={underpayments} audits={audits} features={features} />

        {/* G: Trends (collapsible) */}
        <TrendsSection denials={denials} features={features} />

      </Box>
    </Box>
  )
}
