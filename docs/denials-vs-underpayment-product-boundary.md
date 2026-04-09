# Product Boundary Spec: Denials Management ↔ Underpayment Resolution

**Audience:** Product stakeholders
**Purpose:** Define ownership boundaries, handoff criteria, and integration touchpoints between the two products

---

## The Core Distinction

| | Denials Management | Underpayment Resolution |
|---|---|---|
| **Question being answered** | Should the payer have paid at all? | Did the payer pay the right amount? |
| **Root cause** | Coverage, authorization, medical necessity, coding | Contract compliance, fee schedule variance, line-item miscalculation, silent downcoding |
| **Resolution path** | Appeal, corrected claim, clinical documentation | Payment variance analysis, contract lookups, demand for balance |
| **Governing framework** | Plan coverage policy, clinical criteria | Provider-payer contract, fee schedules |

A denial is a coverage dispute. An underpayment is a contract dispute. These require different expertise, different documentation, and different resolution workflows — which is why they live in separate products.

---

## Ownership Model

**Denials Management owns:**
- All $0 payment decisions (full denials)
- Authorization denials
- Medical necessity denials
- Audit-driven downcoding events (see below)
- Timely filing denials
- Coding/administrative denials where payment is $0
- ADRs and records requests
- Recoupments

**Underpayment Resolution owns:**
- Any claim where payment > $0 but payment < contracted rate
- Silent downcoding events (see below)
- Partial denials (some lines denied, others paid at wrong rate)
- Post-overturn underpayments (denial reversed but paid at wrong amount)
- COB/coordination of benefits variances
- All ambiguous payment variance cases

The guiding principle: **if money was received and the dispute is about how much, it belongs to Underpayment Resolution.** Denials Management focuses on the binary pay/don't-pay decision.

---

## CARC/RARC Routing Rules

### Routing by CARC

**Route to Denials Management — $0 payment, coverage or authorization dispute:**

| CARC | Description | Denial Type |
|---|---|---|
| 16 | Claim lacks information / billing error | Administrative |
| 18 | Duplicate claim | Administrative |
| 29 | Timely filing | Filing Defense |
| 50 | Non-covered service | Benefit Exclusion |
| 55 | Inconsistent with service type | Benefit Exclusion |
| 56 | Experimental / investigational | Benefit Exclusion |
| 57 | Prior authorization not obtained | Authorization |
| 96 | Non-covered charges | Benefit Exclusion |
| 109 | Not covered by this payer | Benefit Exclusion |
| 167 | Service not covered | Benefit Exclusion |
| 170 | Provider type not eligible | Authorization |
| 197 | Pre-authorization absent | Authorization |
| 200 | Coverage lapse | Eligibility |
| 204 | Not in benefit plan | Benefit Exclusion |
| 226 | Documentation not provided | ADR |
| 233 | Not payable under plan | Benefit Exclusion |
| 242 | Out-of-network provider | Authorization |
| 243 | Not authorized by PCP | Authorization |

**Route to Underpayment Resolution — payment received but amount is disputed:**

| CARC | Description | Notes |
|---|---|---|
| 23 | Adjusted per prior payer adjudication | COB variance — payment received, amount disputed |
| 97 | Bundled into another service | Incorrect bundling → underpayment. Only if payment > $0; if $0, treat as denial |
| 236 | Procedure/modifier combination incompatible | Payer applied reduction; payment received |

**Never work — contractual adjustments, not disputes:**

| CARC | Description | Why |
|---|---|---|
| 45 | Charges exceed fee schedule/max allowable (CO-45) | Expected contractual write-off |
| 131 | Negotiated discount | Contracted reduction, not an error |
| PR-1, PR-2, PR-3 | Patient deductible / coinsurance / copay | Patient responsibility, not a payer dispute |

### Context-Dependent CARCs

Some CARCs route differently depending on payment amount and whether an explicit payer communication accompanied the 835:

| CARC | If payment = $0 | If payment > $0 |
|---|---|---|
| 4 (Modifier inconsistency) | Denial — modifier dispute resulted in non-payment | Underpayment — modifier stripped, partial rate applied |
| 16 (Missing info) | Denial — claim rejected | Underpayment — claim partially processed |
| 22 (COB — may be covered by another payer) | Hold for COB resolution | Underpayment if primary paid less than expected |

### RARC Guidance

RARCs refine but do not override CARC routing. Notable cases:

- **MA130** (Missing/incomplete/invalid clinical information) — flag for ADR regardless of CARC
- **N522** (Inadequate documentation — outpatient code edit) — treat as downcoding underpayment if payment > $0
- **N70** (Consolidated billing — services included in facility payment) — underpayment, likely incorrect bundling
- **M86** (Service denied because payment already made) — administrative denial; confirm before routing

---

## Downcoding Events

Downcoding occurs when a payer pays at a lower service level than billed — without necessarily issuing a formal denial. The routing principle across all downcoding types is:

> **If the payer explicitly communicated the downgrade (audit notice, denial letter, recoupment demand) → Denials Management. If the payer silently paid at a lower level with no accompanying notice → Underpayment Resolution.**

The distinguishing signal is whether there is explicit payer communication attached to the event, not what the 835 payment amount says.

### Downcoding Event Types

**DRG Downgrade** *(inpatient)*
Payer reclassifies the billed DRG to a lower-weighted DRG, reducing payment.
- *Audit-driven:* Payer conducted a clinical review and issued a formal downgrade notice or recoupment demand → **Denials Management** (clinical dispute)
- *Silent:* 835 pays at a lower DRG than billed; no audit notice or denial letter → **Underpayment Resolution** (payment variance)

**E&M Level Reduction** *(outpatient / professional)*
Payer pays for a lower-complexity E&M code than billed (e.g., billed 99285, paid at 99283).
- *Explicit denial notice:* → **Denials Management**
- *Silent:* 835 reflects lower code with no explanation → **Underpayment Resolution**

**Procedure Code Substitution**
Payer maps billed procedure to a lower-value code without a denial notice.
- Almost always silent → **Underpayment Resolution**
- If accompanied by a non-covered service denial → **Denials Management**

**Units Reduction**
Payer pays fewer units than billed (e.g., billed 4 units, paid 2).
- No denial notice → **Underpayment Resolution**
- CARC 16 present with $0 → **Denials Management**

**Modifier Non-Recognition or Stripping**
Payer ignores a modifier that would increase reimbursement (e.g., -25, -59, -XU), reducing payment.
- Payment > $0 → **Underpayment Resolution**
- Payment = $0 → **Denials Management**

**Incorrect Bundling**
Payer bundles separately billable codes into a single lower payment, citing CARC 97 or 236.
- Payment > $0 → **Underpayment Resolution**
- Payment = $0 → **Denials Management**

**Revenue Code Substitution**
Payer maps to a different revenue code at a lower rate.
- Always silent → **Underpayment Resolution**

**Site of Service Differential**
Payer reimburses at the non-facility rate for a service performed in a facility setting.
- Always silent → **Underpayment Resolution**

**Fee Schedule Misapplication**
Payer applies the wrong fee schedule version, wrong geographic modifier, or wrong specialty classification.
- Always silent → **Underpayment Resolution**

**Outlier Payment Dispute** *(inpatient)*
Payer does not recognize a high-cost outlier threshold or applies incorrect outlier calculation.
- Always silent → **Underpayment Resolution**

---

## Handoff Triggers

The denials product initiates a handoff to Underpayment Resolution in the following cases:

**Trigger 1 — Direct Underpayment Detection at Ingest**
An 835 shows payment > $0 and payment is below the expected contracted rate by more than the configured threshold (e.g., >$50 or >5%), with no accompanying denial CARC from the Denials routing table.

> Denials Management creates the record, classifies it as an underpayment, and immediately routes it to Underpayment Resolution. No work is done in Denials Management.

