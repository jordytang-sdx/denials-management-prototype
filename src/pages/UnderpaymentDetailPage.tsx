import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box, Typography, Chip, Avatar, Button, Paper,
  Tabs, Tab, LinearProgress, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Tooltip, Popover, List,
  ListItemButton, ListItemAvatar, ListItemText, Dialog,
  DialogTitle, DialogContent, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Divider, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material'
import {
  ArrowBackOutlined, AutoAwesomeOutlined, DescriptionOutlined,
  NavigateNextOutlined, ExpandMoreOutlined, ContentCopyOutlined, MoreVertOutlined,
  CheckCircleOutlined, TrendingDownOutlined, GavelOutlined,
  LightbulbOutlined, EditOutlined, CalendarMonthOutlined,
  FindInPageOutlined, SendOutlined, TaskAltOutlined, PaymentsOutlined,
  LinkOutlined, ReceiptLongOutlined, ArticleOutlined, CloseOutlined,
  AttachFileOutlined, InsertDriveFileOutlined, PictureAsPdfOutlined,
  CallReceivedOutlined, CallMadeOutlined, CheckCircleOutlineOutlined,
  HourglassEmptyOutlined,
  FormatBoldOutlined, FormatItalicOutlined, FormatListBulletedOutlined,
  FormatListNumberedOutlined, FolderZipOutlined, UploadFileOutlined,
  ChatBubbleOutlineOutlined, KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  DeleteOutlineOutlined, FaxOutlined, LocalShippingOutlined, OpenInBrowserOutlined,
  SmartToyOutlined,
} from '@mui/icons-material'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Anthropic from '@anthropic-ai/sdk'
import { SEED_UNDERPAYMENTS, type UnderpaymentRecord } from '../data/underpayments'
import { SEED_DENIALS } from '../data/denials'
import { SEED_AUDITS } from '../data/audits'
import { ClaimContextStrip, type ClaimContext } from '../components/ClaimContextStrip'
import { OnThisClaimWidget, type CaseOnClaim } from '../components/OnThisClaimWidget'
import { ActivityTimeline } from '../components/ActivityTimeline'
import type { TimelineEvent as CaseTimelineEvent } from '../data/caseTimeline'
import {
  UNDERPAYMENT_DETAILS, UP_REMIT_DATA, UP_CLAIM_DATA,
  UP_SUBMISSION_EPISODES,
  type AIFinding, type UPRemitData, type UPClaimData,
  type UPSubmissionEpisode, type UPEpisodeAttachment, type UPDeliveryMethod,
  type UnderpaymentDetail,
} from '../data/underpaymentDetail'
import { getCategoryConfig } from '../data/underpaymentCategoryConfig'
import { TEAM_MEMBERS, type TeamMember } from '../data/denials'
import { MEDICAL_RECORDS, type MedicalRecord } from '../data/medicalRecords'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

const STATE_COLORS: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#fef3ea', color: '#b86823' },
  Submitted: { bg: '#ebf5fb', color: '#2776a1' },
  Won:       { bg: '#eaf6f4', color: '#227a6c' },
  Recovered: { bg: '#eaf6f4', color: '#227a6c' },
  Closed:    { bg: '#f1f4f6', color: '#636a6f' },
  Archived:  { bg: '#f1f4f6', color: '#939a9f' },
}

const SEVERITY_COLORS: Record<AIFinding['severity'], { color: string; bg: string; label: string }> = {
  high:   { color: '#9f383e', bg: '#fbedee', label: 'High' },
  medium: { color: '#b86823', bg: '#fef3ea', label: 'Medium' },
  low:    { color: '#2776a1', bg: '#ebf5fb', label: 'Low' },
}

const FINDING_ICONS: Record<AIFinding['type'], React.ReactNode> = {
  contract:   <GavelOutlined sx={{ fontSize: 15 }} />,
  coding:     <DescriptionOutlined sx={{ fontSize: 15 }} />,
  billing:    <TrendingDownOutlined sx={{ fontSize: 15 }} />,
  regulatory: <CheckCircleOutlined sx={{ fontSize: 15 }} />,
  pattern:    <LightbulbOutlined sx={{ fontSize: 15 }} />,
}

// ── Timeline builder ──────────────────────────────────────────────────────────

type TimelineEvent = { timestamp: string; label: string; icon: React.ReactNode; color: string; summary: string; detail?: string; amount?: number }

