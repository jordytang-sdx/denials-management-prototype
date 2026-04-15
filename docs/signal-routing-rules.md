# Signal Routing Rules
## Engineering Specification — Inbound Signal Processing

**Status:** Draft  
**Date:** April 2026  
**Scope:** 835 EDI and PDF document signals only  
**Primary match key:** HAR (Hospital Account Record) → Claim ID fallback  
**Companion docs:** `system-design-denial-instances.md`, `knowledge/decisions/instance-creation-and-association.md`

---

## 1. Overview

This document defines the complete rule set for processing inbound signals — what they mean, what to do with them, what gets automated, and when a human must intervene. It is the authoritative reference for the signal processing pipeline.

**Two signal channels:**
1. **835 EDI** — electronic remittance advice from payer/clearinghouse. Structured, machine-parseable, arrives per-claim.
2. **PDF documents** — denial letters, ADR requests, EOBs, recoupment notices, peer-to-peer letters, external review decisions. Unstructured, requires extraction before processing.

**Pipeline stages for all signals:**

```
Receive → Extract → Match → Classify → Route → Act → Review Gate
```

Every signal moves through all six stages. Stages that fail or produce low-confidence output drop the signal to human review rather than proceeding automatically.

---

## 2. Signal Ingestion

### 2.1 835 EDI — Ingestion Rules

**Idempotency:** The ISA13 (interchange control number) is the idempotency key. If an 835 file with the same ISA13 is received more than once, log it and discard — do not process again.

**Transaction-level unit:** Each ST/SE envelope within the 835 is a `RemitEvent`. A single 835 file may contain multiple ST/SE envelopes (multiple payer transactions). Each is processed independently.

**Claim-level unit:** Each CLP segment within a transaction is one claim payment record. One ST/SE may contain many CLP segments. Each CLP triggers the full pipeline independently.

**Required 835 segments to proceed:**

| Segment | Purpose | Required |
|---|---|---|
| ISA | Interchange control — idempotency key | Yes |
| GS | Functional group |  Yes |
| BPR | Payment information (total amount, EFT/check) | Yes |
| CLP | Claim payment (patient control number, status, amounts) | Yes |
| CAS | Claim adjustment (CARC codes, adjustment amounts) | Yes if payment < billed |
| SVC | Service line payment | Required for line-level routing |
| NM1 (loop 2100) | Patient/insured name | Yes |
| REF (NM1 QK) | Member ID | Conditional |
| DTM | Service dates | Yes |
| CLP07 | Payer's own claim control number | Conditional |

If ISA, CLP, or DTM are missing or unparseable, drop to **Staging → Malformed** queue for manual intervention.

**Claim status codes (CLP02) — first-level branch:**

| CLP02 | Meaning | Processing path |
|---|---|---|
| `1` | Processed as primary | Payment — check for underpayment |
| `2` | Processed as other | Payment — check for underpayment |
| `3` | Processed as tertiary | Payment — check for underpayment |
| `4` | Denied | Denial — classify via CARC |
| `19` | Processed as primary, forwarded | Payment — check for underpayment |
| `20` | Processed as secondary, forwarded | COB payment — COB analysis |
| `21` | Processed as tertiary, forwarded | COB payment — COB analysis |
| `22` | Reversal of prior payment | **Flag for human review immediately** — opens recoupment workflow |
| Any other | Not standard | Drop to **Staging → Unrecognized** |

**Claim frequency type (CLP09) — corrected claim handling:**

| CLP09 | Meaning | Action |
|---|---|---|
| `1` | Original | Normal processing |
| `7` | Replacement | Link to original claim, update match |
| `8` | Void/Cancel | Void existing matched instance, escalate to human |
| Any other | Non-standard | Flag for manual review |

---

### 2.2 PDF Documents — Ingestion Rules

PDFs arrive through three channels: manual upload (staff drags into the interface), fax-to-email pipeline, and payer portal document download. All three paths feed the same extraction pipeline.

**Step 1 — Document type classification (before extraction):**

Run a lightweight classifier on the first two pages to identify document type before full extraction. This determines which extraction template to apply.

| Signal phrases (case-insensitive) | Classified as |
|---|---|
| "has been denied", "claim denied", "not a covered benefit", "does not meet criteria for medical necessity", "authorization was not obtained" | **Denial letter** |
| "additional development request", "medical records are requested", "documentation is required to support", "request for records", "pre-payment review" | **ADR letter** |
| "overpayment has been identified", "repayment is requested", "offset will be applied", "recoupment", "demand for repayment" | **Recoupment notice** |
| "authorization is denied", "service is not authorized", "precertification denied" | **Prior auth denial** |
| "peer-to-peer review", "peer to peer", "clinical peer review requested" | **Peer-to-peer request** |
| "external review decision", "independent review organization", "IRO determination", "upheld", "overturned" | **External review decision** |
| "explanation of benefits", "remittance advice" (but not EDI) | **Paper EOB** |
| "settlement", "resolution", "payment in full agreement" | **Settlement letter** |

If no match, classify as **Unknown** and route to **Staging → Needs Classification**.

**Step 2 — Extraction fields by document type:**

Every document type requires different fields. Extraction failure on any **required** field drops the document to **Staging → Incomplete**.

**Denial letter:**

| Field | Required | Notes |
|---|---|---|
| Patient name or MRN | Yes | Used for matching |
| Claim ID or HAR | Yes | Primary match key |
| Date of service | Yes | |
| Payer name | Yes | |
| Denial reason / reason code | Yes | |
| Denial date | Yes | |
| Appeal deadline | Yes | Calculate if not explicit — see §8.1 |
| Amount denied | Yes | |
| CARC / reason code | Conditional | Present if EOB-style denial letter |

**ADR letter:**

| Field | Required | Notes |
|---|---|---|
| Patient name or MRN | Yes | |
| Claim ID or HAR | Yes | |
| Date of service | Yes | |
| Payer name | Yes | |
| Records requested (list) | Yes | |
| Response deadline | Yes | ADRs have hard deadlines — flag if < 45 days |
| Payer reference number | Conditional | |

**Recoupment notice:**

| Field | Required | Notes |
|---|---|---|
| Patient name or MRN | Yes | |
| Claim ID or HAR | Yes | |
| Date of original payment | Yes | |
| Amount to be recouped | Yes | |
| Repayment deadline | Yes | |
| Reason for recoupment | Yes | |
| Offset start date | Conditional | |

**Prior auth denial:**

