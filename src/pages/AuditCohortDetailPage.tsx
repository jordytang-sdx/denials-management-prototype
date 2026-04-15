import {
  Box, Typography, Button, Chip, Divider, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Alert,
} from '@mui/material'
import {
  ArrowBackOutlined,
  TrendingUpOutlined,
  LockOutlined,
  WarningAmberOutlined,
  AccessTimeOutlined,
  OpenInNewOutlined,
  PersonOutlined,
  CalendarTodayOutlined,
  AssignmentOutlined,
  MonetizationOnOutlined,
} from '@mui/icons-material'
import {
  AUDIT_COHORTS,
  PROGRAM_CONFIG,
  STATUS_CONFIG,
  type AuditCohort,
} from '../data/auditCohorts'
import { SEED_DENIALS } from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 2, borderRadius: 1.5, flex: 1, minWidth: 160 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{sub}</Typography>}
    </Paper>
  )
}

// ── Status alert ──────────────────────────────────────────────────────────────

function StatusAlert({ cohort }: { cohort: AuditCohort }) {
  if (cohort.status === 'Legal Hold') {
    return (
      <Alert
        severity="error"
        icon={<LockOutlined fontSize="small" />}
        sx={{ borderRadius: 1.5, mb: 2.5, fontSize: '0.8125rem' }}
      >
        <strong>Legal Hold Active</strong> — This cohort is under OIG investigation. All automated drafting, submission, and record modification actions are blocked.
        Contact legal counsel before taking any action on linked cases. All records must be preserved.
      </Alert>
    )
  }

  if (cohort.status === 'Discussion Period' && cohort.discussionPeriodExpiry) {
    const days = daysUntil(cohort.discussionPeriodExpiry)
    return (
      <Alert
        severity="warning"
        icon={<WarningAmberOutlined fontSize="small" />}
        sx={{ borderRadius: 1.5, mb: 2.5, fontSize: '0.8125rem' }}
      >
        <strong>Discussion Period expires {formatDate(cohort.discussionPeriodExpiry)}</strong>
        {days >= 0
          ? ` — ${days} day${days !== 1 ? 's' : ''} remaining to submit a dispute before the RAC demand becomes final.`
          : ' — Discussion Period has expired. Demand is final unless formal appeal was filed.'}
        {' '}Schedule a call with {cohort.contractor} to present documentation.
      </Alert>
    )
  }

  if (cohort.status === 'CAP Period') {
    const days = cohort.nextDeadline ? daysUntil(cohort.nextDeadline) : null
    return (
      <Alert
        severity="info"
        sx={{ borderRadius: 1.5, mb: 2.5, fontSize: '0.8125rem' }}
      >
        <strong>Corrective Action Plan (CAP) in progress</strong>
        {cohort.nextDeadline && ` — CAP submission due ${formatDate(cohort.nextDeadline)}`}
        {days !== null && ` (${days} day${days !== 1 ? 's' : ''}).`}
        {cohort.probeRound && ` Round ${cohort.probeRound} probe complete.`}
        {' '}TPE does not extrapolate — each round must be resolved with education and documentation improvement.
      </Alert>
    )
  }

  return null
}

// ── Denial state chip ─────────────────────────────────────────────────────────

