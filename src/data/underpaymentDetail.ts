// ── Remit / Claim stub data ───────────────────────────────────────────────────

export interface UPRemitData {
  payerName: string
  eftNumber: string
  paymentDate: string
  payerICN: string
  patientControlNumber: string
  dos: string
  claimBilledAmount: number
  claimAllowedAmount: number
  claimPaidAmount: number
  adjustments: { groupCode: string; carc: string; rarc?: string; amount: number; description: string }[]
  serviceLines: { lineNum: number; revenueCode: string; description: string; dos: string; billedAmount: number; allowedAmount: number; paidAmount: number }[]
}

export interface UPClaimData {
  claimId: string
  har: string
  billingNPI: string
  renderingNPI: string
  taxId: string
  typeOfBill: string
  admitDate?: string
  dischargeDate?: string
  drgCode?: string
  diagnoses: { code: string; description: string; type: 'primary' | 'secondary' }[]
  revenueCodes: { code: string; description: string; quantity?: number; amount: number }[]
}

export const UP_REMIT_DATA: Record<string, UPRemitData> = {

  'UP-2026-0041': {
    payerName: 'Blue Cross Blue Shield',
    eftNumber: 'EFT-2026-0347821',
    paymentDate: '2026-02-28',
    payerICN: 'ICN-8821-20260228',
    patientControlNumber: 'HAR-882001',
    dos: '2026-02-10',
    claimBilledAmount: 48500,
    claimAllowedAmount: 33720,
    claimPaidAmount: 33720,
    adjustments: [
      { groupCode: 'CO', carc: '45', amount: 14780, description: 'Contractual adjustment — charges exceed contracted rate (2024 DRG 470 base rate $10,420 applied; 2025 rate $12,180 per Amendment 3)' },
    ],
    serviceLines: [
      { lineNum: 1, revenueCode: '0110', description: 'Room & Board — Med/Surg', dos: '2026-02-10', billedAmount: 18400, allowedAmount: 14280, paidAmount: 14280 },
      { lineNum: 2, revenueCode: '0360', description: 'Operating Room Services', dos: '2026-02-10', billedAmount: 22100, allowedAmount: 14920, paidAmount: 14920 },
      { lineNum: 3, revenueCode: '0278', description: 'Implants/Prosthetics', dos: '2026-02-10', billedAmount: 6200, allowedAmount: 4520, paidAmount: 4520 },
      { lineNum: 4, revenueCode: '0730', description: 'EKG/ECG', dos: '2026-02-10', billedAmount: 800, allowedAmount: 0, paidAmount: 0 },
    ],
  },

  'UP-2026-0044': {
    payerName: 'UnitedHealthcare',
    eftNumber: 'EFT-2026-0512984',
    paymentDate: '2026-02-18',
    payerICN: 'ICN-6204-20260218',
    patientControlNumber: 'HAR-331008',
    dos: '2026-01-08',
    claimBilledAmount: 385000,
    claimAllowedAmount: 112650,
    claimPaidAmount: 112650,
    adjustments: [
      { groupCode: 'CO', carc: '45', amount: 252350, description: 'Contractual adjustment — charges exceed contracted rate' },
      { groupCode: 'CO', carc: '96', rarc: 'N522', amount: 17500, description: 'Outlier calculation error — incorrect CCR of 0.41 applied; contract specifies 0.52 for this facility' },
    ],
    serviceLines: [
      { lineNum: 1, revenueCode: '0200', description: 'ICU — General', dos: '2026-01-08', billedAmount: 185000, allowedAmount: 62000, paidAmount: 62000 },
      { lineNum: 2, revenueCode: '0730', description: 'EKG Monitoring', dos: '2026-01-08', billedAmount: 12000, allowedAmount: 4200, paidAmount: 4200 },
      { lineNum: 3, revenueCode: '0260', description: 'IV Therapy', dos: '2026-01-08', billedAmount: 48000, allowedAmount: 18100, paidAmount: 18100 },
      { lineNum: 4, revenueCode: '0540', description: 'Ambulatory Surgical Care', dos: '2026-01-08', billedAmount: 95000, allowedAmount: 22850, paidAmount: 22850 },
      { lineNum: 5, revenueCode: '0636', description: 'Pharmacy — Drugs', dos: '2026-01-08', billedAmount: 45000, allowedAmount: 5500, paidAmount: 5500 },
    ],
  },
}

