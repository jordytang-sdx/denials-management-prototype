import { useState } from 'react'
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Avatar,
  Select, MenuItem, FormControl, InputLabel,
  ToggleButtonGroup, ToggleButton, Table, TableBody,
  TableCell, TableHead, TableRow,
} from '@mui/material'
import {
  AccessTimeOutlined, PersonOutlined,
  LightbulbOutlined,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, ScatterChart, Scatter, ZAxis, ReferenceLine,
  ComposedChart,
} from 'recharts'
import { TEAM_MEMBERS, type DenialRecord, type DenialState } from '../data/denials'
import { DENIAL_OUTCOMES, type OutcomeDisposition } from '../data/denialDetail'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY_DATE = new Date('2026-04-03')
const isTerminal = (s: string) => s === 'Won' || s === 'Recovered' || s === 'Closed' || s === 'Archived'

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - TODAY_DATE.getTime()) / 86400000)
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

// ── Colors ────────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  Intake: '#718096', Active: '#2C5282', Submitted: '#276749', Won: '#22543D', Recovered: '#14532D', Closed: '#A0AEC0',
}

type DispositionGroup = 'Overturned' | 'Upheld' | 'Will Not Appeal' | 'Other'
const PIE_COLORS: Record<DispositionGroup, string> = {
  'Overturned':      '#22543D',
  'Upheld':          '#9B2C2C',
  'Will Not Appeal': '#744210',
  'Other':           '#2C5282',
}
const DISPOSITION_MAP: Record<OutcomeDisposition, DispositionGroup> = {
  overturned_full: 'Overturned', overturned_partial: 'Overturned',
  will_not_appeal: 'Will Not Appeal', upheld: 'Upheld',
  settled_partial: 'Other', corrected_paid: 'Other', secondary_paid: 'Other',
}

// ── Static Trends data ────────────────────────────────────────────────────────

const PAYER_SCORECARD = [
  { payer: 'BCBS',            denialRate: 18.2, overturnRate: 64, avgDays: 28, atRisk: 142000, tag: 'Improving',      tagColor: '#22543D', tagBg: '#C6F6D5' },
  { payer: 'UnitedHealthcare',denialRate: 22.4, overturnRate: 41, avgDays: 45, atRisk: 218000, tag: 'Aggressive',     tagColor: '#9B2C2C', tagBg: '#FED7D7' },
  { payer: 'Cigna',           denialRate: 16.8, overturnRate: 58, avgDays: 32, atRisk:  87000, tag: 'Consistent',     tagColor: '#2C5282', tagBg: '#BEE3F8' },
  { payer: 'Aetna',           denialRate: 19.1, overturnRate: 53, avgDays: 38, atRisk: 165000, tag: 'Worsening',      tagColor: '#744210', tagBg: '#FEFCBF' },
  { payer: 'Humana',          denialRate: 14.3, overturnRate: 71, avgDays: 22, atRisk:  54000, tag: 'Best Performer', tagColor: '#1A365D', tagBg: '#BEE3F8' },
  { payer: 'Palmetto GBA',    denialRate: 28.7, overturnRate: 38, avgDays: 62, atRisk: 312000, tag: 'High Risk',      tagColor: '#9B2C2C', tagBg: '#FED7D7' },
]

// Funnel: all stages as bars relative to gross denied
const FUNNEL_DATA = [
  { stage: 'Gross Denied',        amount: 985, color: '#2C5282', note: 'Starting point' },
  { stage: 'Appealed',            amount: 803, color: '#553C9A', note: '82% of gross' },
  { stage: 'Overturned',          amount: 429, color: '#22543D', note: '44% of gross — recovered' },
  { stage: 'Not Appealed',        amount: 182, color: '#9B2C2C', note: 'Immediate write-off, not pursued' },
  { stage: 'Appealed & Upheld',   amount: 247, color: '#C05621', note: 'Lost on appeal' },
  { stage: 'Outstanding / Residual', amount: 127, color: '#718096', note: 'Still unresolved' },
]

