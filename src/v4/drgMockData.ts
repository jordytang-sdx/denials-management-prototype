export type DrgSeverity = 'MCC' | 'CC' | 'Base' | null
export type DrgBilledLabel = 'Billed Principal' | 'Billed MCC' | 'Billed CC' | null
export type DiagnosisAdjustment =
  | 'Unchanged'
  | 'Removed'
  | 'Changed to Principal'
  | 'Changed to Secondary'
  | 'Added'

export const DIAGNOSIS_ADJUSTMENT_OPTIONS: DiagnosisAdjustment[] = [
  'Unchanged', 'Changed to Secondary', 'Changed to Principal', 'Removed', 'Added',
]

export interface DrgRow { code: string; description: string; severity: DrgSeverity }
export interface DiagnosisRow {
  id: string
  code: string
  name: string
  billedLabel: DrgBilledLabel
  defaultAdjustment: DiagnosisAdjustment
}
export interface ProcedureRow {
  id: string
  code: string
  name: string
  defaultAdjustment: DiagnosisAdjustment
}
export interface DrgAdjustments {
  drgSystem: 'MS-DRG' | 'APR-DRG'
  billed: DrgRow
  payerAdjusted: DrgRow
  diagnoses: DiagnosisRow[]
  procedures: ProcedureRow[]
}

// ── Per-case demo data ───────────────────────────────────────────────────────

// MS-DRG 291 → 292 (Heart Failure and Shock, w/ MCC → w/ CC)
const HEART_FAILURE_291_TO_292: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '291', description: 'Heart Failure and Shock w/ MCC', severity: 'MCC' },
  payerAdjusted: { code: '292', description: 'Heart Failure and Shock w/ CC',  severity: 'CC' },
  diagnoses: [
    { id: 'dx-1', code: 'I50.21', name: 'Acute systolic (congestive) heart failure',         billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
    { id: 'dx-2', code: 'J96.21', name: 'Acute and chronic respiratory failure with hypoxia', billedLabel: 'Billed MCC',       defaultAdjustment: 'Removed'   },
    { id: 'dx-3', code: 'N17.9',  name: 'Acute kidney failure, unspecified',                  billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-4', code: 'I10',    name: 'Essential (primary) hypertension',                   billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-5', code: 'E11.9',  name: 'Type 2 diabetes mellitus without complications',     billedLabel: null,               defaultAdjustment: 'Unchanged' },
  ],
  procedures: [],
}

// MS-DRG 470 → 483 (Major Joint Replacement, w/ MCC → w/o MCC)
const MAJOR_JOINT_470_TO_483: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '470', description: 'Major Hip and Knee Joint Replacement w/o MCC',  severity: 'Base' },
  payerAdjusted: { code: '483', description: 'Major Joint/Limb Reattachment of Upper Extremity', severity: 'Base' },
  diagnoses: [
    { id: 'dx-1', code: 'M17.11', name: 'Unilateral primary osteoarthritis, right knee', billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
    { id: 'dx-2', code: 'I10',    name: 'Essential (primary) hypertension',              billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-3', code: 'E78.5',  name: 'Hyperlipidemia, unspecified',                   billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-4', code: 'D62',    name: 'Acute posthemorrhagic anemia',                  billedLabel: 'Billed MCC',       defaultAdjustment: 'Removed'   },
  ],
  procedures: [
    { id: 'px-1', code: '0SRC0J9', name: 'Replacement of right knee joint with synthetic substitute', defaultAdjustment: 'Unchanged' },
  ],
}

// MS-DRG 194 → 195 (Simple Pneumonia and Pleurisy w/ CC → w/o CC/MCC)
const PNEUMONIA_194_TO_195: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '194', description: 'Simple Pneumonia and Pleurisy w/ CC',     severity: 'CC'   },
  payerAdjusted: { code: '195', description: 'Simple Pneumonia and Pleurisy w/o CC/MCC', severity: 'Base' },
  diagnoses: [
    { id: 'dx-1', code: 'J18.9', name: 'Pneumonia, unspecified organism',          billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
    { id: 'dx-2', code: 'J90',   name: 'Pleural effusion, not elsewhere classified', billedLabel: 'Billed CC',      defaultAdjustment: 'Removed'   },
    { id: 'dx-3', code: 'I10',   name: 'Essential (primary) hypertension',          billedLabel: null,              defaultAdjustment: 'Unchanged' },
  ],
  procedures: [],
}