export const UP_CLAIM_DATA: Record<string, UPClaimData> = {

  'UP-2026-0041': {
    claimId: 'CLM-9901234',
    har: 'HAR-882001',
    billingNPI: '1437291820',
    renderingNPI: '1437291820',
    taxId: '94-1234567',
    typeOfBill: '111',
    admitDate: '2026-02-10',
    dischargeDate: '2026-02-14',
    drgCode: 'MS-DRG 470',
    diagnoses: [
      { code: 'M16.11', description: 'Primary osteoarthritis, right hip', type: 'primary' },
      { code: 'Z96.641', description: 'Presence of right artificial hip joint', type: 'secondary' },
      { code: 'Z79.4', description: 'Long-term (current) use of anticoagulants', type: 'secondary' },
      { code: 'I10', description: 'Essential (primary) hypertension', type: 'secondary' },
    ],
    revenueCodes: [
      { code: '0110', description: 'Room & Board — Med/Surg', quantity: 4, amount: 18400 },
      { code: '0360', description: 'Operating Room Services', amount: 22100 },
      { code: '0278', description: 'Implants / Prosthetics (Hip Implant System)', quantity: 1, amount: 6200 },
      { code: '0730', description: 'EKG / ECG', amount: 800 },
    ],
  },

  'UP-2026-0044': {
    claimId: 'CLM-4412009',
    har: 'HAR-331008',
    billingNPI: '1528374901',
    renderingNPI: '1528374901',
    taxId: '94-1234567',
    typeOfBill: '111',
    admitDate: '2026-01-08',
    dischargeDate: '2026-01-22',
    drgCode: 'MS-DRG 871',
    diagnoses: [
      { code: 'A41.9', description: 'Sepsis, unspecified organism', type: 'primary' },
      { code: 'N18.4', description: 'Chronic kidney disease, stage 4', type: 'secondary' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', type: 'secondary' },
      { code: 'J96.00', description: 'Acute respiratory failure, unspecified', type: 'secondary' },
    ],
    revenueCodes: [
      { code: '0200', description: 'ICU — General (14 days)', quantity: 14, amount: 185000 },
      { code: '0730', description: 'EKG / Cardiac Monitoring', amount: 12000 },
      { code: '0260', description: 'IV Therapy / Vasopressors', amount: 48000 },
      { code: '0540', description: 'Ambulatory Surgical — Dialysis CRRT', amount: 95000 },
      { code: '0636', description: 'Pharmacy — Specialty Drugs (Antibiotics / Antifungals)', amount: 45000 },
    ],
  },
}

// ── AI Analysis Findings ──────────────────────────────────────────────────────

export interface AIFinding {
  type: 'contract' | 'coding' | 'billing' | 'regulatory' | 'pattern'
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
  confidence: number   // 0–100
}

export interface ContractClause {
  section: string
  title: string
  text: string
  relevance: string   // why this clause matters for this case
}

export interface UnderpaymentDetail {
  underpaymentId: string
  aiFindings: AIFinding[]
  contractClauses: ContractClause[]
  recommendedNextSteps: string[]
  precedentCases?: { id: string; description: string; outcome: string }[]
}

export const UNDERPAYMENT_DETAILS: Record<string, UnderpaymentDetail> = {

  'UP-2026-0041': {
    underpaymentId: 'UP-2026-0041',
    aiFindings: [
      {
        type: 'contract',
        severity: 'high',
        title: 'Incorrect Fee Schedule Version Applied',
        detail: 'BCBS applied the 2024 DRG base rate of $10,420 instead of the 2025 contracted rate of $12,180. The 2025 rate became effective January 1, 2026 per Amendment 3 to the provider agreement. The resulting underpayment on DRG 470 is $4,480.',
        confidence: 96,
      },
      {
        type: 'pattern',
        severity: 'medium',
        title: 'Pattern Identified Across 3 Recent Claims',
        detail: 'This is the third claim in the past 60 days where BCBS has applied the 2024 fee schedule to DRG 470 discharges at this facility. Total variance across all three claims: $11,240.',
        confidence: 88,
      },
    ],
    contractClauses: [
      {
        section: '§3.1(b)',
        title: 'Fee Schedule Effective Date',
        text: 'The fee schedule rates set forth in Exhibit A shall be updated annually on January 1st of each contract year. Updated rates supersede all prior schedules as of the effective date. Payer agrees to apply the then-current schedule to all claims with dates of service on or after the effective date.',
        relevance: 'Establishes that 2025 rates apply to all DOS on or after Jan 1, 2026. BCBS applied 2024 rates to a Feb 2026 DOS — a direct violation of this clause.',
      },
      {
        section: '§8.3',
        title: 'Underpayment Dispute Resolution',
        text: 'Provider may dispute any payment believed to be inconsistent with this Agreement within 180 days of the Explanation of Benefits date. Payer shall respond in writing within 45 days of receipt of a properly submitted dispute.',
        relevance: 'Establishes the dispute window and payer response obligation. Dispute should reference this clause to establish the 45-day response deadline.',
      },
    ],
    recommendedNextSteps: [
      'Draft demand letter citing §3.1(b) and attach Exhibit A showing 2025 DRG 470 base rate',
      'Include the two prior claims with the same fee schedule error to establish a pattern',
      'Request payer system audit for all DRG 470 claims at this facility since Jan 1, 2026',
      'Set follow-up for April 18 per §8.3 45-day response window',
    ],
  },

  'UP-2026-0044': {
    underpaymentId: 'UP-2026-0044',
    aiFindings: [
      {
        type: 'contract',
        severity: 'high',
        title: 'Outlier CCR Applied Incorrectly',
        detail: 'UHC used a cost-to-charge ratio (CCR) of 0.41 in the outlier calculation. The 2025 contract amendment specifies a CCR of 0.52 for this facility, based on the most recent Medicare cost report filing. Using the correct CCR raises the outlier threshold and increases the outlier payment by $17,500.',
        confidence: 93,
      },
      {
        type: 'regulatory',
        severity: 'medium',
        title: 'CMS Outlier Methodology Reference',
        detail: 'CMS IPPS final rule requires use of the facility-specific CCR from the most recent settled cost report. UHC\'s contract mirrors CMS methodology. The 2024 cost report (settled Oct 2025) sets the CCR at 0.52.',
        confidence: 91,
      },
    ],
    contractClauses: [
      {
        section: '§5.2(a)',
        title: 'High-Cost Outlier Calculation',
        text: 'For inpatient claims meeting the outlier threshold, Payer shall calculate outlier payments using the facility-specific cost-to-charge ratio as published in the facility\'s most recently settled Medicare cost report. Payer shall update the CCR within 60 days of CMS settlement notification.',
        relevance: 'Requires UHC to use the settled cost report CCR (0.52), not an internally derived ratio. This clause is the primary basis for the dispute.',
      },
      {
        section: '§5.2(c)',
        title: 'Outlier Threshold',
        text: 'The outlier threshold shall equal the MS-DRG payment amount plus a fixed loss amount of $38,788 (per current CMS IPPS parameters). Claims exceeding this threshold qualify for outlier payment equal to 80% of the costs above the threshold.',
        relevance: 'Confirms the threshold calculation method. With correct CCR of 0.52, total claim cost exceeds the threshold by $21,875, yielding $17,500 additional outlier payment.',
      },
    ],
    recommendedNextSteps: [
      'Attach the 2024 settled Medicare cost report as CCR documentation',
      'Prepare outlier recalculation worksheet showing correct CCR application',
      'Reference §5.2(a) and the CMS IPPS final rule in the demand letter',
      'Escalate urgently — deadline is in 2 days',
    ],
  },

  'UP-2026-0051': {
    underpaymentId: 'UP-2026-0051',
    aiFindings: [
      {
        type: 'coding',
        severity: 'high',
        title: 'Silent DRG Downcode Detected',
        detail: 'Aetna processed this claim at MS-DRG 392 (relative weight 0.8812, expected payment $12,920) despite the facility billing MS-DRG 391 (relative weight 1.1041, expected payment $16,650). No audit notice or denial letter was issued. The $3,730 variance represents the DRG weight differential at the contracted base rate of $14,650.',
        confidence: 94,
      },
      {
        type: 'contract',
        severity: 'medium',
        title: 'No Communication — Silent Downcode Rule Applies',
        detail: 'Per the boundary classification, a DRG downgrade without explicit payer communication is classified as an underpayment (silent downcode) rather than a denial. This case correctly belongs in Underpayment Resolution.',
        confidence: 99,
      },
    ],
    contractClauses: [
      {
        section: '§4.1',
        title: 'DRG Payment Basis',
        text: 'Inpatient claims shall be reimbursed based on the MS-DRG assigned by the facility\'s grouper software, as reflected on the submitted UB-04, unless Payer conducts a formal clinical review and issues written notification of any coding change within 30 days of the initial remittance.',
        relevance: 'Establishes that Aetna must issue written notification to change a DRG. No notice was issued, so the billed MS-DRG 391 should govern payment.',
      },
    ],
    recommendedNextSteps: [
      'Document the absence of any audit notice or denial letter from Aetna',
      'Attach coding summary confirming principal diagnosis supports MS-DRG 391',
      'Reference §4.1 requiring written notification for any DRG change',
      'Calculate demand as (1.1041 − 0.8812) × $14,650 base rate = $3,265 + outlier adjustment',
    ],
  },

  'UP-2026-0058': {
    underpaymentId: 'UP-2026-0058',
    aiFindings: [
      {
        type: 'contract',
        severity: 'high',
        title: 'Device Carveout Applies — Invoice Threshold Exceeded',
        detail: 'The spinal implant system (revenue code 0278) was invoiced at $8,200. The Cigna contract carves out implants with invoice costs exceeding $5,000, reimbursing at invoice cost + 10% = $9,020. Cigna bundled this into the DRG payment at $0 additional, resulting in a $9,020 underpayment on the device line alone.',
        confidence: 97,
      },
      {
        type: 'billing',
        severity: 'low',
        title: 'Revenue Code 0278 Correctly Applied',
        detail: 'The facility correctly billed using revenue code 0278 (implants) on a separate line. The carveout should have triggered automatically at adjudication. Cigna\'s processing appears to have missed the carveout logic.',
        confidence: 89,
      },
    ],
    contractClauses: [
      {
        section: '§7.4',
        title: 'Implant and Device Carveout',
        text: 'Implantable devices with an invoice cost exceeding $5,000 per item shall be reimbursed separately from the MS-DRG payment at the facility\'s net invoice cost plus ten percent (10%). The facility shall submit the device invoice with the claim or within 30 days of initial remittance upon request.',
        relevance: 'Directly governs this claim. The $8,200 implant cost exceeds the $5,000 threshold, triggering separate reimbursement at $9,020.',
      },
      {
        section: '§7.4(b)',
        title: 'Revenue Code Identification',
        text: 'Implants subject to carveout shall be billed using revenue codes 0274–0278. Payer shall identify carveout-eligible charges from the UB-04 revenue code line and process separately from the DRG base payment.',
        relevance: 'Confirms facility used correct revenue code (0278) and places the identification obligation on Cigna.',
      },
    ],
    recommendedNextSteps: [
      'Attach original device invoice showing $8,200 cost',
      'Reference §7.4 and calculate demand: $8,200 × 1.10 = $9,020 carveout payment',
      'Confirm Cigna received the UB-04 with revenue code 0278 on the device line',
      'Follow up via Cigna provider relations — deadline in 2 days',
    ],
  },

  'UP-2026-0071': {
    underpaymentId: 'UP-2026-0071',
    aiFindings: [
      {
        type: 'regulatory',
        severity: 'high',
        title: 'Incorrect NCCI Bundling — CPT 93306 Separately Billable',
        detail: 'BCBS applied CARC 97 / N70, bundling CPT 93306 (echocardiography with Doppler) into the facility E&M payment. Per CMS NCCI edits, CPT 93306 is not a component of E&M codes in an outpatient hospital setting. The applicable NCCI PTP edit allows modifier -59 to override bundling here.',
        confidence: 92,
      },
      {
        type: 'coding',
        severity: 'medium',
        title: 'Modifier -59 Should Have Been Applied',
        detail: 'The echo was performed as a distinct diagnostic procedure on the same date as the E&M. Modifier -59 (distinct procedural service) would override the NCCI edit and allow separate reimbursement. The facility may want to resubmit with -59 on 93306.',
        confidence: 85,
      },
    ],
    contractClauses: [
      {
        section: '§6.1',
        title: 'NCCI Edit Application',
        text: 'Payer shall apply CMS National Correct Coding Initiative edits as published by CMS for the applicable date of service. Where a modifier permits unbundling under NCCI policy, Payer shall accept such modifiers and process the separately identified service at the contracted rate.',
        relevance: 'Requires BCBS to honor modifier -59 override of NCCI bundling. Establishes basis for demanding separate payment on CPT 93306.',
      },
    ],
    recommendedNextSteps: [
      'Resubmit CPT 93306 with modifier -59 appended to indicate distinct service',
      'Include clinical documentation showing echo was a separate, medically necessary procedure',
      'Reference CMS NCCI PTP edit table and §6.1 in demand letter',
      'Calculate demand: CPT 93306 contracted rate × BCBS OPPS APC rate for this facility',
    ],
  },

  'UP-2026-0079': {
    underpaymentId: 'UP-2026-0079',
    aiFindings: [
      {
        type: 'billing',
        severity: 'high',
        title: 'Unit Count Discrepancy — 4 Units Billed, 2 Processed',
        detail: 'The UB-04 reflects 4 units of J0696 (ceftriaxone 500mg injection) administered across two separate administrations. Aetna processed only 2 units with no explanation or denial notice. The medication administration record (MAR) confirms 4 units were administered.',
        confidence: 98,
      },
      {
        type: 'regulatory',
        severity: 'medium',
        title: 'No CARC / RARC Explanation for Unit Reduction',
        detail: 'Aetna did not include any CARC or RARC code explaining the unit reduction on the 835. This is inconsistent with 5010 EDI requirements, which mandate a CARC for every adjustment to billed amounts.',
        confidence: 88,
      },
    ],
    contractClauses: [
      {
        section: '§4.3',
        title: 'Drug Administration Unit Reimbursement',
        text: 'Pharmaceutical services billed on revenue code 0250–0259 shall be reimbursed at the contracted per-unit rate for the number of units documented in the medical record. Payer shall not reduce billed units without issuing a denial notice with the applicable CARC.',
        relevance: 'Requires Aetna to reimburse all 4 billed units and mandates a denial notice for any unit reduction. Neither condition was met.',
      },
    ],
    recommendedNextSteps: [
      'Attach MAR confirming 4 units of J0696 administered',
      'Note absence of CARC on 835 as additional basis for dispute',
      'Submit corrected claim or written dispute referencing §4.3',
      'Request Aetna audit log for unit adjudication on this claim',
    ],
  },

  'UP-2026-0082': {
    underpaymentId: 'UP-2026-0082',
    aiFindings: [
      {
        type: 'coding',
        severity: 'high',
        title: 'Silent Downcode — 99285 to 99283',
        detail: 'Cigna paid at 99283 (moderate complexity E&M) rather than the billed 99285 (high complexity). No denial notice or clinical review letter was issued. The MDM documentation in the medical record supports 99285 — the patient presented with multiple chronic conditions and a new urgent complaint requiring high-complexity decision-making.',
        confidence: 87,
      },
      {
        type: 'pattern',
        severity: 'medium',
        title: 'Cigna Downcoding Pattern — 2nd Instance This Quarter',
        detail: 'This is the second Cigna claim this quarter with a silent downcode from 99285 to 99283. The prior case (UP-2025-0944) is currently under negotiation. A pattern may support an escalation to Cigna\'s provider relations team.',
        confidence: 82,
      },
    ],
    contractClauses: [
      {
        section: '§6.2',
        title: 'E&M Level Adjudication',
        text: 'Payer shall reimburse E&M services at the level of service documented in the medical record and submitted on the claim. Any reduction in E&M level shall be accompanied by written notice to the Provider explaining the clinical basis for the reduction within 30 days of the initial remittance date.',
        relevance: 'Cigna made no written notification of the downcode. Under §6.2, the billed level (99285) should govern absent a timely written explanation.',
      },
    ],
    recommendedNextSteps: [
      'Document absence of any written downcode notification from Cigna',
      'Attach E&M documentation summary confirming high-complexity MDM',
      'Reference prior case UP-2025-0944 to establish pattern',
      'Escalate to Cigna provider relations given negotiation is ongoing',
    ],
  },

  'UP-2026-0091': {
    underpaymentId: 'UP-2026-0091',
    aiFindings: [
      {
        type: 'coding',
        severity: 'high',
        title: 'Modifier -25 Omission — E&M Reduction Applied',
        detail: 'UHC reduced the 99214 E&M payment by 50% citing CCI, because a minor procedure (CPT 11042) was billed the same day without modifier -25. CDI review confirms the E&M was significant and separately identifiable — the patient presented with a new complaint unrelated to the wound debridement.',
        confidence: 91,
      },
      {
        type: 'billing',
        severity: 'high',
        title: 'Corrected Claim Appropriate — Provider Billing Error',
        detail: 'This is a provider billing error (missing modifier -25) rather than a payer error. A corrected claim with modifier -25 appended to 99214 is the appropriate resolution path. The variance is recoverable through resubmission.',
        confidence: 95,
      },
    ],
    contractClauses: [
      {
        section: '§6.1',
        title: 'NCCI Edit Application',
        text: 'Payer shall apply CMS National Correct Coding Initiative edits as published by CMS for the applicable date of service. Where a modifier permits unbundling under NCCI policy, Payer shall accept such modifiers and process the separately identified service at the contracted rate.',
        relevance: 'Confirms that modifier -25, once appended, requires UHC to pay the E&M separately from the procedure. The corrected claim with -25 should trigger full E&M payment.',
      },
    ],
    recommendedNextSteps: [
      'Submit corrected claim with modifier -25 on CPT 99214',
      'Attach medical record excerpt documenting separately identifiable E&M service',
      'Note this is a resubmission for billing error — not a dispute per se',
      'Confirm UHC accepts corrected claims within 90 days of original remittance',
    ],
  },

  'UP-2026-0101': {
    underpaymentId: 'UP-2026-0101',
    aiFindings: [
      {
        type: 'billing',
        severity: 'high',
        title: 'COB Secondary Payment Below Coordination Floor',
        detail: 'Medicare (primary) paid $6,100 on a $14,200 billed claim. BCBS as secondary paid $8,100 — but the COB calculation should bring patient liability to zero. The patient\'s BCBS benefit covers the Medicare cost-sharing amounts (deductible + 20% coinsurance = $2,940). BCBS underpaid by $4,300.',
        confidence: 89,
      },
      {
        type: 'regulatory',
        severity: 'medium',
        title: 'OBRA 1990 COB Rules Apply',
        detail: 'Under OBRA 1990, when Medicare is primary and a commercial plan is secondary, the secondary payer must pay up to its benefit liability or the patient\'s cost-sharing amount, whichever is less. BCBS appears to have applied its own benefit rules rather than the COB coordination floor.',
        confidence: 84,
      },
    ],
    contractClauses: [
      {
        section: '§10.1',
        title: 'Coordination of Benefits — Medicare Primary',
        text: 'When Medicare is the primary payer, Payer shall coordinate benefits to reduce patient liability to zero, up to Payer\'s benefit obligation. Payer shall not apply its own deductible or cost-sharing when Medicare has already been applied as primary.',
        relevance: 'BCBS is required to coordinate to zero patient liability. The patient still has $4,300 in cost-sharing after Medicare + BCBS payments — a direct violation of this clause.',
      },
    ],
    recommendedNextSteps: [
      'Obtain Medicare EOB showing $6,100 primary payment and cost-sharing breakdown',
      'Submit to BCBS with COB recalculation showing $4,300 secondary liability',
      'Reference §10.1 and OBRA 1990 COB coordination rules in dispute letter',
      'Escalate to patient advocate if BCBS does not respond within 30 days',
    ],
  },

  'UP-2026-0104': {
    underpaymentId: 'UP-2026-0104',
    aiFindings: [
      {
        type: 'billing',
        severity: 'high',
        title: '277-CA Confirms Timely Filing — Penalty Not Applicable',
        detail: 'The 277-CA transaction acknowledgment dated February 2, 2026 confirms the original claim was received and accepted within the Medicaid timely filing window (12 months from DOS). The 50% payment penalty applied by Medicaid is therefore not justified.',
        confidence: 96,
      },
    ],
    contractClauses: [
      {
        section: '§2.4',
        title: 'Timely Filing Documentation',
        text: 'Provider may establish timely filing by submitting a copy of the 277-CA transaction acknowledgment demonstrating that the claim was received by Payer within the applicable filing period. Receipt of the 277-CA acknowledgment constitutes proof of timely filing for purposes of this Agreement.',
        relevance: 'Explicitly establishes that the 277-CA is proof of timely filing. The 277-CA exists and is dated within the filing window — the penalty should be reversed.',
      },
    ],
    recommendedNextSteps: [
      'Submit 277-CA acknowledgment (dated Feb 2, 2026) to Medicaid dispute team',
      'Reference §2.4 establishing the 277-CA as definitive proof of timely filing',
      'Request full reversal of the 50% payment penalty ($2,300)',
      'File through Medicaid formal dispute process if informal submission is rejected',
    ],
  },
}

// ── Submission Episodes ───────────────────────────────────────────────────────

export type UPDeliveryMethod = 'fax' | 'mail' | 'portal' | 'phone'

export type UPAttachmentType = '835_remit' | 'pdf_eop' | 'document' | 'report_277'

export interface UPEpisodeAttachment {
  type: UPAttachmentType
  label: string
  ref?: string
}

export interface UPEpisodeSignal {
  label: string
  date: string
  source?: string
  description?: string
  attachments?: UPEpisodeAttachment[]
}

export interface UPEpisodeAction {
  label: string
  date: string
  method: UPDeliveryMethod
  reference?: string
  notes?: string
  attachments?: UPEpisodeAttachment[]
}

export interface UPEpisodeResult {
  label: string
  date: string
  description?: string
  source?: string
  attachments?: UPEpisodeAttachment[]
}

export interface UPSubmissionEpisode {
  id: string
  round: string
  openedAt: string
  signal?: UPEpisodeSignal
  action?: UPEpisodeAction
  result?: UPEpisodeResult
}

export const UP_SUBMISSION_EPISODES: Record<string, UPSubmissionEpisode[]> = {

  // Active — BCBS incorrect fee schedule
  'UP-2026-0041': [
    {
      id: 'ep-0041-1',
      round: 'Variance Identified',
      openedAt: '2026-03-13',
      signal: {
        label: '835 Remittance — Incorrect Fee Schedule Applied',
        date: '2026-03-13',
        source: 'EFT-2026-0313-BCBS-882001',
        description: 'BCBS paid DRG 470 at 2024 base rate ($10,420) instead of 2025 contracted rate ($12,180 per Amendment 3). CARC-45. Variance of $4,480 on DOS 2026-02-10.',
        attachments: [
          { type: '835_remit', label: '835_remit_BCBS_HAR-882001.edi', ref: 'UP-2026-0041' },
          { type: 'pdf_eop',   label: 'EOP_BCBS_HAR-882001.pdf' },
        ],
      },
    },
  ],

  // Active — UHC outlier CCR error
  'UP-2026-0044': [
    {
      id: 'ep-0044-1',
      round: 'Variance Identified',
      openedAt: '2026-03-08',
      signal: {
        label: '835 Remittance — Outlier CCR Discrepancy',
        date: '2026-03-08',
        source: 'EFT-2026-0308-UHC-331008',
        description: 'UHC applied CCR of 0.41 in outlier calculation. Contract §5.2(a) specifies CCR of 0.52 from most recently settled cost report. Incorrect CCR reduces outlier payment by $17,500. CARC-45 / CARC-96.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-331008.edi', ref: 'UP-2026-0044' },
          { type: 'pdf_eop',   label: 'EOP_UHC_HAR-331008.pdf' },
        ],
      },
    },
  ],

  // Active — Aetna silent DRG downcode (no denial letter)
  'UP-2026-0051': [
    {
      id: 'ep-0051-1',
      round: 'Variance Identified',
      openedAt: '2026-03-11',
      signal: {
        label: '835 Remittance — Silent DRG Downcode (391→392)',
        date: '2026-03-11',
        source: 'EFT-2026-0311-AET-429100',
        description: 'Aetna paid at MS-DRG 392 (weight 0.8812, $12,920) instead of billed MS-DRG 391 (weight 1.1041, $16,650). No audit notice or denial letter issued. CARC-45. Variance $3,730.',
        attachments: [
          { type: '835_remit', label: '835_remit_Aetna_HAR-429100.edi', ref: 'UP-2026-0051' },
        ],
      },
    },
  ],

  // Submitted — Cigna device carveout (awaiting response)
  'UP-2026-0058': [
    {
      id: 'ep-0058-1',
      round: 'Dispute Round 1',
      openedAt: '2026-02-22',
      signal: {
        label: '835 Remittance — Device Carveout Not Applied',
        date: '2026-02-22',
        source: 'EFT-2026-0219-CIG-558990',
        description: 'Cigna bundled revenue code 0278 (spinal implant, $8,200) into DRG payment. No separate carveout applied despite §7.4 threshold of $5,000. CARC-45 across all lines.',
        attachments: [
          { type: '835_remit', label: '835_remit_Cigna_HAR-558990.edi', ref: 'UP-2026-0058' },
          { type: 'pdf_eop',   label: 'EOP_Cigna_HAR-558990.pdf' },
        ],
      },
      action: {
        label: 'Demand Letter Submitted — Device Carveout §7.4',
        date: '2026-03-10',
        method: 'portal',
        reference: 'CIG-DISP-2026-0310-7714',
        notes: 'Letter cited §7.4 and §7.4(b) with original device invoice ($8,200) attached. Demanded $9,020 (invoice + 10%). Submitted via Cigna provider portal.',
        attachments: [
          { type: 'document', label: 'DemandLetter_Cigna_HAR-558990.pdf' },
          { type: 'document', label: 'DeviceInvoice_SpinalImplant_8200.pdf' },
        ],
      },
    },
  ],

  // Submitted — Cigna downcoding (under negotiation, 2 rounds)
  'UP-2026-0082': [
    {
      id: 'ep-0082-1',
      round: 'Dispute Round 1',
      openedAt: '2026-02-10',
      signal: {
        label: '835 Remittance — Silent Downcode 99285→99283',
        date: '2026-02-10',
        source: 'EFT-2026-0210-CIG-882002',
        description: 'Cigna paid 99283 (moderate complexity) on a billed 99285 (high complexity). No denial notice or clinical review letter issued. CARC-4 / RARC N522. $2,700 variance.',
        attachments: [
          { type: '835_remit', label: '835_remit_Cigna_HAR-882002.edi', ref: 'UP-2026-0082' },
        ],
      },
      action: {
        label: 'Demand Letter Submitted — §6.2 Silent Downcode',
        date: '2026-03-18',
        method: 'fax',
        reference: 'FAX-CIG-20260318-7714',
        notes: 'Referenced §6.2 (written notification required for any E&M downcode). Attached E&M documentation summary confirming high-complexity MDM. Also cited prior case UP-2025-0944 for pattern.',
        attachments: [
          { type: 'document', label: 'DemandLetter_Cigna_HAR-882002.pdf' },
          { type: 'document', label: 'EMDocumentation_HighComplexity_MDM.pdf' },
        ],
      },
      result: {
        label: 'Additional Documentation Requested',
        date: '2026-03-28',
        source: 'CIG-RESP-20260328-0082',
        description: 'Cigna acknowledged receipt and requested full office visit note plus MDM worksheet. Dispute escalated to provider relations for negotiation.',
        attachments: [
          { type: 'document', label: 'CignaResponse_AdditionalDocRequest_20260328.pdf' },
        ],
      },
    },
  ],

  // Won — Humana rate error (payment authorized, awaiting 835)
  'UP-2026-0062': [
    {
      id: 'ep-0062-1',
      round: 'Dispute Round 1',
      openedAt: '2026-02-08',
      signal: {
        label: '835 Remittance — HMO Rate Applied to PPO Claim',
        date: '2026-02-08',
        source: 'EFT-2026-0208-HUM-219881',
        description: 'Humana applied HMO contracted base rate ($680/diem) to a facility under PPO contract ($920/diem). Variance of $3,600 on 15-day stay. CARC-45.',
        attachments: [
          { type: '835_remit', label: '835_remit_Humana_HAR-219881.edi', ref: 'UP-2026-0062' },
          { type: 'pdf_eop',   label: 'EOP_Humana_HAR-219881.pdf' },
        ],
      },
      action: {
        label: 'Demand Letter Submitted — Contract Rate Mismatch',
        date: '2026-02-22',
        method: 'portal',
        reference: 'HUM-DISP-2026-0222-3301',
        notes: 'Attached contract Exhibit A showing PPO per-diem rates. Cited payer\'s internal credentialing error — facility contracted under PPO agreement, not HMO. $3,600 demanded.',
        attachments: [
          { type: 'document', label: 'DemandLetter_Humana_HAR-219881.pdf' },
          { type: 'document', label: 'ContractExhibitA_PPORates.pdf' },
        ],
      },
      result: {
        label: 'Adjustment Authorized — $3,600',
        date: '2026-04-01',
        source: 'HUM-RESP-20260401-3301',
        description: 'Humana confirmed rate error in writing. Full $3,600 adjustment authorized. 835 correction expected within 15 business days.',
        attachments: [
          { type: 'document', label: 'HumanaApproval_RateAdjustment_20260401.pdf' },
        ],
      },
    },
  ],

  // Recovered — UHC stop loss (full recovery)
  'UP-2026-0033': [
    {
      id: 'ep-0033-1',
      round: 'Dispute Round 1',
      openedAt: '2026-01-08',
      signal: {
        label: '835 Remittance — Stop Loss Threshold Miscalculated',
        date: '2026-01-08',
        source: 'EFT-2026-0108-UHC-772441',
        description: 'UHC calculated stop loss threshold using billed charges ($28,400) instead of allowed amount ($25,600). Per §9.2, threshold applies to allowed charges — stop loss should have triggered, yielding $5,800 additional payment.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-772441.edi', ref: 'UP-2026-0033' },
        ],
      },
      action: {
        label: 'Demand Letter + Recalculation Worksheet Submitted',
        date: '2026-01-20',
        method: 'portal',
        reference: 'UHC-DISP-2026-0120-8801',
        notes: 'Attached stop loss recalculation worksheet showing threshold breach at $25,600 allowed (contract cap $25,000). Cited §9.2 and requested $5,800 corrected payment.',
        attachments: [
          { type: 'document', label: 'DemandLetter_UHC_HAR-772441.pdf' },
          { type: 'document', label: 'StopLossRecalculation_Worksheet.xlsx' },
        ],
      },
      result: {
        label: 'Payment Posted — $5,800 Recovered',
        date: '2026-03-08',
        source: 'EFT-2026-0308-UHC-772441-ADJ',
        description: 'UHC issued corrected 835 with $5,800 adjustment. Full variance recovered. 835 remittance confirmed stop loss supplemental payment.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-772441_adj.edi' },
        ],
      },
    },
  ],

  // Recovered (partial) — BCBS bundling error
  'UP-2025-0944': [
    {
      id: 'ep-0944-1',
      round: 'Dispute Round 1',
      openedAt: '2025-11-20',
      signal: {
        label: '835 Remittance — CPT 93306 Bundled (CARC-97)',
        date: '2025-11-20',
        source: 'EFT-20251120-BCBS-428801',
        description: 'BCBS bundled CPT 93306 (echocardiography with Doppler) into the E&M visit. CARC-97 / N70 applied. $3,400 variance. No denial letter issued.',
        attachments: [
          { type: '835_remit', label: '835_remit_BCBS_HAR-428801.edi', ref: 'UP-2025-0944' },
        ],
      },
      action: {
        label: 'Demand Letter — NCCI Unbundling §6.1',
        date: '2025-12-04',
        method: 'fax',
        reference: 'FAX-BCBS-20251204-8801',
        notes: 'Cited §6.1 and CMS NCCI PTP edit allowing modifier -59 override. Requested full $3,400 payment for separate diagnostic procedure.',
        attachments: [
          { type: 'document', label: 'DemandLetter_BCBS_HAR-428801.pdf' },
        ],
      },
      result: {
        label: 'Partial Adjustment — $2,100 of $3,400',
        date: '2026-01-14',
        source: 'BCBS-RESP-20260114-0944',
        description: 'BCBS agreed to unbundle CPT 93306 but applied a lower contracted rate than expected. $2,100 paid. Remaining $1,300 variance attributed to APC rate dispute. Accepted per finance review — cost of further appeal exceeds remaining variance.',
        attachments: [
          { type: 'document', label: 'BCBSResponse_PartialAdjustment_20260114.pdf' },
          { type: '835_remit', label: '835_remit_BCBS_HAR-428801_adj.edi' },
        ],
      },
    },
  ],

  // Closed — Cigna upheld (full episode)
  'UP-2026-0097': [
    {
      id: 'ep-0097-1',
      round: 'Dispute Round 1',
      openedAt: '2026-01-25',
      signal: {
        label: '835 Remittance — 99285 Downcoded to 99284',
        date: '2026-01-25',
        source: 'EFT-20260125-CIG-772009',
        description: 'Cigna paid 99284 (moderate-high complexity) on billed 99285 (high complexity). CARC-4. $1,000 variance.',
        attachments: [
          { type: '835_remit', label: '835_remit_Cigna_HAR-772009.edi', ref: 'UP-2026-0097' },
        ],
      },
      action: {
        label: 'Demand Letter Submitted — §6.2 Downcode Notice',
        date: '2026-02-05',
        method: 'portal',
        reference: 'CIG-DISP-2026-0205-8991',
        notes: 'Cited §6.2 requiring written notification for any E&M level change. Requested payment at billed level 99285.',
        attachments: [
          { type: 'document', label: 'DemandLetter_Cigna_HAR-772009.pdf' },
        ],
      },
      result: {
        label: 'Payer Upheld — 99285 Criteria Not Met',
        date: '2026-03-05',
        source: 'CIG-RESP-20260305-0097',
        description: 'Cigna provided clinical review letter confirming downcode. MDM documentation review found complexity criteria for 99285 not fully met — "extensive data review" element not clearly documented in note. Internal CDI review agreed. Closed.',
        attachments: [
          { type: 'document', label: 'CignaClinicalReview_Upheld_20260305.pdf' },
        ],
      },
    },
  ],

  // Won — UHC COB partial adjustment
  'UP-2026-0108': [
    {
      id: 'ep-0108-1',
      round: 'Dispute Round 1',
      openedAt: '2026-01-28',
      signal: {
        label: '835 Remittance — COB Secondary Underpayment',
        date: '2026-01-28',
        source: 'EFT-20260128-UHC-428009',
        description: 'UHC applied its own deductible as secondary payer instead of coordinating to zero patient liability per §10.1. Medicare primary paid $11,200; UHC secondary paid $5,200 of $9,700 remaining patient liability.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-428009.edi', ref: 'UP-2026-0108' },
        ],
      },
      action: {
        label: 'Demand Letter + Medicare EOB Submitted',
        date: '2026-02-11',
        method: 'portal',
        reference: 'UHC-DISP-2026-0211-5512',
        notes: 'Attached Medicare primary EOB. Cited §10.1 COB coordination-to-zero requirement and OBRA 1990. Demanded $5,200 additional payment.',
        attachments: [
          { type: 'document', label: 'DemandLetter_UHC_HAR-428009.pdf' },
          { type: 'document', label: 'MedicareEOB_Primary_HAR-428009.pdf' },
        ],
      },
      result: {
        label: 'Partial Adjustment Authorized — $3,800',
        date: '2026-03-20',
        source: 'UHC-RESP-20260320-5512',
        description: 'UHC agreed $3,800 of the $5,200 is owed under COB. Remaining $1,400 attributed to benefit limit that caps UHC\'s secondary obligation. Finance reviewed and accepted — benefit limit position is contractually defensible.',
        attachments: [
          { type: 'document', label: 'UHCResponse_COBPartialAdjustment_20260320.pdf' },
        ],
      },
    },
  ],

  // Active — BCBS NCCI bundling (CPT 93306)
  'UP-2026-0071': [
    {
      id: 'ep-0071-1',
      round: 'Variance Identified',
      openedAt: '2026-03-15',
      signal: {
        label: '835 Remittance — CPT 93306 Bundled (CARC-97 / N70)',
        date: '2026-03-15',
        source: 'EFT-2026-0315-BCBS-553009',
        description: 'BCBS bundled CPT 93306 (echocardiography with Doppler) into the facility E&M under NCCI. Per CMS NCCI edits, these are separately billable in an outpatient setting with modifier -59. CARC-97 / N70. Variance $3,900.',
        attachments: [
          { type: '835_remit', label: '835_remit_BCBS_HAR-553009.edi', ref: 'UP-2026-0071' },
          { type: 'pdf_eop',   label: 'EOP_BCBS_HAR-553009.pdf' },
        ],
      },
    },
  ],

  // Active — UHC multiple procedure reduction error
  'UP-2026-0074': [
    {
      id: 'ep-0074-1',
      round: 'Variance Identified',
      openedAt: '2026-03-23',
      signal: {
        label: '835 Remittance — Incorrect Multiple Procedure Reduction',
        date: '2026-03-23',
        source: 'EFT-2026-0323-UHC-208441',
        description: 'UHC applied 50% multiple procedure reduction to all three procedures. Per contract, reduction applies only to the second procedure; third procedure billed with modifier -59 is a separately payable service. CARC-4. Variance $3,300.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-208441.edi', ref: 'UP-2026-0074' },
        ],
      },
    },
  ],

  // Active — Aetna unit count discrepancy
  'UP-2026-0079': [
    {
      id: 'ep-0079-1',
      round: 'Variance Identified',
      openedAt: '2026-03-21',
      signal: {
        label: '835 Remittance — 4 Units Billed, 2 Processed (J0696)',
        date: '2026-03-21',
        source: 'EFT-2026-0321-AET-008812',
        description: 'Aetna processed 2 units of J0696 (ceftriaxone 500mg) against 4 billed. No CARC or RARC provided on 835 for the unit reduction — inconsistent with 5010 EDI requirements. No denial letter issued. Variance $3,600.',
        attachments: [
          { type: '835_remit', label: '835_remit_Aetna_HAR-008812.edi', ref: 'UP-2026-0079' },
        ],
      },
    },
  ],

  // Active — UHC modifier -25 missing
  'UP-2026-0091': [
    {
      id: 'ep-0091-1',
      round: 'Variance Identified',
      openedAt: '2026-03-27',
      signal: {
        label: '835 Remittance — E&M Reduced 50% (Modifier -25 Absent)',
        date: '2026-03-27',
        source: 'EFT-2026-0327-UHC-661200',
        description: 'UHC applied CCI bundling and reduced 99214 E&M by 50% — CPT 11042 (wound debridement) was billed the same day without modifier -25 on the E&M. CDI review confirmed E&M was a separate, significant service. CARC-4. Variance $1,800.',
        attachments: [
          { type: '835_remit', label: '835_remit_UHC_HAR-661200.edi', ref: 'UP-2026-0091' },
        ],
      },
    },
  ],

  // Active — Aetna silent DRG downcode MS-DRG 391→392
  'UP-2026-0094': [
    {
      id: 'ep-0094-1',
      round: 'Variance Identified',
      openedAt: '2026-03-19',
      signal: {
        label: '835 Remittance — Silent DRG Downcode (391→392)',
        date: '2026-03-19',
        source: 'EFT-2026-0319-AET-330009',
        description: 'Aetna paid at MS-DRG 392 against billed MS-DRG 391. CARC-4 / N115. No audit notice or clinical review letter issued. CDI confirmed principal diagnosis supports 391. Variance $6,700.',
        attachments: [
          { type: '835_remit', label: '835_remit_Aetna_HAR-330009.edi', ref: 'UP-2026-0094' },
        ],
      },
    },
  ],

  // Active — BCBS COB secondary underpayment
  'UP-2026-0101': [
    {
      id: 'ep-0101-1',
      round: 'Variance Identified',
      openedAt: '2026-03-26',
      signal: {
        label: '835 Remittance — COB Secondary Payment Below Coordination Floor',
        date: '2026-03-26',
        source: 'EFT-2026-0326-BCBS-209771',
        description: 'Medicare primary paid $6,100. BCBS secondary paid $8,100 — but COB calculation should bring patient liability to zero. Patient still has $4,300 in cost-sharing after both payments. CARC-23.',
        attachments: [
          { type: '835_remit', label: '835_remit_BCBS_HAR-209771.edi', ref: 'UP-2026-0101' },
          { type: 'pdf_eop',   label: 'EOP_BCBS_HAR-209771.pdf' },
        ],
      },
    },
  ],

  // Active — Medicaid timely filing penalty
  'UP-2026-0104': [
    {
      id: 'ep-0104-1',
      round: 'Variance Identified',
      openedAt: '2026-03-06',
      signal: {
        label: '835 Remittance — Timely Filing Penalty Applied (CARC-29)',
        date: '2026-03-06',
        source: 'MCAID-835-20260306-661009',
        description: 'Medicaid applied a 50% payment penalty citing late filing. Original claim submitted within the 12-month window per 277-CA acknowledgment dated 2026-02-02. CARC-29. Variance $2,300.',
        attachments: [
          { type: '835_remit',   label: '835_remit_Medicaid_HAR-661009.edi', ref: 'UP-2026-0104' },
          { type: 'report_277',  label: '277-CA_Acknowledgment_20260202.edi' },
        ],
      },
    },
  ],

  // Closed — Will Not Pursue (Humana COB)
  'UP-2025-0812': [
    {
      id: 'ep-0812-1',
      round: 'Variance Identified',
      openedAt: '2025-11-09',
      signal: {
        label: '835 Remittance — COB Secondary Variance',
        date: '2025-11-09',
        source: 'EFT-20251109-HUM-008004',
        description: 'Humana secondary payment resulted in $600 COB variance. Below cost-of-pursuit threshold. CARC-23.',
        attachments: [
          { type: '835_remit', label: '835_remit_Humana_HAR-008004.edi', ref: 'UP-2025-0812' },
        ],
      },
    },
  ],
}
