import { useState, useEffect, useRef, type ReactNode } from 'react'
import {
  Box, Typography, Button, TextField, Divider,
  IconButton, Chip,
} from '@mui/material'
import SmarterRadioGroup from './SmarterRadio'
import {
  ArrowBackOutlined, ChevronLeft, ChevronRight,
  EditOutlined, ArrowForwardOutlined, CheckCircleOutlined, WarningAmberOutlined, InfoOutlined,
  SearchOutlined, AddOutlined, OpenInNewOutlined, ErrorOutlineOutlined,
  DescriptionOutlined, CloseOutlined,
} from '@mui/icons-material'
import SmarterSelect from './SmarterSelect'
import DrgAdjustmentsSection from './DrgAdjustmentsSection'
import { type DrgAdjustments } from './drgMockData'

// ── Shared types ──────────────────────────────────────────────────────────────

function formatPatientName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
}

/** Normalises any date string to MM/DD/YYYY. Handles YYYY-MM-DD (ISO) and pass-through for already-formatted dates. */
function formatDate(date: string | null | undefined): string | null {
  if (!date) return null
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`
  return date
}

/** Formats an ISO datetime string as a natural-language relative date. */
function formatRelatedDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  if (diffDays < 14) return `Updated ${diffDays} days ago`
  const diffWeeks = Math.round(diffDays / 7)
  if (diffDays < 60) return `Updated ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  const diffMonths = Math.round(diffDays / 30)
  return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
}

/** Issue type that drives which inline alert is shown on the edit page. */
export type ExceptionIssue =
  | 'encounter_not_found'
  | 'missing_patient_info'
  | 'missing_icd10'
  | 'classification_unclear'
  | 'related_instance'
  | 'visit_unavailable'
  | 'clinical_data_unavailable'
  | 'letter_generation_failure'
  | 'extraction_failure'

export interface DenialDraft {
  patientName: string | null
  patientDob?: string | null
  payer: string | null
  classifiedAs: string | null
  deadline: string | null
  defaultLevel?: string
  claimId?: string | null
  /** Drives which inline resolution alert to show on the page. */
  exceptionIssue?: ExceptionIssue
  /** True when the user explicitly marked the encounter as not available via Find Encounter.
   *  Drives DOS-specific vs. generic copy in the visit_unavailable alert. */
  encounterMarkedUnavailable?: boolean
  /** True only after the user has explicitly selected an encounter via Find Encounter.
   *  Separate from encounter.har because har may be extracted from the letter
   *  even when the system could not match it. */
  encounterConfirmed?: boolean
  encounter: {
    har?: string | null
    mrn?: string | null
    visitId?: string | null
    dos?: string | null
    discharged?: string | null
  }
  drgAdjustments?: DrgAdjustments
  relatedDenial?: {
    instanceId: string
    denialType: string
    level: string
    status: string
    owner: string
    worklist: string
    lastUpdated: string
  }
}

export interface SourceData {
  sourceFile: string | null
  extraction: Record<string, unknown>
}

export type EditChrome =
  | { kind: 'wizard'; onCancel: () => void; onBackToFindEncounter: () => void }
  | { kind: 'queue'; position: number; total: number; deadlineLabel: string; patientName?: string | null; payer?: string | null; claimId?: string | null; exceptionLabel?: string | null; onBackToList: () => void; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }
  | { kind: 'case'; patientName: string; deadlineLabel: string; level: string; status: string; onBackToList: () => void }

interface Props {
  draft: DenialDraft
  chrome: EditChrome
  onChangeEncounter: () => void
  onSave: () => void
  onArchive?: () => void
  onRetry?: () => void
  sourceData?: SourceData
}

// ── Exception category chip styles ───────────────────────────────────────────

function exceptionChipSx(label: string) {
  const styles: Record<string, { bgcolor: string; color: string; border: string }> = {
    'Data needs review':           { bgcolor: 'var(--colors-badge-variant-warning-background)',  color: 'var(--colors-badge-variant-warning-text)',  border: '1px solid var(--colors-badge-variant-warning-border)'  },
    'Classification needs review': { bgcolor: 'var(--colors-badge-variant-info-background)',     color: 'var(--colors-badge-variant-info-text)',     border: '1px solid var(--colors-badge-variant-info-border)'     },
    'Related denial needs review':            { bgcolor: 'var(--colors-badge-variant-info-background)',     color: 'var(--colors-badge-variant-info-text)',     border: '1px solid var(--colors-badge-variant-info-border)'     },
    'Missing Data':                { bgcolor: 'var(--colors-badge-variant-default-background)',  color: 'var(--colors-badge-variant-default-text)',  border: '1px solid var(--colors-badge-variant-default-border)'  },
    'System error':                { bgcolor: 'var(--colors-badge-variant-error-background)',    color: 'var(--colors-badge-variant-error-text)',    border: '1px solid var(--colors-badge-variant-error-border)'    },
  }
  const s = styles[label] ?? styles['Missing Data']
  return { height: 20, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-regular)', borderRadius: 'var(--radii-badge-radius)', '& .MuiChip-label': { px: 0.875 }, flexShrink: 0, ...s }
}

// ── Ghost nav button style — maps to design system "ghost" button variant ─────
// ghost variant: ocean-4 text, transparent bg/border; hover: ocean-5 + grey-2 bg
const GHOST_BTN_SX = {
  fontSize: 'var(--font-sizes-14)' as const,  // btn size sm = 14px (design system ghost default)
  textTransform: 'none' as const,
  color: 'var(--colors-interactive-ghost-text)',
  '&:hover': {
    color: 'var(--colors-interactive-hover-ghost-text)',
    bgcolor: 'var(--colors-interactive-hover-ghost-background)',
  },
} as const

// ── Form constants (mirror InlineEditDenialDetailsPanel) ──────────────────────

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

// ── Top-chrome variants ───────────────────────────────────────────────────────

function WizardChrome({ onBackToFindEncounter }: { onBackToFindEncounter: () => void }) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
    }}>
      <Box sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={onBackToFindEncounter}
          sx={GHOST_BTN_SX}
        >
          Back to Find Encounter
        </Button>
      </Box>
      <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)' }}>
          Start New Denial Manually
        </Typography>
        <WizardStepper currentStep={2} />
      </Box>
    </Box>
  )
}

