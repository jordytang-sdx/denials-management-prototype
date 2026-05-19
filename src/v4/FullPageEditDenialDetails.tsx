import { useState, type ReactNode } from 'react'
import {
  Box, Typography, Button, TextField, Divider,
  IconButton, Chip,
} from '@mui/material'
import SmarterRadioGroup from './SmarterRadio'
import {
  ArrowBackOutlined, ChevronLeft, ChevronRight,
  EditOutlined,
} from '@mui/icons-material'
import SmarterSelect from './SmarterSelect'
import DrgAdjustmentsSection from './DrgAdjustmentsSection'
import { type DrgAdjustments } from './drgMockData'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface DenialDraft {
  patientName: string | null
  patientDob?: string | null
  payer: string | null
  classifiedAs: string | null
  deadline: string | null
  encounter: {
    har?: string | null
    mrn?: string | null
    visitId?: string | null
    dos?: string | null
    discharged?: string | null
  }
  drgAdjustments?: DrgAdjustments
}

export type EditChrome =
  | { kind: 'wizard'; onCancel: () => void; onBackToFindEncounter: () => void }
  | { kind: 'queue'; position: number; total: number; deadlineLabel: string; patientName?: string | null; exceptionLabel?: string | null; onBackToList: () => void; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }
  | { kind: 'case'; patientName: string; deadlineLabel: string; level: string; status: string; onBackToList: () => void }

interface Props {
  draft: DenialDraft
  chrome: EditChrome
  onChangeEncounter: () => void
  onSave: () => void
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
  position, total, deadlineLabel, patientName, exceptionLabel,
  onBackToList, onPrev, onNext, canPrev, canNext,
}: {
  position: number; total: number; deadlineLabel: string
  patientName?: string | null; exceptionLabel?: string | null
  onBackToList: () => void; onPrev: () => void; onNext: () => void
  canPrev: boolean; canNext: boolean
}) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
      px: 3, py: 1.25,
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

      {/* Center: patient + exception context */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {patientName && (
          <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {patientName}
          </Typography>
        )}
        {exceptionLabel && (
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {exceptionLabel}
          </Typography>
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
            height: 22,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Right: position counter + prev/next — integrated as one unit */}
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
}: {
  draft: DenialDraft
  onChangeEncounter: () => void
}) {
  const [denialType, setDenialType] = useState<'drg_downgrade' | 'medical_necessity' | 'other'>(
    parseDenialTypeFromClassification(draft.classifiedAs)
  )
  const [drgReviewType, setDrgReviewType] = useState('Clinical Validation Review')
  const [level, setLevel] = useState('Level 2')
  const [payer, setPayer] = useState(draft.payer ?? '')
  const [deadlineISO, setDeadlineISO] = useState(draft.deadline ?? '')
  const [reviewEntity, setReviewEntity] = useState('')
  const [payerRationale, setPayerRationale] = useState('')

  const FIELD_LABEL_SX = {
    fontSize: 'var(--font-sizes-12)' as const,
    color: 'text.secondary' as const,
    mb: 0.5,
  }

  const encFields: { label: string; value: string | null | undefined; mono?: boolean }[] = [
    { label: 'Name',          value: draft.patientName },
    { label: 'HAR',           value: draft.encounter.har,        mono: true },
    { label: 'MRN',           value: draft.encounter.mrn,        mono: true },
    { label: 'DOS',           value: draft.encounter.dos },
    { label: 'Date of Birth', value: draft.patientDob ?? null },
    { label: 'Visit ID',      value: draft.encounter.visitId,    mono: true },
  ]

  return (
    <Box sx={{
      maxWidth: 960, mx: 'auto', py: 2, px: 3,
      display: 'flex', flexDirection: 'column', gap: 1.5,
    }}>

        <SectionCard
          id="encounter"
          title="Encounter"
          action={(
            <Button
              size="small"
              startIcon={<EditOutlined sx={{ fontSize: '14px !important' }} />}
              onClick={onChangeEncounter}
              sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-ocean-4)' }}
            >
              Change encounter
            </Button>
          )}
        >
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
          <SmarterRadioGroup
            value={denialType}
            onChange={v => setDenialType(v as typeof denialType)}
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
              { value: 'other',             label: 'Other' },
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

        {denialType === 'drg_downgrade' && (
          <SectionCard id="payer-adj" title="Payer Adjustments">
            <DrgAdjustmentsSection adjustments={draft.drgAdjustments} />
          </SectionCard>
        )}

    </Box>
  )
}

// ── Footer variants ───────────────────────────────────────────────────────────

function FooterBar({ chrome, onSave }: { chrome: EditChrome; onSave: () => void }) {
  if (chrome.kind === 'wizard') {
    return (
      <Box sx={{
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 3, py: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
        flexShrink: 0,
      }}>
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
      <Box sx={{
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 3, py: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5,
        flexShrink: 0,
      }}>
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
          Save & Next
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{
      borderTop: '1px solid', borderColor: 'divider',
      bgcolor: 'background.paper',
      px: 3, py: 1.25,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5,
      flexShrink: 0,
    }}>
      <Button variant="outlined" size="small" onClick={chrome.onBackToList} sx={{ fontSize: 'var(--font-sizes-14)' }}>
        Cancel
      </Button>
      <Button variant="contained" size="small" onClick={onSave} sx={{ fontSize: 'var(--font-sizes-14)' }}>
        Save and Generate Letter
      </Button>
    </Box>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FullPageEditDenialDetails({ draft, chrome, onChangeEncounter, onSave }: Props) {
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
        />
      )}
      {chrome.kind === 'case' && (
        <CaseChrome
          patientName={chrome.patientName} deadlineLabel={chrome.deadlineLabel}
          level={chrome.level} status={chrome.status}
          onBackToList={chrome.onBackToList}
        />
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <FormBody draft={draft} onChangeEncounter={onChangeEncounter} />
      </Box>

      <FooterBar chrome={chrome} onSave={onSave} />
    </Box>
  )
}