function buildTimeline(record: UnderpaymentRecord): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      timestamp: record.dos,
      label: 'Date of Service',
      icon: <CalendarMonthOutlined sx={{ fontSize: 14 }} />,
      color: '#718096',
      summary: 'Service rendered',
    },
    {
      timestamp: record.createdAt,
      label: 'Identified',
      icon: <FindInPageOutlined sx={{ fontSize: 14 }} />,
      color: '#C2410C',
      summary: `Underpayment identified — ${record.category}`,
      detail: record.subtype,
      amount: record.varianceAmount,
    },
  ]

  const isPostActive = ['Submitted', 'Won', 'Recovered', 'Closed'].includes(record.state)
  const isPostSubmitted = ['Won', 'Recovered', 'Closed'].includes(record.state)
  const isWonOrRecovered = ['Won', 'Recovered'].includes(record.state)

  if (isPostActive) {
    events.push({ timestamp: record.createdAt, label: 'Demand Submitted', icon: <SendOutlined sx={{ fontSize: 14 }} />, color: '#276749', summary: `Demand letter submitted to ${record.payer}` })
  }
  if (isPostSubmitted) {
    events.push({ timestamp: record.createdAt, label: 'Response Received', icon: <TaskAltOutlined sx={{ fontSize: 14 }} />, color: isWonOrRecovered ? '#166534' : '#718096', summary: record.status })
  }
  if (record.state === 'Recovered' && record.recoveredAmount) {
    events.push({ timestamp: record.createdAt, label: 'Payment Posted', icon: <PaymentsOutlined sx={{ fontSize: 14 }} />, color: '#14532D', summary: '835 remittance confirmed recovery', amount: record.recoveredAmount })
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// ── 835 Remit Modal ───────────────────────────────────────────────────────────

function RemitModal({ remit, onClose }: { remit: UPRemitData; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">835 Remittance Detail</Typography>
          <Typography variant="body2" color="text.secondary">{remit.payerName} · ICN {remit.payerICN}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseOutlined fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Payment</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5, flexWrap: 'wrap' }}>
            {[
              { label: 'EFT / Check', value: remit.eftNumber },
              { label: 'Payment Date', value: formatDate(remit.paymentDate) },
              { label: 'Patient Control #', value: remit.patientControlNumber },
              { label: 'Date of Service', value: formatDate(remit.dos) },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Financials</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5 }}>
            {[
              { label: 'Billed',   value: formatCurrency(remit.claimBilledAmount) },
              { label: 'Allowed',  value: formatCurrency(remit.claimAllowedAmount) },
              { label: 'Paid',     value: formatCurrency(remit.claimPaidAmount) },
              { label: 'Adjusted', value: formatCurrency(remit.claimBilledAmount - remit.claimPaidAmount), highlight: true },
            ].map(({ label, value, highlight }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: highlight ? 'error.main' : 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Adjustments</Typography>
          {remit.adjustments.map((adj, i) => (
            <Box key={i} sx={{ mb: 1.5, pl: 1.5, borderLeft: '3px solid', borderColor: 'error.light' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline', mb: 0.25 }}>
                <Chip label={`Group: ${adj.groupCode}`} size="small" sx={{ height: 18, fontSize: '0.6875rem', '& .MuiChip-label': { px: 0.75 } }} />
                <Chip label={`CARC ${adj.carc}`} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'error.light', color: 'error.dark', height: 22 }} />
                {adj.rarc && <Chip label={`RARC ${adj.rarc}`} size="small" sx={{ fontSize: '0.75rem', height: 22 }} />}
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>−{formatCurrency(adj.amount)}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{adj.description}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Service Lines</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Line', 'Rev Code', 'Description', 'DOS', 'Billed', 'Allowed', 'Paid'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {remit.serviceLines.map(line => (
                  <TableRow key={line.lineNum}>
                    <TableCell sx={{ py: 0.75 }}>{line.lineNum}</TableCell>
                    <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8rem' }}>{line.revenueCode}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{line.description}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{formatDate(line.dos)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.billedAmount)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.allowedAmount)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.paidAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// ── 837 Claim Modal ───────────────────────────────────────────────────────────

function ClaimModal({ claim, onClose }: { claim: UPClaimData; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">837 Claim Detail</Typography>
          <Typography variant="body2" color="text.secondary">{claim.claimId} · HAR {claim.har}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseOutlined fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Claim Header</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5, flexWrap: 'wrap' }}>
            {[
              { label: 'Type of Bill',    value: claim.typeOfBill },
              { label: 'Billing NPI',     value: claim.billingNPI },
              { label: 'Tax ID',          value: claim.taxId },
              ...(claim.admitDate   ? [{ label: 'Admit Date',     value: formatDate(claim.admitDate) }] : []),
              ...(claim.dischargeDate ? [{ label: 'Discharge Date', value: formatDate(claim.dischargeDate) }] : []),
              ...(claim.drgCode     ? [{ label: 'DRG',            value: claim.drgCode }] : []),
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>ICD-10 Diagnoses</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Type', 'Code', 'Description'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {claim.diagnoses.map((dx, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 0.75 }}>
                      <Chip label={dx.type === 'primary' ? 'Primary' : 'Secondary'} size="small"
                        sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600,
                          bgcolor: dx.type === 'primary' ? 'error.light' : 'action.selected',
                          color: dx.type === 'primary' ? 'error.dark' : 'text.secondary',
                          '& .MuiChip-label': { px: 0.75 } }} />
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{dx.code}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{dx.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Revenue Lines</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Rev Code', 'Description', 'Qty', 'Amount'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {claim.revenueCodes.map((rc, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{rc.code}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{rc.description}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{rc.quantity ?? '—'}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatCurrency(rc.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// ── AI Findings Panel ─────────────────────────────────────────────────────────

function AIFindingsPanel({ findings }: { findings: AIFinding[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {findings.map((f, i) => {
        const sev = SEVERITY_COLORS[f.severity]
        return (
          <Paper key={i} variant="outlined" sx={{ p: 1.75, borderRadius: 1.5, borderColor: sev.color + '40', bgcolor: sev.bg }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
              <Box sx={{ color: sev.color, mt: 0.125 }}>{FINDING_ICONS[f.type]}</Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: sev.color, lineHeight: 1.3 }}>{f.title}</Typography>
                  <Chip label={sev.label} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: sev.color, color: '#fff', '& .MuiChip-label': { px: 0.625 } }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>{f.confidence}% confidence</Typography>
                <Box sx={{ width: 40 }}>
                  <LinearProgress variant="determinate" value={f.confidence}
                    sx={{ height: 3, borderRadius: 2, bgcolor: sev.color + '20', '& .MuiLinearProgress-bar': { bgcolor: sev.color } }} />
                </Box>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>{f.detail}</Typography>
          </Paper>
        )
      })}
    </Box>
  )
}

// ── Contract Terms Panel ──────────────────────────────────────────────────────

function ContractTermsPanel({ clauses }: { clauses: { section: string; title: string; text: string; relevance: string }[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(text: string, section: string) {
    navigator.clipboard.writeText(text)
    setCopied(section)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {clauses.map((clause, i) => (
        <Accordion key={i} variant="outlined" disableGutters
          sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, borderColor: '#BFDBFE' }}>
          <AccordionSummary expandIcon={<ExpandMoreOutlined sx={{ fontSize: 16 }} />}
            sx={{ px: 2, py: 0.5, minHeight: 44, bgcolor: '#EFF6FF', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip label={clause.section} size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#1D4ED8', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A' }}>{clause.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem' }}>Contract Language</Typography>
              <Tooltip title={copied === clause.section ? 'Copied!' : 'Copy text'}>
                <IconButton size="small" onClick={() => handleCopy(clause.text, clause.section)} sx={{ p: 0.25 }}>
                  <ContentCopyOutlined sx={{ fontSize: 13, color: copied === clause.section ? 'success.main' : 'text.disabled' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2"
              sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.8125rem', fontStyle: 'italic', bgcolor: '#F8FAFF', p: 1.25, borderRadius: 1, borderLeft: '3px solid #93C5FD', mb: 1.25 }}>
              "{clause.text}"
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>Why This Matters</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>{clause.relevance}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

// ── Clinical Content ──────────────────────────────────────────────────────────

function ClinicalContent({ mr }: { mr: MedicalRecord }) {
  const los = Math.ceil((new Date(mr.dischargeDate).getTime() - new Date(mr.admitDate).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 860 }}>
      {/* Patient & Admission */}
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Patient Demographics</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Date of Birth', value: formatDate(mr.dob) },
            { label: 'Sex',           value: mr.sex === 'M' ? 'Male' : 'Female' },
            { label: 'Insurance ID',  value: mr.insuranceId },
            { label: 'MRN',           value: mr.patientId },
          ].map(({ label, value }, i) => (
            <Box key={label} sx={{ px: 2.5, py: 1.25, borderRight: i % 2 === 0 ? '1px solid' : 'none', borderBottom: i < 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Admission</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Admit Date',          value: formatDate(mr.admitDate) },
            { label: 'Discharge Date',      value: formatDate(mr.dischargeDate) },
            { label: 'Length of Stay',      value: `${los} day${los !== 1 ? 's' : ''}` },
            { label: 'Admit Type',          value: mr.admitType },
            { label: 'Attending Physician', value: mr.attendingPhysician },
            { label: 'Facility',            value: mr.facility },
          ].map(({ label, value }, i) => (
            <Box key={label} sx={{ px: 2.5, py: 1.25, borderRight: i % 2 === 0 ? '1px solid' : 'none', borderBottom: i < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* DRG */}
      {mr.drg && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>DRG</Typography>
          </Box>
          <Box sx={{ px: 2.5, py: 1.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Billed DRG</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{mr.drg.billed}</Typography>
                <Typography variant="caption" color="text.secondary">Weight: {mr.drg.billedWeight.toFixed(4)}</Typography>
              </Box>
              {mr.drg.paidDrg && (
                <>
                  <Typography sx={{ color: 'error.main', fontWeight: 700, fontSize: '1.25rem' }}>→</Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Payer Downgraded To</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'error.main' }}>{mr.drg.paidDrg}</Typography>
                    <Typography variant="caption" sx={{ color: 'error.main' }}>Weight: {mr.drg.paidWeight?.toFixed(4)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Diagnoses */}
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Diagnoses</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Type', 'ICD-10', 'Description'].map(h => (
                  <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75, px: 2.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mr.diagnoses.map((dx, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ py: 0.75, px: 2.5 }}>
                    <Chip label={dx.type === 'primary' ? 'Primary' : 'Secondary'} size="small"
                      sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: dx.type === 'primary' ? 'error.light' : 'action.selected', color: dx.type === 'primary' ? 'error.dark' : 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
                  </TableCell>
                  <TableCell sx={{ py: 0.75, px: 2.5, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{dx.code}</TableCell>
                  <TableCell sx={{ py: 0.75, px: 2.5 }}>{dx.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Procedures */}
      {mr.procedures.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Procedures</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['CPT', 'Description', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75, px: 2.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mr.procedures.map((proc, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 0.75, px: 2.5, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{proc.code}</TableCell>
                    <TableCell sx={{ py: 0.75, px: 2.5 }}>{proc.description}</TableCell>
                    <TableCell sx={{ py: 0.75, px: 2.5 }}>{formatDate(proc.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Clinical Summary */}
      <Box>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Clinical Summary</Typography>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
          {mr.clinicalSummary.split('\n\n').map((para, i) => (
            <Typography key={i} variant="body2" sx={{ lineHeight: 1.75, color: 'text.secondary', mb: i < mr.clinicalSummary.split('\n\n').length - 1 ? 1.5 : 0 }}>
              {para}
            </Typography>
          ))}
        </Paper>
      </Box>

      {/* Key Dispute Facts */}
      {mr.keyFacts.length > 0 && (
        <Box>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Key Dispute Facts</Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: '#fef3ea', borderColor: '#f58a2e' }}>
            {mr.keyFacts.map((fact, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: i < mr.keyFacts.length - 1 ? 1 : 0 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#b86823', flexShrink: 0, mt: 0.75 }} />
                <Typography variant="body2" sx={{ color: '#b86823', lineHeight: 1.5 }}>{fact}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  )
}

// ── Attachments Tab ───────────────────────────────────────────────────────────

function fileIcon(name: string) {
  if (name.endsWith('.pdf')) return <PictureAsPdfOutlined sx={{ fontSize: 20, color: '#DC2626' }} />
  if (name.endsWith('.edi') || name.endsWith('.835') || name.endsWith('.837')) return <ReceiptLongOutlined sx={{ fontSize: 20, color: '#2563EB' }} />
  return <InsertDriveFileOutlined sx={{ fontSize: 20, color: '#6B7280' }} />
}

function AttachmentRow({ name, size, date, tags }: { name: string; size: string; date: string; tags: string[] }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      {fileIcon(name)}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{name}</Typography>
        <Typography variant="caption" color="text.secondary">{size} · {date}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        {tags.map(t => (
          <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }} />
        ))}
      </Box>
      <IconButton size="small" sx={{ color: 'text.disabled' }}>
        <AttachFileOutlined sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}

function AttachmentsTab({ record, hasRemit, hasClaim, hasMedicalRecord }: { record: UnderpaymentRecord; hasRemit: boolean; hasClaim: boolean; hasMedicalRecord: boolean }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: 780 }}>

      {/* Source Documents */}
      <Box>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Source Documents
        </Typography>
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          {hasRemit ? (
            <AttachmentRow
              name={`835_remit_${record.payer.replace(/\s/g, '_')}_${record.claim.har}.edi`}
              size="14.2 KB" date={formatDate(record.createdAt)} tags={['835', 'Remit']}
            />
          ) : (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No 835 remittance on file</Typography>
            </Box>
          )}
          {hasClaim && (
            <AttachmentRow
              name={`837_claim_${record.claim.har}.edi`}
              size="22.8 KB" date={formatDate(record.dos)} tags={['837', 'Claim']}
            />
          )}
          <AttachmentRow
            name={`EOP_${record.payer.replace(/\s/g, '_')}_${record.claim.har}.pdf`}
            size="182 KB" date={formatDate(record.createdAt)} tags={['EOP', 'PDF']}
          />
        </Paper>
      </Box>

      {/* Medical Record */}
      {hasMedicalRecord && (
        <Box>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            Medical Record
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <AttachmentRow
              name={`MedicalRecord_${record.patient.name.replace(/\s/g, '_')}_${record.claim.har}.pdf`}
              size="2.4 MB" date={formatDate(record.dos)} tags={['Medical Record', 'PDF']}
            />
            <AttachmentRow
              name={`OP_Report_${record.claim.har}.pdf`}
              size="340 KB" date={formatDate(record.dos)} tags={['Op Report', 'PDF']}
            />
          </Paper>
        </Box>
      )}

      {/* Demand Letter / Correspondence */}
      <Box>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Demand Letters &amp; Correspondence
        </Typography>
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          {['Submitted', 'Won', 'Recovered', 'Closed'].includes(record.state) ? (
            <AttachmentRow
              name={`DemandLetter_${record.payer.replace(/\s/g, '_')}_${record.claim.har}.pdf`}
              size="96 KB" date={formatDate(record.createdAt)} tags={['Demand Letter', 'PDF']}
            />
          ) : (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>Demand letter not yet generated</Typography>
            </Box>
          )}
          {['Won', 'Recovered', 'Closed'].includes(record.state) && (
            <AttachmentRow
              name={`PayerResponse_${record.payer.replace(/\s/g, '_')}_${record.claim.har}.pdf`}
              size="54 KB" date={formatDate(record.createdAt)} tags={['Payer Response', 'PDF']}
            />
          )}
        </Paper>
      </Box>

    </Box>
  )
}

// ── Demand Letter Tab ─────────────────────────────────────────────────────────

type UPChannel = 'portal' | 'fax' | 'mail'

const UP_CHANNEL_CONFIG: Record<UPChannel, { label: string; icon: React.ReactNode; description: string }> = {
  portal: { label: 'Payer Portal',   icon: <OpenInBrowserOutlined sx={{ fontSize: 15 }} />, description: 'Manual submission through payer web portal' },
  fax:    { label: 'Fax',            icon: <FaxOutlined sx={{ fontSize: 15 }} />,           description: 'Fax to payer dispute department' },
  mail:   { label: 'Certified Mail', icon: <LocalShippingOutlined sx={{ fontSize: 15 }} />, description: 'USPS certified mail to dispute address' },
}

interface UPPacketDoc { id: string; name: string; size: string; addedAt: string }

function UPPacketSection({
  label, icon, iconBg, emptyLabel, docs, onAdd, addLabel, addDisabled, addIcon, onMove, onRemove, singleDoc,
}: {
  label: string; icon: React.ReactNode; iconBg: string; emptyLabel: string
  docs: UPPacketDoc[]; onAdd: () => void; addLabel: string; addDisabled?: boolean
  addIcon?: React.ReactNode; onMove: ((idx: number, dir: 'up' | 'down') => void) | null
  onRemove: (id: string) => void; singleDoc?: boolean
}) {
  return (
    <Paper variant="outlined" sx={{ mt: 2, borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: docs.length > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 0.75, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{label}</Typography>
        {(!singleDoc || docs.length === 0) && (
          <Button size="small" variant="outlined" disabled={addDisabled} onClick={onAdd}
            startIcon={addIcon} sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none', flexShrink: 0 }}>{addLabel}</Button>
        )}
        {singleDoc && docs.length > 0 && (
          <Button size="small" variant="outlined" disabled={addDisabled} onClick={onAdd}
            sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none', flexShrink: 0 }}>Regenerate</Button>
        )}
      </Box>
      {docs.length === 0 && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>{emptyLabel}</Typography>
        </Box>
      )}
      {docs.map((doc, idx) => (
        <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderTop: idx > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
          <PictureAsPdfOutlined sx={{ fontSize: 16, color: 'error.main', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</Typography>
            <Typography variant="caption" color="text.disabled">{doc.size} · Added {formatDate(doc.addedAt)}</Typography>
          </Box>
          {onMove && (
            <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <IconButton size="small" disabled={idx === 0} onClick={() => onMove(idx, 'up')} sx={{ p: 0.25 }}>
                <KeyboardArrowUpOutlined sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" disabled={idx === docs.length - 1} onClick={() => onMove(idx, 'down')} sx={{ p: 0.25 }}>
                <KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}
          <IconButton size="small" onClick={() => onRemove(doc.id)} sx={{ p: 0.5, flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
            <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ))}
    </Paper>
  )
}

interface UPChatMessage { id: string; role: 'ai' | 'user'; content: string; timestamp: string }

function ToolbarBtn({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <Tooltip title={title}>
      <Box component="button" onClick={onClick}
        sx={{ border: 'none', background: active ? 'rgba(21,125,157,0.12)' : 'transparent', borderRadius: '4px', p: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: active ? 'primary.main' : 'text.secondary', '&:hover': { bgcolor: 'rgba(21,125,157,0.08)' } }}>
        {children}
      </Box>
    </Tooltip>
  )
}

function DemandLetterTab({ record }: { record: UnderpaymentRecord }) {
  const canAct = record.state === 'Active'

  const initialHtml = `<p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p>Provider Dispute Resolution Department<br/>${record.payer}</p>
<p><strong>RE: Underpayment Dispute — ${record.patient.name} | HAR: ${record.claim.har} | DOS: ${formatDate(record.dos)}</strong></p>
<p>Dear ${record.payer} Provider Dispute Resolution Team,</p>
<p>Memorial Health System is submitting a formal underpayment dispute regarding the above-referenced claim. Based on our review of the remittance advice and the applicable terms of our executed provider agreement, the payment received does not reflect the contracted rate, resulting in a variance of ${formatCurrency(record.varianceAmount)}.</p>
<h2>Claim Summary</h2>
<ul>
<li>Patient: ${record.patient.name} (MRN: ${record.patient.mrn})</li>
<li>HAR / Account: ${record.claim.har}</li>
<li>Date of Service: ${formatDate(record.dos)}</li>
<li>Amount Billed: ${formatCurrency(record.billedAmount)}</li>
<li>Amount Paid: ${formatCurrency(record.paidAmount)}</li>
<li>Contracted Amount: ${formatCurrency(record.expectedAmount)}</li>
<li>Disputed Variance: ${formatCurrency(record.varianceAmount)}</li>
</ul>
<h2>Basis for Dispute</h2>
<p>${record.subtype} — ${record.notes ?? 'Please see attached supporting documentation.'}</p>
<p>We respectfully request that ${record.payer} review and reprocess this claim in accordance with the applicable contract terms and remit the outstanding balance of ${formatCurrency(record.varianceAmount)} within 45 days of receipt of this letter.</p>
<p>Sincerely,<br/>Revenue Cycle Management<br/>Memorial Health System</p>`

  const editor = useEditor({ extensions: [StarterKit], content: initialHtml })

  const [channel, setChannel] = useState<UPChannel>('portal')
  const [faxNumber, setFaxNumber] = useState('')
  const [mailAddress, setMailAddress] = useState('')
  const [chatMessages, setChatMessages] = useState<UPChatMessage[]>([{
    id: 'init', role: 'ai', timestamp: new Date().toISOString(),
    content: `I've drafted a demand letter for ${record.patient.name} addressing the ${record.subtype.toLowerCase()} with ${record.payer}. The disputed variance is ${formatCurrency(record.varianceAmount)}. Edit directly or describe changes you'd like me to make.`,
  }])
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [letterPdf, setLetterPdf] = useState<UPPacketDoc | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [supportingDocs, setSupportingDocs] = useState<UPPacketDoc[]>([])
  const [priorCorrespondence, setPriorCorrespondence] = useState<UPPacketDoc[]>([])
  const [assembledPacket, setAssembledPacket] = useState<UPPacketDoc | null>(null)
  const [assembling, setAssembling] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const STUB_SUPPORTING = ['835_Remittance.edi', 'Contract_Exhibit_A_RateSchedule.pdf', 'DeviceInvoice.pdf', 'MedicalRecord_Relevant_Pages.pdf', '277-CA_Acknowledgment.edi', 'COB_MedicareEOB.pdf']
  const STUB_PRIOR = ['EOP_PayerRemittance.pdf', 'Prior_Correspondence.pdf', 'DenialLetter.pdf']

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  function handleGeneratePdf() {
    setGeneratingPdf(true)
    setTimeout(() => {
      setLetterPdf({ id: 'letter-pdf', name: `DemandLetter_${record.payer.replace(/\s/g,'_')}_${record.claim.har}.pdf`, size: '0.3 MB', addedAt: new Date().toISOString() })
      setGeneratingPdf(false)
    }, 900)
  }

  function handleAssemble() {
    setAssembling(true)
    setTimeout(() => {
      const count = (letterPdf ? 1 : 0) + supportingDocs.length
      setAssembledPacket({ id: 'packet', name: `DisputePacket_${record.id}_${new Date().toISOString().slice(0,10)}.pdf`, size: `${(count * 0.35 + 0.2).toFixed(1)} MB`, addedAt: new Date().toISOString() })
      setAssembling(false)
    }, 1400)
  }

  function addDoc(list: UPPacketDoc[], setList: React.Dispatch<React.SetStateAction<UPPacketDoc[]>>, stubs: string[]) {
    const name = stubs[list.length % stubs.length]!
    setList(prev => [...prev, { id: Date.now().toString(), name, size: `${(Math.random() * 2 + 0.3).toFixed(1)} MB`, addedAt: new Date().toISOString() }])
  }

  function moveDoc(setList: React.Dispatch<React.SetStateAction<UPPacketDoc[]>>, idx: number, dir: 'up' | 'down') {
    setList(prev => { const next = [...prev]; const swap = dir === 'up' ? idx - 1 : idx + 1; if (swap < 0 || swap >= next.length) return prev; [next[idx], next[swap]] = [next[swap]!, next[idx]!]; return next })
  }

  function removeDoc(setList: React.Dispatch<React.SetStateAction<UPPacketDoc[]>>, id: string) {
    setList(prev => prev.filter(d => d.id !== id))
  }

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 1600)
  }

  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || isGenerating || !editor) return
    const userMsg: UPChatMessage = { id: Date.now().toString(), role: 'user', content: prompt.trim(), timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMsg])
    setPrompt('')
    setIsGenerating(true)
    const currentHtml = editor.getHTML()
    const aiMsgId = (Date.now() + 1).toString()
    setChatMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', timestamp: new Date().toISOString() }])
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
      if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      const systemPrompt = `You are an expert healthcare revenue cycle specialist helping edit underpayment dispute letters.

Context:
- Patient: ${record.patient.name}
- Payer: ${record.payer}
- Issue: ${record.subtype}
- Variance: ${formatCurrency(record.varianceAmount)}
- DOS: ${formatDate(record.dos)}

Respond with JSON only: { "updatedLetter": "<full updated HTML>", "message": "Brief explanation of changes." }
Use only <p>, <strong>, <em>, <ul>, <ol>, <li>, <h2>, <h3> tags. Return the complete letter.`

      const history = chatMessages.filter(m => m.id !== 'init').map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.role === 'ai' ? JSON.stringify({ updatedLetter: currentHtml, message: m.content }) : m.content,
      }))
      history.push({ role: 'user', content: `Current letter:\n${currentHtml}\n\nRequest: ${userMsg.content}` })

      let fullResponse = ''
      const stream = await client.messages.stream({ model: 'claude-opus-4-6', max_tokens: 4096, system: systemPrompt, messages: history })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponse += event.delta.text
          try {
            const parsed = JSON.parse(fullResponse)
            setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: parsed.message ?? '' } : m))
          } catch {
            const msgMatch = fullResponse.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
            if (msgMatch) setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: msgMatch[1]!.replace(/\\n/g,'\n').replace(/\\"/g,'"') } : m))
          }
        }
      }
      try {
        const parsed = JSON.parse(fullResponse) as { updatedLetter: string; message: string }
        if (parsed.updatedLetter && parsed.updatedLetter !== currentHtml) editor.commands.setContent(parsed.updatedLetter)
        setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: parsed.message ?? 'Done.' } : m))
      } catch {
        setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullResponse } : m))
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong.'
      setChatMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: `Error: ${errMsg}` } : m))
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, isGenerating, editor, record, chatMessages])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Letter editor (left) ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

          {/* Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
            <ToolbarBtn title="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
              <FormatBoldOutlined sx={{ fontSize: 16 }} />
            </ToolbarBtn>
            <ToolbarBtn title="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <FormatItalicOutlined sx={{ fontSize: 16 }} />
            </ToolbarBtn>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <ToolbarBtn title="Heading 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>H2</Typography>
            </ToolbarBtn>
            <ToolbarBtn title="Heading 3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>H3</Typography>
            </ToolbarBtn>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <ToolbarBtn title="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              <FormatListBulletedOutlined sx={{ fontSize: 16 }} />
            </ToolbarBtn>
            <ToolbarBtn title="Numbered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              <FormatListNumberedOutlined sx={{ fontSize: 16 }} />
            </ToolbarBtn>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined"
              startIcon={generatingPdf ? null : <PictureAsPdfOutlined sx={{ fontSize: 14 }} />}
              onClick={handleGeneratePdf} disabled={generatingPdf}
              sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', py: 0.375, minWidth: 110 }}>
              {generatingPdf ? 'Generating…' : 'Generate PDF'}
            </Button>
          </Box>

          {/* Scrollable area */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>

            {/* Sticky AI bar */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid', borderColor: 'divider', boxShadow: chatOpen ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
              {chatOpen && (
                <Box sx={{ maxHeight: 260, overflow: 'auto', px: 2, pt: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  {chatMessages.map(msg => (
                    <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '75%', px: 1.25, py: 0.75, borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px', bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default', border: msg.role === 'ai' ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.45, color: msg.role === 'user' ? '#fff' : 'text.primary' }}>{msg.content}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.25, px: 0.5 }}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  ))}
                  {isGenerating && (
                    <Box sx={{ display: 'flex' }}>
                      <Box sx={{ px: 1.25, py: 0.75, borderRadius: '2px 12px 12px 12px', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Updating letter…</Typography>
                      </Box>
                    </Box>
                  )}
                  <div ref={chatEndRef} />
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1 }}>
                <SmartToyOutlined sx={{ fontSize: 16, color: 'secondary.main', flexShrink: 0 }} />
                <TextField fullWidth size="small" variant="standard" placeholder="Describe changes to the letter…"
                  value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPrompt() } }}
                  InputProps={{ disableUnderline: true }}
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem', py: 0.5 } }} />
                <Tooltip title={chatOpen ? 'Hide conversation' : 'Show conversation'}>
                  <IconButton size="small" onClick={() => setChatOpen(v => !v)}
                    sx={{ color: chatOpen ? 'primary.main' : 'text.disabled', bgcolor: chatOpen ? 'rgba(21,125,157,0.08)' : 'transparent', borderRadius: 1 }}>
                    <ChatBubbleOutlineOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={handleSendPrompt} disabled={!prompt.trim() || isGenerating}
                  sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 1.5, flexShrink: 0, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
                  <SendOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Letter */}
            <Box sx={{ px: 3, py: 3, bgcolor: 'grey.100', minHeight: 400 }}>
              <Box sx={{ maxWidth: 680, mx: 'auto', bgcolor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', borderRadius: 1, px: 6, py: 5,
                '& .tiptap': { outline: 'none', minHeight: 400, fontFamily: 'Georgia, serif', fontSize: '0.875rem', lineHeight: 1.7, color: '#1a202c',
                  '& h2': { fontSize: '1.1rem', fontWeight: 700, mt: 2.5, mb: 1, fontFamily: 'Inter, sans-serif', color: '#1B3A5C' },
                  '& h3': { fontSize: '0.95rem', fontWeight: 700, mt: 2, mb: 0.75, fontFamily: 'Inter, sans-serif', color: '#1B3A5C' },
                  '& p': { mb: 1.25 }, '& ul, & ol': { pl: 3, mb: 1.25 }, '& li': { mb: 0.5 }, '& strong': { fontWeight: 700 } },
              }}>
                <EditorContent editor={editor} />
              </Box>

              {/* Packet builder */}
              <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>Dispute Packet</Typography>
                <UPPacketSection label="Demand Letter" icon={<PictureAsPdfOutlined sx={{ fontSize: 16, color: '#fff' }} />} iconBg="#C0392B"
                  emptyLabel="Generate a PDF from the letter above to include it in the packet"
                  docs={letterPdf ? [letterPdf] : []} onAdd={handleGeneratePdf} addLabel="Generate PDF" addDisabled={generatingPdf}
                  addIcon={<PictureAsPdfOutlined sx={{ fontSize: 14 }} />} onMove={null} onRemove={() => setLetterPdf(null)} singleDoc />
                <UPPacketSection label="Supporting Documents" icon={<UploadFileOutlined sx={{ fontSize: 16, color: '#fff' }} />} iconBg="#2D7D9A"
                  emptyLabel="835 remittance, contract rate schedule, device invoices, Medicare EOB"
                  docs={supportingDocs} onAdd={() => addDoc(supportingDocs, setSupportingDocs, STUB_SUPPORTING)} addLabel="Attach"
                  onMove={(idx, dir) => moveDoc(setSupportingDocs, idx, dir)} onRemove={id => removeDoc(setSupportingDocs, id)} />
              </Box>

              <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, pb: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>Prior Correspondence</Typography>
                <UPPacketSection label="Uploaded Files" icon={<DescriptionOutlined sx={{ fontSize: 16, color: '#fff' }} />} iconBg="#718096"
                  emptyLabel="EOP, prior payer letters, existing correspondence"
                  docs={priorCorrespondence} onAdd={() => addDoc(priorCorrespondence, setPriorCorrespondence, STUB_PRIOR)} addLabel="Upload"
                  onMove={(idx, dir) => moveDoc(setPriorCorrespondence, idx, dir)} onRemove={id => removeDoc(setPriorCorrespondence, id)} />
              </Box>

              {/* Assemble */}
              <Box sx={{ maxWidth: 680, mx: 'auto', mt: 3, pb: 5 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>Assembled Packet</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.75rem' }}>Merges demand letter + supporting documents into a single submission-ready PDF</Typography>
                  </Box>
                  <Button variant="contained" disableElevation size="small" onClick={handleAssemble}
                    disabled={!canAct || assembling || (!letterPdf && supportingDocs.length === 0)}
                    startIcon={assembling ? null : assembledPacket ? <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} /> : <FolderZipOutlined sx={{ fontSize: 15 }} />}
                    sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', flexShrink: 0, ml: 2, bgcolor: assembledPacket ? 'success.main' : 'primary.main', '&:hover': { bgcolor: assembledPacket ? 'success.dark' : 'primary.dark' } }}>
                    {assembling ? 'Assembling…' : assembledPacket ? 'Re-assemble' : 'Assemble Packet'}
                  </Button>
                </Box>
                {assembledPacket && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f0faf4', border: '1px solid', borderColor: '#a8d5b5', borderRadius: 1.5 }}>
                    <PictureAsPdfOutlined sx={{ fontSize: 22, color: '#C0392B', flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assembledPacket.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{assembledPacket.size} · {(letterPdf ? 1 : 0) + supportingDocs.length} document{supportingDocs.length !== 0 ? 's' : ''} merged</Typography>
                    </Box>
                    <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: 'success.main', flexShrink: 0 }} />
                  </Box>
                )}
                {!assembledPacket && !assembling && (
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderZipOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>No packet assembled yet — click "Assemble Packet" to generate</Typography>
                  </Box>
                )}
                {assembling && (
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.light', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={16} thickness={5} />
                    <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 500 }}>Merging documents into packet…</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Right rail ── */}
        <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
          <Box sx={{ flex: 1, overflow: 'auto' }} />

          {/* Channel + submit */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Submission Channel</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <Select value={channel} onChange={e => setChannel(e.target.value as UPChannel)} sx={{ fontSize: '0.8125rem' }}
                renderValue={v => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {UP_CHANNEL_CONFIG[v as UPChannel].icon}
                    {UP_CHANNEL_CONFIG[v as UPChannel].label}
                  </Box>
                )}>
                {(Object.keys(UP_CHANNEL_CONFIG) as UPChannel[]).map(c => (
                  <MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {UP_CHANNEL_CONFIG[c].icon}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{UP_CHANNEL_CONFIG[c].label}</Typography>
                        <Typography variant="caption" color="text.secondary">{UP_CHANNEL_CONFIG[c].description}</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {channel === 'fax' && (
              <TextField fullWidth size="small" label="Fax Number" value={faxNumber} onChange={e => setFaxNumber(e.target.value)}
                placeholder="e.g. 1-800-000-0000" sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }} />
            )}
            {channel === 'mail' && (
              <TextField fullWidth size="small" label="Mailing Address" value={mailAddress} onChange={e => setMailAddress(e.target.value)}
                multiline rows={3} placeholder={'Dispute Resolution Unit\nP.O. Box 00000\nCity, ST 00000'}
                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }} />
            )}
            {assembledPacket && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <PictureAsPdfOutlined sx={{ fontSize: 18, color: '#C0392B', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>{assembledPacket.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>{assembledPacket.size}</Typography>
                </Box>
                <CheckCircleOutlineOutlined sx={{ fontSize: 15, color: 'success.main', flexShrink: 0 }} />
              </Box>
            )}
            {submitted ? (
              <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid', borderColor: '#86EFAC', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
                <TaskAltOutlined sx={{ fontSize: 22, color: 'success.main', mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', fontSize: '0.8125rem' }}>Dispute Submitted</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                  via {UP_CHANNEL_CONFIG[channel].label} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            ) : (
              <>
                <Button fullWidth variant="contained" disableElevation disabled={!canAct || !assembledPacket || submitting}
                  onClick={handleSubmit}
                  startIcon={submitting ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : null}
                  sx={{ fontWeight: 600, fontSize: '0.875rem', py: 0.875 }}>
                  {submitting ? 'Submitting…' : 'Submit Dispute'}
                </Button>
                {!assembledPacket && canAct && !submitting && (
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', fontSize: '0.7rem', mt: 0.75 }}>
                    Assemble a packet before submitting
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

const UP_DELIVERY_LABELS: Record<UPDeliveryMethod, string> = {
  fax:    'Fax',
  mail:   'Mail',
  portal: 'Portal',
  phone:  'Phone',
}

function upAttachmentIcon(type: UPEpisodeAttachment['type']) {
  if (type === '835_remit' || type === 'report_277') return <ReceiptLongOutlined sx={{ fontSize: 12 }} />
  if (type === 'pdf_eop') return <ArticleOutlined sx={{ fontSize: 12 }} />
  return <InsertDriveFileOutlined sx={{ fontSize: 12 }} />
}

function UPEpisodeRow({
  rowType, present, emptyLabel, attachments, children, isLast,
}: {
  rowType: 'signal' | 'action' | 'result'
  present: boolean
  emptyLabel: string
  attachments?: UPEpisodeAttachment[]
  children?: React.ReactNode
  isLast?: boolean
}) {
  const cfg = {
    signal: { label: 'Received',  icon: <CallReceivedOutlined sx={{ fontSize: 13 }} />, color: '#2C5282' },
    action: { label: 'Submitted', icon: <CallMadeOutlined    sx={{ fontSize: 13 }} />, color: '#276749' },
    result: { label: 'Result',    icon: present ? <CheckCircleOutlineOutlined sx={{ fontSize: 13 }} /> : <HourglassEmptyOutlined sx={{ fontSize: 13 }} />, color: present ? '#276749' : '#A0AEC0' },
  }[rowType]

  const iconColor = present ? cfg.color : '#A0AEC0'

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, px: 2, py: 1.5,
      borderBottom: isLast ? 'none' : '1px solid', borderColor: 'divider',
      bgcolor: present ? 'transparent' : 'rgba(0,0,0,0.015)',
    }}>
      <Box sx={{ flexShrink: 0, mt: 0.25 }}>
        <Box sx={{
          width: 26, height: 26, borderRadius: '50%',
          bgcolor: iconColor + '18', border: '1.5px solid', borderColor: iconColor + '40',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
        }}>
          {cfg.icon}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: present ? iconColor : 'text.disabled', letterSpacing: '0.08em', fontWeight: 700, lineHeight: 1.6 }}>
          {cfg.label}
        </Typography>
        {present ? (
          <>
            {children}
            {attachments && attachments.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {attachments.map(a => (
                  <Chip
                    key={a.label}
                    icon={upAttachmentIcon(a.type)}
                    label={a.label}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 22, fontSize: '0.7rem', fontFamily: 'monospace',
                      '& .MuiChip-label': { px: 0.75 },
                      '& .MuiChip-icon': { fontSize: 12, ml: '6px' },
                    }}
                  />
                ))}
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>{emptyLabel}</Typography>
        )}
      </Box>
    </Box>
  )
}

function UPEpisodeCard({ episode }: { episode: UPSubmissionEpisode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{episode.round}</Typography>
        <Typography variant="caption" color="text.secondary">{formatDate(episode.openedAt)}</Typography>
      </Box>

      <UPEpisodeRow rowType="signal" present={!!episode.signal} emptyLabel="No remittance recorded" attachments={episode.signal?.attachments}>
        {episode.signal && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{episode.signal.label}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{formatDate(episode.signal.date)}</Typography>
              {episode.signal.source && (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>{episode.signal.source}</Typography>
              )}
            </Box>
            {episode.signal.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.4 }}>{episode.signal.description}</Typography>
            )}
          </>
        )}
      </UPEpisodeRow>

      <UPEpisodeRow rowType="action" present={!!episode.action} emptyLabel="No demand letter submitted yet" attachments={episode.action?.attachments}>
        {episode.action && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{episode.action.label}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.25, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{formatDate(episode.action.date)}</Typography>
              <Chip label={UP_DELIVERY_LABELS[episode.action.method]} size="small"
                sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.6 } }} />
              {episode.action.reference && (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'secondary.main' }}>{episode.action.reference}</Typography>
              )}
            </Box>
            {episode.action.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.4 }}>{episode.action.notes}</Typography>
            )}
          </>
        )}
      </UPEpisodeRow>

      <UPEpisodeRow rowType="result" present={!!episode.result} emptyLabel="Awaiting payer response" isLast attachments={episode.result?.attachments}>
        {episode.result && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{episode.result.label}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">{formatDate(episode.result.date)}</Typography>
              {episode.result.source && (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>{episode.result.source}</Typography>
              )}
            </Box>
            {episode.result.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.4 }}>{episode.result.description}</Typography>
            )}
          </>
        )}
      </UPEpisodeRow>
    </Paper>
  )
}

