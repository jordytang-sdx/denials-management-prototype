import { useState } from 'react'
import {
  Box, Typography, Chip, Tabs, Tab, Button, Paper, Avatar, Divider, IconButton,
  LinearProgress, Stack,
} from '@mui/material'
import {
  ArrowBackOutlined, MoreVertOutlined, UploadFileOutlined,
  CheckCircleOutlineOutlined, TaskAltOutlined, GavelOutlined,
  FolderOutlined, AttachFileOutlined, WarningAmberOutlined,
} from '@mui/icons-material'
import type { AuditRecord, AuditState } from '../data/audits'
import { SEED_UNDERPAYMENTS } from '../data/underpayments'
import { SEED_DENIALS } from '../data/denials'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { ClaimContextStrip, type ClaimContext } from '../components/ClaimContextStrip'
import { OnThisClaimWidget, type CaseOnClaim } from '../components/OnThisClaimWidget'
import type { TimelineEvent } from '../data/caseTimeline'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

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

function fmt(s: string): string {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function currency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

function buildTimeline(record: AuditRecord): TimelineEvent[] {
  const events: TimelineEvent[] = []
  let counter = 0
  const id = () => `evt-${record.id}-${++counter}`

  const noticeType = record.auditSubtype === 'ADR' ? 'signal_pdf_adr'
    : record.auditSubtype === 'recoupment_demand' ? 'signal_pdf_recoupment'
    : 'signal_audit_notice'

  events.push({
    id: id(), type: noticeType, timestamp: record.auditNoticeDate + 'T08:00:00',
    actor: record.payer, actorType: 'payer',
    summary: `${record.auditType} audit notice received from ${record.auditBody ?? record.payer}`,
    detail: `Amount at risk: ${currency(record.amountAtRisk)}. DOS: ${record.dos}.`,
    amount: record.amountAtRisk,
  })

  events.push({
    id: id(), type: 'system_instance_created', timestamp: record.createdAt + 'T09:15:00',
    actor: 'System', actorType: 'system',
    summary: `Audit case ${record.id} created`,
    detail: `Classified as ${record.auditType} · ${record.auditSubtype.replace(/_/g, ' ')}.`,
  })

  events.push({
    id: id(), type: 'system_routing_applied', timestamp: record.createdAt + 'T09:16:00',
    actor: 'System', actorType: 'system',
    summary: 'Routed to Audit Response queue',
  })

  if (record.assignedTo) {
    events.push({
      id: id(), type: 'action_assign', timestamp: record.createdAt + 'T10:00:00',
      actor: record.assignedTo.name, actorType: 'provider',
      summary: `Case assigned to ${record.assignedTo.name}`,
    })
  }

  const stateOrder: AuditState[] = ['NoticeReceived', 'RecordsPending', 'UnderReview', 'FindingsIssued', 'Disputed', 'Closed']
  const stateIdx = stateOrder.indexOf(record.state)

  if (stateIdx >= 1) {
    events.push({
      id: id(), type: 'action_records_requested', timestamp: offsetDate(record.createdAt, 5) + 'T14:30:00',
      actor: record.assignedTo?.name ?? 'Provider', actorType: 'provider',
      summary: 'Medical records requested from HIM',
      detail: 'Chart, clinical notes, and physician attestation requested from Health Information Management.',
    })
  }

  if (stateIdx >= 2) {
    events.push({
      id: id(), type: 'action_records_submitted', timestamp: offsetDate(record.createdAt, 14) + 'T11:00:00',
      actor: record.assignedTo?.name ?? 'Provider', actorType: 'provider',
      summary: `Complete records package submitted to ${record.auditBody ?? record.payer}`,
      detail: 'Clinical record, attending physician attestation, and operative reports submitted.',
    })
    events.push({
      id: id(), type: 'payer_pending', timestamp: offsetDate(record.createdAt, 14) + 'T11:01:00',
      actor: record.auditBody ?? record.payer, actorType: 'payer',
      summary: 'Audit under review by payer',
    })
  }

  if (stateIdx >= 3) {
    events.push({
      id: id(), type: 'payer_audit_findings_issued', timestamp: offsetDate(record.createdAt, 35) + 'T09:00:00',
      actor: record.auditBody ?? record.payer, actorType: 'payer',
      summary: 'Audit findings issued',
      detail: record.proposedRecoupment
        ? `Proposed recoupment of ${currency(record.proposedRecoupment)} issued. Review and dispute within deadline.`
        : 'Audit findings letter received.',
      amount: record.proposedRecoupment,
    })
  }

  if (stateIdx >= 4) {
    events.push({
      id: id(), type: 'action_dispute_filed', timestamp: offsetDate(record.createdAt, 50) + 'T14:00:00',
      actor: record.assignedTo?.name ?? 'Provider', actorType: 'provider',
      summary: 'Formal dispute filed',
      detail: 'Written dispute with physician attestation and supplemental clinical evidence submitted to auditor.',
    })
    events.push({
      id: id(), type: 'payer_pending', timestamp: offsetDate(record.createdAt, 50) + 'T14:01:00',
      actor: record.auditBody ?? record.payer, actorType: 'payer',
      summary: 'Dispute under review',
    })
  }

  if (stateIdx >= 5 && record.state === 'Closed') {
    events.push({
      id: id(), type: record.status === 'Successfully Disputed' ? 'payer_overturned' : 'payer_upheld',
      timestamp: offsetDate(record.createdAt, 70) + 'T10:00:00',
      actor: record.auditBody ?? record.payer, actorType: 'payer',
      summary: `Audit closed — ${record.status}`,
      detail: record.recoveredAmount
        ? `Provider retained full amount. ${currency(record.recoveredAmount)} protected.`
        : record.settledAmount
        ? `Settlement reached: ${currency(record.settledAmount)} repaid.`
        : 'Case closed per audit determination.',
      amount: record.recoveredAmount ?? record.settledAmount,
    })
  }

  // Cross-case events
  if (record.relatedCases) {
    for (const rel of record.relatedCases) {
      events.push({
        id: id(), type: 'system_cross_case',
        timestamp: record.createdAt + 'T09:20:00',
        actor: 'System', actorType: 'system',
        summary: `${rel.relationship.replace(/_/g, ' ')} — ${rel.caseType} case ${rel.caseId}`,
        relatedCaseId: rel.caseId,
        relatedCaseType: rel.caseType,
        relatedCaseRelationship: rel.relationship,
      })
    }
  }

  return events
}

// ── Records Tab ───────────────────────────────────────────────────────────────

interface RecordsTabProps { record: AuditRecord }

function RecordsTab({ record }: RecordsTabProps) {
  const deadline = new Date(record.deadline)
  const daysLeft = Math.ceil((deadline.getTime() - TODAY.getTime()) / 86400000)
  const deadlineColor = daysLeft < 0 ? '#DC2626' : daysLeft <= 3 ? '#C2410C' : daysLeft <= 7 ? '#B45309' : '#374151'
  const isTerminal = record.state === 'Closed'

  const mockRecords = [
    { name: 'Complete Medical Record (H&P, Progress Notes, Discharge Summary)', status: record.state === 'NoticeReceived' ? 'Not Requested' : record.state === 'RecordsPending' ? 'Requested' : 'Submitted' },
    { name: 'Operative / Procedure Reports', status: record.state === 'NoticeReceived' ? 'Not Requested' : record.state === 'RecordsPending' ? 'Retrieved' : 'Submitted' },
    { name: 'Physician Attestation', status: record.state === 'NoticeReceived' ? 'Not Requested' : 'Requested' },
  ]

  const submittedCount = mockRecords.filter(r => r.status === 'Submitted').length

  return (
    <Box sx={{ p: 3, maxWidth: 680 }}>
      {/* Deadline tracker */}
      {!isTerminal && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: `4px solid ${deadlineColor}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>Records Deadline</Typography>
              <Typography variant="body2" sx={{ color: deadlineColor, fontWeight: 600 }}>
                {fmt(record.deadline)}
                {!isTerminal && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: deadlineColor }}>
                    ({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d remaining`})
                  </Typography>
                )}
              </Typography>
            </Box>
            <Chip
              label={`${submittedCount} / ${mockRecords.length} submitted`}
              size="small"
              sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: submittedCount === mockRecords.length ? '#D1FAE5' : '#FEF9C3', color: submittedCount === mockRecords.length ? '#065F46' : '#854D0E' }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={(submittedCount / mockRecords.length) * 100}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: submittedCount === mockRecords.length ? 'success.main' : 'warning.main' } }}
          />
        </Paper>
      )}

      {/* Audit notice details */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Audit Request Details
        </Typography>
        {[
          { label: 'Audit Body', value: record.auditBody ?? record.payer },
          { label: 'Audit Type', value: `${record.auditType} · ${record.auditSubtype.replace(/_/g, ' ')}` },
          { label: 'Notice Date', value: fmt(record.auditNoticeDate) },
          { label: 'Records Deadline', value: fmt(record.deadline) },
          { label: 'Amount at Risk', value: currency(record.amountAtRisk) },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 'none' } }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{value}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Records list */}
      <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
        Requested Records
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        {mockRecords.map((r, i) => {
          const statusColor = r.status === 'Submitted' ? '#227a6c' : r.status === 'Retrieved' ? '#157d9d' : r.status === 'Requested' ? '#b86823' : '#939a9f'
          const statusBg   = r.status === 'Submitted' ? '#eaf6f4' : r.status === 'Retrieved' ? '#e8f2f5' : r.status === 'Requested' ? '#fef3ea' : '#f1f4f6'
          return (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
              px: 2, py: 1.25,
              borderBottom: i < mockRecords.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FolderOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{r.name}</Typography>
              </Box>
              <Chip
                label={r.status}
                size="small"
                sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600, bgcolor: statusBg, color: statusColor, '& .MuiChip-label': { px: 0.75 }, flexShrink: 0 }}
              />
            </Box>
          )
        })}
      </Paper>

      {/* Actions */}
      {!isTerminal && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button variant="contained" size="small" startIcon={<UploadFileOutlined />} sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            Upload Records
          </Button>
          <Button variant="outlined" size="small" color="inherit" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary' }}>
            Request Records from HIM
          </Button>
        </Stack>
      )}
    </Box>
  )
}

