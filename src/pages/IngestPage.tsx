import { useState, useRef, useCallback } from 'react'
import {
  Box, Typography, Paper, Button, Chip, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Checkbox, TextField, IconButton,
  LinearProgress, Divider, Alert, Drawer, Tooltip, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
} from '@mui/material'
import {
  UploadFileOutlined, CloseOutlined, WarningAmberOutlined, AutoFixHighOutlined,
  UpdateOutlined, ChevronRightOutlined, CodeOutlined,
} from '@mui/icons-material'
import { type DenialRecord, type DenialState, type DenialStatus } from '../data/denials'

// ─── Source type ──────────────────────────────────────────────────────────────

type SourceType =
  | 'edi-835'
  | 'med-nec-denial'
  | 'auth-denial'
  | 'drg-downgrade'
  | 'adr'
  | 'appeal-upheld'
  | 'appeal-overturned'
  | 'underpayment'

const SOURCE_LABELS: Record<SourceType, string> = {
  'edi-835':           '835 Remit',
  'med-nec-denial':    'Med Nec Denial',
  'auth-denial':       'Auth Denial',
  'drg-downgrade':     'DRG Downgrade',
  'adr':               'ADR',
  'appeal-upheld':     'Appeal Upheld',
  'appeal-overturned': 'Appeal Overturned',
  'underpayment':      'Underpayment EOB',
}

