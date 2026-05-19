// ── Severity / label types ────────────────────────────────────────────────────

/** MS-DRG: MCC / CC / Base. APR-DRG: SOI 1–4. */
export type DrgSeverity =
  | 'MCC' | 'CC' | 'Base'                       // MS-DRG
  | 'SOI 1' | 'SOI 2' | 'SOI 3' | 'SOI 4'      // APR-DRG
  | null

/** MS-DRG billed-role labels use CC/MCC language.
 *  APR-DRG billed-role labels use SOI-impact language. */
export type DrgBilledLabel =
  | 'Billed Principal'      // both groupers
  | 'Billed MCC'            // MS-DRG only
  | 'Billed CC'             // MS-DRG only
  | 'SOI Driver'            // APR-DRG — diagnosis that drives SOI level (replaces Billed MCC)
  | 'Contributes to SOI'    // APR-DRG — diagnosis that influences SOI (replaces Billed CC)
  | null

export type DiagnosisAdjustment =
  | 'Unchanged'
  | 'Removed'
  | 'Changed to Principal'
  | 'Changed to Secondary'
  | 'Added'

export const DIAGNOSIS_ADJUSTMENT_OPTIONS: DiagnosisAdjustment[] = [
  'Unchanged', 'Changed to Secondary', 'Changed to Principal', 'Removed', 'Added',
]

// ── Row types ─────────────────────────────────────────────────────────────────

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

/** Grouper-specific block used for the optional APR-DRG counterpart data. */
export interface GrouperData {
  billed: DrgRow
  payerAdjusted: DrgRow
  diagnoses: DiagnosisRow[]
}

export interface DrgAdjustments {
  drgSystem: 'MS-DRG' | 'APR-DRG'
  billed: DrgRow
  payerAdjusted: DrgRow
  diagnoses: DiagnosisRow[]
  procedures: ProcedureRow[]
  /** APR-DRG counterpart data. When present, rendered when user switches to APR-DRG toggle. */
  aprDrg?: GrouperData
}

// ── MS-DRG per-case mock data ──────────────────────────────────────────────────

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
  aprDrg: {
    billed:        { code: '194', description: 'Heart Failure, SOI 4 — Extreme',   severity: 'SOI 4' },
    payerAdjusted: { code: '194', description: 'Heart Failure, SOI 2 — Moderate',  severity: 'SOI 2' },
    diagnoses: [
      { id: 'dx-1', code: 'I50.21', name: 'Acute systolic (congestive) heart failure',         billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
      { id: 'dx-2', code: 'J96.21', name: 'Acute and chronic respiratory failure with hypoxia', billedLabel: 'SOI Driver',       defaultAdjustment: 'Removed'   },
      { id: 'dx-3', code: 'N17.9',  name: 'Acute kidney failure, unspecified',                  billedLabel: 'Contributes to SOI', defaultAdjustment: 'Unchanged' },
      { id: 'dx-4', code: 'I10',    name: 'Essential (primary) hypertension',                   billedLabel: null,                defaultAdjustment: 'Unchanged' },
      { id: 'dx-5', code: 'E11.9',  name: 'Type 2 diabetes mellitus without complications',     billedLabel: null,                defaultAdjustment: 'Unchanged' },
    ],
  },
}