function WizardStepper({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Find Encounter' },
    { n: 2, label: 'Denial Details' },
  ]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {steps.map((s, i) => (
        <Box key={s.n} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)',
            bgcolor: currentStep >= s.n ? 'var(--colors-ocean-4)' : 'var(--colors-grey-3)',
            color: currentStep >= s.n ? '#fff' : 'var(--colors-text-secondary)',
          }}>
            {currentStep > s.n ? '✓' : s.n}
          </Box>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            fontWeight: currentStep === s.n ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
            color: currentStep === s.n ? 'text.primary' : 'text.secondary',
          }}>
            {s.label}
          </Typography>
          {i < steps.length - 1 && (
            <Box sx={{ width: 32, height: 1, bgcolor: 'var(--colors-grey-3)', mx: 0.5 }} />
          )}
        </Box>
      ))}
    </Box>
  )
}

function QueueChrome({
  position, total, deadlineLabel, patientName, payer, claimId, exceptionLabel,
  onBackToList, onPrev, onNext, canPrev, canNext, onToggleSource, sourcePanelOpen,
}: {
  position: number; total: number; deadlineLabel: string
  patientName?: string | null; payer?: string | null; claimId?: string | null; exceptionLabel?: string | null
  onBackToList: () => void; onPrev: () => void; onNext: () => void
  canPrev: boolean; canNext: boolean
  onToggleSource?: () => void; sourcePanelOpen?: boolean
}) {
  const contextParts = [payer, claimId].filter(Boolean) as string[]

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
      px: 3, py: 1,
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      {/* Left: back nav */}
      <Button
        size="small"
        startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
        onClick={onBackToList}
        sx={{ ...GHOST_BTN_SX, flexShrink: 0 }}
      >
        Back to Exceptions
      </Button>

      {/* Divider — separates nav from identity context */}
      <Box sx={{ width: '1px', height: 28, bgcolor: 'var(--colors-grey-3)', flexShrink: 0 }} />

      {/* Identity block — left-anchored after divider */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.25 }}>
        {patientName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)',
              color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {formatPatientName(patientName)}
            </Typography>
            {onToggleSource && (
              <IconButton
                size="small"
                onClick={onToggleSource}
                title="View source data"
                sx={{
                  p: 0.375, flexShrink: 0,
                  color: sourcePanelOpen ? 'var(--colors-ocean-4)' : 'var(--colors-grey-5)',
                  bgcolor: sourcePanelOpen ? 'var(--colors-ocean-1)' : 'transparent',
                  '&:hover': { bgcolor: sourcePanelOpen ? 'var(--colors-ocean-2)' : 'var(--colors-interactive-hover-ghost-background)', color: 'var(--colors-interactive-ghost-text)' },
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        )}
        {(payer || claimId || exceptionLabel || deadlineLabel) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap', minWidth: 0 }}>
            {(payer || claimId) && (
              <Typography sx={{
                fontSize: 'var(--font-sizes-12)', color: 'text.secondary',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1,
              }}>
                {[payer, claimId].filter(Boolean).join(' · ')}
              </Typography>
            )}
            {exceptionLabel && (
              <Chip label={exceptionLabel} size="small" sx={exceptionChipSx(exceptionLabel)} />
            )}
            <Chip
              label={deadlineLabel}
              size="small"
              sx={{
                fontSize: 'var(--font-sizes-12)',
                bgcolor: 'var(--colors-badge-variant-warning-background)',
                color: 'var(--colors-badge-variant-warning-text)',
                border: '1px solid var(--colors-badge-variant-warning-border)',
                borderRadius: 'var(--radii-badge-radius)',
                height: 20,
                flexShrink: 0,
              }}
            />
          </Box>
        )}
      </Box>

      {/* Right: position counter + prev/next */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <IconButton
          size="small"
          disabled={!canPrev}
          onClick={onPrev}
          sx={{
            p: 0.5,
            color: canPrev ? 'var(--colors-interactive-ghost-text)' : 'var(--colors-grey-5)',
            '&:hover': canPrev ? { bgcolor: 'var(--colors-interactive-hover-ghost-background)' } : {},
          }}
        >
          <ChevronLeft sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', whiteSpace: 'nowrap', userSelect: 'none' }}>
          <strong style={{ color: 'var(--colors-text-primary)' }}>{position}</strong> of <strong style={{ color: 'var(--colors-text-primary)' }}>{total}</strong>
        </Typography>
        <IconButton
          size="small"
          disabled={!canNext}
          onClick={onNext}
          sx={{
            p: 0.5,
            color: canNext ? 'var(--colors-interactive-ghost-text)' : 'var(--colors-grey-5)',
            '&:hover': canNext ? { bgcolor: 'var(--colors-interactive-hover-ghost-background)' } : {},
          }}
        >
          <ChevronRight sx={{ fontSize: 16 }} />
        </IconButton>

      </Box>
    </Box>
  )
}

