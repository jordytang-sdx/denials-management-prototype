# Signal Routing Rules — Underpayments, Medical Necessity Denials, and DRG Downgrade Denials
## Engineering Specification

**Status:** Draft  
**Date:** April 2026  
**Scope:** Focused ruleset for three case types: Underpayments, Medical Necessity Denials, DRG Downgrade Denials  
**Companion doc:** `signal-routing-rules.md` (general pipeline — ingestion, matching, suppression, and other case types)  
**Assumption:** Matching has already resolved. This document begins at the classification decision and covers everything downstream.

---

## Overview

These three case types account for the majority of revenue at stake and require the most nuanced routing logic. They share a common 835 origin but diverge immediately after classification:

| Case Type | 835 trigger | Payment at classification | Primary stakeholder | Appeal mechanism |
|---|---|---|---|---|
| **Medical Necessity Denial** | CLP02=4 (full denial) with CARC-50/167/151/B8/58 | $0 | Clinical reviewer / Physician advisor | Appeal letter + P2P + IRO |
| **DRG Downgrade** | CLP02≠4, paid DRG ≠ billed DRG | Partial (wrong DRG weight) | CDI specialist / Coding compliance | Coding appeal + CDI attestation |
| **Underpayment** | CLP02∈{1,2,3}, paid < contracted rate | Partial (below contract) | Contract management / Business office | Demand letter + contract citation |

The single most common misclassification risk is between these three types. A claim can simultaneously trigger all three (e.g. a payer pays at a downgraded DRG that is also below contracted rate AND denies certain diagnoses on medical necessity grounds). See §6 for compound case handling.

---

## Part 1 — Medical Necessity Denials

### 1.1 Classification Triggers

A medical necessity denial exists when:

```
CLP02 = '4'  (full denial — $0 payment)
AND
primary CARC ∈ { '50', '167', '151', 'B8', '58', '96', '49', '119', 'B7' }
AND
CAS group code = 'CO'  (contractual obligation — payer-side decision)
```

Distinguish from prior auth denial at classification time:
- **CARC-50/167/151** = payer *reviewed* the clinical content and decided services were not medically necessary. This is a medical necessity denial. An appeal must contest the clinical decision.
- **CARC-197/198** = payer never reviewed clinical content — auth was not obtained or was insufficient. This is an authorization denial. Do NOT classify as medical necessity even if the underlying issue is clinical.

If both CARC-50 and CARC-197 are present on the same claim, the primary classification follows the largest adjustment dollar amount. Flag the secondary CARC for the reviewer — the payer may be denying on both grounds simultaneously, which changes the appeal strategy.

**Med nec denial with non-zero payment:**  
If CLP02 ≠ `4` but CARC-50/167 is present on a SVC (service line) segment, the payer denied specific service lines while paying others. This is a **partial medical necessity denial** — classify as Medical Necessity, set `denied_amount` to the sum of denied SVC line amounts, and flag that partial service lines were paid.

---

### 1.2 Subtype Classification

| CARC | Subtype | Meaning | Clinical question at stake |
|---|---|---|---|
| `50` | Standard Medical Necessity | Payer determined services were not medically necessary | Were the services appropriate for the patient's condition per clinical criteria? |
| `167` | Level of Care | Services were medically necessary but at a lower level (e.g. observation instead of inpatient) | Did the patient meet inpatient-level InterQual/MCG criteria? |
| `151` | Level of Service | Services provided but at a lower complexity than billed (e.g. 99285 → 99283) | Does the documentation support the complexity level billed? |
| `58` | Place of Service | Services were rendered in an inappropriate setting | Was this setting clinically required, or could the patient have been treated in a lower-acuity setting? |
| `B8` | Alternative Treatment | Payer asserts an alternative, less-expensive treatment was available | Was the treatment chosen clinically superior or necessary over the alternative? |
| `96`/`49` | Non-covered benefit | Services fall outside covered benefit | Is this truly a benefit exclusion, or a clinical necessity argument? |
| `119` | Benefit maximum reached | Patient's benefit limit exhausted | Is the benefit accumulator accurate? Was a prior claim counted correctly? |

---

### 1.3 Payer Type Branch — Medicare FFS vs. Commercial vs. Medicare Advantage

The payer type determines the entire appeal pathway. Identify at classification time.

**Payer type detection from 835:**
- `NM1` segment, loop 1000A, NM109 (payer ID) — compare against payer ID table
- Medicare FFS payers: CMS (payer ID 1100 / 2010), Palmetto GBA, NGS, Noridian, CGS, WPS, First Coast, Novitas, JH MAC IDs
- Medicare Advantage: payer name contains "Advantage", "MA-PD", "MAPD", or is a known MA plan (UHC AARP, Humana Gold Plus, Aetna Better Health MA, etc.)
- Commercial: all others

---

### 1.4 Medical Necessity — Commercial Appeal Pathway

```
835 denial received (CARC-50/167/151)
    │
    ▼
Auto-create instance → Clinical Review queue
    │
    ▼
Auto-draft Level 1 appeal letter (see §1.6 for content rules)
    │
    ▼
Human review → approve / modify draft → submit L1
    │
    ├─ L1 overturned → transition to Won
    │
    └─ L1 upheld
           │
           ▼
       File Level 2 / External Review (IRO)
           │
           ├─ IRO overturned → Won
           │
           └─ IRO upheld → Closed (Payer Upheld)
                OR
           Finance determines ROI does not support → Closed (Will Not Pursue)
```

**Commercial appeal windows by payer:**

| Payer | L1 deadline | L2 / IRO deadline | Notes |
|---|---|---|---|
| BCBS (most markets) | 180 days from denial date | 60 days from L1 upheld decision | State-specific variation — verify EOC |
| UnitedHealthcare | 180 days from EOB date | 60 days from L1 decision | |
| Aetna | 180 days from EOB date | 60 days from L1 decision | |
| Cigna | 180 days from denial date | 60 days from L1 decision | |
| Humana (commercial) | 180 days from EOB date | 60 days from L1 decision | |
| Medicaid (SC) | 90 days from denial date | 30 days from L1 decision | |
| **Default (unlisted)** | 60 days — flag for verification | 30 days from L1 — flag | |

