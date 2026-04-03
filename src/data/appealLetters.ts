// ─── Template registry ────────────────────────────────────────────────────────

export interface AppealTemplate {
  id: string
  name: string
  payer: string | null      // null = generic fallback
  denialType: string
  description: string
}

// Templates ordered: payer-specific first, then generic fallback
export const APPEAL_TEMPLATES: AppealTemplate[] = [
  // BCBS
  { id: 'bcbs_drg',    name: 'BCBS DRG Downgrade',        payer: 'Blue Cross Blue Shield', denialType: 'DRG Downgrade',       description: 'BCBS-specific DRG appeal with MS-DRG weight analysis' },
  { id: 'bcbs_recoup', name: 'BCBS Recoupment Dispute',   payer: 'Blue Cross Blue Shield', denialType: 'Recoupment',          description: 'BCBS post-payment audit dispute template' },
  { id: 'bcbs_mednec', name: 'BCBS Medical Necessity',    payer: 'Blue Cross Blue Shield', denialType: 'Medical Necessity',   description: 'BCBS medical necessity appeal with InterQual criteria' },
  // Aetna
  { id: 'aet_drg',     name: 'Aetna DRG Downgrade',       payer: 'Aetna',                  denialType: 'DRG Downgrade',       description: 'Aetna DRG appeal with CPT/diagnosis crosswalk' },
  { id: 'aet_mednec',  name: 'Aetna Medical Necessity',   payer: 'Aetna',                  denialType: 'Medical Necessity',   description: 'Aetna med nec appeal referencing Aetna Clinical Policy Bulletin' },
  // UnitedHealthcare
  { id: 'uhc_auth',    name: 'UHC Authorization',         payer: 'UnitedHealthcare',        denialType: 'Authorization',       description: 'UHC emergency/retro auth appeal' },
  { id: 'uhc_timely',  name: 'UHC Timely Filing',         payer: 'UnitedHealthcare',        denialType: 'Timely Filing',       description: 'UHC timely filing appeal with clearinghouse proof' },
  // Cigna
  { id: 'cgn_mednec',  name: 'Cigna Medical Necessity',   payer: 'Cigna',                  denialType: 'Medical Necessity',   description: 'Cigna med nec appeal referencing Cigna Coverage Policy' },
  { id: 'cgn_admin',   name: 'Cigna Administrative',      payer: 'Cigna',                  denialType: 'Administrative',      description: 'Cigna corrected claim / administrative fix template' },
  // Medicare
  { id: 'mcr_adr',     name: 'Medicare ADR Response',     payer: 'Medicare',               denialType: 'ADR',                 description: 'Medicare ADR documentation response cover letter' },
  { id: 'mcr_coding',  name: 'Medicare Coding Correction',payer: 'Medicare',               denialType: 'Coding Error',        description: 'Medicare corrected claim with CDI attestation' },
  // Medicaid
  { id: 'mcd_elig',    name: 'Medicaid Eligibility',      payer: 'Medicaid',               denialType: 'Eligibility',         description: 'Medicaid eligibility dispute with coverage verification' },
  // Humana
  { id: 'hum_mednec',  name: 'Humana Medical Necessity',  payer: 'Humana',                 denialType: 'Medical Necessity',   description: 'Humana med nec appeal for LOS disputes' },
  // Generic fallbacks
  { id: 'gen_drg',     name: 'Generic DRG Downgrade',     payer: null, denialType: 'DRG Downgrade',       description: 'Standard DRG downgrade appeal' },
  { id: 'gen_mednec',  name: 'Generic Medical Necessity', payer: null, denialType: 'Medical Necessity',   description: 'Standard medical necessity appeal' },
  { id: 'gen_auth',    name: 'Generic Authorization',     payer: null, denialType: 'Authorization',       description: 'Standard prior authorization appeal' },
  { id: 'gen_timely',  name: 'Generic Timely Filing',     payer: null, denialType: 'Timely Filing',       description: 'Standard timely filing appeal' },
  { id: 'gen_coding',  name: 'Generic Coding Correction', payer: null, denialType: 'Coding Error',        description: 'Standard coding correction appeal' },
  { id: 'gen_elig',    name: 'Generic Eligibility',       payer: null, denialType: 'Eligibility',         description: 'Standard eligibility dispute' },
  { id: 'gen_admin',   name: 'Generic Administrative',    payer: null, denialType: 'Administrative',      description: 'Standard administrative correction appeal' },
  { id: 'gen_recoup',  name: 'Generic Recoupment Dispute',payer: null, denialType: 'Recoupment',          description: 'Standard post-payment audit dispute' },
  { id: 'gen_adr',     name: 'Generic ADR Response',      payer: null, denialType: 'ADR',                 description: 'Standard ADR documentation response' },
  { id: 'gen_underpayment',  name: 'Payment Dispute — Contracted Rate',  payer: null,                      denialType: 'Underpayment', description: 'Standard payment dispute citing contractual rate discrepancy' },
  { id: 'uhc_underpayment',  name: 'UHC Payment Dispute',                payer: 'UnitedHealthcare',         denialType: 'Underpayment', description: 'UHC-specific payment dispute with contract reference' },
  { id: 'aet_underpayment',  name: 'Aetna Payment Dispute',              payer: 'Aetna',                    denialType: 'Underpayment', description: 'Aetna payment dispute for case rate vs fee schedule disputes' },
]

