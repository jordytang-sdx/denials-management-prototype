# Denial Instance System Design

**Status:** Draft for engineering review
**Date:** April 2026

---

## 1. Overview

This document defines the data model, state machine, ingestion pipeline, and intake flow for denial instance management. It reflects decisions made during product design and should be the reference document for implementation.

The core design goals are:

- A denial instance is a single, coherent unit of work from first signal to final resolution
- The same data model handles instances created manually (PDF upload) and automatically (835 ingestion)
- The model is designed for 835 automation from the start, even where manual workflows are the current reality
- Related denials (e.g. ADR → DRG downgrade) are separate instances with explicit linkage — never shared state

---

## 2. Data Model

### 2.1 Entity hierarchy

```
Account
 └── Claim (one or more per account)
      └── Denial Instance (one or more per claim)
           └── Appeal Round (one or more per instance)
```

Each entity has a different lifecycle and a different reason to change. The account never changes. The claim changes when corrections are resubmitted. The denial instance has its own state machine. The appeal round is a discrete action within that state machine.

---

### 2.2 Account

The stable encounter anchor. Maps to HAR in Epic, Encounter in Cerner, or equivalent in other EHR systems. The system stores the external ID as-is and does not generate its own account identifiers.

```typescript
interface Account {
  id: string                          // system-generated UUID
  external_id: string                 // HAR, encounter ID, etc. from source EHR
  external_id_type: 'HAR' | 'encounter' | 'account' | 'other'
  source_system: string               // 'Epic' | 'Cerner' | 'Meditech' | etc.
  patient: {
    name: string
    mrn: string
    dob: string                       // ISO date
  }
  created_at: string
}
```