function DenialStateChip({ state }: { state: string }) {
  const STATE_CHIP: Record<string, { bg: string; color: string }> = {
    Intake:    { bg: '#EDF2F7', color: '#4A5568' },
    Active:    { bg: '#EBF4FF', color: '#2C5282' },
    Submitted: { bg: '#E6FFFA', color: '#276749' },
    Won:       { bg: '#F0FFF4', color: '#22543D' },
    Recovered: { bg: '#DCFCE7', color: '#14532D' },
    Closed:    { bg: '#F7FAFC', color: '#718096' },
    Archived:  { bg: '#F3F0FF', color: '#6B46C1' },
  }
  const sc = STATE_CHIP[state] ?? STATE_CHIP['Active']!
  return (
    <Chip
      label={state}
      size="small"
      sx={{ height: 18, fontWeight: 600, fontSize: '0.6875rem', bgcolor: sc.bg, color: sc.color, '& .MuiChip-label': { px: 0.75 } }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AuditCohortDetailPageProps {
  cohortId: string
  onBack: () => void
  onNavigateToDenial?: (id: string) => void
}

export default function AuditCohortDetailPage({ cohortId, onBack, onNavigateToDenial }: AuditCohortDetailPageProps) {
  const cohort = AUDIT_COHORTS.find(c => c.id === cohortId)
  if (!cohort) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Cohort not found.</Typography>
      </Box>
    )
  }

  const prog = PROGRAM_CONFIG[cohort.program]
  const stat = STATUS_CONFIG[cohort.status]
  const linkedDenials = SEED_DENIALS.filter(d => cohort.linkedDenialIds.includes(d.id))
  const deadlineDays = cohort.nextDeadline ? daysUntil(cohort.nextDeadline) : null
  const isUrgent = deadlineDays !== null && deadlineDays <= 7

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>

        {/* Row 1: back + ID + badges */}
        <Box sx={{ px: 2.5, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackOutlined sx={{ fontSize: 15 }} />}
            onClick={onBack}
            size="small"
            variant="text"
            sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8125rem', mr: 0.5 }}
          >
            Audits
          </Button>
          <Divider orientation="vertical" flexItem />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {cohort.id}
          </Typography>

          <Chip
            label={prog.label}
            size="small"
            sx={{
              height: 20, fontWeight: 700, fontSize: '0.6875rem',
              bgcolor: prog.bg, color: prog.color,
              '& .MuiChip-label': { px: 0.875 },
            }}
          />
          <Chip
            label={cohort.status}
            size="small"
            sx={{
              height: 20, fontWeight: 600, fontSize: '0.6875rem',
              bgcolor: stat.bg, color: stat.color,
              '& .MuiChip-label': { px: 0.875 },
            }}
          />
          {cohort.extrapolationRisk && (
            <Chip
              icon={<TrendingUpOutlined sx={{ fontSize: 11, '&.MuiChip-icon': { ml: 0.5 } }} />}
              label="Extrapolation Risk"
              size="small"
              sx={{ height: 20, fontWeight: 600, fontSize: '0.6875rem', bgcolor: '#FEF2F2', color: '#DC2626', '& .MuiChip-label': { px: 0.75 } }}
            />
          )}
          {cohort.legalHold && (
            <Chip
              icon={<LockOutlined sx={{ fontSize: 11, '&.MuiChip-icon': { ml: 0.5 } }} />}
              label="Legal Hold"
              size="small"
              sx={{ height: 20, fontWeight: 700, fontSize: '0.6875rem', bgcolor: '#FEF2F2', color: '#DC2626', '& .MuiChip-label': { px: 0.75 } }}
            />
          )}

          <Box sx={{ flex: 1 }} />

          {/* Financial summary */}
          {cohort.totalExposure > 0 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Known Exposure</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', lineHeight: 1 }}>
                {formatCurrency(cohort.totalExposure)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Row 2: cohort name + contractor */}
        <Box sx={{ px: 2.5, pb: 1.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.25 }}>{cohort.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {cohort.contractor} · Audit period {formatDate(cohort.auditPeriodStart)} – {formatDate(cohort.auditPeriodEnd)}
          </Typography>
        </Box>
      </Box>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default', p: 3 }}>
        <Box sx={{ maxWidth: 960, mx: 'auto' }}>

          {/* Status alert */}
          <StatusAlert cohort={cohort} />

          {/* Stat cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <StatCard
              icon={<MonetizationOnOutlined sx={{ fontSize: 16 }} />}
              label="Known Exposure"
              value={cohort.totalExposure > 0 ? formatCurrency(cohort.totalExposure) : '—'}
              color={cohort.totalExposure > 0 ? 'error.main' : undefined}
              sub={cohort.extrapolationRisk ? 'Statistical extrapolation possible' : 'No extrapolation risk'}
            />
            <StatCard
              icon={<AssignmentOutlined sx={{ fontSize: 16 }} />}
              label="Linked Cases"
              value={String(cohort.linkedDenialIds.length)}
              sub={cohort.linkedDenialIds.length === 0 ? 'No cases linked yet' : `${cohort.linkedDenialIds.length} denial instance${cohort.linkedDenialIds.length !== 1 ? 's' : ''}`}
            />
            <StatCard
              icon={<CalendarTodayOutlined sx={{ fontSize: 16 }} />}
              label="Audit Period"
              value={`${formatDate(cohort.auditPeriodStart).slice(0, -6)} – ${formatDate(cohort.auditPeriodEnd).slice(0, -6)}`}
              sub={`Opened ${formatDate(cohort.openedAt)}`}
            />
            {cohort.nextDeadline && (
              <StatCard
                icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
                label="Next Deadline"
                value={formatDate(cohort.nextDeadline)}
                color={isUrgent ? 'error.main' : undefined}
                sub={cohort.nextDeadlineLabel}
              />
            )}
            <StatCard
              icon={<PersonOutlined sx={{ fontSize: 16 }} />}
              label="Compliance Owner"
              value={cohort.complianceOwner}
              sub={prog.description}
            />
          </Box>

          {/* Probe focus */}
          <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2.5, mb: 3 }}>
            <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              Probe Focus
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>{cohort.probeFocus}</Typography>
          </Paper>

          {/* Linked cases */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Linked Denial Instances
              {cohort.linkedDenialIds.length > 0 && (
                <Chip label={cohort.linkedDenialIds.length} size="small" sx={{ ml: 1, height: 18, fontSize: '0.6875rem', '& .MuiChip-label': { px: 0.75 } }} />
              )}
            </Typography>

            {linkedDenials.length === 0 ? (
              <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.disabled">No denial instances linked to this cohort yet.</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                  Instances will appear here as claims are identified under this audit program.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8F9FB' }}>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 120 }}>ID</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Patient</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 160 }}>Payer</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 160 }}>Denial Type</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 100 }}>State</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 110, textAlign: 'right' }}>Denied Amt</TableCell>
                      <TableCell sx={{ py: 1, width: 60 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {linkedDenials.map(denial => {
                      const tc = getDenialTypeConfig(denial.denialType)
                      return (
                        <TableRow
                          key={denial.id}
                          hover={!!onNavigateToDenial}
                          onClick={() => onNavigateToDenial?.(denial.id)}
                          sx={{ cursor: onNavigateToDenial ? 'pointer' : 'default', '&:last-child td': { border: 0 } }}
                        >
                          <TableCell sx={{ py: 1.25 }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem' }}>{denial.id}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>{denial.patient.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{denial.patient.mrn}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{denial.payer}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 0.5, bgcolor: tc.bg }}>
                                <tc.Icon sx={{ fontSize: 11, color: tc.color }} />
                              </Box>
                              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: tc.color, fontWeight: 500 }}>{denial.denialType}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">{denial.denialSubtype}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25 }}>
                            <DenialStateChip state={denial.state} />
                          </TableCell>
                          <TableCell sx={{ py: 1.25, textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>
                              {denial.deniedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25 }}>
                            {onNavigateToDenial && (
                              <OpenInNewOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Notes */}
          {cohort.notes && (
            <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2.5 }}>
              <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {cohort.notes}
              </Typography>
            </Paper>
          )}

        </Box>
      </Box>
    </Box>
  )
}

