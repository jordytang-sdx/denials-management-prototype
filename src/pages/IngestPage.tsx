import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton,
  Drawer, Tooltip, Tabs, Tab, Alert, AlertTitle, Snackbar,
  Radio, RadioGroup, FormControlLabel, TextField, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, Autocomplete, Checkbox,
} from '@mui/material'
import {
  UploadFileOutlined, CloseOutlined, WarningAmberOutlined,
  CheckCircleOutlined, ExpandMoreOutlined, ExpandLessOutlined,
  ContentCopyOutlined, DoneOutlined,
  ArrowBackOutlined, ArrowForwardOutlined, OpenInNewOutlined, AddOutlined,
} from '@mui/icons-material'
import {
  SEED_STAGING, type StagingRecord, type StagingStatus,
  type StagingModule, type StagingSignalType, type NeedsReviewReason,
} from '../data/staging'
import { type FeatureFlags } from '../data/featureFlags'
import DenialDetailsPanel from '../components/DenialDetailsPanel'

// ── Props ─────────────────────────────────────────────────────────────────────

type ReturnContext = { tab: 'exceptions' | 'in-progress' | 'processing-failures'; recordId: string }

interface IngestPageProps {
  features: FeatureFlags
  onNavigate: (nav: string, returnContext?: ReturnContext) => void
  mode?: 'existing'
  initialOpenDrawer?: ReturnContext | null
  inlinePanels?: boolean
  showUpload?: boolean
  onShowUploadChange?: (v: boolean) => void
  newDenialPanelOpen?: boolean
  onNewDenialPanelClose?: () => void
  /** V4 only: intercept exception-review clicks to open a full-page editor instead of the side panel. */
  onReviewExceptionFullPage?: (records: StagingRecord[], currentIndex: number) => void
  onReviewFailuresFullPage?: (records: StagingRecord[], currentIndex: number) => void
  /** V4 only: set of staging record IDs the user has archived — filtered out of the exceptions queue. */
  archivedStagingIds?: Set<string>
  /** V1: show a persistent PDF drop zone above the tab bar. */
  showDropZoneAbove?: boolean
  /** V1: hide the Processing Failures tab (3-tab layout: Exceptions, In Progress, History). */
  hideProcessingFailures?: boolean
  /** V1: render the Exceptions list as a flat list instead of grouped by category. */
  flatExceptions?: boolean
  /** Override the label for the Processing Failures tab. */
  processingFailuresLabel?: string
  /** V2 only: align review-category chip colors with the alert messaging on the edit-denial-details page —
   *  "Classification needs review" and "Related denial needs review" use the warning (amber) palette to
   *  match "Data needs review", and "Missing Data" uses the info (blue) palette. Default keeps the legacy
   *  V1 colors. */
  unifiedAlertColors?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MOD_COLOR: Record<StagingModule, { main: string; light: string; badge: string }> = {
  denial:       { main: 'var(--colors-badge-variant-warning-emphasized)', light: 'var(--colors-badge-variant-warning-background)', badge: 'D' },
  underpayment: { main: 'var(--colors-ocean-4)', light: 'var(--colors-ocean-1)', badge: 'U' },
  audit:        { main: 'var(--colors-ocean-5)', light: 'var(--colors-ocean-1)', badge: 'A' },
  unknown:      { main: 'var(--colors-text-secondary)', light: 'var(--colors-grey-3)', badge: '?' },
}

const MODULE_TAG: Record<StagingModule, { label: string; bg: string; color: string }> = {
  denial:       { label: 'Denial',   bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-emphasized)' },
  underpayment: { label: 'Underpay', bg: 'var(--colors-ocean-1)', color: 'var(--colors-ocean-4)' },
  audit:        { label: 'Audit',    bg: 'var(--colors-ocean-1)', color: 'var(--colors-ocean-5)' },
  unknown:      { label: '—',        bg: 'var(--colors-grey-3)', color: 'var(--colors-text-secondary)' },
}

const STATUS_CHIP: Record<StagingStatus, { label: string; bg: string; color: string; border: string }> = {
  processing:     { label: 'Processing',     bg: 'var(--colors-badge-variant-info-background)',    color: 'var(--colors-badge-variant-info-text)',    border: '1px solid var(--colors-badge-variant-info-border)' },
  auto_processed: { label: 'Auto-processed', bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: '1px solid var(--colors-badge-variant-success-border)' },
  needs_review:   { label: 'Needs Review',   bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' },
  resolved:       { label: 'Resolved',       bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: '1px solid var(--colors-badge-variant-success-border)' },
  dismissed:      { label: 'Dismissed',      bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' },
  expired:        { label: 'Expired',        bg: 'var(--colors-badge-variant-error-background)',   color: 'var(--colors-badge-variant-error-text)',   border: '1px solid var(--colors-badge-variant-error-border)' },
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
  possible_duplicate:       'Related denial needs review',
  existing_instance_found:  'Related denial needs review',
}

const REASON_TAGS: Record<NeedsReviewReason, string> = {
  missing_fields:            'Missing fields',
  low_confidence:            'Low confidence',
  low_confidence_patient:    'Missing patient info',
  no_patient_match:          'No patient match',
  no_claim_match:            'No claim found',
  ambiguous_classification:  'Needs classification',
  possible_duplicate:        'Related denial needs review',
  existing_instance_found:   'Related denial needs review',
  no_clinical_data:          'Clinical data not available',
  letter_generation_failure: 'Letter generation failed',
  extraction_failure:        'Extraction failed',
}

const REVIEW_CATEGORY: Record<NeedsReviewReason, string> = {
  missing_fields:            'Data needs review',
  low_confidence:            'Data needs review',
  low_confidence_patient:    'Data needs review',
  no_patient_match:          'Data needs review',
  no_claim_match:            'Data needs review',
  ambiguous_classification:  'Classification needs review',
  possible_duplicate:        'Related denial needs review',
  existing_instance_found:   'Related denial needs review',
  no_clinical_data:          'Missing Data',
  letter_generation_failure: 'System error',
  extraction_failure:        'System error',
}

const REVIEW_SECONDARY: Record<NeedsReviewReason, string> = {
  missing_fields:            'Missing required fields',
  low_confidence:            'Low confidence fields',
  low_confidence_patient:    'Missing patient info',
  no_patient_match:          'No patient match',
  no_claim_match:            'No claim match',
  ambiguous_classification:  'Denial category unclear',
  possible_duplicate:        'Possible existing denial',
  existing_instance_found:   'Possible existing denial',
  no_clinical_data:          'Clinical data not available',
  letter_generation_failure: 'Letter generation failed',
  extraction_failure:        'Data extraction failed',
}

// Categories where only the chip is shown — no secondary detail text
const CHIP_ONLY_CATEGORIES = new Set(['Classification needs review', 'Related denial needs review'])

// Records whose category is "Missing Data" or "System error" are terminal — moved to Processing Failures tab
const TERMINAL_CATEGORIES = new Set(['Missing Data', 'System error'])

function getRecordCategory(record: StagingRecord, mode?: 'existing'): string | null {
  const firstReason = record.reviewReasons[0]
  if (!firstReason) return null
  return (mode === 'existing' ? EXISTING_REVIEW_CATEGORY[firstReason] : undefined) ?? REVIEW_CATEGORY[firstReason]
}

function isTerminalRecord(record: StagingRecord, mode?: 'existing'): boolean {
  return TERMINAL_CATEGORIES.has(getRecordCategory(record, mode) ?? '')
}

// Subtle (no-border) treatment — matches the worklist + denial detail page so
// the badge language stays consistent across V2 surfaces. Borders point at the
// *-subtle-border tokens which resolve to the same hue as the background.
const REVIEW_CATEGORY_STYLE_V1: Record<string, { bg: string; color: string; border: string }> = {
  'Data needs review':           { bg: 'var(--colors-badge-variant-warning-subtle-background)', color: 'var(--colors-badge-variant-warning-subtle-text)', border: '1px solid var(--colors-badge-variant-warning-subtle-border)' },
  'Classification needs review': { bg: 'var(--colors-badge-variant-info-subtle-background)',    color: 'var(--colors-badge-variant-info-subtle-text)',    border: '1px solid var(--colors-badge-variant-info-subtle-border)'    },
  'Related denial needs review': { bg: 'var(--colors-badge-variant-info-subtle-background)',    color: 'var(--colors-badge-variant-info-subtle-text)',    border: '1px solid var(--colors-badge-variant-info-subtle-border)'    },
  'Missing Data':                { bg: 'var(--colors-badge-variant-default-subtle-background)', color: 'var(--colors-badge-variant-default-subtle-text)', border: '1px solid var(--colors-badge-variant-default-subtle-border)' },
  'System error':                { bg: 'var(--colors-badge-variant-error-subtle-background)',   color: 'var(--colors-badge-variant-error-subtle-text)',   border: '1px solid var(--colors-badge-variant-error-subtle-border)'   },
}

// V2 palette: chip color follows the alert-message variant used inside the edit-denial-details page
// — warning (amber) for any "needs review" category, info (blue) for the "Missing Data" info alert.
const REVIEW_CATEGORY_STYLE_V2: Record<string, { bg: string; color: string; border: string }> = {
  'Data needs review':           { bg: 'var(--colors-badge-variant-warning-subtle-background)', color: 'var(--colors-badge-variant-warning-subtle-text)', border: '1px solid var(--colors-badge-variant-warning-subtle-border)' },
  'Classification needs review': { bg: 'var(--colors-badge-variant-warning-subtle-background)', color: 'var(--colors-badge-variant-warning-subtle-text)', border: '1px solid var(--colors-badge-variant-warning-subtle-border)' },
  'Related denial needs review': { bg: 'var(--colors-badge-variant-warning-subtle-background)', color: 'var(--colors-badge-variant-warning-subtle-text)', border: '1px solid var(--colors-badge-variant-warning-subtle-border)' },
  'Missing Data':                { bg: 'var(--colors-badge-variant-info-subtle-background)',    color: 'var(--colors-badge-variant-info-subtle-text)',    border: '1px solid var(--colors-badge-variant-info-subtle-border)'    },
  'System error':                { bg: 'var(--colors-badge-variant-error-subtle-background)',   color: 'var(--colors-badge-variant-error-subtle-text)',   border: '1px solid var(--colors-badge-variant-error-subtle-border)'   },
}

const FALLBACK_REVIEW_STYLE = { bg: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }

function getReviewStyle(category: string | null | undefined, unified?: boolean) {
  if (!category) return FALLBACK_REVIEW_STYLE
  const map = unified ? REVIEW_CATEGORY_STYLE_V2 : REVIEW_CATEGORY_STYLE_V1
  return map[category] ?? FALLBACK_REVIEW_STYLE
}

const EXISTING_REVIEW_CATEGORY: Partial<Record<NeedsReviewReason, string>> = {
  missing_fields:            'Missing Data',
  no_clinical_data:          'Missing Data',
  letter_generation_failure: 'System error',
  extraction_failure:        'System error',
}

const EXISTING_REVIEW_SECONDARY: Partial<Record<NeedsReviewReason, string>> = {
  low_confidence:            'Encounter not found',
  low_confidence_patient:    'Missing patient info',
  no_patient_match:          'Encounter not found',
  no_claim_match:            'Missing ICD-10 codes',
  missing_fields:            'Visit not available',
  no_clinical_data:          'Clinical data not available',
  letter_generation_failure: 'Letter generation failed',
  extraction_failure:        'Data extraction failed',
}

const SECTION_TITLE: Record<NeedsReviewReason, string> = {
  missing_fields:            'Missing fields',
  low_confidence:            'Low confidence extraction',
  low_confidence_patient:    'Patient info',
  no_patient_match:          'Patient match',
  no_claim_match:            'Claim match',
  ambiguous_classification:  'Classification',
  possible_duplicate:        'Related denial needs review',
  existing_instance_found:   'Related denial needs review',
  no_clinical_data:          'Clinical data',
  letter_generation_failure: 'Letter generation',
  extraction_failure:        'Data extraction',
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
  if (!classifiedAs) return { label: '–', color: 'var(--colors-grey-6)', isUnknown: true }
  return { label: denialTypeFromClassified(classifiedAs), color: 'var(--colors-badge-variant-warning-emphasized)', isUnknown: false }
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
  match:    { label: 'Match',         bg: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)' },
  partial:  { label: 'Partial match', bg: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)' },
  mismatch: { label: 'Mismatch',      bg: 'var(--colors-badge-variant-error-background)', color: 'var(--colors-badge-variant-error-text)' },
  unknown:  { label: 'Unknown',       bg: 'var(--colors-grey-3)', color: 'var(--colors-grey-7)' },
}

function MatchFactorRow({ label, status }: { label: string; status: keyof typeof FACTOR_STATUS_STYLE }) {
  const s = FACTOR_STATUS_STYLE[status] ?? FACTOR_STATUS_STYLE.unknown
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>{label}</Typography>
      <Chip label={s.label} size="small" sx={{ height: 16, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-semibold)', '& .MuiChip-label': { px: 0.75 }, bgcolor: s.bg, color: s.color }} />
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
      fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', flexShrink: 0,
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
        height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number,
        bgcolor: cfg.bg, color: cfg.color, border: cfg.border,
        '& .MuiChip-label': { px: 1 },
        ...(status === 'processing' ? { animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } } : {}),
      }}
    />
  )
}

