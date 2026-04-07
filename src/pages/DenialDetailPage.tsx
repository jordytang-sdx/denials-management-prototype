import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Box, Typography, Button, Chip, Tabs, Tab, Divider, Avatar,
  Tooltip, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Popover, List, ListItemButton, ListItemAvatar, ListItemText,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
} from '@mui/material'
import {
  ArrowBackOutlined,
  ReceiptLongOutlined,
  PictureAsPdfOutlined,
  MailOutlineOutlined,
  AddCircleOutlineOutlined,
  AccountTreeOutlined,
  SendOutlined,
  UploadFileOutlined,
  CheckCircleOutlineOutlined,
  StickyNote2Outlined,
  PersonAddOutlined,
  PhoneOutlined,
  HourglassEmptyOutlined,
  CancelOutlined,
  TaskAltOutlined,
  FlagOutlined,
  CloseOutlined,
  InfoOutlined,
  CallReceivedOutlined,
  CallMadeOutlined,
  AttachFileOutlined,
  ArticleOutlined,
  EditOutlined,
  FormatBoldOutlined,
  FormatItalicOutlined,
  FormatListBulletedOutlined,
  FormatListNumberedOutlined,
  SmartToyOutlined,
  SendOutlined as SendIcon,
  FaxOutlined,
  LocalShippingOutlined,
  OpenInBrowserOutlined,
  ExpandMoreOutlined,
  WarningOutlined,
  KeyboardArrowUpOutlined,
  KeyboardArrowDownOutlined,
  DeleteOutlineOutlined,
  ChatBubbleOutlineOutlined,
  LibraryBooksOutlined,
  SyncOutlined,
  VerifiedOutlined,
  AccountBalanceOutlined,
  BadgeOutlined,
  ContentPasteOutlined,
  DoneAllOutlined,
  GavelOutlined,
  PaymentsOutlined,
  AccessTimeOutlined,
  InsertDriveFileOutlined,
  DescriptionOutlined,
  FolderZipOutlined,
  LinkOutlined,
  AddOutlined,
  CheckOutlined,
  BlockOutlined,
  RemoveCircleOutlineOutlined,
} from '@mui/icons-material'
import { SEED_DENIALS, TEAM_MEMBERS, type TeamMember, type DenialRecord, type ActiveStatus, type ResolvedStatus, type DenialStatus, type AppealRound, type AppealRoundType } from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'
import {
  CARC_DESCRIPTIONS, RARC_DESCRIPTIONS,
  REMIT_DATA, CLAIM_DATA_837, TIMELINE_EVENTS, SUBMISSION_EPISODES,
  DENIAL_OUTCOMES, UNDERPAYMENT_DATA, type DenialOutcome, type OutcomeDisposition,
  type TimelineEvent, type TimelineEventType,
  type SubmissionEpisode, type DeliveryMethod,
  type EpisodeAttachment, type AttachmentType,
} from '../data/denialDetail'
import {
  APPEAL_LETTERS, APPEAL_TEMPLATES, getDefaultTemplate, getAvailableTemplates, getGenericLetter,
  getSubmissionInstructions, type AppealTemplate, type SubmissionInstructions,
} from '../data/appealLetters'
import { MEDICAL_RECORDS, type MedicalRecord } from '../data/medicalRecords'

// ─── Shared ───────────────────────────────────────────────────────────────────

function ReadOnlyBanner({ state }: { state: string }) {
  return (
    <Alert
      severity={state === 'Archived' ? 'warning' : 'info'}
      sx={{ mx: 3, mt: 2, borderRadius: 1.5, fontSize: '0.8125rem' }}
    >
      {state === 'Archived'
        ? 'This denial is archived — all actions are disabled. Use "Restore" to return it to its previous state.'
        : <>This denial is in <strong>{state}</strong> state — submission actions are disabled.
            {state === 'Submitted' && ' Use "Record Payer Decision" above when a response is received.'}</>
      }
    </Alert>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-02')

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - TODAY.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

// ─── Resolution Engine ────────────────────────────────────────────────────────

type ResolutionEngine = 'appeal' | 'records_request' | 'corrected_claim' | 'filing_defense' | 'recoupment' | 'eligibility' | 'underpayment'

function getResolutionEngine(denialType: string): ResolutionEngine {
  switch (denialType) {
    case 'Medical Necessity':
    case 'DRG Downgrade':
    case 'Authorization':  return 'appeal'
    case 'ADR':            return 'records_request'
    case 'Coding Error':
    case 'Administrative': return 'corrected_claim'
    case 'Timely Filing':  return 'filing_defense'
    case 'Recoupment':     return 'recoupment'
    case 'Eligibility':    return 'eligibility'
    case 'Underpayment':   return 'underpayment'
    default:               return 'appeal'
  }
}

function getDefaultActiveStatus(engine: ResolutionEngine): ActiveStatus {
  switch (engine) {
    case 'appeal':          return 'Appeal Drafting'
    case 'records_request': return 'Awaiting Records'
    case 'eligibility':     return 'Eligibility Investigation'
    default:                return 'In Progress'
  }
}

const ENGINE_LABELS: Record<ResolutionEngine, string> = {
  appeal:           'Appeal',
  records_request:  'Records Request',
  corrected_claim:  'Corrected Claim',
  filing_defense:   'Filing Defense',
  recoupment:       'Recoupment',
  eligibility:      'Eligibility',
  underpayment:     'Payment Dispute',
}

// ─── Timeline config ──────────────────────────────────────────────────────────

interface EventMeta { icon: React.ReactNode; color: string; label: string }

function getEventMeta(type: TimelineEventType): EventMeta {
  const cfg: Record<TimelineEventType, EventMeta> = {
    signal_835:              { icon: <ReceiptLongOutlined sx={{ fontSize: 15 }} />,        color: '#2C5282', label: '835 Remit' },
    signal_pdf_denial:       { icon: <PictureAsPdfOutlined sx={{ fontSize: 15 }} />,       color: '#C0392B', label: 'Denial Letter' },
    signal_pdf_adr:          { icon: <MailOutlineOutlined sx={{ fontSize: 15 }} />,         color: '#B7770D', label: 'ADR' },
    signal_pdf_recoupment:   { icon: <PictureAsPdfOutlined sx={{ fontSize: 15 }} />,       color: '#C0392B', label: 'Recoupment Notice' },
    instance_created:        { icon: <AddCircleOutlineOutlined sx={{ fontSize: 15 }} />,   color: '#718096', label: 'Instance Created' },
    routing_applied:         { icon: <AccountTreeOutlined sx={{ fontSize: 15 }} />,        color: '#718096', label: 'Routing Applied' },
    match_flagged:           { icon: <FlagOutlined sx={{ fontSize: 15 }} />,               color: '#B7770D', label: 'Flag Set' },
    action_appeal_l1:        { icon: <SendOutlined sx={{ fontSize: 15 }} />,               color: '#276749', label: 'Level 1 Appeal' },
    action_appeal_l2:        { icon: <SendOutlined sx={{ fontSize: 15 }} />,               color: '#276749', label: 'Level 2 Appeal' },
    action_appeal_l3:        { icon: <SendOutlined sx={{ fontSize: 15 }} />,               color: '#276749', label: 'Level 3 Appeal' },
    action_records_requested:{ icon: <UploadFileOutlined sx={{ fontSize: 15 }} />,         color: '#2D7D9A', label: 'Records Requested' },
    action_records_submitted:{ icon: <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} />, color: '#276749', label: 'Records Submitted' },
    action_resubmit:         { icon: <SendOutlined sx={{ fontSize: 15 }} />,               color: '#276749', label: 'Resubmission' },
    action_note:             { icon: <StickyNote2Outlined sx={{ fontSize: 15 }} />,        color: '#4A5568', label: 'Note' },
    action_assign:           { icon: <PersonAddOutlined sx={{ fontSize: 15 }} />,          color: '#718096', label: 'Assigned' },
    action_peer_to_peer:     { icon: <PhoneOutlined sx={{ fontSize: 15 }} />,              color: '#2D7D9A', label: 'Peer-to-Peer' },
    payer_pending:           { icon: <HourglassEmptyOutlined sx={{ fontSize: 15 }} />,     color: '#B7770D', label: 'Payer Pending' },
    payer_upheld:            { icon: <CancelOutlined sx={{ fontSize: 15 }} />,             color: '#C0392B', label: 'Upheld' },
    payer_overturned:        { icon: <TaskAltOutlined sx={{ fontSize: 15 }} />,            color: '#1E7E4A', label: 'Overturned' },
    payer_partial:           { icon: <TaskAltOutlined sx={{ fontSize: 15 }} />,            color: '#B7770D', label: 'Partially Overturned' },
  }
  return cfg[type]
}

// ─── Remit Modal ──────────────────────────────────────────────────────────────

function RemitModal({ denialId, onClose }: { denialId: string; onClose: () => void }) {
  const remit = REMIT_DATA[denialId]
  if (!remit) return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remit Data
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent><Typography variant="body2" color="text.secondary">No 835 remit data available for this denial.</Typography></DialogContent>
    </Dialog>
  )

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">835 Remittance Detail</Typography>
        <Typography variant="body2" color="text.secondary">{remit.payerName} · ICN {remit.payerICN}</Typography>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>

        {/* Payment header */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Payment</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5, flexWrap: 'wrap' }}>
            {[
              { label: 'EFT / Check', value: remit.eftNumber },
              { label: 'Payment Date', value: formatDate(remit.paymentDate) },
              { label: 'Payer ID', value: remit.payerID },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Claim header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Claim</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5, flexWrap: 'wrap' }}>
            {[
              { label: 'Payer ICN', value: remit.payerICN },
              { label: 'Patient Control #', value: remit.patientControlNumber },
              { label: 'Rendering NPI', value: remit.renderingNPI },
              { label: 'Date of Service', value: formatDate(remit.dos) },
              { label: 'Claim Status', value: `${remit.claimStatusCode} — ${remit.claimStatusDescription}` },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Financial summary */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Financials</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.5 }}>
            {[
              { label: 'Billed (837)', value: formatCurrency(remit.claimBilledAmount) },
              { label: 'Allowed', value: formatCurrency(remit.claimAllowedAmount) },
              { label: 'Paid', value: formatCurrency(remit.claimPaidAmount) },
              { label: 'Adjusted', value: formatCurrency(remit.claimBilledAmount - remit.claimAllowedAmount), highlight: true },
            ].map(({ label, value, highlight }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: highlight ? 'error.main' : 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Adjustments */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Claim Adjustments</Typography>
          {remit.adjustments.map((adj, i) => {
            const carcInfo = CARC_DESCRIPTIONS[adj.carc]
            const rarcInfo = adj.rarc ? RARC_DESCRIPTIONS[adj.rarc] : null
            return (
              <Box key={i} sx={{ mb: 1.5, pl: 1.5, borderLeft: '3px solid', borderColor: 'error.light' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Chip label={`Group: ${adj.groupCode}`} size="small" sx={{ height: 18, fontSize: '0.6875rem', '& .MuiChip-label': { px: 0.75 } }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{adj.carc}</Typography>
                  {adj.rarc && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{adj.rarc}</Typography>}
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>−{formatCurrency(adj.amount)}</Typography>
                </Box>
                {carcInfo && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{carcInfo.full}</Typography>}
                {rarcInfo && <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block' }}>{rarcInfo.full}</Typography>}
              </Box>
            )
          })}
        </Box>

        {/* Service lines */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Service Lines</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Line', 'Procedure', 'DOS', 'Billed', 'Allowed', 'Paid', 'Adjustment'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {remit.serviceLines.map(line => (
                  <TableRow key={line.lineNum}>
                    <TableCell sx={{ py: 0.75 }}>{line.lineNum}</TableCell>
                    <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8rem' }}>{line.procedureCode}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{formatDate(line.dos)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.billedAmount)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.allowedAmount)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(line.paidAmount)}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums', color: 'error.main', fontWeight: 600 }}>
                      {line.adjustments.length > 0 ? `−${formatCurrency(line.adjustments.reduce((s, a) => s + a.amount, 0))}` : '—'}
                    </TableCell>
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

// ─── 837 Claim Modal ──────────────────────────────────────────────────────────

const ADMISSION_TYPES: Record<string, string> = { '1': 'Elective', '2': 'Urgent', '3': 'Emergency', '4': 'Newborn' }
const ADMISSION_SOURCES: Record<string, string> = { '1': 'Physician referral', '2': 'Clinic referral', '4': 'Transfer from hospital', '7': 'Emergency room', '9': 'Information not available' }
const DISCHARGE_STATUS: Record<string, string> = { '01': 'Discharged home', '02': 'Discharged to short-term hospital', '03': 'Discharged to skilled nursing facility', '20': 'Expired', '30': 'Still patient' }
const TOB_DESCRIPTIONS: Record<string, string> = { '111': 'Hospital Inpatient — Admit Through Discharge', '131': 'Hospital Outpatient — Admit Through Discharge', '121': 'Hospital Inpatient — Interim', }

function Claim837Modal({ denialId, onClose }: { denialId: string; onClose: () => void }) {
  const claim = CLAIM_DATA_837[denialId]
  if (!claim) return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>837 Claim
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}><CloseOutlined fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent><Typography variant="body2" color="text.secondary">No 837 claim data available for this denial.</Typography></DialogContent>
    </Dialog>
  )

  const tob = TOB_DESCRIPTIONS[claim.typeOfBill] ?? `Type ${claim.typeOfBill}`

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">837 Institutional Claim</Typography>
        <Typography variant="body2" color="text.secondary">{claim.billingProviderName} · {claim.claimId}</Typography>
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>

        {/* Claim header */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Claim Header</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.75, flexWrap: 'wrap' }}>
            {[
              { label: 'Type of Bill', value: `${claim.typeOfBill} — ${tob}` },
              { label: 'Billing NPI', value: claim.billingProviderNPI },
              { label: 'Tax ID', value: claim.billingProviderTaxId },
              { label: 'Admission', value: formatDate(claim.admissionDate) },
              { label: 'Discharge', value: formatDate(claim.dischargeDate) },
              { label: 'LOS', value: `${Math.round((new Date(claim.dischargeDate).getTime() - new Date(claim.admissionDate).getTime()) / 86400000)} days` },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Admission details */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Admission</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.75, flexWrap: 'wrap' }}>
            {[
              { label: 'Type', value: `${claim.admissionType} — ${ADMISSION_TYPES[claim.admissionType] ?? claim.admissionType}` },
              { label: 'Source', value: `${claim.admissionSource} — ${ADMISSION_SOURCES[claim.admissionSource] ?? claim.admissionSource}` },
              { label: 'Discharge Status', value: `${claim.dischargeStatus} — ${DISCHARGE_STATUS[claim.dischargeStatus] ?? claim.dischargeStatus}` },
              ...(claim.drgClaimed ? [{ label: 'DRG Claimed', value: claim.drgClaimed }] : []),
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Subscriber */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Subscriber</Typography>
          <Box sx={{ display: 'flex', gap: 4, mt: 0.75, flexWrap: 'wrap' }}>
            {[
              { label: 'Name', value: claim.subscriberName },
              { label: 'Insurance ID', value: claim.subscriberInsuranceId },
              { label: 'Group Number', value: claim.subscriberGroupNumber },
              { label: 'Date of Birth', value: formatDate(claim.patientDob) },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Diagnoses */}
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>ICD-10 Diagnoses</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
              <Chip label="PDX" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'primary.light', color: 'primary.dark', '& .MuiChip-label': { px: 0.75 }, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0 }}>{claim.principalDiagnosis.code}</Typography>
              <Typography variant="body2" color="text.secondary">{claim.principalDiagnosis.description}</Typography>
            </Box>
            {claim.secondaryDiagnoses.map((dx, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
                <Chip label={`SDX${i + 1}`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', flexShrink: 0 }}>{dx.code}</Typography>
                <Typography variant="body2" color="text.secondary">{dx.description}</Typography>
              </Box>
            ))}
            {claim.principalProcedure && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline', mt: 0.5 }}>
                <Chip label="PPX" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'success.light', color: 'success.dark', '& .MuiChip-label': { px: 0.75 }, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0 }}>{claim.principalProcedure.code}</Typography>
                <Typography variant="body2" color="text.secondary">{claim.principalProcedure.description}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Service lines */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Revenue Lines</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              Total billed: {formatCurrency(claim.totalBilledAmount)}
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Rev Code', 'Description', 'DOS', 'Units', 'Billed'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {claim.serviceLines.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{line.revenueCode}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{line.revenueDescription}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{formatDate(line.dos)}</TableCell>
                    <TableCell sx={{ py: 0.75 }}>{line.units}</TableCell>
                    <TableCell sx={{ py: 0.75, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatCurrency(line.billedAmount)}</TableCell>
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

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No timeline events recorded.</Typography></Box>
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      {events.map((event, idx) => {
        const meta = getEventMeta(event.type)
        const isLast = idx === events.length - 1
        return (
          <Box key={event.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
            {/* Connector line */}
            {!isLast && (
              <Box sx={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 2, bgcolor: 'divider', zIndex: 0 }} />
            )}

            {/* Icon */}
            <Box sx={{ flexShrink: 0, zIndex: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%',
                bgcolor: meta.color + '18',
                border: '2px solid',
                borderColor: meta.color + '44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: meta.color,
              }}>
                {meta.icon}
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, pb: isLast ? 0 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: meta.color + '14', color: meta.color, border: 'none', '& .MuiChip-label': { px: 0.75 } }}
                />
                <Typography variant="caption" color="text.secondary">{formatDateTime(event.timestamp)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>·</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{event.actor}</Typography>
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, lineHeight: 1.4 }}>{event.summary}</Typography>

              {event.detail && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>{event.detail}</Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                {event.amount !== undefined && (
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(event.amount)}
                  </Typography>
                )}
                {event.document && (
                  <Typography variant="caption" sx={{ color: 'secondary.main', fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {event.document}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Episode Card ─────────────────────────────────────────────────────────────

// ─── Attachment helpers ────────────────────────────────────────────────────────

function attachmentIcon(type: AttachmentType): React.ReactElement {
  switch (type) {
    case '835_remit':      return <ReceiptLongOutlined sx={{ fontSize: 12 }} />
    case 'pdf_denial':
    case 'pdf_adr':
    case 'pdf_recoupment': return <PictureAsPdfOutlined sx={{ fontSize: 12 }} />
    case 'report_277':     return <ArticleOutlined     sx={{ fontSize: 12 }} />
    case 'document':       return <AttachFileOutlined  sx={{ fontSize: 12 }} />
  }
}

function DocumentPreviewModal({ attachment, onClose }: { attachment: EpisodeAttachment; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {attachmentIcon(attachment.type)}
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>{attachment.label}</Typography>
        </Box>
        {attachment.ref && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{attachment.ref}</Typography>
        )}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, color: 'text.disabled' }}>
          {attachmentIcon(attachment.type)}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Document preview is not available in this prototype.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
            {attachment.label}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  fax:          'Fax',
  mail:         'Mail',
  portal:       'Portal',
  esmd:         'ESMD',
  clearinghouse:'Clearinghouse',
  phone:        'Phone',
}

function EpisodeRow({
  rowType, present, emptyLabel, attachments, onOpenAttachment, children, isLast, onAddFile,
}: {
  rowType: 'signal' | 'action' | 'result'
  present: boolean
  emptyLabel: string
  attachments?: EpisodeAttachment[]
  onOpenAttachment?: (a: EpisodeAttachment) => void
  children?: React.ReactNode
  isLast?: boolean
  onAddFile?: (fileName: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
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
            <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {attachments && attachments.map(a => (
                <Chip
                  key={a.label}
                  icon={attachmentIcon(a.type)}
                  label={a.label}
                  size="small"
                  clickable
                  variant="outlined"
                  onClick={() => onOpenAttachment?.(a)}
                  sx={{
                    height: 22, fontSize: '0.7rem', fontFamily: 'monospace',
                    '& .MuiChip-label': { px: 0.75 },
                    '& .MuiChip-icon': { fontSize: 12, ml: '6px' },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                />
              ))}
              {onAddFile && (
                <>
                  <input
                    type="file"
                    ref={fileRef}
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { onAddFile(file.name); e.target.value = '' }
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => fileRef.current?.click()}
                    startIcon={<AttachFileOutlined sx={{ fontSize: 12 }} />}
                    sx={{
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'none',
                      color: 'text.secondary', px: 0.75, py: 0.25, minWidth: 0,
                      borderRadius: 1, border: '1px dashed', borderColor: 'divider',
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.50' },
                    }}
                  >
                    Attach file
                  </Button>
                </>
              )}
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>{emptyLabel}</Typography>
        )}
      </Box>
    </Box>
  )
}

function EpisodeCard({ episode, onOpenAttachment, onAddFile }: {
  episode: SubmissionEpisode
  onOpenAttachment: (a: EpisodeAttachment) => void
  onAddFile?: (episodeId: string, rowType: 'signal' | 'action' | 'result', fileName: string) => void
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{episode.round}</Typography>
        <Typography variant="caption" color="text.secondary">{formatDate(episode.openedAt)}</Typography>
      </Box>

      {/* Signal */}
      <EpisodeRow rowType="signal" present={!!episode.signal} emptyLabel="No signal recorded"
        attachments={episode.signal?.attachments} onOpenAttachment={onOpenAttachment}
        onAddFile={onAddFile && episode.signal ? (f) => onAddFile(episode.id, 'signal', f) : undefined}>
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
      </EpisodeRow>

      {/* Action */}
      <EpisodeRow rowType="action" present={!!episode.action} emptyLabel="No action taken yet"
        attachments={episode.action?.attachments} onOpenAttachment={onOpenAttachment}
        onAddFile={onAddFile && episode.action ? (f) => onAddFile(episode.id, 'action', f) : undefined}>
        {episode.action && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{episode.action.label}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.25, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{formatDate(episode.action.date)}</Typography>
              <Chip label={DELIVERY_METHOD_LABELS[episode.action.method]} size="small"
                sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.6 } }} />
              {episode.action.vendor && (
                <Typography variant="caption" color="text.secondary">{episode.action.vendor}</Typography>
              )}
              {episode.action.reference && (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'secondary.main' }}>{episode.action.reference}</Typography>
              )}
            </Box>
            {episode.action.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.4 }}>{episode.action.notes}</Typography>
            )}
          </>
        )}
      </EpisodeRow>

      {/* Result */}
      <EpisodeRow rowType="result" present={!!episode.result} emptyLabel="Awaiting response" isLast
        attachments={episode.result?.attachments} onOpenAttachment={onOpenAttachment}
        onAddFile={onAddFile && episode.result ? (f) => onAddFile(episode.id, 'result', f) : undefined}>
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
      </EpisodeRow>
    </Paper>
  )
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ episodes, onOpenAttachment, onAddFile }: {
  episodes: SubmissionEpisode[]
  onOpenAttachment: (a: EpisodeAttachment) => void
  onAddFile: (episodeId: string, rowType: 'signal' | 'action' | 'result', fileName: string) => void
}) {
  if (episodes.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No submission activity recorded.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...episodes].reverse().map(ep => (
        <EpisodeCard key={ep.id} episode={ep} onOpenAttachment={onOpenAttachment} onAddFile={onAddFile} />
      ))}
    </Box>
  )
}