function CaseChrome({
  patientName, deadlineLabel, level, status, onBackToList,
}: {
  patientName: string; deadlineLabel: string; level: string; status: string
  onBackToList: () => void
}) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
    }}>
      <Box sx={{ px: 3, pt: 1, pb: 0.5 }}>
        <Button
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={onBackToList}
          sx={{ ...GHOST_BTN_SX, p: 0, minWidth: 0 }}
        >
          Back to Case
        </Button>
      </Box>
      <Box sx={{
        px: 3, pb: 1.5, pt: 0.75,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)' }}>
            {patientName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`Deadline: ${deadlineLabel}`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-ocean-4)',
              borderColor: 'var(--colors-ocean-3)',
              height: 24,
            }}
          />
          <Chip
            label={level}
            size="small"
            sx={{
              fontSize: 'var(--font-sizes-12)',
              bgcolor: 'var(--colors-badge-variant-default-background)',
              color: 'var(--colors-badge-variant-default-text)',
              border: '1px solid var(--colors-badge-variant-default-border)',
              height: 24,
            }}
          />
          <Chip
            label={status}
            size="small"
            sx={{
              fontSize: 'var(--font-sizes-12)',
              bgcolor: 'var(--colors-badge-variant-success-background)',
              color: 'var(--colors-badge-variant-success-text)',
              border: '1px solid var(--colors-badge-variant-success-border)',
              height: 24,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

// ── Form body (mirrors InlineEditDenialDetailsPanel) ──────────────────────────

function SectionCard({
  id, title, action, children,
}: {
  id: string
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Box id={id} sx={{
      bgcolor: 'background.paper',
      border: '1px solid', borderColor: 'var(--colors-grey-3)',
      borderRadius: 'var(--radii-card-radius)',
      scrollMarginTop: 16,
    }}>
      <Box sx={{
        px: 2, py: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'var(--colors-grey-3)',
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-14)',
          fontWeight: 'var(--font-weights-semibold)',
          color: 'text.primary',
        }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Box>
  )
}

function FormBody({
  draft,
  onChangeEncounter,
  onArchive,
  onRetry,
}: {
  draft: DenialDraft
  onChangeEncounter: () => void
  onArchive?: () => void
  onRetry?: () => void
}) {
  const [denialType, setDenialType] = useState<'drg_downgrade' | 'medical_necessity' | 'other' | ''>(
    draft.exceptionIssue === 'classification_unclear'
      ? ''
      : parseDenialTypeFromClassification(draft.classifiedAs)
  )
  const [classificationConfirmed, setClassificationConfirmed] = useState(false)
  const [otherExplicitlySelected, setOtherExplicitlySelected] = useState(false)
  const [otherSubtype, setOtherSubtype] = useState<'outpatient' | 'readmission' | 'prior_auth' | null>(null)
  const [icd10Confirmed, setIcd10Confirmed] = useState(false)
  const [relatedPendingChoice, setRelatedPendingChoice] = useState<'escalation' | 'duplicate' | 'unrelated' | null>(null)
  const [relatedConfirmedAction, setRelatedConfirmedAction] = useState<'escalation' | 'unrelated' | null>(null)
  const [drgReviewType, setDrgReviewType] = useState('Clinical Validation Review')
  const [level, setLevel] = useState(draft.defaultLevel ?? 'Level 1')
  const [payer, setPayer] = useState(draft.payer ?? '')
  const [deadlineISO, setDeadlineISO] = useState(draft.deadline ?? '')
  const [reviewEntity, setReviewEntity] = useState('')
  const [payerRationale, setPayerRationale] = useState('')

  const FIELD_LABEL_SX = {
    fontSize: 'var(--font-sizes-12)' as const,
    color: 'text.secondary' as const,
    mb: 0.5,
  }

  const admitDischarge = (() => {
    const admit = formatDate(draft.encounter.dos)
    const discharge = formatDate(draft.encounter.discharged)
    if (admit && discharge) return `${admit} — ${discharge}`
    return admit ?? null
  })()

  const encFields: { label: string; value: string | null | undefined; mono?: boolean }[] = [
    { label: 'Name',              value: draft.patientName ? formatPatientName(draft.patientName) : null },
    { label: 'HAR',               value: draft.encounter.har,    mono: true },
    { label: 'MRN',               value: draft.encounter.mrn,    mono: true },
    { label: 'Date of Birth',     value: formatDate(draft.patientDob ?? null) },
    { label: 'Admit — Discharge', value: admitDischarge },
    { label: 'Visit ID',          value: draft.encounter.visitId, mono: true },
  ]

  return (
    <Box sx={{
      maxWidth: 1100, mx: 'auto', py: 2, px: 2,
      display: 'flex', flexDirection: 'column', gap: 1.5,
    }}>

      <Box sx={{ pb: 0.5 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary' }}>
          Denial Details
        </Typography>
        {draft.patientName && (
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mt: 0.25 }}>
            {formatPatientName(draft.patientName)}
            {draft.payer ? ` · ${draft.payer}` : ''}
            {draft.claimId ? ` · ${draft.claimId}` : ''}
          </Typography>
        )}
      </Box>

      {/* Visit unavailable — page-level notice; no resolution path */}
      {draft.exceptionIssue === 'visit_unavailable' && (
        <Box sx={{
          p: 1.5,
          bgcolor: 'var(--colors-badge-variant-info-background)',
          border: '1px solid var(--colors-badge-variant-info-border)',
          borderRadius: 'var(--radii-sm)',
          display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
        }}>
          <InfoOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-info-text)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-info-text)', lineHeight: 1.4 }}>
            Visit data is not available for this denial.
          </Typography>
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-info-text)', lineHeight: 1.5, mt: 0.25 }}>
            {draft.encounterMarkedUnavailable
              ? 'This can happen if the denial date falls outside your supported data range or the encounter is not in the system. Archive this instance if no further action is needed.'
              : <>Denial date{draft.encounter.dos ? ` ${formatDate(draft.encounter.dos)}` : ''} falls within a known data gap for this facility. If you think this is incorrect, contact support to report an issue.</>
            }
          </Typography>
          <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', mt: 0.75 }}>
            <Button size="small" sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-info-text)', p: 0, fontWeight: 'var(--font-weights-medium)', '&:hover': { opacity: 0.75 } }}>
              Contact Support
            </Button>
          </Box>
        </Box>
      )}

      {/* Clinical data unavailable — hard stop, no resolution path */}
      {draft.exceptionIssue === 'clinical_data_unavailable' && (
        <Box sx={{
          p: 1.5,
          bgcolor: 'var(--colors-badge-variant-error-background)',
          border: '1px solid var(--colors-badge-variant-error-border)',
          borderRadius: 'var(--radii-sm)',
          display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
        }}>
          <ErrorOutlineOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-error-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-error-text)', lineHeight: 1.4 }}>
            Clinical Data Not Available
          </Typography>
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-error-text)', lineHeight: 1.5, mt: 0.25 }}>
            No clinical notes found for this encounter.
          </Typography>
          <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', mt: 0.75 }}>
            <Button size="small"
              sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-error-text)', p: 0, fontWeight: 'var(--font-weights-medium)', '&:hover': { opacity: 0.75 } }}>
              Contact Support
            </Button>
          </Box>
        </Box>
      )}

      {/* System error alerts — letter generation failure and extraction failure */}
      {(draft.exceptionIssue === 'letter_generation_failure' || draft.exceptionIssue === 'extraction_failure') && (
        <Box sx={{
          p: 1.5,
          bgcolor: 'var(--colors-badge-variant-error-background)',
          border: '1px solid var(--colors-badge-variant-error-border)',
          borderRadius: 'var(--radii-sm)',
          display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
        }}>
          <ErrorOutlineOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-error-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-error-text)', lineHeight: 1.4 }}>
            {draft.exceptionIssue === 'letter_generation_failure' ? 'Letter generation failed.' : 'Data extraction failed.'}
          </Typography>
          <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-error-text)', lineHeight: 1.5, mt: 0.25 }}>
            {draft.exceptionIssue === 'letter_generation_failure'
              ? 'The system was unable to generate an appeal letter for this denial. Retry to attempt again, or contact support if the issue persists.'
              : 'The system was unable to extract data from the denial letter. Retry to attempt again, or contact support if the issue persists.'}
          </Typography>
          <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 0.75 }}>
            <Button size="small"
              sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-error-text)', p: 0, fontWeight: 'var(--font-weights-medium)', '&:hover': { opacity: 0.75 } }}>
              Contact Support
            </Button>
            <Button variant="outlined" size="small" onClick={onRetry}
              sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', borderColor: 'var(--colors-badge-variant-error-border)', color: 'var(--colors-badge-variant-error-text)', '&:hover': { borderColor: 'var(--colors-badge-variant-error-text)', bgcolor: 'transparent' } }}>
              Retry
            </Button>
          </Box>
        </Box>
      )}

        <SectionCard
          id="encounter"
          title="Encounter"
          action={
            // Hide "Change encounter" when encounter is unresolved — the alert CTA takes over
            (draft.exceptionIssue === 'encounter_not_found' || draft.exceptionIssue === 'missing_patient_info') && !draft.encounterConfirmed ? null : (
              <Button
                size="small"
                startIcon={<EditOutlined sx={{ fontSize: '14px !important' }} />}
                onClick={onChangeEncounter}
                sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-ocean-4)' }}
              >
                Change encounter
              </Button>
            )
          }
        >
          {/* Encounter not found / missing patient info — unresolved */}
          {(draft.exceptionIssue === 'encounter_not_found' || draft.exceptionIssue === 'missing_patient_info') && !draft.encounterConfirmed && (
            <Box sx={{
              mb: 2, p: 1.5,
              bgcolor: 'var(--colors-badge-variant-warning-background)',
              border: '1px solid var(--colors-badge-variant-warning-border)',
              borderRadius: 'var(--radii-sm)',
              display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
            }}>
              <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-warning-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                {draft.exceptionIssue === 'missing_patient_info'
                  ? 'Additional patient info needed to find encounter.'
                  : 'Encounter could not be automatically matched'}
              </Typography>
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.5, mt: 0.25 }}>
                {draft.exceptionIssue === 'missing_patient_info'
                  ? 'Patient identifiers were incomplete or unclear. Search for the encounter using additional identifiers to confirm the patient and proceed.'
                  : 'The extracted identifiers did not return a result. Search and select the correct encounter to proceed.'}
              </Typography>
              <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', mt: 0.75 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardOutlined sx={{ fontSize: '14px !important' }} />}
                  onClick={onChangeEncounter}
                  sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-warning-text)', p: 0, '&:hover': { opacity: 0.75 } }}
                >
                  Search for Encounter
                </Button>
              </Box>
            </Box>
          )}

          {/* Encounter resolved — shared by encounter_not_found and missing_patient_info */}
          {(draft.exceptionIssue === 'encounter_not_found' || draft.exceptionIssue === 'missing_patient_info') && !!draft.encounterConfirmed && (
            <Box sx={{
              mb: 2, px: 1.5, py: 1,
              bgcolor: 'var(--colors-badge-variant-success-background)',
              border: '1px solid var(--colors-badge-variant-success-border)',
              borderRadius: 'var(--radii-sm)',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-success-icon)', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-success-text)', flex: 1 }}>
                Encounter matched
              </Typography>
              <Button
                size="small"
                onClick={onChangeEncounter}
                sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-interactive-ghost-text)', p: 0 }}
              >
                Change
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 20px' }}>
            {encFields.map(({ label, value, mono }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.375 }}>
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
        </SectionCard>

        <SectionCard id="denial-type" title="Denial Type">
          {/* Classification unclear — unresolved (hidden when an unsupported sub-type is selected) */}
          {draft.exceptionIssue === 'classification_unclear' && !classificationConfirmed && !(denialType === 'other' && !!otherSubtype) && (
            <Box sx={{
              mb: 2, p: 1.5,
              bgcolor: 'var(--colors-badge-variant-warning-background)',
              border: '1px solid var(--colors-badge-variant-warning-border)',
              borderRadius: 'var(--radii-sm)',
              display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
            }}>
              <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-warning-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                Denial type could not be automatically determined
              </Typography>
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.5, mt: 0.25 }}>
                Review the denial letter and select the appropriate denial type below.
              </Typography>
            </Box>
          )}

          {/* Unsupported denial type — replaces the classification alert once an Other sub-type is chosen */}
          {draft.exceptionIssue === 'classification_unclear' && !classificationConfirmed && denialType === 'other' && !!otherSubtype && (
            <Box sx={{
              mb: 2, p: 1.5,
              bgcolor: 'var(--colors-badge-variant-warning-background)',
              border: '1px solid var(--colors-badge-variant-warning-border)',
              borderRadius: 'var(--radii-sm)',
              display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
            }}>
              <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-warning-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                This denial type is not currently supported.
              </Typography>
              <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.5, mt: 0.25 }}>
                The system will use a Medical Necessity framework to generate the appeal letter.
              </Typography>
              <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 0.75 }}>
                <Button size="small" onClick={onArchive}
                  sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-warning-text)', p: 0, fontWeight: 'var(--font-weights-medium)', '&:hover': { opacity: 0.75 } }}>
                  Archive
                </Button>
                <Button variant="outlined" size="small" onClick={() => setClassificationConfirmed(true)}
                  sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', borderColor: 'var(--colors-badge-variant-warning-border)', color: 'var(--colors-badge-variant-warning-text)', '&:hover': { borderColor: 'var(--colors-badge-variant-warning-text)', bgcolor: 'transparent' } }}>
                  Proceed anyway
                </Button>
              </Box>
            </Box>
          )}

          {/* Classification unclear — resolved */}
          {draft.exceptionIssue === 'classification_unclear' && classificationConfirmed && (
            <Box sx={{
              mb: 2, px: 1.5, py: 1,
              bgcolor: 'var(--colors-badge-variant-success-background)',
              border: '1px solid var(--colors-badge-variant-success-border)',
              borderRadius: 'var(--radii-sm)',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-success-icon)', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-success-text)', flex: 1 }}>
                Denial type confirmed
              </Typography>
            </Box>
          )}

          <SmarterRadioGroup
            value={denialType}
            onChange={v => {
              const t = v as 'drg_downgrade' | 'medical_necessity' | 'other'
              setDenialType(t)
              if (t === 'other') {
                setOtherExplicitlySelected(true)
                // Don't confirm yet — user must pick a sub-type and proceed
              } else {
                setOtherExplicitlySelected(false)
                setOtherSubtype(null)
                setClassificationConfirmed(true)
              }
            }}
            options={[
              {
                value: 'drg_downgrade',
                label: 'DRG Downgrade',
                children: (
                  <Box>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.75 }}>Review type</Typography>
                    <SmarterRadioGroup
                      value={drgReviewType}
                      onChange={setDrgReviewType}
                      options={EDIT_DRG_REVIEW_TYPE_OPTIONS.map(o => ({ value: o, label: o }))}
                    />
                  </Box>
                ),
              },
              { value: 'medical_necessity', label: 'Medical Necessity' },
              {
                value: 'other',
                label: 'Other',
                children: (otherExplicitlySelected && draft.exceptionIssue === 'classification_unclear') ? (
                  <Box>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.75 }}>Denial type</Typography>
                    <SmarterRadioGroup
                      value={otherSubtype ?? ''}
                      onChange={v => setOtherSubtype(v as typeof otherSubtype)}
                      options={[
                        { value: 'outpatient',  label: 'Outpatient denial' },
                        { value: 'readmission', label: 'Readmission denial' },
                        { value: 'prior_auth',  label: 'Prior authorization denial' },
                      ]}
                    />
                  </Box>
                ) : undefined,
              },
            ]}
          />
        </SectionCard>

        <SectionCard id="logistics" title="Denial Details">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={FIELD_LABEL_SX}>Level</Typography>
                <SmarterSelect value={level} onChange={setLevel} options={EDIT_LEVEL_OPTIONS} />
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
              <SmarterSelect value={payer} onChange={setPayer} options={EDIT_PAYER_OPTIONS} placeholder="Select payer" />
            </Box>
            <Box>
              <Typography sx={FIELD_LABEL_SX}>
                Review Entity{' '}
                <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-disabled)' }}>
                  (optional)
                </Typography>
              </Typography>
              <SmarterSelect value={reviewEntity} onChange={setReviewEntity} options={EDIT_REVIEW_ENTITY_OPTIONS} placeholder="Search review entity" />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box>
              <Typography sx={FIELD_LABEL_SX}>Payer Rationale</Typography>
              <TextField
                multiline
                fullWidth
                size="small"
                value={payerRationale}
                onChange={e => setPayerRationale(e.target.value)}
                placeholder="Enter the payer's rationale for denial…"
                minRows={5}
              />
            </Box>
          </Box>
        </SectionCard>

        {(denialType === 'drg_downgrade' || draft.exceptionIssue === 'missing_icd10') && (
          <SectionCard id="payer-adj" title="Payer Adjustments">
            {/* Missing ICD-10 — unresolved: prompt user to add codes */}
            {draft.exceptionIssue === 'missing_icd10' && !icd10Confirmed && (
              <Box sx={{
                mb: 2, p: 1.5,
                bgcolor: 'var(--colors-badge-variant-warning-background)',
                border: '1px solid var(--colors-badge-variant-warning-border)',
                borderRadius: 'var(--radii-sm)',
                display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
              }}>
                <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-warning-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
                <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                  ICD-10 diagnosis codes are missing
                </Typography>
                <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.5, mt: 0.25 }}>
                  Codes could not be extracted from the denial letter. Add the applicable diagnosis codes below.
                </Typography>
              </Box>
            )}

            {/* Missing ICD-10 — resolved: green confirmation */}
            {draft.exceptionIssue === 'missing_icd10' && icd10Confirmed && (
              <Box sx={{
                mb: 2, px: 1.5, py: 1,
                bgcolor: 'var(--colors-badge-variant-success-background)',
                border: '1px solid var(--colors-badge-variant-success-border)',
                borderRadius: 'var(--radii-sm)',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-success-icon)', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-success-text)' }}>
                  ICD-10 codes added
                </Typography>
              </Box>
            )}

            <DrgAdjustmentsSection
              adjustments={draft.drgAdjustments}
              onDxCodesChanged={count => { if (count > 0) setIcd10Confirmed(true) }}
            />
          </SectionCard>
        )}

        {/* Related Denials — always visible in worklist context; shown in exception context when a match exists */}
        {(draft.relatedDenial || !draft.exceptionIssue) && (() => {
          const rd = draft.relatedDenial ?? null
          const isException = draft.exceptionIssue === 'related_instance'

          const RELATIONSHIP_OPTIONS: { value: 'escalation' | 'duplicate' | 'unrelated'; label: string; description: string; confirmLabel: string }[] = [
            { value: 'escalation', label: 'An escalation',  description: 'This is the same claim at the next appeal level',          confirmLabel: 'Link as Escalation'  },
            { value: 'duplicate',  label: 'A duplicate',    description: 'Identical signal; this incoming instance will be archived', confirmLabel: 'Archive as Duplicate' },
            { value: 'unrelated',  label: 'Not related',    description: 'Unrelated; create a new separate denial instance',          confirmLabel: 'Create New Denial'    },
          ]

          const selectedOption = RELATIONSHIP_OPTIONS.find(o => o.value === relatedPendingChoice)
          const confirmLabel = selectedOption?.confirmLabel ?? 'Confirm'

          const handleConfirm = () => {
            if (relatedPendingChoice === 'duplicate') {
              onArchive?.()
            } else if (relatedPendingChoice === 'escalation' || relatedPendingChoice === 'unrelated') {
              setRelatedConfirmedAction(relatedPendingChoice)
            }
          }

          const statusChipSx = (status: string) => {
            if (status === 'Overturned' || status === 'Closed') return { bgcolor: 'var(--colors-badge-variant-success-background)', color: 'var(--colors-badge-variant-success-text)', border: '1px solid var(--colors-badge-variant-success-border)' }
            if (status === 'Upheld') return { bgcolor: 'var(--colors-badge-variant-error-background)', color: 'var(--colors-badge-variant-error-text)', border: '1px solid var(--colors-badge-variant-error-border)' }
            if (status === 'Needs review') return { bgcolor: 'var(--colors-badge-variant-warning-background)', color: 'var(--colors-badge-variant-warning-text)', border: '1px solid var(--colors-badge-variant-warning-border)' }
            return { bgcolor: 'var(--colors-badge-variant-default-background)', color: 'var(--colors-badge-variant-default-text)', border: '1px solid var(--colors-badge-variant-default-border)' }
          }

          return (
            <SectionCard
              id="related-denials"
              title="Related Denials"
              action={
                !isException ? (
                  <Button size="small" startIcon={<AddOutlined sx={{ fontSize: '14px !important' }} />}
                    sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-ocean-4)' }}>
                    Add related denial
                  </Button>
                ) : null
              }
            >
              {/* Exception alert — unresolved: radio group asking the relationship */}
              {isException && !relatedConfirmedAction && (
                <Box sx={{
                  mb: 2, p: 1.5,
                  bgcolor: 'var(--colors-badge-variant-warning-background)',
                  border: '1px solid var(--colors-badge-variant-warning-border)',
                  borderRadius: 'var(--radii-sm)',
                  display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
                }}>
                  <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-warning-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
                  <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                    This denial closely matches one already in the system.
                  </Typography>
                  <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.5, mt: 0.25 }}>
                    Review the existing denial below and specify the relationship.
                  </Typography>

                  {/* Radio options */}
                  <Box sx={{ gridColumn: 2, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {RELATIONSHIP_OPTIONS.map(opt => (
                      <Box
                        key={opt.value}
                        onClick={() => setRelatedPendingChoice(opt.value)}
                        sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 1, py: 0.75,
                          borderRadius: 'var(--radii-sm)', cursor: 'pointer',
                          bgcolor: relatedPendingChoice === opt.value ? 'rgba(0,0,0,0.04)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                        }}
                      >
                        {/* Radio circle */}
                        <Box sx={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0, mt: '1px',
                          border: relatedPendingChoice === opt.value
                            ? '1px solid var(--colors-badge-variant-warning-text)'
                            : '1px solid var(--colors-badge-variant-warning-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {relatedPendingChoice === opt.value && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--colors-badge-variant-warning-text)' }} />
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-warning-text)', lineHeight: 1.4 }}>
                            {opt.label}
                          </Typography>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-badge-variant-warning-text)', opacity: 0.8, lineHeight: 1.5 }}>
                            {opt.description}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Confirm action */}
                  <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', mt: 1.25 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!relatedPendingChoice}
                      onClick={handleConfirm}
                      sx={{
                        fontSize: 'var(--font-sizes-12)', textTransform: 'none',
                        borderColor: 'var(--colors-badge-variant-warning-text)',
                        color: 'var(--colors-badge-variant-warning-text)',
                        '&:hover': { borderColor: 'var(--colors-badge-variant-warning-text)', bgcolor: 'rgba(0,0,0,0.04)' },
                        '&.Mui-disabled': { opacity: 0.4, borderColor: 'var(--colors-badge-variant-warning-border)', color: 'var(--colors-badge-variant-warning-text)' },
                      }}
                    >
                      {confirmLabel}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Exception alert — resolved */}
              {isException && !!relatedConfirmedAction && (
                <Box sx={{
                  mb: 2, px: 1.5, py: 1,
                  bgcolor: 'var(--colors-badge-variant-success-background)',
                  border: '1px solid var(--colors-badge-variant-success-border)',
                  borderRadius: 'var(--radii-sm)',
                  display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', columnGap: 1,
                }}>
                  <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--colors-badge-variant-success-icon)', gridRow: 1, alignSelf: 'start', mt: '2px' }} />
                  <Typography sx={{ gridColumn: 2, fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'var(--colors-badge-variant-success-text)', lineHeight: 1.4 }}>
                    {relatedConfirmedAction === 'escalation'
                      ? `Linked as an escalation of ${rd.instanceId}.`
                      : 'A new separate denial instance will be created from this signal.'}
                  </Typography>
                  <Box sx={{ gridColumn: 2, display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Button size="small" onClick={() => { setRelatedConfirmedAction(null); setRelatedPendingChoice(null) }}
                      sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-badge-variant-success-text)', p: 0 }}>
                      Change
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Empty state — worklist context with no related denials yet */}
              {!rd && (
                <Box sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>
                    No related denials have been linked.
                  </Typography>
                </Box>
              )}

              {/* Timeline — confirmed existing instances only; incoming signal not pre-placed */}
              {rd && <Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Rail dot — no connector since there's only one confirmed item */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: 'var(--colors-grey-4)' }} />
                  </Box>
                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary' }}>
                        {rd.denialType.replace('Denial — ', '')}
                      </Typography>
                      <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', fontWeight: 'var(--font-weights-regular)' }}>
                        · {rd.level}
                      </Typography>
                      <Chip label={rd.status} size="small" sx={{
                        height: 20, fontSize: 'var(--font-sizes-12)',
                        fontWeight: 'var(--font-weights-regular)' as unknown as number,
                        borderRadius: 'var(--radii-badge-radius)',
                        '& .MuiChip-label': { px: 0.875 },
                        ...statusChipSx(rd.status),
                      }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                        {rd.owner} · {rd.worklist}
                      </Typography>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled' }}>
                        · {formatRelatedDate(rd.lastUpdated)}
                      </Typography>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                        · {rd.instanceId}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>}
            </SectionCard>
          )
        })()}

    </Box>
  )
}

