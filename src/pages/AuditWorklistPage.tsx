import { useState } from 'react'
import {
  Box, Typography, Chip, Tabs, Tab, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper, Tooltip,
} from '@mui/material'
import {
  WarningAmberOutlined,
  GavelOutlined,
  ErrorOutlineOutlined,
  LockOutlined,
  TrendingUpOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material'
import {
  AUDIT_COHORTS,
  PROGRAM_CONFIG,
  STATUS_CONFIG,
  type AuditProgram,
  type AuditCohort,
} from '../data/auditCohorts'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

const FILTER_TABS: { label: string; value: AuditProgram | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'RAC', value: 'RAC' },
  { label: 'TPE', value: 'TPE' },
  { label: 'MAC', value: 'MAC_prepayment' },
]

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: AuditCohort['status'] }) {
  if (status === 'Legal Hold') return <LockOutlined sx={{ fontSize: 13, color: '#DC2626' }} />
  if (status === 'Discussion Period') return <WarningAmberOutlined sx={{ fontSize: 13, color: '#D97706' }} />
  return null
}

// ── Row ───────────────────────────────────────────────────────────────────────

function CohortRow({ cohort, onClick }: { cohort: AuditCohort; onClick: () => void }) {
  const prog = PROGRAM_CONFIG[cohort.program]
  const stat = STATUS_CONFIG[cohort.status]
  const deadlineDays = cohort.nextDeadline ? daysUntil(cohort.nextDeadline) : null
  const isUrgent = deadlineDays !== null && deadlineDays <= 7

  return (
    <TableRow
      hover
      onClick={onClick}
      sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
    >
      {/* Program */}
      <TableCell sx={{ py: 1.25, width: 100 }}>
        <Chip
          label={prog.label}
          size="small"
          sx={{
            height: 20, fontSize: '0.6875rem', fontWeight: 700,
            bgcolor: prog.bg, color: prog.color,
            '& .MuiChip-label': { px: 0.875 },
          }}
        />
      </TableCell>

      {/* Cohort name */}
      <TableCell sx={{ py: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            {cohort.name}
          </Typography>
          {cohort.extrapolationRisk && (
            <Tooltip title="Extrapolation risk — statistical expansion to unbilled claims possible">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpOutlined sx={{ fontSize: 13, color: '#DC2626' }} />
              </Box>
            </Tooltip>
          )}
          {cohort.legalHold && (
            <Tooltip title="Legal Hold — all automated actions blocked">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockOutlined sx={{ fontSize: 13, color: '#DC2626' }} />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.125 }}>
          {cohort.contractor} · {formatDate(cohort.auditPeriodStart)} – {formatDate(cohort.auditPeriodEnd)}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell sx={{ py: 1.25, width: 150 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StatusIcon status={cohort.status} />
          <Chip
            label={cohort.status}
            size="small"
            sx={{
              height: 20, fontSize: '0.6875rem', fontWeight: 600,
              bgcolor: stat.bg, color: stat.color,
              '& .MuiChip-label': { px: 0.875 },
            }}
          />
        </Box>
        {cohort.probeRound && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            Round {cohort.probeRound}
          </Typography>
        )}
      </TableCell>

      {/* Linked cases */}
      <TableCell sx={{ py: 1.25, width: 100, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
          {cohort.linkedDenialIds.length}
        </Typography>
      </TableCell>

      {/* Exposure */}
      <TableCell sx={{ py: 1.25, width: 130, textAlign: 'right' }}>
        {cohort.totalExposure > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem' }}>
            {formatCurrency(cohort.totalExposure)}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </TableCell>

      {/* Next deadline */}
      <TableCell sx={{ py: 1.25, width: 160 }}>
        {cohort.nextDeadline ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeOutlined sx={{ fontSize: 12, color: isUrgent ? 'error.main' : 'text.disabled' }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: isUrgent ? 700 : 500, fontSize: '0.8125rem', color: isUrgent ? 'error.main' : 'text.primary' }}
              >
                {formatDateShort(cohort.nextDeadline)}
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: isUrgent ? 'error.main' : 'text.secondary' }}>
                  ({deadlineDays === 0 ? 'today' : deadlineDays! < 0 ? `${Math.abs(deadlineDays!)}d ago` : `${deadlineDays}d`})
                </Typography>
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.125 }}>
              {cohort.nextDeadlineLabel}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </TableCell>

      {/* Owner */}
      <TableCell sx={{ py: 1.25, width: 120 }}>
        <Typography variant="caption" color="text.secondary">{cohort.complianceOwner}</Typography>
      </TableCell>
    </TableRow>
  )
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 1.5, borderRadius: 1.5, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditWorklistPage({ onSelectCohort }: { onSelectCohort: (id: string) => void }) {
  const [programFilter, setProgramFilter] = useState<AuditProgram | 'All'>('All')

  const filtered = programFilter === 'All'
    ? AUDIT_COHORTS
    : AUDIT_COHORTS.filter(c => c.program === programFilter)

  const totalExposure = AUDIT_COHORTS.reduce((s, c) => s + c.totalExposure, 0)
  const openCohorts   = AUDIT_COHORTS.filter(c => c.status !== 'Closed').length
  const legalHolds    = AUDIT_COHORTS.filter(c => c.status === 'Legal Hold').length
  const urgentCount   = AUDIT_COHORTS.filter(c => c.nextDeadline && daysUntil(c.nextDeadline) <= 7).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 2, pb: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Audits</Typography>
            <Typography variant="body2" color="text.secondary">
              Compliance monitoring for RAC, TPE, and MAC prepayment audits
            </Typography>
          </Box>
        </Box>

        {/* Summary cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <SummaryCard label="Open Cohorts" value={String(openCohorts)} />
          <SummaryCard label="Total Exposure" value={totalExposure > 0 ? formatCurrency(totalExposure) : '—'} color={totalExposure > 0 ? 'error.main' : undefined} />
          {urgentCount > 0 && (
            <SummaryCard label="Urgent Deadlines" value={String(urgentCount)} color="error.main" sub="≤7 days" />
          )}
          {legalHolds > 0 && (
            <SummaryCard label="Legal Hold" value={String(legalHolds)} color="#DC2626" sub="No automated actions" />
          )}
        </Box>

        {/* Legal hold global warning */}
        {legalHolds > 0 && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
            bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1.5, mb: 1.5,
          }}>
            <LockOutlined sx={{ fontSize: 14, color: '#DC2626', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 500 }}>
              <strong>Legal Hold active</strong> — one or more cohorts are under legal hold. All automated actions are blocked for linked records. Contact legal counsel before taking any action.
            </Typography>
          </Box>
        )}

        {/* Filter tabs */}
        <Tabs
          value={programFilter}
          onChange={(_, v) => setProgramFilter(v)}
          sx={{
            minHeight: 32,
            '& .MuiTab-root': { minHeight: 32, py: 0, fontSize: '0.8rem', fontWeight: 500, textTransform: 'none' },
          }}
        >
          {FILTER_TABS.map(t => (
            <Tab
              key={t.value}
              value={t.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {t.label}
                  {t.value !== 'All' && (
                    <Chip
                      label={AUDIT_COHORTS.filter(c => c.program === t.value).length}
                      size="small"
                      sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
        <TableContainer>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8F9FB' }}>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 100 }}>Program</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>Cohort</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 150 }}>Status</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 100, textAlign: 'center' }}>Cases</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 130, textAlign: 'right' }}>Exposure</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 160 }}>Next Deadline</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', width: 120 }}>Owner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.disabled">No audit cohorts match the selected filter.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(cohort => (
                  <CohortRow key={cohort.id} cohort={cohort} onClick={() => onSelectCohort(cohort.id)} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}