const SOURCE_COLORS: Record<SourceType, { bg: string; color: string }> = {
  'edi-835':           { bg: '#EBF4FF', color: '#1B3A5C' },
  'med-nec-denial':    { bg: '#FFF5F5', color: '#9B1C1C' },
  'auth-denial':       { bg: '#FFF8E6', color: '#7D5A00' },
  'drg-downgrade':     { bg: '#F5F0FF', color: '#553C9A' },
  'adr':               { bg: '#F0FFF4', color: '#276749' },
  'appeal-upheld':     { bg: '#FEF2F2', color: '#991B1B' },
  'appeal-overturned': { bg: '#ECFDF5', color: '#065F46' },
  'underpayment':      { bg: '#FFF7ED', color: '#92400E' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateProposal {
  existingDenialId: string
  label: string
  suggestedState: DenialState
  suggestedStatus: DenialStatus
  updates: Partial<Pick<DenialRecord, 'deniedAmount' | 'carc' | 'rarc'>>
  diffs: Array<{ field: string; label: string; from: string; to: string }>
}

interface RawExtraction {
  sourceType: SourceType
  patientName: string
  mrn: string
  claimId: string
  payer: string
  denialType: string
  denialSubtype: string
  dos: string
  deadline: string
  uncertainFields?: string[]
  updateProposal?: UpdateProposal
  // Shared optional — present on some source types
  har?: string
  carc?: string
  rarc?: string
  deniedAmount?: number
  // 835-specific
  paidAmount?: number
  adjustmentAmount?: number
  // med-nec specific
  clinicalCriteria?: string
  reviewingPhysician?: string
  levelOfCare?: string
  // auth specific
  authNumber?: string
  serviceRequiringAuth?: string
  // drg specific
  originalDrg?: string
  adjustedDrg?: string
  originalPayment?: number
  adjustedPayment?: number
  // adr specific
  recordsRequested?: string
  submissionDeadline?: string
  // appeal-upheld specific
  furtherAppealRights?: string
  // appeal-overturned specific
  approvedAmount?: number
}

interface StagedRecord extends Omit<RawExtraction, 'uncertainFields'> {
  tempId: string
  selected: boolean
  status: 'new' | 'update' | 'duplicate'
  sourceFile: string
  suggestedEngine: string
  uncertainFields: string[]
}

// ─── Engine classification ────────────────────────────────────────────────────

const ENGINE_FROM_TYPE: Record<string, string> = {
  'Medical Necessity':  'Appeal',
  'DRG Downgrade':      'Appeal',
  'Authorization':      'Appeal',
  'ADR':                'Records Request',
  'Coding Error':       'Corrected Claim',
  'Administrative':     'Corrected Claim',
  'Timely Filing':      'Filing Defense',
  'Recoupment':         'Recoupment',
  'Eligibility':        'Eligibility',
  'Underpayment':       'Payment Dispute',
}

// Some source types determine the engine regardless of denial type
const ENGINE_FROM_SOURCE: Partial<Record<SourceType, string>> = {
  'adr':               'Records Request',
  'appeal-upheld':     'Appeal',
  'appeal-overturned': 'Appeal',
}

const ALL_ENGINES = ['Appeal', 'Corrected Claim', 'Records Request', 'Filing Defense', 'Recoupment', 'Eligibility']

function classifyEngine(sourceType: SourceType, denialType: string, uncertainDenialType: boolean): string {
  if (ENGINE_FROM_SOURCE[sourceType]) return ENGINE_FROM_SOURCE[sourceType]!
  if (uncertainDenialType) return '?'
  return ENGINE_FROM_TYPE[denialType] ?? '?'
}

// ─── Mock extraction data ─────────────────────────────────────────────────────

const TODAY = '2026-04-03'
function addDays(date: string, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

const FILE_EXTRACTIONS: Record<string, RawExtraction[]> = {

  // 835 remit — BCBS Margaret Holloway: DRG downgrade, partial payment update
  '835_BCBS_MargaretHolloway_adjusted.edi': [{
    sourceType: 'edi-835',
    patientName: 'Margaret Holloway', mrn: 'MRN-104823',
    claimId: 'CLM-8847291', har: 'HAR-774112',
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 2105.00, paidAmount: 2105.00, adjustmentAmount: 2105.00,
    dos: '2026-02-14', deadline: addDays(TODAY, 4),
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0412',
      label: 'Partial Payment Received',
      suggestedState: 'Resolved',
      suggestedStatus: 'Overturned — Partial Payment',
      updates: { deniedAmount: 2105.00 },
      diffs: [
        { field: 'deniedAmount', label: 'Denied Amount',    from: '$4,210.00', to: '$2,105.00 (partial)' },
        { field: 'status',       label: 'Suggested Status', from: 'Appeal Drafting', to: 'Overturned — Partial Payment' },
        { field: 'state',        label: 'Suggested State',  from: 'Active', to: 'Resolved' },
      ],
    },
  }],

  // 835 remit — UHC Dorothy Simmonds: medical necessity denial, new record
  '835_UHC_DorothySimmonds.edi': [{
    sourceType: 'edi-835',
    patientName: 'Dorothy Simmonds', mrn: 'MRN-8821',
    claimId: 'CLM-NEW-5001', har: 'HAR-NEW-5001',
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity', denialSubtype: 'Inpatient Stay — COPD Exacerbation',
    carc: 'CARC-50', rarc: 'N386',
    deniedAmount: 8920.00, paidAmount: 0, adjustmentAmount: 8920.00,
    dos: '2026-03-15', deadline: addDays(TODAY, 26),
    uncertainFields: [],
  }],

  // Med nec denial letter — Cigna Daniel Forsythe: lumbar fusion
  // Extracted: clinical criteria, reviewing physician, level of care
  // Not extracted with confidence: CARC, HAR, exact denied amount
  'DenialLetter_Cigna_RafaelTorres.pdf': [{
    sourceType: 'med-nec-denial',
    patientName: 'Daniel Forsythe', mrn: 'MRN-9034',
    claimId: 'CLM-NEW-5002', har: '',
    payer: 'Cigna',
    denialType: 'Medical Necessity', denialSubtype: 'Lumbar Spinal Fusion — L4-L5',
    carc: '', rarc: '', deniedAmount: 0,
    clinicalCriteria: 'MCG Surgical Criteria — Lumbar Fusion (A-0581)',
    reviewingPhysician: 'Dr. Patricia Wells, MD — Cigna Clinical Review',
    levelOfCare: 'Surgical procedure — medical necessity questioned per policy',
    dos: '2026-03-22', deadline: addDays(TODAY, 33),
    uncertainFields: ['carc', 'har', 'deniedAmount'],
  }],

  // ADR letter — Palmetto Vivienne Okafor: prepayment review, total hip
  // No claim adjudication yet — no CARC, RARC, or denied amount
  'ADR_Palmetto_VivienneOkafor.pdf': [{
    sourceType: 'adr',
    patientName: 'Vivienne Okafor', mrn: 'MRN-7712',
    claimId: 'CLM-NEW-5003', har: '',
    payer: 'Palmetto GBA (Medicare)',
    denialType: 'ADR', denialSubtype: 'Prepayment Review — Total Hip Arthroplasty (MS-DRG 470)',
    dos: '2026-03-18', deadline: addDays(TODAY, 36),
    recordsRequested: 'H&P, operative note, discharge summary, pre-op conservative treatment documentation (6 months)',
    submissionDeadline: addDays(TODAY, 36),
    uncertainFields: ['har', 'claimId'],
  }],

  // Auth denial letter — Cigna Daniel Forsythe: cardiac cath, no prior auth
  // Extracted: auth required for service, no auth number on file
  // Not extracted: exact denied amount, HAR
  'AuthDenial_Cigna_MarcusWebb.pdf': [{
    sourceType: 'auth-denial',
    patientName: 'Daniel Forsythe', mrn: 'MRN-6643',
    claimId: 'CLM-NEW-5004', har: '',
    payer: 'Cigna',
    denialType: 'Authorization', denialSubtype: 'No Prior Authorization — Cardiac Catheterization',
    carc: 'CARC-15', rarc: 'N30', deniedAmount: 0,
    authNumber: '',
    serviceRequiringAuth: 'Diagnostic Cardiac Catheterization (CPT 93458)',
    dos: '2026-03-28', deadline: addDays(TODAY, 45),
    uncertainFields: ['deniedAmount', 'har', 'authNumber'],
  }],

  // Appeal overturned letter — BCBS Margaret Holloway: full payment authorized
  'AppealOverturned_BCBS_MargaretHolloway.pdf': [{
    sourceType: 'appeal-overturned',
    patientName: 'Margaret Holloway', mrn: 'MRN-104823',
    claimId: 'CLM-8847291', har: 'HAR-774112',
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 291 → 292',
    dos: '2026-02-14', deadline: addDays(TODAY, 4),
    approvedAmount: 4210.00,
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0412',
      label: 'Appeal Overturned — Full Payment',
      suggestedState: 'Resolved',
      suggestedStatus: 'Overturned — Full Payment',
      updates: {},
      diffs: [
        { field: 'status', label: 'Suggested Status', from: 'Appeal Drafting',   to: 'Overturned — Full Payment' },
        { field: 'state',  label: 'Suggested State',  from: 'Active',            to: 'Resolved' },
        { field: 'amount', label: 'Approved Amount',  from: '—',                 to: '$4,210.00 (full payment authorized)' },
      ],
    },
  }],

  'EOB_UHC_HaroldSimmons_CLM9921847.pdf': [{
    sourceType: 'underpayment' as const,
    patientName: 'Harold Simmons',
    mrn: 'MRN-109432',
    claimId: 'CLM-9921847',
    payer: 'UnitedHealthcare',
    denialType: 'Underpayment',
    denialSubtype: 'Contracted Rate Dispute',
    dos: '2026-02-18',
    deadline: '2026-04-28',
    uncertainFields: [],
    paidAmount: 8430,
    adjustmentAmount: 4820,
  }],
}

const TYPE_EXTRACTIONS: Record<string, RawExtraction[]> = {
  edi: [
    {
      sourceType: 'edi-835',
      patientName: 'Harold Nguyen', mrn: 'MRN-558821',
      claimId: 'CLM-9901234', har: 'HAR-882001',
      payer: 'Aetna', denialType: 'Medical Necessity', denialSubtype: 'Inpatient Level of Care',
      carc: 'CARC-50', rarc: 'N386',
      deniedAmount: 7340.00, paidAmount: 0, adjustmentAmount: 7340.00,
      dos: '2026-03-10', deadline: addDays(TODAY, 52), uncertainFields: [],
    },
    {
      sourceType: 'edi-835',
      patientName: 'Lucinda Park', mrn: 'MRN-441902',
      claimId: 'CLM-9901235', har: 'HAR-882002',
      payer: 'Aetna', denialType: 'Authorization', denialSubtype: 'No Prior Authorization',
      carc: 'CARC-15', rarc: 'N30',
      deniedAmount: 3120.00, paidAmount: 0, adjustmentAmount: 3120.00,
      dos: '2026-03-11', deadline: addDays(TODAY, 38), uncertainFields: [],
    },
  ],
  pdf: [
    {
      sourceType: 'med-nec-denial',
      patientName: 'Constance Adler', mrn: 'MRN-609344',
      claimId: 'CLM-7723901', har: 'HAR-991100',
      payer: 'Blue Cross Blue Shield', denialType: 'Medical Necessity', denialSubtype: 'Observation vs Inpatient',
      carc: 'CARC-50', rarc: 'N115', deniedAmount: 5680.00,
      clinicalCriteria: 'MCG Inpatient Admission Criteria',
      reviewingPhysician: 'Dr. R. Hoffman, MD',
      levelOfCare: 'Inpatient admission questioned — Observation suggested',
      dos: '2026-03-18', deadline: addDays(TODAY, 60), uncertainFields: ['har'],
    },
  ],
  csv: [
    {
      sourceType: 'edi-835',
      patientName: 'Yvonne Castellano', mrn: 'MRN-330281',
      claimId: 'CLM-5512001', har: 'HAR-660400',
      payer: 'UnitedHealthcare', denialType: 'Authorization', denialSubtype: 'Retro Auth Denied',
      carc: 'CARC-15', rarc: 'N30',
      deniedAmount: 9100.00, paidAmount: 0, adjustmentAmount: 9100.00,
      dos: '2026-03-05', deadline: addDays(TODAY, 30), uncertainFields: [],
    },
  ],
}

function getFileType(name: string): 'edi' | 'pdf' | 'csv' | null {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'edi' || ext === '835' || ext === 'txt') return 'edi'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'csv' || ext === 'xlsx') return 'csv'
  return null
}