**Peer-to-peer (P2P) — commercial:**  
P2P is available for most commercial med nec denials and is typically offered before or alongside L1. It is not an appeal round — it is a clinical conversation. Route to physician advisor when:
- Denial involves inpatient LOC (CARC-167) — P2P is high-yield for LOC disputes
- Dollar amount > $10,000
- Payer denial letter cites specific clinical criteria that were not met — physician can address point-by-point

When to NOT pursue P2P:
- Payer denied based on benefit language (CARC-49/96/119) — no clinical argument available
- Case is already at L2/IRO — P2P window has closed

---

### 1.5 Medical Necessity — Medicare FFS Appeal Pathway

Medicare has a 5-level administrative appeal pathway. The system must track which level is active and calculate deadlines accordingly.

```
835 denial / ADR → DRG downgrade / med nec denial
    │
    ▼
Level 1 — MAC Redetermination
    Deadline: 120 days from date on MAC determination notice
    MAC has 60 days to decide
    │
    ├─ Overturned → Won
    │
    └─ Upheld
           │
           ▼
       Level 2 — QIC Reconsideration (Qualified Independent Contractor)
           Deadline: 180 days from date of redetermination decision
           QIC has 60 days to decide; if not decided in 60 days → escalate to Level 3
           │
           ├─ Overturned → Won
           │
           └─ Upheld
                  │
                  ▼
              Level 3 — OMHA ALJ Hearing
                  Deadline: 60 days from QIC decision
                  Amount in controversy must be ≥ $180 (2026 threshold; update annually)
                  OMHA has 90 days to schedule hearing
                  │
                  ├─ Overturned → Won
                  │
                  └─ Upheld
                         │
                         ▼
                     Level 4 — Medicare Appeals Council (DAB/MAC)
                         Deadline: 60 days from ALJ decision
                         │
                         ├─ Overturned → Won
                         │
                         └─ Upheld
                                │
                                ▼
                            Level 5 — Federal District Court
                                Amount in controversy must be ≥ $1,850 (2026 threshold)
                                Out of scope for system — route to legal
```

**System responsibilities for Medicare appeals:**
- Track which level is active as the `appeal_round.round_type`
- Calculate each deadline from the prior decision date (not from DOS)
- Alert when < 20 days remain on any active deadline
- Do NOT auto-calculate Level 3+ deadlines — require human confirmation of prior decision date

**Medicare-specific med nec subtypes:**

| Denial type | Typical CARC on Medicare 835 | Notes |
|---|---|---|
| Inpatient med nec (two-midnight rule) | `50`, sometimes `167` | Two-midnight rule: inpatient admission appropriate if physician expects patient to require 2+ midnight hospital stays. Documentation of physician order and expectation is critical. |
| Observation vs. inpatient | `167` | Patient placed in observation status rather than inpatient. Often requires clinical documentation that severity justified inpatient order, not observation. |
| Outpatient procedure med nec | `50`, `96` | Service on the Outpatient Prospective Payment System (OPPS) denied as not medically necessary. Different appeal path than inpatient. |
| Post-payment review (TPE/RAC) | `50` on revised 835 | Triggered by audit program. See §1.5 ADR note below. |

**Medicare TPE / RAC distinction:**  
If the med nec denial arrives following an ADR (Additional Development Request) that was classified as `adr_program = 'TPE'` or `'RAC'`:
- Do NOT route through standard appeal queue
- Route to Compliance queue first for program-level impact assessment
- TPE has an education component before the appeal — provider may have a Corrective Action Plan (CAP) period before formal appeal is required
- RAC denials carry a 3-year lookback — compliance must assess whether other claims are at risk

---

### 1.6 Medical Necessity — Auto-Draft Content Rules

The auto-draft appeal letter for medical necessity denials must be populated with the following data, pulled from the clinical record and claim:

**Required pre-population for every med nec appeal draft:**

| Element | Source | Notes |
|---|---|---|
| Patient name, MRN, DOB | Medical record | |
| Claim ID / HAR | Claim record | |
| Date of service | Claim record | |
| Payer / plan name | Claim record | |
| Denial date | 835 or PDF denial letter | |
| Appeal deadline | Calculated per §1.4 / §1.5 | Include in letter header |
| Principal diagnosis (ICD-10 + description) | Medical record | |
| All secondary diagnoses relevant to the denial | Medical record | Pull comorbidities that affect severity |
| Principal procedure (CPT + description) | Medical record | |
| Attending physician name and NPI | Medical record | |
| Admit date / discharge date | Medical record | |
| Admit type (inpatient / observation / outpatient) | Claim record | |
| Clinical summary narrative | Medical record `clinicalSummary` field | |
| Key clinical facts | Medical record `keyFacts` array | Bullet these directly into the letter |
| Denied amount | 835 CLP03 − CLP04 | |

**Subtype-specific content to add:**

*For CARC-167 (Level of Care — observation vs. inpatient):*
- Admission severity indicators: vital signs on admission (BP, HR, temp, O2 sat), admission labs (WBC, creatinine, lactate, troponin, BNP — whichever are present), ABG if respiratory
- Physician order for inpatient admission — date and time of order
- InterQual or MCG criteria language that was met — cite the specific criteria set version (year + edition)
- Length of stay: actual vs. what observation would have permitted
- Comorbidities that complicate management and require inpatient-level monitoring
- Documentation that outpatient treatment was not clinically appropriate

*For CARC-50 (Standard Medical Necessity):*
- Conservative management failure history (prior treatments, their duration, and why they were insufficient)
- Clinical indicators supporting necessity: specific lab values, imaging findings, functional scores
- Risk of harm if service was not performed
- Reference to applicable clinical guidelines (AHA, ACS, ACOG, etc. as appropriate to diagnosis)

*For CARC-151 (Level of Service — E&M downcoding):*
- AMA 2021 MDM framework elements met: number/complexity of problems, data reviewed, risk
- Specific MDM element documentation: ordered tests, reviewed results, independent interpretations
- Time-based billing alternative if applicable (document total encounter time)

