// ─── Case Data ───────────────────────────────────────────────────────────────
// Sourced from: docs/demo-denial-letter.pdf (Optum/Wellcare denial, Aug 2024)

export const MOCK_CASE = {
  id: 'case-001',
  patientName: 'Susan Smith',
  memberID: 'ABC123456789',
  patientAccount: '10000060427497',
  patientAccountNo: 'P1000000000',
  caseID: '123456789012345',
  claimNumber: '1234567890',
  har: '1010026790',
  mrn: 'N/A',
  visitId: 'N/A',
  dob: '01/15/1965',
  admitDate: '06/01/2024',
  dischargeDate: '06/05/2024',
  denialDate: '08/06/2024',
  appealDeadline: '09/30/2026',
  totalBilledAmount: '$25,303.68',
  payer: 'Wellcare',
  type: 'DRG Downgrade',
  location: 'DEMO',
  level: 'Level 2',
  status: 'Ready for Review',
  submittedDate: null,
  overturnedDate: null,
  rating: 0,
  startedAt: 'Mar 17, 2026 at 9:30 AM PT',
  startedBy: 'Krista Soriano',
  denialDescription:
    'Recommend revised DRG due to incorrectly assigned/unsupported principal diagnosis.',
  additionalRemarks:
    'Per review by RN, payment of DRG 871 is not supported. Review supports DRG 194. A review of the medical records did not validate A41.9 Sepsis, unspecified organism as the principal diagnosis and R65.20 Severe sepsis without septic shock and J96.21 Acute and chronic respiratory failure with hypoxia as secondary diagnoses for this admission. The principal and secondary diagnoses are the determining elements for MS DRG assignment and payment.',
};

// ─── DRG Codes ────────────────────────────────────────────────────────────────

export const MOCK_DRG_CODES = [
  { type: 'added',   code: '194',    description: 'SIMPLE PNEUMONIA AND PLEURISY WITH CC' },
  { type: 'removed', code: '871',    description: 'SEPTICEMIA OR SEVERE SEPSIS WITHOUT MV >96 HOURS WITH MCC' },
  { type: 'removed', code: 'A41.9',  description: 'Sepsis, unspecified organism' },
  { type: 'removed', code: 'R65.20', description: 'Severe sepsis without septic shock' },
  { type: 'removed', code: 'J96.21', description: 'Acute and chronic respiratory failure with hypoxia' },
];

// ─── Supporting Evidence ──────────────────────────────────────────────────────

export const MOCK_EVIDENCE = [
  { id: 1, condition: 'Suspected Sepsis',        count: 3, strength: 'Strong',   strengthColor: '#2E7D32' },
  { id: 2, condition: 'Positive Urine Culture',  count: 1, strength: 'Low',      strengthColor: '#C62828' },
  { id: 3, condition: 'Multiple Sirs Criteria',  count: 2, strength: 'Moderate', strengthColor: '#E65100' },
  { id: 4, condition: 'Acute Kidney Injury',     count: 4, strength: 'Strong',   strengthColor: '#2E7D32' },
  { id: 5, condition: 'Respiratory Failure',     count: 3, strength: 'Strong',   strengthColor: '#2E7D32' },
  { id: 6, condition: 'Acute Respiratory Failure', count: 2, strength: 'Moderate', strengthColor: '#E65100' },
];

// ─── Case Activity (per level) ────────────────────────────────────────────────