| Field | Required | Notes |
|---|---|---|
| Patient name or MRN | Yes | |
| Service requested | Yes | |
| Date of request | Yes | |
| Denial reason | Yes | |
| Was auth obtained prior to service? | Conditional | If service already rendered, check 835 for claim denial |

**Peer-to-peer request:**

| Field | Required | Notes |
|---|---|---|
| Patient name | Yes | |
| Claim ID | Yes | |
| Payer medical director contact | Yes | |
| Deadline for P2P scheduling | Yes | |

**External review decision:**

| Field | Required | Notes |
|---|---|---|
| Instance/appeal reference number | Yes | |
| Decision (upheld / overturned / partial) | Yes | |
| Decision date | Yes | |
| Rationale | Conditional | |
| Recovery amount (if overturned) | Conditional | |

---

## 3. Matching Rules

Run after extraction. Match key priority order: **HAR first, then Claim ID, then probabilistic fallback.**

### 3.1 Match Attempt 1 — HAR

HAR is the hospital's internal encounter identifier. It is the most stable identifier across payer/claim iterations.

```
exact(extracted_HAR) == exact(stored_HAR)
  → HIGH confidence match
  → Check CLP09 and CLP02 to determine update vs. new (see §3.4)
```

If HAR is absent from the signal (common in PDF documents), proceed to Attempt 2.

### 3.2 Match Attempt 2 — Claim ID