// ─── Underpayment Tab ─────────────────────────────────────────────────────────

function UnderpaymentTab({ denial, denialState, onSubmit }: { denial: DenialRecord; denialState: string; onSubmit?: () => void }) {
  const canAct = denialState === 'Active'
  const data = UNDERPAYMENT_DATA[denial.id]
  const letterData = APPEAL_LETTERS[denial.id]

  const initialHtml = letterData?.html ?? `<p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<p>${denial.payer} Provider Dispute Resolution</p>
<p><strong>RE: Payment Dispute — Claim ${denial.claim.claimId}</strong><br/>
Patient: ${denial.patient.name} | MRN: ${denial.patient.mrn}<br/>
Date of Service: ${denial.dos}</p>
<p>Dear ${denial.payer} Provider Dispute Resolution Team,</p>
<p>Memorial Health System is filing a formal payment dispute regarding the reimbursement issued for the above-referenced claim. The amount paid does not reflect the negotiated rate under our current contract agreement, resulting in an underpayment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(denial.deniedAmount)}.</p>
<p>We respectfully request review of this claim against the applicable contract rate schedule and remittance of the outstanding balance within 30 days.</p>
<p>Sincerely,<br/>Revenue Cycle Management<br/>Memorial Health System</p>`

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    editable: canAct,
  })

  const submissionInstructions = getSubmissionInstructions(denial.id, denial.payer)
  const [channel, setChannel] = useState<SubmissionChannel>('fax')
  const [faxNumber, setFaxNumber] = useState(submissionInstructions.faxNumber ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      onSubmit?.()
    }, 1600)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Letter editor ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {!canAct && <ReadOnlyBanner state={denialState} />}
        <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', gap: 0.5 }}>
          <Tooltip title="Bold"><Box component="button" onClick={() => editor?.chain().focus().toggleBold().run()}
            sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1, fontWeight: 700, fontSize: '0.8rem', '&:hover': { bgcolor: 'grey.100' } }}>B</Box></Tooltip>
          <Tooltip title="Italic"><Box component="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
            sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1, fontStyle: 'italic', fontSize: '0.8rem', '&:hover': { bgcolor: 'grey.100' } }}>I</Box></Tooltip>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <EditorContent editor={editor} style={{ minHeight: 300, fontSize: '0.875rem', lineHeight: 1.7 }} />
        </Box>
      </Box>

      {/* ── Right panel ── */}
      <Box sx={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', bgcolor: 'background.default' }}>

        {/* Payment Breakdown */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            Payment Breakdown
          </Typography>
          {data ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>Procedure</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{data.procedureCode}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{data.procedureDesc}</Typography>
              </Box>
              {[
                { label: 'Amount Billed',     value: data.billedAmount,     color: 'text.primary' },
                { label: 'Contracted Rate',   value: data.contractedRate,   color: '#22543D' },
                { label: 'Amount Paid',        value: data.paidAmount,       color: '#9B2C2C' },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{row.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: row.color }}>{fmt(row.value)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.75, bgcolor: '#FEF2F2', borderRadius: 1, border: '1px solid #FECACA', mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#9B2C2C', fontSize: '0.75rem' }}>Underpaid Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#9B2C2C', fontSize: '0.875rem' }}>{fmt(data.underpaidAmount)}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 0.5, lineHeight: 1.4 }}>
                {data.contractRef}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', borderRadius: 1.5, border: '1px solid #FECACA' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Underpaid Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#9B2C2C' }}>{fmt(denial.deniedAmount)}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Submission */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block' }}>
            Submit Dispute
          </Typography>
          <FormControl size="small" fullWidth disabled={!canAct}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Channel</InputLabel>
            <Select value={channel} label="Channel" onChange={e => setChannel(e.target.value as SubmissionChannel)} sx={{ fontSize: '0.8rem' }}>
              {(['fax', 'portal', 'mail'] as SubmissionChannel[]).map(c => (
                <MenuItem key={c} value={c} sx={{ fontSize: '0.8rem' }}>{CHANNEL_CONFIG[c].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {channel === 'fax' && (
            <TextField fullWidth size="small" label="Fax Number" value={faxNumber}
              onChange={e => setFaxNumber(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }} />
          )}
          {submitted ? (
            <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid', borderColor: '#86EFAC', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
              <TaskAltOutlined sx={{ fontSize: 22, color: 'success.main', mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', fontSize: '0.8125rem' }}>Dispute Submitted</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                via {CHANNEL_CONFIG[channel].label} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ) : (
            <Button fullWidth variant="contained" disableElevation disabled={!canAct || submitting}
              onClick={handleSubmit}
              startIcon={submitting ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : null}
              sx={{ fontWeight: 600 }}>
              {submitting ? 'Submitting…' : 'Submit Dispute'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

// ─── Appeal Rounds Section ────────────────────────────────────────────────────

const ROUND_TYPE_LABELS: Record<AppealRoundType, string> = {
  L1_internal:    'L1 Internal',
  L2_external:    'L2 External',
  IRO:            'Independent Review',
  redetermination:'Redetermination',
  reconsideration:'Reconsideration',
  reopening:      'Reopening',
}

const METHOD_LABELS: Record<string, string> = {
  mail: 'Mail', portal: 'Portal', fax: 'Fax', electronic: 'Electronic',
}

function AppealRoundsSection({ rounds, denialState, onAddRound }: {
  rounds: AppealRound[]
  denialState: string
  onAddRound: (r: AppealRound) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draftType, setDraftType] = useState<AppealRoundType>('L1_internal')
  const [draftDate, setDraftDate] = useState('')
  const [draftMethod, setDraftMethod] = useState<string>('portal')
  const [draftNotes, setDraftNotes] = useState('')
  const [localRounds, setLocalRounds] = useState<AppealRound[]>(rounds)

  const canAdd = denialState === 'Active' || denialState === 'Submitted'
  const nextRound = localRounds.length + 1

  function handleAdd() {
    const newRound: AppealRound = {
      id: `r-new-${Date.now()}`,
      roundNumber: nextRound,
      roundType: draftType,
      submittedAt: draftDate || undefined,
      submissionMethod: draftMethod as AppealRound['submissionMethod'],
      decision: 'pending',
      notes: draftNotes || undefined,
    }
    setLocalRounds(prev => [...prev, newRound])
    onAddRound(newRound)
    setDialogOpen(false)
    setDraftDate('')
    setDraftNotes('')
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          Appeal Rounds
        </Typography>
        {canAdd && (
          <Button size="small" variant="text" startIcon={<AddOutlined sx={{ fontSize: 13 }} />}
            onClick={() => setDialogOpen(true)}
            sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'text.secondary', fontWeight: 600 }}>
            Record Round {nextRound}
          </Button>
        )}
      </Box>

      {localRounds.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No appeal rounds recorded yet.
        </Typography>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          {localRounds.map((round, idx) => {
            const isLast = idx === localRounds.length - 1
            const decisionColor = round.decision === 'overturned' ? 'success.main'
              : round.decision === 'upheld' ? 'error.main'
              : round.decision === 'partial' ? 'warning.main'
              : 'text.disabled'
            const DecisionIcon = round.decision === 'overturned' ? CheckOutlined
              : round.decision === 'upheld' ? BlockOutlined
              : round.decision === 'partial' ? RemoveCircleOutlineOutlined
              : HourglassEmptyOutlined
            return (
              <Box key={round.id} sx={{ px: 2, py: 1.5, borderBottom: isLast ? 'none' : '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                    Round {round.roundNumber} · {ROUND_TYPE_LABELS[round.roundType]}
                  </Typography>
                </Box>
                {round.submittedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Submitted {formatDate(round.submittedAt)}{round.submissionMethod ? ` · ${METHOD_LABELS[round.submissionMethod]}` : ''}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <DecisionIcon sx={{ fontSize: 12, color: decisionColor }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: decisionColor }}>
                    {round.decision === 'overturned' ? `Overturned${round.recoveryAmount ? ` · ${formatCurrency(round.recoveryAmount)}` : ''}` :
                     round.decision === 'upheld' ? 'Upheld by payer' :
                     round.decision === 'partial' ? 'Partial overturn' :
                     round.decision === 'withdrawn' ? 'Withdrawn' :
                     'Awaiting decision'}
                    {round.decisionDate ? ` · ${formatDate(round.decisionDate)}` : ''}
                  </Typography>
                </Box>
                {round.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontStyle: 'italic' }}>
                    {round.notes}
                  </Typography>
                )}
              </Box>
            )
          })}
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Record Appeal Round {nextRound}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Round Type</InputLabel>
            <Select value={draftType} label="Round Type" onChange={e => setDraftType(e.target.value as AppealRoundType)}>
              {(Object.entries(ROUND_TYPE_LABELS) as [AppealRoundType, string][]).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="Submission Date" value={draftDate}
            onChange={e => setDraftDate(e.target.value)}
            InputLabelProps={{ shrink: true }} fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Submission Method</InputLabel>
            <Select value={draftMethod} label="Submission Method" onChange={e => setDraftMethod(e.target.value)}>
              {Object.entries(METHOD_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" multiline rows={2} label="Notes (optional)" value={draftNotes}
            onChange={e => setDraftNotes(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleAdd}>Record Round</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ denial, denialId, onViewRemit, onViewClaim, onOpenAttachment, events, episodes, onAddFile, assignedTo, onChangeAssignee, onNavigateToDenial }: {
  denial: DenialRecord
  denialId: string
  onViewRemit: () => void
  onViewClaim: () => void
  onOpenAttachment: (a: EpisodeAttachment) => void
  events: TimelineEvent[]
  episodes: SubmissionEpisode[]
  onAddFile: (episodeId: string, rowType: 'signal' | 'action' | 'result', fileName: string) => void
  assignedTo: TeamMember | null
  onChangeAssignee: (m: TeamMember | null) => void
  onNavigateToDenial?: (id: string) => void
}) {
  const remit = REMIT_DATA[denialId]
  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null

  const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null)
  const carcInfo = CARC_DESCRIPTIONS[denial.carc]
  const rarcInfo = denial.rarc ? RARC_DESCRIPTIONS[denial.rarc] : null
  const claim837 = CLAIM_DATA_837[denialId]

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, height: '100%', overflow: 'auto' }}>

      {/* Claim Context — left panel */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          Claim Context
        </Typography>

        {/* Claim identifiers — full-width table */}
        <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Claim ID', 'HAR', 'MRN', 'Date of Service', ...(remit ? ['Payer ICN', 'Patient Control #'] : [])].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', py: 0.75, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{denial.claim.claimId}</TableCell>
                  <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{denial.claim.har}</TableCell>
                  <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{denial.patient.mrn}</TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>{formatDate(denial.dos)}</TableCell>
                  {remit && <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>{remit.payerICN}</TableCell>}
                  {remit && <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>{remit.patientControlNumber}</TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Financial summary */}
        <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 1.5 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em' }}>Financial Summary</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mt: 1 }}>
            {[
              { label: 'Billed (837)', value: remit ? formatCurrency(remit.claimBilledAmount) : '—' },
              { label: 'Allowed',      value: remit ? formatCurrency(remit.claimAllowedAmount) : '—' },
              { label: 'Paid',         value: remit ? formatCurrency(remit.claimPaidAmount) : '—' },
              { label: 'Denied',       value: formatCurrency(denial.deniedAmount), highlight: true },
            ].map(({ label, value, highlight }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: highlight ? 'error.main' : 'text.primary', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Most recent submission round */}
        {latestEpisode && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
              Current Submission Round
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <EpisodeCard episode={latestEpisode} onOpenAttachment={onOpenAttachment} onAddFile={onAddFile} />
            </Box>
          </Box>
        )}

        {/* Timeline */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
            Timeline
          </Typography>
          {events.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No timeline events recorded.</Typography>
          ) : (
            <Box sx={{ mt: 1.5, maxHeight: 480, overflowY: 'auto', pr: 1 }}>
              {[...events].reverse().map((event, idx) => {
                const meta = getEventMeta(event.type)
                const isLast = idx === events.length - 1
                return (
                  <Box key={event.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                    {!isLast && (
                      <Box sx={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 2, bgcolor: 'divider', zIndex: 0 }} />
                    )}
                    <Box sx={{ flexShrink: 0, zIndex: 1 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%',
                        bgcolor: meta.color + '18', border: '2px solid', borderColor: meta.color + '44',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
                      }}>
                        {meta.icon}
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, pb: isLast ? 0 : 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={meta.label} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: meta.color + '14', color: meta.color, border: 'none', '& .MuiChip-label': { px: 0.75 } }} />
                        <Typography variant="caption" color="text.secondary">{formatDateTime(event.timestamp)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>·</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{event.actor}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, lineHeight: 1.4 }}>{event.summary}</Typography>
                      {event.detail && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>{event.detail}</Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                        {event.amount !== undefined && (
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(event.amount)}</Typography>
                        )}
                        {event.document && (
                          <Typography variant="caption" sx={{ color: 'secondary.main', fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{event.document}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* Metadata Sidebar — right panel */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
          Denial Detail
        </Typography>

        <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden' }}>

          {/* DRG comparison (downgrade denials only) */}
          {denial.denialType === 'DRG Downgrade' && (
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>DRG Comparison</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Billed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{denial.denialSubtype.split('→')[0]?.trim()}</Typography>
                </Box>
                <Typography sx={{ color: 'error.main', fontWeight: 700, lineHeight: 1, mt: 1.5 }}>→</Typography>
                <Box>
                  <Typography variant="caption" color="text.secondary">Paid</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'error.main' }}>{denial.denialSubtype.split('→')[1]?.trim()}</Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* CARC / RARC */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Adjustment Codes</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
              <Chip label={denial.carc} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'error.light', color: 'error.dark', height: 22 }} />
              {denial.rarc && <Chip label={denial.rarc} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }} />}
            </Box>
            {carcInfo && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>{carcInfo.short}</Typography>}
            {rarcInfo && <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.25 }}>{rarcInfo.short}</Typography>}
            {(claim837 || remit) && (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                {claim837 && (
                  <Button size="small" variant="text" onClick={onViewClaim} startIcon={<ArticleOutlined sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'secondary.main', fontWeight: 600 }}>
                    View Claim
                  </Button>
                )}
                {remit && (
                  <Button size="small" variant="text" onClick={onViewRemit} startIcon={<InfoOutlined sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'secondary.main', fontWeight: 600 }}>
                    View Remit
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {/* Key dates */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Dates</Typography>
            {[
              { label: 'Date of Service', value: formatDate(denial.dos) },
              { label: 'Denial Received', value: formatDate(denial.createdAt) },
              { label: 'Appeal Deadline', value: formatDate(denial.deadline), urgent: daysUntil(denial.deadline) <= 7 },
            ].map(({ label, value, urgent }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: urgent ? 'error.main' : 'text.primary' }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Payer */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Payer</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{denial.payer}</Typography>
          </Box>

          {/* Assignee */}
          <Box sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Assigned To</Typography>
            <Box
              onClick={e => setAssigneeAnchor(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: 1,
                p: 0.5, mx: -0.5,
                '&:hover': { bgcolor: 'action.hover' },
                '&:hover .edit-icon': { opacity: 1 },
              }}
            >
              {assignedTo ? (
                <>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.6875rem', bgcolor: 'primary.light' }}>{assignedTo.initials}</Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>{assignedTo.name}</Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', flex: 1 }}>Unassigned</Typography>
              )}
              <EditOutlined className="edit-icon" sx={{ fontSize: 14, color: 'text.disabled', opacity: 0, transition: 'opacity 0.15s' }} />
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
                  <ListItemButton
                    key={m.id}
                    selected={assignedTo?.id === m.id}
                    onClick={() => { onChangeAssignee(m); setAssigneeAnchor(null) }}
                    sx={{ px: 1.5, py: 0.75, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemText-primary': { color: '#fff' } } }}
                  >
                    <ListItemAvatar sx={{ minWidth: 34 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: assignedTo?.id === m.id ? 'rgba(255,255,255,0.25)' : 'primary.light' }}>{m.initials}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={m.name} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                  </ListItemButton>
                ))}
                {assignedTo && (
                  <ListItemButton
                    onClick={() => { onChangeAssignee(null); setAssigneeAnchor(null) }}
                    sx={{ px: 1.5, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}
                  >
                    <ListItemText primary="Unassign" primaryTypographyProps={{ fontSize: '0.8125rem', color: 'text.secondary' }} />
                  </ListItemButton>
                )}
              </List>
            </Popover>
          </Box>

        </Paper>

        {/* Appeal Rounds */}
        <AppealRoundsSection
          rounds={denial.appealRounds ?? []}
          denialState={denial.state}
          onAddRound={round => {
            // rounds are local to the detail view — in the real system this would persist
          }}
        />

        {/* Related Instances */}
        {(() => {
          const related = denial.relatedInstances ?? (denial.relatedDenialIds?.map(id => ({ denialId: id, relationship: 'adr_followed' as const })) ?? [])
          if (related.length === 0) return null
          return (
            <Box sx={{ mt: 3 }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Related Instances
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden' }}>
                {related.map(({ denialId: relId, relationship }, idx) => {
                  const rel = SEED_DENIALS.find(d => d.id === relId)
                  if (!rel) return null
                  const relOutcome = DENIAL_OUTCOMES[relId]
                  const RELATIONSHIP_LABELS: Record<string, string> = {
                    adr_preceded:          'ADR preceded this denial',
                    adr_followed:          'ADR triggered by this denial',
                    corrected_claim_of:    'Denial on corrected claim',
                    corrected_claim_led_to:'Original denial before correction',
                    recoupment_of:         'Recoupment on prior resolved denial',
                    escalated_from:        'Escalated from ADR',
                  }
                  return (
                    <Box
                      key={relId}
                      onClick={() => onNavigateToDenial?.(relId)}
                      sx={{
                        px: 2, py: 1.5,
                        borderBottom: idx < related.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                        cursor: onNavigateToDenial ? 'pointer' : 'default',
                        '&:hover': onNavigateToDenial ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <LinkOutlined sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontStyle: 'italic' }}>
                          {RELATIONSHIP_LABELS[relationship] ?? relationship}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem' }}>{rel.id}</Typography>
                        <Chip
                          label={rel.state}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.625rem', fontWeight: 700,
                            bgcolor: rel.state === 'Resolved' ? 'success.light' : rel.state === 'Closed' ? 'action.selected' : 'warning.light',
                            color: rel.state === 'Resolved' ? 'success.dark' : rel.state === 'Closed' ? 'text.secondary' : 'warning.dark',
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{rel.denialType}</Typography>
                      <Typography variant="caption" color="text.secondary">{rel.denialSubtype}</Typography>
                      {relOutcome && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontWeight: 600,
                          color: relOutcome.disposition === 'overturned_full' ? 'success.main' : relOutcome.disposition === 'will_not_appeal' ? 'text.disabled' : 'warning.main' }}>
                          {relOutcome.disposition === 'overturned_full' ? `Overturned · ${formatCurrency(relOutcome.recoveredAmount)} recovered` :
                           relOutcome.disposition === 'will_not_appeal' ? 'Will Not Appeal' :
                           relOutcome.disposition === 'settled_partial' ? `Settled · ${formatCurrency(relOutcome.repaidAmount ?? 0)} repaid` :
                           rel.status}
                        </Typography>
                      )}
                    </Box>
                  )
                })}
              </Paper>
            </Box>
          )
        })()}

      </Box>
    </Box>
  )
}

// ─── Packet Section ───────────────────────────────────────────────────────────

function PacketSection({
  label, icon, iconBg, emptyLabel, docs, onAdd, addLabel, addDisabled, addIcon,
  onMove, onRemove, singleDoc,
}: {
  label: string
  icon: React.ReactNode
  iconBg: string
  emptyLabel: string
  docs: { id: string; name: string; size: string; addedAt: string }[]
  onAdd: () => void
  addLabel: string
  addDisabled?: boolean
  addIcon?: React.ReactNode
  onMove: ((idx: number, dir: 'up' | 'down') => void) | null
  onRemove: (id: string) => void
  singleDoc?: boolean
}) {
  return (
    <Paper variant="outlined" sx={{ mt: 2, borderRadius: 1.5, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: docs.length > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 0.75, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{label}</Typography>
        {(!singleDoc || docs.length === 0) && (
          <Button size="small" variant="outlined" disabled={addDisabled} onClick={onAdd}
            startIcon={addIcon} sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none', flexShrink: 0 }}>
            {addLabel}
          </Button>
        )}
        {singleDoc && docs.length > 0 && (
          <Button size="small" variant="outlined" disabled={addDisabled} onClick={onAdd}
            sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none', flexShrink: 0 }}>
            Regenerate
          </Button>
        )}
      </Box>

      {/* Empty state */}
      {docs.length === 0 && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>{emptyLabel}</Typography>
        </Box>
      )}

      {/* Document list */}
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

// ─── Appeal Tab ───────────────────────────────────────────────────────────────

type SubmissionChannel = 'esmd' | 'agent' | 'portal' | 'fax' | 'mail'

interface PacketDoc {
  id: string
  name: string
  size: string
  addedAt: string
}

interface ChatMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

interface AgentPortal {
  id: string
  label: string
  payers: string[]   // payer names this portal is used for
  notes?: string
}

const AGENT_PORTALS: AgentPortal[] = [
  { id: 'availity',   label: 'Availity',                    payers: ['Aetna', 'Humana', 'BCBS', 'Blue Cross Blue Shield'], notes: 'Multi-payer — BCBS, Aetna, Humana and others' },
  { id: 'uhc',        label: 'UHC Provider Portal',         payers: ['UnitedHealthcare'],  notes: 'uhcprovider.com — appeals & reconsiderations' },
  { id: 'cigna',      label: 'Cigna for Health Pros',       payers: ['Cigna'],             notes: 'cignaforhcp.com' },
  { id: 'palmetto',   label: 'Palmetto GBA eServices',      payers: ['Palmetto GBA (Medicare)', 'Medicare'], notes: 'palmettogba.com/providers' },
  { id: 'navinet',    label: 'NaviNet / Payer Spaces',      payers: [],                    notes: 'Multi-payer network portal' },
  { id: 'change',     label: 'Change Healthcare Portal',    payers: [],                    notes: 'Multi-payer clearinghouse' },
  { id: 'waystar',    label: 'Waystar',                     payers: [],                    notes: 'Multi-payer clearinghouse' },
]

function getDefaultAgentPortal(payer: string): string {
  const match = AGENT_PORTALS.find(p => p.payers.some(n => payer.includes(n) || n.includes(payer)))
  return match?.id ?? 'availity'
}

const CHANNEL_CONFIG: Record<SubmissionChannel, { label: string; icon: React.ReactNode; description: string }> = {
  esmd:   { label: 'esMD',          icon: <SendOutlined sx={{ fontSize: 15 }} />,            description: 'Electronic submission via esMD gateway' },
  agent:  { label: 'Agent',         icon: <SmartToyOutlined sx={{ fontSize: 15 }} />,        description: 'Automated payer portal submission via AI agent' },
  portal: { label: 'Payer Portal',  icon: <OpenInBrowserOutlined sx={{ fontSize: 15 }} />,   description: 'Manual submission through payer web portal' },
  fax:    { label: 'Fax',           icon: <FaxOutlined sx={{ fontSize: 15 }} />,              description: 'Fax to payer appeals department' },
  mail:   { label: 'Certified Mail', icon: <LocalShippingOutlined sx={{ fontSize: 15 }} />,  description: 'USPS certified mail to appeals address' },
}

// Minimal rich-text toolbar button
function ToolbarBtn({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) {
  return (
    <Tooltip title={title}>
      <Box
        component="button"
        onClick={onClick}
        sx={{
          border: 'none', background: active ? 'rgba(27,58,92,0.12)' : 'transparent',
          borderRadius: '4px', p: '4px 6px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', color: active ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: 'rgba(27,58,92,0.08)' },
        }}
      >
        {children}
      </Box>
    </Tooltip>
  )
}

interface AppealTabProps {
  denial: DenialRecord
  denialId: string
  denialState: string
  appealLetterPdf: PacketDoc | null
  setAppealLetterPdf: React.Dispatch<React.SetStateAction<PacketDoc | null>>
  supportingDocs: PacketDoc[]
  setSupportingDocs: React.Dispatch<React.SetStateAction<PacketDoc[]>>
  priorCorrespondence: PacketDoc[]
  setPriorCorrespondence: React.Dispatch<React.SetStateAction<PacketDoc[]>>
  onSubmit?: () => void
  onSubmitSuccess?: (channel: string, payer: string, patientName: string) => void
}

function AppealTab({ denial, denialId, denialState, appealLetterPdf, setAppealLetterPdf, supportingDocs, setSupportingDocs, priorCorrespondence, setPriorCorrespondence, onSubmit, onSubmitSuccess }: AppealTabProps) {
  const canAct = denialState === 'Active'
  const letterData = APPEAL_LETTERS[denialId]
  const defaultTemplate = getDefaultTemplate(denial.payer, denial.denialType)
  const availableTemplates = getAvailableTemplates(denial.denialType)

  const initialHtml = letterData?.html ?? getGenericLetter(denialId, denial.patient.name, denial.payer, denial.denialType, denial.deniedAmount)
  const submissionInstructions: SubmissionInstructions = getSubmissionInstructions(denialId, denial.payer)

  const [activeTemplate, setActiveTemplate] = useState<AppealTemplate>(defaultTemplate)
  const [templateAnchor, setTemplateAnchor] = useState<HTMLElement | null>(null)
  const [confirmTemplate, setConfirmTemplate] = useState<AppealTemplate | null>(null)
  const [channel, setChannel] = useState<SubmissionChannel>('esmd')
  const [agentPortal, setAgentPortal] = useState(() => getDefaultAgentPortal(denial.payer))
  const [faxNumber, setFaxNumber] = useState(submissionInstructions.faxNumber ?? '')
  const [mailAddress, setMailAddress] = useState(submissionInstructions.appealAddress ?? '')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'ai',
      content: `I've generated a ${activeTemplate.name} appeal letter for ${denial.patient.name} using the available clinical data and medical record. The letter addresses the ${denial.denialType.toLowerCase()} denial from ${denial.payer} for $${denial.deniedAmount.toLocaleString()}. You can edit the letter directly or describe changes you'd like me to make.`,
      timestamp: new Date('2026-04-02T08:05:00').toISOString(),
    },
  ])
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [assembledPacket, setAssembledPacket] = useState<PacketDoc | null>(null)
  const [assembling, setAssembling] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      onSubmit?.()
      onSubmitSuccess?.(channel, denial.payer, denial.patient.name)
    }, 1800)
  }

  function handleAssemblePacket() {
    setAssembling(true)
    setTimeout(() => {
      const docCount = (appealLetterPdf ? 1 : 0) + supportingDocs.length
      setAssembledPacket({
        id: 'assembled-packet',
        name: `Appeal_Packet_${denialId}_${new Date().toISOString().slice(0, 10)}.pdf`,
        size: `${(docCount * 0.38 + 0.2).toFixed(1)} MB`,
        addedAt: new Date().toISOString(),
      })
      setAssembling(false)
    }, 1600)
  }

  const STUB_SUPPORTING = ['Medical_Record_Complete.pdf', 'Physician_Attestation.pdf', 'Lab_Results_Admission.pdf', 'Echocardiography_Report.pdf', '277-CA_Acknowledgment.edi', 'Discharge_Summary.pdf']
  const STUB_PRIOR = ['Denial_Letter.pdf', 'ADR_Notice.pdf', 'Prior_Appeal_Response.pdf', 'Remittance_Advice.pdf']

  function handleGeneratePdf() {
    setGeneratingPdf(true)
    setTimeout(() => {
      setAppealLetterPdf({ id: 'letter-pdf', name: `Appeal_Letter_${denialId}.pdf`, size: '0.4 MB', addedAt: new Date('2026-04-02T09:00:00').toISOString() })
      setGeneratingPdf(false)
    }, 900)
  }

  function addDoc(list: PacketDoc[], setList: React.Dispatch<React.SetStateAction<PacketDoc[]>>, stubs: string[]) {
    const name = stubs[list.length % stubs.length]!
    setList(prev => [...prev, { id: Date.now().toString(), name, size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`, addedAt: new Date('2026-04-02T09:00:00').toISOString() }])
  }

  function moveDoc(setList: React.Dispatch<React.SetStateAction<PacketDoc[]>>, idx: number, dir: 'up' | 'down') {
    setList(prev => {
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
      return next
    })
  }

  function removeDoc(setList: React.Dispatch<React.SetStateAction<PacketDoc[]>>, id: string) {
    setList(prev => prev.filter(d => d.id !== id))
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function applyPromptToLetter(promptText: string): string {
    if (!editor) return ''
    const lower = promptText.toLowerCase()
    const html = editor.getHTML()
    const paras = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [html]

    if (lower.match(/short|shorten|concise|brief|trim/)) {
      if (paras.length > 4) return [...paras.slice(0, 2), paras[paras.length - 1]!].join('\n')
      return html
    }

    if (lower.match(/clinical|evidence|literature|criteria|peer.?review/)) {
      const inject = `<p>Peer-reviewed clinical literature supports the medical necessity of this case. Studies published in the Journal of Hospital Medicine and CHEST confirm that patients presenting with ${denial.patient.name.split(' ')[0]}'s documented condition meet established criteria for the level of care provided. We respectfully request the payer's clinical reviewers consider this evidence in their reassessment.</p>`
      return [...paras.slice(0, -1), inject, paras[paras.length - 1]!].join('\n')
    }

    if (lower.match(/strong|aggressive|forceful|demand|escalat/)) {
      const strongClose = `<p>We demand immediate reconsideration of this denial. Failure to overturn this decision will result in escalation to your state's Department of Insurance and initiation of external independent review. This patient's access to medically necessary care must not be compromised by an erroneous coverage determination. A response is required within the timeframes mandated by applicable law and your plan documents.</p>`
      return [...paras.slice(0, -1), strongClose].join('\n')
    }

    if (lower.match(/formal|professional|tone/)) {
      return html
        .replace(/We are writing/gi, 'This correspondence serves to formally notify your organization')
        .replace(/We believe/gi, 'It is the professional determination of the treating team that')
        .replace(/\bplease\b/gi, 'we respectfully request that you')
    }

    if (lower.match(/deadline|timely|days|urgent|expedit/)) {
      const urgencyPara = `<p>We draw your attention to applicable appeal timeline requirements. Per CMS regulations and your plan's coverage determination policies, a written response is required within 30 days of receipt of this appeal. Given the time-sensitive nature of this case and the direct impact on patient care, we respectfully request expedited review.</p>`
      return [...paras.slice(0, -1), urgencyPara, paras[paras.length - 1]!].join('\n')
    }

    if (lower.match(/diagnosis|icd|code|dx/)) {
      const dxPara = `<p>The following ICD-10 diagnosis codes documented in the medical record substantiate the medical necessity of the services rendered: the primary diagnosis and all listed comorbidities were actively managed during this encounter and directly informed the level of care determination. These codes are supported by physician attestation, nursing notes, and objective clinical findings in the attached record.</p>`
      return [...paras.slice(0, -1), dxPara, paras[paras.length - 1]!].join('\n')
    }

    // Generic: weave the instruction into a new supporting paragraph
    const genericPara = `<p>Furthermore, ${promptText.trim().replace(/^./, c => c.toLowerCase()).replace(/\.$/, '')}. We trust this additional context will support reconsideration of the initial determination.</p>`
    return [...paras.slice(0, -1), genericPara, paras[paras.length - 1]!].join('\n')
  }

  const PROMPT_RESPONSES: Record<string, string> = {
    short:     'I\'ve condensed the letter, keeping the opening rationale and closing request. The core argument is preserved.',
    clinical:  'I\'ve added a clinical evidence paragraph citing peer-reviewed literature supporting medical necessity. Review and adjust the specific citations as needed.',
    strong:    'I\'ve replaced the closing with stronger language and an explicit escalation warning. Use this if prior rounds have been ignored.',
    formal:    'I\'ve adjusted the tone — more formal language throughout. The substance is unchanged.',
    deadline:  'I\'ve added an urgency paragraph citing applicable response timelines under CMS regulations.',
    diagnosis: 'I\'ve added a paragraph explicitly tying the ICD-10 codes to the medical necessity argument.',
  }

  function getAiResponse(promptText: string): string {
    const lower = promptText.toLowerCase()
    if (lower.match(/short|shorten|concise|brief|trim/)) return PROMPT_RESPONSES.short!
    if (lower.match(/clinical|evidence|literature|criteria/)) return PROMPT_RESPONSES.clinical!
    if (lower.match(/strong|aggressive|forceful|demand/)) return PROMPT_RESPONSES.strong!
    if (lower.match(/formal|professional|tone/)) return PROMPT_RESPONSES.formal!
    if (lower.match(/deadline|timely|urgent|expedit/)) return PROMPT_RESPONSES.deadline!
    if (lower.match(/diagnosis|icd|code|dx/)) return PROMPT_RESPONSES.diagnosis!
    return `I've updated the letter to reflect: "${promptText.trim()}". The change has been applied — review it on the left and let me know if you'd like further adjustments.`
  }

  function handleSendPrompt() {
    if (!prompt.trim() || isGenerating) return
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: prompt.trim(), timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, userMsg])
    setPrompt('')
    setIsGenerating(true)
    setTimeout(() => {
      const newHtml = applyPromptToLetter(userMsg.content)
      if (newHtml && editor) editor.commands.setContent(newHtml)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getAiResponse(userMsg.content),
        timestamp: new Date().toISOString(),
      }
      setChatMessages(prev => [...prev, aiMsg])
      setIsGenerating(false)
    }, 1200)
  }

  function handleConfirmTemplateSwitch() {
    if (!confirmTemplate || !editor) return
    setActiveTemplate(confirmTemplate)
    const html = APPEAL_LETTERS[denialId]?.html ?? getGenericLetter(denialId, denial.patient.name, denial.payer, denial.denialType, denial.deniedAmount)
    editor.commands.setContent(html)
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'ai',
      content: `Template switched to "${confirmTemplate.name}". The letter has been regenerated. Any previous edits have been replaced.`,
      timestamp: new Date().toISOString(),
    }])
    setConfirmTemplate(null)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Letter editor (left) ────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

        {/* Formatting toolbar */}
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
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem', mr: 1 }}>
            {activeTemplate.name}
          </Typography>
          <Button
            size="small" variant="outlined"
            startIcon={generatingPdf ? null : <PictureAsPdfOutlined sx={{ fontSize: 14 }} />}
            onClick={handleGeneratePdf} disabled={generatingPdf}
            sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', py: 0.375, minWidth: 110 }}
          >
            {generatingPdf ? 'Generating…' : 'Generate PDF'}
          </Button>
        </Box>

        {/* Scrollable area — sticky AI bar lives here */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>

          {/* ── Sticky AI bar ──────────────────────────────────────────────── */}
          <Box sx={{
            position: 'sticky', top: 0, zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid', borderColor: 'divider',
            boxShadow: chatOpen ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            {/* Chat history — shown when expanded */}
            {chatOpen && (
              <Box sx={{ maxHeight: 260, overflow: 'auto', px: 2, pt: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                {chatMessages.map(msg => (
                  <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{
                      maxWidth: '75%', px: 1.25, py: 0.75,
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                      border: msg.role === 'ai' ? '1px solid' : 'none', borderColor: 'divider',
                    }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.45, color: msg.role === 'user' ? '#fff' : 'text.primary' }}>
                        {msg.content}
                      </Typography>
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

            {/* Input row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1 }}>
              <SmartToyOutlined sx={{ fontSize: 16, color: 'secondary.main', flexShrink: 0 }} />
              <TextField
                fullWidth size="small" variant="standard"
                placeholder="Type a command or prompt to update the letter…"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendPrompt() } }}
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem', py: 0.5 } }}
              />
              <Tooltip title={chatOpen ? 'Hide conversation' : 'Show conversation'}>
                <IconButton size="small" onClick={() => setChatOpen(v => !v)}
                  sx={{ color: chatOpen ? 'primary.main' : 'text.disabled', bgcolor: chatOpen ? 'rgba(27,58,92,0.08)' : 'transparent', borderRadius: 1 }}>
                  <ChatBubbleOutlineOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={handleSendPrompt} disabled={!prompt.trim() || isGenerating}
                sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 1.5, flexShrink: 0, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Letter content */}
          <Box sx={{ px: 3, py: 3, bgcolor: 'grey.100', minHeight: 400 }}>
            <Box sx={{
              maxWidth: 680, mx: 'auto',
              bgcolor: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              borderRadius: 1,
              px: 6, py: 5,
              '& .tiptap': {
                outline: 'none', minHeight: 400,
                fontFamily: 'Georgia, serif', fontSize: '0.875rem', lineHeight: 1.7, color: '#1a202c',
                '& h2': { fontSize: '1.1rem', fontWeight: 700, mt: 2.5, mb: 1, fontFamily: 'Inter, sans-serif', color: '#1B3A5C' },
                '& h3': { fontSize: '0.95rem', fontWeight: 700, mt: 2, mb: 0.75, fontFamily: 'Inter, sans-serif', color: '#1B3A5C' },
                '& p':  { mb: 1.25 },
                '& ul, & ol': { pl: 3, mb: 1.25 },
                '& li': { mb: 0.5 },
                '& strong': { fontWeight: 700 },
              },
            }}>
              <EditorContent editor={editor} />
            </Box>

            {/* Appeal packet */}
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Appeal Packet
              </Typography>
              <PacketSection
                label="Appeal Letter"
                icon={<PictureAsPdfOutlined sx={{ fontSize: 16, color: '#fff' }} />}
                iconBg="#C0392B"
                emptyLabel="Generate a PDF from the letter above to include it in the packet"
                docs={appealLetterPdf ? [appealLetterPdf] : []}
                onAdd={handleGeneratePdf} addLabel="Generate PDF" addDisabled={generatingPdf}
                addIcon={<PictureAsPdfOutlined sx={{ fontSize: 14 }} />}
                onMove={null} onRemove={() => setAppealLetterPdf(null)} singleDoc
              />
              <PacketSection
                label="Supporting Documents"
                icon={<UploadFileOutlined sx={{ fontSize: 16, color: '#fff' }} />}
                iconBg="#2D7D9A"
                emptyLabel="Medical records, physician attestations, lab results"
                docs={supportingDocs}
                onAdd={() => addDoc(supportingDocs, setSupportingDocs, STUB_SUPPORTING)} addLabel="Attach"
                onMove={(idx, dir) => moveDoc(setSupportingDocs, idx, dir)}
                onRemove={(id) => removeDoc(setSupportingDocs, id)}
              />
            </Box>

            {/* Prior correspondence */}
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, pb: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Prior Correspondence
              </Typography>
              <PacketSection
                label="Uploaded Files"
                icon={<MailOutlineOutlined sx={{ fontSize: 16, color: '#fff' }} />}
                iconBg="#718096"
                emptyLabel="ADR letters, denial notices, prior appeal responses"
                docs={priorCorrespondence}
                onAdd={() => addDoc(priorCorrespondence, setPriorCorrespondence, STUB_PRIOR)} addLabel="Upload"
                onMove={(idx, dir) => moveDoc(setPriorCorrespondence, idx, dir)}
                onRemove={(id) => removeDoc(setPriorCorrespondence, id)}
              />
            </Box>

            {/* Assemble packet */}
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 3, pb: 5 }}>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
                    Appeal Packet
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.75rem' }}>
                    Merges appeal letter + supporting documents into a single submission-ready PDF
                  </Typography>
                </Box>
                <Button
                  variant="contained" disableElevation size="small"
                  onClick={handleAssemblePacket}
                  disabled={!canAct || assembling || (!appealLetterPdf && supportingDocs.length === 0)}
                  startIcon={assembling ? null : assembledPacket ? <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} /> : <FolderZipOutlined sx={{ fontSize: 15 }} />}
                  sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', flexShrink: 0, ml: 2, bgcolor: assembledPacket ? 'success.main' : 'primary.main', '&:hover': { bgcolor: assembledPacket ? 'success.dark' : 'primary.dark' } }}
                >
                  {assembling ? 'Assembling…' : assembledPacket ? 'Re-assemble' : 'Assemble Packet'}
                </Button>
              </Box>

              {assembledPacket && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f0faf4', border: '1px solid', borderColor: '#a8d5b5', borderRadius: 1.5 }}>
                  <PictureAsPdfOutlined sx={{ fontSize: 22, color: '#C0392B', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assembledPacket.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      {assembledPacket.size} · {(appealLetterPdf ? 1 : 0) + supportingDocs.length} document{supportingDocs.length !== 0 ? 's' : ''} merged
                    </Typography>
                  </Box>
                  <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: 'success.main', flexShrink: 0 }} />
                </Box>
              )}

              {!assembledPacket && !assembling && (
                <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderZipOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                    No packet assembled yet — click &quot;Assemble Packet&quot; to generate
                  </Typography>
                </Box>
              )}

              {assembling && (
                <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.light', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={16} thickness={5} />
                  <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 500 }}>
                    Merging documents into packet…
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Right rail ──────────────────────────────────────────────────────── */}
      <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>

        {/* Template selector */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Template</Typography>
          <Button fullWidth variant="outlined" size="small" endIcon={<ExpandMoreOutlined />}
            onClick={e => setTemplateAnchor(e.currentTarget)}
            sx={{ justifyContent: 'space-between', textAlign: 'left', fontWeight: 500, fontSize: '0.8125rem', textTransform: 'none' }}>
            {activeTemplate.name}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{activeTemplate.description}</Typography>
          <Popover open={Boolean(templateAnchor)} anchorEl={templateAnchor} onClose={() => setTemplateAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{ paper: { sx: { width: 260, borderRadius: 1.5, mt: 0.5 } } }}>
            <List dense disablePadding sx={{ py: 0.5 }}>
              {availableTemplates.map(t => (
                <ListItemButton key={t.id} selected={t.id === activeTemplate.id}
                  onClick={() => { setTemplateAnchor(null); if (t.id !== activeTemplate.id) setConfirmTemplate(t) }}
                  sx={{ px: 1.5, py: 0.75 }}>
                  <ListItemText primary={t.name} secondary={t.payer ?? 'Generic fallback'}
                    primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                </ListItemButton>
              ))}
            </List>
          </Popover>
        </Box>

        {/* Submission instructions */}
        {(submissionInstructions.appealAddress || submissionInstructions.deadline) && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>
              Submission Instructions
              <Typography component="span" variant="caption" sx={{ ml: 0.5, fontSize: '0.6rem', color: 'text.disabled', fontStyle: 'italic' }}>(from denial letter)</Typography>
            </Typography>
            {submissionInstructions.deadline && (
              <Alert severity={submissionInstructions.deadline.includes('URGENT') ? 'error' : 'warning'} icon={<WarningOutlined sx={{ fontSize: 14 }} />}
                sx={{ py: 0.25, px: 1, mb: 1, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                {submissionInstructions.deadline}
              </Alert>
            )}
            {submissionInstructions.appealAddress && (
              <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'pre-line', mb: 0.5 }}>
                {submissionInstructions.appealAddress}
              </Typography>
            )}
            {submissionInstructions.referenceRequired && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem', mb: 0.25 }}>
                Ref: {submissionInstructions.referenceRequired}
              </Typography>
            )}
            {submissionInstructions.notes && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic' }}>
                {submissionInstructions.notes}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Channel + submit */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 0.75 }}>Submission Channel</Typography>
          <FormControl fullWidth size="small" sx={{ mb: assembledPacket ? 1 : 1.5 }}>
            <Select value={channel} onChange={e => setChannel(e.target.value as SubmissionChannel)}
              sx={{ fontSize: '0.8125rem' }}
              renderValue={v => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {CHANNEL_CONFIG[v as SubmissionChannel].icon}
                  {CHANNEL_CONFIG[v as SubmissionChannel].label}
                </Box>
              )}>
              {(Object.keys(CHANNEL_CONFIG) as SubmissionChannel[]).map(c => (
                <MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {CHANNEL_CONFIG[c].icon}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{CHANNEL_CONFIG[c].label}</Typography>
                      <Typography variant="caption" color="text.secondary">{CHANNEL_CONFIG[c].description}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Channel-specific detail fields */}
          {channel === 'agent' && (
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel sx={{ fontSize: '0.8125rem' }}>Portal</InputLabel>
              <Select
                value={agentPortal}
                label="Portal"
                onChange={e => setAgentPortal(e.target.value)}
                sx={{ fontSize: '0.8125rem' }}
              >
                {AGENT_PORTALS.map(p => (
                  <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.8125rem' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{p.label}</Typography>
                      {p.notes && <Typography variant="caption" color="text.secondary">{p.notes}</Typography>}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {channel === 'fax' && (
            <TextField
              fullWidth size="small" label="Fax Number"
              value={faxNumber}
              onChange={e => setFaxNumber(e.target.value)}
              placeholder="e.g. 1-800-000-0000"
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
            />
          )}
          {channel === 'mail' && (
            <TextField
              fullWidth size="small" label="Mailing Address"
              value={mailAddress}
              onChange={e => setMailAddress(e.target.value)}
              multiline rows={3}
              placeholder={'Appeals Unit\nP.O. Box 00000\nCity, ST 00000'}
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
            />
          )}

          {/* Assembled packet preview */}
          {assembledPacket && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <PictureAsPdfOutlined sx={{ fontSize: 18, color: '#C0392B', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                  {assembledPacket.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                  {assembledPacket.size}
                </Typography>
              </Box>
              <CheckCircleOutlineOutlined sx={{ fontSize: 15, color: 'success.main', flexShrink: 0 }} />
            </Box>
          )}

          {submitted ? (
            <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid', borderColor: '#86EFAC', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
              <TaskAltOutlined sx={{ fontSize: 22, color: 'success.main', mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', fontSize: '0.8125rem' }}>
                Appeal Submitted
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                via {CHANNEL_CONFIG[channel].label} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ) : (
            <>
              <Button
                fullWidth variant="contained" disableElevation
                disabled={!canAct || !assembledPacket || submitting}
                onClick={handleSubmit}
                startIcon={submitting ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : null}
                sx={{ fontWeight: 600, fontSize: '0.875rem', py: 0.875 }}
              >
                {submitting ? 'Submitting…' : 'Submit Appeal'}
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

      {/* Template switch confirmation dialog */}
      <Dialog open={Boolean(confirmTemplate)} onClose={() => setConfirmTemplate(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ pb: 1 }}>Switch Template?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Switching to <strong>{confirmTemplate?.name}</strong> will regenerate the letter and discard any manual edits you've made. This cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', gap: 1, p: 2, pt: 0 }}>
          <Button fullWidth variant="outlined" onClick={() => setConfirmTemplate(null)}>Cancel</Button>
          <Button fullWidth variant="contained" disableElevation color="warning" onClick={handleConfirmTemplateSwitch}>Switch Template</Button>
        </Box>
      </Dialog>
      </Box>
    </Box>
  )
}

// ─── Records Request Tab (ADR + HealthSource) ────────────────────────────────

type HsPhase = 'ready' | 'sent' | 'reviewing' | 'approved'

const HS_ADR = {
  adrRef: 'CMS-ADR-2026-0278', adrDate: 'Mar 21, 2026', mac: 'Palmetto GBA (J-M)',
  recordsRequested: [
    { id: 'hp',     label: 'History & Physical (H&P)',   required: true },
    { id: 'ds',     label: 'Discharge Summary',          required: true },
    { id: 'pn',     label: 'Progress Notes — all dates', required: true },
    { id: 'nn',     label: 'Nursing Notes — all dates',  required: true },
    { id: 'lab',    label: 'Laboratory Results',         required: true },
    { id: 'rad',    label: 'Radiology Reports',          required: false },
    { id: 'attest', label: 'Physician Attestation',      required: true },
  ],
  hsRequestId: 'HS-REQ-44821', hsSentAt: 'Mar 22, 2026 at 2:14 PM', hsRespondedAt: 'Apr 1, 2026 at 9:43 AM',
  retrievedPages: 127,
  retrievedComponents: ['History & Physical', 'Discharge Summary', 'Progress Notes (×8)', 'Nursing Notes (×14)', 'Laboratory Results (×3)', 'Physician Attestation'],
  missingFromRequest: ['Radiology Reports (not present — imaging pre-dates admission)'],
  submissionRef: 'ESMD-2026-0278-A', submissionTracking: 'ESMD-TRK-74829A',
  submittedAt: 'Apr 2, 2026 at 2:41 PM', submissionMethod: 'esMD (Electronic Medical Documentation)', estimatedDelivery: '1–2 business days',
}

function RecordsRequestTab({ denial, denialState, onStatusUpdate }: { denial: DenialRecord; denialState: string; onStatusUpdate?: (s: ActiveStatus) => void }) {
  const canAct = denialState === 'Active'
  const [phase, setPhase] = useState<HsPhase>('reviewing')
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [viewRecord, setViewRecord] = useState(false)
  const medRecord: MedicalRecord | undefined = MEDICAL_RECORDS[denial.id] ?? MEDICAL_RECORDS[denial.patient.mrn]

  const steps = [
    { label: 'ADR Received',                 done: true,                                         active: false },
    { label: 'Request Sent to HealthSource', done: phase !== 'ready',                            active: phase === 'sent' },
    { label: 'Records Retrieved',            done: phase === 'reviewing' || phase === 'approved', active: false },
    { label: 'Submitted to MAC',             done: phase === 'approved',                          active: false },
  ]

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}
      {/* Progress stepper */}
      <Paper variant="outlined" sx={{ borderRadius: 1.5, px: 3, py: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {steps.map((step, i) => (
            <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: step.done ? 'success.main' : step.active ? 'primary.main' : 'grey.200', color: step.done || step.active ? 'white' : 'text.disabled' }}>
                  {step.done ? <TaskAltOutlined sx={{ fontSize: 13 }} /> : step.active ? <SyncOutlined sx={{ fontSize: 13 }} /> : <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, lineHeight: 1 }}>{i + 1}</Typography>}
                </Box>
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontWeight: step.active ? 600 : 400, color: step.done ? 'success.dark' : step.active ? 'primary.main' : 'text.secondary' }}>{step.label}</Typography>
              </Box>
              {i < steps.length - 1 && <Box sx={{ flex: 1, height: 1, bgcolor: step.done ? 'success.light' : 'divider', mx: 1.5 }} />}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ready */}
      {phase === 'ready' && (
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: '#FFF8E1', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MailOutlineOutlined sx={{ fontSize: 15, color: '#B7770D' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>ADR Details — Parsed from Document</Typography>
              </Box>
              {[
                { label: 'ADR Reference',   value: HS_ADR.adrRef },
                { label: 'Received',        value: HS_ADR.adrDate },
                { label: 'MAC',             value: HS_ADR.mac },
                { label: 'Patient',         value: denial.patient.name },
                { label: 'MRN',             value: denial.patient.mrn },
                { label: 'Date of Service', value: formatDate(denial.dos) },
                { label: 'Claim ID',        value: denial.claim.claimId },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
                </Box>
              ))}
              <Box sx={{ px: 2, py: 1 }}>
                <Chip size="small" icon={<PictureAsPdfOutlined sx={{ fontSize: 11 }} />} label="MCR-ADR-20260321-CLM9876541.pdf" clickable sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#FFF8E1', color: '#B7770D', '& .MuiChip-icon': { color: '#B7770D' } }} />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Records Requested by MAC</Typography>
              </Box>
              {HS_ADR.recordsRequested.map(item => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <CheckCircleOutlineOutlined sx={{ fontSize: 14, color: item.required ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ flex: 1 }}>{item.label}</Typography>
                  {item.required && <Chip size="small" label="Required" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#EBF4FF', color: '#2C5282', '& .MuiChip-label': { px: 0.5 } }} />}
                </Box>
              ))}
            </Paper>
          </Box>
          <Box sx={{ width: 280, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooksOutlined sx={{ fontSize: 15, color: '#2E7D32' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Send via HealthSource</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.5 }}>
                  HealthSource will retrieve the complete medical record from your EMR and electronically submit it to the MAC via esMD.
                </Typography>
                {[
                  { label: 'Patient', value: denial.patient.name },
                  { label: 'MRN',     value: denial.patient.mrn },
                  { label: 'DOS',     value: formatDate(denial.dos) },
                  { label: 'ADR Ref', value: HS_ADR.adrRef },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Button fullWidth variant="contained" disableElevation size="small" disabled={!canAct}
                  startIcon={<LibraryBooksOutlined sx={{ fontSize: 15 }} />}
                  onClick={() => {
                    setPhase('sent')
                    onStatusUpdate?.('Awaiting Records')
                    setTimeout(() => setPhase('reviewing'), 1800)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Send Request to HealthSource
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* sent */}
      {phase === 'sent' && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SyncOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Request sent to HealthSource</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Retrieving records from your EMR...</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Reference: {HS_ADR.hsRequestId}</Typography>
        </Box>
      )}

      {/* reviewing */}
      {phase === 'reviewing' && (
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Alert severity="info" icon={<LibraryBooksOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 2, fontSize: '0.8125rem' }}>
              <strong>HealthSource has retrieved the record</strong> — review before approving submission to {HS_ADR.mac}.
            </Alert>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooksOutlined sx={{ fontSize: 15, color: '#2E7D32' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Record Retrieved by HealthSource</Typography>
                <Box sx={{ flex: 1 }} />
                <Chip size="small" label={`${HS_ADR.retrievedPages} pages`} sx={{ height: 18, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#C8E6C9', color: '#1B5E20', '& .MuiChip-label': { px: 0.75 } }} />
              </Box>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{denial.patient.name} — Complete Medical Record</Typography>
                <Typography variant="caption" color="text.secondary">DOS {formatDate(denial.dos)} · Retrieved {HS_ADR.hsRespondedAt}</Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>INCLUDED</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {HS_ADR.retrievedComponents.map(c => (
                    <Chip key={c} size="small" icon={<CheckCircleOutlineOutlined sx={{ fontSize: 11 }} />} label={c}
                      sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#E8F5E9', color: '#2E7D32', '& .MuiChip-icon': { color: '#2E7D32' }, '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
              </Box>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>NOT INCLUDED</Typography>
                {HS_ADR.missingFromRequest.map(m => (
                  <Typography key={m} variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>• {m}</Typography>
                ))}
              </Box>
              {medRecord && (
                <Box sx={{ px: 2, py: 1.25 }}>
                  <Button size="small" variant="outlined" startIcon={<PictureAsPdfOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => setViewRecord(true)}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }}>
                    View Full Record
                  </Button>
                </Box>
              )}
            </Paper>
            {rejecting && (
              <Paper variant="outlined" sx={{ mt: 2, borderRadius: 1.5, p: 2, bgcolor: '#FFF5F5' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'error.main' }}>Reject — Send Back to HealthSource</Typography>
                <TextField multiline rows={3} fullWidth size="small" placeholder="Describe what's missing or incorrect..."
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)} sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => setRejecting(false)}>Cancel</Button>
                  <Button size="small" variant="contained" color="error" disableElevation disabled={!rejectReason.trim()}
                    onClick={() => { setRejecting(false); setRejectReason(''); setPhase('sent'); setTimeout(() => setPhase('reviewing'), 2000) }}>
                    Send Back to HealthSource
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
          <Box sx={{ width: 240, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>HealthSource Request</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {[
                  { label: 'Request ID',        value: HS_ADR.hsRequestId },
                  { label: 'Sent',              value: HS_ADR.hsSentAt },
                  { label: 'Records retrieved', value: HS_ADR.hsRespondedAt },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ mb: 1.25 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                  Once approved, HealthSource submits to {HS_ADR.mac} via esMD.
                </Typography>
                <Button fullWidth variant="contained" disableElevation color="success" size="small"
                  startIcon={<VerifiedOutlined sx={{ fontSize: 15 }} />}
                  onClick={() => setPhase('approved')}
                  sx={{ textTransform: 'none', fontWeight: 600, mb: 1 }}>
                  Approve & Submit
                </Button>
                <Button fullWidth variant="outlined" color="error" size="small" disabled={rejecting}
                  onClick={() => setRejecting(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Reject
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Medical record viewer */}
      {medRecord && (
        <Dialog open={viewRecord} onClose={() => setViewRecord(false)} maxWidth="md" fullWidth
          slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '90vh' } } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Medical Record — {denial.patient.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Retrieved by HealthSource · {HS_ADR.retrievedPages} pages · {HS_ADR.hsRespondedAt}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setViewRecord(false)} sx={{ color: 'text.secondary' }}>
              <CloseOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: 'auto' }}>
            <MedicalRecordContent record={medRecord} denial={denial} />
          </DialogContent>
        </Dialog>
      )}

      {/* approved */}
      {phase === 'approved' && (
        <Box>
          <Alert severity="success" icon={<DoneAllOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 3, fontSize: '0.8125rem' }}>
            <strong>Records submitted to MAC</strong> — HealthSource delivered the medical record to {HS_ADR.mac} via esMD.
          </Alert>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Paper variant="outlined" sx={{ flex: 1, borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <DoneAllOutlined sx={{ fontSize: 15, color: '#2E7D32' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Submission Confirmation — HealthSource API</Typography>
              </Box>
              {[
                { label: 'Submission Method',  value: HS_ADR.submissionMethod },
                { label: 'Reference',          value: HS_ADR.submissionRef },
                { label: 'Tracking Number',    value: HS_ADR.submissionTracking },
                { label: 'Submitted At',       value: HS_ADR.submittedAt },
                { label: 'Estimated Delivery', value: HS_ADR.estimatedDelivery },
                { label: 'Destination',        value: HS_ADR.mac },
                { label: 'Patient',            value: denial.patient.name },
                { label: 'ADR Reference',      value: HS_ADR.adrRef },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 170, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
                </Box>
              ))}
            </Paper>
            <Paper variant="outlined" sx={{ width: 240, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Record Submitted</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>{denial.patient.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{HS_ADR.retrievedPages} pages</Typography>
                {HS_ADR.retrievedComponents.map(c => (
                  <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                    <CheckCircleOutlineOutlined sx={{ fontSize: 12, color: 'success.main', flexShrink: 0 }} />
                    <Typography variant="caption">{c}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ─── Corrected Claim Tab ──────────────────────────────────────────────────────

type ClaimPhase = 'editing' | 'submitted'

interface DxCode { id: string; code: string; description: string }

const CODING_ERROR_DX: DxCode[] = [
  { id: 'd1', code: 'Z87.39', description: 'Personal history of other musculoskeletal disorders' },
  { id: 'd2', code: 'J18.9',  description: 'Pneumonia, unspecified organism' },
  { id: 'd3', code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
  { id: 'd4', code: 'I10',    description: 'Essential (primary) hypertension' },
]

function CorrectedClaimTab({ denial, denialState, onStatusUpdate }: { denial: DenialRecord; denialState: string; onStatusUpdate?: (s: ActiveStatus) => void }) {
  const canAct = denialState === 'Active'
  const [phase, setPhase] = useState<ClaimPhase>('editing')
  const [diagnoses, setDiagnoses] = useState<DxCode[]>(CODING_ERROR_DX)
  const [npi, setNpi] = useState('')

  const isCodingError = denial.denialType === 'Coding Error'
  const isCorrectOrder = diagnoses[0]?.code === 'J18.9'
  const canSubmit = isCodingError ? isCorrectOrder : npi.length === 10

  function moveDx(idx: number, dir: 'up' | 'down') {
    setDiagnoses(prev => {
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
      return next
    })
  }

  if (phase === 'submitted') {
    const vendor = isCodingError ? 'Change Healthcare' : 'Availity'
    const ref    = isCodingError ? 'CHC-CX-20260402-7712993' : 'CGN-CX-20260402-8765432'
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="success" icon={<DoneAllOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 3 }}>
          <strong>Corrected claim submitted</strong> — accepted by {vendor} clearinghouse.
        </Alert>
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Submission Details</Typography>
          </Box>
          {[
            { label: 'Reference',      value: ref },
            { label: 'Vendor',         value: vendor },
            { label: 'Original Claim', value: denial.claim.claimId },
            { label: 'Submitted At',   value: 'Apr 2, 2026 at 11:45 AM' },
            { label: 'Status',         value: 'Accepted by clearinghouse — awaiting payer adjudication' },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>{label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 820, mx: 'auto' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}
      {isCodingError ? (
        <>
          <Alert severity="warning" sx={{ mb: 3, fontSize: '0.8125rem' }}>
            <strong>ICD-10 Principal Diagnosis Sequencing Error</strong> — CARC-4: The condition chiefly responsible for admission after study must be sequenced first. Reorder the diagnoses to correct the principal.
          </Alert>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContentPasteOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Diagnosis Codes — Reorder to Correct Sequence</Typography>
              <Box sx={{ flex: 1 }} />
              {isCorrectOrder
                ? <Chip size="small" label="Sequence corrected" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                : <Chip size="small" label="Fix principal diagnosis" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />}
            </Box>
            {!isCorrectOrder && (
              <Box sx={{ px: 2, py: 1, bgcolor: '#FFFBF0', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Current principal: <strong style={{ color: '#B7770D' }}>{diagnoses[0]?.code} — {diagnoses[0]?.description}</strong>
                </Typography>
              </Box>
            )}
            {diagnoses.map((dx, idx) => (
              <Box key={dx.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: idx === 0 && !isCorrectOrder ? '#FFF5F5' : idx === 0 ? '#F0FFF4' : 'transparent' }}>
                <Chip size="small" label={idx === 0 ? 'Principal' : `Dx ${idx + 1}`} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, bgcolor: idx === 0 && !isCorrectOrder ? '#FFCDD2' : idx === 0 ? '#C8E6C9' : 'grey.200', color: idx === 0 && !isCorrectOrder ? '#C62828' : idx === 0 ? '#1B5E20' : 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
                <Chip size="small" label={dx.code} sx={{ fontFamily: 'monospace', height: 20, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#EBF4FF', color: '#2C5282', '& .MuiChip-label': { px: 0.75 }, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ flex: 1 }}>{dx.description}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <IconButton size="small" disabled={idx === 0} onClick={() => moveDx(idx, 'up')} sx={{ p: 0.25 }}><KeyboardArrowUpOutlined sx={{ fontSize: 15 }} /></IconButton>
                  <IconButton size="small" disabled={idx === diagnoses.length - 1} onClick={() => moveDx(idx, 'down')} sx={{ p: 0.25 }}><KeyboardArrowDownOutlined sx={{ fontSize: 15 }} /></IconButton>
                </Box>
              </Box>
            ))}
          </Paper>
        </>
      ) : (
        <>
          <Alert severity="warning" sx={{ mb: 3, fontSize: '0.8125rem' }}>
            <strong>Missing Billing NPI</strong> — CARC-16: The claim was rejected due to a missing billing NPI in claim loop 2010BB. Enter the correct NPI to resubmit.
          </Alert>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContentPasteOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Claim Header — Loop 2010BB (Billing Provider)</Typography>
            </Box>
            {([
              { label: 'Billing Provider Name',    value: 'Springfield General Hospital', ok: true  as const },
              { label: 'Billing Provider Address', value: '1400 Main St, Springfield, IL 62701', ok: true  as const },
              { label: 'Billing Provider Tax ID',  value: '36-4127893', ok: true  as const },
              { label: 'Group / Org NPI',          value: '1234567890', ok: true  as const },
              { label: 'Billing NPI',              value: null,         ok: false as const },
            ]).map(({ label, value, ok }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: !ok ? '#FFF5F5' : 'transparent' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 220, flexShrink: 0 }}>{label}</Typography>
                {ok ? (
                  <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip size="small" label="MISSING" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#FFCDD2', color: '#C62828', '& .MuiChip-label': { px: 0.75 } }} />
                    <TextField size="small" placeholder="10-digit NPI" value={npi}
                      onChange={e => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      error={npi.length > 0 && npi.length !== 10}
                      helperText={npi.length > 0 && npi.length !== 10 ? 'NPI must be 10 digits' : ''}
                      sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', py: 0.5 }, width: 180 }} />
                  </Box>
                )}
              </Box>
            ))}
          </Paper>
        </>
      )}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Original claim {denial.claim.claimId} · {isCodingError ? 'Change Healthcare' : 'Availity'} clearinghouse
        </Typography>
        <Button variant="contained" disableElevation disabled={!canAct || !canSubmit}
          startIcon={<SendOutlined sx={{ fontSize: 15 }} />}
          onClick={() => { setPhase('submitted'); onStatusUpdate?.('Corrected Claim Submitted') }}
          sx={{ textTransform: 'none', fontWeight: 600 }}>
          Submit Corrected Claim
        </Button>
      </Box>
    </Box>
  )
}

// ─── Filing Defense Tab (Timely Filing) ──────────────────────────────────────

type FilingPhase = 'drafting' | 'submitted'

function FilingDefenseTab({ denial, denialState }: { denial: DenialRecord; denialState: string }) {
  const canAct = denialState === 'Active'
  const [phase, setPhase] = useState<FilingPhase>('drafting')

  if (phase === 'submitted') {
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="success" icon={<DoneAllOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 3 }}>
          <strong>Filing defense submitted</strong> — sent to UHC appeals with clearinghouse proof attached.
        </Alert>
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Submission Details</Typography>
          </Box>
          {[
            { label: 'Reference',   value: 'UHC-TF-DEFENSE-20260402-CLM1198004' },
            { label: 'Method',      value: 'Fax' },
            { label: 'Destination', value: 'UHC Appeals — Timely Filing Review' },
            { label: 'Submitted',   value: 'Apr 2, 2026 at 3:15 PM' },
            { label: 'Pages sent',  value: '8 (dispute letter + 277CA + transmission log)' },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>{label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}
      <Alert severity="warning" sx={{ mb: 3, fontSize: '0.8125rem' }}>
        <strong>Timely Filing — Clearinghouse Proof Available</strong> — The 277-CA acceptance report from Availity confirms the claim was transmitted Nov 20, 2025, within the 90-day contractual limit. The payer processed it on Feb 27, 2026.
      </Alert>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Filing Timeline</Typography>
            </Box>
            {[
              { label: 'Date of Service',                     value: formatDate(denial.dos),             status: 'neutral' as const, note: undefined },
              { label: 'Original Submission (Clearinghouse)', value: 'Nov 20, 2025',                    status: 'good'    as const, note: '2 days after DOS — within limit' },
              { label: 'Clearinghouse Accepted',              value: 'Nov 20, 2025 at 10:42 AM',        status: 'good'    as const, note: '277-CA confirmation on file' },
              { label: 'Contractual Filing Limit',            value: 'Feb 16, 2026 (90 days from DOS)', status: 'neutral' as const, note: undefined },
              { label: 'Payer Processed Date',                value: 'Feb 27, 2026',                    status: 'bad'     as const, note: '11 days past limit — payer-side delay' },
            ].map(({ label, value, status, note }) => (
              <Box key={label} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 240, flexShrink: 0 }}>{label}</Typography>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', color: status === 'good' ? 'success.dark' : status === 'bad' ? 'error.main' : 'text.primary' }}>{value}</Typography>
                  {note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>{note}</Typography>}
                </Box>
              </Box>
            ))}
          </Paper>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadFileOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Proof Documents</Typography>
            </Box>
            {[
              { label: '277CA_Availity_20251120_CLM1198004.edi', note: 'Clearinghouse acceptance — Nov 20, 2025 10:42 AM' },
              { label: 'CH_Transmission_Log_20251120.pdf',        note: 'Batch transmission log from Availity' },
            ].map(doc => (
              <Box key={doc.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <CheckCircleOutlineOutlined sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', display: 'block' }}>{doc.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{doc.note}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
        <Box sx={{ width: 260, flexShrink: 0 }}>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Dispute Letter</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, mb: 1.5 }}>
                Pre-drafted letter citing Availity 277-CA acceptance (Nov 20, 2025) against the 90-day contractual filing limit.
              </Typography>
              <Button size="small" variant="outlined" fullWidth sx={{ textTransform: 'none', fontWeight: 600 }}>Preview Letter</Button>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Submit Defense</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Deadline</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{formatDate(denial.deadline)}</Typography>
                <Chip size="small" label={`${daysUntil(denial.deadline)}d remaining`} color="error" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Will fax to UHC appeals with 277-CA and transmission log attached.
              </Typography>
              <Button fullWidth variant="contained" disableElevation size="small" disabled={!canAct}
                startIcon={<SendOutlined sx={{ fontSize: 15 }} />}
                onClick={() => setPhase('submitted')}
                sx={{ textTransform: 'none', fontWeight: 600 }}>
                Submit Filing Defense
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

// ─── Recoupment Tab ───────────────────────────────────────────────────────────

type RecoupmentPath = 'accept' | 'dispute' | 'audit'

function RecoupmentTab({ denial, denialState }: { denial: DenialRecord; denialState: string }) {
  const canAct = denialState === 'Active'
  const [selectedPath, setSelectedPath] = useState<RecoupmentPath | null>('dispute')
  const [submitted, setSubmitted] = useState(false)
  const [installments, setInstallments] = useState(false)

  const paths: { id: RecoupmentPath; title: string; description: string; icon: React.ReactNode; color: string }[] = [
    { id: 'accept',  title: 'Accept & Arrange Repayment',     description: 'Acknowledge the overpayment and arrange repayment — lump sum or installment plan.',                icon: <PaymentsOutlined sx={{ fontSize: 20 }} />,       color: '#B7770D' },
    { id: 'dispute', title: 'Dispute with Clinical Rationale', description: 'Submit a formal dispute with clinical documentation supporting the original MS-DRG assignment.',   icon: <GavelOutlined sx={{ fontSize: 20 }} />,          color: '#2C5282' },
    { id: 'audit',   title: 'Request Formal Audit Review',     description: 'Request an independent review of the BCBS post-payment audit methodology and findings.',           icon: <AccountBalanceOutlined sx={{ fontSize: 20 }} />, color: '#276749' },
  ]

  if (submitted) {
    const label = selectedPath === 'accept' ? 'Repayment arrangement' : selectedPath === 'dispute' ? 'Recoupment dispute' : 'Audit review request'
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="success" icon={<DoneAllOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 3 }}>
          <strong>{label} submitted</strong> to Blue Cross Blue Shield.
        </Alert>
        <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#E8F5E9', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Submission Details</Typography>
          </Box>
          {[
            { l: 'Reference',     v: 'BCBS-DISP-20260402-CLM3317661' },
            { l: 'Response Type', v: label },
            { l: 'Submitted',     v: 'Apr 2, 2026 at 4:05 PM' },
            { l: 'Method',        v: 'Certified Mail' },
            { l: 'Deadline',      v: formatDate(denial.deadline) },
          ].map(({ l, v }) => (
            <Box key={l} sx={{ display: 'flex', px: 2, py: 0.875, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>{l}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{v}</Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: '#FFF5F5', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceOutlined sx={{ fontSize: 15, color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Recoupment Demand — BCBS Post-Payment Audit</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip size="small" label={`${daysUntil(denial.deadline)}d to respond`} color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 4, px: 3, py: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Recoupment Amount', value: formatCurrency(denial.deniedAmount), highlight: true },
            { label: 'Audit Basis',       value: 'MS-DRG Audit — DOS Jan 30, 2026',  highlight: false },
            { label: 'Response Deadline', value: formatDate(denial.deadline),          highlight: false },
            { label: 'Demand Reference',  value: 'BCBS-RCQ-20260319-CLM3317661',      highlight: false },
          ].map(({ label, value, highlight }) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: highlight ? 'error.main' : 'text.primary', fontFamily: highlight ? 'monospace' : undefined }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Choose a response path</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {paths.map(path => (
          <Paper key={path.id} variant="outlined" onClick={() => setSelectedPath(path.id)} sx={{ flex: 1, p: 2, borderRadius: 1.5, cursor: 'pointer', borderColor: selectedPath === path.id ? path.color : 'divider', borderWidth: selectedPath === path.id ? 2 : 1, transition: 'all 0.15s', '&:hover': { borderColor: path.color } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ color: path.color }}>{path.icon}</Box>
              <Box sx={{ flex: 1 }} />
              {selectedPath === path.id && <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: path.color }} />}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: selectedPath === path.id ? path.color : 'text.primary' }}>{path.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{path.description}</Typography>
          </Paper>
        ))}
      </Box>

      {selectedPath === 'accept' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>Repayment Arrangement</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {([
              { id: false, label: 'Lump Sum',         note: `Full ${formatCurrency(denial.deniedAmount)} via offset against future remittances` },
              { id: true,  label: 'Installment Plan', note: 'Up to 12 monthly installments' },
            ] as Array<{ id: boolean; label: string; note: string }>).map(opt => (
              <Paper key={String(opt.id)} variant="outlined" onClick={() => setInstallments(opt.id)}
                sx={{ flex: 1, p: 1.5, borderRadius: 1, cursor: 'pointer', borderColor: installments === opt.id ? 'primary.main' : 'divider', borderWidth: installments === opt.id ? 2 : 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.label}</Typography>
                <Typography variant="caption" color="text.secondary">{opt.note}</Typography>
              </Paper>
            ))}
          </Box>
          <Button variant="contained" disableElevation color="warning" size="small" disabled={!canAct}
            startIcon={<SendOutlined sx={{ fontSize: 15 }} />} onClick={() => setSubmitted(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Submit Repayment Arrangement
          </Button>
        </Paper>
      )}

      {selectedPath === 'dispute' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>Dispute — Clinical Documentation Packet</Typography>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Clinical documentation pulled from HIM on Mar 24. The complete medical record for DOS 1/30/2026 supports the original MS-DRG assignment.
          </Alert>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {['Medical_Record_Complete_HAR210445.pdf', 'Physician_Attestation_MS-DRG.pdf', 'CDI_Review_DRG_Assignment.pdf', 'BCBS_Recoupment_Notice_RCQ20260319.pdf'].map(doc => (
              <Chip key={doc} size="small" icon={<PictureAsPdfOutlined sx={{ fontSize: 11 }} />} label={doc} clickable
                sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#EBF4FF', color: '#2C5282', '& .MuiChip-icon': { color: '#2C5282' } }} />
            ))}
          </Box>
          <Button variant="contained" disableElevation size="small" disabled={!canAct}
            startIcon={<SendOutlined sx={{ fontSize: 15 }} />} onClick={() => setSubmitted(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Submit Dispute via Certified Mail
          </Button>
        </Paper>
      )}

      {selectedPath === 'audit' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Formal Audit Review Request</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.6 }}>
            Request an independent review of the BCBS post-payment audit findings. A formal audit review request letter will be submitted citing objections to the DRG audit methodology and documentation supporting the original MS-DRG assignment.
          </Typography>
          <Button variant="contained" disableElevation color="success" size="small" disabled={!canAct}
            startIcon={<SendOutlined sx={{ fontSize: 15 }} />} onClick={() => setSubmitted(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Submit Audit Review Request
          </Button>
        </Paper>
      )}
    </Box>
  )
}

// ─── Eligibility Tab ──────────────────────────────────────────────────────────

type EligibilityPath = 'reverify' | 'selfpay' | 'secondary'

function EligibilityTab({ denial, denialState }: { denial: DenialRecord; denialState: string }) {
  const canAct = denialState === 'Active'
  const [selectedPath, setSelectedPath] = useState<EligibilityPath | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [correctedDob, setCorrectedDob] = useState('')
  const [secondaryPayer, setSecondaryPayer] = useState('')
  const [secondaryPayerId, setSecondaryPayerId] = useState('')

  const paths: { id: EligibilityPath; title: string; description: string; icon: React.ReactNode }[] = [
    { id: 'reverify',  title: 'Re-verify Eligibility',      description: 'Run a new eligibility check with corrected member ID, name, or date of birth.',     icon: <BadgeOutlined sx={{ fontSize: 20 }} /> },
    { id: 'selfpay',   title: 'Transfer to Self-Pay',        description: 'Move financial responsibility to the patient and initiate self-pay billing.',         icon: <PaymentsOutlined sx={{ fontSize: 20 }} /> },
    { id: 'secondary', title: 'Route to Secondary Payer',    description: 'Bill a secondary insurer if the patient had dual coverage on the date of service.',   icon: <AccountBalanceOutlined sx={{ fontSize: 20 }} /> },
  ]

  if (submitted) {
    const label = selectedPath === 'reverify' ? 'Eligibility re-verification submitted' : selectedPath === 'selfpay' ? 'Claim transferred to self-pay' : 'Claim routed to secondary payer'
    return (
      <Box sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="success" icon={<DoneAllOutlined sx={{ fontSize: 18 }} />} sx={{ mb: 3 }}>
          <strong>{label}</strong>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      {!canAct && <ReadOnlyBanner state={denialState} />}
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: '#FFF5F5', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BadgeOutlined sx={{ fontSize: 15, color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Eligibility Verification Result</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip size="small" label="Low-confidence match (74%)" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 4, px: 3, py: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Coverage Status', value: 'Inactive on DOS',     highlight: true  },
            { label: 'Patient',         value: denial.patient.name,   highlight: false },
            { label: 'MRN',             value: denial.patient.mrn,    highlight: false },
            { label: 'Date of Service', value: formatDate(denial.dos), highlight: false },
            { label: 'Payer',           value: denial.payer,           highlight: false },
          ].map(({ label, value, highlight }) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: highlight ? 'error.main' : 'text.primary' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
            <strong>Low-confidence match (74%)</strong> — Matched by name/DOB only. MRN and member ID not found in Medicaid remit. Verify patient identity before taking action.
          </Alert>
        </Box>
      </Paper>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Choose a resolution path</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {paths.map(path => (
          <Paper key={path.id} variant="outlined" onClick={() => setSelectedPath(path.id)} sx={{ flex: 1, p: 2, borderRadius: 1.5, cursor: 'pointer', borderColor: selectedPath === path.id ? 'primary.main' : 'divider', borderWidth: selectedPath === path.id ? 2 : 1, transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ color: selectedPath === path.id ? 'primary.main' : 'text.secondary' }}>{path.icon}</Box>
              <Box sx={{ flex: 1 }} />
              {selectedPath === path.id && <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: 'primary.main' }} />}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: selectedPath === path.id ? 'primary.main' : 'text.primary' }}>{path.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{path.description}</Typography>
          </Paper>
        ))}
      </Box>

      {selectedPath === 'reverify' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>Re-verify Eligibility with Corrected Information</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" label="Member ID" placeholder="Medicaid member ID" value={memberId} onChange={e => setMemberId(e.target.value)} sx={{ flex: 1 }} />
            <TextField size="small" label="Date of Birth" type="date" value={correctedDob} onChange={e => setCorrectedDob(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
            <TextField size="small" label="Patient Name" defaultValue={denial.patient.name} sx={{ flex: 1 }} />
          </Box>
          <Button variant="contained" disableElevation size="small" onClick={() => setSubmitted(true)}
            disabled={!canAct || (!memberId && !correctedDob)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Run Eligibility Check
          </Button>
        </Paper>
      )}

      {selectedPath === 'selfpay' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Transfer to Self-Pay</Typography>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            Verify patient identity before transferring. This patient was matched with only 74% confidence.
          </Alert>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {formatCurrency(denial.deniedAmount)} will be transferred to patient responsibility and a self-pay billing statement will be issued.
          </Typography>
          <Button variant="contained" disableElevation color="warning" size="small" disabled={!canAct}
            onClick={() => setSubmitted(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Transfer to Self-Pay
          </Button>
        </Paper>
      )}

      {selectedPath === 'secondary' && (
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>Route to Secondary Payer</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" label="Secondary Payer Name" placeholder="e.g. Medicare, BCBS..." value={secondaryPayer} onChange={e => setSecondaryPayer(e.target.value)} sx={{ flex: 1 }} />
            <TextField size="small" label="Secondary Payer EDI ID" placeholder="Payer ID" value={secondaryPayerId} onChange={e => setSecondaryPayerId(e.target.value)} sx={{ flex: 1 }} />
          </Box>
          <Button variant="contained" disableElevation size="small"
            onClick={() => setSubmitted(true)} disabled={!canAct || !secondaryPayer || !secondaryPayerId}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Route Claim to Secondary Payer
          </Button>
        </Paper>
      )}
    </Box>
  )
}

// ─── Outcome Tab ──────────────────────────────────────────────────────────────

const OUTCOME_META: Record<OutcomeDisposition, { label: string; color: string; icon: React.ReactNode }> = {
  overturned_full:    { label: 'Overturned — Full Recovery',    color: '#2e7d32', icon: <TaskAltOutlined sx={{ fontSize: 20 }} /> },
  overturned_partial: { label: 'Overturned — Partial Recovery', color: '#1b5e20', icon: <TaskAltOutlined sx={{ fontSize: 20 }} /> },
  upheld:             { label: 'Upheld by Payer',               color: '#b71c1c', icon: <CancelOutlined sx={{ fontSize: 20 }} /> },
  will_not_appeal:    { label: 'Will Not Appeal',               color: '#616161', icon: <HourglassEmptyOutlined sx={{ fontSize: 20 }} /> },
  settled_partial:    { label: 'Partial Settlement',            color: '#e65100', icon: <GavelOutlined sx={{ fontSize: 20 }} /> },
  corrected_paid:     { label: 'Corrected Claim — Paid',        color: '#1565c0', icon: <TaskAltOutlined sx={{ fontSize: 20 }} /> },
  secondary_paid:     { label: 'Secondary Payer — Paid',        color: '#1565c0', icon: <TaskAltOutlined sx={{ fontSize: 20 }} /> },
}

// ─── Clinical Tab ─────────────────────────────────────────────────────────────

function MedicalRecordContent({ record, denial }: { record: MedicalRecord; denial: DenialRecord }) {
  const los = Math.round((new Date(record.dischargeDate).getTime() - new Date(record.admitDate).getTime()) / (1000 * 60 * 60 * 24))
  const age = Math.floor((new Date(denial.dos || record.admitDate).getTime() - new Date(record.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Patient & Admission */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>

        {/* Patient demographics */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            Patient
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              { label: 'Name',        value: denial.patient.name },
              { label: 'MRN',         value: denial.patient.mrn },
              { label: 'DOB',         value: new Date(record.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { label: 'Age',         value: `${age} yrs` },
              { label: 'Sex',         value: record.sex === 'M' ? 'Male' : 'Female' },
              { label: 'Insurance ID',value: record.insuranceId },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6375rem', display: 'block' }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Admission details */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            Admission
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              { label: 'Admit Date',   value: new Date(record.admitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { label: 'Discharge',    value: new Date(record.dischargeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { label: 'Length of Stay', value: `${los} day${los !== 1 ? 's' : ''}` },
              { label: 'Admit Type',   value: record.admitType },
              { label: 'Attending',    value: record.attendingPhysician },
              { label: 'Facility',     value: record.facility },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6375rem', display: 'block' }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* DRG */}
      {record.drg && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
            DRG
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6375rem', display: 'block' }}>Billed DRG</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{record.drg.billed}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Weight: {record.drg.billedWeight.toFixed(4)}</Typography>
            </Box>
            {record.drg.paidDrg && (
              <>
                <Box sx={{ color: 'error.main', fontSize: 20 }}>→</Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6375rem', display: 'block' }}>Payer Downgraded To</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>{record.drg.paidDrg}</Typography>
                  <Typography variant="caption" sx={{ color: 'error.light' }}>Weight: {record.drg.paidWeight?.toFixed(4)}</Typography>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Diagnoses */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Diagnoses
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Type', 'ICD-10', 'Description'].map(h => (
                  <TableCell key={h} sx={{ py: 0.75 }}>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em' }}>{h}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {record.diagnoses.map((dx, i) => (
                <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip
                      label={dx.type === 'primary' ? 'Primary' : 'Secondary'}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 600,
                        bgcolor: dx.type === 'primary' ? 'primary.main' : 'grey.100',
                        color: dx.type === 'primary' ? '#fff' : 'text.secondary',
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>{dx.code}</TableCell>
                  <TableCell sx={{ py: 0.75 }}><Typography variant="body2">{dx.description}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Procedures */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Procedures
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['CPT', 'Description', 'Date'].map(h => (
                  <TableCell key={h} sx={{ py: 0.75 }}>
                    <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em' }}>{h}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {record.procedures.map((px, i) => (
                <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 0.75, fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>{px.code}</TableCell>
                  <TableCell sx={{ py: 0.75 }}><Typography variant="body2">{px.description}</Typography></TableCell>
                  <TableCell sx={{ py: 0.75 }}><Typography variant="body2">{new Date(px.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Clinical summary */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Clinical Summary
        </Typography>
        {record.clinicalSummary.split('\n\n').map((para, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 1.5, lineHeight: 1.7, color: 'text.primary' }}>{para}</Typography>
        ))}
      </Paper>

      {/* Key facts */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
          Key Appeal Facts
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {record.keyFacts.map((fact, i) => (
            <Box component="li" key={i}>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{fact}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

    </Box>
  )
}

function ClinicalTab({ denial }: { denial: DenialRecord }) {
  const record: MedicalRecord | undefined =
    MEDICAL_RECORDS[denial.id] ?? MEDICAL_RECORDS[denial.patient.mrn]

  if (!record) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No clinical record linked to this denial.</Typography>
      </Box>
    )
  }

  return <MedicalRecordContent record={record} denial={denial} />
}

// ─── Attachments Tab ──────────────────────────────────────────────────────────

interface AttachmentsTabProps {
  denial: DenialRecord
  episodes: SubmissionEpisode[]
  appealLetterPdf: PacketDoc | null
  supportingDocs: PacketDoc[]
  priorCorrespondence: PacketDoc[]
}

function fileIcon(name: string): React.ReactNode {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <PictureAsPdfOutlined sx={{ fontSize: 16, color: '#C62828' }} />
  if (ext === 'edi' || ext === '835' || ext === '837') return <DescriptionOutlined sx={{ fontSize: 16, color: '#1565C0' }} />
  return <InsertDriveFileOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
}

function AttachmentRow({ name, meta, tag }: { name: string; meta?: string; tag?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      {fileIcon(name)}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</Typography>
        {meta && <Typography variant="caption" color="text.secondary">{meta}</Typography>}
      </Box>
      {tag && <Chip size="small" label={tag} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: 'grey.100', color: 'text.secondary' }} />}
      <IconButton size="small" sx={{ color: 'text.disabled', p: 0.5 }}><OpenInBrowserOutlined sx={{ fontSize: 14 }} /></IconButton>
    </Box>
  )
}

function AttachmentGroup({ title, color, count, children }: { title: string; color?: string; count: number; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, color: color ?? 'text.primary' }}>{title}</Typography>
        <Chip size="small" label={count} sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'grey.200', color: 'text.secondary', '& .MuiChip-label': { px: 0.75 } }} />
      </Box>
      {children}
    </Paper>
  )
}

function AttachmentsTab({ denial, episodes, appealLetterPdf, supportingDocs, priorCorrespondence }: AttachmentsTabProps) {
  // Source documents — from episode signals (what the payer sent us)
  const sourceAttachments = episodes.flatMap(ep => ep.signal?.attachments ?? [])

  // Episode action attachments (what we submitted)
  const submissionAttachments = episodes.flatMap(ep => ep.action?.attachments ?? [])

  // Episode result attachments (payer responses after our appeal)
  const resultAttachments = episodes.flatMap(ep => ep.result?.attachments ?? [])

  // Medical record — check if HealthSource record exists
  const medRecord = MEDICAL_RECORDS[denial.id] ?? MEDICAL_RECORDS[denial.patient.mrn]

  const totalCount =
    sourceAttachments.length +
    (medRecord ? 1 : 0) +
    (appealLetterPdf ? 1 : 0) +
    supportingDocs.length +
    priorCorrespondence.length +
    submissionAttachments.length +
    resultAttachments.length

  if (totalCount === 0) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
          <InsertDriveFileOutlined sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2" color="text.secondary">No attachments yet.</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Source documents — payer-originated */}
      {sourceAttachments.length > 0 && (
        <AttachmentGroup title="Source Documents" count={sourceAttachments.length}>
          {sourceAttachments.map((a, i) => (
            <AttachmentRow key={i} name={a.label} tag={a.type === '835_remit' ? '835' : a.type === 'pdf_denial' ? 'Denial Letter' : a.type === 'pdf_adr' ? 'ADR' : a.type === 'pdf_recoupment' ? 'Recoupment' : undefined} />
          ))}
        </AttachmentGroup>
      )}

      {/* Medical record from HealthSource */}
      {medRecord && (
        <AttachmentGroup title="Medical Record — HealthSource" color="#2E7D32" count={1}>
          <AttachmentRow
            name={`Medical_Record_${denial.patient.mrn}_${denial.claim.claimId}.pdf`}
            meta={`${denial.patient.name} · ${medRecord.admitDate} – ${medRecord.dischargeDate} · ${HS_ADR.retrievedPages} pages`}
            tag="HealthSource"
          />
        </AttachmentGroup>
      )}

      {/* Appeal packet */}
      {(appealLetterPdf || supportingDocs.length > 0) && (
        <AttachmentGroup title="Appeal Packet" count={(appealLetterPdf ? 1 : 0) + supportingDocs.length}>
          {appealLetterPdf && <AttachmentRow name={appealLetterPdf.name} meta={`${appealLetterPdf.size} · Generated ${new Date(appealLetterPdf.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`} tag="Appeal Letter" />}
          {supportingDocs.map(d => <AttachmentRow key={d.id} name={d.name} meta={d.size} tag="Supporting" />)}
        </AttachmentGroup>
      )}

      {/* Prior correspondence */}
      {priorCorrespondence.length > 0 && (
        <AttachmentGroup title="Prior Correspondence" count={priorCorrespondence.length}>
          {priorCorrespondence.map(d => <AttachmentRow key={d.id} name={d.name} meta={d.size} />)}
        </AttachmentGroup>
      )}

      {/* Submitted with appeal */}
      {submissionAttachments.length > 0 && (
        <AttachmentGroup title="Submitted with Appeal" count={submissionAttachments.length}>
          {submissionAttachments.map((a, i) => <AttachmentRow key={i} name={a.label} />)}
        </AttachmentGroup>
      )}

      {/* Payer responses */}
      {resultAttachments.length > 0 && (
        <AttachmentGroup title="Payer Responses" count={resultAttachments.length}>
          {resultAttachments.map((a, i) => <AttachmentRow key={i} name={a.label} />)}
        </AttachmentGroup>
      )}

    </Box>
  )
}

// ─── Outcome Tab ───────────────────────────────────────────────────────────────

function OutcomeTab({ denialId, currentState }: { denialId: string; currentState: string }) {
  const outcome = DENIAL_OUTCOMES[denialId]

  if (!outcome || (currentState !== 'Resolved' && currentState !== 'Closed')) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
          <TaskAltOutlined sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2" color="text.secondary">Outcome will be recorded when this denial is resolved or closed.</Typography>
        </Box>
      </Box>
    )
  }

  const meta = OUTCOME_META[outcome.disposition]

  return (
    <Box sx={{ p: 3, maxWidth: 760, mx: 'auto' }}>

      {/* Disposition banner */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: meta.color + '55', bgcolor: meta.color + '0A', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color: meta.color }}>{meta.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ color: meta.color, fontWeight: 700, lineHeight: 1.2 }}>{meta.label}</Typography>
            <Typography variant="caption" color="text.secondary">Resolved {formatDate(outcome.resolvedAt)} · {outcome.daysToResolution} days to resolution</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Denial ID</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{denialId}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Financial outcome */}
      <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
        Financial Outcome
      </Typography>
      <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${outcome.repaidAmount !== undefined ? 4 : 3}, 1fr)` }}>
          {[
            { label: 'Amount Denied', value: formatCurrency(denial.deniedAmount), color: 'error.main' },
            { label: 'Amount Recovered', value: formatCurrency(outcome.recoveredAmount), color: outcome.recoveredAmount > 0 ? 'success.main' : 'text.disabled' },
            { label: 'Written Off', value: formatCurrency(outcome.writtenOffAmount), color: outcome.writtenOffAmount > 0 ? 'warning.main' : 'text.disabled' },
            ...(outcome.repaidAmount !== undefined ? [{ label: 'Repaid to Payer', value: formatCurrency(outcome.repaidAmount), color: 'error.main' as const }] : []),
          ].map(({ label, value, color }, idx, arr) => (
            <Box key={label} sx={{ p: 2, borderRight: idx < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Appeal summary */}
      <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
        Appeal Summary
      </Typography>
      <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Appeal Rounds</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{outcome.appealRoundsCompleted}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Days to Resolution</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{outcome.daysToResolution}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Denial Type</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{denial.denialType}</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Final Note</Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{outcome.finalNote}</Typography>
      </Paper>

      {/* Related denials (if any) */}
      {denial.relatedDenialIds && denial.relatedDenialIds.length > 0 && (
        <>
          <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em' }}>
            Related Denials
          </Typography>
          <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 1.5, overflow: 'hidden' }}>
            {denial.relatedDenialIds.map((relId, idx) => {
              const rel = SEED_DENIALS.find(d => d.id === relId)
              const relOutcome = DENIAL_OUTCOMES[relId]
              if (!rel) return null
              return (
                <Box key={relId} sx={{ px: 2, py: 1.5, borderBottom: idx < (denial.relatedDenialIds?.length ?? 0) - 1 ? '1px solid' : 'none', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{rel.id}</Typography>
                    <Typography variant="body2" color="text.secondary">{rel.denialType} · {rel.denialSubtype}</Typography>
                  </Box>
                  {relOutcome && (
                    <Typography variant="caption" sx={{ color: relOutcome.disposition === 'overturned_full' ? 'success.main' : relOutcome.disposition === 'will_not_appeal' ? 'text.disabled' : 'warning.main', fontWeight: 600 }}>
                      {OUTCOME_META[relOutcome.disposition].label}
                    </Typography>
                  )}
                  <Chip label={rel.state} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }} />
                </Box>
              )
            })}
          </Paper>
        </>
      )}
    </Box>
  )
}

// ─── Intake Review Panel ──────────────────────────────────────────────────────


const DENIAL_TYPES = [
  'Medical Necessity', 'DRG Downgrade', 'Authorization',
  'ADR', 'Coding Error', 'Administrative',
  'Timely Filing', 'Recoupment', 'Eligibility', 'Underpayment',
]

const ENGINE_CHIP_COLORS: Record<ResolutionEngine, { bg: string; color: string }> = {
  appeal:          { bg: '#EBF4FF', color: '#1B3A5C' },
  records_request: { bg: '#F0FFF4', color: '#276749' },
  corrected_claim: { bg: '#FFF8E6', color: '#7D5A00' },
  filing_defense:  { bg: '#FFF5F5', color: '#C0392B' },
  recoupment:      { bg: '#F5F0FF', color: '#553C9A' },
  eligibility:     { bg: '#F0F4FF', color: '#2D4799' },
  underpayment:    { bg: '#FFF7ED', color: '#92400E' },
}

function IntakeInfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, width: 110, flexShrink: 0, lineHeight: 1.6 }}>{label}</Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.6, fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '0.8rem' : undefined }}>{value}</Typography>
    </Box>
  )
}

function IntakeReviewPanel({
  denial,
  assignedTo,
  onAccept,
  onDismiss,
  onWillNotAppeal,
  onViewClaim,
}: {
  denial: DenialRecord
  assignedTo: TeamMember | null
  onAccept: (denialType: string, assignee: TeamMember | null, notes: string) => void
  onDismiss: () => void
  onWillNotAppeal: () => void
  onViewClaim?: () => void
}) {
  const [localType, setLocalType] = useState(denial.denialType)
  const [localAssigneeId, setLocalAssigneeId] = useState<string>(assignedTo?.id ?? '')
  const [notes, setNotes] = useState(denial.notes)

  const engine = getResolutionEngine(localType)
  const engineLabel = ENGINE_LABELS[engine]
  const engineColors = ENGINE_CHIP_COLORS[engine]
  const localAssignee = TEAM_MEMBERS.find(m => m.id === localAssigneeId) ?? null

  const carcDesc = CARC_DESCRIPTIONS[denial.carc]?.short ?? ''
  const rarcDesc = denial.rarc ? (RARC_DESCRIPTIONS[denial.rarc]?.short ?? '') : ''
  const days = Math.ceil((new Date(denial.deadline).getTime() - new Date('2026-04-02').getTime()) / 86400000)


  const source = denial.source ?? 'manual_upload'
  const hasLetter = denial.denialLetterOnFile !== false

  return (
    <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Source indicator */}
      <Box sx={{ mx: 3, mt: 2.5, mb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={source === '835_auto' ? 'Auto-created from 835 remit' : 'Manually uploaded'}
          icon={source === '835_auto' ? <SyncOutlined sx={{ fontSize: '13px !important' }} /> : <UploadFileOutlined sx={{ fontSize: '13px !important' }} />}
          sx={{ fontSize: '0.6875rem', height: 22, fontWeight: 600,
            bgcolor: source === '835_auto' ? 'info.light' : 'action.selected',
            color: source === '835_auto' ? 'info.dark' : 'text.secondary',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
        {source === '835_auto' && denial.matchConfidence && (
          <Chip size="small"
            label={`${denial.matchConfidence.charAt(0).toUpperCase() + denial.matchConfidence.slice(1)} confidence match`}
            sx={{ fontSize: '0.6875rem', height: 22, fontWeight: 600,
              bgcolor: denial.matchConfidence === 'high' ? 'success.light' : denial.matchConfidence === 'medium' ? 'warning.light' : 'error.light',
              color: denial.matchConfidence === 'high' ? 'success.dark' : denial.matchConfidence === 'medium' ? 'warning.dark' : 'error.dark',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>

      {/* Banner */}
      <Alert
        severity={source === '835_auto' && !hasLetter ? 'warning' : 'info'}
        sx={{ mx: 3, mt: 1.5, mb: 0, borderRadius: 1.5, fontSize: '0.8125rem' }}
      >
        {source === '835_auto' && !hasLetter
          ? 'This instance was auto-created from remit data — no denial letter on file yet. You can accept based on the CARC/RARC codes below, or upload the letter first.'
          : 'Review the classification and assignment below, then accept to move this denial into the active worklist — or dismiss if it shouldn\'t be worked.'
        }
      </Alert>

      {/* Two-column body */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, p: 3, flex: 1 }}>

        {/* ── Left: Denial facts ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Denial Details</Typography>
            </Box>
            <Box sx={{ px: 2, py: 0.5 }}>
              <IntakeInfoRow label="Patient" value={<><strong>{denial.patient.name}</strong> · {denial.patient.mrn}</>} />
              <IntakeInfoRow label="Payer" value={denial.payer} />
              <IntakeInfoRow label="Claim" value={`${denial.claim.claimId} · ${denial.claim.har}`} mono />
              <IntakeInfoRow label="Date of Service" value={formatDate(denial.dos)} />
              <IntakeInfoRow
                label="Denial Letter"
                value={
                  hasLetter
                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <VerifiedOutlined sx={{ fontSize: 13, color: 'success.main' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'success.main', fontWeight: 600 }}>On file</Typography>
                      </Box>
                    : <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'text.disabled', fontStyle: 'italic' }}>Not yet received</Typography>
                        <Button size="small" variant="outlined" startIcon={<UploadFileOutlined sx={{ fontSize: 12 }} />}
                          sx={{ fontSize: '0.6875rem', py: 0.25, px: 1, minHeight: 0, lineHeight: 1.5 }}>
                          Upload
                        </Button>
                      </Box>
                }
              />
              <IntakeInfoRow label="Denied Amount" value={<Typography component="span" variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(denial.deniedAmount)}</Typography>} />
              <IntakeInfoRow
                label="Deadline"
                value={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {formatDate(denial.deadline)}
                    <Chip
                      label={days < 0 ? 'Overdue' : `${days}d remaining`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: days <= 3 ? 'error.light' : 'default', color: days <= 3 ? 'error.dark' : undefined }}
                    />
                  </Box>
                }
              />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Denial Codes</Typography>
              {onViewClaim && (
                <Button size="small" variant="text" onClick={onViewClaim} startIcon={<ArticleOutlined sx={{ fontSize: 13 }} />}
                  sx={{ fontSize: '0.6875rem', p: 0, minWidth: 0, color: 'secondary.main', fontWeight: 600 }}>
                  View Claim
                </Button>
              )}
            </Box>
            <Box sx={{ px: 2, py: 0.5 }}>
              <IntakeInfoRow
                label={denial.carc}
                value={carcDesc || denial.denialSubtype}
              />
              {denial.rarc && (
                <IntakeInfoRow label={denial.rarc} value={rarcDesc || '—'} />
              )}
              <IntakeInfoRow label="Subtype" value={denial.denialSubtype} />
            </Box>
          </Paper>

          {denial.notes && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Ingest Notes</Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{denial.notes}</Typography>
              </Box>
            </Paper>
          )}
        </Box>

        {/* ── Right: Triage decisions ─────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Classification</Typography>
            </Box>
            <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Denial Type</InputLabel>
                <Select
                  label="Denial Type"
                  value={localType}
                  onChange={e => setLocalType(e.target.value)}
                >
                  {DENIAL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Routes to:</Typography>
                <Chip
                  label={engineLabel}
                  size="small"
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600, bgcolor: engineColors.bg, color: engineColors.color, '& .MuiChip-label': { px: 1 } }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Assignment</Typography>
            </Box>
            <Box sx={{ px: 2, py: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  label="Assign To"
                  value={localAssigneeId}
                  onChange={e => setLocalAssigneeId(e.target.value)}
                  renderValue={val => {
                    const m = TEAM_MEMBERS.find(m => m.id === val)
                    return m ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'primary.light' }}>{m.initials}</Avatar>
                        {m.name}
                      </Box>
                    ) : 'Unassigned'
                  }}
                >
                  <MenuItem value=""><em>Unassigned</em></MenuItem>
                  {TEAM_MEMBERS.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.light' }}>{m.initials}</Avatar>
                        {m.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', flex: 1 }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Intake Notes</Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.5 }}>
              <TextField
                multiline
                rows={4}
                fullWidth
                size="small"
                placeholder="Add notes about this denial before accepting…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
              />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Action bar */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={onDismiss}
          sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
        >
          Dismiss
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onWillNotAppeal}
          sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.secondary', borderColor: 'divider' }}
        >
          Will Not Appeal
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Will be assigned to <strong>{localAssignee?.name ?? 'no one'}</strong> · <strong>{engineLabel}</strong> workflow
        </Typography>
        <Button
          variant="contained"
          disableElevation
          size="small"
          onClick={() => onAccept(localType, localAssignee, notes)}
          sx={{ fontWeight: 700, fontSize: '0.8125rem', px: 2 }}
        >
          Accept & Begin Work
        </Button>
      </Box>
    </Box>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface DenialDetailPageProps {
  denial: DenialRecord
  onBack: () => void
  onDenialUpdate: (updates: Partial<DenialRecord>) => void
  onSubmitSuccess?: (channel: string, payer: string, patientName: string) => void
  onNavigateToDenial?: (id: string) => void
}

export default function DenialDetailPage({ denial, onBack, onDenialUpdate, onSubmitSuccess, onNavigateToDenial }: DenialDetailPageProps) {
  const denialId = denial.id
  const [tab, setTab] = useState(0)
  const [remitOpen, setRemitOpen] = useState(false)
  const [claim837Open, setClaim837Open] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<EpisodeAttachment | null>(null)

  function handleOpenAttachment(a: EpisodeAttachment) {
    if (a.type === '835_remit') {
      setRemitOpen(true)
    } else {
      setPreviewAttachment(a)
    }
  }

  const [events, setEvents] = useState<TimelineEvent[]>(() => TIMELINE_EVENTS[denialId] ?? [])
  const [episodes, setEpisodes] = useState<SubmissionEpisode[]>(() => SUBMISSION_EPISODES[denialId] ?? [])

  // Appeal packet state — lifted so AttachmentsTab can read it
  const [appealLetterPdf, setAppealLetterPdf] = useState<PacketDoc | null>(null)
  const [supportingDocs, setSupportingDocs] = useState<PacketDoc[]>([])
  const [priorCorrespondence, setPriorCorrespondence] = useState<PacketDoc[]>([])

  function handleAddFile(episodeId: string, rowType: 'signal' | 'action' | 'result', fileName: string) {
    const attachment: EpisodeAttachment = { type: 'document', label: fileName }
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== episodeId) return ep
      const row = ep[rowType]
      if (!row) return ep
      return { ...ep, [rowType]: { ...row, attachments: [...(row.attachments ?? []), attachment] } }
    }))
  }

  const [assignedTo, setAssignedTo] = useState<TeamMember | null>(denial.assignedTo ?? null)

  const days = daysUntil(denial.deadline)
  const deadlineLabel = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d to deadline`
  const engine = getResolutionEngine(denial.denialType)

  // ── Transition modal state ──────────────────────────────────────────────────
  type TransitionType = 'begin_work' | 'dismiss' | 'mark_submitted' | 'will_not_appeal' | 'next_round' | 'record_decision' | 'close_case' | 'archive' | 'restore'
  const [transitionModal, setTransitionModal] = useState<TransitionType | null>(null)
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null)

  // Form state for modals that need data
  const [dismissReason, setDismissReason] = useState('')
  const [submittedDate, setSubmittedDate] = useState('2026-04-03')
  const [submittedMethod, setSubmittedMethod] = useState<DeliveryMethod>('portal')
  const [submittedRef, setSubmittedRef] = useState('')
  const [decisionDisposition, setDecisionDisposition] = useState<OutcomeDisposition>('overturned_full')
  const [recoveredAmount, setRecoveredAmount] = useState('')
  const [writtenOffAmount, setWrittenOffAmount] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [wnaAmount, setWnaAmount] = useState('')
  const [wnaNote, setWnaNote] = useState('')

  function applyTransition(newState: DenialRecord['state'], newStatus: DenialStatus, extra?: Partial<DenialRecord>) {
    onDenialUpdate({ state: newState, status: newStatus, ...extra })
    setTransitionModal(null)
    setMoreMenuAnchor(null)
  }

  const DISPOSITION_LABELS: Record<OutcomeDisposition, ResolvedStatus> = {
    overturned_full:    'Overturned — Full Payment',
    overturned_partial: 'Overturned — Partial Payment',
    upheld:             'Upheld by Payer',
    will_not_appeal:    'Will Not Appeal',
    settled_partial:    'Partial Settlement',
    corrected_paid:     'Corrected Claim Paid',
    secondary_paid:     'Secondary Payer Paid',
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Sticky header ────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>

        {/* Row 1: back + identifiers + financial */}
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

          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {denial.id}
          </Typography>

          {(() => {
            const STATE_CHIP: Record<string, { bg: string; color: string }> = {
              Intake:    { bg: '#EDF2F7', color: '#4A5568' },
              Active:    { bg: '#EBF4FF', color: '#2C5282' },
              Submitted: { bg: '#E6FFFA', color: '#276749' },
              Resolved:  { bg: '#F0FFF4', color: '#22543D' },
              Closed:    { bg: '#F7FAFC', color: '#718096' },
              Archived:  { bg: '#F3F0FF', color: '#6B46C1' },
            }
            const sc = STATE_CHIP[denial.state] ?? STATE_CHIP['Active']!
            return <Chip label={denial.state} size="small" sx={{ height: 20, fontWeight: 600, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.color }} />
          })()}

          <Box sx={{ flex: 1 }} />

          {/* Financial + deadline */}
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Denied</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {denial.deniedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Deadline</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: days <= 7 ? 'error.main' : 'text.primary', lineHeight: 1 }}>
                {formatDate(denial.deadline)}
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: days <= 7 ? 'error.main' : 'text.secondary' }}>
                  ({deadlineLabel})
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Row 2: patient + payer + denial type */}
        <Box sx={{ px: 2.5, pb: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{denial.patient.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{denial.patient.mrn}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Typography variant="body2" color="text.secondary">{denial.payer}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          {(() => {
            const tc = getDenialTypeConfig(denial.denialType)
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 0.75, bgcolor: tc.bg }}>
                  <tc.Icon sx={{ fontSize: 13, color: tc.color }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: tc.color }}>{denial.denialType}</Typography>
              </Box>
            )
          })()}
          <Typography variant="caption" color="text.disabled">—</Typography>
          <Typography variant="body2" color="text.secondary">{denial.denialSubtype}</Typography>
          <Typography variant="caption" color="text.disabled">·</Typography>
          <Chip label={denial.carc} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'error.light', color: 'error.dark', '& .MuiChip-label': { px: 0.75 } }} />
          {denial.rarc && <Chip label={denial.rarc} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }} />}
        </Box>

        {/* Tabs + inline next step — hidden for Intake (uses dedicated panel) ── */}
        {denial.state !== 'Intake' && (() => {
          const state = denial.state
          const primary: { label: string; type: TransitionType } | null =
            state === 'Intake'    ? { label: 'Accept & Begin Work',   type: 'begin_work'      } :
            state === 'Active'    ? { label: 'Mark as Submitted',     type: 'mark_submitted'  } :
            state === 'Submitted' ? { label: 'Record Payer Decision', type: 'record_decision' } :
            state === 'Resolved'  ? { label: 'Close Case',            type: 'close_case'      } :
            state === 'Archived'  ? { label: 'Restore',               type: 'restore'         } :
            null

          const secondaries: { label: string; type: TransitionType }[] =
            state === 'Intake'    ? [{ label: 'Dismiss', type: 'dismiss' }, { label: 'Archive', type: 'archive' }] :
            state === 'Active'    ? [{ label: 'Will Not Appeal', type: 'will_not_appeal' }, { label: 'Dismiss', type: 'dismiss' }, { label: 'Archive', type: 'archive' }] :
            state === 'Submitted' ? [{ label: 'Begin Next Round', type: 'next_round' }, { label: 'Archive', type: 'archive' }] :
            state === 'Resolved'  ? [{ label: 'Archive', type: 'archive' }] :
            state === 'Closed'    ? [{ label: 'Archive', type: 'archive' }] :
            []

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  flex: 1, minHeight: 36, px: 2,
                  '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none' },
                }}
              >
                <Tab label="Overview" />
                <Tab label={ENGINE_LABELS[engine]} />
                <Tab label="Clinical" />
                <Tab label={`Activity${episodes.length > 0 ? ` (${episodes.length})` : ''}`} />
                <Tab label="Outcome" />
                <Tab label="Attachments" />
              </Tabs>

              {(primary || secondaries.length > 0) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  {primary && (
                    <Button
                      variant="contained" size="small" disableElevation
                      onClick={() => setTransitionModal(primary.type)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {primary.label}
                    </Button>
                  )}
                  {secondaries.length > 0 && (
                    <>
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
                        slotProps={{ paper: { sx: { mt: 0.5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 1.5, minWidth: 160 } } }}
                      >
                        {secondaries.map(a => (
                          <ListItemButton
                            key={a.type} dense
                            onClick={() => { setMoreMenuAnchor(null); setTransitionModal(a.type) }}
                            sx={{ px: 2, py: 1 }}
                          >
                            <ListItemText primary={a.label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                          </ListItemButton>
                        ))}
                      </Popover>
                    </>
                  )}
                </Box>
              )}
            </Box>
          )
        })()}
      </Box>

      {/* ── Intake panel (replaces tabs entirely) ─────────────────────────────── */}
      {denial.state === 'Intake' && (
        <IntakeReviewPanel
          denial={denial}
          assignedTo={assignedTo}
          onViewClaim={CLAIM_DATA_837[denialId] ? () => setClaim837Open(true) : undefined}
          onAccept={(newType, newAssignee, intakeNotes) => {
            const newEngine = getResolutionEngine(newType)
            applyTransition('Active', getDefaultActiveStatus(newEngine), {
              denialType: newType,
              assignedTo: newAssignee,
              notes: intakeNotes,
            })
          }}
          onDismiss={() => setTransitionModal('dismiss')}
          onWillNotAppeal={() => applyTransition('Closed', 'Will Not Appeal')}
        />
      )}

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      {denial.state !== 'Intake' && <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
        {tab === 0 && <OverviewTab denial={denial} denialId={denialId} onViewRemit={() => setRemitOpen(true)} onViewClaim={() => setClaim837Open(true)} onOpenAttachment={handleOpenAttachment} events={events} episodes={episodes} onAddFile={handleAddFile} assignedTo={assignedTo} onChangeAssignee={setAssignedTo} onNavigateToDenial={onNavigateToDenial} />}
        {tab === 1 && engine === 'appeal'          && <AppealTab denial={denial} denialId={denialId} denialState={denial.state} appealLetterPdf={appealLetterPdf} setAppealLetterPdf={setAppealLetterPdf} supportingDocs={supportingDocs} setSupportingDocs={setSupportingDocs} priorCorrespondence={priorCorrespondence} setPriorCorrespondence={setPriorCorrespondence} onSubmit={() => applyTransition('Submitted', 'Awaiting Payer Decision')} onSubmitSuccess={(channel, payer, patientName) => {
          const channelLabel = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG]?.label ?? channel
          const newEvent: TimelineEvent = {
            id: `e-submit-${Date.now()}`,
            type: 'action_appeal_l1',
            timestamp: new Date().toISOString(),
            actor: assignedTo?.name ?? 'Jordan Tang',
            actorType: 'provider',
            summary: `Appeal submitted via ${channelLabel}`,
            detail: `Appeal packet submitted to ${payer} via ${channelLabel}. Packet includes appeal letter and supporting documentation.`,
          }
          setEvents(prev => [...prev, newEvent])
          onSubmitSuccess?.(channel, payer, patientName)
        }} />}
        {tab === 1 && engine === 'records_request' && <RecordsRequestTab denial={denial} denialState={denial.state} onStatusUpdate={s => onDenialUpdate({ status: s })} />}
        {tab === 1 && engine === 'corrected_claim' && <CorrectedClaimTab denial={denial} denialState={denial.state} onStatusUpdate={s => onDenialUpdate({ status: s })} />}
        {tab === 1 && engine === 'filing_defense'  && <FilingDefenseTab  denial={denial} denialState={denial.state} />}
        {tab === 1 && engine === 'recoupment'      && <RecoupmentTab     denial={denial} denialState={denial.state} />}
        {tab === 1 && engine === 'eligibility'     && <EligibilityTab    denial={denial} denialState={denial.state} />}
        {tab === 1 && engine === 'underpayment'    && <UnderpaymentTab  denial={denial} denialState={denial.state} onSubmit={() => applyTransition('Submitted', 'Awaiting Payer Decision')} />}
        {tab === 2 && <ClinicalTab denial={denial} />}
        {tab === 3 && <ActivityTab episodes={episodes} onOpenAttachment={handleOpenAttachment} onAddFile={handleAddFile} />}
        {tab === 4 && <OutcomeTab denialId={denialId} currentState={denial.state} />}
        {tab === 5 && (
          <AttachmentsTab
            denial={denial}
            episodes={episodes}
            appealLetterPdf={appealLetterPdf}
            supportingDocs={supportingDocs}
            priorCorrespondence={priorCorrespondence}
          />
        )}
      </Box>}

      {/* ── Transition modals ─────────────────────────────────────────────────── */}

      {/* Begin Work */}
      <Dialog open={transitionModal === 'begin_work'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Accept & Begin Work</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This denial will move to <strong>Active</strong> state. The assigned team member will begin preparing the response.
          </Typography>
          {assignedTo && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: 'primary.light' }}>{assignedTo.initials}</Avatar>
              <Typography variant="body2">{assignedTo.name} — {ENGINE_LABELS[engine]}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={() => applyTransition('Active', getDefaultActiveStatus(engine))}>
            Begin Work
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dismiss */}
      <Dialog open={transitionModal === 'dismiss'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Dismiss Denial</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">Select a reason for dismissal. This denial will be closed.</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Reason</InputLabel>
            <Select value={dismissReason} label="Reason" onChange={e => setDismissReason(e.target.value)}>
              {['Duplicate denial', 'Not worth pursuing — ROI negative', 'Billing error already corrected', 'Patient liability — not billable to payer', 'Contractual adjustment', 'Other'].map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation color="error" disabled={!dismissReason}
            onClick={() => applyTransition('Closed', 'Dismissed')}>
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark as Submitted */}
      {(() => {
        const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
          portal:       'Online Portal',
          fax:          'Fax',
          mail:         'Certified Mail',
          esmd:         'esMD (Medicare)',
          clearinghouse:'Clearinghouse',
          phone:        'Phone + Follow-up Letter',
        }

        function handleConfirmSubmission() {
          const action: EpisodeAction = {
            label: `Submitted via ${DELIVERY_LABELS[submittedMethod]}`,
            date: submittedDate,
            method: submittedMethod,
            ...(submittedRef ? { reference: submittedRef } : {}),
          }

          setEpisodes(prev => {
            const last = prev[prev.length - 1]
            // If the last episode has no action yet, add the action to it
            if (last && !last.action) {
              return prev.map((ep, i) => i === prev.length - 1 ? { ...ep, action } : ep)
            }
            // Otherwise start a new episode (next round)
            const roundNum = prev.length + 1
            const newEpisode: SubmissionEpisode = {
              id: `ep-${denialId}-r${roundNum}`,
              round: roundNum === 1 ? 'Level 1 Appeal' : roundNum === 2 ? 'Level 2 Appeal' : `Round ${roundNum}`,
              openedAt: submittedDate,
              action,
            }
            return [...prev, newEpisode]
          })

          applyTransition('Submitted', 'Awaiting Payer Decision')
          setSubmittedRef('')
        }

        return (
          <Dialog open={transitionModal === 'mark_submitted'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Mark as Submitted</DialogTitle>
            <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This will log a submission episode in Activity and move the denial to Submitted state.
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Delivery Method</InputLabel>
                <Select value={submittedMethod} label="Delivery Method"
                  onChange={e => setSubmittedMethod(e.target.value as DeliveryMethod)}>
                  {(Object.entries(DELIVERY_LABELS) as [DeliveryMethod, string][]).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField type="date" size="small" label="Submission Date" value={submittedDate}
                onChange={e => setSubmittedDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
              <TextField size="small" label="Reference / Confirmation No. (optional)" value={submittedRef}
                onChange={e => setSubmittedRef(e.target.value)} placeholder="e.g. portal confirmation ID, fax cover no." fullWidth />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button variant="contained" disableElevation onClick={handleConfirmSubmission}>
                Confirm Submission
              </Button>
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* Will Not Appeal */}
      <Dialog open={transitionModal === 'will_not_appeal'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Will Not Appeal</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">This denial will be resolved with no further appeal. Record the financial impact.</Typography>
          <TextField size="small" label="Write-off Amount" value={wnaAmount} onChange={e => setWnaAmount(e.target.value)}
            placeholder="0.00" slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> } }} fullWidth />
          <TextField size="small" label="Note (optional)" value={wnaNote} onChange={e => setWnaNote(e.target.value)}
            multiline rows={2} placeholder="Reason for not appealing…" fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            onClick={() => applyTransition('Closed', 'Will Not Appeal')}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payer Decision */}
      <Dialog open={transitionModal === 'record_decision'} onClose={() => setTransitionModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Record Payer Decision</DialogTitle>
        <DialogContent sx={{ pt: 3, overflow: 'visible', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Disposition</InputLabel>
            <Select value={decisionDisposition} label="Disposition" onChange={e => setDecisionDisposition(e.target.value as OutcomeDisposition)}>
              {(Object.entries(DISPOSITION_LABELS) as [OutcomeDisposition, string][]).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField size="small" label="Recovered Amount" value={recoveredAmount} onChange={e => setRecoveredAmount(e.target.value)}
              placeholder="0.00" slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> } }} fullWidth />
            <TextField size="small" label="Written Off Amount" value={writtenOffAmount} onChange={e => setWrittenOffAmount(e.target.value)}
              placeholder="0.00" slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> } }} fullWidth />
          </Box>
          <TextField size="small" label="Final Note" value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
            multiline rows={3} placeholder="Summarize the payer's decision and any next steps…" fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            onClick={() => applyTransition('Resolved', DISPOSITION_LABELS[decisionDisposition])}>
            Record & Resolve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Begin Next Round */}
      <Dialog open={transitionModal === 'next_round'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Begin Next Appeal Round</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The payer upheld the previous submission. This denial will return to <strong>Active</strong> state for the next round of appeal drafting.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            onClick={() => applyTransition('Active', getDefaultActiveStatus(engine))}>
            Begin Next Round
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Case */}
      <Dialog open={transitionModal === 'close_case'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Close Case</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Financial outcome has been confirmed. This denial will be permanently closed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            onClick={() => applyTransition('Closed', 'Closed')}>
            Close Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive */}
      <Dialog open={transitionModal === 'archive'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Archive Denial?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This denial will be moved to the Archived tab. It can be restored at any time to its current state ({denial.state} / {denial.status}).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            sx={{ bgcolor: '#6B46C1', '&:hover': { bgcolor: '#553C9A' } }}
            onClick={() => {
              onDenialUpdate({ state: 'Archived', status: 'Archived', archivedFrom: { state: denial.state, status: denial.status } })
              setTransitionModal(null)
            }}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore */}
      <Dialog open={transitionModal === 'restore'} onClose={() => setTransitionModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>Restore Denial?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This denial will be returned to{' '}
            <strong>{denial.archivedFrom?.state ?? '—'}</strong> /{' '}
            <strong>{denial.archivedFrom?.status ?? '—'}</strong> and reappear on the worklist.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransitionModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" disableElevation
            onClick={() => {
              if (denial.archivedFrom) {
                onDenialUpdate({ state: denial.archivedFrom.state, status: denial.archivedFrom.status, archivedFrom: undefined })
              }
              setTransitionModal(null)
            }}>
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remit modal */}
      {remitOpen && <RemitModal denialId={denialId} onClose={() => setRemitOpen(false)} />}
      {claim837Open && <Claim837Modal denialId={denialId} onClose={() => setClaim837Open(false)} />}
      {/* Document preview modal */}
      {previewAttachment && <DocumentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />}

    </Box>
  )
}