function UPActivityTab({ episodes }: { episodes: UPSubmissionEpisode[] }) {
  return (
    <Box sx={{ p: 3, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...episodes].reverse().map(ep => (
        <UPEpisodeCard key={ep.id} episode={ep} />
      ))}
    </Box>
  )
}

// ── UP Right Column ───────────────────────────────────────────────────────────

function buildSharedTimeline(record: UnderpaymentRecord): CaseTimelineEvent[] {
  const events: CaseTimelineEvent[] = [
    { id: 'created', type: 'system_instance_created', timestamp: record.createdAt, summary: `Underpayment case ${record.id} created`, actor: 'System', actorType: 'system' },
    { id: 'identified', type: 'financial_variance_confirmed', timestamp: record.createdAt, summary: `Variance identified — ${record.category}`, amount: record.varianceAmount, actor: 'System', actorType: 'system' },
  ]
  if (['Submitted', 'Won', 'Recovered', 'Closed'].includes(record.state)) {
    events.push({ id: 'demand', type: 'action_demand_sent', timestamp: record.createdAt, summary: `Demand letter submitted to ${record.payer}`, actor: 'Jordan Tang', actorType: 'provider' })
  }
  if (['Won', 'Recovered', 'Closed'].includes(record.state)) {
    events.push({ id: 'response', type: record.state === 'Won' ? 'payer_overturned' : 'payer_upheld', timestamp: record.createdAt, summary: record.status, actor: record.payer, actorType: 'payer' })
  }
  if (record.state === 'Recovered' && record.recoveredAmount) {
    events.push({ id: 'payment', type: 'financial_recovery_confirmed', timestamp: record.createdAt, summary: '835 remittance confirmed recovery', amount: record.recoveredAmount, actor: 'System', actorType: 'system' })
  }
  return events
}

