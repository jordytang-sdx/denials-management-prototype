import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton,
  Drawer, Tooltip, Tabs, Tab, Alert, AlertTitle, Snackbar,
  Radio, RadioGroup, FormControlLabel, TextField, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, Autocomplete,
} from '@mui/material'
import {
  UploadFileOutlined, CloseOutlined, WarningAmberOutlined,
  CheckCircleOutlined, ExpandMoreOutlined, ExpandLessOutlined,
  ContentCopyOutlined, DoneOutlined,
  ArrowBackOutlined, ArrowForwardOutlined, OpenInNewOutlined,
} from '@mui/icons-material'
import {
  SEED_STAGING, type StagingRecord, type StagingStatus,
  type StagingModule, type StagingSignalType, type NeedsReviewReason,
} from '../data/staging'
import { type FeatureFlags } from '../data/featureFlags'

// ── Props ─────────────────────────────────────────────────────────────────────

interface IngestPageProps {
  features: FeatureFlags
  onNavigate: (nav: string) => void
  mode?: 'existing'
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MOD_COLOR: Record<StagingModule, { main: string; light: string; badge: string }> = {
  denial:       { main: '#b86823', light: '#fef3ea', badge: 'D' },
  underpayment: { main: '#157d9d', light: '#e8f2f5', badge: 'U' },
  audit:        { main: '#2776a1', light: '#ebf5fb', badge: 'A' },
  unknown:      { main: '#636a6f', light: '#f1f4f6', badge: '?' },
}

const MODULE_TAG: Record<StagingModule, { label: string; bg: string; color: string }> = {
  denial:       { label: 'Denial',   bg: '#fef3ea', color: '#b86823' },
  underpayment: { label: 'Underpay', bg: '#e8f2f5', color: '#157d9d' },
  audit:        { label: 'Audit',    bg: '#ebf5fb', color: '#2776a1' },
  unknown:      { label: '—',        bg: '#f1f4f6', color: '#636a6f' },
}

const STATUS_CHIP: Record<StagingStatus, { label: string; bg: string; color: string }> = {
  processing:     { label: 'Processing',     bg: '#e8f2f5', color: '#157d9d' },
  auto_processed: { label: 'Auto-processed', bg: '#eaf6f4', color: '#227a6c' },
  needs_review:   { label: 'Needs Review',   bg: '#fef3ea', color: '#b86823' },
  resolved:       { label: 'Resolved',       bg: '#eaf6f4', color: '#227a6c' },
  dismissed:      { label: 'Dismissed',      bg: '#f1f4f6', color: '#939a9f' },
  expired:        { label: 'Expired',        bg: '#fbedee', color: '#9f383e' },
}

const SIGNAL_LABELS: Record<StagingSignalType, string> = {
  '835':              '835 Remit',
  'pdf-denial':       'PDF Denial',
  'pdf-adr':          'PDF ADR',
  'pdf-audit-notice': 'Audit Notice',
  'spreadsheet':      'Spreadsheet',
  'manual':           'Manual',
  'portal':           'Portal',
}

const ATTENTION_LABELS: Record<NeedsReviewReason, string> = {
  missing_fields:           'Missing required fields',
  low_confidence:           'Low confidence extraction',
  no_patient_match:         'Patient not matched',
  no_claim_match:           'Claim not found',
  ambiguous_classification: 'Ambiguous classification',
  possible_duplicate:       'Related instance',
  existing_instance_found:  'Related instance',
}

const REASON_TAGS: Record<NeedsReviewReason, string> = {
  missing_fields:           'Missing fields',
  low_confidence:           'Low confidence',
  no_patient_match:         'No patient match',
  no_claim_match:           'No claim found',
  ambiguous_classification: 'Needs classification',
  possible_duplicate:       'Related instance',
  existing_instance_found:  'Related instance',
}

const REVIEW_CATEGORY: Record<NeedsReviewReason, string> = {
  missing_fields:           'Data needs review',
  low_confidence:           'Data needs review',
  no_patient_match:         'Data needs review',
  no_claim_match:           'Data needs review',
  ambiguous_classification: 'Classification needs review',
  possible_duplicate:       'Related instance',
  existing_instance_found:  'Related instance',
}

const REVIEW_SECONDARY: Record<NeedsReviewReason, string> = {
  missing_fields:           'Missing required fields',
  low_confidence:           'Low confidence fields',
  no_patient_match:         'No patient match',
  no_claim_match:           'No claim match',
  ambiguous_classification: 'Denial category unclear',
  possible_duplicate:       'Possible existing denial',
  existing_instance_found:  'Possible existing denial',
}

const REVIEW_CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'Data needs review':           { bg: '#FEF3C7', color: '#92400E' },
  'Classification needs review': { bg: '#EEF2FF', color: '#4338CA' },
  'Related instance':            { bg: '#F0F9FF', color: '#0369A1' },
  'Missing Data':                { bg: '#F1F5F9', color: '#475569' },
}

const EXISTING_REVIEW_CATEGORY: Partial<Record<NeedsReviewReason, string>> = {
  missing_fields: 'Missing Data',
}

const EXISTING_REVIEW_SECONDARY: Partial<Record<NeedsReviewReason, string>> = {
  low_confidence:   'Identification failed',
  no_patient_match: 'Identification failed',
  no_claim_match:   'Missing ICD-10 codes',
  missing_fields:   'Visit not available',
}

const SECTION_TITLE: Record<NeedsReviewReason, string> = {
  missing_fields:           'Missing fields',
  low_confidence:           'Low confidence extraction',
  no_patient_match:         'Patient match',
  no_claim_match:           'Claim match',
  ambiguous_classification: 'Classification',
  possible_duplicate:       'Related instance',
  existing_instance_found:  'Related instance',
}

const MODULE_WORKLIST: Record<StagingModule, string> = {
  denial:       'Denials',
  underpayment: 'Underpayments',
  audit:        'Audits',
  unknown:      'Worklist',
}

function denialTypeFromClassified(classifiedAs: string | null): string {
  if (!classifiedAs) return 'Other'
  if (classifiedAs.includes('DRG')) return 'DRG Downgrade'
  if (classifiedAs.includes('Medical Necessity')) return 'Medical Necessity'
  return 'Other'
}

function existingTypeChip(classifiedAs: string | null): { label: string; color: string; isUnknown: boolean } {
  if (!classifiedAs) return { label: '–', color: '#939a9f', isUnknown: true }
  return { label: denialTypeFromClassified(classifiedAs), color: '#b86823', isUnknown: false }
}

const EXISTING_DENIAL_TYPES = [
  { module: 'drg_downgrade',      label: 'DRG Downgrade',      explanation: 'Payer adjusted the DRG code or severity of illness level' },
  { module: 'medical_necessity',  label: 'Medical Necessity',   explanation: 'Payer denied the service as not medically necessary' },
  { module: 'other',              label: 'Other',               explanation: 'Another denial type not listed above' },
]

