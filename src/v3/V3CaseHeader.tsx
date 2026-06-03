// V3 — Standardized case header, modeled on the Charges product header pattern.
// Avatar + Patient name + labeled identifier columns + workflow-specific right side.
// Shared by Concept B (no-tabs) and Concept C (tabbed) so the chrome is identical
// across concepts and only the body differs.
//
// All visual values come from the SmarterDx design system tokens. No hardcoded
// hex / rgba / px font sizes / numeric weights. See design-system-tokens.css.

import { Box, Typography, IconButton, Button, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, CircularProgress } from '@mui/material'
// Icons: lucide-react matches the SmarterDx DS (see packages/react peerDeps).
// Do NOT add @mui/icons-material imports to V3 files.
import {
  ChevronLeft,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Trash2,
  Pencil,
  MessageSquare,
  FileText,
  Send,
  CheckCircle2,
  Ban,
  RotateCcw,
  Gavel,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { DenialRecord, DenialState, TeamMember } from '../data/denials'
import { TEAM_MEMBERS, TODAY } from '../data/denials'
import { getDenialTypeConfig } from '../data/denialTypeConfig'
import DsBadge, { type DsBadgeVariant, type DsBadgeStyle } from '../ds/DsBadge'
import DecisionModal, { type DecisionResult } from '../v4/DecisionModal'

// Picker menu items keyed by current state. Drives the status-badge dropdown.
// When the user picks an item, the consumer fires onStatusAction(id, payload?).
// Destructive items are visually emphasized; record-decision opens a modal
// rather than firing immediately (it needs structured payload).
type PickerItem = {
  id: string
  label: string
  icon: React.ReactNode
  destructive?: boolean
  dividerBefore?: boolean
  // When true, selecting this item opens the DecisionModal rather than
  // immediately firing the status action.
  opensDecision?: boolean
}

function pickerItemsForState(state: DenialState | undefined): PickerItem[] {
  if (state === 'InProgress' || state === 'Queue') {
    return [
      { id: 'send-to-sftp',    label: 'Send to SFTP',             icon: <Send size={14} strokeWidth={2} /> },
      { id: 'submit',          label: 'Mark as Submitted',        icon: <CheckCircle2 size={14} strokeWidth={2} /> },
      { id: 'will-not-submit', label: 'Close without submitting', icon: <Ban size={14} strokeWidth={2} />, destructive: true, dividerBefore: true },
    ]
  }
  if (state === 'Submitted') {
    return [
      { id: 'return-to-review', label: 'Return to Review', icon: <RotateCcw size={14} strokeWidth={2} /> },
      { id: 'record-decision',  label: 'Record Decision',  icon: <Gavel size={14} strokeWidth={2} />, opensDecision: true },
    ]
  }
  // Closed / Overturned / Archive → no picker actions in this iteration.
  return []
}

interface V3CaseHeaderProps {
  caseRecord?: DenialRecord
  // Optional sub-row (e.g., the tab strip for Concept C). Renders below the
  // identifier strip, sharing the same bottom border.
  subRow?: React.ReactNode
  // V3 Concept C only: Comments live at header level (global to the case, not
  // tied to a tab). Pass a handler + count to render the trigger button.
  onOpenComments?: () => void
  commentCount?: number
  // When true, the Comments button reads as "open" — visually anchoring the
  // sheet to its trigger so the relationship between the two is obvious.
  commentsOpen?: boolean
  // Concept C drops the avatar; Concept B keeps it. Gated by prop so the
  // shared header isn't forked.
  hideAvatar?: boolean
  // Concept C: render the patient name as "Last, First" (clinical convention).
  // Concept B keeps "First Last".
  lastNameFirst?: boolean
  // Concept C: render the appeal level as the worklist's L1/L2/L3 chip
  // (info/warning/error). Concept B uses the "Level 1" text.
  appealLevelAsChip?: boolean
  // Kebab actions. Each is optional so the consumer can omit items it doesn't
  // implement. Concept B leaves these undefined and gets a minimal kebab.
  onEditDenialDetails?: () => void
  onViewSource?: () => void
  onDeleteDenial?: () => void
  // Back-to-worklist handler. When provided (e.g. from V2 case-page route),
  // the back arrow becomes interactive. V3's standalone explorations omit it.
  onBack?: () => void
  // Status transition handler. V2 wires this to App.handleV2StatusAction so
  // the status badge picker drives the denial state machine. When omitted
  // (V3 standalone explorations), the badge renders as a static chip.
  //
  // Some transitions (record-decision) carry structured payload from the
  // DecisionModal. The payload shape matches handleV2StatusAction's contract
  // in App.tsx — outcome (PayerOutcome) and optional intent (AppealIntent).
  onStatusAction?: (action: string, payload?: { outcome?: string; intent?: string }) => void
}

// ─── Reusable token-styled primitives ────────────────────────────────────────

// Ghost icon button — uses DS ghost interactive tokens. `active` flips it to
// the "pressed-on" treatment for toggles like the Comments trigger.
function GhostIconButton({
  onClick, title, ariaPressed, active = false, children, indicator,
}: {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  title: string
  ariaPressed?: boolean
  active?: boolean
  children: React.ReactNode
  indicator?: React.ReactNode
}) {
  return (
    <Tooltip title={title}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton
          size="small"
          onClick={onClick}
          aria-pressed={ariaPressed}
          sx={{
            width: 28, height: 28,
            borderRadius: 'var(--radii-sm)',
            color: active ? 'var(--colors-interactive-active-ghost-text)' : 'var(--colors-interactive-ghost-text)',
            bgcolor: active ? 'var(--colors-interactive-active-ghost-background)' : 'var(--colors-interactive-ghost-background)',
            transition: 'background-color 120ms ease, color 120ms ease',
            '&:hover': {
              bgcolor: active ? 'var(--colors-interactive-active-ghost-background)' : 'var(--colors-interactive-hover-ghost-background)',
              color: 'var(--colors-interactive-hover-ghost-text)',
            },
            '&:focus-visible': {
              outline: 'none',
              boxShadow: 'var(--shadows-interactive-focus-focus-ring)',
            },
          }}
        >
          {children}
        </IconButton>
        {indicator}
      </Box>
    </Tooltip>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isoToMDY(iso: string | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}

// Deadline chip — DS Badge with variant driven by urgency. Mirrors the
// urgency rules used on the ingest page:
//   ≤ 0d (overdue / due today) → error
//   1–5d                       → warning
//   > 5d                       → default (subtle)
// Label format is always "Due <Mon> <day>" so the absolute date is legible —
// urgency lives in the color, not the wording.
export function DeadlineChip({ deadlineISO }: { deadlineISO: string }) {
  const parsed = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadlineISO || '')
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }, [deadlineISO])

  const days = useMemo(() => {
    if (!parsed) return null
    return Math.round((parsed.getTime() - TODAY.getTime()) / 86400000)
  }, [parsed])

  const variant: DsBadgeVariant = days == null
    ? 'default'
    : days <= 0
      ? 'error'
      : days <= 5
        ? 'warning'
        : 'default'

  // Non-urgent / unknown deadlines use the outline style — the only chip on the
  // detail page that intentionally carries a visible border. Urgent + overdue
  // stay subtle so the urgency color does the talking.
  const style: DsBadgeStyle = variant === 'default' ? 'outline' : 'subtle'

  const label = parsed
    ? `Due ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'No deadline'

  return (
    <Tooltip title={`Appeal deadline: ${isoToMDY(deadlineISO)}`}>
      <Box sx={{ display: 'inline-flex' }}>
        <DsBadge variant={variant} style={style} icon={<Clock size={12} strokeWidth={2} />}>{label}</DsBadge>
      </Box>
    </Tooltip>
  )
}

// Labeled identifier column — uppercase mini-label stacked above a tabular-nums value.
function LabeledId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!value || value === 'N/A') return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }
  return (
    <Tooltip title={copied ? 'Copied' : `Copy ${label}`}>
      <Box
        component="button"
        onClick={handleCopy}
        sx={{
          all: 'unset',
          cursor: value && value !== 'N/A' ? 'pointer' : 'default',
          display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
          gap: 'var(--spacing-0-5)',
          px: 'var(--spacing-2)', py: 'var(--spacing-1)',
          borderRadius: 'var(--radii-sm)',
          '&:hover': { bgcolor: 'var(--colors-interactive-hover-ghost-background)' },
          '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
          flexShrink: 0,
        }}
      >
        <Typography component="span" sx={{
          fontSize: 'var(--font-sizes-10)',
          fontWeight: 'var(--font-weights-semibold)',
          color: 'var(--colors-text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1,
        }}>
          {label}
        </Typography>
        <Typography component="span" sx={{
          fontSize: 'var(--font-sizes-12)',
          color: 'var(--colors-text-primary)',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.25,
        }}>
          {value || '—'}
        </Typography>
      </Box>
    </Tooltip>
  )
}

// Assignee chip — small avatar + name + dropdown affordance. Lives in the
// secondary row so the assignee is visible on every tab without crowding the
// row-1 action cluster. Click opens a menu of TEAM_MEMBERS; selection is
// purely visual in the prototype (no persistence).
function AssigneeChip({ assignee }: { assignee: TeamMember | null }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [current, setCurrent] = useState<TeamMember | null>(assignee)

  const initialsOf = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const display = current
  return (
    <>
      <Tooltip title={display ? 'Click to reassign' : 'Click to assign'}>
        <Box
          component="button"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget)}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
            gap: 'var(--spacing-1)',
            px: 'var(--spacing-1)', py: 'var(--spacing-0-5)',
            borderRadius: 'var(--radii-sm)',
            '&:hover': { bgcolor: 'var(--colors-interactive-hover-ghost-background)' },
            '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
          }}
        >
          <Typography component="span" sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-tertiary)',
          }}>
            Assigned to
          </Typography>
          <Typography component="span" sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-primary)',
          }}>
            {display ? display.name : 'Unassigned'}
          </Typography>
          <Box component="span" sx={{ display: 'inline-flex', color: 'var(--colors-text-tertiary)' }}>
            <ChevronDown size={14} />
          </Box>
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: {
          minWidth: 220,
          border: 'var(--border-widths-menu-content-border-width) solid var(--colors-menu-content-border-color)',
          boxShadow: 'var(--shadows-menu-content-shadow)',
          borderRadius: 'var(--radii-md)',
          bgcolor: 'var(--colors-menu-content-background)',
        } }}
      >
        <MenuItem
          onClick={() => { setCurrent(null); setAnchor(null) }}
          sx={{ fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))', color: 'var(--colors-text-secondary)' }}
        >
          Unassigned
        </MenuItem>
        {TEAM_MEMBERS.map(member => (
          <MenuItem
            key={member.id}
            onClick={() => { setCurrent(member); setAnchor(null) }}
            sx={{
              fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
              color: 'var(--colors-menu-item-default-text)',
              gap: 'var(--spacing-2)',
            }}
          >
            <Box sx={{
              width: 20, height: 20,
              borderRadius: 'var(--radii-full)',
              bgcolor: 'var(--colors-ocean-9)',
              color: 'var(--colors-text-inverse)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--font-sizes-10)',
              fontWeight: 'var(--font-weights-semibold)',
              flexShrink: 0,
            }}>
              {initialsOf(member.name)}
            </Box>
            {member.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// Appeal level → DS badge variant. Mirrors the worklist's AppealLevelCell:
// L1 → info, L2 → warning, L3+ → error. Outline style matches the worklist
// chip (1px border + soft fill) rather than the bolder default fill.
function levelVariant(level: string): DsBadgeVariant {
  switch (level) {
    case 'L1': return 'info'
    case 'L2': return 'warning'
    case 'L3':
    case 'L4':
    case 'L5': return 'error'
    default: return 'default'
  }
}

// Mirrors the worklist's AppealLevelCell — routes through the DS Badge primitive
// so the subtle (borderless) treatment stays in lockstep with the worklist.
export function AppealLevelChip({ level }: { level: string }) {
  return <DsBadge variant={levelVariant(level)}>{level}</DsBadge>
}

// Status → DS badge variant. Surface case lifecycle without coining colors.
export function statusVariant(status: string): DsBadgeVariant {
  switch (status) {
    case 'Submitted':
    case 'Overturned':
    case 'Overturned (partial)':
    case 'Corrected Claim Paid':
      return 'success'
    case 'Ready for Review':
    case 'Appeal Drafting':
      return 'info'
    case 'Upheld':
    case 'Dismissed':
      return 'warning'
    case 'Closed':
    case 'Will Not Submit':
    case 'Archived':
      return 'default'
    default:
      return 'info'
  }
}

// Map raw backend state to the user-facing status shown in the V3 header chip.
// Mirrors the V2 mapping in CasePageAiEditing.stateToDisplayStatus so a case
// whose internal status is 'Appeal Drafting' surfaces as 'Ready for Review' in
// the workflow chrome — the workflow-facing label, not the internal sub-status.
//
// When a status is provided, Closed and Overturned states differentiate by
// underlying outcome so the badge tells the user *which* terminal state the
// case landed in (Dismissed vs Upheld vs partial-overturn etc.) rather than
// collapsing all closures to a single label.
export function displayStatusFromState(state: DenialState | undefined, status?: string): string {
  switch (state) {
    case 'Queue':
    case 'InProgress': return 'Ready for Review'
    case 'Submitted':  return 'Submitted'
    case 'Overturned':
      if (status === 'Overturned — Partial Payment') return 'Overturned (partial)'
      if (status === 'Corrected Claim Paid')         return 'Corrected Claim Paid'
      return 'Overturned'
    case 'Closed':
      if (status === 'Dismissed')                 return 'Dismissed'
      if (status === 'Upheld - Will Appeal')      return 'Upheld'
      if (status === 'Upheld - Will Not Appeal')  return 'Upheld'
      if (status === 'Upheld by Payer')           return 'Upheld'
      return 'Will Not Submit'
    case 'Archive': return 'Archived'
    default:        return 'Ready for Review'
  }
}

export default function V3CaseHeader({ caseRecord, subRow, onOpenComments, commentCount = 0, commentsOpen = false, hideAvatar = false, lastNameFirst = false, appealLevelAsChip = false, onEditDenialDetails, onViewSource, onDeleteDenial, onBack, onStatusAction }: V3CaseHeaderProps) {
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null)
  const [kebabAnchor, setKebabAnchor] = useState<HTMLElement | null>(null)
  // Delete confirm. Kept inline in the kebab popover (no new modal component
  // — destructive, but the data spec says deletes are irreversible in MVP, so
  // the confirm is a deliberate two-step *within* the kebab rather than a
  // separate dialog. Avoids needing a Dialog primitive we don't have yet.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Pending-transition state. Set when the user picks a state-change option;
  // we keep the badge in a loading treatment ("Submitting…"/"Closing…"/etc.)
  // for a beat before committing the underlying state change via onStatusAction.
  type PendingAction = 'submit' | 'send-to-sftp' | 'will-not-submit' | 'return-to-review' | 'record-decision'
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [decisionOpen, setDecisionOpen] = useState(false)

  function fireStatusAction(action: PendingAction, payload?: { outcome?: string; intent?: string }) {
    setStatusAnchor(null)
    if (!onStatusAction) return
    setPendingAction(action)
    window.setTimeout(() => {
      onStatusAction(action, payload)
      setPendingAction(null)
    }, 1200)
  }

  // Loading-state label for the badge. Mirrors the verb of the action so the
  // user sees the system doing the specific thing they asked for.
  const pendingLabel =
    pendingAction === 'will-not-submit'  ? 'Closing…' :
    pendingAction === 'return-to-review' ? 'Returning…' :
    pendingAction === 'record-decision'  ? 'Recording…' :
                                            'Submitting…'

  const rawPatientName = caseRecord?.patient.name ?? '—'
  // Concept C uses "Last, First" — clinical convention. Falls back to the raw
  // string if the name isn't a simple two-token "First Last".
  const patientName = (() => {
    if (!lastNameFirst || rawPatientName === '—') return rawPatientName
    const parts = rawPatientName.trim().split(/\s+/)
    if (parts.length < 2) return rawPatientName
    const last = parts[parts.length - 1]
    const rest = parts.slice(0, -1).join(' ')
    return `${last}, ${rest}`
  })()
  const har = caseRecord?.claim.har ?? '—'
  const mrn = caseRecord?.patient.mrn ?? '—'
  const visitId = 'N/A'
  const location = 'DEMO'
  const visitDates = caseRecord ? `${isoToMDY(caseRecord.dos)} – ${isoToMDY(caseRecord.dos)}` : '—'
  const deniedAmount = caseRecord ? `$${caseRecord.deniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const denialType = caseRecord?.denialType ?? 'Denial'
  const payer = caseRecord?.payer ?? '—'
  const status = displayStatusFromState(caseRecord?.state, caseRecord?.status)
  // Available transitions for the current state. Empty → render the badge as
  // a static chip (no picker affordance). When this list grows for other
  // states (e.g. Closed reopen flows), this is the only place to extend.
  const pickerItems = pickerItemsForState(caseRecord?.state)
  const hasPickerItems = pickerItems.length > 0

  return (
    <Box sx={{
      bgcolor: 'var(--colors-grey-1)',
      borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
      flexShrink: 0,
    }}>
      {/* Row 1 — Avatar · Patient name · Identifier columns · workflow stakes · Status · CTA · kebab */}
      <Box sx={{
        px: 'var(--spacing-5)',
        pt: 'var(--spacing-3)',
        pb: 'var(--spacing-2)',
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', minWidth: 0,
        borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
      }}>
        {/* Back */}
        <GhostIconButton title="Back to Worklist" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </GhostIconButton>

        {/* Avatar — hidden in Concept C */}
        {!hideAvatar && (
          <Box sx={{
            width: 36, height: 36,
            borderRadius: 'var(--radii-full)',
            bgcolor: 'var(--colors-ocean-9)',
            color: 'var(--colors-text-inverse)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-sizes-12)',
            fontWeight: 'var(--font-weights-semibold)',
            letterSpacing: '0.02em', flexShrink: 0,
          }}>
            {initials(rawPatientName)}
          </Box>
        )}

        {/* Patient name */}
        <Typography sx={{
          fontWeight: 'var(--font-weights-semibold)',
          fontSize: 'var(--font-sizes-18)',
          color: 'var(--colors-text-primary)',
          letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {patientName}
        </Typography>

        {/* Identifier columns — the Charges pattern */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', minWidth: 0, overflow: 'hidden', flex: 1, ml: 'var(--spacing-3)' }}>
          <LabeledId label="HAR" value={har} />
          <LabeledId label="MRN" value={mrn} />
          <LabeledId label="Visit ID" value={visitId} />
          <LabeledId label="Location" value={location} />
          <LabeledId label="Dates of service" value={visitDates} />
        </Box>

        {/* Workflow-specific right side: stakes + status + CTA + kebab */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexShrink: 0 }}>
          <DeadlineChip deadlineISO={caseRecord?.deadline ?? ''} />

          {/* Status picker — the badge IS the affordance. Clicking it opens a
              menu of valid next-state transitions for the current state. The
              trigger mirrors DsBadge's visual treatment (same subtle-variant
              tokens, same dimensions) so a non-interactive badge and the
              picker sit identically in the layout.

              Falls back to a static DsBadge when:
              - onStatusAction isn't provided (V3 standalone explorations), or
              - The current state has no available transitions (terminal states).

              Loading state: while a transition is committing, the badge label
              swaps to a verb-specific loading label with a small spinner, and
              the trigger is disabled so the user can't fire a second action. */}
          {onStatusAction && hasPickerItems ? (() => {
            const variant = pendingAction ? 'default' : statusVariant(status)
            const label = pendingAction ? pendingLabel : status
            const bg = `var(--colors-badge-variant-${variant}-subtle-background)`
            const text = `var(--colors-badge-variant-${variant}-subtle-text)`
            const border = `var(--colors-badge-variant-${variant}-subtle-border)`
            const isDisabled = Boolean(pendingAction)
            return (
              <>
                <Tooltip title={isDisabled ? '' : 'Change status'}>
                  <Box
                    component="button"
                    type="button"
                    disabled={isDisabled}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setStatusAnchor(e.currentTarget)}
                    sx={{
                      // Reset native button. Inherit token-driven badge styles.
                      all: 'unset',
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-badge-gap)',
                      px: 'var(--spacing-badge-padding-x)',
                      py: 'var(--spacing-badge-padding-y)',
                      borderRadius: 'var(--radii-badge-radius)',
                      bgcolor: bg,
                      color: text,
                      border: 'var(--border-widths-badge-border-width) solid',
                      borderColor: border,
                      fontSize: 'var(--font-sizes-12)',
                      fontWeight: 'var(--font-weights-regular)',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                      cursor: isDisabled ? 'default' : 'pointer',
                      opacity: isDisabled ? 0.85 : 1,
                      transition: 'filter 120ms ease, box-shadow 120ms ease',
                      '&:hover': isDisabled ? {} : { filter: 'brightness(0.96)' },
                      '&:focus-visible': { boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
                    }}
                  >
                    {pendingAction && (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', color: 'currentColor' }}>
                        <CircularProgress size={10} thickness={6} sx={{ color: 'currentColor' }} />
                      </Box>
                    )}
                    <span>{label}</span>
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', color: 'currentColor', opacity: 0.7 }}>
                      <ChevronDown size={12} strokeWidth={2} />
                    </Box>
                  </Box>
                </Tooltip>
                <Menu
                  anchorEl={statusAnchor}
                  open={Boolean(statusAnchor)}
                  onClose={() => setStatusAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ sx: {
                    minWidth: 220,
                    mt: 'var(--spacing-1)',
                    border: 'var(--border-widths-menu-content-border-width) solid var(--colors-menu-content-border-color)',
                    boxShadow: 'var(--shadows-menu-content-shadow)',
                    borderRadius: 'var(--radii-md)',
                    bgcolor: 'var(--colors-menu-content-background)',
                  } }}
                >
                  {pickerItems.map((item, idx) => {
                    const itemColor = item.destructive
                      ? 'var(--colors-text-error)'
                      : 'var(--colors-interactive-menu-item-text)'
                    const onItemClick = () => {
                      setStatusAnchor(null)
                      if (item.opensDecision) {
                        // Decision modal handles structured outcome capture;
                        // we don't fire the action until the user confirms.
                        setDecisionOpen(true)
                        return
                      }
                      // Type assertion: pickerItemsForState only emits ids that
                      // map to PendingAction. Anything else is a bug.
                      fireStatusAction(item.id as PendingAction)
                    }
                    return (
                      <Box key={item.id} component="span">
                        {item.dividerBefore && idx > 0 && (
                          <Divider sx={{ my: 'var(--spacing-1)', borderColor: 'var(--colors-menu-content-border-color)' }} />
                        )}
                        <MenuItem
                          onClick={onItemClick}
                          sx={{
                            fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                            color: itemColor,
                            gap: 'var(--spacing-2)',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: '0 !important', color: 'inherit' }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primaryTypographyProps={{ sx: {
                            fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                            color: 'inherit',
                          } }}>{item.label}</ListItemText>
                        </MenuItem>
                      </Box>
                    )
                  })}
                </Menu>
              </>
            )
          })() : (
            <DsBadge variant={statusVariant(status)}>{status}</DsBadge>
          )}

          {/* Kebab */}
          <GhostIconButton
            title="More options"
            onClick={(e) => setKebabAnchor(e.currentTarget)}
          >
            <MoreHorizontal size={18} strokeWidth={2} />
          </GhostIconButton>
          <Menu
            anchorEl={kebabAnchor}
            open={Boolean(kebabAnchor)}
            onClose={() => { setKebabAnchor(null); setConfirmingDelete(false) }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: {
              minWidth: 200,
              mt: 'var(--spacing-1)',
              border: 'var(--border-widths-menu-content-border-width) solid var(--colors-menu-content-border-color)',
              boxShadow: 'var(--shadows-menu-content-shadow)',
              borderRadius: 'var(--radii-md)',
              bgcolor: 'var(--colors-menu-content-background)',
            } }}
          >
            {confirmingDelete ? (
              // Two-step destructive confirm rendered inside the kebab popover.
              // No new dialog component — the existing menu surface doubles as
              // the confirm surface. MVP deletes cannot be restored, so the
              // copy is explicit about that.
              <Box sx={{ p: 'var(--spacing-3)', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <Typography sx={{
                  fontSize: 'var(--font-sizes-14)',
                  fontWeight: 'var(--font-weights-semibold)',
                  color: 'var(--colors-text-primary)',
                }}>
                  Delete this denial?
                </Typography>
                <Typography sx={{
                  fontSize: 'var(--font-sizes-12)',
                  color: 'var(--colors-text-secondary)',
                }}>
                  This cannot be undone. The denial will be permanently removed.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', mt: 'var(--spacing-1)' }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setConfirmingDelete(false)}
                    sx={{
                      textTransform: 'none',
                      fontSize: 'var(--font-sizes-btn-size-sm-font-size, var(--font-sizes-14))',
                      fontWeight: 'var(--font-weights-medium)',
                      color: 'var(--colors-text-secondary)',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setKebabAnchor(null)
                      setConfirmingDelete(false)
                      onDeleteDenial?.()
                    }}
                    sx={{
                      textTransform: 'none',
                      fontSize: 'var(--font-sizes-btn-size-sm-font-size, var(--font-sizes-14))',
                      fontWeight: 'var(--font-weights-semibold)',
                      bgcolor: 'var(--colors-text-error)',
                      color: 'var(--colors-grey-1)',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: 'var(--colors-text-error)', filter: 'brightness(0.95)', boxShadow: 'none' },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <MenuItem onClick={() => { setKebabAnchor(null); onEditDenialDetails?.() }} sx={{
                  fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                  color: 'var(--colors-menu-item-default-text)',
                  gap: 'var(--spacing-2)',
                }}>
                  <ListItemIcon sx={{ minWidth: '0 !important', color: 'inherit' }}>
                    <Pencil size={16} strokeWidth={2} />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ sx: {
                    fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                    color: 'inherit',
                  } }}>Edit denial details</ListItemText>
                </MenuItem>
                {onViewSource && (
                  <MenuItem onClick={() => { setKebabAnchor(null); onViewSource() }} sx={{
                    fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                    color: 'var(--colors-menu-item-default-text)',
                    gap: 'var(--spacing-2)',
                  }}>
                    <ListItemIcon sx={{ minWidth: '0 !important', color: 'inherit' }}>
                      <FileText size={16} strokeWidth={2} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: {
                      fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                      color: 'inherit',
                    } }}>View source</ListItemText>
                  </MenuItem>
                )}
                {onDeleteDenial && (
                  <MenuItem onClick={() => setConfirmingDelete(true)} sx={{
                    fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                    color: 'var(--colors-text-error)',
                    gap: 'var(--spacing-2)',
                  }}>
                    <ListItemIcon sx={{ minWidth: '0 !important', color: 'inherit' }}>
                      <Trash2 size={16} strokeWidth={2} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: {
                      fontSize: 'var(--font-sizes-menu-item-font-size, var(--font-sizes-14))',
                      color: 'inherit',
                    } }}>Delete denial</ListItemText>
                  </MenuItem>
                )}
              </>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Secondary row: denial type badge + payer + level + assignee */}
      <Box sx={{
        px: 'var(--spacing-5)',
        pt: 'var(--spacing-2)',
        pb: 'var(--spacing-2)',
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
        borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
        color: 'var(--colors-text-secondary)',
        fontSize: 'var(--font-sizes-12)',
      }}>
        <Typography component="span" sx={{
          fontSize: 'var(--font-sizes-12)',
          fontWeight: 'var(--font-weights-medium)',
          color: getDenialTypeConfig(denialType).color,
        }}>
          {denialType}
        </Typography>
        <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>·</Typography>
        <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>{payer}</Typography>
        <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>·</Typography>
        {appealLevelAsChip ? (
          <AppealLevelChip level={caseRecord?.appealLevel ?? 'L1'} />
        ) : (
          <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>{caseRecord?.appealLevel === 'L1' ? 'Level 1' : caseRecord?.appealLevel === 'L2' ? 'Level 2' : caseRecord?.appealLevel ?? 'Level 1'}</Typography>
        )}
        <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-tertiary)' }}>·</Typography>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--spacing-1)' }}>
          <Typography component="span" sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-error)',
            fontWeight: 'var(--font-weights-semibold)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {deniedAmount}
          </Typography>
          <Typography component="span" sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>
            Denied
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          <AssigneeChip assignee={caseRecord?.assignedTo ?? null} />
          {onOpenComments && (
            <GhostIconButton
              title={commentsOpen ? 'Close comments' : commentCount > 0 ? `${commentCount} comment${commentCount === 1 ? '' : 's'}` : 'Comments'}
              onClick={onOpenComments}
              ariaPressed={commentsOpen}
              active={commentsOpen}
              indicator={commentCount > 0 ? (
                <Box sx={{
                  position: 'absolute', top: -3, right: -3,
                  minWidth: 16, height: 16,
                  px: '4px',
                  boxSizing: 'border-box',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radii-full)',
                  bgcolor: 'var(--colors-interactive-action-background)',
                  color: 'var(--colors-interactive-action-text)',
                  fontSize: 'var(--font-sizes-10)',
                  fontWeight: 'var(--font-weights-bold)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 2px var(--colors-grey-1)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {commentCount > 99 ? '99+' : commentCount}
                </Box>
              ) : null}
            >
              <MessageSquare size={16} strokeWidth={2} />
            </GhostIconButton>
          )}
        </Box>
      </Box>

      {subRow}

      {/* Record Decision modal — opened from the Submitted-state picker. The
          modal captures payer outcome and (when ambiguous) the user's intent
          to appeal further. On confirm we fire 'record-decision' with the
          structured payload; App.tsx applies the state transition and spawns
          an L+1 case when the user opts to appeal again. */}
      <DecisionModal
        open={decisionOpen}
        appealLevel={caseRecord?.appealLevel}
        onClose={() => setDecisionOpen(false)}
        onConfirm={(result: DecisionResult) => {
          setDecisionOpen(false)
          fireStatusAction('record-decision', { outcome: result.outcome, intent: result.intent })
        }}
      />
    </Box>
  )
}