function UPRightColumn({ record, casesOnClaim, onNavigateToCase, detail }: {
  record: UnderpaymentRecord
  casesOnClaim: CaseOnClaim[]
  onNavigateToCase: (id: string, type: 'denial' | 'underpayment' | 'audit') => void
  detail: UnderpaymentDetail | undefined
}) {
  const catConfig = getCategoryConfig(record.category)
  const stateColor = STATE_COLORS[record.state]
  const sharedTimeline = buildSharedTimeline(record)
  const deadlineDays = daysUntil(record.deadline)

  return (
    <Box>
      {/* Activity Timeline */}
      <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
        Activity Timeline
      </Typography>
      <Box sx={{ mt: 1 }}>
        <ActivityTimeline events={sharedTimeline} onNavigateToCase={onNavigateToCase} />
      </Box>

      {/* UP Context */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          UP Context
        </Typography>
        <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden' }}>
          {/* Work queue */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Category</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 1, bgcolor: catConfig.bg, flexShrink: 0 }}>
                <catConfig.Icon sx={{ fontSize: 13, color: catConfig.color }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: catConfig.color }}>{record.category}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', pl: 0.25 }}>{record.subtype}</Typography>
          </Box>
          {/* Status */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Status</Typography>
            <Chip label={record.status} size="small" sx={{ bgcolor: stateColor?.bg, color: stateColor?.color, fontWeight: 600, fontSize: '0.7rem', height: 20, border: 'none', '& .MuiChip-label': { px: 0.75 } }} />
          </Box>
          {/* Payer + LOB */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Payer</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{record.payer}</Typography>
            {record.lineOfBusiness && <Typography variant="caption" color="text.secondary">{record.lineOfBusiness}</Typography>}
          </Box>
          {/* Key dates */}
          <Box sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Dates</Typography>
            {[
              { label: 'Date of Service', value: formatDate(record.dos) },
              { label: 'Identified',       value: formatDate(record.createdAt) },
              { label: 'Dispute Deadline', value: formatDate(record.deadline), urgent: deadlineDays <= 7 },
            ].map(({ label, value, urgent }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: urgent ? 'error.main' : 'text.primary' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Recommended Next Steps */}
      {detail?.recommendedNextSteps?.length ? (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
            <NavigateNextOutlined sx={{ fontSize: 15, color: '#059669' }} />
            <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em' }}>
              Recommended Next Steps
            </Typography>
          </Box>
          <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1.5, borderColor: '#6EE7B7', bgcolor: '#F0FDF4' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {detail.recommendedNextSteps.map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.125 }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 800 }}>{i + 1}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#064E3B', lineHeight: 1.5, fontSize: '0.8rem' }}>{step}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      ) : null}

      {/* Originating Denial */}
      {record.originatingDenialId && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>Originating Denial</Typography>
          <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5 }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <LinkOutlined sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontStyle: 'italic' }}>
                  {record.handoffReason === 'partial_denial' ? 'Partial denial handoff' :
                   record.handoffReason === 'post_overturn' ? 'Post-overturn underpayment' :
                   record.handoffReason === 'silent_downcode' ? 'Silent downcode' : 'Related denial'}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>
                {record.originatingDenialId}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* On This Claim */}
      {casesOnClaim.filter(c => !c.isCurrent).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <OnThisClaimWidget
            claimId={record.claim.claimId}
            cases={casesOnClaim}
            onNavigateToCase={onNavigateToCase}
          />
        </Box>
      )}
    </Box>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  underpaymentId: string
  onBack: () => void
  onNavigateToCase?: (caseId: string, caseType: 'denial' | 'underpayment' | 'audit') => void
}

