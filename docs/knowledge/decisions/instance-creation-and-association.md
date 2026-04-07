---
name: Instance Creation & Association Ruleset
description: How inbound signals (835, PDF, ADR, etc.) are extracted, classified, matched to existing instances, and created as new instances
type: decisions
---

# Instance Creation & Association Ruleset

## 1. Signal Types

Every inbound signal falls into one of these categories before any processing occurs.

| Signal Type | Source | Format | Auto-Parseable |
|---|---|---|---|
| **835 ERA** | Clearinghouse / EDI | Structured X12 | Yes |
| **277CA** | Clearinghouse | Structured X12 | Yes (acknowledgment only) |
| **PDF Denial Letter** | Payer mail / portal / fax | Unstructured | Via OCR/extraction |
| **ADR Letter** | Payer mail / portal / fax | Unstructured | Via OCR/extraction |
| **Recoupment Notice** | Payer mail / portal | Unstructured | Via OCR/extraction |
| **Portal Notification** | Payer portal scrape / API | Semi-structured | Payer-dependent |
| **Manual Entry** | Staff | N/A | N/A |

---

## 2. Extraction Requirements

Before classification, every signal must yield (or be flagged as incomplete):

**Required fields:**
- Patient MRN or name + DOB
- Claim ID or HAR
- Payer
- Date of service
- Action taken by payer (denial, partial payment, request, recoupment)
- Amount at stake

**Conditional fields:**
- CARC/RARC codes (835 signals — required)
- Denial reason narrative (PDF signals — required)
- Contracted vs. paid amounts (underpayments — required)
- Documentation requested (ADR — required)
- Repayment amount + deadline (recoupments — required)

If required fields are missing after extraction, the signal lands in **Staging → Incomplete** and is flagged for manual review before any instance creation or association proceeds.

---

## 3. Classification Rules

Runs after extraction. Determines what type of instance to create.

### 3.1 Denial
**Trigger:** CARC is present AND one of:
- 835 CLM segment shows full denial OR payment = $0
- PDF extraction identifies denial language ("claim has been denied", "not covered", "no authorization")

**Subtypes determined by CARC:**

| CARC Group | Denial Type |
|---|---|
| CARC 4, 6, 97 (DRG/coding) | DRG Downgrade / Coding Dispute |
| CARC 15, 16, 18 (duplicate/claim issue) | Corrected Claim needed |
| CARC 50, 51, 167, 96 (not covered) | Benefit Exclusion |
| CARC 55, 56, 57 (auth/referral) | Authorization Denial |
| CARC 1, 2, 3 (deductible/copay) | Patient Responsibility — do not create instance |
| CARC 22, 23 (COB) | Eligibility / COB |
| CARC 29 (timely filing) | Timely Filing Defense |
| No CARC, PDF only | Manual classification required at intake |

### 3.2 Underpayment
**Trigger:** 835 payment > $0 AND payment amount < expected contracted rate by > threshold (e.g. $50 or 5%)

Requires a contract fee schedule lookup. If no contract rate is on file, flag for manual review — do not auto-classify as underpayment.

Do not create an underpayment instance for patient responsibility adjustments (CO-45, PR codes).

### 3.3 ADR (Additional Documentation Request)
**Trigger:** PDF extraction identifies ADR language ("additional documentation", "medical records requested", "clinical documentation required") OR CARC 18 with $0 payment.

### 3.4 Recoupment
**Trigger:** PDF extraction identifies recoupment language ("overpayment", "recoupment", "offset", "repayment requested") OR dedicated 835 recoupment transaction.

### 3.5 Filing Defense
**Trigger:** CARC 29 (timely filing) or equivalent filing deadline language in PDF.

---

## 4. Association Rules (Tier 2 Matching)

Before creating a new instance, the system checks whether the inbound signal relates to an existing instance. Runs in priority order — first match wins.

### Level 1 — Definitive Match (auto-link, no user confirmation)
Structural matches that are unambiguous:

| Rule | Condition | Action |
|---|---|---|
| **Same claim, escalation** | Same Claim ID + existing instance in `Submitted` or `Closed` | Payer response. Update existing instance's episode result — do not create new. |
| **Same HAR, same payer, direct continuation** | Same HAR + same payer + existing instance in `Active` or `Submitted` | Follow-up on same encounter. Attach to existing instance as new episode signal. |
| **Explicit payer reference** | PDF contains reference number matching an existing instance's submission reference | Direct link. Attach as episode result. |

### Level 2 — Probable Match (surface to user, require decision)
Require a human judgment call:

| Match Signals | Confidence | Reason for human review |
|---|---|---|
| Same MRN + same payer + overlapping DOS | High | Could be new claim for same patient, or follow-up on same encounter |
| Same HAR + different payer | Medium | COB scenario — may be legitimate new instance or misrouted |
| Same MRN + same denial type (no HAR match) | Medium | Pattern recurrence — possibly related, possibly a new incident |
| Same Claim ID + different payer | Low | Likely a data quality issue — surface for review |

**User decision options for Level 2:**
- **Link as related** — creates new instance and establishes a `RelationshipType` association
- **Create standalone** — new instance with no link (user confirms these are independent)
- **Attach to existing** — no new instance; signal becomes a new episode on the matched instance
- **Dismiss signal** — not actionable (duplicate fax, already worked, patient responsibility, etc.)

### Level 3 — No Match
No existing instance matches. Create new instance, land in `Intake → Unreviewed`.

---

## 5. RelationshipType Semantics

When two instances are linked, the relationship must be directional:

| Relationship | Meaning | Example |
|---|---|---|
| `adr_preceded` | This denial was preceded by an ADR on the same encounter | ADR → DRG Downgrade |
| `adr_followed` | This ADR led to a subsequent denial | ADR → (escalated to) Denial |
| `corrected_claim_of` | This is a corrected claim filed in response to a denial | Original denial → Corrected claim |
| `corrected_claim_led_to` | This denial prompted a corrected claim | Corrected claim points back to original denial |
| `recoupment_of` | This recoupment is associated with a prior paid claim | Prior claim → Recoupment |
| `escalated_from` | This instance was escalated from a lower-level dispute | ADR or L1 appeal → L2/IRO |

All relationships are bidirectional — creating a link writes both directions.

---

## 6. New Instance Defaults

When a new instance is created (no match or user chose "create standalone"):

| Field | Value |
|---|---|
| State | `Intake` |
| Status | `Unreviewed` |
| Source | `835_auto`, `manual_upload`, etc. |
| Assigned To | null (assignment happens at intake acceptance) |
| Deadline | Computed from signal date + payer-specific appeal window (flagged if unknown) |
| Denial Type | Set if classified, else blank (required at intake acceptance) |

---

## 7. Signals That Should Never Create a New Instance

- Patient responsibility adjustments (PR-segment codes: CO-45, PR-1, PR-2, PR-3)
- Contractual adjustments that net to $0 dispute value
- 277CA acknowledgments (informational only — no action needed unless rejected)
- Duplicate signals (same Claim ID + same signal type already in staging or active)
- Signals below the facility's work threshold (configurable, e.g. < $100)

---

## 8. Open Questions

1. **Contract fee schedule integration** — underpayment auto-detection requires this. Without it, underpayments must be manually identified at 835 review.
2. **Work threshold** — what's the minimum dollar amount worth working? Below that, auto-close with "Below Work Threshold."
3. **Payer-specific appeal windows** — should these live in a payer configuration table, or be manually set per instance?
4. **Level 1 auto-attach** — are we comfortable with the system automatically attaching a payer response to an existing instance without user review, or should all episode updates require confirmation?