let tempIdCounter = 1

// ─── Chips ────────────────────────────────────────────────────────────────────

const ENGINE_COLORS: Record<string, { bg: string; color: string }> = {
  'Appeal':          { bg: '#EBF4FF', color: '#1B3A5C' },
  'Corrected Claim': { bg: '#FFF8E6', color: '#7D5A00' },
  'Records Request': { bg: '#F0FFF4', color: '#276749' },
  'Filing Defense':  { bg: '#FFF5F5', color: '#C0392B' },
  'Recoupment':      { bg: '#F5F0FF', color: '#553C9A' },
  'Eligibility':     { bg: '#F0F4FF', color: '#2D4799' },
  '?':               { bg: '#F7F7F7', color: '#718096' },
}

function EngineChip({ engine }: { engine: string }) {
  const col = ENGINE_COLORS[engine] ?? ENGINE_COLORS['?']!
  return (
    <Chip
      label={engine === '?' ? 'Needs Classification' : engine}
      size="small"
      sx={{
        height: 18, fontSize: '0.6rem', fontWeight: 600,
        '& .MuiChip-label': { px: 0.75 },
        bgcolor: col.bg, color: col.color,
        border: engine === '?' ? '1px dashed #CBD5E0' : 'none',
      }}
    />
  )
}

function SourceChip({ sourceType }: { sourceType: SourceType }) {
  const col = SOURCE_COLORS[sourceType]
  return (
    <Chip
      label={SOURCE_LABELS[sourceType]}
      size="small"
      sx={{
        height: 16, fontSize: '0.6rem', fontWeight: 500,
        '& .MuiChip-label': { px: 0.625 },
        bgcolor: col.bg, color: col.color,
      }}
    />
  )
}