export const MOCK_ACTIVITY_BY_LEVEL = {
  'Level 1': [],
  'Level 2': [
    {
      id: 1,
      action: 'Denial Uploaded',
      date: '2026-03-17',
      user: 'Krista Soriano',
      hasDenialLink: true,
    },
    {
      id: 2,
      action: 'Appeal is Ready for Review',
      date: '2026-03-17',
      user: 'SmarterDx',
      hasAppealLink: true,
    },
    {
      id: 3,
      action: 'Appeal is Ready for Review',
      date: '2026-03-17',
      user: 'SmarterDx',
      hasAppealLink: true,
    },
  ],
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const MOCK_COMMENTS = [];

// ─── Documents ────────────────────────────────────────────────────────────────

export const MOCK_DOCUMENTS = [
  { id: 1, name: 'demo-denial-letter.pdf',                       size: '133 KB',  uploadedAt: 'Aug 06, 2024', type: 'denial'   },
  { id: 2, name: 'Inpatient Clinical Notes - Admission.pdf',     size: '2.4 MB',  uploadedAt: 'Aug 12, 2024', type: 'clinical' },
  { id: 3, name: 'ABG Results - Serial (06/01–06/05/2024).pdf',  size: '0.8 MB',  uploadedAt: 'Aug 12, 2024', type: 'clinical' },
  { id: 4, name: 'Microbiology Report - Blood Culture.pdf',      size: '1.1 MB',  uploadedAt: 'Aug 12, 2024', type: 'clinical' },
  { id: 5, name: 'Physician Attestation and Addendum.pdf',       size: '0.4 MB',  uploadedAt: 'Aug 12, 2024', type: 'clinical' },
];

// ─── Appeal Letter ────────────────────────────────────────────────────────────

export const MOCK_APPEAL_LETTER = `<p>Sunny Valley Hospita<br>
1234 Sunshine Boulevar<br>
Pleasantville, ST 1234</p>

<p>02/17/2026</p>

<p>Wellcare<br>
Wellcare Medicare Advantage<br>
Grievance and Appeals Department<br>
P.O. Box 4000<br>
Farmington, MO 63640</p>

<p>Dear Reviewer</p>

<p>This is a request for reconsideration of Ms. Susan A. Smith's denied claim for services provided at Sunny Valley Hospital. The following response addresses the denial issued by Wellcare, specifically the reassignment of DRG 871 to 194, and substantiates the ICD-10-CM codes that support the appropriate DRG assignment</p>

<p>Beneficiary Name: Susan A. Smit<br>
Date of Birth: 01/15/196<br>
Member ID Number: ABC12345678<br>
Claim Number: 123456789<br>
Patient Account Number: 101002679<br>
Claim Dates of Service: 01/01/2024 to 07/16/202<br>
Diagnosis in Question: ICD-10-CM codes A41.9, R65.20, J96.2</p>

<p>Reason(s) for Denial: Allegation: Insufficient clinical documentation to support diagnosi<br>
DRG Change: Reassignment from DRG 871 to DRG 19</p>

<p>Sunny Valley Hospital respectfully disagrees with the reviewer's conclusion disputing the appropriateness of the principal and secondary diagnoses of A41.9, R65.20, and J96.21, prompting a reassignment of the DRG</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith, a 64-year-old female, was admitted to Sunny Valley Hospital with suspected sepsis necessitating broad-spectrum IV antibiotics, including vancomycin, cefepime, and metronidazole</span>. During her hospitalization, Ms. Smith displayed clear clinical signs and symptoms consistent with sepsis, severe sepsis, and acute respiratory failure.</p>

<p>Argument 1: The Principal Diagnosis of Sepsis (A41.9) is Clinically Validated</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith's urine culture confirmed the presence of infection; she exhibited multiple SIRS criteria: temperature dysregulation (Temp: 38.1°C and 35.6°C) and persistent tachypnea (Resp: 24–25), alongside elevated leukocytosis (WBC consistently >12,000/mm³)</span></p>

<p>Conclusion for Sepsis: The documented confirmed infection and systemic response clinically validate the sepsis diagnosis as the primary reason for admission</p>

<p>Argument 2: The Secondary Diagnosis of Severe Sepsis (R65.20) is Supported by Clear Evidence of Acute Organ Dysfunction</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Ms. Smith's serum creatinine increased from baseline, indicating AKI. Ms. Smith required significant oxygen support (5 L/min via simple face mask) to maintain SpO2 at 90%, confirming acute hypoxemic respiratory failure and further contributing to a SOFA score of +1 to +2 points</span>.</p>

<p>Conclusion for Severe Sepsis: The coexistence of AKI and acute respiratory failure demonstrates a SOFA score increase of at least 2 points, confirming severe sepsis.</p>

<p>Argument 3: The Secondary Diagnosis of Acute and Chronic Respiratory Failure with Hypoxia (J96.21) is Clinically Evident</p>

<p><span style="background-color:#E3F2FD; border-radius:2px; padding:0 2px">Continuous, high-flow oxygen was necessary to prevent desaturation. This clinical necessity, not attributable solely to pneumonia or COPD, indicates acute hypoxemic respiratory failure, directly correlating with the septic process</span>.</p>

<p>Conclusion for Acute and Chronic Respiratory Failure: The need for high-flow oxygen therapy signifies organ dysfunction due to sepsis, substantiating the diagnosis of J96.21.</p>

<p>Conclusion</p>

<p>Based on the patient's documented clinical course and supporting evidence, the diagnoses of A41.9, R65.20, and J96.21 were appropriately assigned. Therefore, the DRG should remain as DRG 871, as initially coded</p>

<p>Sunny Valley Hospital provided these medically necessary services to Ms. Smith with the expectation of reimbursement aligned with comprehensive documentation per UHDDS standards. We respectfully request the reconsideration of this claim under the originally submitted DRG 871</p>

<p>I appreciate your attention to this issue and invite further communication to address any questions. Please see the further documentation attached to this letter. Thank you for your review, and I look forward to your response. Please send all further correspondence related to this claim to the address below or contact me directly at any time</p>

<p>Respectfully,</p>

<p>Dr. Jane Smit<br>
Medical Directo<br>
Sunny Valley Hospita<br>
Phone: (123) 456-789<br>
Email: jane.smith@sunnyvalleyhospital.co</p>

<p>Please return all correspondence to<br>
Sunny Valley Hospita<br>
1234 Sunshine Boulevar<br>
Pleasantville, ST 1234</p>

<p style="color:#9E9E9E; font-size:12px; font-style:italic; margin-top:32px">AI-generated rationale; please review for accuracy and completeness</p>
`;

// ─── Denial Letter (rendered in new tab on "View denial") ─────────────────────

export const MOCK_DENIAL_LETTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Denial Letter — Susan Smith — Claim 1234567890</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 820px; margin: 48px auto; padding: 0 32px 64px; color: #222; line-height: 1.65; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 13px; }
    th { background: #f0f0f0; font-weight: 600; padding: 8px 12px; border: 1px solid #ccc; text-align: left; }
    td { padding: 8px 12px; border: 1px solid #ccc; vertical-align: top; }
    h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 32px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    p { margin: 0 0 14px; }
    ul, ol { margin: 8px 0 14px 0; padding-left: 22px; }
    li { margin-bottom: 6px; }
    .label { font-weight: 600; }
    .page-header { background: #f8f8f8; border-bottom: 2px solid #1976D2; padding: 12px 24px; margin: -0px -32px 32px; display: flex; align-items: center; gap: 12px; }
    .badge { background: #FFEBEE; color: #C62828; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 28px 0; }
  </style>
</head>
<body>
  <div class="page-header">
    <span>📄 Original Denial Letter</span>
    <span class="badge">DRG Downgrade</span>
    <span style="margin-left:auto; color:#9e9e9e; font-size:13px">Claim 1234567890 &nbsp;·&nbsp; Susan Smith</span>
  </div>

  <p>August 06, 2024</p>
  <p>SUNNY VALLEY HOSPITAL<br>PO BOX 251420<br>New York, NY 10011</p>
  <p>
    <span class="label">Re: Member Name:</span> Susan Smith<br>
    <span class="label">Member ID:</span> ABC123456789<br>
    <span class="label">Patient Account #:</span> P1000000000<br>
    <span class="label">Date(s) of Service:</span> 06/01/2024 – 06/05/2024<br>
    <span class="label">Total Billed Amount:</span> $25,303.68<br>
    <span class="label">Claim Number:</span> 1234567890
  </p>
  <p>Dear Provider,</p>
  <p>Thank you for your timely submission of the medical record related to the claim listed above. After reviewing the claim, we concluded that the following code(s) billed will be denied for the reason(s) in the enclosed table.</p>
  <p>If you do not agree with our findings and would like to dispute them, please notify us in writing within 30 days of the postmark date of this letter.</p>
  <hr/>
  <h2>Claim Detail</h2>
  <table>
    <tr><th>Case ID</th><th>Patient ID</th><th>Patient Name</th><th>DOB</th><th>Date of Service</th><th>Claim Number</th></tr>
    <tr><td>123456789012345</td><td>ABC123456789</td><td>Susan Smith</td><td>01/15/1965</td><td>06/01/2024</td><td>1234567890</td></tr>
  </table>
  <p><strong>Denial Description:</strong> Recommend revised DRG due to incorrectly assigned/unsupported principal diagnosis.</p>
  <p><strong>Additional Remarks:</strong> Per review by RN, payment of DRG 871 is not supported. Review supports DRG 194. A review of the medical records submitted did not validate A41.9 Sepsis, unspecified organism as the principal diagnosis and R65.20 Severe sepsis without septic shock and J96.21 Acute and chronic respiratory failure with hypoxia as secondary diagnoses for this admission.</p>
  <p>The member presented to the hospital with shortness of breath. It was noted that the physician documented severe sepsis and acute respiratory failure with hypoxemia in the medical record. While the patient presentation warranted consideration of these diagnoses, there was no evidence of increase in the SOFA score of 2 points or more from baseline after initial medical management. There was no MAP score less than 70 mmHg. There was no platelet count less than 150. There was no total bilirubin at 1.2 mg/dL or more. GCS score was 15.</p>
  <p>The patient has a known history of COPD with no baseline oxygen saturation documented below 92% from baseline and at discharge. There was no persistent decline of oxygen saturation to 88% or less at rest. Therefore, the diagnosis codes A41.9, R65.20, and J96.21 cannot be verified.</p>
  <p><strong>References:</strong></p>
  <ul>
    <li>Singer, Mervyn et al. "The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)." <em>JAMA</em> vol. 315,8 (2016): 801–10.</li>
    <li>Evans, Laura et al. "Surviving Sepsis Campaign 2021." <em>Intensive Care Medicine</em> vol. 47,11 (2021): 1181–1247.</li>
    <li>2023 GOLD Report — Global Initiative for Chronic Obstructive Lung Disease.</li>
  </ul>
  <p>Optum has provided a revised recommendation. If you agree with the recommendation of DRG 194, no further action is needed.</p>
  <p>Sincerely,<br><strong>OPTUM</strong></p>
</body>
</html>`;