export function getDefaultTemplate(payer: string, denialType: string): AppealTemplate {
  const payerMatch = APPEAL_TEMPLATES.find(t => t.payer === payer && t.denialType === denialType)
  if (payerMatch) return payerMatch
  const generic = APPEAL_TEMPLATES.find(t => t.payer === null && t.denialType === denialType)
  return generic ?? APPEAL_TEMPLATES[APPEAL_TEMPLATES.length - 1]!
}

export function getAvailableTemplates(denialType: string): AppealTemplate[] {
  return APPEAL_TEMPLATES.filter(t => t.denialType === denialType)
}

// ─── Submission instructions (parsed from denial letter) ──────────────────────

export interface SubmissionInstructions {
  appealAddress?: string
  deadline?: string
  referenceRequired?: string
  portalUrl?: string
  portalName?: string
  faxNumber?: string
  notes?: string
  instructions?: string
}

// ─── Pre-generated appeal letters ─────────────────────────────────────────────

export interface AppealLetter {
  templateId: string
  html: string
  submissionInstructions: SubmissionInstructions
}

export const APPEAL_LETTERS: Record<string, AppealLetter> = {

  'DN-2026-0412': {
    templateId: 'bcbs_drg',
    submissionInstructions: {
      appealAddress: 'Blue Cross Blue Shield Appeals Unit\nP.O. Box 10864\nChicago, IL 60610',
      deadline: 'April 6, 2026 (within 30 days of denial date)',
      referenceRequired: 'Claim ID CLM-8847291 · Member ID BCBS-XYZ-104823-01',
      portalUrl: 'https://provider.bcbs.com/appeals',
      faxNumber: '1-800-555-2847',
      notes: 'Include this letter, physician attestation, and complete medical record.',
    },
    html: `<h2>Level 1 Clinical Appeal — DRG Downgrade</h2>

<p>April 2, 2026</p>

<p>
Blue Cross Blue Shield Appeals Unit<br/>
P.O. Box 10864<br/>
Chicago, IL 60610
</p>

<p><strong>RE:</strong> Appeal of DRG Downgrade — Claim CLM-8847291<br/>
<strong>Patient:</strong> Margaret Holloway · DOB: 03/17/1951 · MRN: MRN-104823<br/>
<strong>Member ID:</strong> BCBS-XYZ-104823-01<br/>
<strong>Date of Service:</strong> February 14–17, 2026<br/>
<strong>Billed DRG:</strong> MS-DRG 291 (Heart Failure and Shock with MCC)<br/>
<strong>Paid DRG:</strong> MS-DRG 292 (Heart Failure and Shock with CC)<br/>
<strong>Denied Amount:</strong> $4,210.00</p>

<p>Dear Blue Cross Blue Shield Appeals Unit,</p>

<p>Memorial Health System respectfully submits this Level 1 clinical appeal of your decision to downgrade the DRG assignment for the above-referenced claim from MS-DRG 291 to MS-DRG 292. We contend that the original MS-DRG 291 assignment is clinically and coding-accurate, supported by the complete medical record, and that the downgrade results in significant underpayment for the complexity of care rendered.</p>

<h3>Clinical Summary</h3>

<p>Ms. Holloway, a 74-year-old female with a history of heart failure (LVEF 28% on most recent echocardiogram), type 2 diabetes, and hypertension, was admitted on February 14, 2026, with acute decompensated heart failure. Admission findings included:</p>

<ul>
  <li>BNP 1,842 pg/mL (markedly elevated, consistent with severe decompensation)</li>
  <li>Ejection fraction 28% on admission echocardiography</li>
  <li>Bilateral crackles, peripheral edema, and orthopnea</li>
  <li>Chest X-ray: pulmonary vascular congestion with bilateral pleural effusions</li>
  <li>Concurrent right lower lobe pneumonia: fever 38.6°C, WBC 14,200/μL, CRP elevated</li>
</ul>

<h3>Basis for MS-DRG 291 Assignment</h3>

<p>MS-DRG 291 requires a principal diagnosis of heart failure with at least one Major Complication or Comorbidity (MCC). The documented secondary diagnosis of pneumonia (ICD-10-CM J18.9 — Pneumonia, unspecified organism) qualifies as an MCC under the CMS MS-DRG grouper Version 41.0. This was an actively treated concurrent condition requiring IV antibiotics, with documented fever, leukocytosis, and chest imaging findings, not merely a chronic background condition.</p>

<p>The concurrent treatment of pneumonia alongside acute decompensated heart failure materially increased the complexity of care: the patient required IV ceftriaxone, continuous cardiac telemetry, IV furosemide diuresis, daily renal function monitoring, and respiratory assessment — care that would not have been required for heart failure alone.</p>

<h3>Supporting Documentation Enclosed</h3>

<ul>
  <li>Complete inpatient medical record (Feb 14–17, 2026)</li>
  <li>Attending physician attestation — Dr. Anita Khoury, MD</li>
  <li>Echocardiography report (Feb 14, 2026)</li>
  <li>Chest X-ray report (Feb 14, 2026)</li>
  <li>Lab results: CBC, BMP, BNP, CRP (admission and serial)</li>
  <li>MS-DRG grouper output confirming J18.9 as MCC</li>
</ul>

<h3>Conclusion and Request</h3>

<p>We respectfully request that BCBS restore the original MS-DRG 291 assignment and reprocess this claim with the additional payment of $4,210.00. The clinical documentation clearly supports the MCC designation for the concurrent pneumonia diagnosis, and the downgrade to MS-DRG 292 does not reflect the medical complexity or resource intensity of this admission.</p>

<p>Please contact our Appeals Coordinator at (312) 555-0100 with any questions. We look forward to your response within the 30-day appeal review window.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System<br/>
123 Medical Center Drive, Chicago, IL 60601<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0389': {
    templateId: 'aet_mednec',
    submissionInstructions: {
      appealAddress: 'Aetna Medical Appeals\nP.O. Box 981106\nEl Paso, TX 79998-1106',
      deadline: 'April 23, 2026 (within 180 days of denial)',
      referenceRequired: 'Claim ID CLM-9920441 · Member ID AET-091247-GRP',
      portalUrl: 'https://www.aetna.com/providers/appeals',
      faxNumber: '1-860-975-3808',
      notes: 'Aetna requires use of their standard appeal form (CAS-1) as a cover sheet.',
    },
    html: `<h2>Level 1 Medical Necessity Appeal</h2>

<p>April 2, 2026</p>

<p>
Aetna Medical Appeals<br/>
P.O. Box 981106<br/>
El Paso, TX 79998-1106
</p>

<p><strong>RE:</strong> Appeal of Medical Necessity Denial — Claim CLM-9920441<br/>
<strong>Patient:</strong> Raymond Castellano · DOB: 11/04/1963 · MRN: MRN-091247<br/>
<strong>Member ID:</strong> AET-091247-GRP<br/>
<strong>Date of Service:</strong> February 18–21, 2026<br/>
<strong>Denial Reason:</strong> Inpatient stay not medically necessary (CARC-50 / M86)<br/>
<strong>Denied Amount:</strong> $12,480.00</p>

<p>Dear Aetna Medical Appeals,</p>

<p>Memorial Health System submits this Level 1 appeal of your denial of inpatient medical necessity for the above-referenced admission. We assert that the inpatient admission of Mr. Castellano was medically necessary and appropriate, and that Aetna's denial is inconsistent with published InterQual criteria and applicable clinical standards of care.</p>

<h3>Clinical Presentation</h3>

<p>Mr. Castellano, a 62-year-old male with a history of diverticular disease and poorly controlled type 2 diabetes (HbA1c 9.1%), presented on February 18, 2026, with:</p>

<ul>
  <li>Acute left lower quadrant pain with rebound tenderness</li>
  <li>Fever 38.9°C and nausea/vomiting preventing oral intake</li>
  <li>CT abdomen/pelvis: pericolic fat stranding and sigmoid thickening consistent with acute diverticulitis</li>
  <li>Inability to tolerate oral antibiotics due to active nausea and vomiting</li>
</ul>

<h3>Medical Necessity Analysis</h3>

<p>Inpatient admission was required for the following reasons, each of which independently satisfies InterQual 2026 criteria for acute diverticulitis:</p>

<ol>
  <li><strong>Immunocompromise:</strong> HbA1c of 9.1% reflects poorly controlled diabetes, which is a recognized risk factor for rapid progression to diverticular perforation, abscess, and sepsis. InterQual criteria explicitly cite immunocompromised states as an indicator for inpatient admission for acute diverticulitis.</li>
  <li><strong>Inability to tolerate oral antibiotics:</strong> The patient was actively vomiting on presentation and unable to take or retain oral medications for the first 48 hours. IV antibiotic administration (metronidazole + ciprofloxacin) was required.</li>
  <li><strong>NPO and IV hydration:</strong> Bowel rest required NPO status with IV fluid maintenance for 48 hours — not feasible in an outpatient setting.</li>
  <li><strong>Monitoring for perforation:</strong> Given the immunocompromised state and severity of presentation, close monitoring for perforation and septic progression was medically necessary.</li>
</ol>

<h3>Response to Denial Rationale</h3>

<p>Aetna's denial cites CARC-50 (not medically necessary) with RARC M86 (duplicate service window). We note that this is not a duplicate service — the patient had no prior admission for diverticulitis in the preceding 12 months. The M86 remark appears to have been applied in error. The clinical record clearly establishes the acute, distinct nature of this admission.</p>

<h3>Conclusion</h3>

<p>We respectfully request that Aetna overturn this denial and reimburse the full denied amount of $12,480.00. The inpatient admission met criteria for medical necessity on multiple independent grounds. Please respond within the 30-day review period required under applicable state law and your member's benefit plan.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0377': {
    templateId: 'uhc_auth',
    submissionInstructions: {
      appealAddress: 'UnitedHealthcare Appeals\nP.O. Box 30432\nSalt Lake City, UT 84130-0432',
      deadline: 'April 16, 2026 (within 14 days per expedited appeal guidelines)',
      referenceRequired: 'Claim ID CLM-6634882 · Member ID UHC-318740-EMP',
      portalUrl: 'https://www.uhcprovider.com/appeals',
      faxNumber: '1-866-699-6998',
      notes: 'Submit as expedited appeal given clinical urgency. Include authorization request documentation.',
    },
    html: `<h2>Emergency Authorization Appeal — Retrospective Authorization Request</h2>

<p>April 2, 2026</p>

<p>
UnitedHealthcare Provider Appeals<br/>
P.O. Box 30432<br/>
Salt Lake City, UT 84130-0432
</p>

<p><strong>RE:</strong> Appeal of Authorization Denial — Claim CLM-6634882<br/>
<strong>Patient:</strong> James Okafor · DOB: 05/30/1958 · MRN: MRN-318740<br/>
<strong>Member ID:</strong> UHC-318740-EMP<br/>
<strong>Date of Service:</strong> March 1–4, 2026<br/>
<strong>Denial Reason:</strong> No prior authorization on file (CARC-15 / N130)<br/>
<strong>Denied Amount:</strong> $6,750.00</p>

<p>Dear UnitedHealthcare Provider Appeals,</p>

<p>Memorial Health System submits this urgent appeal of the denial of claim CLM-6634882 on the basis that the services rendered were emergent in nature, prior authorization was not obtainable prior to treatment, and the denial contradicts the terms of the member's benefit plan and applicable law.</p>

<h3>Emergency Presentation</h3>

<p>Mr. Okafor presented via EMS on March 1, 2026, with acute ST-elevation myocardial infarction (STEMI) of the LAD territory, confirmed on 12-lead ECG within minutes of arrival. The following timeline illustrates the emergent nature of the intervention:</p>

<ul>
  <li><strong>08:12</strong> — Patient arrival by EMS</li>
  <li><strong>08:14</strong> — STEMI identified on ECG, cath lab activated</li>
  <li><strong>08:27</strong> — Patient transferred to cardiac catheterization suite</li>
  <li><strong>09:06</strong> — PCI with LAD stenting completed (door-to-balloon: 54 minutes)</li>
</ul>

<p>A 54-minute door-to-balloon time was achieved — this reflects the urgency with which the clinical team operated. Any delay to obtain prior authorization would have resulted in irreversible myocardial damage or death.</p>

<h3>Legal and Contractual Basis for This Appeal</h3>

<p>Prior authorization is not required — and cannot be denied retroactively — for emergency services under:</p>

<ul>
  <li>The patient's UnitedHealthcare plan Evidence of Coverage, Section 4.3 (Emergency Services)</li>
  <li>The No Surprises Act (42 U.S.C. § 300gg-111), which prohibits prior authorization requirements for emergency services</li>
  <li>Illinois Insurance Code § 356z.3a — Emergency services must be covered without prior authorization</li>
</ul>

<p>Post-service notification was provided to UnitedHealthcare on March 3, 2026, within the 48-hour notification window specified in the member's plan documents.</p>

<h3>Conclusion</h3>

<p>We respectfully demand that UnitedHealthcare immediately overturn this denial and reimburse $6,750.00 for the emergent services provided. The application of CARC-15 to an acute STEMI intervention is clinically indefensible and legally impermissible. Should UHC uphold this denial, we reserve the right to escalate to the Illinois Department of Insurance and pursue external independent review.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0278': {
    templateId: 'mcr_adr',
    submissionInstructions: {
      appealAddress: 'Noridian Healthcare Solutions (Medicare MAC — Jurisdiction F)\nP.O. Box 6704\nFargo, ND 58108-6704',
      deadline: 'April 30, 2026 (45-day ADR response window)',
      referenceRequired: 'ICN MCR-ADR-20260321-9876541 · Medicare ID Medicare-043881-B',
      faxNumber: '1-701-277-6000',
      notes: 'Respond to ADR within 45 days to preserve appeal rights. Include cover letter and all requested records.',
    },
    html: `<h2>Response to Additional Documentation Request (ADR)</h2>

<p>April 2, 2026</p>

<p>
Noridian Healthcare Solutions<br/>
Medicare Administrative Contractor — Jurisdiction F<br/>
P.O. Box 6704<br/>
Fargo, ND 58108-6704
</p>

<p><strong>RE:</strong> ADR Response — ICN MCR-ADR-20260321-9876541<br/>
<strong>Patient:</strong> Sylvia Moreau · DOB: 01/29/1953 · MRN: MRN-043881<br/>
<strong>Medicare ID:</strong> Medicare-043881-B<br/>
<strong>Date of Service:</strong> February 10–14, 2026<br/>
<strong>ADR Received:</strong> March 21, 2026<br/>
<strong>Claim Amount:</strong> $4,110.00</p>

<p>Dear Noridian Healthcare Solutions,</p>

<p>Memorial Health System responds to your Additional Documentation Request (ADR) dated March 21, 2026, for the above-referenced claim. We provide the following documentation in support of our claim for inpatient services rendered to Ms. Sylvia Moreau from February 10–14, 2026.</p>

<h3>Clinical Justification for Inpatient Admission</h3>

<p>Ms. Moreau, a 73-year-old female with relapsing-remitting multiple sclerosis and secondary paraplegia, was admitted February 10, 2026, following acute neurological exacerbation. The attending neurologist, Dr. Thomas Carey, MD, determined that inpatient admission was required based on:</p>

<ul>
  <li><strong>Severity of exacerbation:</strong> Rapid deterioration in bilateral upper extremity function over 72 hours, with new onset bladder dysfunction</li>
  <li><strong>High-dose IV corticosteroid therapy:</strong> IV methylprednisolone 1g/day for 3 days — requires inpatient monitoring for adverse effects including hyperglycemia, hypertension, and fluid retention</li>
  <li><strong>Concurrent urinary tract infection:</strong> UA with culture positive for E. coli; required IV ceftriaxone with appropriate monitoring</li>
  <li><strong>Functional status:</strong> Patient's paraplegia and acute upper extremity deterioration made outpatient infusion unsafe and logistically impossible</li>
</ul>

<h3>Medicare LCD Compliance</h3>

<p>This admission complies with Medicare Local Coverage Determination L35082 (Multiple Sclerosis) and CMS criteria for inpatient admission under the Two-Midnight Rule: the treating physician expected and documented that the patient's clinical condition required hospital-level care for greater than two midnights, and the clinical record confirms this expectation was medically reasonable.</p>

<h3>Documents Enclosed</h3>

<ul>
  <li>Complete inpatient medical record (Feb 10–14, 2026)</li>
  <li>Attending physician attestation — Dr. Thomas Carey, MD</li>
  <li>Neurology consultation notes</li>
  <li>Nursing flowsheets: neurological assessment and vital sign monitoring</li>
  <li>Medication administration record: IV methylprednisolone and ceftriaxone</li>
  <li>Urinalysis and culture results</li>
  <li>Discharge summary with functional status documentation</li>
</ul>

<p>We trust that the enclosed documentation satisfactorily addresses the ADR. Should you require additional information, please contact our Appeals Coordinator at (312) 555-0100.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Medical Records Department</strong><br/>
Memorial Health System<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0305': {
    templateId: 'uhc_timely',
    submissionInstructions: {
      appealAddress: 'UnitedHealthcare Claims Appeals\nP.O. Box 30432\nSalt Lake City, UT 84130',
      deadline: 'April 4, 2026 (URGENT — 2 days remaining)',
      referenceRequired: 'Claim ID CLM-2209115 · Member ID UHC-834512-PPO',
      portalUrl: 'https://www.uhcprovider.com/appeals',
      faxNumber: '1-866-699-6998',
      notes: 'Attach 277-CA acknowledgment as primary evidence. Submit via portal or fax immediately.',
    },
    html: `<h2>Timely Filing Appeal — Proof of Electronic Claim Transmission</h2>

<p>April 2, 2026</p>

<p>
UnitedHealthcare Claims Appeals<br/>
P.O. Box 30432<br/>
Salt Lake City, UT 84130
</p>

<p><strong>RE:</strong> Appeal of Timely Filing Denial — Claim CLM-2209115<br/>
<strong>Patient:</strong> Helen Nakamura · DOB: 04/11/1967 · MRN: MRN-834512<br/>
<strong>Member ID:</strong> UHC-834512-PPO<br/>
<strong>Date of Service:</strong> November 18, 2025<br/>
<strong>Denial Reason:</strong> Claim received after 90-day filing limit (CARC-29)<br/>
<strong>Denied Amount:</strong> $2,130.00</p>

<p>Dear UnitedHealthcare Claims Appeals,</p>

<p>Memorial Health System appeals the denial of claim CLM-2209115 on the basis that the claim was submitted electronically on November 18, 2025 — the same date as the date of service — well within UnitedHealthcare's 90-day timely filing window. The denial citing CARC-29 is inconsistent with our clearinghouse records and the 277-CA transaction acknowledgment attached hereto.</p>

<h3>Proof of Timely Filing</h3>

<p>The following documentation confirms electronic submission of this claim on November 18, 2025:</p>

<ul>
  <li><strong>277-CA Transaction Acknowledgment:</strong> Change Healthcare clearinghouse confirms claim receipt and acceptance on November 18, 2025 at 14:32 CST. The ISA Control Number and transaction-level acknowledgment are attached.</li>
  <li><strong>Clearinghouse Submission Log:</strong> Batch ID 20251118-UHC-MHS-447 confirms the claim was included in the November 18 submission batch accepted by UHC's trading partner.</li>
  <li><strong>Claim Accepted Status:</strong> The 277-CA indicates a Claim Status Category Code of A1 (Accepted for Adjudication), confirming UHC's payer system received and accepted the claim.</li>
</ul>

<h3>UHC Contractual and Policy Obligations</h3>

<p>Per the Memorial Health System participating provider agreement with UnitedHealthcare, a claim is considered timely filed on the date of electronic transmission as confirmed by clearinghouse acknowledgment. The 90-day clock runs from the date of service to the date of transmission — not the date of adjudication. The 277-CA acknowledgment constitutes conclusive proof of timely filing under this standard.</p>

<h3>Conclusion</h3>

<p>We respectfully request that UnitedHealthcare overturn the CARC-29 denial and process claim CLM-2209115 for payment of $2,130.00. The timely filing requirement was unambiguously satisfied. Please escalate this review given the approaching appeal deadline of April 4, 2026.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0331': {
    templateId: 'bcbs_recoup',
    submissionInstructions: {
      appealAddress: 'Blue Cross Blue Shield Post-Payment Audit Appeals\nP.O. Box 10864\nChicago, IL 60610',
      deadline: 'April 8, 2026 (6 days remaining — 30-day recoupment dispute window)',
      referenceRequired: 'Recoupment Ref BCBS-RCQ-20260319 · Claim CLM-3317661',
      faxNumber: '1-800-555-2847',
      notes: 'Must dispute within 30 days of recoupment notice to stay recoupment action.',
    },
    html: `<h2>Post-Payment Audit Dispute — MS-DRG Recoupment</h2>

<p>April 2, 2026</p>

<p>
Blue Cross Blue Shield Post-Payment Audit Appeals<br/>
P.O. Box 10864<br/>
Chicago, IL 60610
</p>

<p><strong>RE:</strong> Dispute of Recoupment Demand — BCBS-RCQ-20260319<br/>
<strong>Patient:</strong> Nancy Whitfield · DOB: 06/08/1949 · MRN: MRN-612847<br/>
<strong>Member ID:</strong> BCBS-XYZ-612847-02<br/>
<strong>Date of Service:</strong> January 30 – February 3, 2026<br/>
<strong>Billed DRG:</strong> MS-DRG 682 (Renal Failure with MCC)<br/>
<strong>Recoupment Amount:</strong> $8,920.00</p>

<p>Dear Blue Cross Blue Shield Post-Payment Audit Team,</p>

<p>Memorial Health System formally disputes the recoupment demand dated March 19, 2026, in the amount of $8,920.00. We assert that the original DRG assignment of MS-DRG 682 is clinically accurate, coded in compliance with ICD-10-CM Official Guidelines, and fully supported by the medical record. We respectfully request that BCBS withdraw the recoupment demand and confirm that no offset will be applied.</p>

<h3>Clinical Overview</h3>

<p>Ms. Whitfield, a 76-year-old female with stage 3 chronic kidney disease and hypertension, was admitted January 30, 2026, with acute kidney injury superimposed on CKD in the setting of urosepsis. Clinical findings on admission:</p>

<ul>
  <li>Creatinine 6.9 mg/dL (baseline 1.8 mg/dL) — AKI criteria met</li>
  <li>Sepsis confirmed: fever 39.1°C, HR 114, WBC 22,000/μL, positive urine culture (E. coli)</li>
  <li>Emergent central venous access and continuous venovenous hemofiltration (CVVH) initiated</li>
</ul>

<h3>DRG Assignment Analysis</h3>

<p>MS-DRG 682 (Renal Failure with MCC) requires a principal diagnosis of renal failure with an accompanying Major Complication or Comorbidity. The documented secondary diagnosis of sepsis (ICD-10-CM A41.9 — Sepsis, unspecified organism) is explicitly listed as an MCC in the CMS MS-DRG Definitions Manual, Version 41.0, Table 6.P. This is not a disputed classification — sepsis is universally recognized as an MCC.</p>

<p>Our coding compliance team and CDI specialist have independently reviewed the complete medical record and confirmed:</p>

<ul>
  <li>Sepsis (A41.9) was actively diagnosed and treated during this admission</li>
  <li>Clinical documentation satisfies Sepsis-3 criteria (SOFA score ≥ 2)</li>
  <li>The diagnosis was present, documented, and clinically supported</li>
  <li>Coding was performed in compliance with ICD-10-CM guidelines and facility coding policy</li>
</ul>

<h3>Conclusion</h3>

<p>The recoupment demand is not supported by a valid clinical or coding basis. We request that BCBS withdraw the recoupment and provide written confirmation within 10 business days. If BCBS maintains its position, we request a peer-to-peer review with the reviewing physician and reserve all rights to external appeal.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System<br/>
Phone: (312) 555-0100 · Fax: (312) 555-0199
</p>`,
  },

  'DN-2026-0521': {
    templateId: 'uhc_underpayment',
    submissionInstructions: {
      faxNumber: '1-877-294-6380',
      portalName: 'UHC Provider Portal',
      portalUrl: 'https://www.uhcprovider.com',
      instructions: 'Submit payment disputes via UHC Provider Portal under Claims > Payment Disputes, or fax with cover sheet referencing the claim ID and contract citation.',
    },
    html: `<p>April 3, 2026</p>
<p>UnitedHealthcare Provider Appeals<br/>P.O. Box 30432<br/>Salt Lake City, UT 84130</p>
<p><strong>RE: Payment Dispute — Underpayment on Claim CLM-9921847</strong><br/>
Patient: Harold Simmons | MRN: MRN-109432<br/>
Date of Service: February 18, 2026<br/>
Procedure: Coronary Artery Bypass, Arterial (CPT 33533)<br/>
Claim Amount Billed: $48,200.00 | Amount Paid: $8,430.00 | Contractual Rate: $13,250.00</p>
<p>Dear UnitedHealthcare Provider Disputes Department,</p>
<p>Memorial Health System is formally disputing the payment issued for the above-referenced claim. UnitedHealthcare remitted $8,430.00 for the coronary artery bypass procedure performed on February 18, 2026. This payment is incorrect and does not reflect the negotiated case rate established in our current contractual agreement.</p>
<p>Per the UHC Memorial Health System Agreement 2024, Appendix B, Rate Schedule §4.2, the contracted case rate for CABG procedures (CPT 33533) performed in an inpatient setting is $13,250.00. The payment issued ($8,430.00) reflects UnitedHealthcare's commercial fee schedule rather than the applicable negotiated case rate, resulting in an underpayment of $4,820.00.</p>
<p>We respectfully request that UnitedHealthcare review the payment issued against the contract terms and remit the balance of $4,820.00 within 30 days. Supporting documentation, including the relevant contract excerpt and the original claim, is attached for your reference.</p>
<p>If you have questions or require additional information, please contact our Provider Relations team at (555) 234-7890.</p>
<p>Sincerely,<br/>Revenue Cycle Management<br/>Memorial Health System</p>`,
  },
  'DN-2026-0538': {
    templateId: 'aet_underpayment',
    submissionInstructions: {
      faxNumber: '1-860-273-0123',
      portalName: 'Availity',
      portalUrl: 'https://www.availity.com',
      instructions: 'Submit via Availity Claims & Payments > Dispute a Claim, or fax to Aetna Provider Disputes with claim ID and contract section cited in the cover letter.',
    },
    html: `<p>April 3, 2026</p>
<p>Aetna Provider Dispute Resolution<br/>P.O. Box 14079<br/>Lexington, KY 40512</p>
<p><strong>RE: Payment Dispute — Underpayment on Claim CLM-6634019</strong><br/>
Patient: Beverly Santos | MRN: MRN-204417<br/>
Date of Service: March 1, 2026<br/>
Procedure: Total Knee Arthroplasty (CPT 27447)<br/>
Claim Amount Billed: $38,900.00 | Amount Paid: $9,445.00 | Contractual Rate: $11,750.00</p>
<p>Dear Aetna Provider Dispute Resolution Team,</p>
<p>Memorial Health System is filing a formal payment dispute regarding the reimbursement issued for the above-referenced inpatient claim. Aetna remitted $9,445.00 for the total knee arthroplasty performed on March 1, 2026. This payment does not reflect the applicable inpatient case rate under our current contract.</p>
<p>Pursuant to the Aetna Memorial Health System Agreement 2024, Schedule A, Inpatient Case Rates §2.1, the negotiated inpatient case rate for total knee arthroplasty (CPT 27447) is $11,750.00. The remittance of $9,445.00 corresponds to the outpatient ambulatory rate and is not applicable to this inpatient admission, resulting in an underpayment of $2,305.00.</p>
<p>We request that Aetna review the applicable contract schedule and reprocess this claim under the correct inpatient case rate, remitting the outstanding balance of $2,305.00. The relevant contract excerpt, inpatient admission documentation, and the original claim are enclosed.</p>
<p>Please respond within 30 days as required under the terms of our agreement. For questions, contact our Revenue Cycle team at (555) 234-7890.</p>
<p>Sincerely,<br/>Revenue Cycle Management<br/>Memorial Health System</p>`,
  },
}

// Fallback letter for denials without a specific pre-generated letter
export function getGenericLetter(denialId: string, patientName: string, payer: string, denialType: string, deniedAmount: number): string {
  return `<h2>${denialType} Appeal</h2>

<p>${new Date('2026-04-02').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

<p>${payer} Appeals Department</p>

<p><strong>RE:</strong> Appeal of ${denialType} Denial<br/>
<strong>Patient:</strong> ${patientName}<br/>
<strong>Denial ID:</strong> ${denialId}<br/>
<strong>Denied Amount:</strong> $${deniedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>

<p>Dear ${payer} Appeals Department,</p>

<p>Memorial Health System respectfully submits this appeal of the denial referenced above. We believe this denial was issued in error and request a thorough review of the enclosed clinical documentation.</p>

<h3>Clinical Basis for Appeal</h3>

<p>The services provided were medically necessary and appropriate for the patient's condition. [Clinical details to be added based on medical record review.]</p>

<h3>Supporting Documentation</h3>

<ul>
  <li>Complete medical record</li>
  <li>Physician attestation</li>
  <li>Relevant diagnostic results</li>
</ul>

<h3>Conclusion</h3>

<p>We respectfully request that this denial be overturned and the claim reprocessed for full payment. Please contact our Appeals Coordinator at (312) 555-0100 with any questions.</p>

<p>Respectfully submitted,</p>

<p>
<strong>Revenue Cycle Management — Appeals Department</strong><br/>
Memorial Health System
</p>`
}

// ─── Payer-level submission instructions (fallback when no denial-specific letter) ─

const PAYER_SUBMISSION_INSTRUCTIONS: Record<string, SubmissionInstructions> = {
  'Blue Cross Blue Shield': {
    appealAddress: 'Blue Cross Blue Shield Appeals Unit\nP.O. Box 10864\nChicago, IL 60610',
    notes: 'Include claim number and member ID on all correspondence. Allow 30–60 days for review.',
  },
  'Aetna': {
    appealAddress: 'Aetna Medical Appeals\nP.O. Box 981106\nEl Paso, TX 79998-1106',
    notes: 'Standard appeal window: 180 days from denial date. Expedited appeals: 72 hours.',
  },
  'UnitedHealthcare': {
    appealAddress: 'UnitedHealthcare Appeals\nP.O. Box 30432\nSalt Lake City, UT 84130-0432',
    portalUrl: 'https://www.uhcprovider.com/appeals',
    notes: 'Standard appeal window: 60 days from denial date.',
  },
  'Cigna': {
    appealAddress: 'Cigna Appeals\nP.O. Box 188011\nChattanooga, TN 37422',
    faxNumber: '1-800-336-4279',
    notes: 'Standard appeal window: 180 days from denial date.',
  },
  'Humana': {
    appealAddress: 'Humana Provider Appeals\nP.O. Box 14601\nLexington, KY 40512-4601',
    notes: 'Standard appeal window: 60 days from denial date.',
  },
  'Palmetto GBA (Medicare)': {
    appealAddress: 'Palmetto GBA Appeals\nP.O. Box 100238\nColumbia, SC 29202',
    notes: 'Medicare redetermination window: 120 days from denial date.',
  },
  'Medicare': {
    appealAddress: 'Medicare Administrative Contractor\nSee denial notice for MAC address',
    notes: 'Redetermination window: 120 days. ALJ hearing: 60 days after QIC reconsideration.',
  },
  'Medicaid': {
    appealAddress: 'State Medicaid Agency Appeals Unit\nSee denial notice for address',
    notes: 'Appeal windows vary by state. Check denial notice for specific deadlines.',
  },
}

export function getSubmissionInstructions(denialId: string, payer: string): SubmissionInstructions {
  return APPEAL_LETTERS[denialId]?.submissionInstructions
    ?? PAYER_SUBMISSION_INSTRUCTIONS[payer]
    ?? { notes: 'Refer to denial notice for submission instructions.' }
}