// ─── Drawer field ─────────────────────────────────────────────────────────────

function DrawerField({
  label, value, uncertain, onChange, multiline, type, readOnly,
}: {
  label: string; value: string; uncertain?: boolean
  onChange: (v: string) => void; multiline?: boolean; type?: string; readOnly?: boolean
}) {
  return (
    <Box>
      <TextField
        fullWidth size="small" label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        multiline={multiline} rows={multiline ? 2 : undefined}
        type={type}
        InputProps={{ readOnly }}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            bgcolor: uncertain ? '#fffbeb' : readOnly ? 'grey.50' : 'background.paper',
            '& fieldset': { borderColor: uncertain ? '#f59e0b' : undefined },
            '&:hover fieldset': { borderColor: uncertain ? '#d97706' : undefined },
          },
          '& .MuiInputLabel-root': { color: uncertain ? '#d97706' : undefined },
        }}
      />
      {uncertain && (
        <Typography variant="caption" sx={{ color: '#d97706', fontSize: '0.7rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <WarningAmberOutlined sx={{ fontSize: 11 }} />
          Could not extract confidently — please verify
        </Typography>
      )}
    </Box>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.07em', display: 'block', mb: 1.25 }}>
      {children}
    </Typography>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

// ─── Review drawer ────────────────────────────────────────────────────────────

function RecordDrawer({
  record, open, onClose, onUpdate, onApplyUpdate, onViewRaw, hasRaw,
}: {
  record: StagedRecord | null; open: boolean; onClose: () => void
  onUpdate: <K extends keyof StagedRecord>(key: K, value: StagedRecord[K]) => void
  onApplyUpdate: (proposal: UpdateProposal, updates: Partial<DenialRecord>) => void
  onViewRaw: () => void
  hasRaw: boolean
}) {
  if (!record) return null
  const u = record.uncertainFields
  const isUpdate = record.status === 'update'
  const isDupe = record.status === 'duplicate'
  const st = record.sourceType
  const isAppealResponse = st === 'appeal-upheld' || st === 'appeal-overturned'
  const isAdr = st === 'adr'
  const is835 = st === 'edi-835'

  return (
    <Drawer
      anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: 440, display: 'flex', flexDirection: 'column' } } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
            {record.patientName || 'Unknown Patient'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{record.mrn}</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={isDupe ? 'Duplicate' : isUpdate ? 'Update' : 'New'}
              size="small"
              sx={{
                height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 },
                bgcolor: isDupe ? 'grey.200' : isUpdate ? '#fef3c7' : '#e6f4ea',
                color:   isDupe ? 'text.secondary' : isUpdate ? '#92400e' : '#276749',
              }}
            />
            <SourceChip sourceType={st} />
            <EngineChip engine={record.suggestedEngine} />
            {u.length > 0 && (
              <Chip
                icon={<WarningAmberOutlined sx={{ fontSize: 11, ml: '4px !important' }} />}
                label={`${u.length} field${u.length !== 1 ? 's' : ''} need review`}
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.5 }, bgcolor: '#fffbeb', color: '#92400e' }}
              />
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: 0.25, color: 'text.secondary' }}>
          <CloseOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Scrollable body */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Update diff ──────────────────────────────────────────────────── */}
        {isUpdate && record.updateProposal && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <UpdateOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', color: 'warning.dark' }}>
                Proposed Update — {record.updateProposal.label}
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Field', 'Current', 'Incoming'].map(h => (
                      <TableCell key={h} sx={{ py: 0.75, fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.updateProposal.diffs.map(diff => (
                    <TableRow key={diff.field} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>{diff.label}</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary', textDecoration: 'line-through' }}>{diff.from}</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', fontWeight: 600, color: 'success.dark' }}>{diff.to}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Chip
              icon={<AutoFixHighOutlined sx={{ fontSize: 13, ml: '4px !important' }} />}
              label={`Suggested: ${record.updateProposal.suggestedState} / ${record.updateProposal.suggestedStatus}`}
              size="small"
              sx={{ bgcolor: '#fffbeb', color: '#92400e', fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
        )}

        {/* ── Patient & Claim ──────────────────────────────────────────────── */}
        <Box>
          <SectionHeading>Patient & Claim</SectionHeading>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <DrawerField label="Patient Name" value={record.patientName} onChange={v => onUpdate('patientName', v)} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <DrawerField label="MRN" value={record.mrn} onChange={v => onUpdate('mrn', v)} />
              <DrawerField label="Claim ID" value={record.claimId} onChange={v => onUpdate('claimId', v)} />
            </Box>
            {!isAppealResponse && (
              <DrawerField label="HAR" value={record.har ?? ''} uncertain={u.includes('har')} onChange={v => onUpdate('har', v)} />
            )}
          </Box>
        </Box>

        <Divider />

        {/* ── 835: Financial breakdown ─────────────────────────────────────── */}
        {is835 && (
          <Box>
            <SectionHeading>Remittance Detail</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Denied ($)" value={String(record.deniedAmount ?? 0)} uncertain={u.includes('deniedAmount')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('deniedAmount', n) }} />
                <DrawerField label="Paid ($)" value={String(record.paidAmount ?? 0)} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('paidAmount', n) }} />
                <DrawerField label="Adjustment ($)" value={String(record.adjustmentAmount ?? 0)} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('adjustmentAmount', n) }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="CARC" value={record.carc ?? ''} uncertain={u.includes('carc')} onChange={v => onUpdate('carc', v)} />
                <DrawerField label="RARC" value={record.rarc ?? ''} uncertain={u.includes('rarc')} onChange={v => onUpdate('rarc', v)} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
                <DrawerField label="Deadline" value={record.deadline} type="date" onChange={v => onUpdate('deadline', v)} />
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Payer & Denial — denial letter types ─────────────────────────── */}
        {!is835 && !isAppealResponse && (
          <Box>
            <SectionHeading>Payer & Denial</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Payer" value={record.payer} onChange={v => onUpdate('payer', v)} />
              {!isAdr && (
                <>
                  <DrawerField label="Denial Type" value={record.denialType} onChange={v => {
                    onUpdate('denialType', v)
                    onUpdate('suggestedEngine', ENGINE_FROM_TYPE[v] ?? '?')
                  }} />
                  <DrawerField label="Denial Subtype / Description" value={record.denialSubtype} multiline onChange={v => onUpdate('denialSubtype', v)} />
                </>
              )}
              {isAdr && (
                <DrawerField label="Review Subtype" value={record.denialSubtype} multiline onChange={v => onUpdate('denialSubtype', v)} />
              )}
            </Box>
          </Box>
        )}

        {/* ── Payer — appeal responses ─────────────────────────────────────── */}
        {isAppealResponse && (
          <Box>
            <SectionHeading>Payer</SectionHeading>
            <DrawerField label="Payer" value={record.payer} onChange={v => onUpdate('payer', v)} />
          </Box>
        )}

        <Divider />

        {/* ── Med nec: clinical review ─────────────────────────────────────── */}
        {st === 'med-nec-denial' && (
          <Box>
            <SectionHeading>Clinical Review</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Clinical Criteria Referenced" value={record.clinicalCriteria ?? ''} uncertain={u.includes('clinicalCriteria')} onChange={v => onUpdate('clinicalCriteria', v)} />
              <DrawerField label="Reviewing Physician" value={record.reviewingPhysician ?? ''} uncertain={u.includes('reviewingPhysician')} onChange={v => onUpdate('reviewingPhysician', v)} />
              <DrawerField label="Level of Care Issue" value={record.levelOfCare ?? ''} uncertain={u.includes('levelOfCare')} multiline onChange={v => onUpdate('levelOfCare', v)} />
            </Box>
          </Box>
        )}

        {/* ── Auth: authorization detail ───────────────────────────────────── */}
        {st === 'auth-denial' && (
          <Box>
            <SectionHeading>Authorization</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Auth Number on File" value={record.authNumber ?? ''} uncertain={u.includes('authNumber')} onChange={v => onUpdate('authNumber', v)} />
              <DrawerField label="Service Requiring Auth" value={record.serviceRequiringAuth ?? ''} uncertain={u.includes('serviceRequiringAuth')} multiline onChange={v => onUpdate('serviceRequiringAuth', v)} />
            </Box>
          </Box>
        )}

        {/* ── DRG: comparison ─────────────────────────────────────────────── */}
        {st === 'drg-downgrade' && (
          <Box>
            <SectionHeading>DRG Comparison</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Original DRG" value={record.originalDrg ?? ''} uncertain={u.includes('originalDrg')} onChange={v => onUpdate('originalDrg', v)} />
                <DrawerField label="Adjusted DRG" value={record.adjustedDrg ?? ''} uncertain={u.includes('adjustedDrg')} onChange={v => onUpdate('adjustedDrg', v)} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Original Payment ($)" value={String(record.originalPayment ?? 0)} uncertain={u.includes('originalPayment')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('originalPayment', n) }} />
                <DrawerField label="Adjusted Payment ($)" value={String(record.adjustedPayment ?? 0)} uncertain={u.includes('adjustedPayment')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('adjustedPayment', n) }} />
              </Box>
            </Box>
          </Box>
        )}

        {/* ── ADR: records request ─────────────────────────────────────────── */}
        {isAdr && (
          <Box>
            <SectionHeading>Records Request</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Records Requested" value={record.recordsRequested ?? ''} uncertain={u.includes('recordsRequested')} multiline onChange={v => onUpdate('recordsRequested', v)} />
              <DrawerField label="Submission Deadline" value={record.submissionDeadline ?? ''} type="date" onChange={v => onUpdate('submissionDeadline', v)} />
              <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
            </Box>
          </Box>
        )}

        {/* ── Appeal overturned: decision detail ──────────────────────────── */}
        {st === 'appeal-overturned' && (
          <Box>
            <SectionHeading>Appeal Decision</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#ECFDF5', borderColor: '#6EE7B7' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#065F46' }}>Appeal Overturned</Typography>
                <Typography variant="caption" color="text.secondary">Payment authorized. Apply update to mark as Resolved.</Typography>
              </Paper>
              <DrawerField label="Approved Amount ($)" value={String(record.approvedAmount ?? 0)} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('approvedAmount', n) }} />
            </Box>
          </Box>
        )}

        {/* ── Appeal upheld: decision detail ──────────────────────────────── */}
        {st === 'appeal-upheld' && (
          <Box>
            <SectionHeading>Appeal Decision</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#991B1B' }}>Appeal Upheld</Typography>
                <Typography variant="caption" color="text.secondary">Original denial stands. Review further appeal rights below.</Typography>
              </Paper>
              <DrawerField label="Further Appeal Rights" value={record.furtherAppealRights ?? ''} multiline onChange={v => onUpdate('furtherAppealRights', v)} />
            </Box>
          </Box>
        )}

        {/* ── Financials — denial letter types (not 835, adr, appeal) ────────  */}
        {!is835 && !isAdr && !isAppealResponse && (
          <>
            <Divider />
            <Box>
              <SectionHeading>Financials & Dates</SectionHeading>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <DrawerField
                  label="Denied Amount ($)"
                  value={String(record.deniedAmount ?? 0)}
                  uncertain={u.includes('deniedAmount')}
                  onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('deniedAmount', n) }}
                />
                {st !== 'drg-downgrade' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <DrawerField label="CARC" value={record.carc ?? ''} uncertain={u.includes('carc')} onChange={v => onUpdate('carc', v)} />
                    <DrawerField label="RARC" value={record.rarc ?? ''} uncertain={u.includes('rarc')} onChange={v => onUpdate('rarc', v)} />
                  </Box>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
                  <DrawerField label="Deadline" value={record.deadline} type="date" onChange={v => onUpdate('deadline', v)} />
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* ── Classification — not for adr/appeal (engine is predetermined) ── */}
        {!isAdr && !isAppealResponse && (
          <>
            <Divider />
            <Box>
              <SectionHeading>Classification</SectionHeading>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Resolution Engine</InputLabel>
                <Select
                  value={record.suggestedEngine === '?' ? '' : record.suggestedEngine}
                  label="Resolution Engine"
                  onChange={e => onUpdate('suggestedEngine', e.target.value)}
                  displayEmpty
                  sx={{ fontSize: '0.875rem', bgcolor: record.suggestedEngine === '?' ? '#fffbeb' : 'background.paper' }}
                >
                  {ALL_ENGINES.map(e => (
                    <MenuItem key={e} value={e} sx={{ fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EngineChip engine={e} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {record.suggestedEngine === '?' && (
                  <Typography variant="caption" sx={{ color: '#d97706', fontSize: '0.7rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <WarningAmberOutlined sx={{ fontSize: 11 }} />
                    Select the appropriate engine before importing
                  </Typography>
                )}
              </FormControl>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            Source: {record.sourceFile}
          </Typography>
          {hasRaw && (
            <Button
              size="small" variant="text" startIcon={<CodeOutlined sx={{ fontSize: 14 }} />}
              onClick={onViewRaw}
              sx={{ fontSize: '0.7rem', color: 'text.secondary', py: 0.25, minWidth: 0 }}
            >
              View raw
            </Button>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        {isUpdate && record.updateProposal ? (
          <>
            <Button fullWidth variant="outlined" onClick={onClose} sx={{ color: 'text.secondary', borderColor: 'divider' }}>Ignore</Button>
            <Button
              fullWidth variant="contained" disableElevation color="warning"
              onClick={() => {
                onApplyUpdate(record.updateProposal!, {
                  state: record.updateProposal!.suggestedState,
                  status: record.updateProposal!.suggestedStatus,
                  ...record.updateProposal!.updates,
                })
                onClose()
              }}
            >
              Apply Update
            </Button>
          </>
        ) : (
          <Button fullWidth variant="outlined" onClick={onClose}>Done</Button>
        )}
      </Box>
    </Drawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IngestPageProps {
  denials: DenialRecord[]
  onCommit: (newRecords: DenialRecord[]) => void
  onUpdate: (denialId: string, updates: Partial<DenialRecord>) => void
}

export default function IngestPage({ denials, onCommit, onUpdate }: IngestPageProps) {
  const [processing, setProcessing] = useState<string[]>([])
  const [staged, setStaged] = useState<StagedRecord[]>([])
  const [committed, setCommitted] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [rawFiles, setRawFiles] = useState<Record<string, string>>({})
  const [rawViewFile, setRawViewFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingDenialByClaimId = Object.fromEntries(denials.map(d => [d.claim.claimId, d]))

  function processFile(file: File) {
    const fileType = getFileType(file.name)
    if (!fileType) return

    setProcessing(prev => [...prev, file.name])
    setCommitted(null)

    // Read raw content for the "view raw" feature
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRawFiles(prev => ({ ...prev, [file.name]: text }))
    }
    reader.readAsText(file)

    setTimeout(() => {
      const rawList: RawExtraction[] = FILE_EXTRACTIONS[file.name] ?? TYPE_EXTRACTIONS[fileType] ?? []

      const newStaged: StagedRecord[] = rawList.map(r => {
        const uncertain = r.uncertainFields ?? []
        const existing = existingDenialByClaimId[r.claimId]
        const status: StagedRecord['status'] = existing
          ? (r.updateProposal ? 'update' : 'duplicate')
          : 'new'

        return {
          ...r,
          tempId: `tmp-${tempIdCounter++}`,
          selected: status === 'new',
          status,
          sourceFile: file.name,
          uncertainFields: uncertain,
          suggestedEngine: classifyEngine(r.sourceType, r.denialType, uncertain.includes('denialType')),
        }
      })

      setProcessing(prev => prev.filter(n => n !== file.name))
      setStaged(prev => {
        const alreadyStaged = prev.some(r => r.sourceFile === file.name)
        return alreadyStaged ? prev : [...prev, ...newStaged]
      })
    }, 1400)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(processFile)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [denials])

  function updateField<K extends keyof StagedRecord>(tempId: string, key: K, value: StagedRecord[K]) {
    setStaged(prev => prev.map(r => {
      if (r.tempId !== tempId) return r
      const updated = { ...r, [key]: value }
      if (typeof key === 'string' && updated.uncertainFields.includes(key) && value) {
        updated.uncertainFields = updated.uncertainFields.filter(f => f !== key)
      }
      return updated
    }))
  }

  function toggleSelect(tempId: string) {
    setStaged(prev => prev.map(r => r.tempId === tempId ? { ...r, selected: !r.selected } : r))
  }

  function removeRow(tempId: string) {
    setStaged(prev => prev.filter(r => r.tempId !== tempId))
    if (drawerId === tempId) setDrawerId(null)
  }

  function handleApplyUpdate(proposal: UpdateProposal, updates: Partial<DenialRecord>) {
    onUpdate(proposal.existingDenialId, updates)
    setStaged(prev => prev.filter(r => r.updateProposal?.existingDenialId !== proposal.existingDenialId))
  }

  const newRows     = staged.filter(r => r.status === 'new')
  const updateRows  = staged.filter(r => r.status === 'update')
  const dupeRows    = staged.filter(r => r.status === 'duplicate')
  const selectedNew = staged.filter(r => r.selected && r.status === 'new')
  const allNewSelected  = newRows.length > 0 && newRows.every(r => r.selected)
  const someNewSelected = newRows.some(r => r.selected) && !allNewSelected
  const hasUncertain    = staged.some(r => r.uncertainFields.length > 0 && r.status !== 'duplicate')

  function toggleAllNew() {
    const next = !allNewSelected
    setStaged(prev => prev.map(r => r.status === 'new' ? { ...r, selected: next } : r))
  }

  function handleCommit() {
    const toCommit = staged.filter(r => r.selected && r.status === 'new')
    const newDenials: DenialRecord[] = toCommit.map((r, i) => ({
      id: `DN-2026-${String(1500 + i).padStart(4, '0')}`,
      patient: { name: r.patientName, mrn: r.mrn },
      claim: { claimId: r.claimId, har: r.har ?? '' },
      payer: r.payer,
      denialType: r.denialType,
      denialSubtype: r.denialSubtype,
      carc: r.carc ?? '',
      rarc: r.rarc || undefined,
      deniedAmount: r.deniedAmount ?? 0,
      deadline: r.deadline || r.submissionDeadline || addDays(TODAY, 30),
      createdAt: TODAY,
      dos: r.dos,
      state: 'Intake' as const,
      status: 'Unreviewed' as const,
      assignedTo: null,
      nextAction: '',
      needsAttention: false,
      needsAttentionReasons: [],
      notes: '',
    }))

    onCommit(newDenials)
    setCommitted(newDenials.length)
    setStaged(prev => prev.filter(r => !(r.selected && r.status === 'new')))
    setDrawerId(null)
  }

  const drawerRecord = staged.find(r => r.tempId === drawerId) ?? null

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Drop zone ──────────────────────────────────────────────────────── */}
      <Paper
        variant="outlined"
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 4, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
          borderStyle: 'dashed', borderWidth: 2,
          borderColor: dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? 'rgba(27,58,92,0.04)' : 'background.paper',
          transition: 'all 0.15s',
          '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(27,58,92,0.02)' },
        }}
      >
        <input
          ref={fileInputRef} type="file" multiple
          accept=".edi,.835,.pdf,.csv,.xlsx,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <UploadFileOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>Drop files here or click to browse</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Accepts 835 EDI remits, PDF denial letters, ADR letters, appeal responses, and CSV exports
        </Typography>
      </Paper>

      {processing.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LinearProgress sx={{ flex: 1, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Parsing {processing.length} file{processing.length !== 1 ? 's' : ''}…
          </Typography>
        </Box>
      )}

      {/* ── Banners ────────────────────────────────────────────────────────── */}
      {committed !== null && (
        <Alert severity="success" onClose={() => setCommitted(null)} sx={{ borderRadius: 1.5 }}>
          {committed} denial{committed !== 1 ? 's' : ''} added to the worklist in <strong>Intake</strong> state.
        </Alert>
      )}
      {hasUncertain && (
        <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ borderRadius: 1.5 }}>
          Some records have fields that could not be confidently extracted. Click a row to open and review.
        </Alert>
      )}

      {/* ── Staging table ──────────────────────────────────────────────────── */}
      {staged.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Staging
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                Click any row to review and edit. Select new records to import.
              </Typography>
            </Box>
            <Button
              variant="contained" disableElevation
              disabled={selectedNew.length === 0}
              onClick={handleCommit}
              sx={{ fontWeight: 600 }}
            >
              Import {selectedNew.length > 0 ? `${selectedNew.length} ` : ''}New
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox" sx={{ width: 44, pl: 1.5 }}>
                      <Checkbox size="small" indeterminate={someNewSelected} checked={allNewSelected} onChange={toggleAllNew} />
                    </TableCell>
                    {['Status', 'Patient', 'Payer', 'Document Type', 'Amount', 'Engine', ''].map(h => (
                      <TableCell key={h} sx={{ py: 1 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em' }}>{h}</Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staged.map(row => {
                    const isDupe   = row.status === 'duplicate'
                    const isUpdate = row.status === 'update'
                    const hasFlags = row.uncertainFields.length > 0
                    const isAppeal = row.sourceType === 'appeal-upheld' || row.sourceType === 'appeal-overturned'

                    // Amount display: 835 shows denied, appeal-overturned shows approved, adr shows —
                    const amountDisplay = row.sourceType === 'adr'
                      ? '— pre-payment'
                      : row.sourceType === 'appeal-overturned' && row.approvedAmount
                        ? fmt(row.approvedAmount)
                        : row.sourceType === 'appeal-upheld'
                          ? '—'
                          : row.deniedAmount !== undefined
                            ? fmt(row.deniedAmount)
                            : '—'

                    return (
                      <TableRow
                        key={row.tempId}
                        hover
                        onClick={() => setDrawerId(row.tempId)}
                        sx={{
                          cursor: 'pointer',
                          opacity: isDupe ? 0.5 : 1,
                          bgcolor: drawerId === row.tempId ? 'rgba(27,58,92,0.04)' : isUpdate ? 'rgba(237,137,54,0.03)' : 'background.paper',
                          borderLeft: isUpdate ? '3px solid' : '3px solid transparent',
                          borderLeftColor: 'warning.main',
                          '&:last-child td': { border: 0 },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 1.5 }} onClick={e => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={row.selected}
                            disabled={isDupe || isUpdate || isAppeal}
                            onChange={() => toggleSelect(row.tempId)}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ width: 110 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={isDupe ? 'Duplicate' : isUpdate ? 'Update' : 'New'}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, width: 'fit-content',
                                bgcolor: isDupe ? 'grey.200' : isUpdate ? '#fef3c7' : '#e6f4ea',
                                color:   isDupe ? 'text.secondary' : isUpdate ? '#92400e' : '#276749',
                              }}
                            />
                            {hasFlags && !isDupe && (
                              <Tooltip title={`Uncertain: ${row.uncertainFields.join(', ')}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: 'fit-content' }}>
                                  <WarningAmberOutlined sx={{ fontSize: 11, color: 'warning.main' }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.dark' }}>Review</Typography>
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Patient */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{row.patientName}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem' }}>{row.mrn}</Typography>
                        </TableCell>

                        {/* Payer */}
                        <TableCell>
                          <Typography variant="body2">{row.payer}</Typography>
                        </TableCell>

                        {/* Document Type */}
                        <TableCell>
                          <SourceChip sourceType={row.sourceType} />
                          {row.denialType && row.denialType !== 'ADR' && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.25 }}>
                              {row.denialType}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Amount */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.sourceType === 'appeal-overturned' ? 'success.dark' : 'inherit' }}>
                            {amountDisplay}
                          </Typography>
                        </TableCell>

                        {/* Engine */}
                        <TableCell><EngineChip engine={row.suggestedEngine} /></TableCell>

                        {/* Chevron */}
                        <TableCell align="right" sx={{ pr: 1, width: 52 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={e => { e.stopPropagation(); removeRow(row.tempId) }}
                              sx={{ p: 0.25, color: 'text.disabled', opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, '&:hover': { color: 'error.main' } }}
                            >
                              <CloseOutlined sx={{ fontSize: 13 }} />
                            </IconButton>
                            <ChevronRightOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />
            <Box sx={{ px: 2, py: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{staged.length} record{staged.length !== 1 ? 's' : ''} staged</Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" sx={{ color: 'success.dark' }}>{newRows.length} new</Typography>
              {updateRows.length > 0 && <><Typography variant="caption" color="text.secondary">·</Typography><Typography variant="caption" sx={{ color: 'warning.dark' }}>{updateRows.length} update{updateRows.length !== 1 ? 's' : ''}</Typography></>}
              {dupeRows.length > 0 && <><Typography variant="caption" color="text.secondary">·</Typography><Typography variant="caption" color="text.secondary">{dupeRows.length} duplicate{dupeRows.length !== 1 ? 's' : ''}</Typography></>}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── Record drawer ──────────────────────────────────────────────────── */}
      <RecordDrawer
        record={drawerRecord}
        open={Boolean(drawerRecord)}
        onClose={() => setDrawerId(null)}
        onUpdate={(key, value) => drawerId && updateField(drawerId, key, value)}
        onApplyUpdate={handleApplyUpdate}
        hasRaw={Boolean(drawerRecord && rawFiles[drawerRecord.sourceFile])}
        onViewRaw={() => drawerRecord && setRawViewFile(drawerRecord.sourceFile)}
      />

      {/* ── Raw file viewer ────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(rawViewFile)}
        onClose={() => setRawViewFile(null)}
        maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, height: '80vh' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Raw File</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{rawViewFile}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setRawViewFile(null)}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box
            component="pre"
            sx={{
              m: 0, p: 2.5,
              fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              color: 'text.primary', bgcolor: '#FAFAFA',
              height: '100%', overflow: 'auto',
            }}
          >
            {rawViewFile ? (rawFiles[rawViewFile] ?? '(No content — file could not be read)') : ''}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