*For CARC-58 (Place of Service):*
- Clinical justification for the setting chosen (why inpatient rather than outpatient, why OR rather than procedure room)
- Documentation of failed or inappropriate lower-acuity setting options
- Clinical requirements that necessitated the specific setting (IV access, monitoring, anesthesia)

**What the draft letter must NOT include:**
- Statements that the payer "made an error" — frame as clinical disagreement, not payer error
- PHI beyond what is necessary to make the clinical argument
- Unverified clinical claims — only include data points that appear in the medical record
- Promises about outcomes or future care

---

### 1.7 Medical Necessity — Routing and Assignment

| Condition | Queue | Priority |
|---|---|---|
| CARC-50 or CARC-167, inpatient, any payer | Clinical Review | Standard |
| CARC-167 (obs vs. IP), dollar amount > $10k | Clinical Review + Physician Advisor flagged | High |
| CARC-50, Medicare FFS | Clinical Review + HIM | Standard |
| CARC-50, ADR-preceded (TPE or RAC) | Compliance | Critical |
| CARC-151, outpatient E&M | Coding Compliance | Standard |
| CARC-58, place of service | Clinical Review | Standard |
| CARC-96/49, benefit question | Business Office (benefit review first) | Standard |
| CARC-119, benefit max | Business Office (accumulator verification) | Standard |
| Any med nec, dollar amount > $50k | Senior Clinical Reviewer | High |
| P2P request PDF received | Physician Advisor | Urgent — P2P has scheduling deadline |

---

## Part 2 — DRG Downgrade Denials

### 2.1 Classification Triggers

A DRG downgrade exists when:

```
CLP02 ∈ {'1', '2', '3', '19'}  (claim was paid)
AND
paid_amount > 0
AND
drg_paid ≠ drg_billed  (payer assigned a different DRG)
AND
drg_paid_weight < drg_billed_weight  (the paid DRG has lower relative weight)
```

This is distinct from a medical necessity denial (which produces $0 payment) and from a contract variance underpayment (where the same DRG was paid but at the wrong rate).

**DRG data location in the 835 — payer-dependent:**

The 835 does not have a universal standard field for "DRG paid." Location varies by payer:

| Payer type | DRG paid field location in 835 |
|---|---|
| Medicare FFS | MOA segment (Loop 2100 MOA01 or MOA08) — contains DRG and outlier data |
| Medicare Advantage | Varies — may be in MOA segment, NTE free-text, or absent. If absent, compare paid amount to expected DRG rate to infer downgrade. |
| Commercial (most) | NTE segment (Loop 2100 NTE) as free text, OR SVC-level REF segment with qualifier DRG |
| BCBS (many markets) | PLB segment or NTE segment |

If DRG paid cannot be extracted from the 835, apply the following inference logic:

```
paid_amount / contracted_base_rate = implied_weight
if implied_weight < billed_drg_weight * 0.90 → probable DRG downgrade
→ classify provisionally as DRG Downgrade, set needs_confirmation = true
→ route to CDI for manual DRG verification before draft
```

---

### 2.2 DRG Downgrade Subtype Classification

| Downgrade pattern | Subtype | Root cause | Example |
|---|---|---|---|
| Billed DRG with MCC → Paid DRG without MCC | MCC removal | Payer rejected a Major Complication/Comorbidity | Billed MS-DRG 291 (Heart Failure w/ MCC); paid MS-DRG 293 (w/o CC or MCC) |
| Billed DRG with CC → Paid DRG without CC/MCC | CC removal | Payer rejected a Complication/Comorbidity | Billed MS-DRG 470 (Major Joint w/ CC); paid MS-DRG 483 (w/o CC/MCC) |
| Billed DRG in higher MDC pair → Paid in lower MDC pair | Principal Dx rejected | Payer resequenced principal diagnosis | Billed sepsis (MDC 18); paid pneumonia (MDC 4) — lower weight |
| Billed DRG with procedure → Paid DRG without procedure | Procedure denied | Payer did not recognize billed procedure as supporting the DRG | Billed DRG with fusion; paid DRG without fusion |
| Billed DRG one tier → Paid DRG adjacent lower tier | Weight-only downgrade | No specific code rejected; payer applied different grouper version | Billed MS-DRG 392 (w/ CC); paid MS-DRG 390 (w/o CC) |

Each subtype requires a different clinical argument in the appeal. The system must attempt to determine subtype at classification time from available 835 data, and confirm with CDI before drafting.

---

### 2.3 MCC/CC Removal — Detection and Argument Construction

This is the most common DRG downgrade subtype. The system must:

**Step 1 — Identify the dropped code:**  
Compare the billed DRG's expected CC/MCC list against the diagnoses on the claim:
- The billed DRG pair (e.g. 291/292/293) implies a specific base MDC and procedure category
- The CC/MCC that upgrades from lower to higher DRG is determinable from the DRG grouper logic
- Example: MS-DRGs 291/292/293 all represent Heart Failure. 291=MCC, 292=CC, 293=no CC/MCC. If billed 291 and paid 292 → the MCC was dropped. The MCC for this group can only be certain codes (e.g. acute respiratory failure J96.0x, acute MI I21.x, etc.)

**Step 2 — Verify MCC/CC is documented in the medical record:**  
Query the medical record `diagnoses` array for the dropped MCC/CC code. If present and marked as `secondary` type:
- Confirm the code appears in the attending notes, nursing documentation, or specialist consult
- Flag the specific note that documents the condition for inclusion in the appeal

**Step 3 — Pre-populate draft with:**
- Billed DRG and its MS-DRG weight
- Paid DRG and its MS-DRG weight  
- Dollar variance calculation: `(billed_weight − paid_weight) × contracted_base_rate`
- The specific secondary diagnosis code that was rejected (the MCC/CC)
- Medical record documentation supporting that code
- ICD-10-CM Official Coding Guideline citation supporting correct sequencing
- AHA Coding Clinic reference if applicable to the specific code pair

**MCC/CC coding guidance citations to auto-include by code type:**