// ── Findings Tab ──────────────────────────────────────────────────────────────

function FindingsTab({ record }: { record: AuditRecord }) {
  const findingsAvailable = ['FindingsIssued', 'Disputed', 'Closed'].includes(record.state)

  if (!findingsAvailable) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <GavelOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Audit findings have not been issued yet.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          This tab will populate once the audit body issues its findings.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 680 }}>
      {/* Findings summary */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: '4px solid #BE123C' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#BE123C' }}>
          Audit Findings — {record.auditBody ?? record.payer}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>Amount at Risk</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.dark', fontSize: '1rem' }}>{currency(record.amountAtRisk)}</Typography>
          </Box>
          {record.proposedRecoupment != null && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>Proposed Recoupment</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', fontSize: '1rem' }}>{currency(record.proposedRecoupment)}</Typography>
            </Box>
          )}
          {record.settledAmount != null && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>Settlement</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark', fontSize: '1rem' }}>{currency(record.settledAmount)}</Typography>
            </Box>
          )}
          {record.recoveredAmount != null && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>Retained</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark', fontSize: '1rem' }}>{currency(record.recoveredAmount)}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Line items placeholder */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Findings Detail
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Audit findings document received. Detailed line-item breakdown to be entered after clinical review.
        </Typography>
      </Paper>

      {/* Response notes */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
          Provider Response Notes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
          {record.notes || 'No notes added yet.'}
        </Typography>
        <Button variant="outlined" size="small" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary' }}>
          Add Response Note
        </Button>
      </Paper>
    </Box>
  )
}