const PREVENTION_OPPS = [
  { rank: 1, opportunity: 'Strengthen CDI for sepsis / respiratory criteria',   owner: 'CDI',    saving: 164000, type: 'Medical Necessity' },
  { rank: 2, opportunity: 'Fix DRG coding workflow for CC/MCC capture',         owner: 'Coding', saving: 141000, type: 'DRG Downgrade' },
  { rank: 3, opportunity: 'Improve physician documentation for LOS justification', owner: 'CDI', saving:  98000, type: 'Medical Necessity' },
  { rank: 4, opportunity: 'Standardize ADR response process for Medicare',      owner: 'Coding', saving:  73000, type: 'ADR' },
]

const PREVENTION_OWNER_COLORS: Record<string, { bg: string; color: string }> = {
  CDI:     { bg: '#BEE3F8', color: '#2C5282' },
  Auth:    { bg: '#FEFCBF', color: '#744210' },
  Coding:  { bg: '#C6F6D5', color: '#22543D' },
  Billing: { bg: '#FED7D7', color: '#9B2C2C' },
}

const AGING_DATA = [
  { bucket: '0–30 days',  amount: 187000, writeoff: 12000 },
  { bucket: '31–60 days', amount: 142000, writeoff: 35000 },
  { bucket: '61–90 days', amount:  98000, writeoff: 58000 },
  { bucket: '91–120 days',amount:  64000, writeoff: 48000 },
  { bucket: '120+ days',  amount:  43000, writeoff: 38000 },
]

// Metric Explorer datasets
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
  { x: 'DRG Downgrade', deniedAmount: 164000, volume: 28, overturnRate: 68, avgDays: 29, recoveryRate: 74 },
  { x: 'ADR',           deniedAmount:  89000, volume: 22, overturnRate: 71, avgDays: 24, recoveryRate: 78 },
  { x: 'Recoupment',    deniedAmount:  72000, volume: 14, overturnRate: 49, avgDays: 45, recoveryRate: 52 },
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
  { x: 'Inpatient',   deniedAmount: 412000, volume: 68, overturnRate: 56, avgDays: 42, recoveryRate: 61 },
  { x: 'Outpatient',  deniedAmount: 218000, volume: 83, overturnRate: 61, avgDays: 28, recoveryRate: 67 },
  { x: 'ED',          deniedAmount:  97000, volume: 44, overturnRate: 48, avgDays: 19, recoveryRate: 54 },
  { x: 'Behavioral',  deniedAmount:  74000, volume: 22, overturnRate: 42, avgDays: 35, recoveryRate: 49 },
  { x: 'Radiology',   deniedAmount:  54000, volume: 35, overturnRate: 63, avgDays: 22, recoveryRate: 70 },
  { x: 'Surgery',     deniedAmount: 123000, volume: 29, overturnRate: 52, avgDays: 38, recoveryRate: 58 },
]

type YMetric = 'Denied Amount' | 'Volume' | 'Overturn Rate' | 'Days to Resolution' | 'Recovery Rate'
type XDimension = 'Payer' | 'Denial Type' | 'Month' | 'Service Line'
type ChartType = 'Bar' | 'Line' | 'Scatter'

const METRIC_KEY: Record<YMetric, string> = {
  'Denied Amount':      'deniedAmount',
  'Volume':             'volume',
  'Overturn Rate':      'overturnRate',
  'Days to Resolution': 'avgDays',
  'Recovery Rate':      'recoveryRate',
}

const METRIC_UNIT: Record<YMetric, string> = {
  'Denied Amount':      '$',
  'Volume':             '',
  'Overturn Rate':      '%',
  'Days to Resolution': 'd',
  'Recovery Rate':      '%',
}

function formatMetric(metric: YMetric, v: number): string {
  if (metric === 'Denied Amount') return formatCurrency(v)
  if (metric === 'Overturn Rate' || metric === 'Recovery Rate') return `${v}%`
  if (metric === 'Days to Resolution') return `${v}d`
  return `${v}`
}

