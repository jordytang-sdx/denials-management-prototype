---
name: Schema and Lifecycle States
description: Two-layer state/status model, the three module lifecycles, open vs terminal groupings, and rules for extending the schema
type: context
last_reviewed: 2026-04-22
---

# Schema and Lifecycle States

## Two-Layer Model

Every record has two separate fields:
- **state** — where it is in the workflow (coarse, workflow-level)
- **status** — what is specifically happening at that state (fine-grained, operational detail)

Status values are typed to their parent state. They must not be mixed across states.

---

## Denial Lifecycle

**States (in order):** `Queue → InProgress → Submitted → Overturned / Closed / Archive`

**Terminal states:** `Overturned`, `Closed`, `Archive`

**Open states (used for exposure calculations):** `Queue`, `InProgress`, `Submitted`

| State | Status values |
|---|---|
| Queue | `New`, `Returned — Upheld` |
| InProgress | `In Progress`, `Appeal Drafting`, `Awaiting Records`, `Records Ready — Review Needed`, `Awaiting Payer Portal`, `Eligibility Investigation`, `Corrected Claim Submitted` |
| Submitted | `Awaiting Payer Decision`, `Submission Failed`, `Response Overdue` |
| Overturned | `Overturned — Full Payment`, `Overturned — Partial Payment`, `Partial Settlement`, `Corrected Claim Paid`, `Secondary Payer Paid` |
| Closed | `Upheld by Payer`, `Will Not Appeal`, `Dismissed`, `Escalated to DRG Dispute`, `Closed` |
| Archive | `Archived` |

---

## Underpayment Lifecycle

**States (in order):** `Active → Submitted → Won → Recovered / Closed / Archived`

**Terminal states:** `Recovered`, `Closed`, `Archived`

**Active states (used for exposure calculations):** `Active`, `Submitted`
**For recovery calculations, also include:** `Won`

| State | Status values |
|---|---|
| Active | `Contract Analysis in Progress`, `Variance Confirmed`, `Demand Letter Drafting`, `Awaiting Additional Documentation`, `Peer Review Requested` |
| Submitted | `Awaiting Payer Response`, `Response Overdue`, `Under Negotiation` |
| Won | `Payment Adjustment Authorized`, `Partial Adjustment Authorized`, `Settlement Agreed` |
| Recovered | `Payment Adjustment Confirmed`, `Partial Recovery Confirmed`, `Settlement Paid` |
| Closed | `Payer Upheld`, `Will Not Pursue`, `Written Off`, `Below Work Threshold` |
| Archived | `Archived` |

---

## Audit Lifecycle

**States (in order):** `NoticeReceived → RecordsPending → UnderReview → FindingsIssued → Disputed → Closed`

**Terminal states:** `Closed`

**Active states (used for exposure calculations):** `NoticeReceived`, `RecordsPending`, `UnderReview`, `FindingsIssued`, `Disputed`

| State | Status values |
|---|---|
| NoticeReceived | `New`, `Under Initial Review` |
| RecordsPending | `Records Requested`, `Records Overdue`, `Records Retrieved — Pending Submission` |
| UnderReview | `Awaiting Audit Decision`, `Decision Overdue` |
| FindingsIssued | `Findings Received — Review Needed`, `Dispute Decision Required` |
| Disputed | `Formal Dispute Filed`, `Awaiting Payer Response`, `Response Overdue` |
| Closed | `Successfully Disputed`, `Settled`, `Accepted Findings`, `Written Off`, `Withdrawn` |

---

## Rules for Extending the Schema

- Do not add new state or status values without flagging the need first and getting confirmation.
- If a new state is needed, it must fit the existing lifecycle sequence — states are ordered and directional.
- New status values must be typed to a specific parent state, not shared across states.
- `assignedTo` is `null` on new instances; assignment happens post-intake, not at creation.
