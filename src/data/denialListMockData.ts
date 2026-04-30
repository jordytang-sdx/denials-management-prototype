// ─── Filter Options ──────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { label: 'Generating', color: '#157d9d' },
  { label: 'Ready for Review', color: '#2da390' },
  { label: 'Submitted', color: '#6D4C41', children: ['Overturned', 'Denial Upheld'] },
  { label: 'Failed', color: '#d44a52', children: ['Unsupported File Type', 'Upload Failed', 'Extraction Failed', 'Letter Writing Failed'] },
  { label: 'Will Not Submit', color: '#757575' },
  { label: 'Archived', color: '#757575' },
  { label: 'Data Not Available', color: '#757575' },
  { label: 'Unsupported Date', color: '#757575' },
]

export const TYPE_OPTIONS = ['All', 'Medical Necessity', 'DRG Downgrade']
export const LEVEL_OPTIONS = ['All', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']

export const PAYER_OPTIONS = [
  'Aetna',
  'Blue Cross Blue Shield',
  'Blue Cross Blue Shield of Michigan',
  'Cigna',
  'Humana',
  'Medicaid HMP Blue Cross Complete',
  'Medicare Advantage',
  'UnitedHealthcare',
]

export const LOCATION_OPTIONS = [
  'Clearwater Medical Center',
  'Clearwater University Hospital',
  'Clearwater Regional – Northgate',
  'Clearwater Regional – Riverside',
  'Clearwater Community Hospital – Westside',
]

export const REVIEWER_OPTIONS = [
  'Krista Soriano',
  'Sarah Chen',
  'Michael Torres',
  'Emily Watson',
  'James Patel',
  'Lisa Nguyen',
  'Robert Kim',
  'Amanda Foster',
  'David Hernandez',
]

export const CURRENT_USER = 'Krista Soriano'

// ─── Denial Cards ─────────────────────────────────────────────────────────────

export interface DenialCard {
  id: string
  patientName: string
  fin: string
  mrn: string
  visitId: string
  dob: string
  admissionDate: string
  dischargeDate: string
  location: string
  atRisk: string | null
  type: 'DRG Downgrade' | 'Medical Necessity'
  drgTypeLabel: string | null
  createdDate: string
  appealDeadline: string | null
  level: string
  status: string
  payer: string
  payerType: string
  reviewer: string
  assignedTo: string
  uploadedBy: string
  commentCount: number
  drgChangeData: {
    drgChipText: string
    drgTooltip: string[]
    diagnosisChanges: { id: string; kind: string; chipLabel: string; tooltip: string[] }[]
    procedureChanges: { id: string; kind: string; chipLabel: string; tooltip: string[] }[]
  } | null
  medicalNecessityData: {
    denialScope?: { chipLabel: string; tooltip: string[] }
    payerRationale?: { chipLabel: string; tooltip: string[] }
  } | null
}

export const DENIAL_CARDS: DenialCard[] = [
  {
    id: 'denial-001',
    patientName: 'ROBERT MARTINEZ',
    fin: '7000100678901',
    mrn: '300012001',
    visitId: '120680001',
    dob: '03/14/1958',
    admissionDate: '12/12/2025',
    dischargeDate: '12/15/2025',
    location: 'Clearwater Medical Center',
    atRisk: '–$8,450',
    type: 'DRG Downgrade',
    drgTypeLabel: 'MS-DRG',
    createdDate: 'January 1, 2026',
    appealDeadline: '05/01/2026',
    level: 'Level 2',
    status: 'Ready for Review',
    payer: 'Blue Cross Blue Shield',
    payerType: 'Commercial',
    reviewer: 'Krista Soriano',
    assignedTo: 'Krista Soriano',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: {
      drgChipText: 'DRG 309 (MCC) → 310 (Base)',
      drgTooltip: [
        '• Billed MS-DRG: 309 – Cardiac arrhythmia and conduction disorders (MCC)',
        '',
        '• Payer-adjusted MS-DRG: 310 – Cardiac arrhythmia and conduction disorders (Base)',
      ],
      diagnosisChanges: [
        { id: 'J96.01', kind: 'removed', chipLabel: 'Removed J96.01', tooltip: ['Removed by payer:', '  • J96.01 Acute respiratory failure with hypoxia'] },
      ],
      procedureChanges: [],
    },
    medicalNecessityData: null,
  },
  {
    id: 'denial-002',
    patientName: 'MARY DAVIS',
    fin: '7000100678901',
    mrn: '300012002',
    visitId: '120680002',
    dob: '07/22/1945',
    admissionDate: '12/18/2025',
    dischargeDate: '12/20/2025',
    location: 'Clearwater University Hospital',
    atRisk: '–$4,876',
    type: 'DRG Downgrade',
    drgTypeLabel: 'MS-DRG',
    createdDate: 'January 1, 2026',
    appealDeadline: '05/01/2026',
    level: 'Level 1',
    status: 'Ready for Review',
    payer: 'Humana',
    payerType: 'Medicare Advantage',
    reviewer: 'Sarah Chen',
    assignedTo: 'Sarah Chen',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: {
      drgChipText: 'DRG 291 (CC) → 292 (Base)',
      drgTooltip: [
        '• Billed MS-DRG: 291 – Heart failure and shock with CC (CC)',
        '',
        '• Payer-adjusted MS-DRG: 292 – Heart failure and shock without CC/MCC (Base)',
      ],
      diagnosisChanges: [
        { id: 'I48.0', kind: 'principal_changed', chipLabel: 'Principal Dx changed to I48.0', tooltip: ['• Billed principal diagnosis: I50.21 Acute systolic heart failure', '• Payer principal diagnosis: I48.0 Paroxysmal atrial fibrillation'] },
        { id: 'E87.1', kind: 'added', chipLabel: 'Added E87.1', tooltip: ['Added by payer:', '  • E87.1 Hypo-osmolality and hyponatremia'] },
      ],
      procedureChanges: [],
    },
    medicalNecessityData: null,
  },
  {
    id: 'denial-003',
    patientName: 'JENNIFER CHEN',
    fin: '7000100678901',
    mrn: '300012003',
    visitId: '120680003',
    dob: '11/05/1972',
    admissionDate: '12/08/2025',
    dischargeDate: '12/10/2025',
    location: 'Clearwater Regional – Riverside',
    atRisk: '–$13,000',
    type: 'DRG Downgrade',
    drgTypeLabel: 'MS-DRG',
    createdDate: 'December 31, 2025',
    appealDeadline: '04/30/2026',
    level: 'Level 1',
    status: 'Ready for Review',
    payer: 'Medicaid HMP Blue Cross Complete',
    payerType: 'Medicaid',
    reviewer: 'Emily Watson',
    assignedTo: 'Emily Watson',
    uploadedBy: 'Krista Soriano',
    commentCount: 2,
    drgChangeData: {
      drgChipText: 'DRG 193 (MCC) → 195 (CC)',
      drgTooltip: [
        '• Billed MS-DRG: 193 – Simple pneumonia and pleurisy with MCC',
        '',
        '• Payer-adjusted MS-DRG: 195 – Simple pneumonia and pleurisy with CC',
      ],
      diagnosisChanges: [
        { id: 'J96.01', kind: 'removed', chipLabel: 'Removed J96.01', tooltip: ['Removed by payer:', '  • J96.01 Acute respiratory failure with hypoxia'] },
        { id: 'E87.1', kind: 'removed', chipLabel: 'Removed E87.1', tooltip: ['Removed by payer:', '  • E87.1 Hypo-osmolality and hyponatremia'] },
        { id: 'R75.88', kind: 'removed', chipLabel: 'Removed R75.88', tooltip: ['Removed by payer:', '  • R79.89 Other specified abnormal findings of blood chemistry'] },
      ],
      procedureChanges: [
        { id: '0W3P8ZZ', kind: 'removed', chipLabel: 'Removed 0W3P8ZZ', tooltip: ['Removed by payer:', '  • 0W3P8ZZ Drainage of right pleural cavity, via natural or artificial opening'] },
      ],
    },
    medicalNecessityData: null,
  },
  {
    id: 'denial-004',
    patientName: 'JOHN SMITH',
    fin: '7000100678901',
    mrn: '300012004',
    visitId: '120680004',
    dob: '04/30/1961',
    admissionDate: '01/15/2026',
    dischargeDate: '01/16/2026',
    location: 'Clearwater Regional – Northgate',
    atRisk: '–$2,450',
    type: 'Medical Necessity',
    drgTypeLabel: null,
    createdDate: 'December 31, 2025',
    appealDeadline: '05/31/2026',
    level: 'Level 1',
    status: 'Ready for Review',
    payer: 'UnitedHealthcare',
    payerType: 'Commercial',
    reviewer: 'James Patel',
    assignedTo: 'James Patel',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: null,
    medicalNecessityData: {
      denialScope: { chipLabel: 'Inpatient admission denied', tooltip: ['• Billed level of care: Inpatient', '• Payer determination: Observation', '• Effective dates: Jan 15, 2026 – Jan 16, 2026'] },
      payerRationale: { chipLabel: 'Criteria not met', tooltip: ['  • Clinical documentation did not support inpatient level of care.', '  • Acute inpatient criteria were not met.', '  • Guideline referenced: InterQual inpatient criteria'] },
    },
  },
  {
    id: 'denial-005',
    patientName: 'SARAH JOHNSON',
    fin: '7000100678901',
    mrn: '300012005',
    visitId: '120680005',
    dob: '09/14/1980',
    admissionDate: '12/10/2025',
    dischargeDate: '12/11/2025',
    location: 'Clearwater Community Hospital – Westside',
    atRisk: '–$6,450',
    type: 'Medical Necessity',
    drgTypeLabel: null,
    createdDate: 'December 31, 2025',
    appealDeadline: '05/31/2026',
    level: 'Level 1',
    status: 'Ready for Review',
    payer: 'Blue Cross Blue Shield of Michigan',
    payerType: 'Commercial',
    reviewer: 'Lisa Nguyen',
    assignedTo: 'Lisa Nguyen',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: null,
    medicalNecessityData: {
      denialScope: { chipLabel: 'Inpatient admission denied', tooltip: ['• Billed level of care: Inpatient', '• Payer determination: Observation', '• Effective dates: Dec 10, 2025 – Dec 11, 2025'] },
      payerRationale: { chipLabel: 'Criteria not met', tooltip: ['  • Clinical documentation did not support inpatient level of care.', '  • Acute inpatient criteria were not met.', '  • Guideline referenced: MCG inpatient criteria'] },
    },
  },
  {
    id: 'denial-006',
    patientName: 'PATRICIA LEE',
    fin: '7000100678902',
    mrn: '300012006',
    visitId: '120680006',
    dob: '02/18/1953',
    admissionDate: '12/02/2025',
    dischargeDate: '12/05/2025',
    location: 'Clearwater Medical Center',
    atRisk: '–$3,200',
    type: 'DRG Downgrade',
    drgTypeLabel: 'APR-DRG',
    createdDate: 'December 30, 2025',
    appealDeadline: '05/30/2026',
    level: 'Level 2',
    status: 'Ready for Review',
    payer: 'Aetna',
    payerType: 'Commercial',
    reviewer: 'Robert Kim',
    assignedTo: 'Robert Kim',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: {
      drgChipText: 'APR-DRG 193, SOI 2 → 1',
      drgTooltip: [
        '• Billed APR-DRG: 193 – Simple pneumonia and pleurisy',
        '• Severity of Illness (SOI): 2',
        '',
        '• Payer-adjusted APR-DRG: 193 – Simple pneumonia and pleurisy',
        '• Severity of Illness (SOI): 1',
      ],
      diagnosisChanges: [
        { id: 'E87.1', kind: 'removed', chipLabel: 'Removed E87.1', tooltip: ['Removed by payer:', '  • E87.1 Hypo-osmolality and hyponatremia'] },
      ],
      procedureChanges: [],
    },
    medicalNecessityData: null,
  },
  {
    id: 'denial-007',
    patientName: 'MICHAEL TORRES',
    fin: '7000100678903',
    mrn: '300012007',
    visitId: '120680007',
    dob: '06/03/1967',
    admissionDate: '11/28/2025',
    dischargeDate: '12/01/2025',
    location: 'Clearwater University Hospital',
    atRisk: '–$5,680',
    type: 'DRG Downgrade',
    drgTypeLabel: 'APR-DRG',
    createdDate: 'December 30, 2025',
    appealDeadline: '05/30/2026',
    level: 'Level 1',
    status: 'Ready for Review',
    payer: 'Cigna',
    payerType: 'Commercial',
    reviewer: 'Amanda Foster',
    assignedTo: 'Amanda Foster',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: {
      drgChipText: 'APR-DRG 291 → 292, SOI 2 → 1',
      drgTooltip: [
        '• Billed APR-DRG: 291 – Heart failure and shock',
        '• Severity of Illness (SOI): 2',
        '',
        '• Payer-adjusted APR-DRG: 292 – Cardiac arrhythmia and conduction disorders',
        '• Severity of Illness (SOI): 1',
      ],
      diagnosisChanges: [
        { id: 'J96.01', kind: 'removed', chipLabel: 'Removed J96.01', tooltip: ['Removed by payer:', '  • J96.01 Acute respiratory failure with hypoxia'] },
        { id: 'E87.1', kind: 'removed', chipLabel: 'Removed E87.1', tooltip: ['Removed by payer:', '  • E87.1 Hypo-osmolality and hyponatremia'] },
      ],
      procedureChanges: [],
    },
    medicalNecessityData: null,
  },
  {
    id: 'denial-008',
    patientName: 'LINDA JACKSON',
    fin: '7000100678904',
    mrn: '300012008',
    visitId: '120680008',
    dob: '08/29/1940',
    admissionDate: '11/25/2025',
    dischargeDate: '11/28/2025',
    location: 'Clearwater Regional – Riverside',
    atRisk: '–$4,100',
    type: 'DRG Downgrade',
    drgTypeLabel: 'APR-DRG',
    createdDate: 'December 30, 2025',
    appealDeadline: '05/30/2026',
    level: 'Level 2',
    status: 'Ready for Review',
    payer: 'Medicare Advantage',
    payerType: 'Medicare Advantage',
    reviewer: 'David Hernandez',
    assignedTo: 'David Hernandez',
    uploadedBy: 'Krista Soriano',
    commentCount: 0,
    drgChangeData: {
      drgChipText: 'APR-DRG 291 → 292',
      drgTooltip: [
        '• Billed APR-DRG: 291 – Heart failure and shock',
        '• Severity of Illness (SOI): 1',
        '',
        '• Payer-adjusted APR-DRG: 292 – Cardiac arrhythmia and conduction disorders',
        '• Severity of Illness (SOI): 1',
      ],
      diagnosisChanges: [
        { id: 'I48.0', kind: 'principal_changed', chipLabel: 'Principal Dx changed to I48.0', tooltip: ['• Billed principal diagnosis: I50.21 Acute systolic heart failure', '• Payer principal diagnosis: I48.0 Paroxysmal atrial fibrillation'] },
      ],
      procedureChanges: [],
    },
    medicalNecessityData: null,
  },
]