// ── Dispute Tab ───────────────────────────────────────────────────────────────

function DisputeTab({ record }: { record: AuditRecord }) {
  const disputeEnabled = ['FindingsIssued', 'Disputed', 'Closed'].includes(record.state)

  if (!disputeEnabled) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <AttachFileOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">Dispute workspace is not yet available.</Typography>
        <Typography variant="caption" color="text.disabled">Available once audit findings are issued.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 680 }}>
      {record.state === 'Disputed' || record.state === 'Closed' ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: '4px solid #6D28D9' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6D28D9', mb: 0.5 }}>Dispute Filed</Typography>
          <Typography variant="body2" color="text.secondary">
            Formal dispute submitted. Awaiting response from {record.auditBody ?? record.payer}.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: '4px solid #BE123C' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Ready to Dispute?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Review audit findings and prepare your dispute letter with supporting clinical documentation.
          </Typography>
          <Button variant="contained" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
            Begin Dispute Letter
          </Button>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Supporting Documentation
        </Typography>
        <Stack spacing={1}>
          {['Physician attestation', 'Clinical record excerpts', 'Coding rationale / CDI review', 'Contractual references'].map(doc => (
            <Box key={doc} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.disabled' }}>
              <AttachFileOutlined sx={{ fontSize: 14 }} />
              <Typography variant="caption">{doc}</Typography>
              <Chip label="Pending" size="small" sx={{ height: 16, fontSize: '0.5625rem', ml: 'auto', '& .MuiChip-label': { px: 0.5 } }} />
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

function ActivityTab({ record, onNavigateToCase }: { record: AuditRecord; onNavigateToCase: (id: string, type: 'denial' | 'underpayment' | 'audit') => void }) {
  const stateOrder: AuditState[] = ['NoticeReceived', 'RecordsPending', 'UnderReview', 'FindingsIssued', 'Disputed', 'Closed']
  const currentIdx = stateOrder.indexOf(record.state)
  const events = buildTimeline(record)

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, flexWrap: 'wrap' }}>
      {/* Lifecycle stepper */}
      <Box sx={{ flex: '0 0 220px' }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
          Audit Lifecycle
        </Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {([
            { state: 'NoticeReceived' as AuditState, label: 'Notice Received' },
            { state: 'RecordsPending' as AuditState, label: 'Records Pending' },
            { state: 'UnderReview' as AuditState,    label: 'Under Review' },
            { state: 'FindingsIssued' as AuditState, label: 'Findings Issued' },
            { state: 'Disputed' as AuditState,       label: 'Disputed' },
            { state: 'Closed' as AuditState,         label: 'Closed' },
          ]).map(({ state, label }, idx, arr) => {
            const thisIdx = stateOrder.indexOf(state)
            const isDone = thisIdx < currentIdx
            const isCurrent = state === record.state
            const sc = STATE_COLORS[state]
            return (
              <Box
                key={state}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1,
                  borderBottom: idx < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                  bgcolor: isCurrent ? sc.bg + '80' : 'transparent',
                }}
              >
                <Box sx={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isDone ? 'success.main' : isCurrent ? sc.color : 'grey.200',
                  color: isDone || isCurrent ? '#fff' : 'transparent',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {isDone ? '✓' : ''}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? sc.color : isDone ? 'text.primary' : 'text.disabled', fontSize: '0.75rem' }}>
                  {label}
                </Typography>
                {isCurrent && (
                  <Chip label="Now" size="small" sx={{ height: 14, fontSize: '0.5rem', fontWeight: 700, bgcolor: sc.bg, color: sc.color, ml: 'auto', '& .MuiChip-label': { px: 0.5 } }} />
                )}
              </Box>
            )
          })}
        </Paper>
      </Box>

      {/* Timeline */}
      <Box sx={{ flex: 1, minWidth: 240 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.5, px: 2 }}>
          Event Log
        </Typography>
        <ActivityTimeline events={events} onNavigateToCase={onNavigateToCase} />
      </Box>
    </Box>
  )
}