| Dropped code type | Guideline to cite |
|---|---|
| Acute respiratory failure (J96.0x) | ICD-10-CM §I.C.10.b — when respiratory failure meets the definition, it is a valid complication |
| Acute kidney injury (N17.x) | KDIGO criteria: creatinine rise ≥ 1.5× baseline within 7 days, or ≥ 0.3 mg/dL within 48h, or UO < 0.5 mL/kg/h for 6h |
| Sepsis (A40-A41) | Sepsis-3 criteria: suspected infection + ≥ 2 SOFA score points |
| Acute-on-chronic conditions | ICD-10-CM §I.C.14 — when both acute and chronic components exist, code the acute manifestation first |
| Malnutrition | AHA Coding Clinic 2Q 2020 — malnutrition requires physician documentation of specific criteria |
| Encephalopathy | AHA Coding Clinic — requires physician documentation linking encephalopathy to a specific etiology |

---

### 2.4 Principal Diagnosis Resequencing — Detection and Argument

If the payer's paid DRG maps to a different principal diagnosis than what was billed, the payer effectively resequenced the principal diagnosis.

**Detection from 835:**  
If `drg_paid` maps to a different MDC than `drg_billed`, the principal diagnosis was likely changed. Flag this for CDI — the 835 alone cannot confirm which specific code was resequenced; the denial letter (if received) will specify.

**Argument construction:**  
ICD-10-CM official coding guidelines for principal diagnosis selection:

- **§II.A** — The principal diagnosis is the condition established after study to be chiefly responsible for the admission. This is a physician judgment, documented in the record.
- **§II.B** — When two or more interrelated conditions potentially meet the criteria, either may be sequenced first.
- **§II.C** — When the admission is for a complication of prior treatment, the complication is the principal diagnosis.
- **§II.H** — Original treatment plan not carried out: sequence the condition established at admission as principal Dx even if treatment was not completed.

The auto-draft must cite the specific guideline section that supports the billed sequencing. CDI must confirm the sequencing rationale before the draft is approved.

---

### 2.5 DRG Downgrade — Payer Type Branch

**Commercial:**  
Commercial payer DRG downgrades are treated as underpayments, not formal denials. The payer paid — just at the wrong DRG. The dispute is a **demand letter** (not an appeal letter) citing the contractual right to be paid at the correct DRG rate.

The key difference from medical necessity: there is no clinical criteria argument to make. The argument is: "The medical record supports the billed DRG code set. The correct MS-DRG grouper output for these codes is DRG X. You paid at DRG Y. The difference is $Z per our contracted rate."

Routing: Contract Management queue + CDI for coding attestation.

**Medicare FFS:**  
Medicare DRG downgrades are treated as formal denials because CMS is making a coding determination. The dispute pathway is the Medicare appeal ladder (Redetermination → QIC → ALJ → MAC → Federal Court).

For Medicare, the appeal letter must:
- Cite CMS ICD-10-CM/PCS Official Guidelines (published annually — verify the version year matches the DOS)
- Include a CDI attestation that the record supports the billed coding
- Reference the MS-DRG grouper version in effect on the DOS
- Include the specific CMS Coding Clinic guidance if the disputed code has published guidance

Routing: CDI queue + HIM. Medicare DRG appeal requires physician involvement.

**Medicare Advantage:**  
Treated as commercial for dispute purposes (demand letter pathway), but the appeal window follows MA plan rules (60 days, not 180 days). MA plans use Medicare DRG grouper logic but are not bound by Medicare FFS coverage determinations.

---

### 2.6 DRG Downgrade — Auto-Draft Content Rules

**Standard fields for every DRG downgrade draft:**

| Element | Source |
|---|---|
| Patient name, MRN, DOB, HAR | Claim / medical record |
| Claim ID, DOS, payer, plan type | Claim record |
| Billed DRG, DRG description, relative weight | Claim record + DRG weight table |
| Paid DRG, DRG description, relative weight | 835 |
| Contracted base rate | Contract fee schedule |
| Dollar variance: `(billed_weight − paid_weight) × base_rate` | Calculated |
| Principal diagnosis code + description + type | Medical record |
| All secondary diagnoses + their CC/MCC status | Medical record + DRG grouper reference |
| Principal procedure code (if applicable to DRG) | Medical record |
| Attending physician name + NPI | Medical record |
| CDI attestation placeholder | Inserted when CDI completes attestation |
| Coding guideline citation | Auto-selected per §2.3 or §2.4 |

**Quality gate before draft surfaces:**  
Do not surface DRG downgrade draft until CDI attestation is complete. The draft can be generated and held, but it must not enter the approval queue without a CDI signature. Flag the instance: "Draft ready — awaiting CDI attestation."

---

### 2.7 DRG Downgrade — Routing and Assignment

| Condition | Queue | Priority |
|---|---|---|
| Any DRG downgrade, commercial | Contract Management + CDI | Standard |
| Any DRG downgrade, Medicare FFS | CDI + HIM | High |
| Any DRG downgrade, Medicare Advantage | Contract Management + CDI | Standard |
| DRG downgrade + concurrent med nec denial | CDI + Clinical Review (compound case) | High — see §6.1 |
| DRG downgrade following ADR | CDI + HIM (ADR response link) | High |
| DRG downgrade, dollar amount > $20k | Senior CDI reviewer | High |
| Multiple DRG downgrades for same DRG across claims (≥ 3 in 60 days) | Manager review — potential payer pattern | High |

---

## Part 3 — Underpayments

### 3.1 Classification Triggers

An underpayment exists when:

```
CLP02 ∈ {'1', '2', '3', '19', '20', '21'}  (claim was paid in some capacity)
AND
paid_amount > 0
AND
paid_amount < expected_contract_amount
AND
(expected_contract_amount − paid_amount) > work_threshold  (default: max($100, 5% of expected))
```

`expected_contract_amount` must be resolved from the contract fee schedule before an underpayment instance is created. If the contract rate cannot be resolved, the instance is flagged for manual contract analysis — not auto-created as an underpayment.

**Separating contractual adjustments from underpayments:**  
CO-45 (contractual adjustment) is expected on almost every 835 — it represents the discount from billed charges down to the contracted rate. This is NOT an underpayment.

The underpayment check is:
```
expected_contract_amount = lookup(payer_id, plan_type, dos, drg or cpt)
if paid_amount < expected_contract_amount → underpayment (regardless of CO-45 presence)
```