Claim ID can be one of two things:
- **Patient Control Number** (CLP01 in 835, or "our" reference on denial letters) — set by the provider on the 837
- **Payer Claim Control Number** (CLP07 in 835, or payer's reference on letters) — set by the payer

Match against both fields on stored claims:

```
exact(extracted_claim_id) == exact(stored_patient_control_number)
  → HIGH confidence match

exact(extracted_claim_id) == exact(stored_payer_claim_id)
  → HIGH confidence match (note: payer can reassign this — see edge cases §7.3)
```

### 3.3 Match Attempt 3 — Probabilistic (human review required)

If neither HAR nor Claim ID yields a match:

```
MRN + payer + DOS_start + (total_billed_amount within ±5%)
  → MEDIUM confidence
  → Route to Staging → Needs Confirmation before any action
```

```
MRN + payer + DOS within ±7 days
  → LOW confidence
  → Route to Staging → Needs Confirmation, tagged as low-confidence
```

### 3.4 Post-Match Disposition

A match is found. Now determine what to do with the matched instance:

| Matched Instance State | Signal Type | Action |
|---|---|---|
| Any | 835, CLP09=`8` (void) | Cancel matched instance. Route to human review. |
| Any | 835, CLP09=`7` (replacement) | Update claim data on matched instance. Treat 835 as new remit event on that instance. |
| `Intake` / `Active` | 835 denial (CLP02=4) | Update instance with new CARC/amounts if changed. Flag if category changed from original. |
| `Submitted` | 835 (any) | **Payer response received.** Update episode result on current appeal round. Transition state based on CLP02 and payment. See §5. |
| `Won` / `Recovered` | 835 with payment | Confirm recovery. Record on timeline. No new instance. |
| `Won` / `Recovered` | 835 with $0 / denial | **Reversal of prior win.** Flag immediately for human review — do not auto-process. |
| `Closed` | 835 denial | Check whether this is a new denial on a corrected claim. If same CARC on same claim, ignore. If different claim ID, create new instance linked via `corrected_claim_of`. |
| Any | PDF denial letter | Attach PDF to matched instance as `denial_letter`. Update `denial_letter_received_at`. Do not change state. |
| Any | PDF ADR letter | Create new ADR instance linked via `adr_preceded` relationship. Do not update matched denial instance. |
| `Submitted` | PDF external review decision | Update current appeal round decision. Transition state. |
| `Submitted` | PDF P2P request | Attach to instance timeline. Route to physician advisor. |
| No match (Level 3) | Any | Create new instance. See §4. |

---

## 4. New Instance Creation Rules

### 4.1 Create vs. Suppress Decision

Before creating a new instance, check suppression rules in order:

| Condition | Action |
|---|---|
| CAS group code = `PR` only (patient responsibility: deductible, copay, coinsurance) | **Suppress.** Do not create. Log as patient responsibility. |
| All CAS adjustments use group code `CO` with CARC-45, and paidAmount == expectedContractAmount (no variance) | **Suppress.** Contractual adjustment to contracted rate is expected behavior. |
| CLP02=`4`, CARC-18 (duplicate claim) | **Suppress.** Do not create denial instance. Log as duplicate. Flag the original claim for follow-up if original denial is unresolved. |
| Dollar amount of dispute < facility work threshold (configurable, default: $100) | **Suppress.** Log as below-threshold. No instance created. |
| ISA13 already processed (same 835 file) | **Suppress.** Idempotency. Log and discard. |
| CARC-24 (capitation — services covered under capitation agreement) | **Suppress.** Capitation adjustments are expected. Log. |
| CARC-1, -2, -3 only (patient deductible/coinsurance/copay without additional payer-side reduction) | **Suppress.** Patient responsibility. |
| PDF classified as duplicate of already-attached document (same payer, same dates, same type) | **Suppress.** Log. |

If suppression does not apply, create the instance and proceed to §4.2.

### 4.2 Instance Creation — Field Population

| Field | Source |
|---|---|
| `state` | `Intake` |
| `status` | `Unreviewed` |
| `source` | `835_auto` or `pdf_upload` or `manual_entry` |
| `match_confidence` | From §3 |
| `carc` | From CAS02 (primary — see §5.1 for multi-CARC logic) |
| `rarc` | From CAS remark code(s) |
| `denied_amount` | CLP03 − CLP04 (for denials); or expectedContractAmount − CLP04 (for underpayments) |
| `deadline` | Current date + payer-specific appeal window (see §8.1) |
| `denial_type` | From CARC classification (see §5) |
| `assigned_to` | `null` — assigned at intake acceptance per routing rules (see §6) |
| `needs_attention` | Set to `true` if any escalation trigger fires (see §7) |

---

## 5. Classification — Remit Code Decision Trees

### 5.1 Multi-CARC Handling

A single CLP/SVC can carry multiple CAS segments with multiple CARC codes. When multiple CARCs are present:

1. **Identify the primary action CARC** — the one with the largest adjustment dollar amount. This determines the case type.
2. **Record all CARCs** on the instance for full auditability.
3. **Check for conflicting classification signals** — if the two largest-dollar CARCs suggest different case types (e.g. CARC-50 medical necessity and CARC-15 prior auth), flag for human classification. Do not auto-classify.
4. **CARC-45 co-occurring with another denial CARC** — check if the CARC-45 adjustment represents the contracted rate reduction (expected) or a separate underpayment variance. If paidAmount < expectedContractAmount after removing CARC-45, create an underpayment instance alongside the denial instance.

### 5.2 Denial Classification — Full CARC Matrix

The following table is the authoritative mapping from CARC to denial type, subtype, and initial routing queue. CARCs not listed here route to **Staging → Unclassified**.

#### Group A — Medical Necessity Denials

These denials assert that the services rendered were not medically necessary per payer criteria. They require clinical documentation to overturn and must be assigned to a clinical reviewer.

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `50` | These are non-covered services because this is not deemed a 'medical necessity' by the payer | Medical Necessity | Standard med nec | Yes | Most common med nec CARC |
| `167` | This does not meet the criteria for the level of care | Medical Necessity | Level of care (LOC) | Yes | Often obs vs. inpatient |
| `151` | Payment adjusted because the payer deems the information submitted does not support this level of service | Medical Necessity | Level of service | Yes | Outpatient E&M downcoding |
| `B7` | This provider was not certified/eligible to be paid for this procedure | Medical Necessity | Provider credentials | No | May require credentialing fix, not appeal |
| `B8` | Alternative services were available, and should have been utilized | Medical Necessity | Alternative treatment | Yes | Requires clinical justification |
| `49` | These are non-covered services because this is a routine or preventive care | Medical Necessity | Non-covered / benefit exclusion | No | Review benefit language — may not be appealable |
| `96` | Non-covered charge(s) | Medical Necessity | Non-covered / benefit exclusion | No | Review benefit language first |
| `119` | Benefit maximum for this time period or occurrence has been reached | Medical Necessity | Benefit max | No | Verify benefit accumulator — if error, dispute |
| `58` | Treatment was deemed by the payer to have been rendered in an inappropriate or invalid place of service | Medical Necessity | Place of service | Yes | Common for outpatient billed as inpatient |

**What creates a med nec denial vs. other types:**
- CLP02 = `4` (full denial) AND CAS group = `CO` AND CARC in above list
- Distinguishing from DRG downgrade: med nec denials have $0 payment on the full claim; DRG downgrades have a non-zero payment but at a lower DRG weight
- Distinguishing from prior auth: CARC-50 = payer reviewed and decided no; CARC-15/197 = payer never got to review clinical content because auth was never obtained

---

#### Group B — Prior Authorization / Notification Denials

These denials assert that the payer was not notified or did not pre-approve the service before it was rendered.

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `15` | Payment adjusted because this procedure/service requires that a referring, ordering, or rendering provider be identified, and this information is missing, incomplete, or invalid | Prior Auth | Missing referral/ordering provider | No | Technical fix — corrected claim, not appeal |
| `197` | Precertification/authorization/notification absent | Prior Auth | Auth not obtained | Yes (emergency template only if emergent criteria met) | Check for emergency exception before drafting |
| `198` | Precertification/notification exceeded | Prior Auth | Auth obtained but exceeded scope | Yes | Argue scope was clinically appropriate |
| `170` | Payment is denied when performed/billed by this type of provider in this type of facility | Prior Auth | Network / billing entity | No | Credentialing or network issue — not a standard appeal |
| `243` | Services denied at the time authorization was requested | Prior Auth | Auth denied prospectively | Yes | Retroactive appeal — requires clinical support |
| `234` | This procedure is not paid separately | Prior Auth / Bundling | Procedure bundled | Yes | Check NCCI edits |

**Emergency exception rule for CARC-197/198:**  
Before routing as a standard prior auth denial, check:
- Admit type on the claim = `1` (Emergency) or type_of_bill ends in `1` (emergency inpatient)
- OR ICD-10 principal diagnosis is in the emergency diagnosis table (see §9.1)
- OR admission time was outside business hours (if available)

If any emergency indicator is present → flag for emergency exception appeal template. Do not auto-draft the standard auth appeal.

**Auth obtained but denied rule:**  
If CARC-197 is present but the claim has an authorization number in REF segment → **escalate immediately to human review**. This is a high-priority dispute — auth was obtained but payer is still denying.

---

#### Group C — DRG / Coding Disputes

These denials or payment variances relate to how the claim was coded — what DRG was assigned, what diagnoses were sequenced, or whether the clinical documentation supports the billed codes.

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `4` | The service/equipment/drug is not covered under the patient's current benefit plan | Coding | Procedure/service not covered | Conditional | Check if truly non-covered vs. coding error |
| `4` + DRG paid ≠ DRG billed | Coding | DRG downgrade | Yes | Distinguish from med nec: payment exists but at wrong DRG |
| `125` | Payment adjusted due to a submission/billing error | Coding | Billing/coding error | Yes | Corrected claim or coding appeal |
| `181` | Procedure code was invalid on the date of service | Coding | Invalid code | No | Corrected claim typically needed |
| `55` | Procedure code/bill type does not match diagnosis | Coding | Code mismatch | No | Corrected claim |
| `B6` | Under DMERC medical review guidelines, the information submitted does not support the need for this item | Coding | DMERC review | Yes | Clinical documentation needed |
| `252` | An attachment/other documentation is required to adjudicate this claim/service | Coding | Incomplete documentation | No | Send records, not an appeal |

**What creates a DRG denial vs. a medical necessity denial:**

The key distinction is payment behavior:
- **DRG downgrade**: CLP02 ≠ `4`. Claim was paid, but at a lower DRG than billed. `paid_drg` (from MOA segment or line-level data) differs from `billed_drg`.
- **Med nec denial**: CLP02 = `4`. Claim payment = $0.
- **DRG denial with zero pay**: Rare — CLP02 = `4` AND the denial cites DRG/coding. Treat as coding denial, auto-classify as DRG and route to CDI.

**DRG downgrade detection (835 signals):**

Check the MOA segment (outpatient adjudication info for Medicare) or, for commercial, compare:
- `billed_drg` from the original claim record
- `drg_paid` from the 835 (CLP segment or SVC-level data, payer-dependent placement)

If `drg_paid` != `billed_drg` AND `paid_amount > 0` → classify as DRG Downgrade underpayment.  
If the downgrade also caused a code-level denial (payer explicitly denied specific diagnoses) → create both a DRG Underpayment and a Coding Denial instance, linked.

**ADR detection (835 signals):**

835 signals alone do not identify ADRs. However, a Medicare 835 that pays at a reduced DRG and references a QIO review (via NTE segment or RARC codes M44, M45, M46, M77) indicates a post-ADR DRG change. When these RARCs appear:
- If an ADR instance already exists for this claim → attach as episode result on that instance
- If no ADR instance exists → create DRG Coding Dispute instance AND flag "potential preceding ADR — verify"

---

#### Group D — Timely Filing

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `29` | The time limit for filing has expired | Timely Filing | Late filing claimed | Yes | Always auto-draft with 277-CA proof |
| `39` | Services denied at the time authorization/certification was requested | Timely Filing (related) | Retroactive auth denied | Yes | |

**Timely filing auto-draft logic:**  
Immediately on classification as CARC-29, query the 277-CA acknowledgment record for this claim. If a 277-CA acknowledgment with an acceptance status exists:
- Auto-draft the timely filing defense letter, pre-populated with the 277-CA date and reference number
- Route to Business Office queue
- Mark the `needs_attention` flag with "277-CA acknowledgment available — strong defense"

If no 277-CA acknowledgment exists in the system:
- Do NOT auto-draft
- Route to Business Office queue with status "277-CA needed before defense can proceed"
- Set escalation flag: human must locate clearinghouse acknowledgment before deadline

**Payer-specific filing windows (see §8.1 for full table):**  
Auto-calculate whether the 277-CA date falls within the payer's stated window. If it does and the payer is denying on timely filing, it is a clearly defensible denial — auto-draft and auto-prioritize.

---

#### Group E — Administrative / Eligibility / COB

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `22` | This care may be covered by another payer per coordination of benefits | COB | COB — primary unknown | No | Need to identify primary payer before drafting |
| `23` | The impact of prior payer(s) adjudication including payments and/or adjustments | COB | COB secondary payment | Conditional | Calculate expected secondary obligation; auto-draft if calculable |
| `16` | Claim/service lacks information or has submission/billing error | Admin | Missing/invalid claim data | No | Corrected claim needed, not appeal |
| `109` | Claim not covered by this payer/contractor | Admin | Wrong payer | No | Identify correct payer — rebill |
| `27` | Expenses incurred after coverage terminated | Admin | Eligibility — coverage lapsed | No | Verify eligibility — retroactive coverage request if applicable |
| `31` | Claim denied as patient cannot be identified as our insured | Admin | Eligibility — patient not found | No | Verify enrollment; may need corrected claim with correct ID |
| `107` | The related or qualifying claim/service was not identified on this claim | Admin | Missing cross-reference | No | Corrected claim |
| `226` | Information requested from the patient/insured/responsible party was not provided or was insufficient | Admin | Missing patient info | No | Collect from patient; resubmit |
| `227` | Information requested from other entity was not provided or was insufficient | Admin | Missing third-party info | No | Collect from referenced entity |

**COB secondary payment (CARC-23) underpayment detection:**  
When CLP02 indicates payment was processed as secondary (`2` or `20`):
1. Retrieve primary payer's payment amount from the claim record
2. Calculate: `expected_secondary = contracted_allowed − primary_paid`
3. Compare: `paid_secondary` (CLP04) vs `expected_secondary`
4. If `paid_secondary < expected_secondary` by > threshold → create COB Underpayment instance
5. If `primary_paid` is not on file → flag for manual COB analysis, do not auto-create underpayment

---

#### Group F — Bundling / Multiple Procedure Errors

These signals indicate payer processing decisions that reduced payment by combining services the provider billed separately or applying incorrect multiple-procedure reductions.

| CARC | Description | Denial Type | Subtype | Auto-Draft? | Notes |
|---|---|---|---|---|---|
| `97` | The benefit for this service is included in the payment/allowance for another service/procedure that has already been adjudicated | Payer Processing | NCCI bundling error | Yes | Check NCCI edits — if edit does not apply, auto-draft |
| `N70` (RARC) | Alert — processed in accordance with contract and/or as a secondary payer | Payer Processing | Contract-based bundling | Conditional | Confirm whether bundling is contractually permitted |
| `B15` | This service/procedure requires that a qualifying service/procedure be received and covered | Payer Processing | Missing qualifying service | No | Check claim for all required components |
| `4` (on SVC line, not full claim) | Service not covered under current plan | Payer Processing | Line-level reduction | Conditional | Compare to NCCI edits |

**NCCI edit check logic for CARC-97:**  
1. Identify the pair of procedure codes: the primary code (paid) and the bundled code (denied/reduced)
2. Look up the code pair in the NCCI edit table for the service date
3. If the edit applies and the modifier indicator = `0` (no modifier can override) → bundling was correct; suppress instance
4. If the edit applies but the modifier indicator = `1` (modifier can override) → check whether modifier -59, -XS, -XP, -XU, or -XE was billed. If yes → auto-draft unbundling argument
5. If the edit does not apply (services are separately billable per NCCI) → auto-draft unbundling demand
6. If edit status is uncertain → route to coding team for manual review

---

### 5.3 Underpayment Classification

Underpayments are not denials — the claim was paid, but at less than the contracted amount. They are triggered when:

- CLP02 ∈ {`1`, `2`, `3`, `19`, `20`, `21`} (any paid status)
- `paid_amount < expected_contract_amount` by more than the work threshold (default: $100 or 5%, whichever is greater)
- `expected_contract_amount` must be derivable from the contract fee schedule; if unavailable, flag for manual review and do not auto-create

**Contract fee schedule lookup (required for auto-detection):**  
The system must resolve:
- `payer_id` + `plan_type` + `facility_id` + `dos` + (`drg` or `procedure_code`) → `contracted_rate`

If resolution fails (no contract on file, expired contract, ambiguous plan type) → route to **Contract Management queue** with flag "Contract rate unknown — manual variance calculation required."

**Underpayment CARC classification table:**

| CARC (on underpaid claim) | Category | Subtype | Auto-Draft? |
|---|---|---|---|
| `45` (CO-45) — paid DRG weight ≠ billed DRG weight | Contract Variance | DRG Base Rate or Weight Error | Yes |
| `45` — paid rate ≠ contracted fee schedule rate | Contract Variance | Incorrect Fee Schedule Applied | Yes |
| `45` — outlier payment calculation differs | Contract Variance | Outlier Payment Calculation Error | Yes |
| `45` — stop loss threshold miscalculated | Contract Variance | Stop Loss Threshold Error | Yes |
| `45` — device/implant cost not carved out | Contract Variance | Implant / Device Carveout Variance | Yes |
| `97` — services bundled that are separately payable per contract | Payer Processing Error | Bundling Error | Yes |
| `4` — units processed incorrectly | Payer Processing Error | Incorrect Processing of Billed Units | Yes |
| `4` — procedure downcoded silently | Payer Processing Error | Payer Downcoding | Yes |
| `4` — multiple procedure reduction over-applied | Payer Processing Error | Multiple Procedure Reduction Error | Yes |
| `23` — COB secondary underpayment | Admin & Eligibility | Coordination of Benefits Issue | Conditional |
| `29` — timely filing penalty applied to partial payment | Admin & Eligibility | Administrative / Timely Filing Issue | Yes |
| No CARC, but paid < expected | Contract Variance (provisional) | Silent Downcode / Variance | No — human review required |

**Outlier payment underpayment detection (CARC-45):**  
Medicare and commercial payers must apply a cost-to-charge ratio (CCR) to calculate outlier payments. Check:
1. Does the claim's total charge (`CLP03`) exceed the payer's outlier threshold?
2. If yes, retrieve the CCR used by the payer from the 835 MOA segment or per contract amendment
3. Compare to the CCR specified in the current contract year amendment
4. If CCR differs by > 0.02 → create Outlier Payment Calculation Error underpayment

**Stop loss underpayment detection:**  
1. Check if the claim's allowed amount exceeds the stop loss threshold in the contract
2. If yes, retrieve the payer's calculation from the 835
3. Verify whether the payer used billed charges or allowed amount as the denominator (contracts specify which)
4. If wrong denominator → create Stop Loss Threshold Error underpayment

**Device carveout underpayment detection (CARC-45):**  
1. Check whether the claim has implantable device charges (revenue codes 272–278 or specific HCPCS J-codes / device HCPCS)
2. If device charges present, check contract for device carveout provision (dollar threshold)
3. If device invoice cost exceeds carveout threshold and payer did not issue a separate payment → create Implant/Device Carveout Variance underpayment
4. Requires device invoice cost from the chargemaster or revenue code; if unavailable → flag for human review

---

### 5.4 ADR (Additional Development Request) Classification

ADRs are not denials and not underpayments. They are documentation requests that may precede a denial. ADRs always arrive as PDF documents (never as 835 signals), except for post-payment Medicare ADRs which may arrive as both a letter and a reduced-DRG 835.

| ADR Type | Identifying characteristics | Action |
|---|---|---|
| **Pre-payment ADR** | Arrives before any 835. Claim is in "pending" status. | Create ADR instance. Hold clock on claim payment pending ADR response. |
| **Post-payment ADR** | 835 already processed (claim was paid). New PDF requests records for a paid claim. | Create ADR instance linked `adr_followed` to the paid claim. Flag that a DRG downgrade or recoupment may follow. |
| **Medicare TPE (Targeted Probe and Educate)** | ADR letter specifically references TPE, PCR (Probe, Contain, Review) program, or MAC name | Create ADR instance with `adr_program = 'TPE'`. Higher escalation threshold — involves multiple claims. |
| **RAC / OIG / OIG OIG Audit** | References Recovery Audit Contractor, OIG, or HHS audit | Create ADR instance with `adr_program = 'RAC'` or `'OIG'`. **Immediately escalate to human review regardless of dollar amount.** |

**ADR response deadline logic:**  
ADRs carry hard deadlines. If the response deadline extracted from the PDF is:
- > 45 days away → normal routing
- 20–45 days away → set `needs_attention = true`, notify assigned staff
- < 20 days away → **Immediate escalation** to supervisor queue, set `priority = critical`
- Already past → Flag as expired. Route to human to determine whether to request extension.

---

### 5.5 Recoupment Classification

Recoupment notices are always high-priority regardless of dollar amount because they involve the payer taking money back from future payments.

| Recoupment Type | Identifying characteristics | Action |
|---|---|---|
| **Pre-recoupment demand** | Repayment letter received, offset has not yet started | Create Recoupment instance. Begin dispute clock. |
| **Active offset (835 with negative payment)** | 835 shows negative payment amount in BPR segment or CLP04 is negative | Create Recoupment instance if not already open. Update with offset amount and date. |
| **Self-disclosed overpayment** | Internal audit identified overpayment, requires refund routing | Out of scope for inbound signal routing — handled by AR/AP workflow. |

**Recoupment dispute window:**  
Medicare: 30 days to request waiver of offset (stay) while appeal is pending.  
Commercial: contract-specific — defaults to 30 days if not specified.  
Flag immediately if the dispute window has < 15 days remaining.

---

## 6. Auto-Routing Rules

After classification, the instance is routed to a work queue. Routing is based on denial type, payer type, and dollar amount. Routing happens at instance creation — it can be overridden manually at any time.

### 6.1 Queue Assignment Matrix

| Denial / Issue Type | Primary Queue | Secondary Queue (overflow / escalation) |
|---|---|---|
| Medical Necessity — any | Clinical Review | Physician Advisor |
| Medical Necessity — Medicare | Clinical Review + HIM | Physician Advisor |
| DRG Downgrade | CDI (Clinical Documentation Improvement) | Coding Compliance |
| DRG Downgrade — Medicare ADR-preceded | CDI + HIM | Medical Records |
| ADR | HIM / Medical Records | CDI |
| Prior Auth — auth not obtained | Authorization Management | — |
| Prior Auth — auth obtained but denied | Clinical Review | Supervisor escalation |
| Prior Auth — emergency exception | Clinical Review | Physician Advisor (P2P) |
| Timely Filing | Business Office | — |
| Coding / Billing Error | Coding Compliance | — |
| Bundling Error | Contract Management | Coding Compliance |
| Contract Variance — any | Contract Management | — |
| Outlier Payment Calculation Error | Contract Management | Finance |
| Stop Loss Threshold Error | Contract Management | Finance |
| Device Carveout Variance | Contract Management | Supply Chain (invoice retrieval) |
| COB Underpayment | COB Coordinator | — |
| Payer Processing Error | Contract Management | — |
| Recoupment | Finance | Supervisor |
| RAC / OIG Audit | Compliance | CFO notification |

### 6.2 Auto-Assignee Selection

Within a queue, the system selects an assignee using:
1. **Round-robin** within the queue by default
2. **Payer affinity** — if a team member has handled > 5 cases for this payer in the last 60 days, prefer them (expertise signal)
3. **Workload cap** — do not assign to any staff member with > 50 open instances unless all queue members are above cap (then assign with flag)

Automatic assignment does not apply to:
- Escalated instances (require supervisor acceptance)
- RAC/OIG audit instances (require manual assignment by compliance lead)
- Instances flagged with `needs_attention` = true (surfaced for human review before assignment)

---

## 7. Auto-Draft Letter Rules

The system generates a draft appeal or demand letter automatically for qualifying signals. Drafts are never submitted automatically — they require human review and approval before submission.

### 7.1 Denial Appeal Auto-Draft — Triggers and Templates

| Denial Type | CARC(s) | Draft template | Pre-population data |
|---|---|---|---|
| Medical Necessity — inpatient LOC | `50`, `167` | Inpatient med nec appeal | Patient diagnoses, procedures, clinical summary, InterQual/Milliman criteria reference |
| Medical Necessity — outpatient LOC | `151`, `167` | Outpatient E&M appeal | MDM documentation, diagnosis, procedure codes |
| Medical Necessity — level of care (obs vs. IP) | `167` | Observation-to-inpatient appeal | Admit severity, comorbidities, nursing documentation summary |
| Prior Auth — emergency exception | `197`, `198` | Emergency exception letter | Admit type, chief complaint, ICD-10 principal Dx, door-to-treatment time if available |
| Prior Auth — auth obtained, payer denying | `197` + auth number present | Auth dispute letter | Auth number, approval date, scope of services authorized |
| Prior Auth — auth obtained but exceeded | `198` | Scope exceeded appeal | Authorized vs. rendered services, clinical justification for additional services |
| Timely Filing — 277-CA exists | `29` | Timely filing defense | 277-CA date, clearinghouse transaction ID, payer filing window |
| DRG Downgrade — commercial | CARC-4 or -45, paid_drg ≠ billed_drg | DRG coding appeal | Billed DRG, paid DRG, principal Dx, comorbidities, DRG weight differential, dollar variance |
| DRG Downgrade — Medicare | CARC-4/-45 + MOA remark M77 | Medicare DRG appeal / redetermination | Billed DRG, paid DRG, principal Dx, clinical documentation summary, ICD-10 guidelines citation |
| Bundling Error — NCCI edit does not apply | `97` + NCCI check passes | NCCI unbundling demand | Code pair, NCCI edit reference, date of edit, modifier usage if applicable |
| Bundling Error — modifier present | `97` + modifier -59/-XS/-XE billed | Modifier -59 defense | Code pair, modifier justification, separate service documentation |

**What is NOT auto-drafted:**
- CARC-49/96/119 (non-covered, benefit max) — denial reason is plan design, not an appeal point; human must review benefit document before drafting
- CARC-22/109 (wrong payer) — requires identifying the correct payer first
- CARC-16/55/181 (corrected claim needed) — requires a corrected 837 submission, not an appeal letter
- CARC-B7/170 (provider credentials) — requires credentialing research before drafting
- Low-confidence match instances — do not draft until match is confirmed by human

### 7.2 Underpayment Demand Auto-Draft — Triggers and Templates

| Underpayment Type | CARC(s) | Draft template | Pre-population data |
|---|---|---|---|
| Incorrect Fee Schedule Applied | `45` | Fee schedule demand | Contract year, applicable rate schedule, billed vs. paid rate comparison |
| DRG Base Rate or Weight Error | `45` (DRG mismatch) | DRG variance demand | Billed DRG, paid DRG, contracted base rate, weight differential, dollar variance |
| Outlier Payment Calculation Error | `45` (outlier context) | Outlier recalculation demand | Total charges, outlier threshold, CCR used vs. contracted CCR, recalculated outlier amount |
| Stop Loss Threshold Error | `45` (stop loss context) | Stop loss recalculation demand | Allowed amount, threshold, correct denominator per contract section citation |
| Implant / Device Carveout Variance | `45` (device on claim) | Device carveout demand | Device HCPCS/revenue code, invoice cost, contract section, carveout threshold |
| Bundling Error (underpayment) | `97` | NCCI unbundling demand | Same as denial bundling template |
| Incorrect Processing of Billed Units | `4` (line-level unit reduction) | Unit correction demand | Billed units, paid units, MAR or documentation reference, J-code |
| Payer Downcoding — E&M | `4` (E&M downcode) | E&M level of service demand | Billed CPT, paid CPT, MDM elements, AMA 2021 criteria reference |
| Multiple Procedure Reduction Error | `4` (excess reduction) | Multiple procedure demand | Billed procedures, reduction applied, contract reduction policy citation |
| COB Underpayment | `23` | COB secondary obligation demand | Primary EOB, primary payment, expected secondary calculation |
| Timely Filing Penalty | `29` (partial pay) | Timely filing penalty dispute | 277-CA date, penalty amount, regulatory cite |

### 7.3 Draft Letter Quality Gates

Before any auto-draft is surfaced to staff, the system runs quality gates. If any gate fails, the draft is not surfaced — the instance moves to queue with a "Draft blocked — data missing" notice.

| Gate | Check | Blocked if |
|---|---|---|
| Patient data complete | Name, MRN, DOB, payer ID | Any missing |
| Claim data complete | Claim ID, HAR, DOS, billed amount | Any missing |
| Denial reason identified | Denial type + subtype | Classification is still "Unknown" |
| Dollar amount confirmed | `denied_amount > 0` OR `variance_amount > 0` | Zero or negative |
| No conflicting CARC signals | See §5.1 multi-CARC handling | Conflicting classification |
| Contract rate available (underpayments) | `expected_contract_amount` resolvable | Contract rate lookup failed |
| Match confidence high | See §3 | Match confidence = Low |

---

## 8. Human Intervention Triggers

The following conditions require a human to review before the system proceeds. They are not blocking errors — the instance is created and classified, but it is surfaced to the appropriate supervisor or specialist before assignment and drafting.

### 8.1 Escalation Triggers — Create Instance but Hold

| Trigger | Reason | Route to |
|---|---|---|
| Match confidence = Medium or Low (see §3.3) | Ambiguous signal-to-claim link | Intake Supervisor |
| CARC not in classification matrix | Unrecognized code — cannot classify | Intake Supervisor + Engineering (log for matrix update) |
| Multiple CARCs with conflicting category classification | Cannot auto-determine primary issue | Intake Supervisor |
| CLP02 = `22` (reversal / recovery) | Payer taking back prior payment | Finance + Supervisor |
| CLP09 = `8` (void/cancel) | Claim being cancelled | AR Team |
| Auth number present on CARC-197 denial | Auth was obtained but payer denying | Supervisor — high priority |
| ADR deadline < 20 days | Urgent documentation deadline | Supervisor — critical priority |
| ADR type = RAC or OIG | Audit program — systemic risk | Compliance Lead + CFO |
| Already-won instance receives new denial 835 | Prior win reversed | Finance + Supervisor |
| Dollar amount > $50,000 (configurable) | High-value — requires senior review before submission | Senior Analyst + Manager |
| Dollar amount > $250,000 | Very high-value | Manager + Director approval required before any submission |
| Recoupment notice with < 15 days dispute window | Time-critical financial exposure | Finance + Supervisor — same-day |
| Claim has no contract rate on file | Cannot calculate underpayment without manual lookup | Contract Management |
| Replacement claim (CLP09=7) on closed instance | Case was closed — reopening scenario | Intake Supervisor |
| PDF received with no HAR / Claim ID extracted | Cannot match or create properly | Intake Staff — manual data entry |
| Multiple open instances for same HAR (> 3) | Pattern — may indicate a systemic billing or contract issue | Manager review |

### 8.2 Escalation Triggers — During Active Work

These are not ingestion-time triggers but signals detected during the lifecycle of an active instance:

| Trigger | Reason | Route to |
|---|---|---|
| Appeal deadline < 10 days, instance not yet submitted | At-risk of deadline | Supervisor alert — urgent |
| Payer response received but outcome is ambiguous (partial or unclear) | Cannot auto-classify result | Assigned staff + Supervisor |
| L1 appeal upheld, decision letter cites clinical criteria not in appeal letter | New argument needed | Clinical Reviewer |
| P2P request received for a med nec denial | Physician involvement needed | Physician Advisor — schedule P2P |
| L2 / IRO decision received | External decision — record outcome | Manager review — determine if further action is warranted |
| Payer requests specific additional documentation | New documentation task | Assigned staff |
| Second denial on same encounter, different CARC | New issue on same patient | Intake to determine if related or new instance |

---

## 8.3 Payer-Specific Appeal Windows

Deadline calculation at instance creation uses this table. If payer is not listed, default to **60 days** and flag with "Deadline calculated from default — verify payer contract."

| Payer | Appeal Window (L1) | Notes |
|---|---|---|
| Medicare FFS — Redetermination | 120 days from MAC determination date | Medicare uses "days from determination", not from DOS |
| Medicare FFS — Reconsideration (QIC) | 180 days from redetermination decision | |
| Medicare Advantage (all plans) | 60 days from EOB/denial date | Plans may have shorter windows — check EOC |
| Medicaid (SC) | 30 days for timely filing disputes; 90 days for medical necessity | State-specific — verify |
| Blue Cross Blue Shield (PPO) | 180 days from denial date | Varies by state/plan |
| UnitedHealthcare | 180 days from date of service | Per standard contract language |
| Aetna | 180 days from EOB date | |
| Cigna | 180 days from denial date | |
| Humana | 180 days from EOB date | |
| Humana Medicare Advantage | 60 days from denial date | |
| **Default (unlisted payer)** | 60 days — flag for verification | |

---

## 9. Reference Tables

### 9.1 Emergency Diagnosis Table (Prior Auth Emergency Exception)

The following ICD-10 principal diagnosis categories trigger the emergency exception path for CARC-197/198. This list is not exhaustive — clinical judgment at the P2P level may override.

| ICD-10 range | Category |
|---|---|
| I20–I22 | Acute coronary syndromes (unstable angina, STEMI, NSTEMI) |
| I60–I64 | Acute stroke (hemorrhagic, ischemic, unspecified) |
| I26 | Pulmonary embolism |
| J96.0 | Acute respiratory failure |
| A40–A41 | Septicemia / Sepsis |
| R57 | Shock |
| S00–T14 | Trauma (major — type_of_bill indicates trauma center) |
| O60–O82 | Active labor / obstetric emergencies |
| N17 | Acute kidney injury (in context of emergent admission) |
| K92.1 | GI hemorrhage with transfusion requirement |
| G35 (acute exacerbation) | Multiple sclerosis acute flare |

### 9.2 NCCI Modifier Indicator Reference

| Modifier Indicator | Meaning | Routing action |
|---|---|---|
| `0` | Bundling is absolute — modifier cannot override | Suppress; bundling was correct |
| `1` | Modifier can override bundling | Check for modifier -59/-X{S,P,U,E} on claim; if present, auto-draft |
| `9` | Not applicable to this code pair | Treat as separately billable; auto-draft |

### 9.3 Medicare ADR RARC Codes

| RARC | Meaning | Action |
|---|---|---|
| `M44` | Alert: the claim information has been forwarded to the patient's supplemental insurer | Informational — no action |
| `M45` | Informational: the claim information has been forwarded to the patient's supplemental insurer | Informational |
| `M46` | The late charge(s) have been separated | Flag for coding review |
| `M77` | Primary payer claim number indicated on claim does not match | Match issue — human review |
| `N115` | This decision was based on a Local Coverage Determination (LCD) | Med nec denial — cite LCD in appeal |
| `N522` | Alert: payment based on the following contract amount | Underpayment context — verify contract rate |
| `N130` | Alert — payment based on clinical review | Post-clinical-review decision — med nec appeal pathway |

---

## 10. State Transitions Triggered by Inbound Signals

This section defines how 835 and PDF signals move instances through the state machine. It complements the full state machine in `system-design-denial-instances.md`.

| Current State | Signal | Condition | New State | New Status |
|---|---|---|---|---|
| `Intake` | 835 denial (CLP02=4) | New signal, no change to existing data | `Intake` | `Unreviewed` |
| `Intake` / `Active` | 835 — same claim, no new info | Exact match, no data change | No change | No change — log signal, no transition |
| `Active` | PDF denial letter | Attaches as denial letter | No state change | Update `denial_letter_received_at` |
| `Active` | PDF ADR letter | Triggers new linked ADR instance | No change to parent | New `Intake` ADR instance created |
| `Submitted` | 835 with paid amount > 0 | CLP04 > 0, matches expected | `Won` | `Payment Adjustment Authorized` or `Partial Adjustment Authorized` |
| `Submitted` | 835 with zero pay | CLP02=4 or CLP04=0 | `Active` | Denial upheld — return to active for next round or escalation |
| `Submitted` | PDF external review decision — overturned | Decision = overturned | `Won` | `Settlement Agreed` or `Payment Adjustment Authorized` |
| `Submitted` | PDF external review decision — upheld | Decision = upheld | `Closed` | `Payer Upheld` |
| `Won` | 835 confirming payment received | Matches authorized recovery amount | `Recovered` | `Payment Adjustment Confirmed` |
| `Won` / `Recovered` | 835 with zero payment (reversal) | Payment reversed | **Hold — human review required** | Do not auto-transition |
| Any | 835 CLP09=8 (void) | Void/cancel | **Hold — human review** | Flag: `Cancelled — verify` |

---

## 11. Edge Cases

### 11.1 Payer Reassigns Claim Number Between Submission and Response

A payer may assign a new claim control number (CLP07) on the remittance that differs from the one on the original denial. The original denial used claim ID `A`; the 835 response references claim ID `B`.

**Rule:** If Claim ID match fails but HAR match succeeds, trust the HAR match and record both claim IDs on the instance. Log that payer reassigned claim number.  
**If both HAR and Claim ID fail:** probabilistic matching applies (see §3.3). Human review required.

### 11.2 Same Claim, Different Payers (COB scenario)

Primary payer 835 arrives. Instance created. Secondary payer 835 arrives later for the same HAR.

**Rule:** Check if instance already exists for this HAR. If yes, and if the new signal is from a different payer ID:
- If COB is expected (member has dual coverage on file) → create a linked secondary payer instance (`relationship = cob_secondary`)
- If COB is not expected → route to COB Coordinator for review

### 11.3 Corrected Claim Cycle

Original claim → Denied → Corrected claim submitted → Corrected claim denied.

**Rule:** The corrected claim denial creates a new instance linked to the original via `corrected_claim_of`. The original instance transitions to `Closed` with status `Corrected Claim Submitted`. If the corrected claim is also denied, the new instance enters the normal workflow.

### 11.4 PDF Arrives Before 835

A denial letter is received via fax before the 835 arrives (common — letters are often printed at the same time the 835 is generated, but mail delivery is slower than electronic submission).

**Rule:** Create a provisional instance from the PDF with `source = pdf_upload`. Set `pending_835 = true`. When the 835 arrives and matches via HAR/Claim ID, merge: update the provisional instance's CARC codes, amounts, and DRG data from the 835. Transition `pending_835 = false`. Retain the PDF as the denial letter attachment.

Hold period: 30 days. If no 835 arrives within 30 days, flag instance for manual review — the 835 may have been lost or the claim may have been submitted incorrectly.

### 11.5 Zero-Pay 835 With No CARC

The 835 shows CLP04 = 0 (no payment) but no CAS segment with CARC codes.

**Rule:** This is a malformed or incomplete 835. Do not auto-classify. Create instance with `denial_type = Unknown` and route to **Staging → Malformed 835**. Alert clearinghouse team that the trading partner is sending non-compliant 835 transactions.

### 11.6 Dollar Amount Above Auto-Draft Threshold ($50k)

An underpayment or denial is classified and would normally trigger an auto-draft. However, the dispute amount is $65,000.

**Rule:** Auto-draft proceeds (draft is generated), but the instance is flagged for senior analyst review before the draft is surfaced to the standard queue. Senior analyst must review the draft and confirm or modify before it enters the normal approval workflow.

### 11.7 Duplicate Instance Prevention

An 835 is received for a claim that already has an open, active instance with the same CARC.

**Rule:** Do not create a new instance. Log the 835 as a `RemitEvent` attached to the existing instance. If the CARC, amounts, or DRG data differ from what is on the existing instance, update the instance fields and log a timeline event "835 update — [field] changed from [old] to [new]."

If the existing instance is `Closed` or `Recovered` and a new 835 arrives with a different CARC or lower payment → human review required. Do not auto-reopen.

### 11.8 Claim With Both Medical Necessity Denial and DRG Downgrade

This can happen when a payer partially denies certain diagnoses (medical necessity) and simultaneously pays the remaining DRG at a different weight.

**Rule:** Create two instances — one Medical Necessity denial and one DRG Underpayment — linked via `compound_claim`. Total amounts must add up to the difference between billed and paid. Each instance gets its own routing, drafting, and workflow.

### 11.9 RAC / MAC Post-Payment Audit on Already-Resolved Instance

A RAC audit letter arrives for a claim that was previously resolved (Recovered state).

**Rule:** Create a new Recoupment instance. Link it to the prior resolved instance via `recoupment_of`. Do not modify the resolved instance. Immediately escalate to Compliance — RAC audits can apply to resolved claims and the resolution does not protect against future audit findings.

---

## 12. Open Items for Engineering

| # | Item | Impact |
|---|---|---|
| 1 | Contract fee schedule integration — underpayment auto-detection requires this | Without it, all underpayments must be manually identified at 835 review |
| 2 | NCCI edit table ingestion — required for CARC-97 bundling check (§5.2 Group F) | Without it, cannot auto-determine whether bundling was correct or disputable |
| 3 | ICD-10 emergency diagnosis table (§9.1) — needs to be a configurable database table, not hardcoded | Payer definitions of "emergency" vary; must be updatable without code deploy |
| 4 | Payer-specific appeal window table (§8.3) — must be configurable per payer contract, not hardcoded | Changes with each contract renewal |
| 5 | Work threshold configuration — facility-level and payer-level thresholds for instance creation suppression | Default $100 should be overridable per payer or facility |
| 6 | 277-CA acknowledgment record linkage — system must store 277-CA data and link to claim records for timely filing defense | If 277-CA data is not ingested and stored, timely filing auto-draft cannot be triggered |
| 7 | MOA segment parsing for Medicare outlier and DRG data — required for Medicare-specific DRG downgrade and outlier underpayment detection | Medicare 835s have different DRG data placement than commercial |
| 8 | Dollar threshold for high-value escalation (§7.3, §8.1) — must be configurable, currently defaulting to $50k/$250k | Revenue leadership should set these values |
| 9 | Multi-CARC conflict resolution (§5.1) — needs a defined precedence table beyond "largest dollar amount" for edge cases where top two CARCs have similar amounts | Engineering judgment call on tie-breaking |
| 10 | PDF extraction confidence scoring — extraction outputs need a confidence score per field; fields below threshold should trigger human review of that specific field, not the entire document | Avoids over-escalating on partially-extractable PDFs |