const DISMISS_REASONS = [
  'Patient responsibility — not actionable',
  'Below work threshold',
  'Already worked in another system',
  'Duplicate — already in staging',
  'Test / demo file',
  'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date('2026-04-03T08:30:00')
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatPatientName(name: string | null | undefined): string {
  if (!name) return 'Unknown patient'
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
}

function getDeadline(record: StagingRecord): Date | null {
  const d = record.extraction.deadline ?? record.extraction.recordsDeadline
  if (typeof d === 'string') return new Date(d)
  return null
}

function generateInstanceId(record: StagingRecord): string {
  const seq = parseInt(record.id.replace(/\D/g, ''), 10) || 0
  switch (record.module) {
    case 'denial':       return `D-${1109 + seq}`
    case 'underpayment': return `UP-${String(93 + seq).padStart(4, '0')}`
    case 'audit':        return `AUD-${String(42 + seq).padStart(4, '0')}`
    default:             return `X-${1000 + seq}`
  }
}

function sortByUrgency(records: StagingRecord[]): StagingRecord[] {
  return [...records].sort((a, b) => {
    const da = getDeadline(a)
    const db = getDeadline(b)
    if (da && db) return da.getTime() - db.getTime()
    if (da) return -1
    if (db) return 1
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  })
}

function formatRelative(iso: string) {
  const d = new Date(iso)
  const now = new Date('2026-04-03T08:30:00')
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

const FACTOR_STATUS_STYLE = {
  match:    { label: 'Match',         bg: '#F0FDF4', color: '#166534' },
  partial:  { label: 'Partial match', bg: '#FFFBEB', color: '#92400E' },
  mismatch: { label: 'Mismatch',      bg: '#FEF2F2', color: '#991B1B' },
  unknown:  { label: 'Unknown',       bg: '#F1F5F9', color: '#64748B' },
}

function MatchFactorRow({ label, status }: { label: string; status: keyof typeof FACTOR_STATUS_STYLE }) {
  const s = FACTOR_STATUS_STYLE[status] ?? FACTOR_STATUS_STYLE.unknown
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: '0.75rem' }}>{label}</Typography>
      <Chip label={s.label} size="small" sx={{ height: 16, fontSize: '0.625rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: s.bg, color: s.color }} />
    </Box>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ModuleBadge({ module }: { module: StagingModule }) {
  const c = MOD_COLOR[module]
  return (
    <Box sx={{
      width: 22, height: 22, borderRadius: 0.75, display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: c.light, color: c.main,
      fontSize: '0.625rem', fontWeight: 800, flexShrink: 0,
    }}>
      {c.badge}
    </Box>
  )
}

function StatusChip({ status }: { status: StagingStatus }) {
  const cfg = STATUS_CHIP[status]
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        height: 20, fontSize: '0.6875rem', fontWeight: 600,
        bgcolor: cfg.bg, color: cfg.color,
        '& .MuiChip-label': { px: 1 },
        ...(status === 'processing' ? { animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } } : {}),
      }}
    />
  )
}