**Trigger 2 — Silent Downcoding Detected**
An 835 shows a paid DRG, procedure code, E&M level, or unit count that differs from what was billed, with no explicit payer communication attached.

> Denials Management classifies the downcoding type, flags it as silent, and routes to Underpayment Resolution with the billed vs. paid comparison.

**Trigger 3 — Partial Denial**
An 835 contains a mix of denied lines and paid lines on the same claim.

> Denials Management does not split the claim. The full claim is handed off to Underpayment Resolution, which owns the complexity. If there is a denial component worth pursuing independently, Underpayment Resolution may open a linked denial case — but ownership stays with them.

**Trigger 4 — Post-Overturn Underpayment**
A denial is overturned, but the payment received is less than the contracted amount.

> Denials Management records the overturn and closes the denial instance as Resolved. It creates a linked handoff to Underpayment Resolution with the expected vs. received amounts and a reference to the originating denial.

**Trigger 5 — Ambiguous Payment**
A payer responds with partial payment and no clear denial CARC, or with a CARC from the context-dependent list above.

> Denials Management surfaces for human review at ingest staging. Default routing: Underpayment Resolution unless a clear coverage dispute CARC is present.

---

## What Does NOT Trigger a Handoff

- Patient responsibility adjustments (CO-45, PR codes) — expected write-offs, not disputes
- Contractual adjustments that net to $0 variance
- $0 payment with a clear denial CARC — full denial, stays in Denials Management
- Cases below the configured work threshold — neither product works them
- 277CA acknowledgments — informational only

---

## Data Passed at Handoff

| Field | Notes |
|---|---|
| Patient / claim identifiers | MRN, HAR, Claim ID |
| Payer | Required for contract lookup |
| Date of service | Required for fee schedule version matching |
| Billed amount + billed codes | From original claim |
| Paid amount + paid codes | From 835 |
| Expected contracted rate | If known; flagged as missing if not |
| CARC / RARC codes | All present on the 835 |
| Downcoding type | If applicable (DRG, E&M, units, etc.) |
| Communication flag | Whether an explicit payer notice accompanied the 835 |
| Originating denial ID | For post-overturn cases and partial denials |
| Relationship type | `underpayment_of`, `partial_denial`, `post_overturn`, `silent_downcode` |
| Handoff reason | Explicit classification of which trigger fired |

---

## Shared Concerns

**Reporting:** Each product maintains its own operational metrics. A shared executive view aggregates total dollars at risk and recovered across both — operational dashboards are product-specific.

**Duplicate prevention:** A claim should never be open in both products simultaneously for the same dispute. The handoff closes or deactivates the Denials Management record before Underpayment Resolution takes ownership. Linked records remain visible in each product as read-only context.

**Contract fee schedules:** Underpayment Resolution requires contract rate lookup to function. Denials Management does not. If no contract rate is on file, the record routes to Underpayment Resolution as a manual review item.

---

## Open Questions

1. **Threshold configuration** — Who sets the underpayment work threshold ($50 / 5%)? Global or per-payer? Shared between products or independent?

2. **Handoff reversal** — If Underpayment Resolution determines a case is actually a coverage dispute, can they send it back to Denials Management? What's the protocol and who arbitrates?

3. **Partial denial line-level routing** — In the current spec, partial denials go entirely to Underpayment Resolution. If the denial component is large and clearly appealable, should Denials Management retain a parallel case?

4. **Audit-driven DRG downgrade — recoupment overlap** — An audit-driven DRG downgrade often arrives as a recoupment demand. Should these route through Denials Management (as currently specified) or should recoupments be their own category with shared ownership?

5. **Client configuration** — If a client does not have the Underpayment product, should underpayment signals queue in Denials Management as low-priority, or be suppressed?

6. **Silent downcoding detection without a contract** — If no fee schedule is on file, silent downcoding can't be confirmed. Should Denials Management flag these as suspected underpayments and surface them for manual review, or drop them?