Never compare `paid_amount` to `billed_amount` for underpayment detection. Always compare to `expected_contract_amount`.

---

### 3.2 Underpayment Subtype Decision Tree

Run this decision tree in order for every paid claim that triggers the underpayment threshold:

```
Step 1 — Is the billed DRG different from the paid DRG?
│
├─ YES → This is a DRG Downgrade (see Part 2).
│         Also check: is there a separate contract rate variance? (see Step 2)
│
└─ NO → proceed to Step 2

Step 2 — Does the paid DRG rate match the contracted base rate × DRG weight?
│
├─ NO (rate mismatch) → Contract Variance subtype
│     │
│     ├─ Wrong fee schedule year applied? → "Incorrect Fee Schedule Applied"
│     ├─ Wrong contract tier / plan type applied? → "Incorrect Contract Payment Rate"
│     └─ Correct rate but wrong weight? → "DRG Base Rate or Weight Error"
│
└─ YES (rate is correct) → proceed to Step 3

Step 3 — Does the claim have high-cost outlier characteristics?
(total_charges > outlier_threshold AND outlier_payment_due > 0 per contract terms)
│
├─ YES → Check outlier calculation (see §3.4)
│         If outlier underpaid → "Outlier Payment Calculation Error"
│
└─ NO → proceed to Step 4

Step 4 — Does the claim have stop loss characteristics?
(allowed_amount > stop_loss_threshold per contract)
│
├─ YES → Check stop loss calculation (see §3.5)
│         If stop loss underpaid → "Stop Loss Threshold Error"
│
└─ NO → proceed to Step 5

Step 5 — Does the claim have implantable device charges?
(revenue codes 272–278 present, or device HCPCS on claim)
│
├─ YES → Check device carveout (see §3.6)
│         If device not separately reimbursed per contract → "Implant / Device Carveout Variance"
│
└─ NO → proceed to Step 6

Step 6 — Were specific service lines reduced or bundled unexpectedly?
│
├─ Bundling (CARC-97 on SVC line) → "Bundling Error" (Payer Processing)
├─ Unit count reduced → "Incorrect Processing of Billed Units" (Payer Processing)
├─ Procedure downcoded silently → "Payer Downcoding" (Payer Processing)
├─ Multiple procedure reduction over-applied → "Multiple Procedure Reduction Error" (Payer Processing)
│
└─ NO specific SVC-level issue → proceed to Step 7

Step 7 — Is this a secondary payer claim (COB)?
(CLP02 ∈ {'2', '3', '20', '21'})
│
├─ YES → Check COB obligation (see §3.7) → "Coordination of Benefits Issue"
│
└─ NO → proceed to Step 8

Step 8 — Was a timely filing penalty applied to a partial payment?
(CARC-29 present with non-zero payment)
│
├─ YES → Query 277-CA acknowledgment → "Administrative / Timely Filing Issue"
│
└─ NO → No identifiable subtype → route to Contract Management for manual analysis
```

---

### 3.3 Contract Variance — Subtype Detection

#### 3.3.1 Incorrect Fee Schedule Applied

**Detection:**
```
expected_rate = contract_rate_table.lookup(payer_id, plan_type, dos, drg_or_cpt)
paid_rate = paid_amount / drg_weight  (for DRG-based; or paid_per_unit for fee schedule)

if paid_rate matches a prior-year rate for the same payer/plan → "Incorrect Fee Schedule Applied"
if paid_rate matches a different plan type for the same payer → "Incorrect Contract Payment Rate"
```

**Demand letter content:**
- Contract effective date and the specific amendment establishing the current rates
- Comparison table: billed DRG/CPT → contracted rate per current schedule → paid rate → variance
- Contract section citation (e.g. "§3.1 Fee Schedule, effective January 1, 2025")
- Request for retroactive payment of the variance

**Auto-draft trigger:** Yes, if `expected_rate` is resolvable and `paid_rate` matches a known prior-year rate in the system.

#### 3.3.2 DRG Base Rate or Weight Error

**Detection:**
```
billed_drg_weight = drg_weight_table.lookup(billed_drg, dos_year)
paid_drg_weight = paid_amount / contracted_base_rate

if billed_drg == paid_drg  (same DRG code)
AND abs(paid_drg_weight - billed_drg_weight) > 0.01 → weight error
```

This is distinct from a DRG downgrade (where the DRG code changes). Here, the code is the same but the weight applied was wrong — either the payer used the wrong grouper year's weight table or made an arithmetic error.

**Demand letter content:**
- CMS DRG weight table reference for the applicable fiscal year (update annually)
- Correct weight vs. applied weight
- Base rate × weight differential = dollar variance

#### 3.3.3 Incorrect Contract Payment Rate (Wrong Plan Type)

**Detection:**
Common pattern: payer has multiple contracts with a facility (HMO rate, PPO rate, MA rate). The claim is billed under the PPO plan but the payer adjudicates at the HMO rate.

```
if paid_rate matches a different plan_type rate for the same payer
→ "Incorrect Contract Payment Rate"
```

The member's plan type is in the 835 NM1 loop (subscriber information) and should be compared against the contract rate table.

---

### 3.4 Outlier Payment Calculation Error

**When does a claim qualify for outlier payment:**
- Medicare: when total charges exceed the Outlier Threshold = DRG payment + Fixed Loss Amount (published annually by CMS in the IPPS Final Rule). The Outlier Payment = (Total Charges × CCR) − Outlier Threshold) × 80%.
- Commercial: defined per contract. Most commercial contracts mirror Medicare outlier methodology with a facility-specific CCR. Contract must specify: (1) outlier threshold formula, (2) CCR used, and (3) marginal cost factor.

**Detection from 835:**
- Total charges (`CLP03` or billed amount from claim): if > outlier threshold → check for outlier payment
- For Medicare FFS: MOA segment contains outlier payment data. Compare MOA to independent calculation.
- For commercial: compare `paid_amount` to `expected_drg_payment + expected_outlier_payment`.

