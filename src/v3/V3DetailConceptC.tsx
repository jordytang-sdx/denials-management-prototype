// V3 — Concept C: Tabbed scaffold.
//
// Layout shape:
//   ┌─────────────────────────────────────────────────────────┐
//   │ Standardized case header                                │
//   │ Overview · Appeal · Clinical · Activity · Outcome · Att │ ← DS Tabs
//   ├─────────────────────────────────────────────┬───────────┤
//   │                                             │ DENIAL    │
//   │   Active tab content (Appeal = workspace)   │ DETAIL    │
//   │                                             │           │
//   └─────────────────────────────────────────────┴───────────┘
//
// All visuals use SmarterDx design tokens — no hardcoded hex / rgba / px
// fonts / numeric weights. See design-system-tokens.css.

import { Box, Typography, ButtonBase } from '@mui/material'
import { useState } from 'react'
// Icons: lucide-react matches the SmarterDx DS. Do NOT import @mui/icons-material here.
import { Paperclip, CheckCircle2, ChevronRight, ArrowDown, ArrowRight, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { MOCK_EVIDENCE } from '../case-page/mockData'
import type { DenialRecord } from '../data/denials'
import V3CaseHeader from './V3CaseHeader'
import V3LetterWorkspace from './V3LetterWorkspace'
import V3CommentsSheet, { type CaseComment } from './V3CommentsSheet'
import V3SourceSheet, { type SourceSheetData } from './V3SourceSheet'
import FullPageEditDenialDetails, { type DenialDraft } from '../v4/FullPageEditDenialDetails'
import V3AiEditorChat from './V3AiEditorChat'
import DsTabs, { type DsTabItem } from '../ds/DsTabs'
import DsBadge from '../ds/DsBadge'
import DsAlert, { type DsAlertVariant } from '../ds/DsAlert'

// ── Payer Adjustments mock ───────────────────────────────────────────────────
// What the payer changed on a DRG downgrade. Mirrors the Edit Denial Details
// "Payer Adjustments" panel (Billed DRG → Adjusted DRG + per-row dx/proc
// deltas). Keyed by denialSubtype so V3 picks up the right shape per case.
type DrgTier = 'MCC' | 'CC' | 'Base'
type RowChange = 'Added' | 'Removed' | 'Unchanged'
type BilledRole = 'Principal' | 'MCC' | 'CC'

interface PayerAdjustment {
  drgType: 'MS-DRG' | 'APR-DRG'
  billed:   { code: string; description: string; tier: DrgTier }
  adjusted: { code: string; description: string; tier: DrgTier }
  diagnoses: Array<{
    code: string
    description: string
    billedRole?: BilledRole
    change: RowChange
  }>
  procedures: Array<{
    code: string
    description: string
    change: RowChange
  }>
}

const MOCK_PAYER_ADJUSTMENTS: Record<string, PayerAdjustment> = {
  'MS-DRG 291 → 292': {
    drgType: 'MS-DRG',
    billed:   { code: '291', description: 'Heart Failure and Shock w/ MCC', tier: 'MCC' },
    adjusted: { code: '292', description: 'Heart Failure and Shock w/ CC',  tier: 'CC'  },
    diagnoses: [
      { code: 'I50.21', description: 'Acute systolic (congestive) heart failure',          billedRole: 'Principal', change: 'Unchanged' },
      { code: 'J96.21', description: 'Acute and chronic respiratory failure with hypoxia', billedRole: 'MCC',       change: 'Removed'   },
      { code: 'N17.9',  description: 'Acute kidney failure, unspecified',                                           change: 'Unchanged' },
      { code: 'I10',    description: 'Essential (primary) hypertension',                                            change: 'Unchanged' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications',                              change: 'Unchanged' },
    ],
    procedures: [],
  },
  'MS-DRG 470 → 483': {
    drgType: 'MS-DRG',
    billed:   { code: '470', description: 'Major Hip and Knee Joint Replacement w/o MCC', tier: 'Base' },
    adjusted: { code: '483', description: 'Major Joint/Limb Reattach Upper Extremity',     tier: 'Base' },
    diagnoses: [
      { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee', billedRole: 'Principal', change: 'Unchanged' },
      { code: 'Z96.651', description: 'Presence of right artificial knee joint',                               change: 'Removed'   },
    ],
    procedures: [
      { code: '0SRC0J9', description: 'Replacement of right knee joint with synthetic substitute', change: 'Unchanged' },
    ],
  },
}

function getPayerAdjustment(caseRecord?: DenialRecord): PayerAdjustment | null {
  if (!caseRecord || caseRecord.denialType !== 'DRG Downgrade') return null
  return MOCK_PAYER_ADJUSTMENTS[caseRecord.denialSubtype] ?? null
}

function changeVariant(change: RowChange): 'success' | 'error' | 'default' {
  if (change === 'Added')   return 'success'
  if (change === 'Removed') return 'error'
  return 'default'
}

// Demo seed — a couple of comments so the badge + thread aren't empty in
// the prototype. Replace with real persistence behind the scenes.
const SEED_COMMENTS: CaseComment[] = [
  {
    id: 'c1',
    author: 'Dr. Lin',
    authorInitials: 'DL',
    authorColorToken: 'var(--colors-ocean-7)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    body: 'Sepsis bundle was completed within 3h — worth highlighting in the letter alongside the SIRS criteria.',
  },
  {
    id: 'c2',
    author: 'Krista Soriano',
    authorInitials: 'KS',
    authorColorToken: 'var(--colors-ocean-9)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    body: 'Pulled the latest ABG results into Attachments. @Dr. Lin — let me know if anything else is missing before I finalize.',
    isSelf: true,
  },
]

type TabId = 'overview' | 'appeal' | 'outcome' | 'attachments'

interface V3DetailConceptCProps {
  caseRecord?: DenialRecord
  // Optional back-to-worklist handler. Wired in V2 case-page route; V3
  // standalone explorations omit it (header back arrow stays inert there).
  onBack?: () => void
  // Status transition handler. V2 wires this to App.handleV2StatusAction so
  // the header status picker drives the denial state machine. Some actions
  // (record-decision) carry structured payload from the DecisionModal.
  onStatusAction?: (action: string, payload?: { outcome?: string; intent?: string }) => void
}

function isoToMDY(iso: string | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}

// Phase-aware default tab — pick the landing surface that matches the active JTBD:
//   - Active editing (Queue/InProgress): Appeal (writing IS the work)
//   - Submitted: Overview (tracking + lifecycle is the work)
//   - Outcome states (Overturned/Closed): Outcome (decision is the work)
// ─── Edit / source helpers ───────────────────────────────────────────────────
// Build a `DenialDraft` from the case record so the V3 kebab "Edit denial
// details" can hand off to the existing FullPageEditDenialDetails screen.
// Mirrors App.tsx's draftFromDenial, slimmed to the fields V3 sets directly
// (no override/relatedDenial wiring — V3 doesn't have a Change Encounter flow).
function draftFromCase(d: DenialRecord): DenialDraft {
  const levelMap: Record<string, string> = { L1: 'Level 1', L2: 'Level 2', L3: 'Level 3' }
  return {
    patientName: d.patient.name,
    patientDob: null,
    payer: d.payer,
    classifiedAs: d.denialType,
    claimId: d.claim.claimId ?? d.claim.har ?? null,
    deadline: d.deadline,
    defaultLevel: levelMap[d.appealLevel] ?? 'Level 1',
    encounter: {
      har: d.claim.har,
      mrn: d.patient.mrn,
      visitId: null,
      dos: d.dos,
      discharged: null,
    },
  }
}

// Format a deadline ISO date as the "Mar 5, 2026"-style label the queue chrome
// uses. Local to V3 — App.tsx's formatDeadlineLabel isn't exported.
function formatDeadlineLabel(iso: string | null | undefined): string {
  if (!iso) return 'No deadline'
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Synthesize a SourceSheetData payload from the case record. In the real
// product this would come from the ingest extraction blob; here we derive it
// so the drawer shows realistic, case-specific values.
function buildSourceData(d: DenialRecord): SourceSheetData {
  const lastName = d.patient.name.trim().split(/\s+/).pop() ?? 'case'
  const dosCompact = (d.dos ?? '').replace(/-/g, '')
  return {
    fileName: dosCompact
      ? `${d.payer.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${lastName.toLowerCase()}_${dosCompact}.pdf`
      : null,
    extracted: [
      { label: 'HAR',             value: d.claim.har, tabular: true },
      { label: 'Claim ID',        value: d.claim.claimId, tabular: true },
      { label: 'Date of Service', value: isoToMDY(d.dos), tabular: true },
      { label: 'Denied Amount',   value: `$${d.deniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tabular: true },
    ],
    patient: [
      { label: 'Name',          value: d.patient.name },
      { label: 'MRN',           value: d.patient.mrn, tabular: true },
    ],
  }
}

function defaultTabForState(state: DenialRecord['state'] | undefined): TabId {
  switch (state) {
    case 'Submitted':  return 'overview'
    case 'Overturned': return 'outcome'
    case 'Closed':     return 'outcome'
    case 'Archive':    return 'overview'
    default:           return 'appeal'
  }
}

// Map evidence strength → DS color tokens. MOCK_EVIDENCE includes a hardcoded
// strengthColor we don't read anymore — we drive color from the strength value
// so it always lines up with the DS palette.
function strengthTokens(strength: string) {
  switch (strength) {
    case 'Strong':   return { color: 'var(--colors-green-5)',  bg: 'var(--colors-green-1)'  }
    case 'Moderate': return { color: 'var(--colors-orange-7)', bg: 'var(--colors-orange-1)' }
    case 'Low':
    default:         return { color: 'var(--colors-red-5)',    bg: 'var(--colors-red-1)'    }
  }
}

export default function V3DetailConceptC({ caseRecord, onBack, onStatusAction }: V3DetailConceptCProps) {
  const [activeTab, setActiveTab] = useState<TabId>(() => defaultTabForState(caseRecord?.state))
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [comments, setComments] = useState<CaseComment[]>(SEED_COMMENTS)

  const handleAddComment = (body: string) => {
    setComments(prev => [...prev, {
      id: `c-${Date.now()}`,
      author: 'Krista Soriano',
      authorInitials: 'KS',
      authorColorToken: 'var(--colors-ocean-9)',
      createdAt: new Date().toISOString(),
      body,
      isSelf: true,
    }])
  }

  const TABS: DsTabItem<TabId>[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'appeal',      label: 'Appeal' },
    { id: 'outcome',     label: 'Outcome' },
    { id: 'attachments', label: 'Attachments' },
  ]

  const tabStrip = (
    <DsTabs<TabId>
      tabs={TABS}
      activeId={activeTab}
      onChange={setActiveTab}
      size="md"
      paddingX="var(--spacing-5)"
    />
  )


  // Kebab → Edit denial details: render the existing full-page editor inline
  // so the user never leaves V3. Returning to the case is wired via chrome.
  if (editingDetails && caseRecord) {
    return (
      <FullPageEditDenialDetails
        draft={draftFromCase(caseRecord)}
        chrome={{
          kind: 'case',
          patientName: caseRecord.patient.name,
          deadlineLabel: formatDeadlineLabel(caseRecord.deadline),
          level: caseRecord.appealLevel,
          status: caseRecord.status,
          onBackToList: () => setEditingDetails(false),
        }}
        onChangeEncounter={() => { /* V3 prototype: change-encounter flow not wired */ }}
        onSave={() => setEditingDetails(false)}
      />
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'var(--colors-grey-1)' }}>
      <V3CaseHeader
        caseRecord={caseRecord}
        subRow={tabStrip}
        commentCount={comments.length}
        onOpenComments={() => setCommentsOpen(prev => !prev)}
        commentsOpen={commentsOpen}
        hideAvatar
        lastNameFirst
        appealLevelAsChip
        onEditDenialDetails={caseRecord ? () => setEditingDetails(true) : undefined}
        onViewSource={caseRecord ? () => setSourceOpen(true) : undefined}
        onBack={onBack}
        onStatusAction={onStatusAction}
      />

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Main pane — active tab content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'var(--colors-grey-1)' }}>
          {activeTab === 'appeal' && (
            <V3LetterWorkspace hideAiPromptBar />
          )}

          {activeTab === 'overview' && caseRecord && (
            <Box sx={{ p: 'var(--spacing-6)', overflowY: 'auto' }}>
              <Box sx={{ maxWidth: 920, mx: 'auto' }}>
                <StatusCheckpointStrip
                  checkpoint={computeCheckpoint(caseRecord, {
                    onJumpToAppeal:  () => setActiveTab('appeal'),
                    onJumpToOutcome: () => setActiveTab('outcome'),
                  })}
                />
                <SummaryCard
                  caseRecord={caseRecord}
                  adjustment={getPayerAdjustment(caseRecord)}
                />
                <ActivityTimelineBody />
              </Box>
            </Box>
          )}

          {activeTab === 'outcome' && (
            <Box sx={{ p: 'var(--spacing-6)', overflowY: 'auto', bgcolor: 'var(--colors-grey-2)' }}>
              <Box sx={{ maxWidth: 720, mx: 'auto' }}>
                <SectionLabel>Record payer decision</SectionLabel>
                <CardSurface sx={{ p: 'var(--spacing-5)', mb: 'var(--spacing-4)' }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)', mb: 'var(--spacing-4)' }}>
                    Capture the payer's response. Recorded outcomes feed reporting and inform future appeal strategy.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', mb: 'var(--spacing-4)' }}>
                    <Box>
                      <OverlineLabel>Decision *</OverlineLabel>
                      <Box component="select" defaultValue="" sx={fieldSx}>
                        <option value="" disabled>Select…</option>
                        <option value="overturned_full">Overturned — full</option>
                        <option value="overturned_partial">Overturned — partial</option>
                        <option value="upheld">Upheld</option>
                        <option value="dismissed">Dismissed</option>
                      </Box>
                    </Box>
                    <Box>
                      <OverlineLabel>Decision date *</OverlineLabel>
                      <Box component="input" type="date" sx={fieldSx} />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 'var(--spacing-4)' }}>
                    <OverlineLabel>Amount recovered</OverlineLabel>
                    <Box component="input" placeholder="$0.00" sx={{ ...fieldSx, fontVariantNumeric: 'tabular-nums' }} />
                  </Box>

                  <Box sx={{ mb: 'var(--spacing-4)' }}>
                    <OverlineLabel>Payer's rationale</OverlineLabel>
                    <Box component="textarea" rows={4} placeholder="Paste the payer's stated reasoning from the determination letter…" sx={{
                      ...fieldSx,
                      height: 'auto',
                      py: 'var(--spacing-2)',
                      resize: 'vertical',
                    }} />
                  </Box>

                  <Box sx={{ mb: 'var(--spacing-4)' }}>
                    <OverlineLabel>Next step</OverlineLabel>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      {[
                        { v: 'close',   label: 'Close this case' },
                        { v: 'level2',  label: 'Open Level 2 appeal' },
                        { v: 'no_more', label: 'Will not appeal further' },
                      ].map(o => (
                        <Box key={o.v} component="label" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                          <Box component="input" type="radio" name="next-step" defaultChecked={o.v === 'close'} sx={{ m: 0, accentColor: 'var(--colors-ocean-4)' }} />
                          <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-primary)' }}>{o.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 'var(--spacing-1)' }}>
                    <OverlineLabel>Payer determination letter</OverlineLabel>
                    <Box sx={{
                      border: 'var(--border-widths-thin) dashed var(--colors-grey-5)',
                      borderRadius: 'var(--radii-sm)',
                      px: 'var(--spacing-4)', py: 'var(--spacing-3)',
                      display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'var(--colors-ocean-4)',
                        bgcolor: 'var(--colors-ocean-1)',
                      },
                    }}>
                      <Paperclip size={16} strokeWidth={2} style={{ color: 'var(--colors-text-tertiary)' }} />
                      <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-secondary)' }}>
                        Drop the payer's response letter here, or{' '}
                        <Box component="span" sx={{
                          color: 'var(--colors-link-variant-default-text)',
                          fontWeight: 'var(--font-weights-medium)',
                        }}>
                          browse
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                </CardSurface>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                  <ButtonBase sx={{
                    px: 'var(--spacing-4)', height: 34,
                    borderRadius: 'var(--radii-sm)',
                    fontSize: 'var(--font-sizes-14)',
                    fontWeight: 'var(--font-weights-medium)',
                    color: 'var(--colors-interactive-ghost-text)',
                    '&:hover': { bgcolor: 'var(--colors-interactive-hover-ghost-background)', color: 'var(--colors-interactive-hover-ghost-text)' },
                  }}>
                    Cancel
                  </ButtonBase>
                  <ButtonBase sx={{
                    px: 'var(--spacing-4)', height: 34,
                    borderRadius: 'var(--radii-sm)',
                    fontSize: 'var(--font-sizes-14)',
                    fontWeight: 'var(--font-weights-semibold)',
                    color: 'var(--colors-interactive-action-text)',
                    bgcolor: 'var(--colors-interactive-action-background)',
                    '&:hover': { bgcolor: 'var(--colors-ocean-5)' },
                  }}>
                    Save outcome
                  </ButtonBase>
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 'attachments' && (
            <Box sx={{ p: 'var(--spacing-6)', overflowY: 'auto' }}>
              <Box sx={{ maxWidth: 920, mx: 'auto' }}>
                <Box sx={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                  {[
                    { name: 'demo-denial-letter.pdf',                          size: '133 KB', date: 'Aug 06, 2024' },
                    { name: 'Inpatient Clinical Notes — Admission.pdf',        size: '2.4 MB', date: 'Aug 12, 2024' },
                    { name: 'ABG Results — Serial (06/01–06/05/2024).pdf',     size: '0.8 MB', date: 'Aug 12, 2024' },
                    { name: 'Microbiology Report — Blood Culture.pdf',         size: '1.1 MB', date: 'Aug 12, 2024' },
                    { name: 'Physician Attestation and Addendum.pdf',          size: '0.4 MB', date: 'Aug 12, 2024' },
                  ].map(f => (
                    <Box key={f.name} sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      bgcolor: 'var(--colors-grey-1)',
                      border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
                      borderRadius: 'var(--radii-sm)',
                      px: 'var(--spacing-3)', py: 'var(--spacing-2)',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'var(--colors-ocean-4)',
                        bgcolor: 'var(--colors-ocean-1)',
                      },
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <Paperclip size={16} strokeWidth={2} style={{ color: 'var(--colors-text-tertiary)' }} />
                        <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-primary)' }}>{f.name}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>{f.size} · {f.date}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Right rail — context-flexing. */}
        <Box sx={{
          width: activeTab === 'appeal' ? 360 : 320,
          flexShrink: 0,
          borderLeft: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          bgcolor: activeTab === 'appeal' ? 'var(--colors-grey-1)' : 'var(--colors-grey-2)',
          overflowY: activeTab === 'appeal' ? 'hidden' : 'auto',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <RailContent activeTab={activeTab} caseRecord={caseRecord} onJumpToOverview={() => setActiveTab('overview')} />
        </Box>

        <V3CommentsSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          comments={comments}
          onAddComment={handleAddComment}
        />

        {caseRecord && (
          <V3SourceSheet
            open={sourceOpen}
            onClose={() => setSourceOpen(false)}
            data={buildSourceData(caseRecord)}
          />
        )}
      </Box>
    </Box>
  )
}

// ─── Token-styled primitives ─────────────────────────────────────────────────

const fieldSx = {
  width: '100%', height: 36,
  px: 'var(--spacing-2)',
  borderRadius: 'var(--radii-sm)',
  border: 'var(--border-widths-textarea-border-width, var(--border-widths-thin)) solid var(--colors-interactive-input-border)',
  bgcolor: 'var(--colors-interactive-input-background)',
  color: 'var(--colors-interactive-input-text)',
  fontSize: 'var(--font-sizes-14)',
  fontFamily: 'inherit', outline: 'none',
  '&::placeholder': { color: 'var(--colors-interactive-input-placeholder)' },
  '&:focus': {
    borderColor: 'var(--colors-ocean-4)',
    boxShadow: 'var(--shadows-interactive-focus-focus-ring)',
  },
} as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: 'var(--font-sizes-10)',
      fontWeight: 'var(--font-weights-bold)',
      color: 'var(--colors-text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      mb: 'var(--spacing-2)',
    }}>
      {children}
    </Typography>
  )
}

function OverlineLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: 'var(--font-sizes-10)',
      fontWeight: 'var(--font-weights-semibold)',
      color: 'var(--colors-text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      mb: 'var(--spacing-1)',
      lineHeight: 1,
    }}>
      {children}
    </Typography>
  )
}

function CardSurface({ children, sx }: { children: React.ReactNode; sx?: Parameters<typeof Box>[0]['sx'] }) {
  return (
    <Box sx={[
      {
        bgcolor: 'var(--colors-grey-1)',
        border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
        borderRadius: 'var(--radii-card-radius)',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}>
      {children}
    </Box>
  )
}

// ─── Right-rail subcomponents ─────────────────────────────────────────────────

function RailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{
      p: 'var(--spacing-4)',
      borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
    }}>
      <Typography sx={{
        fontSize: 'var(--font-sizes-10)',
        fontWeight: 'var(--font-weights-bold)',
        color: 'var(--colors-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        mb: 'var(--spacing-3)',
      }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

function DenialDetailCard({ caseRecord }: { caseRecord?: DenialRecord }) {
  return (
    <RailSection label="Denial Detail">
      <OverlineLabel>Adjustment Codes</OverlineLabel>
      <Box sx={{ mb: 'var(--spacing-1)' }}>
        <DsBadge variant="error">{caseRecord?.carc ?? 'CARC-50'}</DsBadge>
      </Box>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', mb: 'var(--spacing-4)' }}>
        {caseRecord?.denialSubtype ?? 'Not medically necessary'}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {[
          { label: 'Date of Service',  value: isoToMDY(caseRecord?.dos) },
          { label: 'Denial Received',  value: isoToMDY(caseRecord?.createdAt) },
          { label: 'Appeal Deadline',  value: isoToMDY(caseRecord?.deadline) },
        ].map(row => (
          <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>{row.label}</Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 'var(--spacing-4)', pt: 'var(--spacing-4)', borderTop: 'var(--border-widths-thin) solid var(--colors-grey-3)' }}>
        <OverlineLabel>Payer</OverlineLabel>
        <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-primary)' }}>
          {caseRecord?.payer ?? '—'}
        </Typography>
      </Box>
    </RailSection>
  )
}

// Appeal-tab rail — DS pill-tab segmented switcher between Supporting Evidence
// and AI Editor. The Appeal tab is the workspace's most active surface, so the
// rail hosts the two tools writers reach for most.
type AppealRailSegment = 'evidence' | 'ai'

function AppealRail({
  adjustment,
  onJumpToOverview,
}: {
  adjustment: PayerAdjustment | null
  onJumpToOverview: () => void
}) {
  const [segment, setSegment] = useState<AppealRailSegment>('evidence')
  const segments: DsTabItem<AppealRailSegment>[] = [
    { id: 'evidence', label: 'Supporting Evidence', icon: <CheckCircle2 size={16} strokeWidth={2} /> },
    { id: 'ai',       label: 'AI Editor',           icon: <Sparkles size={16} strokeWidth={2} /> },
  ]
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'var(--colors-grey-1)' }}>
      {adjustment && (
        <PayerAdjustmentRailSection adjustment={adjustment} onJumpToOverview={onJumpToOverview} />
      )}
      <DsTabs<AppealRailSegment>
        tabs={segments}
        activeId={segment}
        onChange={setSegment}
        size="sm"
        paddingX="var(--spacing-3)"
      />
      {segment === 'evidence' ? <SupportingEvidencePanel /> : <V3AiEditorChat />}
    </Box>
  )
}

function SupportingEvidencePanel() {
  return (
    <Box sx={{
      flex: 1, overflowY: 'auto',
      px: 'var(--spacing-3)', py: 'var(--spacing-3)',
      bgcolor: 'var(--colors-grey-2)',
    }}>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', lineHeight: 1.5, mb: 'var(--spacing-3)' }}>
        Chart-sourced evidence supporting this appeal. Click an item to cite it in the letter.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {MOCK_EVIDENCE.map(item => (
          <EvidenceCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  )
}

// Evidence card — strength bars + label + chevron. All colors via DS tokens.
function EvidenceCard({ item }: { item: { id: number; condition: string; count: number; strength: string } }) {
  const STRENGTH_BARS: Record<string, number> = { Strong: 3, Moderate: 2, Low: 1 }
  const bars = STRENGTH_BARS[item.strength] ?? 1
  const t = strengthTokens(item.strength)
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: 'var(--colors-grey-1)',
        border: 'var(--border-widths-card-border-width) solid var(--colors-grey-3)',
        borderRadius: 'var(--radii-card-radius)',
        px: 'var(--spacing-3)', py: 'var(--spacing-2)',
        cursor: 'pointer',
        transition: 'background-color 120ms ease, border-color 120ms ease',
        '&:hover': {
          borderColor: 'var(--colors-ocean-4)',
          bgcolor: 'var(--colors-ocean-1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)',
          fontWeight: 'var(--font-weights-medium)',
          color: 'var(--colors-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.condition}
        </Typography>
        <Box sx={{
          width: 18, height: 18,
          borderRadius: 'var(--radii-full)',
          bgcolor: 'var(--colors-grey-3)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-10)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {item.count}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {[1, 2, 3].map(b => (
            <Box key={b} sx={{
              width: 3, height: b * 4,
              bgcolor: b <= bars ? t.color : 'var(--colors-grey-4)',
              borderRadius: '1px',
            }} />
          ))}
        </Box>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)',
          fontWeight: 'var(--font-weights-medium)',
          color: 'var(--colors-text-secondary)',
          minWidth: 56,
        }}>
          {item.strength}
        </Typography>
        <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--colors-text-tertiary)' }} />
      </Box>
    </Box>
  )
}

function FinancialSummarySection({ caseRecord }: { caseRecord?: DenialRecord }) {
  const denied = caseRecord ? `$${caseRecord.deniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  return (
    <RailSection label="Financial">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {[
          { label: 'Denied',    value: denied, isError: true },
          { label: 'Recovered', value: '—' },
          { label: 'Remaining', value: '—' },
        ].map(row => (
          <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>{row.label}</Typography>
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: row.isError ? 'var(--colors-text-error)' : 'var(--colors-text-primary)',
              fontWeight: row.isError ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {row.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </RailSection>
  )
}

// ─── Payer Adjustments — Overview body card ───────────────────────────────────
// Canonical deep-read surface: full DRG before/after + dx/procedure delta
// table. Signal-first: change rows visible by default; "Show N unchanged"
// expands the noise on demand.

function DrgRow({ code, description, tier }: { code: string; description: string; tier: DrgTier }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
      <Box sx={{
        minWidth: 56,
        px: 'var(--spacing-2)', py: 'var(--spacing-1)',
        borderRadius: 'var(--radii-full)',
        border: 'var(--border-widths-thin) solid var(--colors-grey-4)',
        bgcolor: 'var(--colors-grey-1)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--font-sizes-14)',
        fontWeight: 'var(--font-weights-semibold)',
        color: 'var(--colors-text-primary)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {code}
      </Box>
      <Typography sx={{
        flex: 1, minWidth: 0,
        fontSize: 'var(--font-sizes-14)',
        color: 'var(--colors-text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {description}
      </Typography>
      <DsBadge variant="default">{tier}</DsBadge>
    </Box>
  )
}

function DeltaTable({
  rows,
  hasBilledColumn,
}: {
  rows: Array<{ code: string; description: string; billedRole?: BilledRole; change: RowChange }>
  hasBilledColumn: boolean
}) {
  const cols = hasBilledColumn ? '96px 1fr 92px 104px' : '96px 1fr 104px'
  return (
    <Box sx={{
      border: 'var(--border-widths-thin) solid var(--colors-grey-3)',
      borderRadius: 'var(--radii-sm)',
      overflow: 'hidden',
    }}>
      <Box sx={{
        display: 'grid', gridTemplateColumns: cols,
        gap: 'var(--spacing-3)',
        px: 'var(--spacing-3)', py: 'var(--spacing-2)',
        bgcolor: 'var(--colors-grey-2)',
        borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
      }}>
        <ColHeader>Code</ColHeader>
        <ColHeader>Description</ColHeader>
        {hasBilledColumn && <ColHeader>Billed</ColHeader>}
        <ColHeader>Change</ColHeader>
      </Box>
      {rows.map((row, idx) => (
        <Box key={`${row.code}-${idx}`} sx={{
          display: 'grid', gridTemplateColumns: cols,
          gap: 'var(--spacing-3)', alignItems: 'center',
          px: 'var(--spacing-3)', py: 'var(--spacing-2)',
          borderTop: idx === 0 ? 'none' : 'var(--border-widths-thin) solid var(--colors-grey-3)',
          bgcolor: 'var(--colors-grey-1)',
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {row.code}
          </Typography>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {row.description}
          </Typography>
          {hasBilledColumn && (
            <Box>
              {row.billedRole && <DsBadge variant="default">{row.billedRole}</DsBadge>}
            </Box>
          )}
          <Box>
            <DsBadge variant={changeVariant(row.change)}>{row.change}</DsBadge>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: 'var(--font-sizes-10)',
      fontWeight: 'var(--font-weights-bold)',
      color: 'var(--colors-text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </Typography>
  )
}

// Issue slot — DRG Downgrade variant. Renders inside SummaryCard's CardSurface.
function IssueSlotDrgDowngrade({ adjustment }: { adjustment: PayerAdjustment }) {
  const dxChanges = adjustment.diagnoses.filter(d => d.change !== 'Unchanged')
  const dxUnchanged = adjustment.diagnoses.filter(d => d.change === 'Unchanged')
  const procChanges = adjustment.procedures.filter(p => p.change !== 'Unchanged')
  const procUnchanged = adjustment.procedures.filter(p => p.change === 'Unchanged')

  const [showDxUnchanged, setShowDxUnchanged] = useState(false)
  const [showProcUnchanged, setShowProcUnchanged] = useState(false)

  const dxRows = showDxUnchanged ? adjustment.diagnoses : dxChanges
  const procRows = showProcUnchanged ? adjustment.procedures : procChanges

  const dxAnyBilled = adjustment.diagnoses.some(d => !!d.billedRole)

  return (
    <>
        {/* DRG before / after */}
        <Box sx={{ mb: 'var(--spacing-4)' }}>
          <OverlineLabel>Billed DRG</OverlineLabel>
          <DrgRow {...adjustment.billed} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', my: 'var(--spacing-2)', pl: 'var(--spacing-1)' }}>
            <Box sx={{
              width: 24, height: 24,
              borderRadius: 'var(--radii-full)',
              bgcolor: 'var(--colors-badge-variant-warning-subtle-background)',
              color: 'var(--colors-badge-variant-warning-subtle-text)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowDown size={14} strokeWidth={2} />
            </Box>
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-text-secondary)',
            }}>
              Payer downgraded
            </Typography>
          </Box>
          <OverlineLabel>Adjusted DRG</OverlineLabel>
          <DrgRow {...adjustment.adjusted} />
        </Box>

        {/* Adjusted Diagnoses */}
        <Box sx={{
          pt: 'var(--spacing-4)',
          borderTop: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          mb: adjustment.procedures.length > 0 ? 'var(--spacing-4)' : 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 'var(--spacing-2)' }}>
            <Typography sx={{
              fontSize: 'var(--font-sizes-14)',
              fontWeight: 'var(--font-weights-semibold)',
              color: 'var(--colors-text-primary)',
            }}>
              Adjusted Diagnoses
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>
              {dxChanges.length === 0 ? 'No changes' : `${dxChanges.length} change${dxChanges.length === 1 ? '' : 's'}`}
            </Typography>
          </Box>
          {dxRows.length > 0 && <DeltaTable rows={dxRows} hasBilledColumn={dxAnyBilled} />}
          {dxUnchanged.length > 0 && (
            <ButtonBase
              onClick={() => setShowDxUnchanged(v => !v)}
              sx={{
                mt: 'var(--spacing-2)',
                display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
                fontSize: 'var(--font-sizes-12)',
                fontWeight: 'var(--font-weights-medium)',
                color: 'var(--colors-link-variant-default-text)',
              }}
            >
              {showDxUnchanged ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
              {showDxUnchanged ? 'Hide unchanged' : `Show ${dxUnchanged.length} unchanged`}
            </ButtonBase>
          )}
        </Box>

        {/* Adjusted Procedures (only when present) */}
        {adjustment.procedures.length > 0 && (
          <Box sx={{
            pt: 'var(--spacing-4)',
            borderTop: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 'var(--spacing-2)' }}>
              <Typography sx={{
                fontSize: 'var(--font-sizes-14)',
                fontWeight: 'var(--font-weights-semibold)',
                color: 'var(--colors-text-primary)',
              }}>
                Adjusted Procedures
              </Typography>
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>
                {procChanges.length === 0 ? 'No changes' : `${procChanges.length} change${procChanges.length === 1 ? '' : 's'}`}
              </Typography>
            </Box>
            {procRows.length > 0 && <DeltaTable rows={procRows} hasBilledColumn={false} />}
            {procUnchanged.length > 0 && (
              <ButtonBase
                onClick={() => setShowProcUnchanged(v => !v)}
                sx={{
                  mt: 'var(--spacing-2)',
                  display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
                  fontSize: 'var(--font-sizes-12)',
                  fontWeight: 'var(--font-weights-medium)',
                  color: 'var(--colors-link-variant-default-text)',
                }}
              >
                {showProcUnchanged ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                {showProcUnchanged ? 'Hide unchanged' : `Show ${procUnchanged.length} unchanged`}
              </ButtonBase>
            )}
          </Box>
        )}
    </>
  )
}

// ─── Summary card — universal container with Outcome + Issue slots ────────────
// Wraps the type-specific Issue content (DRG before/after for downgrades,
// CARC/RARC + denial reason fallback for everything else) and prepends an
// Outcome slot when the case is decided (Overturned / Closed).
function SummaryCard({ caseRecord, adjustment }: {
  caseRecord: DenialRecord
  adjustment: PayerAdjustment | null
}) {
  const decided = caseRecord.state === 'Overturned' || caseRecord.state === 'Closed'
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 'var(--spacing-2)' }}>
        <SectionLabel>Summary</SectionLabel>
        {adjustment && (
          <Typography sx={{
            fontSize: 'var(--font-sizes-10)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {adjustment.drgType}
          </Typography>
        )}
      </Box>
      <CardSurface sx={{ p: 'var(--spacing-5)', mb: 'var(--spacing-6)' }}>
        {decided && <OutcomeSlot caseRecord={caseRecord} />}
        {adjustment ? (
          <IssueSlotDrgDowngrade adjustment={adjustment} />
        ) : (
          <IssueSlotDefault caseRecord={caseRecord} />
        )}
      </CardSurface>
    </>
  )
}

// Outcome slot — shown above the Issue slot when state ∈ {Overturned, Closed}.
function OutcomeSlot({ caseRecord }: { caseRecord: DenialRecord }) {
  const isOverturned = caseRecord.state === 'Overturned'
  const date = isOverturned ? caseRecord.overturnDate : caseRecord.closedDate
  const recovered = isOverturned
    ? `$${caseRecord.deniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null
  return (
    <Box sx={{
      pb: 'var(--spacing-4)',
      mb: 'var(--spacing-4)',
      borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
    }}>
      <OverlineLabel>Outcome</OverlineLabel>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-16)',
            fontWeight: 'var(--font-weights-semibold)',
            color: isOverturned
              ? 'var(--colors-badge-variant-success-subtle-text)'
              : 'var(--colors-text-primary)',
          }}>
            {isOverturned ? 'Overturned by payer' : 'Case closed'}
          </Typography>
          {!isOverturned && caseRecord.closeReason && (
            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', mt: 'var(--spacing-1)' }}>
              {caseRecord.closeReason}
            </Typography>
          )}
          {date && (
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-text-tertiary)',
              mt: 'var(--spacing-1)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {isOverturned ? 'Decision received' : 'Closed'} {isoToMDY(date)}
            </Typography>
          )}
        </Box>
        {recovered && (
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <OverlineLabel>Recovered</OverlineLabel>
            <Typography sx={{
              fontSize: 'var(--font-sizes-18)',
              fontWeight: 'var(--font-weights-bold)',
              color: 'var(--colors-badge-variant-success-subtle-text)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {recovered}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Default Issue slot — fallback for any non-DRG-Downgrade case type.
// Shows CARC/RARC chips, the denial subtype as the headline, and a link to the
// denial letter (placeholder action for the prototype).
function IssueSlotDefault({ caseRecord }: { caseRecord: DenialRecord }) {
  return (
    <Box>
      <OverlineLabel>Reason for Denial</OverlineLabel>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-2)', mb: 'var(--spacing-3)' }}>
        {caseRecord.carc && <DsBadge variant="error">{caseRecord.carc}</DsBadge>}
        {caseRecord.rarc && <DsBadge variant="default">{caseRecord.rarc}</DsBadge>}
      </Box>
      <Typography sx={{
        fontSize: 'var(--font-sizes-16)',
        fontWeight: 'var(--font-weights-semibold)',
        color: 'var(--colors-text-primary)',
        mb: 'var(--spacing-1)',
      }}>
        {caseRecord.denialSubtype || caseRecord.denialType}
      </Typography>
      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)', mb: 'var(--spacing-4)' }}>
        {caseRecord.denialType}
      </Typography>
      <ButtonBase sx={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
        px: 'var(--spacing-2)', py: 'var(--spacing-1)', ml: 'calc(-1 * var(--spacing-2))',
        borderRadius: 'var(--radii-sm)',
        fontSize: 'var(--font-sizes-12)',
        fontWeight: 'var(--font-weights-medium)',
        color: 'var(--colors-link-variant-default-text)',
        '&:hover': { bgcolor: 'var(--colors-ocean-1)' },
      }}>
        <Paperclip size={14} strokeWidth={2} />
        View denial letter
      </ButtonBase>
    </Box>
  )
}

// ─── Status / Next Checkpoint strip ───────────────────────────────────────────
// Body-top one-liner that answers "where this stands + what's next." Surfaces
// the most urgent re-entry signal for mid-workflow users.
type CheckpointAccent = 'info' | 'success' | 'warning' | 'error' | 'default'

interface Checkpoint {
  label: string
  title: string
  detail?: string
  cta?: { label: string; onClick: () => void }
  accent: CheckpointAccent
}

function daysFromTodayTo(iso: string | undefined): number | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return null
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function formatDeadlinePhrase(days: number, iso: string): string {
  if (days < 0) return `passed ${Math.abs(days)}d ago (${isoToMDY(iso)})`
  if (days === 0) return `today (${isoToMDY(iso)})`
  return `in ${days}d (${isoToMDY(iso)})`
}

function computeCheckpoint(
  caseRecord: DenialRecord,
  handlers: { onJumpToAppeal: () => void; onJumpToOutcome: () => void },
): Checkpoint {
  const { state, status, deadline } = caseRecord
  const days = daysFromTodayTo(deadline)
  const tight = days != null && days <= 7

  if (status === 'Submission Failed') {
    return {
      label: 'Blocked',
      title: 'Submission failed — retry required',
      detail: caseRecord.notes || 'Verify payer routing and resubmit.',
      cta: { label: 'Retry submission', onClick: handlers.onJumpToAppeal },
      accent: 'error',
    }
  }

  if (state === 'Overturned') {
    return {
      label: 'Outcome',
      title: 'Overturned by payer',
      detail: caseRecord.overturnDate ? `Decision received ${isoToMDY(caseRecord.overturnDate)}` : undefined,
      accent: 'success',
    }
  }

  if (state === 'Closed') {
    return {
      label: 'Outcome',
      title: 'Case closed',
      detail: caseRecord.closeReason || 'Closed without further action',
      accent: 'default',
    }
  }

  if (state === 'Submitted') {
    const submitted = caseRecord.submissionDate ? isoToMDY(caseRecord.submissionDate) : '—'
    const respDue = caseRecord.responseDueDate ? ` · response expected by ${isoToMDY(caseRecord.responseDueDate)}` : ''
    return {
      label: 'Status',
      title: 'Awaiting payer response',
      detail: `Submitted ${submitted}${respDue}`,
      cta: { label: 'Record outcome', onClick: handlers.onJumpToOutcome },
      accent: 'info',
    }
  }

  if (state === 'Queue') {
    return {
      label: 'Next',
      title: 'Review and start appeal',
      detail: days != null ? `Deadline ${formatDeadlinePhrase(days, deadline)}` : undefined,
      cta: { label: 'Open Appeal', onClick: handlers.onJumpToAppeal },
      accent: tight ? 'warning' : 'info',
    }
  }

  if (state === 'InProgress' && status === 'Appeal Drafting') {
    return {
      label: 'Next',
      title: 'Continue drafting appeal',
      detail: days != null ? `Deadline ${formatDeadlinePhrase(days, deadline)}` : undefined,
      cta: { label: 'Open Appeal', onClick: handlers.onJumpToAppeal },
      accent: tight ? 'warning' : 'info',
    }
  }

  // InProgress with other statuses (Eligibility Investigation, etc.)
  return {
    label: 'Status',
    title: status,
    detail: days != null ? `Deadline ${formatDeadlinePhrase(days, deadline)}` : undefined,
    accent: tight ? 'warning' : 'info',
  }
}

// CheckpointAccent → DsAlert variant. Uses the default emphasis (NOT subtle):
// the storybook reference and the V2 Ingest encounter alert both show a clearly
// colored border, which is only present on the default variant — the `*Subtle`
// variants intentionally have a transparent border in the DS tokens.
function accentToVariant(accent: CheckpointAccent): DsAlertVariant {
  switch (accent) {
    case 'info':    return 'info'
    case 'success': return 'success'
    case 'warning': return 'warning'
    case 'error':   return 'error'
    default:        return 'default'
  }
}

function StatusCheckpointStrip({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <Box sx={{ mb: 'var(--spacing-5)' }}>
      <DsAlert
        variant={accentToVariant(checkpoint.accent)}
        size="sm"
        width="full"
        title={checkpoint.title}
        description={checkpoint.detail}
        actions={checkpoint.cta ? (
          <Box
            component="button"
            onClick={checkpoint.cta.onClick}
            sx={{
              all: 'unset',
              display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
              cursor: 'pointer',
              fontSize: 'var(--font-sizes-12)',
              fontWeight: 'var(--font-weights-semibold)',
              color: 'inherit',
              '&:hover': { opacity: 0.75 },
              '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)', borderRadius: 'var(--radii-sm)' },
            }}
          >
            {checkpoint.cta.label}
            <ArrowRight size={14} strokeWidth={2} />
          </Box>
        ) : undefined}
      />
    </Box>
  )
}

// ─── Body Activity timeline ──────────────────────────────────────────────────
// Promoted from the rail. Full-width chronological log with comfortable
// breathing room. Replaces the rail's compact variant on the Overview tab.
function ActivityTimelineBody() {
  const events = [
    { event: 'Letter ready for review',            date: 'Mar 17, 2026 · 9:33 AM PT', who: 'SmarterDx'       },
    { event: 'Appeal letter generated',            date: 'Mar 17, 2026 · 9:32 AM PT', who: 'SmarterDx'       },
    { event: 'Evidence extracted from chart',      date: 'Mar 17, 2026 · 9:31 AM PT', who: 'SmarterDx'       },
    { event: 'Denial uploaded',                    date: 'Mar 17, 2026 · 9:30 AM PT', who: 'Krista Soriano'  },
  ]
  return (
    <>
      <SectionLabel>Activity</SectionLabel>
      <CardSurface sx={{ p: 'var(--spacing-5)', mb: 'var(--spacing-6)' }}>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'absolute',
            left: 7, top: 8, bottom: 8,
            width: 'var(--border-widths-thin)',
            bgcolor: 'var(--colors-grey-3)',
          }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {events.map((row, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
                <Box sx={{
                  width: 14, height: 14,
                  borderRadius: 'var(--radii-full)',
                  bgcolor: i === 0 ? 'var(--colors-ocean-4)' : 'var(--colors-grey-1)',
                  border: 'var(--border-widths-thin) solid',
                  borderColor: i === 0 ? 'var(--colors-ocean-4)' : 'var(--colors-grey-5)',
                  flexShrink: 0,
                  mt: 'var(--spacing-1)',
                  zIndex: 1,
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 'var(--font-sizes-14)',
                    fontWeight: i === 0 ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
                    color: 'var(--colors-text-primary)',
                  }}>
                    {row.event}
                  </Typography>
                  <Typography sx={{
                    fontSize: 'var(--font-sizes-12)',
                    color: 'var(--colors-text-tertiary)',
                    fontVariantNumeric: 'tabular-nums',
                    mt: 'var(--spacing-0-5)',
                  }}>
                    {row.date} · {row.who}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </CardSurface>
    </>
  )
}

// ─── Payer Adjustments — Rail compact summary ────────────────────────────────
// At-a-glance reference for the writer on Appeal / Clinical / etc. On non-
// Overview tabs the whole block is clickable and jumps to Overview where the
// full delta lives.

function PayerAdjustmentRailSection({
  adjustment,
  onJumpToOverview,
}: {
  adjustment: PayerAdjustment
  onJumpToOverview?: () => void
}) {
  const dxChanges = adjustment.diagnoses.filter(d => d.change !== 'Unchanged')
  const procChanges = adjustment.procedures.filter(p => p.change !== 'Unchanged')

  const changeSummary = (() => {
    const parts: string[] = []
    const removed = dxChanges.filter(d => d.change === 'Removed').length
    const added = dxChanges.filter(d => d.change === 'Added').length
    if (removed) parts.push(`${removed} dx removed`)
    if (added) parts.push(`${added} dx added`)
    if (procChanges.length) parts.push(`${procChanges.length} proc changed`)
    return parts.length ? parts.join(' · ') : 'No code-level changes'
  })()

  const flaggedMcc = dxChanges.find(d => d.billedRole === 'MCC' && d.change === 'Removed')

  const interactive = !!onJumpToOverview

  return (
    <RailSection label="Payer Adjusted">
      <Box
        component={interactive ? ButtonBase : 'div'}
        onClick={onJumpToOverview}
        sx={{
          width: '100%',
          display: 'block', textAlign: 'left',
          borderRadius: 'var(--radii-sm)',
          ...(interactive ? {
            m: 'calc(-1 * var(--spacing-1))',
            p: 'var(--spacing-1)',
            '&:hover': { bgcolor: 'var(--colors-ocean-1)' },
          } : {}),
        }}
      >
        {/* DRG transition */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', mb: 'var(--spacing-1)' }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-10)',
            fontWeight: 'var(--font-weights-bold)',
            color: 'var(--colors-text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            minWidth: 24,
          }}>
            DRG
          </Typography>
          <Typography sx={{
            fontSize: 'var(--font-sizes-14)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {adjustment.billed.code} → {adjustment.adjusted.code}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', mb: 'var(--spacing-3)' }}>
          <DsBadge variant="default">{adjustment.billed.tier}</DsBadge>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>→</Typography>
          <DsBadge variant="default">{adjustment.adjusted.tier}</DsBadge>
        </Box>

        {/* Headline change */}
        {flaggedMcc && (
          <Box sx={{ mb: 'var(--spacing-2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', mb: 'var(--spacing-1)' }}>
              <DsBadge variant="error">Removed MCC</DsBadge>
            </Box>
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              color: 'var(--colors-text-primary)',
            }}>
              <Box component="span" sx={{ fontWeight: 'var(--font-weights-semibold)', fontVariantNumeric: 'tabular-nums' }}>
                {flaggedMcc.code}
              </Box>{' '}
              {flaggedMcc.description}
            </Typography>
          </Box>
        )}

        {/* Summary line + jump affordance */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-2)' }}>
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>
            {changeSummary}
          </Typography>
          {interactive && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', color: 'var(--colors-link-variant-default-text)' }}>
              <Typography sx={{
                fontSize: 'var(--font-sizes-12)',
                fontWeight: 'var(--font-weights-medium)',
                color: 'inherit',
              }}>
                View
              </Typography>
              <ChevronRight size={16} strokeWidth={2} />
            </Box>
          )}
        </Box>
      </Box>
    </RailSection>
  )
}

function RailContent({
  activeTab,
  caseRecord,
  onJumpToOverview,
}: {
  activeTab: TabId
  caseRecord?: DenialRecord
  onJumpToOverview: () => void
}) {
  const adjustment = getPayerAdjustment(caseRecord)
  const adjustmentBlock = adjustment ? (
    <PayerAdjustmentRailSection
      adjustment={adjustment}
      onJumpToOverview={activeTab === 'overview' ? undefined : onJumpToOverview}
    />
  ) : null

  switch (activeTab) {
    case 'overview':
      return (
        <>
          <FinancialSummarySection caseRecord={caseRecord} />
          <DenialDetailCard caseRecord={caseRecord} />
        </>
      )
    case 'appeal':
      return <AppealRail adjustment={adjustment} onJumpToOverview={onJumpToOverview} />
    case 'outcome':
      return (
        <>
          <DenialDetailCard caseRecord={caseRecord} />
          {adjustmentBlock}
          <FinancialSummarySection caseRecord={caseRecord} />
        </>
      )
    case 'attachments':
    default:
      return (
        <>
          <DenialDetailCard caseRecord={caseRecord} />
          {adjustmentBlock}
        </>
      )
  }
}