// ── Right Column ──────────────────────────────────────────────────────────────

function RightColumn({ record, onNavigateToCase }: { record: AuditRecord; onNavigateToCase: (id: string, type: 'denial' | 'underpayment' | 'audit') => void }) {
  const events = buildTimeline(record)
  const typeColors = AUDIT_TYPE_COLORS[record.auditType] ?? AUDIT_TYPE_COLORS['Internal']!

  // Build OnThisClaimWidget data
  const relatedDenials = SEED_DENIALS.filter(d => d.claim.claimId === record.claim.claimId && d.id !== record.id)
  const relatedUPs = SEED_UNDERPAYMENTS.filter(u => u.claim.claimId === record.claim.claimId)
  const casesOnClaim: CaseOnClaim[] = [
    { caseId: record.id, caseType: 'audit', state: record.state, status: record.status, amount: record.amountAtRisk, assignee: record.assignedTo?.name, isCurrent: true },
    ...relatedDenials.map(d => ({ caseId: d.id, caseType: 'denial' as const, state: d.state, status: d.status, amount: d.deniedAmount, assignee: d.assignedTo?.name ?? undefined, isCurrent: false })),
    ...relatedUPs.map(u => ({ caseId: u.id, caseType: 'underpayment' as const, state: u.state, status: u.status, amount: u.varianceAmount, assignee: u.assignedTo?.name ?? undefined, isCurrent: false })),
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Timeline */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
            Activity Timeline
          </Typography>
        </Box>
        <ActivityTimeline events={events} onNavigateToCase={onNavigateToCase} />
      </Paper>

      {/* Case context panel */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, pt: 1.25, pb: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
            Audit Details
          </Typography>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip label={record.auditType} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: typeColors.bg, color: typeColors.color, '& .MuiChip-label': { px: 1 } }} />
            <Chip label={record.auditSubtype.replace(/_/g, ' ')} size="small" sx={{ height: 20, fontSize: '0.6875rem', '& .MuiChip-label': { px: 1 } }} />
          </Box>
          {[
            { label: 'Audit Body', value: record.auditBody ?? '—' },
            { label: 'Notice Date', value: fmt(record.auditNoticeDate) },
            { label: 'Amount at Risk', value: currency(record.amountAtRisk), bold: true },
            ...(record.proposedRecoupment != null ? [{ label: 'Proposed Recoupment', value: currency(record.proposedRecoupment), bold: true }] : []),
            ...(record.settledAmount != null ? [{ label: 'Settlement', value: currency(record.settledAmount) }] : []),
            ...(record.recoveredAmount != null ? [{ label: 'Retained', value: currency(record.recoveredAmount), green: true }] : []),
          ].map(({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 'none' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: bold || green ? 600 : 500, color: green ? 'success.dark' : bold ? 'error.dark' : 'text.primary', fontSize: '0.75rem' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* On This Claim */}
      <OnThisClaimWidget
        claimId={record.claim.claimId}
        cases={casesOnClaim}
        onNavigateToCase={onNavigateToCase}
      />
    </Box>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type AuditDetailTab = 'records' | 'findings' | 'dispute' | 'activity' | 'attachments'

interface Props {
  audit: AuditRecord
  onBack: () => void
  onNavigateToCase?: (caseId: string, caseType: 'denial' | 'underpayment' | 'audit') => void
}

export default function AuditDetailPage({ audit, onBack, onNavigateToCase }: Props) {
  const defaultTab: AuditDetailTab = (() => {
    if (audit.state === 'FindingsIssued' || audit.state === 'Disputed') return 'findings'
    return 'records'
  })()
  const [activeTab, setActiveTab] = useState<AuditDetailTab>(defaultTab)

  const stateColors = STATE_COLORS[audit.state]
  const typeColors  = AUDIT_TYPE_COLORS[audit.auditType] ?? AUDIT_TYPE_COLORS['Internal']!

  const deadline = new Date(audit.deadline)
  const daysLeft = Math.ceil((deadline.getTime() - TODAY.getTime()) / 86400000)
  const deadlineColor = audit.state === 'Closed' ? '#9CA3AF' : daysLeft < 0 ? '#DC2626' : daysLeft <= 3 ? '#C2410C' : daysLeft <= 7 ? '#B45309' : '#374151'

  const primaryCTA: { label: string; color?: 'error' | 'primary' | 'inherit' } | null = (() => {
    if (audit.state === 'NoticeReceived') return { label: 'Request Records' }
    if (audit.state === 'RecordsPending') return { label: 'Mark Records Submitted' }
    if (audit.state === 'UnderReview')    return { label: 'Record Audit Decision' }
    if (audit.state === 'FindingsIssued') return { label: 'Dispute Findings', color: 'error' }
    if (audit.state === 'Disputed')       return { label: 'Record Dispute Outcome' }
    if (audit.state === 'Closed')         return { label: 'Restore', color: 'inherit' }
    return null
  })()

  const claimCtx: ClaimContext = {
    claimId: audit.claim.claimId,
    har: audit.claim.har,
    mrn: audit.patient.mrn,
    dos: audit.dos,
  }

  const handleNavigate = onNavigateToCase ?? (() => {})

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header Band ── */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, pt: 1.5, pb: 0, flexShrink: 0 }}>

        {/* Row 1: back + badges + state + amount + deadline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <IconButton size="small" onClick={onBack} sx={{ color: 'text.secondary', mr: 0.5 }}>
            <ArrowBackOutlined fontSize="small" />
          </IconButton>
          <Chip label="A" size="small" sx={{ height: 20, width: 20, fontSize: '0.625rem', fontWeight: 800, bgcolor: '#EDE9FE', color: '#7C3AED', borderRadius: '4px', '& .MuiChip-label': { px: 0 } }} />
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'text.secondary' }}>{audit.id}</Typography>
          <Chip label={audit.state.replace(/([A-Z])/g, ' $1').trim()} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: stateColors.bg, color: stateColors.color, '& .MuiChip-label': { px: 1 } }} />
          <Chip label={audit.status} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.625rem', '& .MuiChip-label': { px: 0.75 } }} />
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark', fontVariantNumeric: 'tabular-nums' }}>
            {currency(audit.amountAtRisk)} at risk
          </Typography>
          {audit.state !== 'Closed' && (
            <Typography variant="caption" sx={{ color: deadlineColor, fontWeight: 600 }}>
              {daysLeft < 0 ? `⚠ ${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? '⚠ Due today' : `Deadline: ${fmt(audit.deadline)} — ${daysLeft}d`}
            </Typography>
          )}
        </Box>

        {/* Row 2: patient + payer + case type label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, flexWrap: 'wrap', ml: 5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{audit.patient.name}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">{audit.payer}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">DOS: {fmt(audit.dos)}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Chip label={audit.auditType} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: typeColors.bg, color: typeColors.color, '& .MuiChip-label': { px: 0.75 } }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{audit.auditBody ?? ''}</Typography>
        </Box>

        {/* Row 3: assignee + CTA */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, ml: 5 }}>
          {audit.assignedTo ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Avatar sx={{ width: 22, height: 22, fontSize: '0.5625rem', bgcolor: '#C2410C20', color: '#C2410C' }}>
                {audit.assignedTo.initials}
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{audit.assignedTo.name}</Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {primaryCTA && (
            <Button
              variant="contained"
              size="small"
              color={primaryCTA.color === 'inherit' ? undefined : (primaryCTA.color ?? 'primary')}
              sx={{ fontWeight: 700, fontSize: '0.8rem', ...(primaryCTA.color === 'inherit' ? { bgcolor: 'grey.200', color: 'text.primary', '&:hover': { bgcolor: 'grey.300' } } : {}) }}
            >
              {primaryCTA.label}
            </Button>
          )}
          {audit.state === 'FindingsIssued' && (
            <Button variant="outlined" size="small" color="inherit" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.secondary' }}>
              Accept Findings
            </Button>
          )}
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <MoreVertOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36,
            '& .MuiTabs-flexContainer': { gap: 0 },
            '& .MuiTab-root': { minHeight: 36, py: 0, px: 1.75, fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none' },
          }}
        >
          <Tab value="records"     label="Records" />
          <Tab value="findings"    label="Findings" disabled={!['FindingsIssued', 'Disputed', 'Closed'].includes(audit.state)} />
          <Tab value="dispute"     label="Dispute"  disabled={!['FindingsIssued', 'Disputed', 'Closed'].includes(audit.state)} />
          <Tab value="activity"    label="Activity" />
          <Tab value="attachments" label="Attachments" />
        </Tabs>
      </Box>

      {/* ── Two-column content ── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Left column */}
        <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <ClaimContextStrip claim={claimCtx} />
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'records'     && <RecordsTab record={audit} />}
            {activeTab === 'findings'    && <FindingsTab record={audit} />}
            {activeTab === 'dispute'     && <DisputeTab record={audit} />}
            {activeTab === 'activity'    && <ActivityTab record={audit} onNavigateToCase={handleNavigate} />}
            {activeTab === 'attachments' && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
                <AttachFileOutlined sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">No attachments available for this audit case.</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right column */}
        <Box sx={{ flex: '0 0 40%', overflowY: 'auto', p: 2 }}>
          <RightColumn record={audit} onNavigateToCase={handleNavigate} />
        </Box>
      </Box>
    </Box>
  )
}