**CCR validation:**
```
payer_ccr = extract from 835 (NTE segment or MOA) or from remittance narrative
contracted_ccr = contract_fee_schedule.lookup(payer_id, facility_id, dos_year, 'ccr')

if abs(payer_ccr - contracted_ccr) > 0.02 → CCR error → "Outlier Payment Calculation Error"
```

**Recalculation for demand letter:**
```
correct_outlier_payment = max(0, (total_charges × contracted_ccr) − outlier_threshold) × 0.80
paid_outlier_payment = extract from 835
variance = correct_outlier_payment − paid_outlier_payment
```

**Demand letter content:**
- Total charges from claim
- Outlier threshold calculation showing the claim qualifies
- Correct CCR per contract (cite contract section and amendment date)
- CCR applied by payer (from remittance)
- Recalculated outlier payment
- Dollar variance
- Request for recalculation and supplemental payment

---

### 3.5 Stop Loss Threshold Error

**When does stop loss apply:**
Stop loss provisions protect providers from catastrophic cases. They are defined in the contract, not by CMS. Two common structures:

- **Per-case stop loss:** When total allowed charges exceed a threshold (e.g. $25,000), the payer reimburses a higher percentage (e.g. 80%) of allowed charges above the threshold.
- **Per-diem stop loss:** When LOS exceeds a threshold (e.g. 10 days), per-diem rate increases for excess days.

**Detection:**
```
allowed_amount = paid_amount + contractual_adjustment (CO-45)
if allowed_amount > stop_loss_threshold (from contract) → check stop loss calculation

common error: payer uses billed_charges instead of allowed_amount as the denominator
billed_charges = CLP03
allowed_amount = expected_contract_amount

if payer_stop_loss_base == CLP03 AND contract_requires == allowed_amount
→ "Stop Loss Threshold Error"
```

**Demand letter content:**
- Allowed amount calculation vs. payer's denominator used
- Contract section establishing the stop loss threshold and the correct denominator
- Recalculated stop loss reimbursement
- Dollar variance

**Auto-draft trigger:** Yes, if stop loss provision is in the contract data and allowed amount exceeds threshold. Requires human confirmation of the specific stop loss calculation before submission.

---

### 3.6 Implant / Device Carveout Variance

**When does carveout apply:**
Contracts with device carveout provisions specify that implantable devices with invoice cost above a threshold (e.g. $5,000) are reimbursed separately at invoice cost plus a markup (e.g. +10%), independent of the DRG payment.

**Detection from 835:**
```
claim_has_device = any(service_line.revenue_code in range(272, 279))
                   OR any(service_line.hcpcs in device_code_list)

if claim_has_device AND contract_has_device_carveout:
    device_charge = sum(service_lines where revenue_code in range(272, 279))
    if device_charge > carveout_threshold
    AND no separate device payment on 835
    → "Implant / Device Carveout Variance"
```

**Data dependency:** This check requires:
1. Device revenue codes (272–278) or specific HCPCS codes from the claim's service lines
2. Contract carveout provision (threshold + markup percentage)
3. Device invoice cost — this is NOT on the 835. The system must flag for manual retrieval of the invoice from supply chain / chargemaster before the draft can be completed.

**Auto-draft trigger:** Conditional. Create the instance and begin the draft, but block the draft from approval queue until the device invoice is attached to the instance. Insert placeholder: "[DEVICE INVOICE REQUIRED — attach before submission]."

**Demand letter content:**
- Device description (from HCPCS code or revenue code description)
- Device invoice cost (requires manual attachment)
- Contract carveout threshold and applicable section
- Expected carveout reimbursement: `invoice_cost × (1 + markup_pct)`
- Evidence that payer bundled device into DRG payment (from 835)

---

### 3.7 Payer Processing Errors

#### 3.7.1 Bundling Error (CARC-97 — service line level)

When CARC-97 appears on a SVC line, the payer bundled that service line into the payment for another service.

**NCCI edit check (required before auto-draft):**
1. Extract the two code pair: bundled code (SVC line with CARC-97) + primary code (SVC line that was paid)
2. Look up NCCI edit table for code pair on the DOS
3. If edit does not exist → payer bundled incorrectly. Auto-draft unbundling demand.
4. If edit exists with modifier indicator `1` (modifier can override) → check whether appropriate modifier (-59/-XS/-XP/-XU/-XE) was on the claim. If yes → auto-draft modifier defense.
5. If edit exists with modifier indicator `0` (absolute bundling) → **do not draft**. Bundling was correct. Suppress instance.

#### 3.7.2 Incorrect Processing of Billed Units (J-codes / drug codes)

**Detection:**
```
billed_units = SVC03 (service line billed quantity)
paid_units = implied from SVC04 / (contracted_unit_rate)
if paid_units < billed_units → "Incorrect Processing of Billed Units"
```

**Common in:** J-code drug administration billing (e.g. J0696 ceftriaxone per 500 mg). Units are directly tied to dose administered.

**Demand letter content:**
- Billed units and clinical justification (dose administered per MAR)
- Paid units and implied calculation from payer's payment
- Reference to medication administration record (MAR) — must be attached
- Request for corrected processing

**Auto-draft trigger:** Yes, if `billed_units` and `paid_units` are clearly derivable from the 835.

#### 3.7.3 Multiple Procedure Reduction Error

**Background:** CMS and most commercial payers apply a multiple procedure payment reduction (MPPR) to surgical/procedural claims. Typically: 100% for the primary procedure, 50% for the second procedure, 25%+ for the third and beyond. Contract may specify different reductions.

**Detection:**
```
for each SVC line on claim (sorted by billed_amount descending):
  expected_rate = contracted_procedure_rate × applicable_reduction_pct(rank)
  if SVC04 (paid per line) < expected_rate → "Multiple Procedure Reduction Error"

common error: payer applies 50% to third and fourth procedures when contract specifies 50% for 2nd only
```

**Demand letter content:**
- Table of each procedure billed, its rank, contracted rate, correct reduction, applied reduction, and variance per line
- Contract section specifying the MPPR policy
- Total variance across all incorrectly reduced lines

#### 3.7.4 Payer Downcoding