// Reference demo (Septicemia → Pneumonia) — used as the default fallback
const SEPSIS_871_TO_194: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '871', description: 'Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC', severity: 'MCC' },
  payerAdjusted: { code: '194', description: 'Simple Pneumonia and Pleurisy w/ CC',                 severity: 'CC'  },
  diagnoses: [
    { id: 'dx-1', code: 'A41.9',  name: 'Sepsis, unspecified organism',                          billedLabel: 'Billed Principal', defaultAdjustment: 'Removed'              },
    { id: 'dx-2', code: 'R65.20', name: 'Severe sepsis without septic shock',                    billedLabel: null,               defaultAdjustment: 'Removed'              },
    { id: 'dx-3', code: 'J96.21', name: 'Acute and chronic respiratory failure with hypoxia',    billedLabel: 'Billed MCC',       defaultAdjustment: 'Removed'              },
    { id: 'dx-4', code: 'J18.9',  name: 'Pneumonia, unspecified organism',                       billedLabel: null,               defaultAdjustment: 'Changed to Principal' },
    { id: 'dx-5', code: 'N17.9',  name: 'Acute kidney failure, unspecified',                     billedLabel: null,               defaultAdjustment: 'Unchanged'            },
    { id: 'dx-6', code: 'I10',    name: 'Essential (primary) hypertension',                      billedLabel: null,               defaultAdjustment: 'Unchanged'            },
  ],
  procedures: [],
}

// Subtype → adjustments lookup. Keys match the patterns in denialSubtype.
const BY_SUBTYPE: Record<string, DrgAdjustments> = {
  'MS-DRG 291 → 292': HEART_FAILURE_291_TO_292,
  'MS-DRG 470 → 483': MAJOR_JOINT_470_TO_483,
  'MS-DRG 194 → 195': PNEUMONIA_194_TO_195,
  'MS-DRG 871 → 194': SEPSIS_871_TO_194,
}

// ── Searchable code option lists ─────────────────────────────────────────────

export const DRG_CODE_OPTIONS = [
  '871 – Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC',
  '872 – Septicemia or Severe Sepsis w/o MV >96 Hours w/ CC',
  '873 – Septicemia or Severe Sepsis w/o MV >96 Hours w/o CC/MCC',
  '193 – Simple Pneumonia and Pleurisy w/ MCC',
  '194 – Simple Pneumonia and Pleurisy w/ CC',
  '195 – Simple Pneumonia and Pleurisy w/o CC/MCC',
  '177 – Respiratory Infections and Inflammations w/ MCC',
  '178 – Respiratory Infections and Inflammations w/ CC',
  '291 – Heart Failure and Shock w/ MCC',
  '292 – Heart Failure and Shock w/ CC',
  '293 – Heart Failure and Shock w/o CC/MCC',
  '470 – Major Hip and Knee Joint Replacement w/o MCC',
  '483 – Major Joint/Limb Reattachment of Upper Extremity',
  '189 – Pulmonary Edema and Respiratory Failure',
  '812 – Red Blood Cell Disorders w/ MCC',
  '813 – Red Blood Cell Disorders w/o MCC',
]

export const ICD10_CODE_OPTIONS = [
  'A41.9 – Sepsis, unspecified organism',
  'R65.20 – Severe sepsis without septic shock',
  'J96.21 – Acute and chronic respiratory failure with hypoxia',
  'J18.9 – Pneumonia, unspecified organism',
  'N17.9 – Acute kidney failure, unspecified',
  'I10 – Essential (primary) hypertension',
  'E11.9 – Type 2 diabetes mellitus without complications',
  'I50.21 – Acute systolic (congestive) heart failure',
  'I50.9 – Heart failure, unspecified',
  'J44.1 – COPD with acute exacerbation',
  'J96.00 – Acute respiratory failure, unspecified',
  'M17.11 – Unilateral primary osteoarthritis, right knee',
  'D62 – Acute posthemorrhagic anemia',
  'E78.5 – Hyperlipidemia, unspecified',
  'K92.1 – Melena',
  'G20 – Parkinson\'s disease',
  'F32.9 – Major depressive disorder, single episode',
  'Z87.891 – Personal history of nicotine dependence',
  'J90 – Pleural effusion, not elsewhere classified',
]

export const PROCEDURE_CODE_OPTIONS = [
  '0SRC0J9 – Replacement of right knee joint with synthetic substitute',
  '0SRB0J9 – Replacement of left knee joint with synthetic substitute',
  '5A1522F – Extracorporeal oxygenation, supersaturated, central',
  '0BH17EZ – Insertion of endotracheal airway into trachea',
  '3E0336Z – Introduction of nutritional substance into peripheral vein',
  '0210093 – Bypass coronary artery, one artery from right internal mammary',
  '027034Z – Dilation of coronary artery, one artery with drug-eluting intraluminal device',
]

/** Derives MCC / CC / Base severity from a DRG option string like "871 – Septicemia... w/ MCC" */
export function parseDrgSeverity(optionString: string): DrgSeverity {
  const s = optionString.toLowerCase()
  if (s.includes('w/ mcc') || s.endsWith('mcc')) return 'MCC'
  if (s.includes('w/ cc') || s.endsWith(' cc')) return 'CC'
  if (s.includes('w/o cc') || s.includes('w/o mcc') || s.includes('w/o cc/mcc')) return 'Base'
  return null
}

export function getDrgAdjustmentsForSubtype(subtype: string | null | undefined): DrgAdjustments {
  if (subtype && BY_SUBTYPE[subtype]) return BY_SUBTYPE[subtype]!
  return SEPSIS_871_TO_194
}
