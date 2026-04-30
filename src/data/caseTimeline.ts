// ── Shared timeline event taxonomy — all three case modules ──────────────────

export type TimelineEventCategory = 'financial' | 'payer' | 'action' | 'system'

export type TimelineEventType =
  // ── Financial (green) ──────────────────────────────────────────────────────
  | 'financial_payment_received'
  | 'financial_recovery_confirmed'
  | 'financial_writeoff_posted'
  | 'financial_settlement_confirmed'
  | 'financial_recoupment_proposed'
  | 'financial_variance_confirmed'
  // ── Payer / External ───────────────────────────────────────────────────────
  | 'signal_835'
  | 'signal_pdf_denial'
  | 'signal_pdf_adr'
  | 'signal_pdf_recoupment'
  | 'signal_audit_notice'
  | 'payer_upheld'
  | 'payer_overturned'
  | 'payer_partial'
  | 'payer_pending'
  | 'payer_audit_findings_issued'
  | 'payer_dispute_response'
  // ── User actions (teal) ────────────────────────────────────────────────────
  | 'action_appeal_l1'
  | 'action_appeal_l2'
  | 'action_appeal_l3'
  | 'action_demand_sent'
  | 'action_records_requested'
  | 'action_records_submitted'
  | 'action_corrected_claim'
  | 'action_peer_to_peer'
  | 'action_dispute_filed'
  | 'action_resubmit'
  | 'action_note'
  | 'action_assign'
  | 'action_state_change'
  // ── System / inferred (gray, de-emphasized) ────────────────────────────────
  | 'system_instance_created'
  | 'system_routing_applied'
  | 'system_classified'
  | 'system_match_flagged'
  | 'system_cross_case'

// Legacy aliases — map old event types from denialDetail.ts to new taxonomy
export type LegacyTimelineEventType =
  | 'instance_created'
  | 'routing_applied'
  | 'match_flagged'

export type AnyTimelineEventType = TimelineEventType | LegacyTimelineEventType

export type ActorType = 'payer' | 'provider' | 'system'

export interface TimelineEvent {
  id: string
  type: AnyTimelineEventType
  timestamp: string   // ISO string
  actor: string
  actorType: ActorType
  summary: string
  detail?: string
  amount?: number
  document?: string
  // Cross-case link (for system_cross_case events)
  relatedCaseId?: string
  relatedCaseType?: 'denial' | 'underpayment' | 'audit'
  relatedCaseRelationship?: string
}

// ── Renderer config ───────────────────────────────────────────────────────────

export interface EventMeta {
  category: TimelineEventCategory
  label: string
  borderColor: string
  dotColor: string
  dotVariant: 'solid' | 'hollow'
  isAdverse?: boolean
}

const GREEN  = '#1E7E4A'
const RED    = '#C0392B'
const TEAL   = '#2D7D9A'
const GRAY   = '#A0AEC0'

export const EVENT_META: Record<AnyTimelineEventType, EventMeta> = {
  // Financial
  financial_payment_received:    { category: 'financial', label: 'Payment Received',       borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  financial_recovery_confirmed:  { category: 'financial', label: 'Recovery Confirmed',      borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  financial_writeoff_posted:     { category: 'financial', label: 'Write-Off Posted',        borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  financial_settlement_confirmed:{ category: 'financial', label: 'Settlement Confirmed',    borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  financial_recoupment_proposed: { category: 'financial', label: 'Recoupment Proposed',     borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  financial_variance_confirmed:  { category: 'financial', label: 'Variance Confirmed',      borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  // Payer / External — adverse
  signal_835:                    { category: 'payer',     label: '835 Remit Received',      borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  signal_pdf_denial:             { category: 'payer',     label: 'Denial Letter Received',  borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  signal_pdf_adr:                { category: 'payer',     label: 'ADR Notice Received',     borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  signal_pdf_recoupment:         { category: 'payer',     label: 'Recoupment Notice',       borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  signal_audit_notice:           { category: 'payer',     label: 'Audit Notice Received',   borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  payer_upheld:                  { category: 'payer',     label: 'Payer Upheld',            borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  payer_audit_findings_issued:   { category: 'payer',     label: 'Audit Findings Issued',   borderColor: RED,   dotColor: RED,   dotVariant: 'solid', isAdverse: true },
  // Payer / External — favorable
  payer_overturned:              { category: 'payer',     label: 'Payer Overturned',        borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  payer_partial:                 { category: 'payer',     label: 'Partial Adjustment',      borderColor: GREEN, dotColor: GREEN, dotVariant: 'solid' },
  payer_dispute_response:        { category: 'payer',     label: 'Dispute Response',        borderColor: TEAL,  dotColor: TEAL,  dotVariant: 'solid' },
  payer_pending:                 { category: 'payer',     label: 'Awaiting Payer Response', borderColor: GRAY,  dotColor: GRAY,  dotVariant: 'hollow' },
  // User actions
  action_appeal_l1:              { category: 'action',    label: 'Appeal Submitted (L1)',   borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_appeal_l2:              { category: 'action',    label: 'Appeal Submitted (L2)',   borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_appeal_l3:              { category: 'action',    label: 'Appeal Submitted (L3)',   borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_demand_sent:            { category: 'action',    label: 'Demand Letter Sent',      borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_records_requested:      { category: 'action',    label: 'Records Requested',       borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_records_submitted:      { category: 'action',    label: 'Records Submitted',       borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_corrected_claim:        { category: 'action',    label: 'Corrected Claim Filed',   borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_peer_to_peer:           { category: 'action',    label: 'Peer-to-Peer',            borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_dispute_filed:          { category: 'action',    label: 'Dispute Filed',           borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_resubmit:               { category: 'action',    label: 'Claim Resubmitted',       borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_note:                   { category: 'action',    label: 'Note Added',              borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_assign:                 { category: 'action',    label: 'Assigned',                borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  action_state_change:           { category: 'action',    label: 'Status Changed',          borderColor: TEAL, dotColor: TEAL, dotVariant: 'solid' },
  // System / inferred
  system_instance_created:       { category: 'system',    label: 'Instance Created',        borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  system_routing_applied:        { category: 'system',    label: 'Routing Applied',         borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  system_classified:             { category: 'system',    label: 'Auto-Classified',         borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  system_match_flagged:          { category: 'system',    label: 'Match Flagged',           borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  system_cross_case:             { category: 'system',    label: 'Related Case',            borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  // Legacy aliases (map to system category)
  instance_created:              { category: 'system',    label: 'Instance Created',        borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  routing_applied:               { category: 'system',    label: 'Routing Applied',         borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
  match_flagged:                 { category: 'system',    label: 'Match Flagged',           borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' },
}

export function getEventMeta(type: AnyTimelineEventType): EventMeta {
  return EVENT_META[type] ?? { category: 'system', label: type, borderColor: GRAY, dotColor: GRAY, dotVariant: 'hollow' }
}