const EXPLORER_DATA: Record<XDimension, typeof EXPLORER_BY_PAYER> = {
  'Payer':        EXPLORER_BY_PAYER,
  'Denial Type':  EXPLORER_BY_TYPE,
  'Month':        EXPLORER_BY_MONTH,
  'Service Line': EXPLORER_BY_SERVICE,
}

const EXPLORER_COLORS = ['#2C5282', '#22543D', '#744210', '#553C9A', '#9B2C2C', '#276749']

// Scatter: payer bubbles (volume vs selected Y metric, size = deniedAmount)
const SCATTER_DATA = EXPLORER_BY_PAYER.map((d, i) => ({
  label: d.x,
  x: d.volume,
  y: d,
  color: EXPLORER_COLORS[i % EXPLORER_COLORS.length]!,
}))

// ── Shared components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
      {children}
    </Typography>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </Paper>
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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <SectionLabel>{label}</SectionLabel>
      <Typography sx={{ fontSize: '1.625rem', fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>{sub}</Typography>}
    </Paper>
  )
}

function MiniBar({ fraction, color }: { fraction: number; color: string }) {
  return (
    <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 1.5, height: 6 }}>
      <Box sx={{ width: `${Math.max(fraction * 100, fraction > 0 ? 2 : 0)}%`, height: 6, borderRadius: 1.5, bgcolor: color, transition: 'width 0.3s' }} />
    </Box>
  )
}

// ── Trends sub-components ─────────────────────────────────────────────────────

const INSIGHTS = [
  { text: 'Palmetto GBA denials up 34% QoQ — 62-day avg resolution is 2× the system average; escalate to exec review.', color: '#9B2C2C' },
  { text: 'DRG Downgrade overturn rate at 68% — MS-DRG 470/480-series appeals are high-yield; prioritize physician attestation.', color: '#22543D' },
  { text: 'ADR response rate improved to 71% overturn — standardized Medicare documentation packages are driving results.', color: '#744210' },
  { text: 'BCBS overturn rate improved from 51% → 64% over 6 months — CDI protocol changes are working.', color: '#2C5282' },
]

function InsightBanner() {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FAFBFF', borderColor: 'divider' }}>
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
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5, fontSize: '0.8125rem' }}>
              {ins.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

function denialRateColor(v: number) {
  if (v >= 25) return '#FED7D7'
  if (v >= 19) return '#FEFCBF'
  return '#C6F6D5'
}
function overturnRateColor(v: number) {
  if (v >= 60) return '#C6F6D5'
  if (v >= 45) return '#FEFCBF'
  return '#FED7D7'
}
function avgDaysColor(v: number) {
  if (v >= 50) return '#FED7D7'
  if (v >= 35) return '#FEFCBF'
  return '#C6F6D5'
}

function PayerScorecard() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <SectionLabel>Payer Scorecard</SectionLabel>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            {['Payer', 'Denial Rate', 'Overturn Rate', 'Avg Days to Decision', 'At-Risk $', 'Behavior'].map(h => (
              <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 1, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {PAYER_SCORECARD.map(row => (
            <TableRow key={row.payer} hover>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', py: 1.25 }}>{row.payer}</TableCell>
              <TableCell sx={{ fontSize: '0.8rem', py: 1.25 }}>
                <Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: denialRateColor(row.denialRate), fontWeight: 600 }}>
                  {row.denialRate}%
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem', py: 1.25 }}>
                <Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: overturnRateColor(row.overturnRate), fontWeight: 600 }}>
                  {row.overturnRate}%
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem', py: 1.25 }}>
                <Box sx={{ display: 'inline-block', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: avgDaysColor(row.avgDays), fontWeight: 600 }}>
                  {row.avgDays}d
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.25 }}>{formatCurrency(row.atRisk)}</TableCell>
              <TableCell sx={{ py: 1.25 }}>
                <Chip
                  label={row.tag}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 1 },
                    bgcolor: row.tagBg, color: row.tagColor,
                  }}
                />
              </TableCell>
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
      <SectionLabel>Loss → Recovery Pipeline (YTD)</SectionLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {FUNNEL_DATA.map(row => (
          <Box key={row.stage}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.2 }}>
                  {row.stage}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                  {row.note}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: row.color, flexShrink: 0, ml: 1 }}>
                ${row.amount}K
              </Typography>
            </Box>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 12 }}>
              <Box sx={{
                width: `${(row.amount / max) * 100}%`,
                height: 12, borderRadius: 1,
                bgcolor: row.color,
                transition: 'width 0.4s ease',
              }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

function PreventionOpportunities() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>Upstream Prevention Opportunities</SectionLabel>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>Ranked by projected annual savings</Typography>
      </Box>
      {PREVENTION_OPPS.map((opp) => {
        const ownerStyle = PREVENTION_OWNER_COLORS[opp.owner] ?? { bg: '#EDF2F7', color: '#2D3748' }
        return (
          <Box
            key={opp.rank}
            sx={{
              px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 2,
              borderTop: '1px solid', borderColor: 'divider',
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.disabled', width: 16, flexShrink: 0 }}>
              #{opp.rank}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.3 }}>
                {opp.opportunity}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{opp.type}</Typography>
            </Box>
            <Chip
              label={opp.owner}
              size="small"
              sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, flexShrink: 0, bgcolor: ownerStyle.bg, color: ownerStyle.color }}
            />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#22543D', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
              {formatCurrency(opp.saving)}
            </Typography>
          </Box>
        )
      })}
    </Paper>
  )
}