// ── Source panel ─────────────────────────────────────────────────────────────

const LABEL_SX = {
  fontSize: 'var(--font-sizes-10)' as const,
  fontWeight: 'var(--font-weights-medium)' as const,
  color: 'text.disabled' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  mb: 1,
}

function ConfidenceDot({ score }: { score: number }) {
  const color = score >= 0.85 ? 'var(--colors-badge-variant-success-text)'
    : score >= 0.70 ? 'var(--colors-badge-variant-warning-text)'
    : 'var(--colors-badge-variant-error-text)'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: 'var(--font-sizes-10)', color, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(score * 100)}%
      </Typography>
    </Box>
  )
}

function SourcePanel({ sourceData, onClose, exceptionIssue }: {
  sourceData: SourceData
  onClose: () => void
  exceptionIssue?: ExceptionIssue
}) {
  const { sourceFile, extraction } = sourceData
  const ocrConf = extraction.ocrConfidence as Record<string, number> | undefined
  const uncertainFields = (extraction.uncertainFields as string[]) ?? []
  const patientCandidates = extraction.patientCandidates as Array<{ mrn: string; name: string; dob: string; matchSignals: string[] }> | undefined

  const coreFields: { label: string; value: string | null; mono?: boolean; confKey?: string }[] = [
    { label: 'HAR',               value: (extraction.har as string) ?? null,     mono: true },
    { label: 'Claim ID',          value: (extraction.claimId as string) ?? null, mono: true, confKey: 'claimId' },
    { label: 'Date of Service',   value: formatDate((extraction.dos as string) ?? null) },
    { label: 'Appeal Deadline',   value: formatDate((extraction.deadline as string) ?? null) },
    { label: 'CARC',              value: (extraction.carc as string) ?? null,     mono: true },
    { label: 'Denied Amount',     value: extraction.deniedAmount != null ? `$${(extraction.deniedAmount as number).toLocaleString()}` : null },
    { label: 'Amount at Risk',    value: extraction.amountAtRisk != null ? `$${(extraction.amountAtRisk as number).toLocaleString()}` : null, confKey: 'amountAtRisk' },
    { label: 'Audit Type',        value: (extraction.auditType as string) ?? null },
  ].filter(f => f.value)

  const extractedName = (extraction.extractedPatientName as string) ?? null
  const extractedDob = (extraction.extractedDob as string) ?? null

  return (
    <Box sx={{
      width: 340, flexShrink: 0,
      borderLeft: '1px solid', borderColor: 'divider',
      display: 'flex', flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.25, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary' }}>
          Source Data
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.5, color: 'text.secondary' }}>
          <CloseOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Source file */}
        {sourceFile && (
          <Box>
            <Typography sx={LABEL_SX}>Source File</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, bgcolor: 'var(--colors-grey-2)', borderRadius: 'var(--radii-sm)', border: '1px solid var(--colors-grey-3)' }}>
              <DescriptionOutlined sx={{ fontSize: 18, color: 'var(--colors-ocean-4)', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>
                {sourceFile}
              </Typography>
              <Button size="small" endIcon={<OpenInNewOutlined sx={{ fontSize: '12px !important' }} />}
                sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-ocean-4)', p: 0, flexShrink: 0, whiteSpace: 'nowrap' }}>
                View full
              </Button>
            </Box>
          </Box>
        )}

        {/* Extracted fields */}
        {coreFields.length > 0 && (
          <Box>
            <Typography sx={LABEL_SX}>Extracted Data</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {coreFields.map(({ label, value, mono, confKey }) => {
                const conf = confKey && ocrConf ? ocrConf[confKey] : undefined
                const isUncertain = confKey ? uncertainFields.includes(confKey) : false
                return (
                  <Box key={label} sx={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1,
                    py: 0.75, borderBottom: '1px solid var(--colors-grey-3)',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', flexShrink: 0, minWidth: 110 }}>
                      {label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: 'var(--font-sizes-12)', color: isUncertain ? 'var(--colors-badge-variant-warning-text)' : 'text.primary',
                        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
                        fontWeight: 'var(--font-weights-medium)',
                      }}>
                        {value}
                      </Typography>
                      {conf !== undefined && <ConfidenceDot score={conf} />}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {/* Extracted patient info (when different from matched) */}
        {(extractedName || extractedDob) && (
          <Box>
            <Typography sx={LABEL_SX}>Extracted Patient</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {extractedName && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, py: 0.75, borderBottom: '1px solid var(--colors-grey-3)' }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', minWidth: 110 }}>Name</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)', color: ocrConf?.patientName && ocrConf.patientName < 0.80 ? 'var(--colors-badge-variant-warning-text)' : 'text.primary' }}>
                      {extractedName}
                    </Typography>
                    {ocrConf?.patientName !== undefined && <ConfidenceDot score={ocrConf.patientName} />}
                  </Box>
                </Box>
              )}
              {extractedDob && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, py: 0.75 }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', minWidth: 110 }}>Date of Birth</Typography>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)' }}>{formatDate(extractedDob)}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Patient candidates */}
        {patientCandidates && patientCandidates.length > 0 && (
          <Box>
            <Typography sx={LABEL_SX}>Patient Candidates</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {patientCandidates.map(c => (
                <Box key={c.mrn} sx={{ p: 1, bgcolor: 'var(--colors-grey-2)', borderRadius: 'var(--radii-sm)', border: '1px solid var(--colors-grey-3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary' }}>
                      {c.name}
                    </Typography>
                    <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {c.mrn}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 'var(--font-sizes-10)', color: 'text.secondary' }}>
                    {c.matchSignals.join(' · ')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

      </Box>
    </Box>
  )
}

// ── Footer variants ───────────────────────────────────────────────────────────

const FOOTER_SX = {
  borderTop: '1px solid', borderColor: 'divider',
  bgcolor: 'background.paper',
  px: 3, py: 1.25,
  display: 'flex', alignItems: 'center', gap: 1.5,
  flexShrink: 0,
} as const

function FooterBar({ chrome, draft, onSave, onArchive }: { chrome: EditChrome; draft: DenialDraft; onSave: () => void; onArchive?: () => void }) {
  const isUnavailable = draft.exceptionIssue === 'visit_unavailable'
    || draft.exceptionIssue === 'clinical_data_unavailable'
    || draft.exceptionIssue === 'letter_generation_failure'
    || draft.exceptionIssue === 'extraction_failure'

  // visit_unavailable / clinical_data_unavailable: Cancel + Skip + Archive
  if (isUnavailable && onArchive && chrome.kind === 'queue') {
    return (
      <Box sx={{ ...FOOTER_SX, justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" onClick={chrome.onBackToList} sx={{ fontSize: 'var(--font-sizes-14)' }}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={chrome.onNext}
          disabled={!chrome.canNext}
          sx={{ fontSize: 'var(--font-sizes-14)' }}
        >
          Skip
        </Button>
        <Button variant="contained" size="small" onClick={onArchive} sx={{ fontSize: 'var(--font-sizes-14)' }}>
          {chrome.canNext ? 'Archive & Next' : 'Archive'}
        </Button>
      </Box>
    )
  }

  if (chrome.kind === 'wizard') {
    return (
      <Box sx={{ ...FOOTER_SX, justifyContent: 'space-between' }}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={chrome.onBackToFindEncounter}
          sx={{ ...GHOST_BTN_SX, fontSize: 'var(--font-sizes-14)' }}
        >
          Back to Find Encounter
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={chrome.onCancel} sx={{ fontSize: 'var(--font-sizes-14)' }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={onSave} sx={{ fontSize: 'var(--font-sizes-14)' }}>
            Create Denial
          </Button>
        </Box>
      </Box>
    )
  }

  if (chrome.kind === 'queue') {
    return (
      <Box sx={{ ...FOOTER_SX, justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" onClick={chrome.onBackToList} sx={{ fontSize: 'var(--font-sizes-14)' }}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={chrome.onNext}
          disabled={!chrome.canNext}
          sx={{ fontSize: 'var(--font-sizes-14)' }}
        >
          Skip
        </Button>
        <Button variant="contained" size="small" onClick={onSave} sx={{ fontSize: 'var(--font-sizes-14)' }}>
          Resolve & Next
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ ...FOOTER_SX, justifyContent: 'flex-end' }}>
      <Button variant="outlined" size="small" onClick={chrome.onBackToList} sx={{ fontSize: 'var(--font-sizes-14)' }}>
        Cancel
      </Button>
      <Button variant="contained" size="small" onClick={onSave} sx={{ fontSize: 'var(--font-sizes-14)' }}>
        Save and Generate Letter
      </Button>
    </Box>
  )
}

// ── Exception → section id mapping ───────────────────────────────────────────

const EXCEPTION_SECTION_MAP: Partial<Record<ExceptionIssue, string>> = {
  missing_icd10:          'payer-adj',
  classification_unclear: 'denial-type',
  related_instance:       'related-denials',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FullPageEditDenialDetails({ draft, chrome, onChangeEncounter, onSave, onArchive, onRetry, sourceData }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false)

  // When the draft changes (user navigates prev/next), reset to top then
  // smooth-scroll to the relevant section so the user sees where they are.
  const draftKey = `${draft.patientName ?? ''}-${draft.encounter.har ?? ''}-${draft.exceptionIssue ?? ''}`
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Snap to top immediately
    container.scrollTop = 0

    const sectionId = draft.exceptionIssue ? EXCEPTION_SECTION_MAP[draft.exceptionIssue] : undefined
    if (!sectionId) return

    const timer = setTimeout(() => {
      const section = document.getElementById(sectionId)
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 320)

    return () => clearTimeout(timer)
  }, [draftKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      bgcolor: 'var(--colors-grey-2)',
    }}>
      {chrome.kind === 'wizard' && <WizardChrome onBackToFindEncounter={chrome.onBackToFindEncounter} />}
      {chrome.kind === 'queue' && (
        <QueueChrome
          position={chrome.position} total={chrome.total} deadlineLabel={chrome.deadlineLabel}
          onBackToList={chrome.onBackToList} onPrev={chrome.onPrev} onNext={chrome.onNext}
          canPrev={chrome.canPrev} canNext={chrome.canNext}
          patientName={chrome.patientName} payer={chrome.payer} claimId={chrome.claimId} exceptionLabel={chrome.exceptionLabel}
          onToggleSource={sourceData ? () => setSourcePanelOpen(o => !o) : undefined}
          sourcePanelOpen={sourcePanelOpen}
        />
      )}
      {chrome.kind === 'case' && (
        <CaseChrome
          patientName={chrome.patientName} deadlineLabel={chrome.deadlineLabel}
          level={chrome.level} status={chrome.status}
          onBackToList={chrome.onBackToList}
        />
      )}

      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <Box ref={scrollContainerRef} sx={{ flex: 1, overflow: 'auto' }}>
          <FormBody draft={draft} onChangeEncounter={onChangeEncounter} onArchive={onArchive} onRetry={onRetry} />
        </Box>
        {sourcePanelOpen && sourceData && (
          <SourcePanel
            sourceData={sourceData}
            onClose={() => setSourcePanelOpen(false)}
            exceptionIssue={draft.exceptionIssue}
          />
        )}
      </Box>

      <FooterBar chrome={chrome} draft={draft} onSave={onSave} onArchive={onArchive} />
    </Box>
  )
}