**Detection:**
```
billed_cpt = service_line.procedure_code
paid_cpt = infer from paid_amount / contracted_rate_for_billed_cpt
  OR extract from 835 NTE/SVC remark if payer includes paid code

if paid_cpt != billed_cpt AND paid_cpt < billed_cpt (by complexity level)
AND no CARC indicating a formal denial → "Payer Downcoding"
```

This is a silent reduction with no denial notice. Common in E&M code downcoding (99285 → 99284, or 99214 → 99213).

**Demand letter content:**
- Billed CPT code and complexity level
- Paid CPT (inferred from payment amount or stated in remittance)
- AMA 2021 MDM framework elements supporting the billed level (for E&M)
- Clinical documentation reference (history, exam, MDM)
- Dollar variance

**Auto-draft trigger:** Yes for E&M downcoding if `keyFacts` array contains MDM element documentation. For procedure downcoding, require CDI confirmation before auto-drafting.

---

### 3.8 COB Underpayment

**When to check for COB underpayment:**
```
CLP02 ∈ {'2', '3', '20', '21'}  (secondary or tertiary processing)
```

**Fill-the-gap vs. percentage methodology:**

Most COB secondary plans use one of two methods:
- **Fill the gap (most common):** Secondary pays the difference between primary payment and the contracted allowed amount, bringing patient responsibility to $0.
- **Percentage of billed:** Secondary pays a percentage of billed charges. This is legally prohibited for Medicare Supplement plans but may apply to commercial COB.

**Calculation:**
```
primary_paid = claim record (from prior 835 on same HAR, different payer)
contracted_allowed = expected_contract_amount for this payer
expected_secondary = contracted_allowed − primary_paid

if CLP04 (paid_amount) < expected_secondary
→ "Coordination of Benefits Issue"
variance = expected_secondary − CLP04
```

**Data dependency:** `primary_paid` must be on file (from a prior 835 processed for the same HAR from the primary payer). If the primary EOB is not in the system:
- Flag for manual COB analysis
- Do not auto-create underpayment instance
- Route to COB Coordinator with instruction: "Obtain primary EOB before COB calculation can proceed"

**Demand letter content:**
- Primary payer name and payment amount
- Primary EOB (must be attached)
- Contracted allowed amount for this facility/plan
- Expected secondary obligation
- Paid secondary amount
- Variance and basis for dispute

---

### 3.9 Timely Filing Penalty (Partial Payment)

**Distinguishing from timely filing denial:**
- **Full denial (CARC-29, CLP02=4):** Handled as a denial per the general routing rules.
- **Partial payment with timely filing penalty (CARC-29 on SVC line, CLP02≠4):** A payment was made but reduced by a penalty. This is an underpayment.

**Demand letter content:**
- 277-CA acknowledgment date and reference (must be present before drafting)
- Payer's filing window per contract
- Days elapsed between DOS and claim submission (from 277-CA date)
- Proof that submission was within the window
- Regulatory or contractual cite prohibiting the penalty when timely filing is demonstrated

---

### 3.10 Underpayment — Demand Letter Quality Gates

| Gate | Check | Blocked if |
|---|---|---|
| Contract rate resolvable | `expected_contract_amount` returned from lookup | Contract rate unavailable |
| Dollar variance confirmed | `variance_amount > work_threshold` | Zero or negative |
| Device invoice attached (if carveout) | `invoice_attached = true` | Invoice not uploaded |
| 277-CA present (if timely filing) | 277-CA record linked | 277-CA not in system |
| Primary EOB present (if COB) | Primary 835 on file for same HAR | Primary payment not recorded |
| CDI attestation (if DRG component) | CDI has confirmed coding | CDI attestation pending |
| No conflicting denial on same claim | No open full denial on same HAR | Resolve denial first |

---

### 3.11 Underpayment — Routing and Assignment

| Underpayment Subtype | Queue | Priority |
|---|---|---|
| Incorrect Fee Schedule / Rate | Contract Management | Standard |
| DRG Base Rate / Weight Error | Contract Management + CDI | Standard |
| Outlier Payment Calculation | Contract Management + Finance | High |
| Stop Loss Threshold Error | Contract Management + Finance | High |
| Device Carveout Variance | Contract Management + Supply Chain | Standard |
| Bundling Error | Contract Management + Coding Compliance | Standard |
| Unit Processing Error | Coding Compliance | Standard |
| Multiple Procedure Reduction | Contract Management | Standard |
| Payer Downcoding (E&M) | Coding Compliance | Standard |
| COB Underpayment | COB Coordinator | Standard |
| Timely Filing Penalty | Business Office | Standard |
| Dollar amount > $20k (any subtype) | Senior Analyst review | High |
| Dollar amount > $75k (any subtype) | Manager approval required before submission | High |

---

## Part 4 — Cross-Case Rules

### 4.1 Silent Downcode Detection

A silent downcode occurs when the payer pays at a lower code or DRG than billed without issuing a formal denial notice (no CARC-50/167, no denial letter). The only evidence is the payment variance.

**Detection trigger:**
```
CLP02 ∈ {'1', '2', '3'}  (paid)
AND no CARC in {50, 167, 151, 4, 97}  (no recognized reduction code)
AND paid_amount < expected_contract_amount
→ Flag as potential silent downcode
→ Set handoff_reason = 'silent_downcode'
→ Route to Contract Management for manual classification
```

Silent downcodes are not auto-classified into a subtype because the reason for the reduction is unknown. Human review is required before subtype assignment.

---

### 4.2 Compound Case — DRG Downgrade + Medical Necessity Denial

A payer may simultaneously:
1. Pay the claim at a lower DRG (coding dispute)
2. Deny certain service lines entirely (medical necessity denial)

**Detection:**
```
CLP02 ≠ '4'  (claim has non-zero payment)
AND drg_paid ≠ drg_billed  (DRG downgrade)
AND any SVC line has CAS with CARC-50 or CARC-167  (med nec denial at line level)
```

**Handling:**
- Create two linked instances: one DRG Downgrade and one Medical Necessity
- Set `relationship = compound_claim` bidirectionally
- Route DRG instance to CDI, med nec instance to Clinical Review
- Do NOT combine into a single draft letter — arguments are distinct and submissions should be separate
- Finance tracks total exposure as sum of both instances
- If both are resolved in the same payer response, link the resolution events