**Design notes:**
- The account is created on first reference — either when a user uploads a denial and provides a HAR, or when an 835 is ingested and the account can be resolved
- Accounts without an external ID are allowed (e.g. a manual upload where the user doesn't enter the HAR) but are flagged as unlinked
- The account entity does not have its own UI screen — it is surfaced as context within the denial instance detail view

---

### 2.3 Claim

A billing event. One account can have multiple claims — the original submission plus any corrected or replacement claims. The claim carries all 837 data.

```typescript
interface Claim {
  id: string
  account_id: string
  claim_number: string                // internal / clearinghouse reference
  payer_claim_id?: string             // payer's own reference number
  claim_type: 'original' | 'corrected' | 'replacement' | 'void'
  replaces_claim_id?: string          // populated for corrected/replacement claims

  payer: string
  payer_id: string

  subscriber_name: string
  subscriber_insurance_id: string
  subscriber_group_number: string

  dos_start: string                   // ISO date
  dos_end: string
  type_of_bill: string               // e.g. '111'

  billing_provider_name: string
  billing_provider_npi: string
  billing_provider_tax_id: string

  total_billed_amount: number
  drg_billed?: string

  principal_diagnosis: DiagnosisCode
  secondary_diagnoses: DiagnosisCode[]
  principal_procedure?: ProcedureCode
  service_lines: ServiceLine[]

  source: 'manual_upload' | '837_auto' | 'user_entry'
  created_at: string
}
```

**Design notes:**
- Corrected claims link to the original via `replaces_claim_id`
- When a corrected claim is denied, a new denial instance is created on the new claim, linked to the original denial instance
- Claim data is never duplicated onto the denial instance — the instance references the claim

---

### 2.4 Denial Instance

The primary unit of work. Has its own state machine, assignment, timeline, and appeal rounds.

```typescript
interface DenialInstance {
  id: string
  account_id: string
  claim_id: string

  denial_type: DenialType
  denial_subtype: string
  carc: string
  rarc?: string
  denied_amount: number
  deadline: string                    // ISO date — appeal filing deadline

  state: DenialState
  status: DenialStatus

  // Origin tracking
  source: 'manual_upload' | '835_auto' | 'user_action' | 'system'
  match_confidence?: 'high' | 'medium' | 'low'  // populated for 835_auto only
  pending_confirmation: boolean       // true when 835 shows payment, awaiting human confirm

  // Denial letter
  denial_letter_id?: string           // null until letter is available
  denial_letter_received_at?: string

  // Assignment
  assigned_to: TeamMember | null

  // Related instances
  related_instances: RelatedInstance[]

  // Appeal rounds
  appeal_rounds: AppealRound[]

  // Attention flags
  needs_attention: boolean
  needs_attention_reasons: string[]

  // Notes and metadata
  notes: string
  created_at: string
  updated_at: string
}

interface RelatedInstance {
  instance_id: string
  relationship: RelationshipType
}

type RelationshipType =
  | 'adr_preceded'         // an ADR that came before this denial
  | 'adr_followed'         // an ADR triggered by this denial
  | 'corrected_claim_of'   // this denial is on a corrected version of another claim
  | 'corrected_claim_led_to' // original denial before corrected claim
  | 'recoupment_of'        // recoupment tied to a prior resolved denial
  | 'escalated_from'       // e.g. DRG downgrade that followed an ADR
```

---

### 2.5 Appeal Round

A discrete appeal action within a denial instance. L1, L2, and external review are rounds. Peer-to-peer reviews are timeline events, not rounds.

```typescript
interface AppealRound {
  id: string
  round_number: number                // 1, 2, 3...
  round_type: AppealRoundType
  appeal_letter_id?: string

  submitted_at?: string
  submission_method?: 'mail' | 'portal' | 'fax' | 'electronic'
  payer_ack_date?: string
  payer_response_deadline?: string    // date by which payer must respond

  decision: 'overturned' | 'upheld' | 'partial' | 'pending' | 'withdrawn'
  decision_date?: string
  decision_letter_id?: string
  recovery_amount?: number            // populated for overturned / partial

  notes: string
  created_at: string
  created_by: string
}

type AppealRoundType =
  | 'L1_internal'
  | 'L2_external'
  | 'IRO'                 // Independent Review Organization
  | 'redetermination'     // Medicare-specific
  | 'reconsideration'     // Medicare-specific
  | 'reopening'           // Informal reopening request
```

**Design notes:**
- Peer-to-peer reviews are recorded as timeline events of type `peer_to_peer`, not as rounds. They can reference a round via `reference_id` and carry an outcome field (`payer_maintained` | `payer_agreed`) that can update the round's status.
- `round_number` increments per instance, not per claim. If an instance has L1 upheld and escalates to L2, round_number goes from 1 to 2.
- A round in `pending` decision means the instance is in Submitted state. When the decision arrives, the instance transitions accordingly.

---

### 2.6 Remit Event

Every 835 signal that touches the system is recorded as a remit event, regardless of whether it matched an existing instance. This creates a complete audit trail and enables retroactive matching.

```typescript
interface RemitEvent {
  id: string
  isa13: string                       // ISA13 transaction control number — idempotency key
  file_id: string                     // reference to the 835 file
  received_at: string

  // What the 835 said
  payer_claim_id?: string
  patient_control_number?: string
  paid_amount: number
  denied_amount: number
  carc_codes: string[]
  rarc_codes: string[]
  drg_paid?: string

  // How it was matched
  matched_claim_id?: string
  matched_instance_id?: string
  match_confidence: 'high' | 'medium' | 'low' | 'unmatched'
  match_method: 'patient_control_number' | 'payer_claim_id' | 'probabilistic' | 'none'

  // What the system did
  action_taken: RemitAction
  processing_status: 'processed' | 'queued_for_review' | 'error'
}

type RemitAction =
  | 'created_new_instance'
  | 'updated_existing_instance'
  | 'queued_for_confirmation'
  | 'queued_for_human_review'
  | 'duplicate_skipped'
  | 'unmatched_queued'
```

---

### 2.7 Timeline Event

Every meaningful thing that happens to an instance is recorded as a timeline event. This is the audit trail.

```typescript
interface TimelineEvent {
  id: string
  instance_id: string
  type: TimelineEventType
  timestamp: string
  actor: string
  actor_type: 'user' | 'payer' | 'system'
  source: 'manual_upload' | '835_auto' | 'user_action' | 'system'
  summary: string
  detail?: string
  reference_id?: string              // links to appeal round, letter, remit event, etc.
}

type TimelineEventType =
  | 'instance_created'
  | 'intake_accepted'
  | 'intake_dismissed'
  | 'assigned'
  | 'status_changed'
  | 'appeal_round_created'
  | 'appeal_submitted'
  | 'payer_decision_received'
  | 'peer_to_peer'
  | 'document_added'
  | 'denial_letter_received'
  | 'remit_received'
  | 'payment_confirmed'
  | 'payment_disputed'
  | 'instance_linked'
  | 'note_added'
  | 'deadline_changed'
  | 'reopened'
```

---

## 3. State Machine

### 3.1 States

```
Intake → Active → Submitted → Resolved
   ↓        ↓         ↓
 Closed   Closed    Closed
              ↓
           Archived (from any terminal state)
```

| State | Meaning |
|---|---|
| **Intake** | Instance exists but has not been accepted into the active workflow. Awaiting human review. |
| **Active** | Being worked. Appeal is being drafted, records gathered, or investigation is underway. |
| **Submitted** | An appeal round has been submitted. Awaiting payer response. |
| **Resolved** | Denial overturned (full or partial). Payment confirmed. |
| **Closed** | Will not be further appealed. Includes Will Not Appeal, dismissed, written off. |
| **Archived** | Moved out of working view. Can be restored. |

### 3.2 Transitions

| From | To | Trigger | Who |
|---|---|---|---|
| Intake | Active | Reviewer accepts instance | Human |
| Intake | Closed | Reviewer dismisses (with reason) | Human |
| Intake | Closed | Will Not Appeal selected | Human |
| Active | Submitted | Appeal round submitted | Human |
| Active | Closed | Will Not Appeal | Human |
| Submitted | Active | Payer upholds round, user escalates | Human |
| Submitted | Active | Payer requests more info (ADR on existing denial) | Human or System |
| Submitted | Resolved | Payment confirmed | Human (or auto, see §4.4) |
| Submitted | Closed | Payer upholds, user does not escalate | Human |
| Resolved | Archived | Manual archival action | Human |
| Closed | Active | Reopened | Human |
| Closed | Archived | Manual archival action | Human |
| Any | Archived | Manual archival action | Human |

### 3.3 Pending confirmation flag

When the 835 ingestion pipeline detects a payment event on a Submitted instance, the instance gains `pending_confirmation: true`. This is a flag on the instance, not a separate state.

- The instance remains in **Submitted** visually
- A banner appears in the detail view: "Payment of $X received on [date] — confirm resolution or dispute"
- Confirming transitions to **Resolved**
- Disputing clears the flag and returns to normal Submitted view for investigation
- If neither action is taken within 48 hours, the system auto-confirms if match confidence was High. Medium or Low confidence never auto-confirms.

---

## 4. 835 Ingestion Pipeline

### 4.1 Idempotency

Before processing any 835 transaction, check `isa13` against processed remit events. If found, skip entirely and log as `duplicate_skipped`. This handles clearinghouse retransmissions without downstream effects.

### 4.2 Account and claim resolution

Attempt to resolve the 835 claim to an existing account and claim using the following priority order:

```
1. patient_control_number → exact match to known claim.claim_number
   Confidence: High

2. payer_claim_id → exact match to known claim.payer_claim_id
   Confidence: High

3. Probabilistic: member_id + DOS + billed_amount within tolerance (±$5)
   Confidence: Medium

4. No match
   Confidence: Unmatched → create unmatched remit event, queue for human
```

If the account exists but the specific claim does not (e.g. a corrected claim arrives before it's been manually entered), create a new claim entity from the 835 data. Flag it as `source: '835_auto'` and surface it for human verification in the intake review.

### 4.3 Instance matching

Given a resolved claim, determine what to do with the 835 denial signal:

```
Does an open instance of this denial type exist on this claim?

NO → Create new instance, state = Intake, source = '835_auto'

YES, state = Submitted →
  835 shows payment     → set pending_confirmation = true, queue per confidence (§4.4)
  835 shows re-denial   → record new appeal round result (upheld), move to Active
  835 shows partial     → set pending_confirmation = true, always queue for human

YES, state = Active/Intake →
  Same denial codes     → likely duplicate signal, flag for human review, do not create new instance
  Different denial codes → may be a new denial type on same claim, create new instance linked to original

YES, state = Resolved/Closed →
  New denial or codes   → create new instance, link to resolved instance via 'recoupment_of' or appropriate relationship
  Payment (again)       → log as timeline event on resolved instance, no state change
```

### 4.4 Auto-resolution rules

| Match confidence | 835 signal | Action |
|---|---|---|
| High | Full payment on Submitted instance | Set `pending_confirmation = true`. Auto-confirm after 48hrs if unactioned. |
| High | Re-denial on Submitted instance | Create new round (decision = upheld), move instance to Active, notify assignee. |
| Medium | Full payment on Submitted instance | Set `pending_confirmation = true`. Never auto-confirm — requires human. |
| Medium | New denial, no existing instance | Create Intake instance, flag match confidence, surface for human review. |
| Low | Any | Create unmatched remit event. Require human to resolve before any instance action. |
| Any | Partial payment | Always queue for human — never auto-confirm. |
| Any | Recoupment on Resolved/Closed | Create new instance. Never modify the original. |

### 4.5 Denial type classification from CARC/RARC

CARC/RARC codes from the 835 CAS segment map to denial types. This lookup must be exhaustive — any unrecognized code combination produces `denial_type = 'Unclassified'` and requires human classification in intake. Never silently default to a wrong type.

| CARC | Common RARC | Denial Type |
|---|---|---|
| CARC-50 | M86, MA01, N432 | Medical Necessity |
| CARC-4 | N115 | DRG Downgrade / Coding |
| CARC-18 | — | ADR |
| CARC-15 | N130 | Authorization |
| CARC-29 | — | Timely Filing |
| CARC-31 | — | Eligibility |
| CARC-45 | — | Underpayment / Recoupment |
| CARC-16 | — | Administrative |
| CARC-97 | — | Coding / Bundling |
| Other | — | Unclassified |

ADR signals (CARC-18) always create a **new, separate instance**. They are never merged into an existing medical necessity or DRG downgrade instance on the same claim, even if one exists.

---

## 5. Instance Identity and Deduplication

### 5.1 Manual upload dedup

When a user manually uploads a denial letter and initiates a new instance, check for potential duplicates before creation using:

- Same account (if account ID is known) + same denial type
- OR same payer + patient + DOS + denial type (fuzzy match, no account required)

If a match is found, surface a warning:
> "A similar denial already exists: DN-2026-0389 (Raymond Castellano, Aetna, Medical Necessity). Is this the same denial or a new one?"

User chooses:
- **Link to existing** — the upload is attached to the existing instance (e.g. the letter arrived after the 835 created the instance)
- **Create new** — genuinely a new denial event
- **Replace** — the existing instance was created in error

Do not block creation — the user has the final say. Log the decision as a timeline event.

### 5.2 ADR identity

ADRs are always created as new instances. They are never merged with an existing denial on the same claim. Linkage is established via `related_instances` with the appropriate relationship type.

The one exception: if an ADR arrives via 835 and an existing ADR instance is already open on the same claim in a non-terminal state, treat it as an update to the existing ADR instance rather than a new one. ADRs from the same payer on the same claim in close succession are typically the same request.

### 5.3 Corrected claim identity

When a corrected claim (837 with `claim_type: 'corrected'`) is submitted and subsequently denied:

- Create a new claim entity linked to the original via `replaces_claim_id`
- Create a new denial instance on the new claim
- Link the new denial instance to the original via `corrected_claim_of` / `corrected_claim_led_to`
- Do not modify or close the original denial instance — it may still be relevant if the corrected claim denial is on different grounds

---

## 6. Intake Flow

### 6.1 Single intake flow for all sources

Both manually-created and system-created instances enter the same Intake state and are reviewed through the same intake panel. The panel adapts to what information is available rather than having a separate flow per source.

### 6.2 Source and confidence indicators

The intake panel header displays:

- **Manual upload:** "Uploaded by [user] on [date]"
- **835 auto, high confidence:** "Auto-created from 835 remit · High confidence match"
- **835 auto, medium confidence:** "Auto-created from 835 remit · Medium confidence match — verify before accepting"
- **835 auto, unmatched:** This state should not reach intake review without human intervention. The unmatched remit event queue handles it first.

Medium confidence instances display a verification prompt above the standard intake fields:
> "This instance was created by matching remit data to a claim. Please verify the patient, payer, and claim information below before accepting."

### 6.3 Missing denial letter (Option B)

When an instance exists but no denial letter has been received yet (common for 835-auto instances, where the letter arrives separately):

The intake panel shows a notice in the Denial Codes section:

> "Denial letter not yet received. The information below is derived from remit data. Upload the letter when available, or continue without it."

- An upload affordance is present and persistent
- The reviewer can accept the instance without a letter — the letter field remains open and can be populated later
- When a letter is subsequently uploaded (or arrives via auto-matching), it attaches to the instance and a timeline event is recorded: `denial_letter_received`
- If the letter contradicts the CARC/RARC-derived denial type, the system flags the discrepancy for human review rather than silently overwriting

### 6.4 Intake actions

| Action | Result | Notes |
|---|---|---|
| Accept | Instance moves to Active. Denial type, assignee, and notes are set. | Can be done with or without denial letter on file. |
| Dismiss | Instance moves to Closed. Reason required. | Reason options: Duplicate, Not our denial, Payer error, Billing error, Out of scope, Other |
| Will Not Appeal | Instance moves to Closed with status Will Not Appeal. | No reason required but notes field is surfaced. |

Dismiss reasons are stored on the instance and surfaced in reporting.

---

## 7. Linkage Between Instances

### 7.1 Linking

Instances are linked via the `related_instances` array on each instance. Links are bidirectional — when instance A is linked to instance B, both records reflect the relationship.

Links can be created:
- **Automatically** by the ingestion pipeline (e.g. ADR on a claim with an existing denial, or a corrected claim denial)
- **Manually** by the user from the instance detail view

### 7.2 Surfacing in UI

Related instances are surfaced in the denial detail view as a "Related Denials" section. Each related instance shows:
- Instance ID, denial type, current state
- Relationship description (e.g. "ADR preceded this denial")
- A link to navigate to the related instance

A subtle indicator (e.g. a link icon or count badge) appears on worklist rows that have related instances, without cluttering the default view.

### 7.3 Auto-link logic

The ingestion pipeline should attempt to auto-link in the following cases:

| Scenario | Auto-link condition |
|---|---|
| ADR created on a claim that has an existing open denial | Link ADR to existing denial as `adr_followed` |
| DRG downgrade created on a claim that had a prior ADR | Link downgrade to ADR as `escalated_from` |
| New denial on a corrected claim | Link to original denial as `corrected_claim_of` |
| Recoupment on a claim with a resolved denial | Link to resolved denial as `recoupment_of` |

Auto-links are always surfaced to the user for review — never silently applied and forgotten.

---

## 8. Open Questions

These are design decisions that are not yet resolved. Engineering should not make assumptions about these — flag them for product resolution before implementation.

1. **Account creation for manual uploads without a HAR.** A user uploads a denial letter but doesn't know or doesn't enter the HAR/account ID. Do we create a placeholder account that can be linked later, or hold the instance in a pre-account state? The current prototype doesn't have accounts at all, so this is a migration question as well.

2. **Multi-line denials.** A payer denies specific revenue code lines on a claim rather than the whole claim. Is each denied line its own instance, or one instance with multiple denied lines? Current assumption is one instance per claim denial event, but line-level tracking may be needed for recoupment and partial payment scenarios.

3. **835 file delivery mechanism.** The current system relies on user-uploaded remit data. The design above assumes an automated 835 file delivery — either via clearinghouse connection, SFTP, or direct payer EDI. The mechanism by which 835 files enter the system is not specified here and needs its own technical design.

4. **Deadline management.** Appeal filing deadlines vary by payer and denial type, and can be extended. Does the system calculate deadlines automatically from payer rules, or does the user always set them manually? Auto-calculation reduces manual work but requires maintaining a payer rules database.

5. **Payer criteria library.** For medical necessity denials, the intake panel should ideally surface the specific MCG/InterQual criteria cited in the denial. This requires either a licensed criteria library or a user-entered free text field. Licensing scope and cost are unresolved.

6. **HAR resolution for non-Epic customers.** Customers not on Epic may not have a stable account-level identifier equivalent to HAR. The system should degrade gracefully — accepting instances without an account link and allowing retroactive linking when the customer's system provides the identifier.

---

## 9. What Changes in the Prototype

The current prototype does not implement the full model above. The following changes bring it closer to the target design without a full rebuild:

| Change | Priority | Notes |
|---|---|---|
| Add account ID field to denial records (displayed as HAR in the detail view) | High | Background only — no separate account screen |
| Move claim data (837) to be referenced, not embedded | Medium | Refactor the data model so denial instances point to claim data |
| Add `appeal_rounds` array to denial instances | High | Even stubbed, establishes the round concept in the UI |
| Add `source` and `match_confidence` fields | Medium | Enables the intake panel to show provenance |
| Add `pending_confirmation` flag and banner to Submitted instances | Medium | Core to the 835 auto-resolve UX |
| Add Related Instances section to denial detail view | Medium | Can be manually linked for now |
| Add denial letter upload affordance to intake panel | High | Needed for Option B missing-letter flow |
| Add dismiss reason to intake dismiss action | Low | Currently dismiss has no required reason |

---

*This document captures product design decisions as of April 2026. It should be updated as decisions change. Do not implement based on the Open Questions section without explicit product resolution.*