export default function UnderpaymentDetailPage({ underpaymentId, onBack, onNavigateToCase }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null)
  const [showRemit, setShowRemit] = useState(false)
  const [showClaim, setShowClaim] = useState(false)

  const record = SEED_UNDERPAYMENTS.find(u => u.id === underpaymentId)
  if (!record) return null

  const [localAssignee, setLocalAssignee] = useState<TeamMember | null>(
    TEAM_MEMBERS.find(m => m.id === record.assignedTo?.id) ?? null
  )

  const detail    = UNDERPAYMENT_DETAILS[underpaymentId]
  const remit     = UP_REMIT_DATA[underpaymentId]
  const claim837  = UP_CLAIM_DATA[underpaymentId]
  const medRecord = MEDICAL_RECORDS[underpaymentId] ?? MEDICAL_RECORDS[record.patient.mrn]
  const episodes  = UP_SUBMISSION_EPISODES[underpaymentId] ?? []

  const catConfig  = getCategoryConfig(record.category)
  const stateColor = STATE_COLORS[record.state]
  const timeline   = buildTimeline(record)
  const deadlineDays = daysUntil(record.deadline)

  const recoveryRate = record.recoveredAmount
    ? Math.round((record.recoveredAmount / record.varianceAmount) * 100)
    : null

  // Shared component data
  const claimCtx: ClaimContext = {
    claimId: record.claim.claimId,
    har: record.claim.har,
    mrn: record.patient.mrn,
    dos: record.dos,
    billedAmount: record.billedAmount,
    paidAmount: record.paidAmount,
  }

  const casesOnClaim: CaseOnClaim[] = [
    { caseId: record.id, caseType: 'underpayment', state: record.state, status: record.status, amount: record.varianceAmount, assignee: record.assignedTo?.name ?? undefined, isCurrent: true },
    ...SEED_DENIALS.filter(d => d.claim.claimId === record.claim.claimId).map(d => ({ caseId: d.id, caseType: 'denial' as const, state: d.state, status: d.status, amount: d.deniedAmount, assignee: d.assignedTo?.name ?? undefined, isCurrent: false })),
    ...SEED_AUDITS.filter(a => a.claim.claimId === record.claim.claimId).map(a => ({ caseId: a.id, caseType: 'audit' as const, state: a.state, status: a.status, amount: a.amountAtRisk, assignee: a.assignedTo?.name ?? undefined, isCurrent: false })),
  ]

  function handleNavigateToCase(caseId: string, caseType: 'denial' | 'underpayment' | 'audit') {
    onNavigateToCase?.(caseId, caseType)
  }

  const financials = [
    { label: 'Billed',              value: formatCurrency(record.billedAmount),    color: 'text.primary' as const },
    { label: 'Paid by Payer',       value: formatCurrency(record.paidAmount),      color: 'text.primary' as const },
    { label: 'Expected (Contract)', value: formatCurrency(record.expectedAmount),  color: '#1D4ED8' },
    { label: 'Variance',            value: formatCurrency(record.varianceAmount),  color: '#991B1B', highlight: true },
    ...(record.recoveredAmount !== undefined ? [{
      label: 'Recovered', value: formatCurrency(record.recoveredAmount), color: '#14532D',
      sub: recoveryRate !== null ? `${recoveryRate}% of variance` : undefined,
    }] : []),
  ]

  const primaryCTA: { label: string } | null =
    record.state === 'Active'    ? { label: 'Submit Demand Letter' } :
    record.state === 'Submitted' ? { label: 'Record Payer Response' } :
    record.state === 'Won'       ? { label: 'Confirm Recovery' } :
    ['Recovered', 'Closed', 'Archived'].includes(record.state) ? { label: 'Restore' } :
    null

  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>

        {/* Row 1: back + [U] badge + case ID + state chip + spacer + Variance amount + deadline chip */}
        <Box sx={{ px: 2.5, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackOutlined sx={{ fontSize: 15 }} />}
            onClick={onBack}
            size="small"
            variant="text"
            sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8125rem', mr: 0.5 }}
          >
            Worklist
          </Button>
          <Divider orientation="vertical" flexItem />
          {/* [U] badge */}
          <Chip label="U" size="small" sx={{ height: 20, width: 20, fontSize: '0.625rem', fontWeight: 800, bgcolor: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px', '& .MuiChip-label': { px: 0 } }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {record.id}
          </Typography>
          <Chip label={record.state} size="small" sx={{ height: 20, fontWeight: 600, fontSize: '0.7rem', bgcolor: stateColor?.bg, color: stateColor?.color }} />
          <Box sx={{ flex: 1 }} />
          {/* Variance amount */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="error.main">Variance</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {formatCurrency(record.varianceAmount)}
            </Typography>
          </Box>
          {/* Deadline chip */}
          <Chip
            label={`${formatDate(record.deadline)} · ${deadlineDays < 0 ? `${Math.abs(deadlineDays)}d overdue` : `${deadlineDays}d remaining`}`}
            size="small"
            sx={{
              height: 20, fontSize: '0.6875rem', fontWeight: 600,
              bgcolor: deadlineDays <= 0 ? '#FEE2E2' : deadlineDays <= 3 ? '#FED7AA' : deadlineDays <= 7 ? '#FEF9C3' : 'action.selected',
              color: deadlineDays <= 0 ? '#B91C1C' : deadlineDays <= 3 ? '#C2410C' : deadlineDays <= 7 ? '#854D0E' : 'text.secondary',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        {/* Row 2: patient · mrn · payer · category icon+label · DOS */}
        <Box sx={{ px: 2.5, pb: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{record.patient.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{record.patient.mrn}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="body2" color="text.secondary">{record.payer}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 0.75, bgcolor: catConfig.bg }}>
              <catConfig.Icon sx={{ fontSize: 13, color: catConfig.color }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: catConfig.color }}>{record.category}</Typography>
          </Box>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="caption" color="text.secondary">DOS: {formatDate(record.dos)}</Typography>
        </Box>

        {/* Action bar (Zone 2): assignee chip + spacer + primary CTA + More */}
        <Box sx={{ px: 2.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
          {/* Assignee chip */}
          <Box
            onClick={e => setAssigneeAnchor(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', borderRadius: 1,
              px: 0.75, py: 0.375, border: '1px solid', borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar sx={{ width: 22, height: 22, fontSize: '0.5625rem', bgcolor: '#DBEAFE', color: '#1D4ED8' }}>
              {localAssignee ? localAssignee.initials : '?'}
            </Avatar>
            {localAssignee ? (
              <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{localAssignee.name}</Typography>
            ) : (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Unassigned</Typography>
            )}
          </Box>
          <Popover
            open={Boolean(assigneeAnchor)}
            anchorEl={assigneeAnchor}
            onClose={() => setAssigneeAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { width: 200, borderRadius: 1.5, mt: 0.5 } } }}
          >
            <List dense disablePadding sx={{ py: 0.5 }}>
              {TEAM_MEMBERS.map(m => (
                <ListItemButton key={m.id} selected={localAssignee?.id === m.id}
                  onClick={() => { setLocalAssignee(m); setAssigneeAnchor(null) }}
                  sx={{ px: 1.5, py: 0.75, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff' } }}>
                  <ListItemAvatar sx={{ minWidth: 34 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: localAssignee?.id === m.id ? 'rgba(255,255,255,0.25)' : 'primary.light' }}>{m.initials}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.8125rem' }}>{m.name}</Typography>} />
                </ListItemButton>
              ))}
              {localAssignee && (
                <ListItemButton onClick={() => { setLocalAssignee(null); setAssigneeAnchor(null) }}
                  sx={{ px: 1.5, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Unassign</Typography>} />
                </ListItemButton>
              )}
            </List>
          </Popover>
          <Box sx={{ flex: 1 }} />
          {/* Primary CTA + More */}
          {primaryCTA && (
            <Button variant="contained" size="small" disableElevation sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
              {primaryCTA.label}
            </Button>
          )}
          <Button
            size="small" variant="outlined"
            onClick={e => setMoreMenuAnchor(e.currentTarget)}
            endIcon={<ExpandMoreOutlined sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.75rem', color: 'text.secondary', borderColor: 'divider' }}
          >
            More
          </Button>
          <Popover
            open={Boolean(moreMenuAnchor)}
            anchorEl={moreMenuAnchor}
            onClose={() => setMoreMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 1.5, minWidth: 160 } } }}
          >
            {['Close', 'Archive'].map(label => (
              <ListItemButton key={label} dense onClick={() => setMoreMenuAnchor(null)} sx={{ px: 2, py: 1 }}>
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
              </ListItemButton>
            ))}
          </Popover>
        </Box>

        {/* Tabs row */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ minHeight: 38, px: 2, '& .MuiTabs-indicator': { height: 2 }, '& .MuiTab-root': { minHeight: 38, py: 0, fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0 } }}>
          <Tab label="Overview" />
          <Tab label="Activity" />
          <Tab label="Demand Letter" />
          <Tab label="Clinical" />
          <Tab label="Attachments" />
        </Tabs>
      </Box>

      {/* ── Two-column body ───────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left column */}
        <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <ClaimContextStrip claim={claimCtx} />
          <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>

            {/* ── Overview tab ── */}
            {activeTab === 0 && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Financial Summary */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Financial Summary</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${financials.length}, 1fr)`, gap: 2, mt: 1 }}>
                    {financials.map(({ label, value, color, highlight, sub }) => (
                      <Box key={label} sx={{ bgcolor: highlight ? '#FEF2F2' : undefined, borderRadius: 1, p: highlight ? 0.75 : 0 }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{value}</Typography>
                        {sub && <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>{sub}</Typography>}
                      </Box>
                    ))}
                  </Box>
                  {(claim837 || remit) && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      {claim837 && (
                        <Button size="small" variant="text" onClick={() => setShowClaim(true)}
                          startIcon={<ArticleOutlined sx={{ fontSize: 13 }} />}
                          sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'secondary.main', fontWeight: 600 }}>
                          View Claim
                        </Button>
                      )}
                      {remit && (
                        <Button size="small" variant="text" onClick={() => setShowRemit(true)}
                          startIcon={<ReceiptLongOutlined sx={{ fontSize: 13 }} />}
                          sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'secondary.main', fontWeight: 600 }}>
                          View Remit
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>

                {/* AI Analysis */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <AutoAwesomeOutlined sx={{ fontSize: 15, color: '#7C3AED' }} />
                    <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#7C3AED', letterSpacing: '0.08em' }}>AI Analysis</Typography>
                  </Box>
                  {detail?.aiFindings?.length ? (
                    <AIFindingsPanel findings={detail.aiFindings} />
                  ) : (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.5, textAlign: 'center' }}>
                      <AutoAwesomeOutlined sx={{ fontSize: 28, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Analysis in progress.</Typography>
                    </Paper>
                  )}
                  {detail?.contractClauses?.length ? (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                        <GavelOutlined sx={{ fontSize: 14, color: '#1D4ED8' }} />
                        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em' }}>Relevant Contract Terms</Typography>
                      </Box>
                      <ContractTermsPanel clauses={detail.contractClauses} />
                    </Box>
                  ) : null}
                </Box>

                {/* Notes */}
                {record.notes && (
                  <Box>
                    <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Case Notes</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{record.notes}</Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}

            {/* ── Activity tab ── */}
            {activeTab === 1 && <UPActivityTab episodes={episodes} />}

            {/* ── Demand Letter tab ── */}
            {activeTab === 2 && <DemandLetterTab record={record} />}

            {/* ── Clinical tab ── */}
            {activeTab === 3 && (
              <Box sx={{ p: 3 }}>
                {medRecord ? (
                  <ClinicalContent mr={medRecord} />
                ) : (
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 1.5, textAlign: 'center', maxWidth: 500, mx: 'auto', mt: 4 }}>
                    <DescriptionOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>No medical record on file</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clinical documentation for this patient has not been retrieved yet. Request records through HealthSource or attach manually.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* ── Attachments tab ── */}
            {activeTab === 4 && (
              <AttachmentsTab
                record={record}
                hasRemit={!!remit}
                hasClaim={!!claim837}
                hasMedicalRecord={!!medRecord}
              />
            )}
          </Box>
        </Box>

        {/* Right column */}
        <Box sx={{ flex: '0 0 40%', overflowY: 'auto', p: 2 }}>
          <UPRightColumn
            record={record}
            casesOnClaim={casesOnClaim}
            onNavigateToCase={handleNavigateToCase}
            detail={detail}
          />
        </Box>
      </Box>

      {/* Modals */}
      {showRemit && remit && <RemitModal remit={remit} onClose={() => setShowRemit(false)} />}
      {showClaim && claim837 && <ClaimModal claim={claim837} onClose={() => setShowClaim(false)} />}

    </Box>
  )
}