function MetricExplorer() {
  const [yMetric, setYMetric] = useState<YMetric>('Denied Amount')
  const [xDim, setXDim]       = useState<XDimension>('Payer')
  const [chartType, setChartType] = useState<ChartType>('Bar')

  const data = EXPLORER_DATA[xDim]
  const dataKey = METRIC_KEY[yMetric]
  const unit    = METRIC_UNIT[yMetric]
  const fmt     = (v: number) => formatMetric(yMetric, v)

  // Scatter data: always by payer, X=volume, Y=selected metric
  const scatterPoints = EXPLORER_BY_PAYER.map((d, i) => ({
    x: d.volume,
    y: d[dataKey as keyof typeof d] as number,
    z: d.deniedAmount / 1000,
    label: d.x,
    color: EXPLORER_COLORS[i % EXPLORER_COLORS.length]!,
  }))

  const controls = (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {chartType !== 'Scatter' && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>X Axis</InputLabel>
          <Select
            value={xDim}
            label="X Axis"
            onChange={e => setXDim(e.target.value as XDimension)}
            sx={{ fontSize: '0.8rem' }}
          >
            {(['Payer', 'Denial Type', 'Month', 'Service Line'] as XDimension[]).map(d => (
              <MenuItem key={d} value={d} sx={{ fontSize: '0.8rem' }}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <FormControl size="small" sx={{ minWidth: 155 }}>
        <InputLabel sx={{ fontSize: '0.75rem' }}>Y Metric</InputLabel>
        <Select
          value={yMetric}
          label="Y Metric"
          onChange={e => setYMetric(e.target.value as YMetric)}
          sx={{ fontSize: '0.8rem' }}
        >
          {(['Denied Amount', 'Volume', 'Overturn Rate', 'Days to Resolution', 'Recovery Rate'] as YMetric[]).map(m => (
            <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={(_, v) => v && setChartType(v as ChartType)}
        size="small"
      >
        {(['Bar', 'Line', 'Scatter'] as ChartType[]).map(t => (
          <ToggleButton key={t} value={t} sx={{ fontSize: '0.75rem', px: 1.5, py: 0.625, textTransform: 'none', fontWeight: 600 }}>
            {t}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )

  return (
    <ChartCard title="Metric Explorer" height={280} action={controls}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'Scatter' ? (
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="x" name="Volume" type="number" tick={{ fontSize: 11 }} label={{ value: 'Denial Volume', position: 'insideBottom', offset: -4, fontSize: 11 }} />
            <YAxis dataKey="y" name={yMetric} type="number" tick={{ fontSize: 11 }} tickFormatter={v => unit === '$' ? formatCurrency(v) : `${v}${unit}`} />
            <ZAxis dataKey="z" range={[60, 400]} name="Denied $K" />
            <RTooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              content={({ payload }) => {
                if (!payload?.length) return null
                const p = payload[0]?.payload as typeof scatterPoints[0]
                if (!p) return null
                return (
                  <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, fontSize: '0.75rem' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>{p.label}</Typography>
                    <Box>Volume: {p.x}</Box>
                    <Box>{yMetric}: {fmt(p.y)}</Box>
                    <Box>Denied: {formatCurrency(p.z * 1000)}</Box>
                  </Box>
                )
              }}
            />
            <ReferenceLine
              y={scatterPoints.reduce((s, d) => s + d.y, 0) / scatterPoints.length}
              stroke="#9B2C2C" strokeDasharray="4 2"
              label={{ value: 'Avg', position: 'insideTopRight', fontSize: 10, fill: '#9B2C2C' }}
            />
            {scatterPoints.map((point, i) => (
              <Scatter
                key={i}
                data={[point]}
                fill={point.color}
                opacity={0.85}
              />
            ))}
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
              {data.map((_, i) => (
                <Cell key={i} fill={EXPLORER_COLORS[i % EXPLORER_COLORS.length]!} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  )
}

function AgingAndWriteoffRisk() {
  const totalAtRisk     = AGING_DATA.reduce((s, d) => s + d.amount, 0)
  const totalProjected  = AGING_DATA.reduce((s, d) => s + d.writeoff, 0)
  const maxAmount       = Math.max(...AGING_DATA.map(d => d.amount))

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <SectionLabel>Denial Aging & Write-off Risk</SectionLabel>
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
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#9B2C2C' }}>
                  {formatCurrency(row.writeoff)} projected write-off
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 52, textAlign: 'right' }}>
                  {formatCurrency(row.amount)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, height: 10 }}>
              {/* recovery portion */}
              <Box sx={{
                width: `${((row.amount - row.writeoff) / maxAmount) * 100}%`,
                bgcolor: row.bucket === '0–30 days' ? '#276749' : row.bucket === '31–60 days' ? '#3182CE' : '#C05621',
                borderRadius: '3px 0 0 3px', transition: 'width 0.3s',
              }} />
              {/* projected write-off portion */}
              <Box sx={{
                width: `${(row.writeoff / maxAmount) * 100}%`,
                bgcolor: '#9B2C2C', opacity: 0.7,
                borderRadius: '0 3px 3px 0', transition: 'width 0.3s',
              }} />
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 8, bgcolor: '#276749', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Recoverable</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 8, bgcolor: '#9B2C2C', opacity: 0.7, borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Projected write-off</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#9B2C2C', fontSize: '0.75rem' }}>
          {formatCurrency(totalProjected)} projected write-off
        </Typography>
      </Box>
    </Paper>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  denials: DenialRecord[]
}

export default function DashboardPage({ denials }: DashboardPageProps) {
  const [tab, setTab] = useState(0)

  // Trends filter bar state (display only — static data)
  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [facility, setFacility]   = useState('All Facilities')
  const [service, setService]     = useState('All Service Lines')

  // ── Derived: Today ───────────────────────────────────────────────────────────
  const open        = denials.filter(d => !isTerminal(d.state))
  const dueThisWeek = open.filter(d => { const days = daysUntil(d.deadline); return days >= 0 && days <= 7 })

  const outcomes        = Object.values(DENIAL_OUTCOMES)
  const totalRecovered  = outcomes.reduce((s, o) => s + o.recoveredAmount, 0)
  const totalWrittenOff = outcomes.reduce((s, o) => s + o.writtenOffAmount, 0)
  const recoveryRate    = totalRecovered + totalWrittenOff > 0
    ? (totalRecovered / (totalRecovered + totalWrittenOff)) * 100 : 0

  const urgentList = [...open]
    .filter(d => daysUntil(d.deadline) <= 14)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 7)

  const stateCounts = (['Intake', 'Active', 'Submitted', 'Won', 'Recovered', 'Closed'] as DenialState[]).map(s => ({
    state: s, count: denials.filter(d => d.state === s).length,
  }))

  const workloadMap = new Map<string, number>()
  TEAM_MEMBERS.forEach(m => workloadMap.set(m.name, 0))
  workloadMap.set('Unassigned', 0)
  open.forEach(d => {
    const key = d.assignedTo?.name ?? 'Unassigned'
    workloadMap.set(key, (workloadMap.get(key) ?? 0) + 1)
  })
  const workloadRows = [...workloadMap.entries()].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  const maxWorkload  = Math.max(...workloadRows.map(([, c]) => c), 1)

  // ── Derived: Trends (disposition pie from live data) ──────────────────────────
  const dispositionCountMap = new Map<DispositionGroup, number>()
  outcomes.forEach(o => {
    const g = DISPOSITION_MAP[o.disposition]
    dispositionCountMap.set(g, (dispositionCountMap.get(g) ?? 0) + 1)
  })
  const dispositionData = [...dispositionCountMap.entries()].map(([name, value]) => ({ name, value }))

  return (
    <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* Tab strip */}
      <Box sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
          <Tab label="Today"  sx={{ fontSize: '0.8125rem', fontWeight: 600, minHeight: 44, textTransform: 'none' }} />
          <Tab label="Trends" sx={{ fontSize: '0.8125rem', fontWeight: 600, minHeight: 44, textTransform: 'none' }} />
        </Tabs>
      </Box>

      {/* ── TODAY ──────────────────────────────────────────────────────────────── */}
      {tab === 0 && (
        <Box sx={{ p: 3, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* KPI strip */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <StatCard label="Open Denials"        value={open.length}        sub={`${denials.length} total in system`} />
            <StatCard label="Due This Week"        value={dueThisWeek.length} sub="deadline within 7 days"
              color={dueThisWeek.length > 0 ? '#9B2C2C' : undefined} />
            <StatCard label="Denial Recovery Rate" value={`${recoveryRate.toFixed(1)}%`} sub={`${formatCurrency(totalRecovered)} recovered`} color="#22543D" />
          </Box>

          {/* Deadlines */}
          <Card title="Upcoming Deadlines (next 14 days)">
            {urgentList.length === 0
              ? <Typography variant="body2" color="text.disabled">No deadlines in the next 14 days</Typography>
              : urgentList.map(d => {
                const days = daysUntil(d.deadline)
                return (
                  <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, '&:last-child': { mb: 0 } }}>
                    <AccessTimeOutlined sx={{ fontSize: 15, flexShrink: 0, color: days <= 3 ? 'error.main' : days <= 7 ? 'warning.main' : 'text.disabled' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.patient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {d.payer} · {d.denialType}
                      </Typography>
                    </Box>
                    <Chip
                      label={days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, flexShrink: 0,
                        bgcolor: days <= 3 ? '#FED7D7' : days <= 7 ? '#FEFCBF' : 'grey.100',
                        color:   days <= 3 ? '#9B2C2C'  : days <= 7 ? '#744210' : 'text.secondary',
                      }}
                    />
                  </Box>
                )
              })
            }
          </Card>

          {/* Pipeline + Workload */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Card title="Pipeline by State">
              {stateCounts.map(({ state, count }) => (
                <Box key={state} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, '&:last-child': { mb: 0 } }}>
                  <Typography variant="body2" sx={{ width: 72, flexShrink: 0, fontSize: '0.8rem', color: 'text.secondary' }}>{state}</Typography>
                  <MiniBar fraction={count / Math.max(denials.length, 1)} color={STATE_COLORS[state]!} />
                  <Typography variant="body2" sx={{ width: 20, flexShrink: 0, fontWeight: 600, textAlign: 'right', fontSize: '0.8rem' }}>{count}</Typography>
                </Box>
              ))}
            </Card>

            <Card title="Team Workload (Open)">
              {workloadRows.length === 0
                ? <Typography variant="body2" color="text.disabled">No open denials assigned</Typography>
                : workloadRows.map(([name, count]) => (
                  <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, '&:last-child': { mb: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: 120, flexShrink: 0 }}>
                      {name !== 'Unassigned'
                        ? <Avatar sx={{ width: 18, height: 18, fontSize: '0.55rem', bgcolor: 'primary.main' }}>{name.split(' ').map((n: string) => n[0]).join('')}</Avatar>
                        : <PersonOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      }
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
                    </Box>
                    <MiniBar fraction={count / maxWorkload} color={name === 'Unassigned' ? '#718096' : '#2C5282'} />
                    <Typography variant="body2" sx={{ width: 20, flexShrink: 0, fontWeight: 600, textAlign: 'right', fontSize: '0.8rem' }}>{count}</Typography>
                  </Box>
                ))
              }
            </Card>
          </Box>
        </Box>
      )}

      {/* ── TRENDS ─────────────────────────────────────────────────────────────── */}
      {tab === 1 && (
        <Box sx={{ overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Filter bar */}
          <Box sx={{
            px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mr: 0.5 }}>Filter:</Typography>
            {[
              { label: 'Date Range', value: dateRange, set: setDateRange, options: ['Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'YTD'] },
              { label: 'Facility',   value: facility,  set: setFacility,   options: ['All Facilities', 'Main Campus', 'North Campus', 'South Campus'] },
              { label: 'Service Line',value: service,  set: setService,    options: ['All Service Lines', 'Inpatient', 'Outpatient', 'ED', 'Behavioral', 'Surgery'] },
            ].map(f => (
              <FormControl key={f.label} size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>{f.label}</InputLabel>
                <Select value={f.value} label={f.label} onChange={e => f.set(e.target.value)} sx={{ fontSize: '0.8rem' }}>
                  {f.options.map(o => <MenuItem key={o} value={o} sx={{ fontSize: '0.8rem' }}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            ))}
            {(dateRange !== 'Last 6 Months' || facility !== 'All Facilities' || service !== 'All Service Lines') && (
              <Chip
                label="Reset filters"
                size="small"
                onClick={() => { setDateRange('Last 6 Months'); setFacility('All Facilities'); setService('All Service Lines') }}
                sx={{ height: 24, fontSize: '0.75rem', cursor: 'pointer' }}
              />
            )}
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* 1. Insight Banner */}
            <InsightBanner />

            {/* 2. Payer Scorecard */}
            <PayerScorecard />

            {/* 3. Funnel + Volume & Overturn Trend */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
              <FunnelChart />
              <ChartCard title="Monthly Volume & Overturn Rate" height={240}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={EXPLORER_BY_MONTH} margin={{ top: 5, right: 24, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="x" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="vol" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v: number, name: string) => name === 'Overturn Rate' ? `${v}%` : v} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="#BEE3F8" radius={[3, 3, 0, 0]} barSize={20} />
                    <Line yAxisId="rate" dataKey="overturnRate" name="Overturn Rate" stroke="#22543D" strokeWidth={2} dot={{ r: 3, fill: '#22543D' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </Box>

            {/* 4. Prevention Opportunities */}
            <PreventionOpportunities />

            {/* 5. Metric Explorer */}
            <MetricExplorer />

            {/* 6. Aging & Write-off Risk */}
            <AgingAndWriteoffRisk />
          </Box>
        </Box>
      )}
    </Box>
  )
}