function CodeValue({ value, label, fontSize = '0.6875rem' }: { value: string; label: string; fontSize?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, '&:hover .code-copy-icon': { opacity: 1 } }}>
      <Typography sx={{ fontSize, fontVariantNumeric: 'tabular-nums', color: 'var(--colors-grey-8)', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} placement="top">
        <IconButton
          className="code-copy-icon"
          size="small"
          aria-label={`Copy ${label} ${value}`}
          onClick={handleCopy}
          sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: copied ? 'var(--colors-badge-variant-success-icon)' : 'text.disabled', '&:focus-visible': { opacity: 1 } }}
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
  reason, record, onResolved, onDecision, mode, onSearch, unifiedAlertColors,
}: {
  reason: NeedsReviewReason
  record: StagingRecord
  onResolved: (reason: NeedsReviewReason) => void
  onDecision?: (reason: NeedsReviewReason, decision: string) => void
  mode?: 'existing'
  onSearch?: () => void
  unifiedAlertColors?: boolean
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
  const catColor = getReviewStyle(REVIEW_CATEGORY[reason], unifiedAlertColors).color

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
      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', borderColor: 'var(--colors-badge-variant-error-border)' }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 0, alignItems: 'flex-start', bgcolor: 'var(--colors-badge-variant-error-subtle)' }}
          action={
            <Button color="inherit" size="small" sx={{ fontSize: 'var(--font-sizes-12)', whiteSpace: 'nowrap' }}>
              Contact support
            </Button>
          }
        >
          <AlertTitle sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)' }}>Visit not available</AlertTitle>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>
            Denial date {dosDate} is before the supported start date April 1, 2026.
          </Typography>
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
      {isRelatedInstance ? (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.375 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)' }}>Related instance</Typography>
          </Box>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
            We found an existing denial that this signal may belong to.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.primary' }}>
            {mode === 'existing' && reason === 'low_confidence' ? 'Encounter not found' : SECTION_TITLE[reason]}
          </Typography>
        </Box>
      )}

      {reason === 'no_patient_match' && (
        <Box>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
            Extracted: "{String(ext.extractedPatientName)}" · DOB {String(ext.extractedDob)}. Select a match or enter manually.
          </Typography>
          {(ext.patientCandidates as Array<{ mrn: string; name: string; dob: string; matchSignals: string[] }>).map(c => (
            <Box
              key={c.mrn}
              onClick={() => setSelectedCandidate(c.mrn)}
              sx={{
                p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: selectedCandidate === c.mrn ? 'var(--colors-badge-variant-info-icon)' : 'divider',
                bgcolor: selectedCandidate === c.mrn ? 'var(--colors-badge-variant-info-background)' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>{c.name}</Typography>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                {c.mrn} · DOB {c.dob} · Matched on: {c.matchSignals.join(', ')}
              </Typography>
            </Box>
          ))}
          <TextField
            size="small" fullWidth placeholder="Or enter MRN manually"
            value={manualEntry} onChange={e => setManualEntry(e.target.value)}
            sx={{ mt: 0.5, '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
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
                    <TextField {...params} placeholder="ICD-10 code" sx={{ '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }} />
                  )}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ flex: '0 0 160px' }}>
                  <Select
                    displayEmpty
                    value={row.adjustment}
                    onChange={e => setDiagnosisRows(prev => prev.map((r, j) => j === i ? { ...r, adjustment: e.target.value } : r))}
                    renderValue={v => v ? { removed: 'Removed', changed_to_principal: 'Changed to Principal', unchanged: 'Unchanged' }[v] ?? v : <span style={{ color: 'var(--colors-grey-6)', fontSize: 'var(--font-sizes-14)' }}>Payer adjustment</span>}
                    sx={{ fontSize: 'var(--font-sizes-14)' }}
                  >
                    <MenuItem value="removed" sx={{ fontSize: 'var(--font-sizes-14)' }}>Removed</MenuItem>
                    <MenuItem value="changed_to_principal" sx={{ fontSize: 'var(--font-sizes-14)' }}>Changed to Principal</MenuItem>
                    <MenuItem value="unchanged" sx={{ fontSize: 'var(--font-sizes-14)' }}>Unchanged</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ))}
            <Button
              size="small"
              onClick={() => setDiagnosisRows(prev => [...prev, { code: '', adjustment: '' }])}
              sx={{ p: 0, fontSize: 'var(--font-sizes-14)' }}
            >
              + Diagnosis
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
              Claim ID "{String(ext.claimId)}" was not found. Enter the correct claim ID or HAR.
            </Typography>
            <TextField
              size="small" fullWidth placeholder="Claim ID or HAR"
              value={manualEntry} onChange={e => setManualEntry(e.target.value)}
              sx={{ '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
            />
          </Box>
        )
      )}

      {reason === 'ambiguous_classification' && (
        <Box>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
            This signal could be classified as:
          </Typography>
          {(mode === 'existing' ? EXISTING_DENIAL_TYPES : (ext.classificationOptions as Array<{ module: string; label: string; explanation: string }>)).map(opt => (
            <Box
              key={opt.module}
              onClick={() => setSelectedClassification(opt.module)}
              sx={{
                p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: selectedClassification === opt.module ? 'var(--colors-badge-variant-info-icon)' : 'divider',
                bgcolor: selectedClassification === opt.module ? 'var(--colors-badge-variant-info-background)' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>{opt.label}</Typography>
              {!(mode === 'existing' && (opt.module === 'drg_downgrade' || opt.module === 'medical_necessity')) && (
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>{opt.explanation}</Typography>
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
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Existing instance
                  </Typography>
                  <Button size="small" sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-12)', lineHeight: 1 }}>
                    View instance
                  </Button>
                </Box>
                <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)', mb: 0.5 }}>
                  {mode === 'existing' ? inst.denialType.replace(/^Denial\s*[—–-]\s*/, '') : inst.denialType}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Chip label={inst.status} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-semibold)', '& .MuiChip-label': { px: 0.75 }, bgcolor: 'var(--colors-badge-variant-info-background)', color: 'var(--colors-badge-variant-info-emphasized)' }} />
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                    {inst.owner} · {inst.worklist}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                    Updated {formatRelative(inst.lastUpdated)}
                  </Typography>
                  {mode !== 'existing' && (
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)' }}>
                      {formatCurrency(inst.deniedAmount)}
                    </Typography>
                  )}
                </Box>
              </Paper>
            )
          })()}

          {/* Decision section */}
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.07em', textTransform: 'uppercase', mb: 0.75 }}>
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
                borderColor: selectedAttach === opt.value ? 'var(--colors-badge-variant-info-icon)' : 'divider',
                bgcolor: selectedAttach === opt.value ? 'var(--colors-badge-variant-info-background)' : 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>{opt.label}</Typography>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>{opt.desc}</Typography>
            </Box>
          ))}

          {/* Instance picker for "attach to different" */}
          {selectedAttach === 'attach_different' && (
            <Box sx={{ mt: 0.5, mb: 0.75 }}>
              <TextField
                size="small" fullWidth
                placeholder="Search by patient, MRN, claim ID, payer, or amount"
                sx={{ mb: 0.75, '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
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
                    borderColor: selectedDifferent === r.id ? 'var(--colors-badge-variant-info-icon)' : 'divider',
                    bgcolor: selectedDifferent === r.id ? 'var(--colors-badge-variant-info-background)' : 'background.paper',
                  }}
                >
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>{r.label}</Typography>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>{r.sub}</Typography>
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
                sx={{ p: 0, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.disabled', minWidth: 0 }}
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
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
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
              sx={{ mb: 0.75, '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
            />
          ))}
        </Box>
      )}

      {reason === 'low_confidence' && (
        mode === 'existing' ? (
          <Box>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
              Encounter not found. Select a match or search to find the encounter.
            </Typography>
            {(ext.patientCandidates as Array<{ mrn: string; name: string; dob: string; matchSignals: string[] }> ?? []).map(c => (
              <Box
                key={c.mrn}
                onClick={() => setSelectedCandidate(c.mrn)}
                sx={{
                  p: 1.25, mb: 0.75, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                  borderColor: selectedCandidate === c.mrn ? 'var(--colors-badge-variant-info-icon)' : 'divider',
                  bgcolor: selectedCandidate === c.mrn ? 'var(--colors-badge-variant-info-background)' : 'background.paper',
                }}
              >
                <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>{c.name}</Typography>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                  {c.mrn} · DOB {c.dob} · Matched on: {c.matchSignals.join(', ')}
                </Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <TextField
                size="small" fullWidth placeholder="Or enter HAR to search manually"
                value={manualEntry} onChange={e => setManualEntry(e.target.value)}
                sx={{ '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
              />
              <Button
                size="small"
                onClick={onSearch}
                sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-14)', flexShrink: 0 }}
              >
                Search
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 1 }}>
              OCR confidence was low on some fields. Please verify or correct:
            </Typography>
            {ext.ocrConfidence && Object.entries(ext.ocrConfidence as Record<string, number>)
              .filter(([, conf]) => conf < 0.75)
              .map(([field]) => (
                <Box key={field} sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.25 }}>
                    {field.replace(/([A-Z])/g, ' $1').replace(/^(.)/, s => s.toUpperCase())}
                  </Typography>
                  <TextField
                    size="small" fullWidth
                    defaultValue={String(record.extraction[field] ?? '')}
                    onChange={e => { if (e.target.value) setManualEntry(e.target.value) }}
                    sx={{ '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
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
          sx={{ mt: 1.5, fontSize: 'var(--font-sizes-12)' }}
        >
          Mark resolved
        </Button>
      )}
    </Paper>
  )
}

// ── CompletionPanel ────────────────────────────────────────────────────────────

function CompletionPanel({
  onClose, onViewHistory,
}: {
  onClose: () => void
  onViewHistory: () => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
        <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2.5, p: 4 }}>
        <CheckCircleOutlined sx={{ fontSize: 52, color: 'var(--colors-badge-variant-success-icon)' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 'var(--font-weights-bold)', color: 'var(--colors-grey-10)', mb: 0.75 }}>
            All caught up
          </Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary' }}>
            There are no more exceptions matching this view.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 240 }}>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
          <Button variant="outlined" onClick={onViewHistory}>
            View history
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

// ── ReviewPanel ───────────────────────────────────────────────────────────────

function ReviewPanel({
  record, reviewIndex, reviewTotal,
  onClose, onPrev, onNext,
  onAccept, onAcceptAndNext, onDismiss, onSkip, mode, onNavigate, onEditDenialDetails, unifiedAlertColors,
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
  onNavigate?: (nav: string, returnContext?: ReturnContext) => void
  onEditDenialDetails?: () => void
  unifiedAlertColors?: boolean
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* Sequential nav strip */}
      <Box sx={{ px: 2.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: 'var(--colors-grey-2)', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', flex: 1 }}>
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
          <Typography sx={{ fontWeight: 'var(--font-weights-semibold)', fontSize: 'var(--font-sizes-14)' }}>
            {formatPatientName(record.patientName)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {record.payer ?? '—'} · {mode === 'existing' ? 'PDF Denial' : SIGNAL_LABELS[record.signalType]} · {formatTime(record.receivedAt)}
          </Typography>
        </Box>
        {record.reviewReasons.length > 0 && (() => {
          const cat = REVIEW_CATEGORY[record.reviewReasons[0]]
          const catStyle = getReviewStyle(cat, unifiedAlertColors)
          return (
            <Chip label={cat} size="small" sx={{ height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: catStyle.bg, color: catStyle.color, border: catStyle.border, '& .MuiChip-label': { px: 1 } }} />
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
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {unresolvedCount > 0 ? 'Action needed' : 'Ready to save'}
                </Typography>
                {unresolvedCount === 0 && <CheckCircleOutlined sx={{ fontSize: 14, color: 'var(--colors-badge-variant-success-icon)' }} />}
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {record.reviewReasons.map(r => (
                <IssueCard key={`${record.id}-${r}`} reason={r} record={record} onResolved={handleResolved} onDecision={handleDecision} mode={mode} onSearch={onNavigate ? () => onNavigate('new-denial', { tab: 'exceptions', recordId: record.id }) : undefined} unifiedAlertColors={unifiedAlertColors} />
              ))}
            </Box>
          </Box>
        )}

        {/* Classification */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classification
            </Typography>
            {mode === 'existing' && (onEditDenialDetails ?? onNavigate) && (
              <Button
                size="small"
                endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                onClick={() => onEditDenialDetails ? onEditDenialDetails() : onNavigate?.('new-denial-details', { tab: 'exceptions', recordId: record.id })}
                sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-12)', lineHeight: 1.2 }}
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
                    ? <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>–</Typography>
                    : <Chip label={typeChip?.label} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)', '& .MuiChip-label': { px: 0.75 } }} />
                ) : (
                  <>
                    <Chip label={MODULE_TAG[record.module].label} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', bgcolor: MODULE_TAG[record.module].bg, color: MODULE_TAG[record.module].color, '& .MuiChip-label': { px: 0.75 } }} />
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>{record.classifiedAs}</Typography>
                  </>
                )}
              </Box>
              {ext.denialLanguage && (
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mt: 0.25 }}>
                  "{String(ext.denialLanguage)}"
                </Typography>
              )}
              {(ext.carc || ext.rarc || ext.auditType) && mode !== 'existing' && (
                <Box sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => setClassificationExpanded(p => !p)}
                    endIcon={classificationExpanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                    sx={{ fontSize: 'var(--font-sizes-12)', p: 0 }}
                  >
                    How was this classified?
                  </Button>
                  {classificationExpanded && (
                    <Box sx={{ mt: 0.75, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                      {ext.carc && <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>→ CARC {String(ext.carc)} detected in 835</Typography>}
                      {ext.rarc && <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>→ RARC {String(ext.rarc)}</Typography>}
                      {ext.auditType && <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>→ Audit type: {String(ext.auditType)}</Typography>}
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>—</Typography>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Patient */}
        {!(mode === 'existing' && (record.reviewReasons.includes('low_confidence') || record.reviewReasons.includes('no_patient_match'))) && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {mode === 'existing' ? 'Encounter Match' : 'Patient Match'}
              </Typography>
              {mode === 'existing' ? (
                <Button
                  size="small"
                  endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                  onClick={() => onNavigate?.('new-denial', { tab: 'exceptions', recordId: record.id })}
                  sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-12)', lineHeight: 1.2 }}
                >
                  Change encounter
                </Button>
              ) : (
                ext.patientMatchConfidence && (
                  <Chip label={`${String(ext.patientMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: 'var(--font-sizes-10)', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.patientMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-background)' : 'var(--colors-badge-variant-warning-background)', color: ext.patientMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-text)' : 'var(--colors-badge-variant-warning-text)' }} />
                )
              )}
            </Box>
            {record.patientName ? (
              <>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>{formatPatientName(record.patientName)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  {record.patientMrn && <CodeValue value={record.patientMrn} label="MRN" fontSize="0.75rem" />}
                  {ext.patientMatchMethod && (
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                      · Matched via {String(ext.patientMatchMethod)}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>Not matched</Typography>
            )}
          </Box>
        )}

        {/* Claim */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {mode === 'existing' ? 'Claim' : 'Claim Match'}
            </Typography>
            {mode !== 'existing' && ext.claimMatchConfidence && (
              <Chip label={`${String(ext.claimMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: 'var(--font-sizes-10)', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.claimMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-background)' : 'var(--colors-badge-variant-warning-background)', color: ext.claimMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-text)' : 'var(--colors-badge-variant-warning-text)' }} />
            )}
          </Box>
          {ext.claimId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>Claim</Typography>
              <CodeValue value={String(ext.claimId)} label="Claim ID" fontSize="0.75rem" />
            </Box>
          )}
          {ext.har && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>HAR</Typography>
              <CodeValue value={String(ext.har)} label="HAR" fontSize="0.75rem" />
            </Box>
          )}
          {ext.dos && <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>DOS {String(ext.dos)}</Typography>}
        </Box>

        {/* Financials */}
        {record.amount !== null && mode !== 'existing' && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
              Amount
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>
              {formatCurrency(record.amount)}
            </Typography>
            {ext.billedAmount && (
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                Billed {formatCurrency(Number(ext.billedAmount))} · Paid {formatCurrency(Number(ext.paidAmount))}
              </Typography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Routing preview — new system only */}
        {mode !== 'existing' && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>
              Routing Preview
            </Typography>
            {record.module !== 'unknown' ? (
              <Box sx={{ p: 1.25, bgcolor: 'var(--colors-grey-2)', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)' }}>
                  → {record.module === 'denial' ? 'Denials Worklist' : record.module === 'underpayment' ? 'Underpayments Worklist' : 'Audits Worklist'}
                </Typography>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                  Will be assigned based on routing rules
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>
                Routing will be determined after classification
              </Typography>
            )}
          </Box>
        )}

        {/* Dismiss panel */}
        {showDismiss && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, mt: 2 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)', mb: 1.5 }}>Why are you dismissing this signal?</Typography>
            <RadioGroup value={dismissReason} onChange={e => setDismissReason(e.target.value)}>
              {DISMISS_REASONS.map(r => (
                <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={<Typography sx={{ fontSize: 'var(--font-sizes-14)' }}>{r}</Typography>} />
              ))}
            </RadioGroup>
            {dismissReason === 'Other' && (
              <TextField size="small" fullWidth placeholder="Describe reason" value={dismissOther} onChange={e => setDismissOther(e.target.value)} sx={{ mt: 1, '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }} />
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Button size="small" onClick={() => setShowDismiss(false)} sx={{ fontSize: 'var(--font-sizes-14)' }}>Cancel</Button>
              <Button
                size="small" variant="contained" color="error"
                disabled={!dismissReason || (dismissReason === 'Other' && !dismissOther)}
                onClick={() => onDismiss(record.id, dismissReason === 'Other' ? dismissOther : dismissReason)}
                sx={{ fontSize: 'var(--font-sizes-14)' }}
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
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            Dismiss
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Skip — always visible */}
        <Button
          variant="text" size="small"
          onClick={() => guardNav(onSkip, 'skip')}
          sx={{ fontSize: 'var(--font-sizes-14)' }}
        >
          Skip
        </Button>

        {/* Save only — visible when resolved */}
        {canAccept && (
          <Button
            variant="outlined" size="small"
            onClick={() => onAccept(record.id, matchDecision ?? undefined)}
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            {ctaSaveLabel}
          </Button>
        )}

        {/* Primary CTA */}
        {canAccept ? (
          <Button
            variant="contained" size="small"
            onClick={() => onAcceptAndNext(record.id, matchDecision ?? undefined)}
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            {ctaNextLabel}
          </Button>
        ) : (
          <Tooltip title={`Resolve ${unresolvedCount} issue${unresolvedCount > 1 ? 's' : ''} above to continue`}>
            <span>
              <Button variant="contained" size="small" disabled sx={{ fontSize: 'var(--font-sizes-14)' }}>
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
        <DialogTitle sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)', pb: 1 }}>
          Unsaved changes
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary' }}>
            You have unsaved changes. Save before moving on?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 0.5 }}>
          <Button
            size="small"
            onClick={() => setPendingAction(null)}
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => executePending(false)}
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            Discard changes
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={!canAccept}
            onClick={() => executePending(true)}
            sx={{ fontSize: 'var(--font-sizes-14)' }}
          >
            Save & continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── InProgressDrawer ──────────────────────────────────────────────────────────

function InProgressDrawer({
  record, onClose, mode, onNavigate,
}: {
  record: StagingRecord
  onClose: () => void
  mode?: 'existing'
  onNavigate?: (nav: string, returnContext?: ReturnContext) => void
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
      <Box sx={{ px: 2.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: 'var(--colors-grey-2)', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', flex: 1 }}>
          Generating letter
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>

      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 'var(--font-weights-semibold)', fontSize: 'var(--font-sizes-14)' }}>
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
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Classification
            </Typography>
            {mode === 'existing' && (
              <Button
                size="small"
                endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                onClick={() => onNavigate?.('new-denial-details', { tab: 'in-progress', recordId: record.id })}
                sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-12)', lineHeight: 1.2 }}
              >
                Edit denial details
              </Button>
            )}
          </Box>
          {record.classifiedAs ? (
            typeChip?.isUnknown
              ? <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>–</Typography>
              : <Chip label={typeChip?.label} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)', '& .MuiChip-label': { px: 0.75 } }} />
          ) : (
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>—</Typography>
          )}
          {ext.denialLanguage && (
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mt: 0.5 }}>
              "{String(ext.denialLanguage)}"
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Patient */}
        {!(mode === 'existing' && (record.reviewReasons.includes('low_confidence') || record.reviewReasons.includes('no_patient_match'))) && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {mode === 'existing' ? 'Encounter Match' : 'Patient Match'}
              </Typography>
              {mode === 'existing' ? (
                <Button
                  size="small"
                  endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
                  onClick={() => onNavigate?.('new-denial', { tab: 'in-progress', recordId: record.id })}
                  sx={{ p: 0, minWidth: 0, fontSize: 'var(--font-sizes-12)', lineHeight: 1.2 }}
                >
                  Change encounter
                </Button>
              ) : (
                ext.patientMatchConfidence && (
                  <Chip label={`${String(ext.patientMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: 'var(--font-sizes-10)', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.patientMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-background)' : 'var(--colors-badge-variant-warning-background)', color: ext.patientMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-text)' : 'var(--colors-badge-variant-warning-text)' }} />
                )
              )}
            </Box>
            {record.patientName ? (
              <>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>{formatPatientName(record.patientName)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  {record.patientMrn && <CodeValue value={record.patientMrn} label="MRN" fontSize="0.75rem" />}
                  {ext.patientMatchMethod && (
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                      · Matched via {String(ext.patientMatchMethod)}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>Not matched</Typography>
            )}
          </Box>
        )}

        {/* Claim */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {mode === 'existing' ? 'Claim' : 'Claim Match'}
            </Typography>
            {mode !== 'existing' && ext.claimMatchConfidence && (
              <Chip label={`${String(ext.claimMatchConfidence)} confidence`} size="small" sx={{ height: 16, fontSize: 'var(--font-sizes-10)', '& .MuiChip-label': { px: 0.75 }, bgcolor: ext.claimMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-background)' : 'var(--colors-badge-variant-warning-background)', color: ext.claimMatchConfidence === 'high' ? 'var(--colors-badge-variant-success-text)' : 'var(--colors-badge-variant-warning-text)' }} />
            )}
          </Box>
          {ext.claimId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>Claim</Typography>
              <CodeValue value={String(ext.claimId)} label="Claim ID" fontSize="0.75rem" />
            </Box>
          )}
          {ext.har && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>HAR</Typography>
              <CodeValue value={String(ext.har)} label="HAR" fontSize="0.75rem" />
            </Box>
          )}
          {ext.dos && <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>DOS {String(ext.dos)}</Typography>}
        </Box>

        {/* Appeal Plan */}
        {appealPlan && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Appeal Plan
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', mb: 0.375 }}>Strategy</Typography>
                <Typography sx={{ fontSize: 'var(--font-sizes-14)', mb: 1.25 }}>{appealPlan.strategy}</Typography>

                {appealPlan.keyArguments.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', mb: 0.5 }}>Key arguments</Typography>
                    {appealPlan.keyArguments.map((arg, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled', flexShrink: 0, mt: '1px' }}>·</Typography>
                        <Typography sx={{ fontSize: 'var(--font-sizes-12)' }}>{arg}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {appealPlan.supportingEvidence.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', mb: 0.5 }}>Supporting evidence</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {appealPlan.supportingEvidence.map((e, i) => (
                        <Chip key={i} label={e} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', bgcolor: 'var(--colors-grey-3)', color: 'var(--colors-grey-8)', '& .MuiChip-label': { px: 0.75 } }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>

              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', mb: 0.375 }}>
                Corrections or additional notes
              </Typography>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.75 }}>
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
                sx={{ '& .MuiInputBase-input': { fontSize: 'var(--font-sizes-14)' } }}
              />
              {planNotes.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setNotesSaved(true)}
                  sx={{ mt: 1, fontSize: 'var(--font-sizes-12)', color: notesSaved ? 'var(--colors-badge-variant-success-icon)' : undefined, borderColor: notesSaved ? 'var(--colors-badge-variant-success-icon)' : undefined }}
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
        <Button variant="outlined" size="small" onClick={onClose} sx={{ fontSize: 'var(--font-sizes-14)' }}>
          Close
        </Button>
      </Box>
    </Drawer>
  )
}

// ── InProgressTab ─────────────────────────────────────────────────────────────

function InProgressTab({ records, mode, onNavigate, initialDrawerRecordId, inlinePanels }: { records: StagingRecord[]; mode?: 'existing'; onNavigate?: (nav: string, returnContext?: ReturnContext) => void; initialDrawerRecordId?: string | null; inlinePanels?: boolean }) {
  const [drawerRecordId, setDrawerRecordId] = useState<string | null>(initialDrawerRecordId ?? null)

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
      <Box sx={{ px: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'var(--colors-grey-2)', flexShrink: 0 }}>
        <Typography sx={{ flex: 1, ...COL_HEADER_SX }}>Patient</Typography>
        {!inlinePanels && <Typography sx={{ width: 150, flexShrink: 0, ...COL_HEADER_SX }}>Payer</Typography>}
        {!inlinePanels && <Typography sx={{ width: 140, flexShrink: 0, ...COL_HEADER_SX }}>Type</Typography>}
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
                bgcolor: drawerRecordId === record.id ? 'var(--colors-grey-2)' : 'var(--colors-grey-1)',
                '&:hover': { bgcolor: 'var(--colors-grey-2)' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.patientName ? formatPatientName(record.patientName) : <span style={{ color: 'var(--colors-grey-6)', fontStyle: 'italic', fontWeight: 'var(--font-weights-regular)' as unknown as number }}>Unknown patient</span>}
                </Typography>
                {record.patientMrn && <CodeValue value={record.patientMrn} label="MRN" />}
                {!record.patientName && record.sourceFile && (
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>{record.sourceFile}</Typography>
                )}
              </Box>
              {!inlinePanels && (
                <Typography sx={{ width: 150, flexShrink: 0, fontSize: 'var(--font-sizes-12)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.payer ?? '—'}
                </Typography>
              )}
              {!inlinePanels && (
                <Box sx={{ width: 140, flexShrink: 0 }}>
                  {typeDisplay && !typeDisplay.isUnknown ? (
                    <Chip label={typeDisplay.label} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-regular)' as unknown as number, '& .MuiChip-label': { px: 0.75 }, bgcolor: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }} />
                  ) : (
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>—</Typography>
                  )}
                </Box>
              )}
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <StatusChip status="processing" />
              </Box>
              <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
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
          onNavigate={onNavigate}
        />
      )}
    </Box>
  )
}

// ── InlineEditDenialDetailsPanel ──────────────────────────────────────────────

const EDIT_LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']
const EDIT_DRG_REVIEW_TYPE_OPTIONS = ['Clinical Validation Review', 'Coding Audit']
const EDIT_PAYER_OPTIONS = ['Aetna', 'BCBS', 'CMS / Medicare', 'Cigna', 'Humana', 'UnitedHealthcare']
const EDIT_REVIEW_ENTITY_OPTIONS = ['Cotiviti', 'Optum', 'Performant']

function parseDenialTypeFromClassification(classifiedAs: string | null): 'drg_downgrade' | 'medical_necessity' | 'other' {
  if (!classifiedAs) return 'other'
  const l = classifiedAs.toLowerCase()
  if (l.includes('drg')) return 'drg_downgrade'
  if (l.includes('medical necessity')) return 'medical_necessity'
  return 'other'
}

function InlineEditDenialDetailsPanel({
  record,
  onBack,
}: {
  record: StagingRecord
  onBack: () => void
}) {
  const ext = record.extraction
  const [denialType, setDenialType] = useState<'drg_downgrade' | 'medical_necessity' | 'other'>(
    parseDenialTypeFromClassification(record.classifiedAs)
  )
  const [drgReviewType, setDrgReviewType] = useState('Clinical Validation Review')
  const [level, setLevel] = useState('Level 2')
  const [payer, setPayer] = useState(record.payer ?? '')
  const [deadlineISO, setDeadlineISO] = useState((ext.deadline as string) ?? '')
  const [reviewEntity, setReviewEntity] = useState('')
  const [payerRationale, setPayerRationale] = useState('')

  const SECTION_LABEL_SX = {
    fontSize: 'var(--font-sizes-12)' as const,
    fontWeight: 'var(--font-weights-semibold)',
    color: 'text.secondary' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  }

  const FIELD_LABEL_SX = {
    fontSize: 'var(--font-sizes-12)' as const,
    color: 'text.secondary' as const,
    mb: 0.5,
  }

  const encFields: { label: string; value: string | null; mono?: boolean }[] = [
    { label: 'Name',          value: record.patientName },
    { label: 'HAR',           value: (ext.har as string) ?? null,  mono: true },
    { label: 'MRN',           value: record.patientMrn,             mono: true },
    { label: 'DOS',           value: (ext.dos as string) ?? null },
    { label: 'Date of Birth', value: null },
    { label: 'Visit ID',      value: null },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>

      {/* Nav strip — matches ReviewPanel's nav strip exactly */}
      <Box sx={{
        px: 2.5, py: 0.875,
        borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center',
        bgcolor: 'var(--colors-grey-2)', flexShrink: 0,
      }}>
        <Button
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={onBack}
          sx={{ fontSize: 'var(--font-sizes-12)', p: 0, minWidth: 0, color: 'text.secondary', fontWeight: 'var(--font-weights-regular)' }}
        >
          Back to review
        </Button>
      </Box>

      {/* Header — matches ReviewPanel's patient header */}
      <Box sx={{
        px: 2.5, py: 2,
        borderBottom: '1px solid', borderColor: 'divider',
        flexShrink: 0,
      }}>
        <Typography sx={{ fontWeight: 'var(--font-weights-semibold)', fontSize: 'var(--font-sizes-14)' }}>
          Edit Denial Details
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {record.patientName ? formatPatientName(record.patientName) : '—'}
          {record.payer ? ` · ${record.payer}` : ''}
        </Typography>
      </Box>

      {/* Body — same flex/overflow/padding as ReviewPanel body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* Encounter */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1 }}>Encounter</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 20px' }}>
            {encFields.map(({ label, value, mono }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                  {label}
                </Typography>
                {value ? (
                  mono
                    ? <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{value}</Typography>
                    : <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)' }}>{value}</Typography>
                ) : (
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.disabled' }}>—</Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Denial Type */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Denial Type</Typography>
          <RadioGroup
            value={denialType}
            onChange={e => setDenialType(e.target.value as typeof denialType)}
          >
            <FormControlLabel
              value="drg_downgrade"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: 'var(--font-sizes-14)' }}>DRG Downgrade</Typography>}
            />
            {denialType === 'drg_downgrade' && (
              <Box sx={{ ml: '30px', my: 0.5 }}>
                <Typography sx={{ ...FIELD_LABEL_SX, mb: 0.25 }}>Review type</Typography>
                <RadioGroup value={drgReviewType} onChange={e => setDrgReviewType(e.target.value)}>
                  {EDIT_DRG_REVIEW_TYPE_OPTIONS.map(o => (
                    <FormControlLabel
                      key={o}
                      value={o}
                      control={<Radio size="small" sx={{ py: 0.25, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
                      label={<Typography sx={{ fontSize: 'var(--font-sizes-14)' }}>{o}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </Box>
            )}
            <FormControlLabel
              value="medical_necessity"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: 'var(--font-sizes-14)' }}>Medical Necessity</Typography>}
            />
            <FormControlLabel
              value="other"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: 'var(--font-sizes-14)' }}>Other</Typography>}
            />
          </RadioGroup>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Denial Logistics */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Denial Logistics</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={FIELD_LABEL_SX}>Level</Typography>
                <FormControl size="small" fullWidth>
                  <Select value={level} onChange={e => setLevel(e.target.value)}>
                    {EDIT_LEVEL_OPTIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={FIELD_LABEL_SX}>Appeal Deadline</Typography>
                <TextField
                  size="small"
                  type="date"
                  fullWidth
                  value={deadlineISO}
                  onChange={e => setDeadlineISO(e.target.value)}
                />
              </Box>
            </Box>
            <Box>
              <Typography sx={FIELD_LABEL_SX}>Payer</Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={payer}
                  onChange={e => setPayer(e.target.value)}
                  displayEmpty
                  renderValue={payer ? undefined : () => <span style={{ color: 'var(--colors-text-disabled)' }}>Select payer</span>}
                >
                  {EDIT_PAYER_OPTIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography sx={FIELD_LABEL_SX}>
                Review Entity{' '}
                <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-disabled)' }}>
                  (optional)
                </Typography>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={reviewEntity}
                  onChange={e => setReviewEntity(e.target.value)}
                  displayEmpty
                  renderValue={reviewEntity ? undefined : () => <span style={{ color: 'var(--colors-text-disabled)' }}>Search review entity</span>}
                >
                  {EDIT_REVIEW_ENTITY_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Payer Adjustments — DRG only */}
        {denialType === 'drg_downgrade' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Payer Adjustments</Typography>
              <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
                Add the diagnoses and procedures the payer adjusted.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)', mb: 0.75 }}>Adjusted Diagnoses</Typography>
                  <Button
                    size="small"
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    sx={{ fontSize: 'var(--font-sizes-14)', p: 0, textTransform: 'none', color: 'var(--colors-ocean-4)' }}
                  >
                    Add Diagnosis Code
                  </Button>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)', mb: 0.75 }}>Adjusted Procedures</Typography>
                  <Button
                    size="small"
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    sx={{ fontSize: 'var(--font-sizes-14)', p: 0, textTransform: 'none', color: 'var(--colors-ocean-4)' }}
                  >
                    Add Procedure
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Payer Rationale */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Payer Rationale</Typography>
          <TextField
            multiline
            fullWidth
            size="small"
            value={payerRationale}
            onChange={e => setPayerRationale(e.target.value)}
            placeholder="Enter the payer's rationale for denial…"
            minRows={4}
          />
        </Box>

      </Box>

      {/* Footer — matches ReviewPanel's action footer */}
      <Box sx={{
        borderTop: '1px solid', borderColor: 'divider',
        px: 2.5, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5,
        bgcolor: 'background.paper', flexShrink: 0,
      }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onBack}
          sx={{ fontSize: 'var(--font-sizes-14)' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onBack}
          sx={{ fontSize: 'var(--font-sizes-14)' }}
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}

// ── ExceptionsTab ─────────────────────────────────────────────────────────────

function ExceptionsTab({
  records, onUpdate, onNavigate, onSwitchToHistory, mode, initialDrawerRecordId, inlinePanels,
  newDenialPanelOpen, onNewDenialPanelClose, onReviewExceptionFullPage, archivedStagingIds, flatList, unifiedAlertColors,
}: {
  records: StagingRecord[]
  onUpdate: (updated: StagingRecord[]) => void
  onNavigate: (nav: string, returnContext?: ReturnContext) => void
  onSwitchToHistory: () => void
  mode?: 'existing'
  initialDrawerRecordId?: string | null
  inlinePanels?: boolean
  newDenialPanelOpen?: boolean
  onNewDenialPanelClose?: () => void
  onReviewExceptionFullPage?: (records: StagingRecord[], currentIndex: number) => void
  archivedStagingIds?: Set<string>
  flatList?: boolean
  unifiedAlertColors?: boolean
}) {
  type ToastState =
    | { kind: 'created'; instanceId: string; worklist: string }
    | { kind: 'attached'; instanceId: string }
    | { kind: 'not_actionable' }
    | { kind: 'dismissed' }
    | null

  const [drawerRecordId, setDrawerRecordId] = useState<string | null>(initialDrawerRecordId ?? null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [undoRecord, setUndoRecord] = useState<StagingRecord | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [editDetailsOpen, setEditDetailsOpen] = useState(false)

  const exceptions = sortByUrgency(records.filter(r =>
    r.status === 'needs_review' &&
    !isTerminalRecord(r, mode) &&
    (mode !== 'existing' || !r.reviewReasons.includes('possible_duplicate')) &&
    !(archivedStagingIds?.has(r.id))
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
    if (onReviewExceptionFullPage) {
      const index = exceptions.findIndex(r => r.id === id)
      if (index >= 0) {
        onReviewExceptionFullPage(exceptions, index)
        return
      }
    }
    setDrawerRecordId(id)
    setShowCompletion(false)
    setEditDetailsOpen(false)
  }

  const closeDrawer = () => {
    setDrawerRecordId(null)
    setShowCompletion(false)
    setEditDetailsOpen(false)
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
        <CheckCircleOutlined sx={{ fontSize: 40, color: 'var(--colors-badge-variant-success-icon)' }} />
        <Box sx={{ textAlign: 'center', maxWidth: 320 }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)', color: 'var(--colors-grey-10)', mb: 0.5 }}>No exceptions to review</Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', lineHeight: 1.5 }}>
            All incoming files have been processed without errors. You'll be notified here if any denials need manual attention.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<UploadFileOutlined />} sx={{ mt: 1 }}>
          Upload a file manually
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', ...(!inlinePanels && { flexDirection: 'column' }) }}>
      {/* List column */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, ...(inlinePanels && { minWidth: 320 }), overflow: 'hidden' }}>
      {/* Amber banner — V1/V2/v3 only (not inline panels) */}
      {!inlinePanels && (
        <Box sx={{ px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'var(--colors-badge-variant-warning-background)', flexShrink: 0 }}>
          <WarningAmberOutlined sx={{ fontSize: 15, color: 'var(--colors-badge-variant-warning-emphasized)' }} />
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)' }}>
            {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''} require your input
          </Typography>
          <Box sx={{ flex: 1 }} />
          {exceptions.length > 0 && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={() => openReview(exceptions[0].id)}
              sx={{ fontSize: 'var(--font-sizes-12)', py: 0.375, px: 1.25 }}
            >
              Review all →
            </Button>
          )}
        </Box>
      )}
      {/* Column headers */}
      <Box sx={{
        px: 3, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 2,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'var(--colors-grey-2)', flexShrink: 0,
      }}>
        <Typography sx={{ flex: 1, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Review needed</Typography>
        {mode !== 'existing' && <Typography sx={{ width: 64, flexShrink: 0, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Amount</Typography>}
        <Typography sx={{ width: 92, flexShrink: 0, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Deadline</Typography>
        <Box sx={{ width: 88, flexShrink: 0 }} />
      </Box>

      {/* Exception list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {(() => {
          const CATEGORY_ORDER = [
            'Data needs review',
            'Classification needs review',
            'Related denial needs review',
            'Missing Data',
            'System error',
          ]
          const getCategory = (r: StagingRecord) => {
            const firstReason = r.reviewReasons[0]
            if (!firstReason) return null
            return (mode === 'existing' ? EXISTING_REVIEW_CATEGORY[firstReason] : undefined) ?? REVIEW_CATEGORY[firstReason]
          }
          const grouped = flatList
            ? [{ category: null as string | null, records: exceptions }]
            : CATEGORY_ORDER
                .map(cat => ({ category: cat as string | null, records: exceptions.filter(r => getCategory(r) === cat) }))
                .filter(g => g.records.length > 0)

          return grouped.flatMap(({ category, records: groupRecords }, gIdx) => {
            return [
              // Category group header (skipped in flat mode)
              ...(category ? [<Box key={`header-${category}`} sx={{
                px: 3, py: 0.5,
                display: 'flex', alignItems: 'center', gap: 2,
                bgcolor: 'var(--colors-grey-2)',
                borderBottom: '1px solid', borderColor: 'divider',
                borderTop: gIdx > 0 ? '1px solid' : 'none', borderTopColor: 'divider',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {category}
                  </Typography>
                  <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled' }}>
                    ({groupRecords.length})
                  </Typography>
                </Box>
              </Box>] : []),
              // Records in this group
              ...groupRecords.map(record => {
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
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                cursor: 'pointer',
                bgcolor: drawerRecordId === record.id ? 'var(--colors-ocean-1)' : 'var(--colors-grey-1)',
                '&:hover': { bgcolor: drawerRecordId === record.id ? 'var(--colors-ocean-2)' : 'var(--colors-grey-2)' },
              }}
            >
              {/* Urgency bar — absolutely positioned so it doesn't shift flex content */}
              <Box sx={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                bgcolor: isOverdue ? 'var(--colors-badge-variant-error-icon)' : isUrgent ? 'var(--colors-badge-variant-warning-icon)' : isSoon ? 'var(--colors-badge-variant-warning-border)' : 'var(--colors-grey-5)',
              }} />
              {/* ISSUE column — 2 lines: chip row / patient · classification · payer · MRN */}
              <Box sx={{ flex: 1, minWidth: 0 }}>

                {/* Line 1: two-level review label */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mb: 0.375 }}>
                  {(() => {
                    const firstReason = record.reviewReasons[0]
                    if (!firstReason) return null
                    const category = (mode === 'existing' ? EXISTING_REVIEW_CATEGORY[firstReason] : undefined) ?? REVIEW_CATEGORY[firstReason]
                    const secondary = (mode === 'existing' ? EXISTING_REVIEW_SECONDARY[firstReason] : undefined) ?? REVIEW_SECONDARY[firstReason]
                    const catStyle = getReviewStyle(category, unifiedAlertColors)
                    return (
                      <>
                        <Chip
                          label={category}
                          size="small"
                          sx={{ height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: catStyle.bg, color: catStyle.color, border: catStyle.border, '& .MuiChip-label': { px: 0.875 }, flexShrink: 0 }}
                        />
                        {!CHIP_ONLY_CATEGORIES.has(category) && (
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: catStyle.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {secondary}
                          </Typography>
                        )}
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
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)', color: 'var(--colors-grey-9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0, maxWidth: 160 }}>
                    {formatPatientName(record.patientName)}
                  </Typography>

                  <Box sx={{ width: '1px', height: 10, bgcolor: 'var(--colors-grey-5)', mx: 0.75, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)', color: inlinePanels ? 'text.secondary' : (typeDisplay ? typeDisplay.color : MODULE_TAG[record.module].color), whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {typeDisplay ? typeDisplay.label : MODULE_TAG[record.module].label}
                  </Typography>

                  {record.payer && (
                    <>
                      <Box sx={{ width: '1px', height: 10, bgcolor: 'var(--colors-grey-5)', mx: 0.75, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
                        {record.payer}
                      </Typography>
                    </>
                  )}

                  {record.patientMrn && (
                    <>
                      <Box sx={{ width: '1px', height: 10, bgcolor: 'var(--colors-grey-5)', mx: 0.75, flexShrink: 0 }} />
                      <CodeValue value={record.patientMrn} label="MRN" />
                    </>
                  )}
                </Box>
              </Box>

              {/* AMOUNT column */}
              {mode !== 'existing' && (
                <Box sx={{ width: 64, flexShrink: 0, textAlign: 'right' }}>
                  {record.amount !== null ? (
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-grey-9)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(record.amount)}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>—</Typography>
                  )}
                </Box>
              )}

              {/* DEADLINE column */}
              <Box sx={{ width: 92, flexShrink: 0, textAlign: 'right' }}>
                {deadline ? (
                  <>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: isOverdue || isUrgent ? 600 : 400, color: isOverdue ? 'var(--colors-badge-variant-error-icon)' : isUrgent ? 'var(--colors-badge-variant-warning-icon)' : 'var(--colors-grey-7)', lineHeight: 1.2 }}>
                      {daysUntil !== null && daysUntil < 0
                        ? 'Overdue'
                        : daysUntil === 0
                        ? 'Today'
                        : `Due ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </Typography>
                    {!isOverdue && daysUntil !== null && daysUntil >= 1 && daysUntil <= 5 && (
                      <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: isUrgent ? 'var(--colors-badge-variant-warning-icon)' : 'var(--colors-grey-6)' }}>
                        {`${daysUntil}d remaining`}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>—</Typography>
                )}
              </Box>

              {/* ACTION column */}
              <Button
                size="small"
                variant="outlined"
                onClick={e => { e.stopPropagation(); openReview(record.id) }}
                sx={{ width: 88, flexShrink: 0, fontSize: 'var(--font-sizes-12)', py: 0.25 }}
              >
                Review →
              </Button>
            </Box>
          )
              }), // end groupRecords.map
            ] // end group array
          }) // end grouped.flatMap
        })()} {/* end IIFE */}
      </Box>


      </Box>

      {/* Right: detail panel (push layout only) */}
      {inlinePanels && (
        <Box sx={{
          width: (drawerRecord || showCompletion || newDenialPanelOpen) ? 800 : 0,
          flexShrink: 0,
          borderLeft: (drawerRecord || showCompletion || newDenialPanelOpen) ? '1px solid' : 'none',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {newDenialPanelOpen && (
            <Box key="new-denial" sx={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              '@keyframes panelFadeIn': { from: { opacity: 0, transform: 'translateX(10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              animation: 'panelFadeIn 220ms 120ms both cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <DenialDetailsPanel
                mode="new"
                onClose={() => onNewDenialPanelClose?.()}
                onSave={() => onNewDenialPanelClose?.()}
              />
            </Box>
          )}
          {drawerRecord && !newDenialPanelOpen && !editDetailsOpen && (
            <Box key={drawerRecord.id} sx={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              '@keyframes panelFadeIn': { from: { opacity: 0, transform: 'translateX(10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              animation: 'panelFadeIn 220ms 120ms both cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <ReviewPanel
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
                onNavigate={onNavigate}
                onEditDenialDetails={() => setEditDetailsOpen(true)}
                unifiedAlertColors={unifiedAlertColors}
              />
            </Box>
          )}
          {editDetailsOpen && drawerRecord && !newDenialPanelOpen && (
            <Box key={`edit-details-${drawerRecord.id}`} sx={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              '@keyframes panelFadeIn': { from: { opacity: 0, transform: 'translateX(10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              animation: 'panelFadeIn 220ms both cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <InlineEditDenialDetailsPanel
                record={drawerRecord}
                onBack={() => setEditDetailsOpen(false)}
              />
            </Box>
          )}
          {showCompletion && !newDenialPanelOpen && !drawerRecord && (
            <Box sx={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              '@keyframes panelFadeIn': { from: { opacity: 0, transform: 'translateX(10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
              animation: 'panelFadeIn 220ms 120ms both cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <CompletionPanel
                onClose={closeDrawer}
                onViewHistory={onSwitchToHistory}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Legacy drawers (V1 / V2) */}
      {!inlinePanels && (
        <>
          <Drawer
            anchor="right"
            open={showCompletion}
            onClose={closeDrawer}
            PaperProps={{ sx: { width: 480, display: 'flex', flexDirection: 'column', top: 52, height: 'calc(100% - 52px)' } }}
          >
            <CompletionPanel onClose={closeDrawer} onViewHistory={onSwitchToHistory} />
          </Drawer>
          <Drawer
            anchor="right"
            open={!!drawerRecord}
            onClose={closeDrawer}
            PaperProps={{ sx: { width: 480, display: 'flex', flexDirection: 'column', top: 52, height: 'calc(100% - 52px)' } }}
            slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.15)' } } }}
          >
            {drawerRecord && (
              <ReviewPanel
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
                onNavigate={onNavigate}
                unifiedAlertColors={unifiedAlertColors}
              />
            )}
          </Drawer>
        </>
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
          sx={{ fontSize: 'var(--font-sizes-14)', alignItems: 'center' }}
        >
          {toast?.kind === 'created' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span>Done — <strong>{toast.instanceId}</strong> created in {toast.worklist}.</span>
              <Button
                size="small"
                onClick={() => { onNavigate(toast.worklist); setToast(null) }}
                sx={{ fontSize: 'var(--font-sizes-14)', p: 0, minWidth: 0, color: 'success.dark' }}
              >
                View →
              </Button>
              {undoRecord && (
                <Button
                  size="small"
                  onClick={handleUndo}
                  sx={{ fontSize: 'var(--font-sizes-14)', p: 0, minWidth: 0, color: 'success.dark' }}
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
                  sx={{ fontSize: 'var(--font-sizes-14)', p: 0, minWidth: 0, color: 'success.dark' }}
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
                  sx={{ fontSize: 'var(--font-sizes-14)', p: 0, minWidth: 0, color: 'inherit' }}
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
                  sx={{ fontSize: 'var(--font-sizes-14)', p: 0, minWidth: 0, color: 'inherit' }}
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
  fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled',
  textTransform: 'uppercase' as const, letterSpacing: '0.07em',
}

function HistoryTab({ records, mode, inlinePanels }: { records: StagingRecord[]; mode?: 'existing'; inlinePanels?: boolean }) {
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
      <Box sx={{ px: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'var(--colors-grey-2)', flexShrink: 0 }}>
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
            <Box sx={{ px: 3, py: 0.625, bgcolor: 'var(--colors-grey-2)', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-bold)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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
                    bgcolor: 'var(--colors-grey-1)',
                  }}
                >
                  {/* Patient */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.patientName ? formatPatientName(record.patientName) : <span style={{ color: 'var(--colors-grey-6)', fontStyle: 'italic', fontWeight: 'var(--font-weights-regular)' as unknown as number }}>Unknown patient</span>}
                    </Typography>
                    {record.patientMrn && <CodeValue value={record.patientMrn} label="MRN" />}
                  </Box>

                  {/* Payer */}
                  <Typography sx={{ width: 150, flexShrink: 0, fontSize: 'var(--font-sizes-12)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.payer ?? '—'}
                  </Typography>

                  {/* Type */}
                  <Box sx={{ width: 140, flexShrink: 0 }}>
                    {typeDisplay && !typeDisplay.isUnknown ? (
                      <Chip label={typeDisplay.label} size="small" sx={{ height: 18, fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-regular)' as unknown as number, '& .MuiChip-label': { px: 0.75 }, bgcolor: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }} />
                    ) : (
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>
                        {mode !== 'existing' ? (record.classifiedAs ?? SIGNAL_LABELS[record.signalType]) : '—'}
                      </Typography>
                    )}
                  </Box>

                  {/* Outcome */}
                  <Box sx={{ width: 100, flexShrink: 0 }}>
                    <StatusChip status={record.status} />
                    {record.status === 'resolved' && record.resolvedBy && (
                      <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled', mt: 0.25 }}>
                        by {record.resolvedBy}
                      </Typography>
                    )}
                    {record.status === 'dismissed' && record.dismissReason && (
                      <Tooltip title={record.dismissReason} placement="top">
                        <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help', maxWidth: 90 }}>
                          {record.dismissReason}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Received */}
                  <Typography sx={{ width: 72, flexShrink: 0, textAlign: 'right', fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
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

// ── ProcessingFailuresTab ──────────────────────────────────────────────────────

function ProcessingFailuresTab({ records, onUpdate, mode, inlinePanels, onReviewFailuresFullPage, unifiedAlertColors }: {
  records: StagingRecord[]
  onUpdate: (updated: StagingRecord[]) => void
  mode?: 'existing'
  inlinePanels?: boolean
  onReviewFailuresFullPage?: (records: StagingRecord[], currentIndex: number) => void
  unifiedAlertColors?: boolean
}) {
  type ToastState = { kind: 'archived' } | { kind: 'retrying' } | null
  const [toast, setToast] = useState<ToastState>(null)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set<string>())

  const blocked = sortByUrgency(records.filter(r =>
    r.status === 'needs_review' && isTerminalRecord(r, mode)
  ))

  const grouped = ['Missing Data', 'System error']
    .map(cat => ({ category: cat, records: blocked.filter(r => getRecordCategory(r, mode) === cat) }))
    .filter(g => g.records.length > 0)

  const openReview = (id: string) => {
    const index = blocked.findIndex(r => r.id === id)
    if (index >= 0) onReviewFailuresFullPage?.(blocked, index)
  }

  const handleGroupHeaderCheck = (groupIds: string[]) => {
    const allSelected = groupIds.every(id => selectedRowIds.has(id))
    setSelectedRowIds(prev => {
      const next = new Set(prev)
      if (allSelected) groupIds.forEach(id => next.delete(id))
      else groupIds.forEach(id => next.add(id))
      return next
    })
  }

  const handleRowCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedRowIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleArchive = (ids: string[]) => {
    setSelectedRowIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next })
    onUpdate(records.map(r =>
      ids.includes(r.id) ? { ...r, status: 'dismissed' as const, dismissedAt: new Date().toISOString(), dismissReason: 'Archived from Processing Failures' } : r
    ))
    setToast({ kind: 'archived' })
  }

  const handleRetry = (ids: string[]) => {
    setSelectedRowIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next })
    onUpdate(records.map(r => ids.includes(r.id) ? { ...r, status: 'processing' as const } : r))
    setToast({ kind: 'retrying' })
  }

  if (blocked.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, py: 8 }}>
        <CheckCircleOutlined sx={{ fontSize: 40, color: 'var(--colors-badge-variant-success-icon)' }} />
        <Box sx={{ textAlign: 'center', maxWidth: 320 }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-bold)', color: 'var(--colors-grey-10)', mb: 0.5 }}>No processing failures</Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', lineHeight: 1.5 }}>
            Records blocked by missing data or system errors will appear here.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Column headers */}
      <Box sx={{ px: 3, py: 0.75, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'var(--colors-grey-2)', flexShrink: 0 }}>
        <Typography sx={{ flex: 1, ...COL_HEADER_SX }}>Issue</Typography>
        {mode !== 'existing' && <Typography sx={{ width: 64, flexShrink: 0, textAlign: 'right', ...COL_HEADER_SX }}>Amount</Typography>}
        <Typography sx={{ width: 92, flexShrink: 0, textAlign: 'right', ...COL_HEADER_SX }}>Deadline</Typography>
        <Box sx={{ width: 88, flexShrink: 0 }} />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {grouped.flatMap(({ category, records: groupRecords }, gIdx) => {
          const catStyle = getReviewStyle(category, unifiedAlertColors)
          const isSystemError = category === 'System error'
          const groupIds = groupRecords.map(r => r.id)
          const groupAllChecked = inlinePanels ? groupIds.length > 0 && groupIds.every(id => selectedRowIds.has(id)) : false
          const groupSomeChecked = inlinePanels ? groupIds.some(id => selectedRowIds.has(id)) && !groupAllChecked : false
          const groupInSelectionMode = groupAllChecked || groupSomeChecked
          const selectedInGroup = groupIds.filter(id => selectedRowIds.has(id))

          return [
            <Box key={`header-${category}`} sx={{
              px: 3, py: 0.5,
              display: 'flex', alignItems: 'center', gap: 2,
              bgcolor: 'var(--colors-grey-2)',
              borderBottom: '1px solid', borderColor: 'divider',
              borderTop: gIdx > 0 ? '1px solid' : 'none', borderTopColor: 'divider',
            }}>
              {inlinePanels && (
                <Checkbox
                  size="small"
                  checked={groupAllChecked}
                  indeterminate={groupSomeChecked}
                  onClick={e => { e.stopPropagation(); handleGroupHeaderCheck(groupIds) }}
                  sx={{ p: 0.25, width: 28, height: 28, m: 0 }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-10)', fontWeight: 'var(--font-weights-bold)', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {category}
                </Typography>
                <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled' }}>
                  ({groupRecords.length})
                </Typography>
              </Box>
              {inlinePanels ? (
                groupInSelectionMode && (
                  <>
                    <Box sx={{ flex: 1 }} />
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                      {selectedInGroup.length} selected
                    </Typography>
                    {isSystemError && (
                      <Button size="small" variant="contained"
                        onClick={e => { e.stopPropagation(); handleRetry(selectedInGroup) }}
                        sx={{ fontSize: 'var(--font-sizes-12)', py: 0.375, px: 1.5, height: 28 }}>
                        Re-run
                      </Button>
                    )}
                    <Button size="small" variant={isSystemError ? 'outlined' : 'contained'}
                      onClick={e => { e.stopPropagation(); handleArchive(selectedInGroup) }}
                      sx={{ fontSize: 'var(--font-sizes-12)', py: 0.375, px: 1.5, height: 28 }}>
                      Archive
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Box sx={{ flex: 1 }} />
                  {isSystemError ? (
                    <Button size="small" variant="contained"
                      onClick={e => { e.stopPropagation(); handleRetry(groupIds) }}
                      sx={{ fontSize: 'var(--font-sizes-12)', py: 0.375, px: 1.5, height: 28 }}>
                      Re-run all
                    </Button>
                  ) : (
                    <Button size="small" variant="outlined"
                      onClick={e => { e.stopPropagation(); handleArchive(groupIds) }}
                      sx={{ fontSize: 'var(--font-sizes-12)', py: 0.375, px: 1.5, height: 28 }}>
                      Archive all
                    </Button>
                  )}
                </>
              )}
            </Box>,
            ...groupRecords.map(record => {
              const deadline = getDeadline(record)
              const refDate = new Date('2026-04-03T00:00:00')
              const daysUntil = deadline ? Math.ceil((deadline.getTime() - refDate.getTime()) / 86400000) : null
              const isOverdue = daysUntil !== null && daysUntil <= 0
              const isUrgent  = daysUntil !== null && daysUntil >= 1 && daysUntil <= 2
              const isSoon    = daysUntil !== null && daysUntil >= 3 && daysUntil <= 5
              const firstReason = record.reviewReasons[0]
              const secondary = firstReason
                ? ((mode === 'existing' ? EXISTING_REVIEW_SECONDARY[firstReason] : undefined) ?? REVIEW_SECONDARY[firstReason])
                : null
              const isSelected = inlinePanels && selectedRowIds.has(record.id)

              return (
                <Box
                  key={record.id}
                  onClick={() => openReview(record.id)}
                  sx={{
                    px: 3, py: 1.25, position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'var(--colors-ocean-1)' : 'var(--colors-grey-1)',
                    '&:hover': { bgcolor: isSelected ? 'var(--colors-ocean-2)' : 'var(--colors-grey-2)' },
                  }}
                >
                  <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    bgcolor: isOverdue ? 'var(--colors-badge-variant-error-icon)' : isUrgent ? 'var(--colors-badge-variant-warning-icon)' : isSoon ? 'var(--colors-badge-variant-warning-border)' : 'var(--colors-grey-5)',
                  }} />
                  {inlinePanels && (
                    groupInSelectionMode
                      ? <Checkbox size="small" checked={isSelected} onClick={e => handleRowCheck(e, record.id)} sx={{ p: 0.25, width: 28, height: 28, m: 0, flexShrink: 0 }} />
                      : <Box sx={{ width: 28, flexShrink: 0 }} />
                  )}

                  {/* Issue + patient */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mb: 0.375 }}>
                      <Chip label={category} size="small" sx={{ height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number, bgcolor: catStyle.bg, color: catStyle.color, border: catStyle.border, '& .MuiChip-label': { px: 0.875 }, flexShrink: 0 }} />
                      {secondary && (
                        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {secondary}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.patientName
                          ? formatPatientName(record.patientName)
                          : <span style={{ color: 'var(--colors-grey-5)', fontStyle: 'italic' }}>Unknown patient</span>}
                      </Typography>
                      {record.payer && (
                        <>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>·</Typography>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', flexShrink: 0 }}>{record.payer}</Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Amount */}
                  {mode !== 'existing' && (
                    <Typography sx={{ width: 64, flexShrink: 0, fontSize: 'var(--font-sizes-14)', fontVariantNumeric: 'tabular-nums', color: record.amount ? 'text.primary' : 'text.disabled', textAlign: 'right' }}>
                      {record.amount ? formatCurrency(record.amount) : '—'}
                    </Typography>
                  )}

                  {/* Deadline */}
                  <Box sx={{ width: 92, flexShrink: 0, textAlign: 'right' }}>
                    {deadline ? (
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontVariantNumeric: 'tabular-nums', color: isOverdue ? 'var(--colors-badge-variant-error-text)' : isUrgent ? 'var(--colors-badge-variant-warning-icon)' : 'text.secondary', fontWeight: isOverdue || isUrgent ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)' }}>
                        {isOverdue ? `${Math.abs(daysUntil!)}d overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil}d left`}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>—</Typography>
                    )}
                  </Box>

                  {/* Review button */}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={e => { e.stopPropagation(); openReview(record.id) }}
                    sx={{ width: 88, flexShrink: 0, fontSize: 'var(--font-sizes-12)', py: 0.25 }}
                  >
                    Review →
                  </Button>
                </Box>
              )
            })
          ]
        })}
      </Box>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={toast?.kind === 'archived' ? 'Record archived' : 'Re-running — check back shortly'}
      />
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IngestPage({ features: _features, onNavigate, mode, initialOpenDrawer, inlinePanels, showUpload: showUploadProp, onShowUploadChange, newDenialPanelOpen, onNewDenialPanelClose, onReviewExceptionFullPage, onReviewFailuresFullPage, archivedStagingIds, showDropZoneAbove, hideProcessingFailures, flatExceptions, processingFailuresLabel = 'Processing Failures', unifiedAlertColors }: IngestPageProps) {
  const failuresTabInitial = hideProcessingFailures ? 99 : (mode === 'existing' ? 2 : 1)
  const [activeTab, setActiveTab] = useState(
    (!hideProcessingFailures && initialOpenDrawer?.tab === 'processing-failures') ? failuresTabInitial :
    initialOpenDrawer?.tab === 'in-progress' ? 1 : 0
  )
  const [records, setRecords] = useState<StagingRecord[]>(SEED_STAGING)
  const [showUploadInternal, setShowUploadInternal] = useState(false)
  const showUpload = showUploadProp !== undefined ? showUploadProp : showUploadInternal
  const setShowUpload = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(showUpload) : v
    setShowUploadInternal(next)
    onShowUploadChange?.(next)
  }

  const exceptionCount = records.filter(r =>
    r.status === 'needs_review' &&
    !isTerminalRecord(r, mode) &&
    (mode !== 'existing' || !r.reviewReasons.includes('possible_duplicate'))
  ).length

  const inProgressCount = records.filter(r => r.status === 'processing').length

  const blockedCount = records.filter(r =>
    r.status === 'needs_review' && isTerminalRecord(r, mode)
  ).length

  // In existing mode: Exceptions(0), In Progress(1), Processing Failures(2), History(3)
  // In existing mode + hideProcessingFailures: Exceptions(0), In Progress(1), History(2)
  // In new mode: Exceptions(0), Processing Failures(1), History(2)
  const failuresTabIndex = hideProcessingFailures ? 99 : (mode === 'existing' ? 2 : 1)
  const historyTabIndex = hideProcessingFailures ? 2 : (mode === 'existing' ? 3 : 2)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Persistent PDF drop zone (V1 only) */}
      {showDropZoneAbove && (
        <Box
          sx={{
            mx: 3, mt: 2, mb: 1, flexShrink: 0,
            border: '2px dashed var(--colors-grey-5)', borderRadius: 2,
            p: 3, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 0.75,
            cursor: 'pointer', bgcolor: 'var(--colors-grey-2)',
            '&:hover': { bgcolor: 'var(--colors-grey-3)', borderColor: 'var(--colors-ocean-3)' },
          }}
        >
          <UploadFileOutlined sx={{ fontSize: 32, color: 'var(--colors-grey-6)' }} />
          <Typography sx={{ fontWeight: 'var(--font-weights-semibold)', fontSize: 'var(--font-sizes-14)', color: 'var(--colors-grey-9)' }}>
            Drop files here or click to browse
          </Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-grey-7)', textAlign: 'center' }}>
            Appeal letters are created using patient data. Data availability varies per location.
          </Typography>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-grey-7)' }}>
            Accepted formats: <strong>.pdf</strong> and <strong>.docx</strong>
          </Typography>
        </Box>
      )}
      {/* Tab bar + upload button — hidden while upload zone is open in V1/V2 */}
      {!(inlinePanels && showUpload) && <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v as number); setShowUpload(false) }}
          sx={{ minHeight: 40, '& .MuiTab-root': { minWidth: 0 } }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Exceptions
                {exceptionCount > 0 && (
                  <Chip
                    label={exceptionCount}
                    size="small"
                    sx={{ height: 18, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number, '& .MuiChip-label': { px: 0.75 }, bgcolor: 'var(--colors-badge-variant-warning-emphasized-background)', color: 'var(--colors-badge-variant-warning-emphasized-text)' }}
                  />
                )}
              </Box>
            }
            sx={{ minHeight: 40, py: 0, px: 2 }}
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
                      sx={{ height: 18, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', bgcolor: 'var(--colors-ocean-1)', color: 'var(--colors-ocean-4)', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
                </Box>
              }
              sx={{ minHeight: 40, py: 0, px: 2 }}
            />
          )}
          {!hideProcessingFailures && (
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {processingFailuresLabel}
                  {blockedCount > 0 && (
                    <Chip
                      label={blockedCount}
                      size="small"
                      sx={{ height: 18, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)' as unknown as number, '& .MuiChip-label': { px: 0.75 }, bgcolor: 'var(--colors-badge-variant-error-background)', color: 'var(--colors-badge-variant-error-text)' }}
                    />
                  )}
                </Box>
              }
              sx={{ minHeight: 40, py: 0, px: 2 }}
            />
          )}
          <Tab label="History" sx={{ minHeight: 40, py: 0, px: 2 }} />
        </Tabs>
        {!inlinePanels && (
          <>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant={showUpload ? 'contained' : 'outlined'}
              startIcon={<UploadFileOutlined sx={{ fontSize: 15 }} />}
              onClick={() => setShowUpload(v => !v)}
              sx={{ fontSize: 'var(--font-sizes-12)', py: 0.5, px: 1.5, mr: 1.5, my: 'auto' }}
            >
              {showUpload ? 'Cancel' : 'Upload files'}
            </Button>
          </>
        )}
      </Box>}

      {/* Upload zone (replaces tab content) */}
      {showUpload ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              onClick={() => setShowUpload(false)}
              sx={{ fontSize: 'var(--font-sizes-14)' }}
            >
              Cancel
            </Button>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              width: '100%', maxWidth: 560,
              border: '2px dashed var(--colors-grey-5)', borderRadius: 2,
              p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              cursor: 'pointer', bgcolor: 'var(--colors-grey-2)',
              '&:hover': { bgcolor: 'var(--colors-grey-3)', borderColor: 'var(--colors-ocean-3)' },
            }}
          >
            <UploadFileOutlined sx={{ fontSize: 36, color: 'var(--colors-grey-6)' }} />
            <Typography sx={{ fontWeight: 'var(--font-weights-semibold)', fontSize: 'var(--font-sizes-14)', color: 'var(--colors-grey-9)' }}>
              Drop files here or click to browse
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', textAlign: 'center' }}>
              Appeal letters are created using patient data.<br />Data availability varies per location.
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary' }}>
              Accepted formats: <strong>.pdf</strong> and <strong>.docx</strong>
            </Typography>
          </Box>
          </Box>
        </Box>
      ) : (
        <>
          {activeTab === 0 && (
            <ExceptionsTab
              records={records}
              onUpdate={setRecords}
              onNavigate={onNavigate}
              onSwitchToHistory={() => setActiveTab(historyTabIndex)}
              mode={mode}
              initialDrawerRecordId={initialOpenDrawer?.tab === 'exceptions' ? initialOpenDrawer.recordId : null}
              inlinePanels={inlinePanels}
              newDenialPanelOpen={newDenialPanelOpen}
              onNewDenialPanelClose={onNewDenialPanelClose}
              onReviewExceptionFullPage={onReviewExceptionFullPage}
              archivedStagingIds={archivedStagingIds}
              flatList={flatExceptions}
              unifiedAlertColors={unifiedAlertColors}
            />
          )}
          {mode === 'existing' && activeTab === 1 && (
            <InProgressTab records={records} mode={mode} onNavigate={onNavigate} initialDrawerRecordId={initialOpenDrawer?.tab === 'in-progress' ? initialOpenDrawer.recordId : null} inlinePanels={inlinePanels} />
          )}
          {activeTab === failuresTabIndex && (
            <ProcessingFailuresTab records={records} onUpdate={setRecords} mode={mode} inlinePanels={inlinePanels} onReviewFailuresFullPage={onReviewFailuresFullPage} unifiedAlertColors={unifiedAlertColors} />
          )}
          {activeTab === historyTabIndex && <HistoryTab records={records} mode={mode} inlinePanels={inlinePanels} />}
        </>
      )}
    </Box>
  )
}
