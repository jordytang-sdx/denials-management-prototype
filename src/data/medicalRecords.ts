export interface Diagnosis {
  code: string
  description: string
  type: 'primary' | 'secondary'
}

export interface Procedure {
  code: string
  description: string
  date: string
}

export interface MedicalRecord {
  patientId: string   // matches mrn
  dob: string
  sex: 'M' | 'F'
  insuranceId: string
  admitDate: string
  dischargeDate: string
  admitType: string   // "Inpatient", "Observation", etc.
  attendingPhysician: string
  attendingNPI: string
  facility: string
  diagnoses: Diagnosis[]
  procedures: Procedure[]
  drg?: { billed: string; billedWeight: number; paidDrg?: string; paidWeight?: number }
  clinicalSummary: string   // 2–3 paragraph narrative
  keyFacts: string[]        // bullet points supporting the appeal
}

export const MEDICAL_RECORDS: Record<string, MedicalRecord> = {

  'MRN-104823': {  // Margaret Holloway — BCBS DRG Downgrade
    patientId: 'MRN-104823',
    dob: '1951-03-17',
    sex: 'F',
    insuranceId: 'BCBS-XYZ-104823-01',
    admitDate: '2026-02-14',
    dischargeDate: '2026-02-17',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Anita Khoury, MD',
    attendingNPI: '1234567890',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I50.9',  description: 'Heart failure, unspecified',                         type: 'primary' },
      { code: 'J18.9',  description: 'Pneumonia, unspecified organism',                    type: 'secondary' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications',     type: 'secondary' },
      { code: 'I10',    description: 'Essential (primary) hypertension',                   type: 'secondary' },
    ],
    procedures: [
      { code: '93306', description: 'Echocardiography, transthoracic', date: '2026-02-14' },
      { code: '71046', description: 'Radiologic examination, chest, 2 views', date: '2026-02-14' },
      { code: '93010', description: 'Electrocardiogram, routine ECG', date: '2026-02-15' },
    ],
    drg: { billed: 'MS-DRG 291', billedWeight: 1.4986, paidDrg: 'MS-DRG 292', paidWeight: 0.9873 },
    clinicalSummary: `Ms. Holloway, a 74-year-old female with a history of heart failure, type 2 diabetes, and hypertension, presented to the Emergency Department on February 14, 2026, with worsening dyspnea, lower extremity edema, and a 6 lb weight gain over 48 hours. Initial evaluation revealed an ejection fraction of 28% on echocardiography, bilateral crackles on auscultation, and BNP of 1,842 pg/mL — consistent with acute decompensated heart failure. Chest X-ray demonstrated pulmonary vascular congestion and bilateral pleural effusions.\n\nConcurrent findings included a right lower lobe infiltrate on chest imaging with a fever of 38.6°C, leukocytosis of 14,200/μL, and elevated CRP. Pneumonia was diagnosed as a complicating comorbidity requiring IV antibiotics, telemetry, and close respiratory monitoring. The combination of hemodynamic compromise from decompensated heart failure with an actively treated pneumonia required inpatient-level care with cardiac monitoring throughout the 3-night stay.\n\nThe patient was discharged on February 17, 2026, following hemodynamic stabilization, diuresis with IV furosemide, and completion of initial antibiotic course. Discharge disposition was to home with close cardiology follow-up.`,
    keyFacts: [
      'Ejection fraction 28% on admission echocardiography — severely reduced',
      'BNP 1,842 pg/mL — consistent with acute decompensated heart failure',
      'Concurrent pneumonia with fever, leukocytosis, and bilateral infiltrates',
      'Required IV diuresis, IV antibiotics, and continuous cardiac telemetry',
      'Complexity of dual acute conditions supports MS-DRG 291 (with MCC)',
      'Pneumonia (J18.9) qualifies as Major Complication/Comorbidity (MCC) under MS-DRG grouper',
    ],
  },

  'MRN-091247': {  // Raymond Castellano — Aetna Med Nec
    patientId: 'MRN-091247',
    dob: '1963-11-04',
    sex: 'M',
    insuranceId: 'AET-091247-GRP',
    admitDate: '2026-02-18',
    dischargeDate: '2026-02-21',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Marcus Osei, MD',
    attendingNPI: '2345678901',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'K57.32', description: 'Diverticulitis of large intestine without abscess',  type: 'primary' },
      { code: 'R10.9',  description: 'Unspecified abdominal pain',                         type: 'secondary' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications',     type: 'secondary' },
    ],
    procedures: [
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2026-02-18' },
      { code: '74177', description: 'CT abdomen and pelvis with contrast', date: '2026-02-18' },
      { code: '99232', description: 'Subsequent hospital care, moderate complexity', date: '2026-02-19' },
    ],
    clinicalSummary: `Mr. Castellano, a 62-year-old male with a history of diverticular disease and type 2 diabetes, presented on February 18, 2026, with acute onset left lower quadrant pain, nausea, vomiting, and fever of 38.9°C. CT abdomen/pelvis with contrast demonstrated pericolic fat stranding and thickening of the sigmoid colon consistent with acute diverticulitis, without evidence of perforation or abscess at the time of admission.\n\nGiven the patient's immunocompromised state from diabetes (HbA1c 9.1%), failure of outpatient antibiotic trials, and inability to tolerate oral intake due to pain and nausea, the treating team determined inpatient management with IV antibiotics and bowel rest was medically necessary. The patient required IV metronidazole and ciprofloxacin, IV fluids, and NPO status for 48 hours, with close monitoring for perforation and sepsis.\n\nThe patient was discharged on February 21, 2026, with clinical improvement: afebrile x24 hours, tolerating clear liquids, and WBC trending down. Transition to oral antibiotics was initiated prior to discharge.`,
    keyFacts: [
      'Acute diverticulitis confirmed on CT — pericolic fat stranding, sigmoid thickening',
      'Diabetes (HbA1c 9.1%) represents significant immunocompromise increasing perforation risk',
      'Unable to tolerate oral antibiotics due to nausea and vomiting on presentation',
      'IV antibiotic therapy and NPO status medically required for 48 hours',
      'InterQual criteria for inpatient admission met: fever, inability to tolerate PO, comorbid immunocompromise',
      'Risk of sepsis from untreated diverticulitis in diabetic patient warranted inpatient observation',
    ],
  },

  'MRN-203881': {  // Dorothy Kim — Medicare Coding Error
    patientId: 'MRN-203881',
    dob: '1944-07-22',
    sex: 'F',
    insuranceId: 'Medicare-203881-A',
    admitDate: '2026-02-28',
    dischargeDate: '2026-03-02',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Priya Subramaniam, MD',
    attendingNPI: '3456789012',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'N18.4',  description: 'Chronic kidney disease, stage 4',               type: 'primary' },
      { code: 'I12.9',  description: 'Hypertensive chronic kidney disease, unspecified',type: 'secondary' },
      { code: 'E11.65', description: 'Type 2 diabetes with hyperglycemia',             type: 'secondary' },
    ],
    procedures: [
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2026-02-28' },
      { code: '90935', description: 'Hemodialysis procedure, single evaluation', date: '2026-03-01' },
    ],
    clinicalSummary: `Ms. Kim, a 81-year-old female with stage 4 chronic kidney disease (CKD) secondary to hypertensive nephropathy and diabetic nephropathy, was admitted February 28, 2026, for acute-on-chronic kidney disease exacerbation with creatinine 5.8 mg/dL (baseline 3.2), hyperkalemia (K+ 6.1), and volume overload.\n\nThe CDI specialist reviewed the record on admission and identified that the principal diagnosis coding required clarification. The hypertensive chronic kidney disease (I12.9) was identified as a causal relationship condition per ICD-10-CM guidelines (Section I.C.9.a), and the sequencing between CKD stage coding and the hypertensive kidney disease code was corrected per Official Coding Guidelines. The corrected sequencing does not change the clinical picture but aligns with ICD-10-CM sequencing rules.`,
    keyFacts: [
      'ICD-10-CM sequencing corrected per Official Coding Guidelines Section I.C.9.a',
      'Hypertensive CKD (I12.9) is a causal relationship code that should sequence appropriately with stage code',
      'Clinical picture unchanged — corrected sequencing is a technical billing correction',
      'CDI specialist attestation obtained confirming correct sequencing',
    ],
  },

  'MRN-318740': {  // James Okafor — UHC No Auth
    patientId: 'MRN-318740',
    dob: '1958-05-30',
    sex: 'M',
    insuranceId: 'UHC-318740-EMP',
    admitDate: '2026-03-01',
    dischargeDate: '2026-03-04',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Elena Vasquez, MD',
    attendingNPI: '4567890123',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I21.09', description: 'ST elevation MI involving other coronary artery', type: 'primary' },
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', type: 'secondary' },
      { code: 'I10',    description: 'Essential hypertension', type: 'secondary' },
    ],
    procedures: [
      { code: '92928', description: 'Percutaneous coronary intervention (PCI) with stent, single vessel', date: '2026-03-01' },
      { code: '93458', description: 'Left heart catheterization with coronary angiography', date: '2026-03-01' },
    ],
    clinicalSummary: `Mr. Okafor, a 67-year-old male, presented via EMS on March 1, 2026, with acute ST-elevation myocardial infarction (STEMI) of the LAD territory confirmed on 12-lead ECG. The patient was immediately activated for emergent cardiac catheterization. Door-to-balloon time was 54 minutes. PCI with drug-eluting stent placement to the mid-LAD was performed emergently.\n\nGiven the emergency nature of the presentation, prior authorization was not obtainable prior to the procedure. Notification was provided to UnitedHealthcare within the timeframe specified in the member's benefit plan. Per the member's EOC and applicable law, prior authorization requirements are waived for emergent services that cannot be delayed without endangering the patient's life or health.`,
    keyFacts: [
      'STEMI presentation — emergent, life-threatening, no delay possible for prior auth',
      'Door-to-balloon time 54 minutes — clinical urgency documented',
      'UHC notified within required timeframe per member EOC',
      'Applicable law and plan documents waive prior auth for emergency services',
      'CARC-15 denial is inappropriate for emergent STEMI intervention',
    ],
  },

  'MRN-447129': {  // Carolyn Brandt — Cigna Med Nec
    patientId: 'MRN-447129',
    dob: '1977-09-14',
    sex: 'F',
    insuranceId: 'CGN-447129-PPO',
    admitDate: '2026-03-10',
    dischargeDate: '2026-03-12',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Robert Huang, MD',
    attendingNPI: '5678901234',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'J18.1',  description: 'Lobar pneumonia, unspecified organism', type: 'primary' },
      { code: 'J96.00', description: 'Acute respiratory failure, unspecified', type: 'secondary' },
      { code: 'Z87.891',description: 'Personal history of nicotine dependence', type: 'secondary' },
    ],
    procedures: [
      { code: '94002', description: 'Ventilation assist, hospital inpatient', date: '2026-03-10' },
      { code: '71046', description: 'Radiologic examination, chest, 2 views', date: '2026-03-10' },
    ],
    clinicalSummary: `Ms. Brandt, a 48-year-old female with a smoking history, presented March 10, 2026, with high fever (39.4°C), productive cough, and progressive dyspnea with oxygen saturation of 88% on room air. Chest imaging confirmed lobar consolidation in the right lower lobe consistent with community-acquired pneumonia. The patient's rapid oxygen desaturation and work of breathing deteriorated within 6 hours of admission, meeting criteria for acute respiratory failure (J96.00).\n\nThe patient required supplemental oxygen at 6L/min via nasal cannula, IV ceftriaxone and azithromycin, and close monitoring for respiratory decompensation. Given the acute respiratory failure component, Cigna InterQual criteria for inpatient admission were clearly met. Discharge on March 12 followed 48 hours of clinical stability and oxygen independence.`,
    keyFacts: [
      'O2 saturation 88% on room air — acute respiratory failure documented',
      'Lobar consolidation confirmed on chest X-ray',
      'Required 6L O2, IV antibiotics, and respiratory monitoring',
      'InterQual criteria satisfied: acute respiratory failure with hypoxia',
      'Acute respiratory failure (J96.00) is a CC under MS-DRG grouper',
    ],
  },

  'MRN-509334': {  // Louis Tremblay — Medicaid Eligibility
    patientId: 'MRN-509334',
    dob: '1989-12-01',
    sex: 'M',
    insuranceId: 'MCD-MA-509334',
    admitDate: '2026-03-05',
    dischargeDate: '2026-03-05',
    admitType: 'Outpatient',
    attendingPhysician: 'Dr. Sarah Okonkwo, MD',
    attendingNPI: '6789012345',
    facility: 'Memorial Health System — Outpatient Clinic',
    diagnoses: [
      { code: 'M54.5',  description: 'Low back pain', type: 'primary' },
    ],
    procedures: [
      { code: '99213', description: 'Office visit, established patient, moderate complexity', date: '2026-03-05' },
    ],
    clinicalSummary: `Mr. Tremblay, a 36-year-old male, presented for outpatient evaluation of low back pain on March 5, 2026. The patient's Medicaid coverage was active at the time of service. State Medicaid records may reflect a processing lag in coverage status updates.`,
    keyFacts: [
      'Patient had active Medicaid coverage on DOS per state records',
      'Coverage status may reflect processing lag — verification in progress',
      'Patient may have had dual eligibility (secondary coverage) on DOS',
    ],
  },

  'MRN-612847': {  // Nancy Whitfield — BCBS Recoupment
    patientId: 'MRN-612847',
    dob: '1949-06-08',
    sex: 'F',
    insuranceId: 'BCBS-XYZ-612847-02',
    admitDate: '2026-01-30',
    dischargeDate: '2026-02-03',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. William Farley, MD',
    attendingNPI: '7890123456',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'N17.9',  description: 'Acute kidney injury, unspecified',                   type: 'primary' },
      { code: 'A41.9',  description: 'Sepsis, unspecified organism',                       type: 'secondary' },
      { code: 'N18.3',  description: 'Chronic kidney disease, stage 3',                   type: 'secondary' },
      { code: 'I10',    description: 'Essential hypertension',                             type: 'secondary' },
    ],
    procedures: [
      { code: '90937', description: 'Hemodialysis, repeated evaluation', date: '2026-01-31' },
      { code: '36556', description: 'Insertion of non-tunneled centrally inserted catheter', date: '2026-01-30' },
    ],
    drg: { billed: 'MS-DRG 682', billedWeight: 2.8871 },
    clinicalSummary: `Ms. Whitfield, a 76-year-old female with baseline CKD stage 3 and hypertension, was admitted January 30, 2026, with acute kidney injury superimposed on CKD (AKI-on-CKD) in the setting of urosepsis. Creatinine was 6.9 mg/dL (baseline 1.8), with oliguria and sepsis criteria met (HR 114, temp 39.1°C, WBC 22,000/μL). Emergent central venous access and CVVH were initiated.\n\nThe MS-DRG 682 assignment is supported by the documented MCC of sepsis (A41.9) combined with acute kidney injury requiring emergent dialysis. The post-payment audit finding that this case was miscoded is disputed — our CDI team and coding compliance officer have reviewed the complete medical record and confirmed the accuracy of the original coding.`,
    keyFacts: [
      'Sepsis (A41.9) is a documented MCC supporting MS-DRG 682',
      'AKI required emergent hemodialysis — clinical severity unambiguous',
      'Coding reviewed by CDI team and compliance officer — original assignment accurate',
      'Complete medical record enclosed demonstrating severity of illness',
    ],
  },

  'MRN-701023': {  // Timothy Reyes — Aetna DRG Downgrade
    patientId: 'MRN-701023',
    dob: '1955-02-19',
    sex: 'M',
    insuranceId: 'AET-701023-IND',
    admitDate: '2026-03-12',
    dischargeDate: '2026-03-15',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. James Thornton, MD, FACS',
    attendingNPI: '8901234567',
    facility: 'Memorial Health System — Surgical Center',
    diagnoses: [
      { code: 'M16.11', description: 'Unilateral primary osteoarthritis, right hip', type: 'primary' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications', type: 'secondary' },
      { code: 'Z96.641',description: 'Presence of right artificial hip joint', type: 'secondary' },
    ],
    procedures: [
      { code: '27130', description: 'Arthroplasty, acetabular and proximal femoral prosthetic replacement (total hip arthroplasty)', date: '2026-03-12' },
    ],
    drg: { billed: 'MS-DRG 470', billedWeight: 2.0477, paidDrg: 'MS-DRG 483', paidWeight: 1.6849 },
    clinicalSummary: `Mr. Reyes, a 71-year-old male with severe right hip osteoarthritis and type 2 diabetes, underwent elective right total hip arthroplasty on March 12, 2026. The procedure was uncomplicated. Postoperative management included glycemic monitoring due to diabetes, DVT prophylaxis, and physical therapy. The patient was discharged to home with PT services on March 15.\n\nThe billed MS-DRG 470 (Major Joint Replacement or Reattachment of Lower Extremity without MCC) is supported by the documented diagnosis of type 2 diabetes (E11.9). Diabetes is classified as a CC under the MS-DRG grouper for this procedure, and the downgrade to MS-DRG 483 (Major Joint Replacement without CC/MCC) is not supported by a review of the clinical documentation.`,
    keyFacts: [
      'Type 2 diabetes (E11.9) is a documented CC for this MS-DRG group',
      'MS-DRG 470 requires presence of CC — diabetes satisfies this criterion',
      'Downgrade to MS-DRG 483 incorrectly excludes the documented diabetes comorbidity',
      'Postoperative glycemic management documented in nursing notes confirms active monitoring',
    ],
  },

  'MRN-834512': {  // Helen Nakamura — UHC Timely Filing
    patientId: 'MRN-834512',
    dob: '1967-04-11',
    sex: 'F',
    insuranceId: 'UHC-834512-PPO',
    admitDate: '2025-11-18',
    dischargeDate: '2025-11-18',
    admitType: 'Outpatient',
    attendingPhysician: 'Dr. Lisa Monroe, MD',
    attendingNPI: '9012345678',
    facility: 'Memorial Health System — Outpatient Clinic',
    diagnoses: [
      { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', type: 'primary' },
    ],
    procedures: [
      { code: '99396', description: 'Periodic comprehensive preventive medicine, 40–64 years', date: '2025-11-18' },
    ],
    clinicalSummary: `Ms. Nakamura presented for annual preventive wellness examination on November 18, 2025. The claim was transmitted to Change Healthcare clearinghouse on November 18, 2025 — the same day as the date of service — well within the 90-day timely filing window. The 277-CA transaction acknowledgment confirms receipt of the claim on November 18, 2025.`,
    keyFacts: [
      '277-CA acknowledgment confirms electronic claim received Nov 18, 2025',
      'Claim transmission occurred same day as DOS — 0 days elapsed at time of filing',
      'Change Healthcare clearinghouse confirms timely transmission',
      'Payer denial citing late filing is inconsistent with clearinghouse records',
    ],
  },

  'MRN-922771': {  // Franklin Pierce — Humana Med Nec LOS
    patientId: 'MRN-922771',
    dob: '1961-08-23',
    sex: 'M',
    insuranceId: 'HUM-922771-MA',
    admitDate: '2026-03-20',
    dischargeDate: '2026-03-25',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Nadia Petrov, MD',
    attendingNPI: '0123456789',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I63.9',  description: 'Cerebral infarction, unspecified',               type: 'primary' },
      { code: 'I10',    description: 'Essential hypertension',                         type: 'secondary' },
      { code: 'E78.5',  description: 'Hyperlipidemia, unspecified',                   type: 'secondary' },
      { code: 'F32.9',  description: 'Major depressive disorder, single episode, unspecified', type: 'secondary' },
    ],
    procedures: [
      { code: '70553', description: 'MRI brain with and without contrast', date: '2026-03-20' },
      { code: '93971', description: 'Duplex scan of extremity veins', date: '2026-03-21' },
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2026-03-20' },
    ],
    clinicalSummary: `Mr. Pierce, a 64-year-old male with hypertension and hyperlipidemia, was admitted March 20, 2026, following acute onset of left-sided weakness and dysarthria consistent with ischemic stroke. MRI brain demonstrated an acute infarct in the right MCA territory. He was admitted to the stroke unit for IV alteplase administration (tPA), continuous neurological monitoring, and intensive rehabilitation evaluation.\n\nThe extended length of stay beyond day 4 was clinically necessary due to persistent neurological deficits requiring inpatient PT/OT/SLP evaluation, hemodynamic optimization on antihypertensives, and coordination of post-acute care placement. The patient's NIHSS score on admission was 14 (moderate-severe), and functional status at day 4 remained insufficient for safe home discharge. Humana's LOS criteria do not account for the complexity of post-stroke functional recovery and the time required for safe discharge planning.`,
    keyFacts: [
      'Acute ischemic stroke with NIHSS 14 — moderate to severe deficit',
      'tPA administered — required 24-hour close neurological monitoring post-thrombolysis',
      'Persistent deficits at day 4 — PT/OT/SLP assessments documented need for continued inpatient stay',
      'Post-acute placement coordination required — no appropriate SNF bed available until day 5',
      'Humana LOS criteria inapplicable to complexity of acute stroke management',
    ],
  },

  'MRN-043881': {  // Sylvia Moreau — Medicare ADR
    patientId: 'MRN-043881',
    dob: '1953-01-29',
    sex: 'F',
    insuranceId: 'Medicare-043881-B',
    admitDate: '2026-02-10',
    dischargeDate: '2026-02-14',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Thomas Carey, MD',
    attendingNPI: '1122334455',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'G35',    description: 'Multiple sclerosis', type: 'primary' },
      { code: 'G82.20', description: 'Paraplegia, unspecified', type: 'secondary' },
      { code: 'N39.0',  description: 'Urinary tract infection, site not specified', type: 'secondary' },
    ],
    procedures: [
      { code: '96413', description: 'Chemotherapy administration, IV infusion', date: '2026-02-10' },
      { code: '96415', description: 'Chemotherapy administration, IV infusion, each additional hour', date: '2026-02-10' },
    ],
    clinicalSummary: `Ms. Moreau, a 73-year-old female with relapsing-remitting multiple sclerosis and secondary paraplegia, was admitted February 10, 2026, for IV methylprednisolone infusion for acute MS exacerbation. The patient presented with rapid deterioration in upper extremity function and new bladder dysfunction. Concurrent UTI was identified and treated with IV antibiotics during the admission.\n\nInpatient admission was necessary due to the combination of acute neurological exacerbation severity, need for close monitoring during high-dose IV steroid infusion, and concurrent infectious process. Outpatient infusion was not appropriate given the patient's functional status and need for integrated monitoring.`,
    keyFacts: [
      'Acute MS exacerbation with rapid functional decline documented by neurology',
      'IV methylprednisolone 1g/day required inpatient monitoring for adverse effects',
      'Concurrent UTI required IV antibiotics and close monitoring',
      'Outpatient infusion contraindicated given severity of functional decline',
      'Medicare LCD for MS exacerbation management supports inpatient admission',
    ],
  },

  'MRN-187440': {  // Arthur Delacroix — Cigna Admin (Missing NPI)
    patientId: 'MRN-187440',
    dob: '1982-03-05',
    sex: 'M',
    insuranceId: 'CGN-187440-HMO',
    admitDate: '2026-03-25',
    dischargeDate: '2026-03-25',
    admitType: 'Outpatient',
    attendingPhysician: 'Dr. Karen Bell, MD',
    attendingNPI: '2233445566',
    facility: 'Memorial Health System — Outpatient Clinic',
    diagnoses: [
      { code: 'J06.9',  description: 'Acute upper respiratory infection, unspecified', type: 'primary' },
    ],
    procedures: [
      { code: '99213', description: 'Office visit, established patient, moderate complexity', date: '2026-03-25' },
    ],
    clinicalSummary: `Mr. Delacroix presented for evaluation of upper respiratory symptoms on March 25, 2026. The claim was denied due to a missing billing NPI in claim loop 2010BB — a technical submission error. A corrected claim with the billing NPI added has been submitted.`,
    keyFacts: [
      'Administrative denial — missing billing NPI in loop 2010BB',
      'Corrected claim submitted via Change Healthcare with billing NPI added',
      'Clinical services were rendered and medically appropriate',
    ],
  },

  // ── Historical admissions keyed by denial ID ───────────────────────────────

  'DN-2025-0847': {  // Margaret Holloway — Aetna Med Nec, Jul 2025
    patientId: 'MRN-104823',
    dob: '1951-03-17',
    sex: 'F',
    insuranceId: 'AET-104823-IND',
    admitDate: '2025-07-20',
    dischargeDate: '2025-07-24',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Anita Khoury, MD',
    attendingNPI: '1234567890',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I50.43', description: 'Acute-on-chronic combined systolic and diastolic heart failure', type: 'primary' },
      { code: 'N18.3',  description: 'Chronic kidney disease, stage 3',                               type: 'secondary' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia',                   type: 'secondary' },
      { code: 'I10',    description: 'Essential (primary) hypertension',                              type: 'secondary' },
    ],
    procedures: [
      { code: '93306', description: 'Echocardiography, transthoracic', date: '2025-07-20' },
      { code: '93010', description: 'Electrocardiogram, routine ECG', date: '2025-07-20' },
    ],
    drg: { billed: 'MS-DRG 291', billedWeight: 1.4986 },
    clinicalSummary: `Ms. Holloway, a 74-year-old female with known systolic and diastolic heart failure, CKD stage 3, type 2 diabetes, and hypertension, presented July 20, 2025, with acute decompensation. BNP was 2,104 pg/mL on arrival, EF 22% on emergent echo, and she required IV diuresis and telemetry monitoring for 4 days.\n\nAetna denied the inpatient admission citing observation-level criteria. However, the severity of hemodynamic compromise — significantly reduced EF, BNP exceeding 2,000, and CKD limiting diuretic dosing — necessitated inpatient-level monitoring. The external independent review overturned the denial, finding that acute-on-chronic systolic heart failure with markedly reduced EF and impaired renal function clearly met acute inpatient criteria under any recognized evidence-based guideline.`,
    keyFacts: [
      'EF 22% on emergent echocardiography — severely reduced systolic function',
      'BNP 2,104 pg/mL — markedly elevated, consistent with acute decompensation',
      'CKD stage 3 required careful diuretic titration with close monitoring',
      'IV furosemide, continuous telemetry, and daily labs required — inpatient-level care',
      'External IRO overturned Aetna denial — acute inpatient criteria clearly met',
    ],
  },

  'DN-2025-1201': {  // Raymond Castellano — UHC Med Nec, Sep 2025
    patientId: 'MRN-091247',
    dob: '1963-11-04',
    sex: 'M',
    insuranceId: 'UHC-091247-EMP2',
    admitDate: '2025-09-05',
    dischargeDate: '2025-09-08',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Marcus Osei, MD',
    attendingNPI: '2345678901',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'K92.1',  description: 'Melena',                                              type: 'primary' },
      { code: 'K57.32', description: 'Diverticulitis of large intestine without abscess',   type: 'secondary' },
      { code: 'D62',    description: 'Acute posthemorrhagic anemia',                        type: 'secondary' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications',      type: 'secondary' },
    ],
    procedures: [
      { code: '45378', description: 'Colonoscopy, diagnostic', date: '2025-09-06' },
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-09-05' },
    ],
    clinicalSummary: `Mr. Castellano, a 61-year-old male with diverticular disease and type 2 diabetes, presented September 5, 2025, with acute GI bleeding manifesting as melena and hemoglobin of 7.2 g/dL. He required 2 units of packed red blood cells and urgent colonoscopy the following day, which identified diverticular bleeding. Hemostasis was achieved endoscopically.\n\nUHC denied the admission citing observation-level care. The attending argued that the combination of active GI hemorrhage, anemia requiring transfusion, and the need for emergent colonoscopy with potential intervention required inpatient hospitalization. The L1 and L2 appeals were upheld on technical grounds — UHC maintained that observation criteria were met. Finance determined external review was not cost-effective at the $6,200 denied value.`,
    keyFacts: [
      'Active GI bleeding with hemoglobin 7.2 — required 2 units pRBC transfusion',
      'Emergent colonoscopy with hemostasis required inpatient level of care',
      'Diabetes as comorbidity increased clinical complexity',
      'UHC upheld internally at L1 and L2 — ROI did not support external review',
    ],
  },

  'DN-2025-0932': {  // Sylvia Moreau — Medicare ADR, Jun 2025 (shared HAR with DN-2025-0933)
    patientId: 'MRN-043881',
    dob: '1948-09-12',
    sex: 'F',
    insuranceId: 'Medicare-043881-A',
    admitDate: '2025-06-15',
    dischargeDate: '2025-06-19',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Rena Goldstein, MD',
    attendingNPI: '5678901234',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'J18.9',  description: 'Pneumonia, unspecified organism',           type: 'primary' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia',    type: 'secondary' },
      { code: 'I10',    description: 'Essential hypertension',                    type: 'secondary' },
      { code: 'E78.5',  description: 'Hyperlipidemia, unspecified',               type: 'secondary' },
    ],
    procedures: [
      { code: '71046', description: 'Chest X-ray, 2 views', date: '2025-06-15' },
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-06-15' },
    ],
    drg: { billed: 'MS-DRG 194', billedWeight: 1.5802, paidDrg: 'MS-DRG 195', paidWeight: 0.9714 },
    clinicalSummary: `Ms. Moreau, a 76-year-old female, presented June 15, 2025, with community-acquired pneumonia complicated by acute hypoxic respiratory failure. She required supplemental oxygen, IV antibiotics (ceftriaxone/azithromycin), and 4-night hospitalization. Medicare issued an ADR requesting full records. Upon review, Medicare determined that acute respiratory failure (J96.01) was not adequately documented as a complicating condition and downgraded the DRG from MS-DRG 194 (with MCC) to MS-DRG 195 (without MCC).\n\nThe subsequent appeal (DN-2025-0933) successfully demonstrated that J96.01 was documented through nursing flow sheets, O2 saturation trending, and the attending's narrative — the QIC overturned the downgrade and restored MS-DRG 194.`,
    keyFacts: [
      'Pneumonia with acute hypoxic respiratory failure (J96.01) — MCC classification',
      'O2 sat 82% on arrival, required high-flow supplemental oxygen throughout admission',
      'Respiratory failure documented in attending notes, nursing flow sheets, and O2 trending',
      'QIC overturned DRG downgrade — MS-DRG 194 coding was correct',
    ],
  },

  'DN-2025-0933': {  // Sylvia Moreau — Medicare DRG Downgrade (same admission as DN-2025-0932)
    patientId: 'MRN-043881',
    dob: '1948-09-12',
    sex: 'F',
    insuranceId: 'Medicare-043881-A',
    admitDate: '2025-06-15',
    dischargeDate: '2025-06-19',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Rena Goldstein, MD',
    attendingNPI: '5678901234',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'J18.9',  description: 'Pneumonia, unspecified organism',           type: 'primary' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia',    type: 'secondary' },
      { code: 'I10',    description: 'Essential hypertension',                    type: 'secondary' },
      { code: 'E78.5',  description: 'Hyperlipidemia, unspecified',               type: 'secondary' },
    ],
    procedures: [
      { code: '71046', description: 'Chest X-ray, 2 views', date: '2025-06-15' },
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-06-15' },
    ],
    drg: { billed: 'MS-DRG 194', billedWeight: 1.5802, paidDrg: 'MS-DRG 195', paidWeight: 0.9714 },
    clinicalSummary: `Same admission as DN-2025-0932 (ADR). MS-DRG 194 with MCC was downgraded by Medicare post-ADR record review. J96.01 (acute respiratory failure with hypoxia) was the MCC in question. QIC Level 2 review confirmed J96.01 was properly documented and supported the MCC classification — downgrade was overturned.`,
    keyFacts: [
      'Same admission as ADR denial DN-2025-0932',
      'DRG downgrade issued post-records review — J96.01 MCC disputed',
      'QIC Level 2 appeal overturned — MS-DRG 194 restored, $3,840 recovered',
      'Respiratory failure documentation in nursing and attending notes validated MCC',
    ],
  },

  'DN-2025-1089': {  // James Okafor — Cigna Auth No PA, Oct 2025
    patientId: 'MRN-318740',
    dob: '1958-05-30',
    sex: 'M',
    insuranceId: 'CGN-318740-EMP',
    admitDate: '2025-10-15',
    dischargeDate: '2025-10-18',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Marcus Osei, MD',
    attendingNPI: '2345678901',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'A41.9',  description: 'Sepsis, unspecified organism',                          type: 'primary' },
      { code: 'J18.9',  description: 'Pneumonia, unspecified',                                type: 'secondary' },
      { code: 'N17.9',  description: 'Acute kidney injury, unspecified',                      type: 'secondary' },
    ],
    procedures: [
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-10-15' },
      { code: '36556', description: 'Insertion of non-tunneled centrally inserted catheter', date: '2025-10-15' },
    ],
    clinicalSummary: `Mr. Okafor, a 67-year-old male, presented October 15, 2025, via the Emergency Department with fever of 39.4°C, hypotension (BP 82/50), and altered mental status consistent with septic shock secondary to community-acquired pneumonia. He met Sepsis-3 criteria on arrival and was immediately transferred to the ICU for vasopressor support and IV broad-spectrum antibiotics.\n\nNo prior authorization was obtained due to the acute, life-threatening nature of the presentation. Cigna's initial denial was successfully overturned following peer-to-peer review — the Cigna medical director agreed that the emergent septic shock presentation precluded any delay for prior authorization and that applicable plan provisions exempt emergent life-threatening admissions.`,
    keyFacts: [
      'Septic shock on arrival — BP 82/50, fever 39.4°C, AMS — immediate ICU transfer required',
      'Sepsis-3 criteria met — vasopressors initiated in ED',
      'Emergent nature of presentation precluded prior authorization',
      'Cigna medical director accepted emergent exception — P2P successful',
      'AKI as complicating comorbidity required nephrology monitoring',
    ],
  },

  'DN-2025-1156': {  // Carolyn Brandt — BCBS Auth, Nov 2025
    patientId: 'MRN-447129',
    dob: '1959-02-28',
    sex: 'F',
    insuranceId: 'BCBS-447129-GRP',
    admitDate: '2025-11-01',
    dischargeDate: '2025-11-02',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Priya Subramaniam, MD',
    attendingNPI: '3456789012',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'M16.11', description: 'Unilateral primary osteoarthritis, right hip', type: 'primary' },
    ],
    procedures: [
      { code: '27130', description: 'Total hip arthroplasty', date: '2025-11-01' },
    ],
    clinicalSummary: `Ms. Brandt underwent elective total hip arthroplasty on November 1, 2025, for severe right hip osteoarthritis. A prior authorization was required under the BCBS benefit plan and was not obtained pre-procedure. The retroactive authorization request was denied — BCBS confirmed that elective surgical procedures require pre-authorization and no emergent exception applied. The L1 appeal was upheld. Finance determined that external review cost exceeds denied amount.`,
    keyFacts: [
      'Elective total hip arthroplasty — prior authorization required under plan',
      'No emergent exception applicable for elective orthopedic procedure',
      'BCBS upheld L1 — retroactive authorization pathway not available under contract',
      'Finance write-off approved — external review cost exceeds $2,100 denied amount',
    ],
  },

  'DN-2025-0788': {  // Nancy Whitfield — Medicare Recoupment, Aug 2025
    patientId: 'MRN-612847',
    dob: '1952-06-14',
    sex: 'F',
    insuranceId: 'Medicare-612847-A',
    admitDate: '2025-08-10',
    dischargeDate: '2025-08-14',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Elena Vasquez, MD',
    attendingNPI: '4567890123',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I21.4',  description: 'Non-ST elevation myocardial infarction',             type: 'primary' },
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', type: 'secondary' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications',    type: 'secondary' },
    ],
    procedures: [
      { code: '93458', description: 'Left heart catheterization with coronary angiography', date: '2025-08-11' },
      { code: '93454', description: 'Coronary angiography only', date: '2025-08-11' },
    ],
    clinicalSummary: `Ms. Whitfield, a 73-year-old female, presented August 10, 2025, with NSTEMI confirmed by troponin elevation and EKG changes. She underwent left heart catheterization on August 11 showing 70% LAD stenosis managed medically. Medicare initiated a post-payment audit citing potential overpayment on DRG assignment.\n\nA formal dispute was submitted with complete clinical record. Medicare agreed to a partial settlement — $6,200 repaid, $6,200 written off — as a result of the audit negotiation process.`,
    keyFacts: [
      'NSTEMI with troponin elevation and EKG changes — inpatient admission appropriate',
      'Left heart catheterization performed — 70% LAD stenosis identified',
      'Medicare post-payment audit dispute — partial settlement of $12,400 recoupment',
      '$6,200 repaid to Medicare, $6,200 forgiven as part of negotiated settlement',
    ],
  },

  'DN-2025-1302': {  // Helen Nakamura — Aetna Timely Filing, May 2025
    patientId: 'MRN-834512',
    dob: '1947-11-30',
    sex: 'F',
    insuranceId: 'AET-834512-IND',
    admitDate: '2025-05-10',
    dischargeDate: '2025-05-13',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Anita Khoury, MD',
    attendingNPI: '1234567890',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'N18.5',  description: 'Chronic kidney disease, stage 5',                        type: 'primary' },
      { code: 'I12.9',  description: 'Hypertensive chronic kidney disease, unspecified',        type: 'secondary' },
    ],
    procedures: [
      { code: '90937', description: 'Hemodialysis procedure, repeated evaluations', date: '2025-05-11' },
    ],
    clinicalSummary: `Ms. Nakamura, a 77-year-old female with stage 5 CKD on hemodialysis, was admitted May 10, 2025, for acute fluid overload and missed dialysis session due to access complications. Claim was submitted through the clearinghouse within the 180-day filing window. Aetna's system erroneously reflected a later receipt date.\n\nThe 277-CA acceptance report from Availity confirmed the claim was transmitted to Aetna on July 2, 2025 — well within the 180-day window from DOS May 10, 2025. Aetna accepted the defense and reversed the timely filing denial.`,
    keyFacts: [
      'Claim transmitted July 2, 2025 — within 180-day window from DOS May 10, 2025',
      '277-CA Availity acceptance report confirmed timely submission',
      'Aetna system error caused incorrect receipt date — corrected on review',
      '$3,100 paid in full after defense accepted',
    ],
  },

  'DN-2026-0044': {  // Dorothy Kim — BCBS Coding Error, Sep 2025
    patientId: 'MRN-203881',
    dob: '1944-07-22',
    sex: 'F',
    insuranceId: 'BCBS-203881-GRP',
    admitDate: '2025-09-20',
    dischargeDate: '2025-09-22',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Priya Subramaniam, MD',
    attendingNPI: '3456789012',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'I50.9',  description: 'Heart failure, unspecified',                         type: 'primary' },
      { code: 'E11.65', description: 'Type 2 diabetes with hyperglycemia',                 type: 'secondary' },
      { code: 'N18.4',  description: 'Chronic kidney disease, stage 4',                   type: 'secondary' },
    ],
    procedures: [
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-09-20' },
    ],
    clinicalSummary: `Ms. Kim, an 81-year-old female, was admitted September 20, 2025, for acute decompensated heart failure. The initial coding transposed the principal and secondary diagnoses — E11.65 was erroneously coded as primary and I50.9 as secondary, contrary to ICD-10-CM coding guidelines. CDI corrected the sequencing. BCBS processed the corrected claim and paid in full.`,
    keyFacts: [
      'ICD-10-CM sequencing corrected: I50.9 (Heart failure) as principal, E11.65 as secondary',
      'CDI attestation confirmed correct sequencing per ICD-10-CM guidelines',
      'BCBS accepted corrected claim — $1,240 paid in full',
    ],
  },

  'DN-2026-0077': {  // Louis Tremblay — Medicaid Eligibility, Dec 2025
    patientId: 'MRN-509334',
    dob: '1961-04-19',
    sex: 'M',
    insuranceId: 'Medicare-509334-A',
    admitDate: '2025-12-10',
    dischargeDate: '2025-12-12',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Rena Goldstein, MD',
    attendingNPI: '5678901234',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'J44.1',  description: 'COPD with acute exacerbation',   type: 'primary' },
      { code: 'J18.9',  description: 'Pneumonia, unspecified',          type: 'secondary' },
    ],
    procedures: [
      { code: '94002', description: 'Ventilation assist and management, inpatient hospital', date: '2025-12-10' },
    ],
    clinicalSummary: `Mr. Tremblay, a 64-year-old male, was admitted December 10, 2025, for COPD exacerbation with concurrent pneumonia. The admission was billed to Medicaid; however, Medicaid coverage had lapsed on December 1, 2025, and Medicare became primary effective November 1, 2025. The claim was rebilled to Medicare as primary — Medicare paid in full.`,
    keyFacts: [
      'Medicaid coverage lapsed December 1, 2025 — coverage inactive on DOS',
      'Medicare effective November 1, 2025 — correct primary payer for this admission',
      'Medicare crossover claim submitted and paid $2,340 in full',
    ],
  },

  'DN-2026-0103': {  // Franklin Pierce — Cigna Med Nec, Dec 2025
    patientId: 'MRN-922771',
    dob: '1955-08-07',
    sex: 'M',
    insuranceId: 'CGN-922771-EMP',
    admitDate: '2025-12-28',
    dischargeDate: '2026-01-02',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Elena Vasquez, MD',
    attendingNPI: '4567890123',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'K74.60', description: 'Unspecified cirrhosis of liver',                       type: 'primary' },
      { code: 'K65.9',  description: 'Peritonitis, unspecified',                             type: 'secondary' },
      { code: 'K70.41', description: 'Alcoholic hepatic failure without coma',               type: 'secondary' },
    ],
    procedures: [
      { code: '49082', description: 'Abdominal paracentesis, without imaging', date: '2025-12-29' },
      { code: '99223', description: 'Initial hospital care, high complexity', date: '2025-12-28' },
    ],
    clinicalSummary: `Mr. Pierce, a 70-year-old male with cirrhosis, presented December 28, 2025, with symptomatic ascites requiring paracentesis and an extended stay for hepatic monitoring. Cigna denied extended LOS beyond day 4 under InterQual criteria. The L1 appeal argued that ongoing coagulopathy and hepatic failure required continued inpatient monitoring, but documentation of deteriorating clinical indicators after day 4 was insufficient to support the payer's criteria. Finance approved write-off at $4,100.`,
    keyFacts: [
      'Cirrhosis with ascites and peritonitis — inpatient admission appropriate',
      'Extended LOS days 5–6 not adequately documented against Cigna InterQual criteria',
      'Paracentesis performed day 2 — procedural necessity supported',
      'L1 appeal upheld — documentation gap prevented further appeal value',
      'Finance write-off approved at $4,100',
    ],
  },

  'MRN-8821': {  // Dorothy Simmonds — UHC Medical Necessity (COPD exacerbation)
    patientId: 'MRN-8821',
    dob: '1958-09-14',
    sex: 'F',
    insuranceId: 'UHC-8821-GRP-0441',
    admitDate: '2026-03-15',
    dischargeDate: '2026-03-19',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Elena Petrov, MD',
    attendingNPI: '4455667788',
    facility: 'Memorial Health System — Main Campus',
    diagnoses: [
      { code: 'J44.1',  description: 'Chronic obstructive pulmonary disease with acute exacerbation', type: 'primary' },
      { code: 'J18.9',  description: 'Pneumonia, unspecified organism',                              type: 'secondary' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia',                       type: 'secondary' },
      { code: 'I10',    description: 'Essential (primary) hypertension',                             type: 'secondary' },
    ],
    procedures: [
      { code: '99223', description: 'Initial hospital care, high complexity',              date: '2026-03-15' },
      { code: '94002', description: 'Ventilation assist and management, first day',        date: '2026-03-15' },
      { code: '71046', description: 'Radiologic examination, chest, 2 views',              date: '2026-03-15' },
      { code: '94640', description: 'Pressurized inhalation treatment (nebulizer)',        date: '2026-03-16' },
      { code: '82803', description: 'Gases, blood pH and CO2 — arterial blood gas',       date: '2026-03-16' },
    ],
    drg: { billed: 'MS-DRG 190', billedWeight: 1.3122 },
    clinicalSummary: `Ms. Simmonds, a 67-year-old female with a longstanding history of COPD (GOLD Stage III), presented to the Emergency Department on March 15, 2026, with acute dyspnea, increased sputum production, and an oxygen saturation of 82% on room air. Arterial blood gas on arrival demonstrated respiratory acidosis (pH 7.28, PaCO2 68 mmHg, PaO2 52 mmHg), consistent with hypercapnic respiratory failure requiring immediate intervention. Chest X-ray showed diffuse bilateral infiltrates overlaid on known hyperinflation, and the clinical presentation was consistent with an acute COPD exacerbation complicated by community-acquired pneumonia.\n\nThe patient required BiPAP ventilation for 18 hours, aggressive bronchodilator therapy via continuous nebulization, IV corticosteroids (methylprednisolone), and IV azithromycin. Given the degree of respiratory compromise, hypoxic and hypercapnic failure, and active pneumonia, outpatient management was not a clinically appropriate option. Continuous respiratory monitoring with nursing assessment every two hours was maintained throughout the 4-night inpatient stay.\n\nMs. Simmonds was discharged on March 19, 2026, with oxygen saturation 94% on 2L nasal cannula at rest, transitioned to oral antibiotics and an oral steroid taper. Home oxygen was arranged prior to discharge. Follow-up with pulmonology was scheduled within one week.`,
    keyFacts: [
      'SpO2 82% on room air and ABG confirming hypercapnic respiratory failure on admission',
      'BiPAP ventilation required for 18 hours — not feasible in outpatient or observation setting',
      'Concurrent community-acquired pneumonia (J18.9) complicated clinical course',
      'Continuous nebulizer therapy, IV steroids, and IV antibiotics required throughout stay',
      'InterQual IP admission criteria met: respiratory failure, O2 < 88%, hypercapnia on ABG',
      'Discharge on supplemental O2 with pulmonology follow-up — clinically appropriate disposition',
    ],
  },

  'MRN-9034': {  // Daniel Forsythe — Cigna Coding Error (lumbar fusion diagnosis sequencing)
    patientId: 'MRN-9034',
    dob: '1971-04-22',
    sex: 'M',
    insuranceId: 'CIG-9034-IL-2026',
    admitDate: '2026-03-22',
    dischargeDate: '2026-03-24',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. James Whitfield, MD',
    attendingNPI: '5566778899',
    facility: 'Memorial Health System — Orthopedic Center',
    diagnoses: [
      { code: 'M51.16', description: 'Intervertebral disc degeneration, lumbar region',     type: 'primary' },
      { code: 'M48.06', description: 'Spinal stenosis, lumbar region',                      type: 'secondary' },
      { code: 'M54.5',  description: 'Low back pain',                                       type: 'secondary' },
      { code: 'M51.17', description: 'Intervertebral disc degeneration, lumbosacral region', type: 'secondary' },
    ],
    procedures: [
      { code: '22633', description: 'Posterior lumbar interbody fusion, L4-L5', date: '2026-03-22' },
      { code: '22842', description: 'Posterior segmental instrumentation, 3-6 vertebral segments', date: '2026-03-22' },
      { code: '72148', description: 'MRI lumbar spine without contrast', date: '2026-03-10' },
    ],
    clinicalSummary: `Mr. Torres, a 54-year-old male with a 3-year history of progressive lumbar disc degeneration and symptomatic spinal stenosis at L4-L5, presented for elective posterior lumbar interbody fusion on March 22, 2026. Preoperative MRI (March 10, 2026) demonstrated severe foraminal narrowing at L4-L5 with impingement on the right L5 nerve root, moderate disc space collapse, and Grade I spondylolisthesis. Conservative management including physical therapy, epidural steroid injections, and NSAIDs had been exhausted over an 18-month course without adequate pain relief or functional improvement.\n\nThe operative report documents a posterior lumbar interbody fusion (PLIF) at L4-L5 with instrumentation. The primary operative indication was lumbar stenosis with radiculopathy. The submitted claim used M51.16 (disc degeneration) as the principal diagnosis, with M48.06 (spinal stenosis) as a secondary code. Cigna's denial indicates that M48.06 (lumbar spinal stenosis) should be the principal diagnosis as the primary operative indication, with disc degeneration sequenced as a secondary finding. The correction is a technical sequencing issue — the clinical presentation and medical necessity are not in dispute.\n\nThe patient was discharged on March 24, 2026, in stable condition with a pain score of 3/10, ambulating with physical therapy, and cleared for home discharge with outpatient PT arranged.`,
    keyFacts: [
      'Lumbar spinal stenosis (M48.06) is the primary operative indication — should sequence as principal Dx',
      'M51.16 (disc degeneration) is a contributing but secondary finding per operative documentation',
      'MRI demonstrates severe foraminal narrowing at L4-L5 — stenosis is the dominant pathology',
      'Conservative management failure documented over 18 months (PT, ESIs, NSAIDs)',
      'Corrected sequencing: M48.06 principal, M51.16 secondary — clinical necessity unchanged',
      'ICD-10-CM guideline Section II supports stenosis as principal Dx when it is the operative indication',
    ],
  },

  'MRN-7712': {  // Vivienne Okafor — Palmetto GBA ADR (total hip arthroplasty)
    patientId: 'MRN-7712',
    dob: '1944-07-08',
    sex: 'F',
    insuranceId: 'Medicare-7712-A',
    admitDate: '2026-03-18',
    dischargeDate: '2026-03-21',
    admitType: 'Inpatient',
    attendingPhysician: 'Dr. Samuel Adeyemi, MD',
    attendingNPI: '6677889900',
    facility: 'Memorial Health System — Orthopedic Center',
    diagnoses: [
      { code: 'M16.11', description: 'Primary osteoarthritis, right hip',                              type: 'primary' },
      { code: 'M79.621', description: 'Pain in right upper arm',                                      type: 'secondary' },
      { code: 'Z96.641', description: 'Presence of right artificial hip joint',                       type: 'secondary' },
      { code: 'E11.9',   description: 'Type 2 diabetes mellitus without complications',               type: 'secondary' },
    ],
    procedures: [
      { code: '27130', description: 'Total hip arthroplasty', date: '2026-03-18' },
      { code: '27236', description: 'Femoral neck fracture fixation (staged; not applicable)', date: '2026-03-18' },
      { code: '73721', description: 'MRI any joint, lower extremity without contrast', date: '2026-03-05' },
    ],
    drg: { billed: 'MS-DRG 470', billedWeight: 2.0533 },
    clinicalSummary: `Ms. Okafor, an 81-year-old female with end-stage primary osteoarthritis of the right hip, underwent elective total hip arthroplasty (THA) on March 18, 2026. She presented with a 5-year history of progressive right hip pain, functional limitation, and failed conservative management including analgesics, intra-articular corticosteroid injections, and a structured physical therapy program. Preoperative MRI (March 5, 2026) demonstrated severe joint space narrowing, subchondral sclerosis, and osteophyte formation consistent with Grade 4 Kellgren-Lawrence osteoarthritis. Harris Hip Score preoperatively was 38/100 — consistent with severe disability.\n\nPalmetto GBA's Additional Development Request (ADR) was received March 25, 2026, requesting documentation to support the medical necessity of inpatient admission under MS-DRG 470. The documentation request is standard for this DRG under prepayment review protocols. The medical record demonstrates a complete conservative management trial, functional impairment, and appropriate patient selection for elective THA. The 3-night inpatient stay was required for post-surgical monitoring, anticoagulation management, and physical therapy clearance for home discharge.\n\nMs. Okafor was discharged March 21, 2026, to home with home health PT arranged, tolerating weight-bearing as tolerated, and anticoagulation therapy initiated for DVT prophylaxis.`,
    keyFacts: [
      'End-stage OA right hip — Grade 4 Kellgren-Lawrence on preoperative MRI (March 5)',
      'Harris Hip Score 38/100 preoperatively — consistent with severe functional disability',
      'Conservative management failure documented: analgesics, corticosteroid injections, structured PT',
      'Inpatient stay medically required: post-surgical monitoring, anticoagulation, PT clearance',
      'MS-DRG 470 supported by procedure (CPT 27130) and principal diagnosis (M16.11)',
      'Discharge to home with home health PT — appropriate post-acute disposition for THA',
    ],
  },
}