---

### 4.3 Compound Case — Contract Rate Variance Alongside DRG Downgrade

A claim is paid at both the wrong DRG (DRG downgrade) AND the wrong rate for that wrong DRG (fee schedule error). Two separate variance components.

**Handling:**
- Create one DRG Downgrade instance for the DRG coding dispute
- Create one Contract Variance underpayment instance for the rate error on top of the DRG issue
- The Contract Variance instance's `variance_amount` is calculated using the paid DRG weight and the correct vs. paid rate — it does not include the DRG weight differential (that belongs to the DRG Downgrade instance)
- Total recovery = DRG Downgrade variance + Contract Rate Variance

---

### 4.4 Underpayment That Originated From a Denied Claim

Some underpayments arrive as the payment following a successful appeal on a previously denied claim. The payer pays after the appeal, but pays less than the expected contracted amount.

**Detection:**
```
Instance in state 'Won' or 'Submitted'
AND new 835 arrives with CLP04 > 0 (payment made)
AND CLP04 < expected_contract_amount
→ Do not create new instance
→ Update existing instance: transition to 'Won' if not already
→ Create new Underpayment instance linked to the resolved denial via relationship = 'post_appeal_underpayment'
→ Flag: "Partial recovery — appeal won but payment below contracted rate"
```

---

### 4.5 ADR → DRG Downgrade Sequence

The most common Medicare sequence:

1. Claim submitted and paid at billed DRG
2. ADR received (PDF) — medical records requested for clinical review
3. Provider responds to ADR with medical records
4. Medicare issues revised 835 paying at a lower DRG (post-ADR downgrade)

**Routing rule:**
- ADR creates an ADR instance (`relationship = adr_followed` to the original paid claim)
- When revised 835 arrives post-ADR with lower DRG:
  - If ADR instance exists → attach revised 835 as episode result on the ADR instance
  - Create DRG Downgrade instance linked `escalated_from` the ADR instance
  - ADR instance status → `Closed` (documentation submitted, outcome known)
  - DRG Downgrade instance status → `Active` → enter appeal workflow

---

## Part 5 — Human Intervention Requirements

### 5.1 Cannot Auto-Process — Requires Human Before Any Action

| Condition | Case type affected | Required action |
|---|---|---|
| Contract rate not resolvable | Underpayment | Contract Management manual lookup before instance creation |
| Match confidence Medium or Low | All | Intake Supervisor confirms match before classification proceeds |
| DRG paid not extractable from 835 (format unknown) | DRG Downgrade | CDI manual DRG comparison before instance creation |
| Silent downcode (no CARC explaining reduction) | Underpayment | Contract Management manual classification |
| Multiple CARCs with conflicting category | All | Intake Supervisor assigns primary type |
| Auth obtained but CARC-197 present | Med Nec (escalated from auth) | Supervisor — immediate escalation |
| Primary EOB not on file (COB case) | Underpayment (COB) | COB Coordinator obtains primary EOB before proceeding |

### 5.2 Draft Generated but Held — Human Approves Before Queue Entry

| Condition | Hold reason |
|---|---|
| DRG Downgrade, any payer | CDI attestation required before draft surfaces |
| Device carveout variance | Device invoice must be attached |
| High-value case (>$50k) | Senior analyst review before standard queue |
| Very high-value case (>$250k) | Director approval required |
| Medicare FFS appeal at L2/ALJ+ | Legal review required |
| RAC/OIG audit-triggered instance | Compliance sign-off required |
| COB underpayment — primary EOB just obtained | Human confirms COB calculation before draft surfaces |

### 5.3 Pattern Escalation — Systemic Issues

These conditions suggest a payer-level systemic error rather than an individual claim error. Escalate to Manager rather than routing to standard queue.

| Pattern | Threshold | Action |
|---|---|---|
| Same DRG downgrade from same payer, multiple claims | ≥ 3 in 60 days | Manager review — potential payer programming error |
| Same CCR used on outlier claims below contracted CCR | ≥ 2 in 90 days | Contract Management + Finance — payer may need CCR correction |
| Same fee schedule year error across multiple claims | ≥ 2 in 30 days | Contract Management — payer setup issue |
| Same bundling error (same code pair) across multiple claims | ≥ 3 in 60 days | Manager — payer may have incorrect NCCI table loaded |
| Med nec denials from same payer for same DRG cluster | ≥ 5 in 30 days | Clinical Review Manager — payer may have issued a new LCD or coverage policy |

---

## Part 6 — Open Items

| # | Item | Impact |
|---|---|---|
| 1 | Contract fee schedule database — required for all underpayment auto-detection | Without it, all underpayments are manual |
| 2 | NCCI edit table ingestion and update cadence (updated quarterly by CMS) | Required for bundling error auto-classification |
| 3 | DRG weight table by fiscal year — must be updated annually each October when CMS publishes IPPS Final Rule | DRG downgrade variance calculation requires correct year's weights |
| 4 | MS-DRG grouper access — to verify what DRG results from a given code set | CDI attestation process requires this; without it, CDI works manually |
| 5 | CCR by facility/payer/year — required for outlier underpayment detection | Can be populated from prior year CMS cost reports and payer remittance history |
| 6 | Device invoice integration (or upload workflow) — device carveout demand letters require invoice cost | Must have a place to upload and attach invoice PDFs to instances |
| 7 | 277-CA linkage — timely filing defense requires 277-CA records to be stored and linked by claim ID | If clearinghouse data is not ingested, 277-CA must be manually uploaded |
| 8 | Payer-specific 835 DRG field mapping table — DRG paid field location varies by payer (MOA vs. NTE vs. SVC-level REF) | Required before DRG downgrade can be auto-detected from 835 |
| 9 | Medicare appeal deadline tracking — Level 2+ deadlines are calculated from the *prior decision date*, not from DOS. System must store and track each decision date independently. | Without this, Medicare appeal deadlines are miscalculated |
| 10 | Pattern detection queries — systemic escalation (§5.3) requires cross-instance queries by payer + DRG + date range | Engineering must expose these as scheduled jobs or real-time aggregate queries |