function MrnCopy({ mrn }: { mrn: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(mrn).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, '&:hover .mrn-copy-icon': { opacity: 1 } }}>
      <Typography sx={{ fontSize: '0.6875rem', fontFamily: '"Roboto Mono", "Courier New", monospace', color: '#475569', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
        {mrn}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : 'Copy MRN'} placement="top">
        <IconButton
          className="mrn-copy-icon"
          size="small"
          aria-label={`Copy MRN ${mrn}`}
          onClick={handleCopy}
          sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: copied ? '#16A34A' : 'text.disabled', '&:focus-visible': { opacity: 1 } }}
        >
          {copied
            ? <DoneOutlined sx={{ fontSize: 11 }} />
            : <ContentCopyOutlined sx={{ fontSize: 11 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

const ICD10_OPTIONS = [
  'A41.9 – Sepsis, unspecified organism',
  'R65.20 – Severe sepsis without septic shock',
  'J96.21 – Acute and chronic respiratory failure with hypoxia',
  'J18.9 – Pneumonia, unspecified organism',
  'N17.9 – Acute kidney failure, unspecified',
  'I10 – Essential (primary) hypertension',
  'E11.9 – Type 2 diabetes mellitus without complications',
  'I50.9 – Heart failure, unspecified',
  'J44.1 – COPD with acute exacerbation',
  'J96.00 – Acute respiratory failure, unspecified',
  'K92.1 – Melena',
  'G20 – Parkinson\'s disease',
  'F32.9 – Major depressive disorder, single episode',
  'Z87.891 – Personal history of nicotine dependence',
  'M54.5 – Low back pain',
]

// ── IssueCard ─────────────────────────────────────────────────────────────────

function IssueCard({
  reason, record, onResolved, onDecision, mode,
}: {
  reason: NeedsReviewReason
  record: StagingRecord
  onResolved: (reason: NeedsReviewReason) => void
  onDecision?: (reason: NeedsReviewReason, decision: string) => void
  mode?: 'existing'
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [manualEntry, setManualEntry] = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null)
  const [selectedAttach, setSelectedAttach] = useState<string | null>(null)
  const [selectedDifferent, setSelectedDifferent] = useState<string | null>(null)
  const [showMatchConfidence, setShowMatchConfidence] = useState(false)
  const [diagnosisRows, setDiagnosisRows] = useState<Array<{ code: string; adjustment: string }>>([{ code: '', adjustment: '' }])
  const ext = record.extraction
  const isRelatedInstance = reason === 'possible_duplicate' || reason === 'existing_instance_found'
  const catColor = (REVIEW_CATEGORY_STYLE[REVIEW_CATEGORY[reason]] ?? { color: '#94A3B8' }).color

  const resolved = (() => {
    switch (reason) {
      case 'no_patient_match': return !!selectedCandidate || manualEntry.length > 2
      case 'no_claim_match': return mode === 'existing'
        ? diagnosisRows.some(r => r.code.length > 0)
        : manualEntry.length > 3
      case 'ambiguous_classification': return !!selectedClassification
      case 'possible_duplicate':
      case 'existing_instance_found': return !!selectedAttach && (selectedAttach !== 'attach_different' || !!selectedDifferent)
      case 'missing_fields': return (ext.missingFields as string[]).every(f => (fieldValues[f] ?? '').length > 0)
      case 'low_confidence': return !!selectedCandidate || manualEntry.length > 0
      default: return false
    }
  })()

  if (mode === 'existing' && reason === 'missing_fields') {
    const dosDate = ext.dos
      ? new Date(String(ext.dos) + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '—'
    return (
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', borderColor: '#FECACA' }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 0, alignItems: 'flex-start', bgcolor: '#FEE2E2' }}
          action={
            <Button color="inherit" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none', whiteSpace: 'nowrap' }}>
              Contact support
            </Button>
          }
        >
          <AlertTitle sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>Visit not available</AlertTitle>
          <Typography sx={{ fontSize: '0.75rem' }}>
            Denial date {dosDate} is before the supported start date April 1, 2026.
          </Typography>
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, borderLeft: `3px solid ${catColor}` }}>
      {isRelatedInstance ? (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.375 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>Related instance</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            We found an existing denial that this signal may belong to.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
            {mode === 'existing' && reason === 'low_confidence' ? 'Select Encounter' : SECTION_TITLE[reason]}
          </Typography>
        </Box>
      )}

      {reason === 'no_patient_match' && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
            Extracted: "{String(ext.extractedPatientName)}" · DOB {String(ext.extractedDob)}. Select a match or enter manually.
          </Typography>
          {(ext.patientCandidates as Array<{ mrn: string; name: string; dob: string; matchSignals: string[] }>).map(c => (
            <Box
              key={c.mrn}
              onClick={() => setSelectedCandidate(c.mrn)}
              sx={{
                p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: selectedCandidate === c.mrn ? '#3B82F6' : 'divider',
                bgcolor: selectedCandidate === c.mrn ? '#EFF6FF' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.name}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                {c.mrn} · DOB {c.dob} · Matched on: {c.matchSignals.join(', ')}
              </Typography>
            </Box>
          ))}
          <TextField
            size="small" fullWidth placeholder="Or enter MRN manually"
            value={manualEntry} onChange={e => setManualEntry(e.target.value)}
            sx={{ mt: 0.5, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
          />
        </Box>
      )}

      {reason === 'no_claim_match' && (
        mode === 'existing' ? (
          <Box>
            {diagnosisRows.map((row, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'center' }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={ICD10_OPTIONS}
                  inputValue={row.code}
                  onInputChange={(_, val) => setDiagnosisRows(prev => prev.map((r, j) => j === i ? { ...r, code: val } : r))}
                  renderInput={params => (
                    <TextField {...params} placeholder="ICD-10 code" sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }} />
                  )}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ flex: '0 0 160px' }}>
                  <Select
                    displayEmpty
                    value={row.adjustment}
                    onChange={e => setDiagnosisRows(prev => prev.map((r, j) => j === i ? { ...r, adjustment: e.target.value } : r))}
                    renderValue={v => v ? { removed: 'Removed', changed_to_principal: 'Changed to Principal', unchanged: 'Unchanged' }[v] ?? v : <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>Payer adjustment</span>}
                    sx={{ fontSize: '0.8125rem' }}
                  >
                    <MenuItem value="removed" sx={{ fontSize: '0.8125rem' }}>Removed</MenuItem>
                    <MenuItem value="changed_to_principal" sx={{ fontSize: '0.8125rem' }}>Changed to Principal</MenuItem>
                    <MenuItem value="unchanged" sx={{ fontSize: '0.8125rem' }}>Unchanged</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ))}
            <Button
              size="small"
              onClick={() => setDiagnosisRows(prev => [...prev, { code: '', adjustment: '' }])}
              sx={{ p: 0, fontSize: '0.8125rem', textTransform: 'none', color: 'primary.main' }}
            >
              + Diagnosis
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
              Claim ID "{String(ext.claimId)}" was not found. Enter the correct claim ID or HAR.
            </Typography>
            <TextField
              size="small" fullWidth placeholder="Claim ID or HAR"
              value={manualEntry} onChange={e => setManualEntry(e.target.value)}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
          </Box>
        )
      )}

      {reason === 'ambiguous_classification' && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
            This signal could be classified as:
          </Typography>
          {(mode === 'existing' ? EXISTING_DENIAL_TYPES : (ext.classificationOptions as Array<{ module: string; label: string; explanation: string }>)).map(opt => (
            <Box
              key={opt.module}
              onClick={() => setSelectedClassification(opt.module)}
              sx={{
                p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: selectedClassification === opt.module ? '#3B82F6' : 'divider',
                bgcolor: selectedClassification === opt.module ? '#EFF6FF' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{opt.label}</Typography>
              {!(mode === 'existing' && (opt.module === 'drg_downgrade' || opt.module === 'medical_necessity')) && (
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{opt.explanation}</Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {(reason === 'possible_duplicate' || reason === 'existing_instance_found') && (
        <Box>
          {/* Existing instance card */}
          {ext.matchedInstance && (() => {
            const inst = ext.matchedInstance as {
              id: string; denialType: string; status: string; owner: string
              worklist: string; lastUpdated: string; deniedAmount: number
            }
            return (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Existing instance
                  </Typography>
                  <Button size="small" sx={{ p: 0, minWidth: 0, fontSize: '0.6875rem', textTransform: 'none', color: 'primary.main', lineHeight: 1 }}>
                    View instance
                  </Button>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, mb: 0.5 }}>
                  {mode === 'existing' ? inst.denialType.replace(/^Denial\s*[—–-]\s*/, '') : inst.denialType}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Chip label={inst.status} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: '#EFF6FF', color: '#1D4ED8' }} />
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {inst.owner} · {inst.worklist}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    Updated {formatRelative(inst.lastUpdated)}
                  </Typography>
                  {mode !== 'existing' && (
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      {formatCurrency(inst.deniedAmount)}
                    </Typography>
                  )}
                </Box>
              </Paper>
            )
          })()}

          {/* Decision section */}
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.07em', textTransform: 'uppercase', mb: 0.75 }}>
            {mode === 'existing' ? 'Select an action:' : 'What should we do with this signal?'}
          </Typography>

          {[
            { value: 'attach_existing',  label: 'Attach to existing instance',  desc: 'Signal becomes part of this denial\'s evidence timeline' },
            { value: 'create_new',       label: 'Create new instance',           desc: 'Start a separate denial instance from this signal' },
            { value: 'attach_different', label: 'Attach to different instance',  desc: 'Search for and attach to another existing denial' },
            { value: 'not_actionable',   label: 'Mark as not actionable',        desc: 'Move this signal to history without creating or attaching' },
          ].map(opt => (
            <Box
              key={opt.value}
              onClick={() => {
                setSelectedAttach(opt.value)
                onDecision?.(reason, opt.value)
                if (opt.value !== 'attach_different') onResolved(reason)
              }}
              sx={{
                p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: selectedAttach === opt.value ? '#3B82F6' : 'divider',
                bgcolor: selectedAttach === opt.value ? '#EFF6FF' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{opt.label}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{opt.desc}</Typography>
            </Box>
          ))}

          {/* Instance picker for "attach to different" */}
          {selectedAttach === 'attach_different' && (
            <Box sx={{ mt: 0.5, mb: 0.75 }}>
              <TextField
                size="small" fullWidth
                placeholder="Search by patient, MRN, claim ID, payer, or amount"
                sx={{ mb: 0.75, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
              />
              {[
                { id: 'D-1089', label: 'Jose Martinez · Aetna · $4.2K', sub: 'Denial — Medical Necessity · In progress' },
                { id: 'D-1087', label: 'Linda Chen · UnitedHealthcare · $7.8K', sub: 'Denial — Authorization · Submitted' },
              ].map(r => (
                <Box
                  key={r.id}
                  onClick={() => { setSelectedDifferent(r.id); onResolved(reason) }}
                  sx={{
                    p: 1, mb: 0.5, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                    borderColor: selectedDifferent === r.id ? '#3B82F6' : 'divider',
                    bgcolor: selectedDifferent === r.id ? '#EFF6FF' : 'background.paper',
                  }}
                >
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{r.label}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{r.sub}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Match confidence — progressively disclosed */}
          {ext.matchFactors && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                size="small"
                onClick={() => setShowMatchConfidence(p => !p)}
                endIcon={showMatchConfidence ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                sx={{ p: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.disabled', minWidth: 0 }}
              >
                Match confidence
              </Button>
              {showMatchConfidence && (
                <Paper variant="outlined" sx={{ px: 1.25, py: 0.25, borderRadius: 1, mt: 0.75 }}>
                  {(ext.matchFactors as Array<{ label: string; status: keyof typeof FACTOR_STATUS_STYLE }>).map(f => (
                    <MatchFactorRow key={f.label} label={f.label} status={f.status} />
                  ))}
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}

      {reason === 'missing_fields' && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
            Required fields could not be extracted: {(ext.missingFields as string[]).join(', ')}.
          </Typography>
          {(ext.missingFields as string[]).map(field => (
            <TextField
              key={field}
              size="small" fullWidth
              label={field === 'deniedAmount' ? 'Denied amount ($)' : field === 'deadline' ? 'Appeal deadline' : field}
              placeholder={field === 'deadline' ? 'YYYY-MM-DD' : ''}
              value={fieldValues[field] ?? ''}
              onChange={e => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
              sx={{ mb: 0.75, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
          ))}
        </Box>
      )}

      {reason === 'low_confidence' && (
        mode === 'existing' ? (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
              Extracted: "{String(ext.extractedPatientName ?? '—')}" · DOB {String(ext.extractedDob ?? '—')}. Select the correct encounter.
            </Typography>
            {(ext.patientCandidates as Array<{ mrn: string; name: string; dob: string; matchSignals: string[] }> ?? []).map(c => (
              <Box
                key={c.mrn}
                onClick={() => setSelectedCandidate(c.mrn)}
                sx={{
                  p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                  borderColor: selectedCandidate === c.mrn ? '#3B82F6' : 'divider',
                  bgcolor: selectedCandidate === c.mrn ? '#EFF6FF' : 'background.paper',
                }}
              >
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.name}</Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                  {c.mrn} · DOB {c.dob} · Matched on: {c.matchSignals.join(', ')}
                </Typography>
              </Box>
            ))}
            <TextField
              size="small" fullWidth placeholder="Or enter MRN manually"
              value={manualEntry} onChange={e => setManualEntry(e.target.value)}
              sx={{ mt: 0.5, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
              OCR confidence was low on some fields. Please verify or correct:
            </Typography>
            {ext.ocrConfidence && Object.entries(ext.ocrConfidence as Record<string, number>)
              .filter(([, conf]) => conf < 0.75)
              .map(([field]) => (
                <Box key={field} sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.25 }}>
                    {field.replace(/([A-Z])/g, ' $1').replace(/^(.)/, s => s.toUpperCase())}
                  </Typography>
                  <TextField
                    size="small" fullWidth
                    defaultValue={String(record.extraction[field] ?? '')}
                    onChange={e => { if (e.target.value) setManualEntry(e.target.value) }}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
                  />
                </Box>
              ))}
          </Box>
        )
      )}

      {!isRelatedInstance && (
        <Button
          variant={resolved ? 'contained' : 'outlined'}
          size="small"
          disabled={!resolved}
          onClick={() => onResolved(reason)}
          sx={{
            mt: 1.5, fontSize: '0.75rem', textTransform: 'none',
            ...(resolved && { bgcolor: '#157d9d', '&:hover': { bgcolor: '#11647e' } }),
          }}
        >
          Mark resolved
        </Button>
      )}
    </Paper>
  )
}

// ── CompletionDrawer ───────────────────────────────────────────────────────────

function CompletionDrawer({
  onClose, onViewHistory,
}: {
  onClose: () => void
  onViewHistory: () => void
}) {
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ sx: { width: 480, display: 'flex', flexDirection: 'column', top: 52, height: 'calc(100% - 52px)' } }}
    >
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
        <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2.5, p: 4 }}>
        <CheckCircleOutlined sx={{ fontSize: 52, color: '#16A34A' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', mb: 0.75 }}>
            All caught up
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            There are no more exceptions matching this view.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 240 }}>
          <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none' }}>
            Close drawer
          </Button>
          <Button variant="outlined" onClick={onViewHistory} sx={{ textTransform: 'none' }}>
            View history
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

// ── ReviewDrawer ──────────────────────────────────────────────────────────────

function ReviewDrawer({
  record, reviewIndex, reviewTotal,
  onClose, onPrev, onNext,
  onAccept, onAcceptAndNext, onDismiss, onSkip, mode,
}: {
  record: StagingRecord
  reviewIndex: number
  reviewTotal: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onAccept: (id: string, decision?: string) => void
  onAcceptAndNext: (id: string, decision?: string) => void
  onDismiss: (id: string, reason: string) => void
  onSkip: () => void
  mode?: 'existing'
}) {
  const [resolvedReasons, setResolvedReasons] = useState<Set<NeedsReviewReason>>(new Set())
  const [showDismiss, setShowDismiss] = useState(false)
  const [dismissReason, setDismissReason] = useState('')
  const [dismissOther, setDismissOther] = useState('')
  const [classificationExpanded, setClassificationExpanded] = useState(false)
  const [matchDecision, setMatchDecision] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'prev' | 'next' | 'skip' | 'close' | null>(null)

  const ext = record.extraction
  const unresolvedCount = record.reviewReasons.filter(r => !resolvedReasons.has(r)).length
  const isMissingFieldsExisting = mode === 'existing' && record.reviewReasons.every(r => r === 'missing_fields')
  const canAccept = record.status === 'needs_review' && (unresolvedCount === 0 || isMissingFieldsExisting)
  const typeChip = mode === 'existing' ? existingTypeChip(record.classifiedAs) : null

  const isPossibleMatch = record.reviewReasons.includes('possible_duplicate') || record.reviewReasons.includes('existing_instance_found')
  const allRelatedInstance = record.reviewReasons.length > 0 && record.reviewReasons.every(r => r === 'possible_duplicate' || r === 'existing_instance_found')

  const isDirty = resolvedReasons.size > 0 || matchDecision !== null

  const ctaNextLabel = allRelatedInstance ? 'Attach & next'
    : mode === 'existing' && record.reviewReasons.every(r => r === 'missing_fields') ? 'Archive & next'
    : record.reviewReasons.some(r => r === 'ambiguous_classification') ? 'Save classification & next'
    : 'Save corrections & next'

  const ctaSaveLabel = isPossibleMatch && matchDecision
    ? matchDecision === 'attach_existing'  ? 'Attach to existing'
    : matchDecision === 'create_new'       ? 'Create new instance'
    : matchDecision === 'attach_different' ? 'Attach to selected'
    : matchDecision === 'not_actionable'   ? 'Mark not actionable'
    : 'Save only'
    : 'Save only'

  const guardNav = (action: () => void, kind: 'prev' | 'next' | 'skip' | 'close') => {
    if (isDirty) setPendingAction(kind)
    else action()
  }

  const executePending = (saveFirst: boolean) => {
    const action = pendingAction
    setPendingAction(null)
    if (saveFirst) {
      onAcceptAndNext(record.id, matchDecision ?? undefined)
    } else {
      if (action === 'prev') onPrev()
      else if (action === 'next') onNext()
      else if (action === 'skip') onSkip()
      else if (action === 'close') onClose()
    }
  }

  const handleResolved = (reason: NeedsReviewReason) => {
    setResolvedReasons(prev => new Set([...prev, reason]))
  }

  const handleDecision = (reason: NeedsReviewReason, decision: string) => {
    if (reason === 'possible_duplicate' || reason === 'existing_instance_found') setMatchDecision(decision)
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={() => guardNav(onClose, 'close')}
      PaperProps={{ sx: { width: 480, display: 'flex', flexDirection: 'column', top: 52, height: 'calc(100% - 52px)' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.15)' } } }}
    >
      {/* Sequential nav strip */}
      <Box sx={{ px: 2.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#F8FAFC', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1 }}>
          Review item {reviewIndex + 1} of {reviewTotal}
        </Typography>
        <Tooltip title="Previous exception">
          <span>
            <IconButton
              size="small"
              disabled={reviewIndex === 0}
              onClick={() => guardNav(onPrev, 'prev')}
              sx={{ color: reviewIndex === 0 ? 'text.disabled' : 'text.secondary' }}
            >
              <ArrowBackOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Next exception">
          <span>
            <IconButton
              size="small"
              disabled={reviewIndex === reviewTotal - 1}
              onClick={() => guardNav(onNext, 'next')}
              sx={{ color: reviewIndex === reviewTotal - 1 ? 'text.disabled' : 'text.secondary' }}
            >
              <ArrowForwardOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton size="small" onClick={() => guardNav(onClose, 'close')} sx={{ ml: 0.5 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
            {formatPatientName(record.patientName)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {record.payer ?? '—'} · {mode === 'existing' ? 'PDF Denial' : SIGNAL_LABELS[record.signalType]} · {formatTime(record.receivedAt)}
          </Typography>
        </Box>
        {record.reviewReasons.length > 0 && (() => {
          const cat = REVIEW_CATEGORY[record.reviewReasons[0]]
          const catStyle = REVIEW_CATEGORY_STYLE[cat] ?? { bg: '#F1F5F9', color: '#64748B' }
          return (
            <Chip label={cat} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catStyle.bg, color: catStyle.color, '& .MuiChip-label': { px: 1 } }} />
          )
        })()}
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* Issues */}
        {record.reviewReasons.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            {!isMissingFieldsExisting && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {unresolvedCount > 0 ? 'Action needed' : 'Ready to save'}
                </Typography>
                {unresolvedCount === 0 && <CheckCircleOutlined sx={{ fontSize: 14, color: '#16A34A' }} />}
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {record.reviewReasons.map(r => (
                <IssueCard key={`${record.id}-${r}`} reason={r} record={record} onResolved={handleResolved} onDecision={handleDecision} mode={mode} />
              ))}
            </Box>
          </Box>
        )}

        {/* Classification */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classification
            </Typography>
            {mode === 'existing' && (
              <Button
                size="small"
                endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                sx={{ p: 0, minWidth: 0, fontSize: '0.6875rem', textTransform: 'none', color: '#157d9d', lineHeight: 1.2 }}
              >
                Edit denial details
              </Button>
            )}
          </Box>
          {record.classifiedAs ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                {mode === 'existing' ? (
                  typeChip?.isUnknown
                    ? <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>–</Typography>
                    : <Chip label={typeChip?.label} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: '#fef3ea', color: '#b86823', '& .MuiChip-label': { px: 0.75 } }} />
                ) : (
                  <>
                    <Chip label={MODULE_TAG[record.module].label} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: MODULE_TAG[record.module].bg, color: MODULE_TAG[record.module].color, '& .MuiChip-label': { px: 0.75 } }} />
                    <Typography sx={{ fontSize: '0.75rem' }}>{record.classifiedAs}</Typography>
                  </>
                )}
              </Box>
              {ext.denialLanguage && (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                  "{String(ext.denialLanguage)}"
                </Typography>
              )}
              {(ext.carc || ext.rarc || ext.auditType) && mode !== 'existing' && (
                <Box sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => setClassificationExpanded(p => !p)}
                    endIcon={classificationExpanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                    sx={{ fontSize: '0.6875rem', textTransform: 'none', color: 'text.secondary', p: 0 }}
                  >
                    How was this classified?
                  </Button>
                  {classificationExpanded && (
                    <Box sx={{ mt: 0.75, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                      {ext.carc && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>→ CARC {String(ext.carc)} detected in 835</Typography>}
                      {ext.rarc && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>→ RARC {String(ext.rarc)}</Typography>}
                      {ext.auditType && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>→ Audit type: {String(ext.auditType)}</Typography>}
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>—</Typography>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Patient */}
        {!(mode === 'existing' && (record.reviewReasons.includes('low_confidence') || record.reviewReasons.includes('no_patient_match'))) && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {mode === 'existing' ? 'Encounter Match' : 'Patient Match'}
              </Typography>
              {mode === 'existing' ? (
                <Button
                  size="small"
                  endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                  sx={{ p: 0, minWidth: 0, fontSize: '0.6875rem', textTransform: 'none', color: '#157d9d', lineHeight: 1.2 }}
                >
                  Change encounter
                </Button>
              ) : (
                ext.patientMatchConfidence && (
                  <Chip label={`${String(ext.patientMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.patientMatchConfidence === 'high' ? '#F0FDF4' : '#FFFBEB', color: ext.patientMatchConfidence === 'high' ? '#166534' : '#92400E' }} />
                )
              )}
            </Box>
            {record.patientName ? (
              <>
                <Typography sx={{ fontSize: '0.75rem' }}>{formatPatientName(record.patientName)}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {record.patientMrn}{ext.patientMatchMethod ? ` · Matched via ${String(ext.patientMatchMethod)}` : ''}
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>Not matched</Typography>
            )}
          </Box>
        )}

        {/* Claim */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {mode === 'existing' ? 'Claim' : 'Claim Match'}
            </Typography>
            {mode !== 'existing' && ext.claimMatchConfidence && (
              <Chip label={`${String(ext.claimMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.claimMatchConfidence === 'high' ? '#F0FDF4' : '#FFFBEB', color: ext.claimMatchConfidence === 'high' ? '#166534' : '#92400E' }} />
            )}
          </Box>
          {ext.claimId && <Typography sx={{ fontSize: '0.75rem' }}>Claim {String(ext.claimId)}</Typography>}
          {ext.har && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>HAR {String(ext.har)}</Typography>}
          {ext.dos && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>DOS {String(ext.dos)}</Typography>}
        </Box>

        {/* Financials */}
        {record.amount !== null && mode !== 'existing' && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
              Amount
            </Typography>
            <Typography sx={{ fontSize: '0.75rem' }}>
              {formatCurrency(record.amount)}
            </Typography>
            {ext.billedAmount && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Billed {formatCurrency(Number(ext.billedAmount))} · Paid {formatCurrency(Number(ext.paidAmount))}
              </Typography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Routing preview — new system only */}
        {mode !== 'existing' && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>
              Routing Preview
            </Typography>
            {record.module !== 'unknown' ? (
              <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  → {record.module === 'denial' ? 'Denials Worklist' : record.module === 'underpayment' ? 'Underpayments Worklist' : 'Audits Worklist'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  Will be assigned based on routing rules
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled' }}>
                Routing will be determined after classification
              </Typography>
            )}
          </Box>
        )}

        {/* Dismiss panel */}
        {showDismiss && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, mt: 2 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, mb: 1.5 }}>Why are you dismissing this signal?</Typography>
            <RadioGroup value={dismissReason} onChange={e => setDismissReason(e.target.value)}>
              {DISMISS_REASONS.map(r => (
                <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.8125rem' }}>{r}</Typography>} />
              ))}
            </RadioGroup>
            {dismissReason === 'Other' && (
              <TextField size="small" fullWidth placeholder="Describe reason" value={dismissOther} onChange={e => setDismissOther(e.target.value)} sx={{ mt: 1, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }} />
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button size="small" onClick={() => setShowDismiss(false)} sx={{ textTransform: 'none', fontSize: '0.8125rem' }}>Cancel</Button>
              <Button
                size="small" variant="contained" color="error"
                disabled={!dismissReason || (dismissReason === 'Other' && !dismissOther)}
                onClick={() => onDismiss(record.id, dismissReason === 'Other' ? dismissOther : dismissReason)}
                sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
              >
                Dismiss
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
        {/* Dismiss */}
        {!showDismiss && (
          <Button
            variant="text" size="small"
            onClick={() => setShowDismiss(true)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'text.secondary' }}
          >
            Dismiss
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Skip — always visible */}
        <Button
          variant="text" size="small"
          onClick={() => guardNav(onSkip, 'skip')}
          sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'text.secondary' }}
        >
          Skip
        </Button>

        {/* Save only — visible when resolved */}
        {canAccept && (
          <Button
            variant="outlined" size="small"
            onClick={() => onAccept(record.id, matchDecision ?? undefined)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            {ctaSaveLabel}
          </Button>
        )}

        {/* Primary CTA */}
        {canAccept ? (
          <Button
            variant="contained" size="small"
            onClick={() => onAcceptAndNext(record.id, matchDecision ?? undefined)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            {ctaNextLabel}
          </Button>
        ) : (
          <Tooltip title={`Resolve ${unresolvedCount} issue${unresolvedCount > 1 ? 's' : ''} above to continue`}>
            <span>
              <Button variant="contained" size="small" disabled sx={{ textTransform: 'none', fontSize: '0.8125rem' }}>
                {ctaNextLabel}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Unsaved changes guard dialog */}
      <Dialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 380 } }}
      >
        <DialogTitle sx={{ fontSize: '0.9375rem', fontWeight: 700, pb: 1 }}>
          Unsaved changes
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            You have unsaved changes. Save before moving on?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 0.5 }}>
          <Button
            size="small"
            onClick={() => setPendingAction(null)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => executePending(false)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            Discard changes
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={!canAccept}
            onClick={() => executePending(true)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            Save & continue
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}

// ── InProgressDrawer ──────────────────────────────────────────────────────────

function InProgressDrawer({
  record, onClose, mode,
}: {
  record: StagingRecord
  onClose: () => void
  mode?: 'existing'
}) {
  const [planNotes, setPlanNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const ext = record.extraction
  const typeChip = mode === 'existing' ? existingTypeChip(record.classifiedAs) : null
  const appealPlan = ext.appealPlan as {
    strategy: string
    keyArguments: string[]
    supportingEvidence: string[]
  } | undefined

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ sx: { width: 480, display: 'flex', flexDirection: 'column', top: 52, height: 'calc(100% - 52px)' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.15)' } } }}
    >
      {/* Header strip */}
      <Box sx={{ px: 2.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: '#F8FAFC', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1 }}>
          Generating letter
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>

      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
            {formatPatientName(record.patientName)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {record.payer ?? '—'} · PDF Denial · {formatTime(record.receivedAt)}
          </Typography>
        </Box>
        <StatusChip status="processing" />
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* Classification */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classification
            </Typography>
            {mode === 'existing' && (
              <Button
                size="small"
                endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                sx={{ p: 0, minWidth: 0, fontSize: '0.6875rem', textTransform: 'none', color: '#157d9d', lineHeight: 1.2 }}
              >
                Edit denial details
              </Button>
            )}
          </Box>
          {record.classifiedAs ? (
            typeChip?.isUnknown
              ? <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>–</Typography>
              : <Chip label={typeChip?.label} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: '#fef3ea', color: '#b86823', '& .MuiChip-label': { px: 0.75 } }} />
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>—</Typography>
          )}
          {ext.denialLanguage && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
              "{String(ext.denialLanguage)}"
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Patient */}
        {!(mode === 'existing' && (record.reviewReasons.includes('low_confidence') || record.reviewReasons.includes('no_patient_match'))) && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {mode === 'existing' ? 'Encounter Match' : 'Patient Match'}
              </Typography>
              {mode === 'existing' ? (
                <Button
                  size="small"
                  endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                  sx={{ p: 0, minWidth: 0, fontSize: '0.6875rem', textTransform: 'none', color: '#157d9d', lineHeight: 1.2 }}
                >
                  Change encounter
                </Button>
              ) : (
                ext.patientMatchConfidence && (
                  <Chip label={`${String(ext.patientMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.patientMatchConfidence === 'high' ? '#F0FDF4' : '#FFFBEB', color: ext.patientMatchConfidence === 'high' ? '#166534' : '#92400E' }} />
                )
              )}
            </Box>
            {record.patientName ? (
              <>
                <Typography sx={{ fontSize: '0.75rem' }}>{formatPatientName(record.patientName)}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {record.patientMrn}{ext.patientMatchMethod ? ` · Matched via ${String(ext.patientMatchMethod)}` : ''}
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>Not matched</Typography>
            )}
          </Box>
        )}

        {/* Claim */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {mode === 'existing' ? 'Claim' : 'Claim Match'}
            </Typography>
            {mode !== 'existing' && ext.claimMatchConfidence && (
              <Chip label={`${String(ext.claimMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.claimMatchConfidence === 'high' ? '#F0FDF4' : '#FFFBEB', color: ext.claimMatchConfidence === 'high' ? '#166534' : '#92400E' }} />
            )}
          </Box>
          {ext.claimId && <Typography sx={{ fontSize: '0.75rem' }}>Claim {String(ext.claimId)}</Typography>}
          {ext.har && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>HAR {String(ext.har)}</Typography>}
          {ext.dos && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>DOS {String(ext.dos)}</Typography>}
        </Box>

        {/* Appeal Plan */}
        {appealPlan && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Appeal Plan
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', mb: 0.375 }}>Strategy</Typography>
                <Typography sx={{ fontSize: '0.8125rem', mb: 1.25 }}>{appealPlan.strategy}</Typography>

                {appealPlan.keyArguments.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Key arguments</Typography>
                    {appealPlan.keyArguments.map((arg, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', flexShrink: 0, mt: '1px' }}>·</Typography>
                        <Typography sx={{ fontSize: '0.75rem' }}>{arg}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {appealPlan.supportingEvidence.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Supporting evidence</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {appealPlan.supportingEvidence.map((e, i) => (
                        <Chip key={i} label={e} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#F1F5F9', color: '#475569', '& .MuiChip-label': { px: 0.75 } }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>

              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', mb: 0.375 }}>
                Corrections or additional notes
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.75 }}>
                The system will incorporate these before the letter is finalized.
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder="e.g. Patient was admitted for cardiac monitoring, not an elective procedure"
                value={planNotes}
                onChange={e => { setPlanNotes(e.target.value); setNotesSaved(false) }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
              />
              {planNotes.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setNotesSaved(true)}
                  sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem', color: notesSaved ? '#16A34A' : undefined, borderColor: notesSaved ? '#16A34A' : undefined }}
                >
                  {notesSaved ? 'Correction queued' : 'Queue correction'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ textTransform: 'none', fontSize: '0.8125rem' }}>
          Close
        </Button>
      </Box>
    </Drawer>
  )
}

// ── InProgressTab ─────────────────────────────────────────────────────────────

function InProgressTab({ records, mode }: { records: StagingRecord[]; mode?: 'existing' }) {
  const [drawerRecordId, setDrawerRecordId] = useState<string | null>(null)

  const processing = [...records.filter(r => r.status === 'processing')]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const drawerRecord = drawerRecordId ? processing.find(r => r.id === drawerRecordId) ?? null : null

  if (processing.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <Typography variant="body2" color="text.secondary">No items currently processing</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Column headers */}
      <Box sx={{ px: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', flexShrink: 0 }}>
        <Typography sx={{ flex: 1, ...COL_HEADER_SX }}>Patient</Typography>
        <Typography sx={{ width: 150, flexShrink: 0, ...COL_HEADER_SX }}>Payer</Typography>
        <Typography sx={{ width: 140, flexShrink: 0, ...COL_HEADER_SX }}>Type</Typography>
        <Typography sx={{ width: 100, flexShrink: 0, ...COL_HEADER_SX }}>Status</Typography>
        <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', ...COL_HEADER_SX }}>Received</Typography>
      </Box>

      <Box sx={{ overflow: 'auto' }}>
        {processing.map(record => {
          const typeDisplay = mode === 'existing' ? existingTypeChip(record.classifiedAs) : null
          return (
            <Box
              key={record.id}
              onClick={() => setDrawerRecordId(record.id)}
              sx={{
                px: 3, py: 1.25,
                display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                cursor: 'pointer',
                bgcolor: drawerRecordId === record.id ? '#F8FAFC' : '#fff',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.patientName ? formatPatientName(record.patientName) : <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 400 }}>Unknown patient</span>}
                </Typography>
                {record.patientMrn && <MrnCopy mrn={record.patientMrn} />}
                {!record.patientName && record.sourceFile && (
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>{record.sourceFile}</Typography>
                )}
              </Box>
              <Typography sx={{ width: 150, flexShrink: 0, fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.payer ?? '—'}
              </Typography>
              <Box sx={{ width: 140, flexShrink: 0 }}>
                {typeDisplay && !typeDisplay.isUnknown ? (
                  <Chip label={typeDisplay.label} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: '#fef3ea', color: '#b86823', '& .MuiChip-label': { px: 0.75 } }} />
                ) : (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>—</Typography>
                )}
              </Box>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <StatusChip status="processing" />
              </Box>
              <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', fontSize: '0.6875rem', color: 'text.secondary' }}>
                {formatTime(record.receivedAt)}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {drawerRecord && (
        <InProgressDrawer
          record={drawerRecord}
          onClose={() => setDrawerRecordId(null)}
          mode={mode}
        />
      )}
    </Box>
  )
}

// ── ExceptionsTab ─────────────────────────────────────────────────────────────

function ExceptionsTab({
  records, onUpdate, onNavigate, onSwitchToHistory, mode,
}: {
  records: StagingRecord[]
  onUpdate: (updated: StagingRecord[]) => void
  onNavigate: (nav: string) => void
  onSwitchToHistory: () => void
  mode?: 'existing'
}) {
  type ToastState =
    | { kind: 'created'; instanceId: string; worklist: string }
    | { kind: 'attached'; instanceId: string }
    | { kind: 'not_actionable' }
    | { kind: 'dismissed' }
    | null

  const [drawerRecordId, setDrawerRecordId] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [undoRecord, setUndoRecord] = useState<StagingRecord | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const exceptions = sortByUrgency(records.filter(r =>
    r.status === 'needs_review' &&
    (mode !== 'existing' || !r.reviewReasons.includes('possible_duplicate'))
  ))
  const drawerRecord = drawerRecordId ? exceptions.find(r => r.id === drawerRecordId) ?? null : null
  const drawerIndex = drawerRecord ? exceptions.findIndex(r => r.id === drawerRecordId) : -1

  const refDateStr = new Date('2026-04-03').toDateString()
  const autoProcessedToday = records.filter(r =>
    r.status === 'auto_processed' &&
    r.autoProcessedAt !== null &&
    new Date(r.autoProcessedAt).toDateString() === refDateStr
  ).length

  const openReview = (id: string) => {
    setDrawerRecordId(id)
    setShowCompletion(false)
  }

  const closeDrawer = () => {
    setDrawerRecordId(null)
    setShowCompletion(false)
  }

  const handlePrev = () => {
    if (drawerIndex > 0) setDrawerRecordId(exceptions[drawerIndex - 1].id)
  }

  const handleNext = () => {
    if (drawerIndex < exceptions.length - 1) setDrawerRecordId(exceptions[drawerIndex + 1].id)
  }

  const handleSkip = () => {
    if (drawerIndex < exceptions.length - 1) {
      setDrawerRecordId(exceptions[drawerIndex + 1].id)
    } else {
      closeDrawer()
    }
  }

  const makeToastState = (record: StagingRecord, decision?: string): ToastState => {
    const instanceId = generateInstanceId(record)
    if (decision === 'attach_existing' || decision === 'attach_different') {
      const matched = record.extraction.matchedInstance as { id: string } | undefined
      return { kind: 'attached', instanceId: matched?.id ?? instanceId }
    }
    if (decision === 'not_actionable') return { kind: 'not_actionable' }
    return { kind: 'created', instanceId, worklist: MODULE_WORKLIST[record.module] }
  }

  const handleAccept = (id: string, decision?: string) => {
    const record = records.find(r => r.id === id)
    if (!record) return
    const nextStatus = decision === 'not_actionable' ? 'dismissed' as const : 'resolved' as const
    onUpdate(records.map(r =>
      r.id === id ? { ...r, status: nextStatus, resolvedAt: new Date().toISOString(), resolvedBy: 'Krista S.' } : r
    ))
    setUndoRecord(record)
    closeDrawer()
    setToast(makeToastState(record, decision))
  }

  const handleAcceptAndNext = (id: string, decision?: string) => {
    const record = records.find(r => r.id === id)
    if (!record) return
    const nextStatus = decision === 'not_actionable' ? 'dismissed' as const : 'resolved' as const
    const updatedRecords = records.map(r =>
      r.id === id ? { ...r, status: nextStatus, resolvedAt: new Date().toISOString(), resolvedBy: 'Krista S.' } : r
    )
    onUpdate(updatedRecords)
    setUndoRecord(record)
    setToast(makeToastState(record, decision))

    const newExceptions = sortByUrgency(updatedRecords.filter(r => r.status === 'needs_review'))
    if (newExceptions.length === 0) {
      setDrawerRecordId(null)
      setShowCompletion(true)
    } else {
      const nextIndex = Math.min(drawerIndex, newExceptions.length - 1)
      setDrawerRecordId(newExceptions[nextIndex].id)
    }
  }

  const handleDismiss = (id: string, reason: string) => {
    const record = records.find(r => r.id === id)
    onUpdate(records.map(r =>
      r.id === id ? { ...r, status: 'dismissed' as const, dismissedAt: new Date().toISOString(), dismissReason: reason } : r
    ))
    setUndoRecord(record ?? null)
    closeDrawer()
    setToast({ kind: 'dismissed' })
  }

  const handleUndo = () => {
    if (!undoRecord) return
    onUpdate(records.map(r =>
      r.id === undoRecord.id ? { ...undoRecord } : r
    ))
    setUndoRecord(null)
    setToast(null)
    setShowCompletion(false)
    setDrawerRecordId(undoRecord.id)
  }

  if (exceptions.length === 0 && !drawerRecord && !showCompletion) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, py: 8 }}>
        <CheckCircleOutlined sx={{ fontSize: 40, color: '#16A34A' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>All caught up</Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<UploadFileOutlined />} sx={{ textTransform: 'none', mt: 1 }}>
          Upload a file manually
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Sub-header */}
      <Box sx={{ px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FFFBEB', flexShrink: 0 }}>
        <WarningAmberOutlined sx={{ fontSize: 15, color: '#B45309' }} />
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E' }}>
          {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''} require your input
        </Typography>
        <Box sx={{ flex: 1 }} />
        {exceptions.length > 0 && (
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => openReview(exceptions[0].id)}
            sx={{ textTransform: 'none', fontSize: '0.6875rem', py: 0.375, px: 1.25 }}
          >
            Review all →
          </Button>
        )}
      </Box>

      {/* Column headers */}
      <Box sx={{
        px: 3, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 2,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: '#F8FAFC', flexShrink: 0,
      }}>
        <Typography sx={{ flex: 1, fontSize: '0.625rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Review needed</Typography>
        {mode !== 'existing' && <Typography sx={{ width: 64, flexShrink: 0, fontSize: '0.625rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Amount</Typography>}
        <Typography sx={{ width: 92, flexShrink: 0, fontSize: '0.625rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Deadline</Typography>
        <Box sx={{ width: 76, flexShrink: 0 }} />
      </Box>

      {/* Exception list */}
      <Box sx={{ overflow: 'auto' }}>
        {exceptions.map(record => {
          const deadline = getDeadline(record)
          const refDate = new Date('2026-04-03T00:00:00')
          const daysUntil = deadline
            ? Math.ceil((deadline.getTime() - refDate.getTime()) / 86400000)
            : null
          const isOverdue = daysUntil !== null && daysUntil <= 0
          const isUrgent = daysUntil !== null && daysUntil >= 1 && daysUntil <= 2
          const isSoon   = daysUntil !== null && daysUntil >= 3 && daysUntil <= 5

          const typeDisplay = mode === 'existing' ? existingTypeChip(record.classifiedAs) : null

          return (
            <Box
              key={record.id}
              onClick={() => openReview(record.id)}
              sx={{
                px: 3, py: 1.25,
                display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                borderLeft: `3px solid ${isOverdue ? '#DC2626' : isUrgent ? '#D97706' : isSoon ? '#FCD34D' : '#CBD5E1'}`,
                cursor: 'pointer',
                bgcolor: drawerRecordId === record.id ? 'rgba(255, 251, 235, 0.8)' : '#fff',
                '&:hover': { bgcolor: 'rgba(255, 251, 235, 0.6)' },
              }}
            >
              {/* ISSUE column — 2 lines: chip row / patient · classification · payer · MRN */}
              <Box sx={{ flex: 1, minWidth: 0 }}>

                {/* Line 1: two-level review label */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mb: 0.375 }}>
                  {(() => {
                    const firstReason = record.reviewReasons[0]
                    if (!firstReason) return null
                    const category = (mode === 'existing' ? EXISTING_REVIEW_CATEGORY[firstReason] : undefined) ?? REVIEW_CATEGORY[firstReason]
                    const secondary = (mode === 'existing' ? EXISTING_REVIEW_SECONDARY[firstReason] : undefined) ?? REVIEW_SECONDARY[firstReason]
                    const catStyle = REVIEW_CATEGORY_STYLE[category] ?? { bg: '#F1F5F9', color: '#64748B' }
                    return (
                      <>
                        <Chip
                          label={category}
                          size="small"
                          sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catStyle.bg, color: catStyle.color, '& .MuiChip-label': { px: 0.875 }, flexShrink: 0 }}
                        />
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {secondary}
                        </Typography>
                      </>
                    )
                  })()}
                  {record.reviewReasons.length > 1 && (
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      +{record.reviewReasons.length - 1}
                    </Typography>
                  )}
                </Box>

                {/* Line 2: patient | classification | payer | MRN */}
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 400, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0, maxWidth: 160 }}>
                    {formatPatientName(record.patientName)}
                  </Typography>

                  <Box sx={{ width: '1px', height: 10, bgcolor: '#CBD5E1', mx: 0.75, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: typeDisplay ? typeDisplay.color : MODULE_TAG[record.module].color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {typeDisplay ? typeDisplay.label : MODULE_TAG[record.module].label}
                  </Typography>

                  {record.payer && (
                    <>
                      <Box sx={{ width: '1px', height: 10, bgcolor: '#CBD5E1', mx: 0.75, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
                        {record.payer}
                      </Typography>
                    </>
                  )}

                  {record.patientMrn && (
                    <>
                      <Box sx={{ width: '1px', height: 10, bgcolor: '#CBD5E1', mx: 0.75, flexShrink: 0 }} />
                      <MrnCopy mrn={record.patientMrn} />
                    </>
                  )}
                </Box>
              </Box>

              {/* AMOUNT column */}
              {mode !== 'existing' && (
                <Box sx={{ width: 64, flexShrink: 0, textAlign: 'right' }}>
                  {record.amount !== null ? (
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(record.amount)}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>—</Typography>
                  )}
                </Box>
              )}

              {/* DEADLINE column */}
              <Box sx={{ width: 92, flexShrink: 0, textAlign: 'right' }}>
                {deadline ? (
                  <>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: isOverdue || isUrgent ? 600 : 400, color: isOverdue ? '#DC2626' : isUrgent ? '#D97706' : '#64748B', lineHeight: 1.2 }}>
                      {daysUntil !== null && daysUntil < 0
                        ? 'Overdue'
                        : daysUntil === 0
                        ? 'Today'
                        : `Due ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </Typography>
                    {!isOverdue && daysUntil !== null && daysUntil >= 1 && daysUntil <= 5 && (
                      <Typography sx={{ fontSize: '0.625rem', color: isUrgent ? '#D97706' : '#94A3B8' }}>
                        {`${daysUntil}d remaining`}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>—</Typography>
                )}
              </Box>

              {/* ACTION column */}
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={e => { e.stopPropagation(); openReview(record.id) }}
                sx={{ width: 76, flexShrink: 0, textTransform: 'none', fontSize: '0.6875rem', py: 0.25 }}
              >
                Review →
              </Button>
            </Box>
          )
        })}
      </Box>

      {/* Review drawer */}
      {drawerRecord && (
        <ReviewDrawer
          key={drawerRecord.id}
          record={drawerRecord}
          reviewIndex={drawerIndex}
          reviewTotal={exceptions.length}
          onClose={closeDrawer}
          onPrev={handlePrev}
          onNext={handleNext}
          onAccept={handleAccept}
          onAcceptAndNext={handleAcceptAndNext}
          onDismiss={handleDismiss}
          onSkip={handleSkip}
          mode={mode}
        />
      )}

      {/* Completion drawer */}
      {showCompletion && (
        <CompletionDrawer
          onClose={closeDrawer}
          onViewHistory={onSwitchToHistory}
        />
      )}

      {/* Toast */}
      <Snackbar
        open={toast !== null}
        autoHideDuration={toast?.kind === 'created' || toast?.kind === 'attached' ? 6000 : 4000}
        onClose={() => { setToast(null); setUndoRecord(null) }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.kind === 'created' || toast?.kind === 'attached' ? 'success' : 'info'}
          onClose={() => { setToast(null); setUndoRecord(null) }}
          sx={{ fontSize: '0.8125rem', alignItems: 'center' }}
        >
          {toast?.kind === 'created' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span>Done — <strong>{toast.instanceId}</strong> created in {toast.worklist}.</span>
              <Button
                size="small"
                onClick={() => { onNavigate(toast.worklist); setToast(null) }}
                sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 700, p: 0, minWidth: 0, color: 'success.dark' }}
              >
                View →
              </Button>
              {undoRecord && (
                <Button
                  size="small"
                  onClick={handleUndo}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 700, p: 0, minWidth: 0, color: 'success.dark' }}
                >
                  Undo
                </Button>
              )}
            </Box>
          ) : toast?.kind === 'attached' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span>Signal attached to existing denial <strong>{toast.instanceId}</strong></span>
              {undoRecord && (
                <Button
                  size="small"
                  onClick={handleUndo}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 700, p: 0, minWidth: 0, color: 'success.dark' }}
                >
                  Undo
                </Button>
              )}
            </Box>
          ) : toast?.kind === 'not_actionable' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span>Signal marked as not actionable</span>
              {undoRecord && (
                <Button
                  size="small"
                  onClick={handleUndo}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 700, p: 0, minWidth: 0, color: 'inherit' }}
                >
                  Undo
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span>Signal dismissed</span>
              {undoRecord && (
                <Button
                  size="small"
                  onClick={handleUndo}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 700, p: 0, minWidth: 0, color: 'inherit' }}
                >
                  Undo
                </Button>
              )}
            </Box>
          )}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ── HistoryTab ─────────────────────────────────────────────────────────────────

const HISTORY_STATUSES: StagingStatus[] = ['auto_processed', 'resolved', 'dismissed', 'expired']

const COL_HEADER_SX = {
  fontSize: '0.625rem', fontWeight: 700, color: 'text.disabled',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em',
}

function HistoryTab({ records, mode }: { records: StagingRecord[]; mode?: 'existing' }) {
  const history = records
    .filter(r => HISTORY_STATUSES.includes(r.status))
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const grouped: { dateKey: string; label: string; items: StagingRecord[] }[] = []
  for (const r of history) {
    const key = new Date(r.receivedAt).toDateString()
    const existing = grouped.find(g => g.dateKey === key)
    if (existing) {
      existing.items.push(r)
    } else {
      grouped.push({
        dateKey: key,
        label: new Date(r.receivedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        items: [r],
      })
    }
  }

  if (history.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No records in history yet</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Column headers */}
      <Box sx={{ px: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', flexShrink: 0 }}>
        <Typography sx={{ flex: 1, ...COL_HEADER_SX }}>Patient</Typography>
        <Typography sx={{ width: 150, flexShrink: 0, ...COL_HEADER_SX }}>Payer</Typography>
        <Typography sx={{ width: 140, flexShrink: 0, ...COL_HEADER_SX }}>Type</Typography>
        <Typography sx={{ width: 100, flexShrink: 0, ...COL_HEADER_SX }}>Outcome</Typography>
        <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', ...COL_HEADER_SX }}>Received</Typography>
      </Box>

      <Box sx={{ overflow: 'auto' }}>
        {grouped.map(group => (
          <Box key={group.dateKey}>
            {/* Date separator */}
            <Box sx={{ px: 3, py: 0.625, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {group.label}
              </Typography>
            </Box>

            {group.items.map(record => {
              const typeDisplay = mode === 'existing' ? existingTypeChip(record.classifiedAs) : null

              return (
                <Box
                  key={record.id}
                  sx={{
                    px: 3, py: 1.25,
                    display: 'flex', alignItems: 'center', gap: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: '#fff',
                  }}
                >
                  {/* Patient */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.patientName ? formatPatientName(record.patientName) : <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 400 }}>Unknown patient</span>}
                    </Typography>
                    {record.patientMrn && <MrnCopy mrn={record.patientMrn} />}
                  </Box>

                  {/* Payer */}
                  <Typography sx={{ width: 150, flexShrink: 0, fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.payer ?? '—'}
                  </Typography>

                  {/* Type */}
                  <Box sx={{ width: 140, flexShrink: 0 }}>
                    {typeDisplay && !typeDisplay.isUnknown ? (
                      <Chip label={typeDisplay.label} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: '#fef3ea', color: '#b86823', '& .MuiChip-label': { px: 0.75 } }} />
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                        {mode !== 'existing' ? (record.classifiedAs ?? SIGNAL_LABELS[record.signalType]) : '—'}
                      </Typography>
                    )}
                  </Box>

                  {/* Outcome */}
                  <Box sx={{ width: 100, flexShrink: 0 }}>
                    <StatusChip status={record.status} />
                    {record.status === 'resolved' && record.resolvedBy && (
                      <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', mt: 0.25 }}>
                        by {record.resolvedBy}
                      </Typography>
                    )}
                    {record.status === 'dismissed' && record.dismissReason && (
                      <Tooltip title={record.dismissReason} placement="top">
                        <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help', maxWidth: 90 }}>
                          {record.dismissReason}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Received */}
                  <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {formatTime(record.receivedAt)}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IngestPage({ features: _features, onNavigate, mode }: IngestPageProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [records, setRecords] = useState<StagingRecord[]>(SEED_STAGING)

  const exceptionCount = records.filter(r =>
    r.status === 'needs_review' &&
    (mode !== 'existing' || !r.reviewReasons.includes('possible_duplicate'))
  ).length

  const inProgressCount = records.filter(r => r.status === 'processing').length

  // In existing mode: tabs are Exceptions(0), In Progress(1), History(2)
  // In new mode: tabs are Exceptions(0), History(1) — unchanged
  const historyTabIndex = mode === 'existing' ? 2 : 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 3, flexShrink: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontSize: '0.8125rem', minWidth: 0, px: 2 } }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Exceptions
                {exceptionCount > 0 && (
                  <Chip
                    label={exceptionCount}
                    size="small"
                    sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 700, bgcolor: '#b86823', color: '#fff', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            }
          />
          {mode === 'existing' && (
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  In Progress
                  {inProgressCount > 0 && (
                    <Chip
                      label={inProgressCount}
                      size="small"
                      sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: '#e8f2f5', color: '#157d9d', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
                </Box>
              }
            />
          )}
          <Tab label="History" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <ExceptionsTab
          records={records}
          onUpdate={setRecords}
          onNavigate={onNavigate}
          onSwitchToHistory={() => setActiveTab(historyTabIndex)}
          mode={mode}
        />
      )}
      {mode === 'existing' && activeTab === 1 && (
        <InProgressTab records={records} mode={mode} />
      )}
      {activeTab === historyTabIndex && <HistoryTab records={records} mode={mode} />}
    </Box>
  )
}