const MAJOR_JOINT_470_TO_483: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '470', description: 'Major Hip and Knee Joint Replacement w/o MCC',         severity: 'Base' },
  payerAdjusted: { code: '483', description: 'Major Joint/Limb Reattachment of Upper Extremity',     severity: 'Base' },
  diagnoses: [
    { id: 'dx-1', code: 'M17.11', name: 'Unilateral primary osteoarthritis, right knee', billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
    { id: 'dx-2', code: 'I10',    name: 'Essential (primary) hypertension',              billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-3', code: 'E78.5',  name: 'Hyperlipidemia, unspecified',                   billedLabel: null,               defaultAdjustment: 'Unchanged' },
    { id: 'dx-4', code: 'D62',    name: 'Acute posthemorrhagic anemia',                  billedLabel: 'Billed MCC',       defaultAdjustment: 'Removed'   },
  ],
  procedures: [
    { id: 'px-1', code: '0SRC0J9', name: 'Replacement of right knee joint with synthetic substitute', defaultAdjustment: 'Unchanged' },
  ],
  aprDrg: {
    billed:        { code: '301', description: 'Hip Joint Replacement, SOI 3 — Major',    severity: 'SOI 3' },
    payerAdjusted: { code: '302', description: 'Hip Joint Replacement, SOI 1 — Minor',    severity: 'SOI 1' },
    diagnoses: [
      { id: 'dx-1', code: 'M17.11', name: 'Unilateral primary osteoarthritis, right knee', billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
      { id: 'dx-2', code: 'I10',    name: 'Essential (primary) hypertension',              billedLabel: null,               defaultAdjustment: 'Unchanged' },
      { id: 'dx-3', code: 'E78.5',  name: 'Hyperlipidemia, unspecified',                   billedLabel: null,               defaultAdjustment: 'Unchanged' },
      { id: 'dx-4', code: 'D62',    name: 'Acute posthemorrhagic anemia',                  billedLabel: 'SOI Driver',       defaultAdjustment: 'Removed'   },
    ],
  },
}

const PNEUMONIA_194_TO_195: DrgAdjustments = {
  drgSystem: 'MS-DRG',
  billed:        { code: '194', description: 'Simple Pneumonia and Pleurisy w/ CC',       severity: 'CC'   },
  payerAdjusted: { code: '195', description: 'Simple Pneumonia and Pleurisy w/o CC/MCC',  severity: 'Base' },
  diagnoses: [
    { id: 'dx-1', code: 'J18.9', name: 'Pneumonia, unspecified organism',           billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
    { id: 'dx-2', code: 'J90',   name: 'Pleural effusion, not elsewhere classified', billedLabel: 'Billed CC',       defaultAdjustment: 'Removed'   },
    { id: 'dx-3', code: 'I10',   name: 'Essential (primary) hypertension',           billedLabel: null,              defaultAdjustment: 'Unchanged' },
  ],
  procedures: [],
  aprDrg: {
    billed:        { code: '139', description: 'Other Pneumonia, SOI 3 — Major',       severity: 'SOI 3' },
    payerAdjusted: { code: '139', description: 'Other Pneumonia, SOI 1 — Minor',       severity: 'SOI 1' },
    diagnoses: [
      { id: 'dx-1', code: 'J18.9', name: 'Pneumonia, unspecified organism',           billedLabel: 'Billed Principal', defaultAdjustment: 'Unchanged' },
      { id: 'dx-2', code: 'J90',   name: 'Pleural effusion, not elsewhere classified', billedLabel: 'Contributes to SOI', defaultAdjustment: 'Removed' },
      { id: 'dx-3', code: 'I10',   name: 'Essential (primary) hypertension',           billedLabel: null,               defaultAdjustment: 'Unchanged' },
    ],
  },
}

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
  aprDrg: {
    billed:        { code: '137', description: 'Respiratory System Diagnosis, SOI 4 — Extreme', severity: 'SOI 4' },
    payerAdjusted: { code: '139', description: 'Other Pneumonia, SOI 2 — Moderate',             severity: 'SOI 2' },
    diagnoses: [
      { id: 'dx-1', code: 'A41.9',  name: 'Sepsis, unspecified organism',                          billedLabel: 'Billed Principal',  defaultAdjustment: 'Removed'              },
      { id: 'dx-2', code: 'R65.20', name: 'Severe sepsis without septic shock',                    billedLabel: 'SOI Driver',         defaultAdjustment: 'Removed'              },
      { id: 'dx-3', code: 'J96.21', name: 'Acute and chronic respiratory failure with hypoxia',    billedLabel: 'SOI Driver',         defaultAdjustment: 'Removed'              },
      { id: 'dx-4', code: 'J18.9',  name: 'Pneumonia, unspecified organism',                       billedLabel: null,                 defaultAdjustment: 'Changed to Principal' },
      { id: 'dx-5', code: 'N17.9',  name: 'Acute kidney failure, unspecified',                     billedLabel: 'Contributes to SOI', defaultAdjustment: 'Unchanged'            },
      { id: 'dx-6', code: 'I10',    name: 'Essential (primary) hypertension',                      billedLabel: null,                 defaultAdjustment: 'Unchanged'            },
    ],
  },
}

const BY_SUBTYPE: Record<string, DrgAdjustments> = {
  'MS-DRG 291 → 292': HEART_FAILURE_291_TO_292,
  'MS-DRG 470 → 483': MAJOR_JOINT_470_TO_483,
  'MS-DRG 194 → 195': PNEUMONIA_194_TO_195,
  'MS-DRG 871 → 194': SEPSIS_871_TO_194,
}

// ── Searchable code option lists ──────────────────────────────────────────────

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

export const APR_DRG_CODE_OPTIONS = [
  '137 – Respiratory System Diagnosis, SOI 4 — Extreme',
  '137 – Respiratory System Diagnosis, SOI 3 — Major',
  '137 – Respiratory System Diagnosis, SOI 2 — Moderate',
  '137 – Respiratory System Diagnosis, SOI 1 — Minor',
  '139 – Other Pneumonia, SOI 4 — Extreme',
  '139 – Other Pneumonia, SOI 3 — Major',
  '139 – Other Pneumonia, SOI 2 — Moderate',
  '139 – Other Pneumonia, SOI 1 — Minor',
  '194 – Heart Failure, SOI 4 — Extreme',
  '194 – Heart Failure, SOI 3 — Major',
  '194 – Heart Failure, SOI 2 — Moderate',
  '194 – Heart Failure, SOI 1 — Minor',
  '301 – Hip Joint Replacement, SOI 4 — Extreme',
  '301 – Hip Joint Replacement, SOI 3 — Major',
  '301 – Hip Joint Replacement, SOI 2 — Moderate',
  '301 – Hip Joint Replacement, SOI 1 — Minor',
  '302 – Knee Joint Replacement, SOI 3 — Major',
  '302 – Knee Joint Replacement, SOI 1 — Minor',
  '560 – Septicemia and Disseminated Infections, SOI 4 — Extreme',
  '560 – Septicemia and Disseminated Infections, SOI 3 — Major',
  '560 – Septicemia and Disseminated Infections, SOI 2 — Moderate',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derives MS-DRG severity from a DRG option string. Returns null for APR-DRG strings. */
export function parseDrgSeverity(optionString: string): DrgSeverity {
  const s = optionString.toLowerCase()
  // APR-DRG SOI — check before CC/MCC to avoid false matches
  if (s.includes('soi 4')) return 'SOI 4'
  if (s.includes('soi 3')) return 'SOI 3'
  if (s.includes('soi 2')) return 'SOI 2'
  if (s.includes('soi 1')) return 'SOI 1'
  // MS-DRG
  if (s.includes('w/ mcc') || s.endsWith('mcc')) return 'MCC'
  if (s.includes('w/ cc') || s.endsWith(' cc'))  return 'CC'
  if (s.includes('w/o cc') || s.includes('w/o mcc') || s.includes('w/o cc/mcc')) return 'Base'
  return null
}

/** Returns true for SOI severity values (APR-DRG). */
export function isSoiSeverity(s: DrgSeverity): boolean {
  return s === 'SOI 1' || s === 'SOI 2' || s === 'SOI 3' || s === 'SOI 4'
}

export function getDrgAdjustmentsForSubtype(subtype: string | null | undefined): DrgAdjustments {
  if (subtype && BY_SUBTYPE[subtype]) return BY_SUBTYPE[subtype]!
  return SEPSIS_871_TO_194
}
