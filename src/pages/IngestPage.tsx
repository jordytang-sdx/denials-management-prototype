import { useState, useRef, useCallback } from 'react'
import {
  Box, Typography, Paper, Button, Chip, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Checkbox, TextField, IconButton,
  LinearProgress, Divider, Alert, Drawer, Tooltip, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
} from '@mui/material'
import {
  UploadFileOutlined, CloseOutlined, WarningAmberOutlined, AutoFixHighOutlined,
  UpdateOutlined, ChevronRightOutlined, CodeOutlined, AccountTreeOutlined,
} from '@mui/icons-material'
import { type DenialRecord, type DenialState, type DenialStatus, type PossibleMatch, REVERSE_RELATIONSHIP, TEAM_MEMBERS, type TeamMember } from '../data/denials'

// ─── Source type ──────────────────────────────────────────────────────────────

type SourceType =
  | 'edi-835'
  | 'med-nec-denial'
  | 'auth-denial'
  | 'drg-downgrade'
  | 'adr'
  | 'appeal-upheld'
  | 'appeal-overturned'
  | 'underpayment'

const SOURCE_LABELS: Record<SourceType, string> = {
  'edi-835':           '835 Remit',
  'med-nec-denial':    'Med Nec Denial',
  'auth-denial':       'Auth Denial',
  'drg-downgrade':     'DRG Downgrade',
  'adr':               'ADR',
  'appeal-upheld':     'Appeal Upheld',
  'appeal-overturned': 'Appeal Overturned',
  'underpayment':      'Underpayment EOB',
}

const SOURCE_COLORS: Record<SourceType, { bg: string; color: string }> = {
  'edi-835':           { bg: '#EBF4FF', color: '#1B3A5C' },
  'med-nec-denial':    { bg: '#FFF5F5', color: '#9B1C1C' },
  'auth-denial':       { bg: '#FFF8E6', color: '#7D5A00' },
  'drg-downgrade':     { bg: '#F5F0FF', color: '#553C9A' },
  'adr':               { bg: '#F0FFF4', color: '#276749' },
  'appeal-upheld':     { bg: '#FEF2F2', color: '#991B1B' },
  'appeal-overturned': { bg: '#ECFDF5', color: '#065F46' },
  'underpayment':      { bg: '#FFF7ED', color: '#92400E' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Fuzzy match / link decision ─────────────────────────────────────────────

interface FuzzyMatch {
  existingDenialId: string
  confidence: 'high' | 'medium'
  reasons: string[]
  // snapshot for display
  patientName: string
  payer: string
  denialType: string
  state: DenialState
  deniedAmount: number
}


interface UpdateProposal {
  existingDenialId: string
  label: string
  updateType?: 'payment_full' | 'payment_partial' | 'denial_upheld' | 'denial_new_reason' | 'recoupment'
  episodeResultLabel?: string
  episodeResultDescription?: string
  suggestedState: DenialState
  suggestedStatus: DenialStatus
  updates: Partial<Pick<DenialRecord, 'deniedAmount' | 'carc' | 'rarc'>>
  diffs: Array<{ field: string; label: string; from: string; to: string }>
}

interface RawExtraction {
  sourceType: SourceType
  patientName: string
  mrn: string
  claimId: string
  payer: string
  denialType: string
  denialSubtype: string
  dos: string
  deadline: string
  uncertainFields?: string[]
  updateProposal?: UpdateProposal
  // Shared optional — present on some source types
  har?: string
  carc?: string
  rarc?: string
  deniedAmount?: number
  // 835-specific
  paidAmount?: number
  adjustmentAmount?: number
  // med-nec specific
  clinicalCriteria?: string
  reviewingPhysician?: string
  levelOfCare?: string
  // auth specific
  authNumber?: string
  serviceRequiringAuth?: string
  // drg specific
  originalDrg?: string
  adjustedDrg?: string
  originalPayment?: number
  adjustedPayment?: number
  // adr specific
  recordsRequested?: string
  submissionDeadline?: string
  // appeal-upheld specific
  furtherAppealRights?: string
  // appeal-overturned specific
  approvedAmount?: number
}

interface StagedRecord extends Omit<RawExtraction, 'uncertainFields'> {
  tempId: string
  selected: boolean
  status: 'new' | 'update' | 'duplicate'
  sourceFile: string
  suggestedEngine: string
  uncertainFields: string[]
  possibleMatches: FuzzyMatch[]
  assignedTo?: TeamMember | null
  rawContent?: string
}

// ─── Update outcome options ───────────────────────────────────────────────────

interface OutcomeOption {
  label: string
  sublabel: string
  state: DenialState
  status: DenialStatus
}

const UPDATE_OUTCOMES: Partial<Record<NonNullable<UpdateProposal['updateType']>, OutcomeOption[]>> = {
  payment_full: [
    { label: 'Recovered — Full Payment', sublabel: 'Payment confirmed via 835', state: 'Recovered', status: 'Overturned — Full Payment' },
  ],
  payment_partial: [
    { label: 'Recovered — Partial Payment', sublabel: 'Payment confirmed via 835', state: 'Recovered', status: 'Overturned — Partial Payment' },
    { label: 'Active — Pursue Remaining Balance', sublabel: 'Continue appealing for the outstanding difference', state: 'Active', status: 'In Progress' },
  ],
  denial_upheld: [
    { label: 'Active — Escalate to L2 / IRO', sublabel: 'Continue to the next available appeal level', state: 'Active', status: 'In Progress' },
    { label: 'Closed — Will Not Appeal', sublabel: 'Close case, denial stands', state: 'Closed', status: 'Will Not Appeal' },
  ],
  denial_new_reason: [
    { label: 'Active — Reassess Strategy', sublabel: 'Reopen and rework with updated denial reason', state: 'Active', status: 'In Progress' },
    { label: 'Closed — Will Not Appeal', sublabel: 'Close case given change in denial reason', state: 'Closed', status: 'Will Not Appeal' },
  ],
  recoupment: [
    { label: 'Active — Dispute Recoupment', sublabel: 'Open a dispute for the recoupment amount', state: 'Active', status: 'In Progress' },
    { label: 'Closed — Recoupment Accepted', sublabel: 'Accept the recoupment and close case', state: 'Closed', status: 'Closed' },
  ],
}

// ─── CARC → Denial type mapping ──────────────────────────────────────────────

const CARC_TO_DENIAL_TYPE: Record<string, string> = {
  '4':  'DRG Downgrade',   '6':  'DRG Downgrade',   '97': 'DRG Downgrade',
  '50': 'Medical Necessity','51': 'Medical Necessity','96': 'Medical Necessity','167':'Medical Necessity',
  '15': 'Authorization',   '55': 'Authorization',   '56': 'Authorization',   '57': 'Authorization',
  '16': 'Authorization',   '18': 'Authorization',
  '29': 'Timely Filing',
  '22': 'Eligibility',     '23': 'Eligibility',     '31': 'Eligibility',
  '45': 'Underpayment',
}

function denialTypeFromCarc(carc: string): string | null {
  // Accept both "CARC-50" and "50"
  const code = carc.replace(/^CARC-?/i, '').trim()
  return CARC_TO_DENIAL_TYPE[code] ?? null
}

// ─── Engine classification ────────────────────────────────────────────────────

const ENGINE_FROM_TYPE: Record<string, string> = {
  'Medical Necessity':  'Appeal',
  'DRG Downgrade':      'Appeal',
  'Authorization':      'Appeal',
  'ADR':                'Records Request',
  'Coding Error':       'Corrected Claim',
  'Administrative':     'Corrected Claim',
  'Timely Filing':      'Filing Defense',
  'Recoupment':         'Recoupment',
  'Eligibility':        'Eligibility',
  'Underpayment':       'Payment Dispute',
}

// Some source types determine the engine regardless of denial type
const ENGINE_FROM_SOURCE: Partial<Record<SourceType, string>> = {
  'adr':               'Records Request',
  'appeal-upheld':     'Appeal',
  'appeal-overturned': 'Appeal',
}

const ALL_ENGINES = ['Appeal', 'Corrected Claim', 'Records Request', 'Filing Defense', 'Recoupment', 'Eligibility']

function classifyEngine(sourceType: SourceType, denialType: string, uncertainDenialType: boolean): string {
  if (ENGINE_FROM_SOURCE[sourceType]) return ENGINE_FROM_SOURCE[sourceType]!
  if (uncertainDenialType) return '?'
  return ENGINE_FROM_TYPE[denialType] ?? '?'
}

// ─── Fuzzy matching ───────────────────────────────────────────────────────────

function findFuzzyMatches(extraction: RawExtraction, existingDenials: DenialRecord[]): FuzzyMatch[] {
  const results: FuzzyMatch[] = []
  for (const d of existingDenials) {
    if (d.claim.claimId === extraction.claimId) continue // exact match handled separately
    const reasons: string[] = []
    const mrnMatch = d.patient.mrn === extraction.mrn
    const payerMatch = d.payer === extraction.payer
    const harMatch = extraction.har && extraction.har.length > 0 && d.claim.har === extraction.har
    if (mrnMatch) reasons.push('Same patient (MRN)')
    if (mrnMatch && payerMatch) reasons.push('Same payer')
    if (harMatch) reasons.push('Same HAR')
    if (reasons.length === 0) continue
    const confidence: FuzzyMatch['confidence'] =
      (mrnMatch && payerMatch) || harMatch ? 'high' : 'medium'
    results.push({
      existingDenialId: d.id,
      confidence,
      reasons,
      patientName: d.patient.name,
      payer: d.payer,
      denialType: d.denialType,
      state: d.state,
      deniedAmount: d.deniedAmount,
    })
  }
  // Sort: high confidence first, then by deniedAmount desc
  results.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === 'high' ? -1 : 1
    return b.deniedAmount - a.deniedAmount
  })
  return results.slice(0, 3)
}

// ─── Mock extraction data ─────────────────────────────────────────────────────

const TODAY = '2026-04-03'
function addDays(date: string, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

const FILE_EXTRACTIONS: Record<string, RawExtraction[]> = {

  // 835 remit — BCBS Margaret Holloway: DRG downgrade, partial payment update
  '835_BCBS_MargaretHolloway_adjusted.edi': [{
    sourceType: 'edi-835',
    patientName: 'Margaret Holloway', mrn: 'MRN-104823',
    claimId: 'CLM-8847291', har: 'HAR-774112',
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 2105.00, paidAmount: 2105.00, adjustmentAmount: 2105.00,
    dos: '2026-02-14', deadline: addDays(TODAY, 4),
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0412',
      label: 'Partial Payment Received',
      updateType: 'payment_partial',
      episodeResultLabel: 'Partial Payment Received',
      episodeResultDescription: 'BCBS remit shows $2,105 paid. Original denied amount was $4,210 — 50% recovered. Case closed as partial.',
      suggestedState: 'Recovered',
      suggestedStatus: 'Overturned — Partial Payment',
      updates: { deniedAmount: 2105.00 },
      diffs: [
        { field: 'deniedAmount', label: 'Denied Amount',    from: '$4,210.00', to: '$2,105.00 (partial)' },
        { field: 'status',       label: 'Suggested Status', from: 'Appeal Drafting', to: 'Overturned — Partial Payment' },
        { field: 'state',        label: 'Suggested State',  from: 'Active', to: 'Recovered' },
      ],
    },
  }],

  // 835 remit — UHC Dorothy Simmonds: medical necessity denial, new record
  '835_UHC_DorothySimmonds.edi': [{
    sourceType: 'edi-835',
    patientName: 'Dorothy Simmonds', mrn: 'MRN-8821',
    claimId: 'CLM-NEW-5001', har: 'HAR-NEW-5001',
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity', denialSubtype: 'Inpatient Stay — COPD Exacerbation',
    carc: 'CARC-50', rarc: 'N386',
    deniedAmount: 8920.00, paidAmount: 0, adjustmentAmount: 8920.00,
    dos: '2026-03-15', deadline: addDays(TODAY, 26),
    uncertainFields: [],
  }],

  // Med nec denial letter — Cigna Daniel Forsythe: lumbar fusion
  // Extracted: clinical criteria, reviewing physician, level of care
  // Not extracted with confidence: CARC, HAR, exact denied amount
  'DenialLetter_Cigna_RafaelTorres.pdf': [{
    sourceType: 'med-nec-denial',
    patientName: 'Daniel Forsythe', mrn: 'MRN-9034',
    claimId: 'CLM-NEW-5002', har: '',
    payer: 'Cigna',
    denialType: 'Medical Necessity', denialSubtype: 'Lumbar Spinal Fusion — L4-L5',
    carc: '', rarc: '', deniedAmount: 0,
    clinicalCriteria: 'MCG Surgical Criteria — Lumbar Fusion (A-0581)',
    reviewingPhysician: 'Dr. Patricia Wells, MD — Cigna Clinical Review',
    levelOfCare: 'Surgical procedure — medical necessity questioned per policy',
    dos: '2026-03-22', deadline: addDays(TODAY, 33),
    uncertainFields: ['carc', 'har', 'deniedAmount'],
  }],

  // ADR letter — Palmetto Raymond Castellano: prepayment review, hip replacement
  // Castellano already has active Aetna Med Nec denial (DN-2026-0389) — same MRN, different payer/claim
  // → fuzzy match expected: medium confidence (MRN match, different payer)
  'ADR_Palmetto_VivienneOkafor.pdf': [{
    sourceType: 'adr',
    patientName: 'Raymond Castellano', mrn: 'MRN-091247',
    claimId: 'CLM-NEW-5003', har: '',
    payer: 'Palmetto GBA (Medicare)',
    denialType: 'ADR', denialSubtype: 'Prepayment Review — Total Hip Arthroplasty (MS-DRG 470)',
    dos: '2026-02-18', deadline: addDays(TODAY, 36),
    recordsRequested: 'H&P, operative note, discharge summary, pre-op conservative treatment documentation (6 months)',
    submissionDeadline: addDays(TODAY, 36),
    uncertainFields: ['har', 'claimId'],
  }],

  // Auth denial letter — Cigna Carolyn Brandt: no prior auth for cardiac procedure
  // Brandt already has active Cigna Med Nec denial (DN-2026-0358) — same MRN + same payer
  // → fuzzy match expected: high confidence (MRN + payer match)
  'AuthDenial_Cigna_MarcusWebb.pdf': [{
    sourceType: 'auth-denial',
    patientName: 'Carolyn Brandt', mrn: 'MRN-447129',
    claimId: 'CLM-NEW-5004', har: '',
    payer: 'Cigna',
    denialType: 'Authorization', denialSubtype: 'No Prior Authorization — Cardiac Catheterization',
    carc: 'CARC-15', rarc: 'N30', deniedAmount: 0,
    authNumber: '',
    serviceRequiringAuth: 'Diagnostic Cardiac Catheterization (CPT 93458)',
    dos: '2026-03-28', deadline: addDays(TODAY, 45),
    uncertainFields: ['deniedAmount', 'har', 'authNumber'],
  }],

  // Appeal overturned letter — BCBS Margaret Holloway: full payment authorized
  'AppealOverturned_BCBS_MargaretHolloway.pdf': [{
    sourceType: 'appeal-overturned',
    patientName: 'Margaret Holloway', mrn: 'MRN-104823',
    claimId: 'CLM-8847291', har: 'HAR-774112',
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 291 → 292',
    dos: '2026-02-14', deadline: addDays(TODAY, 4),
    approvedAmount: 4210.00,
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0412',
      label: 'Appeal Overturned — Full Payment',
      updateType: 'payment_full',
      episodeResultLabel: 'Appeal Overturned — Full Payment Authorized',
      episodeResultDescription: 'BCBS issued overturn letter. Full $4,210 approved. Payment expected within 30 days.',
      suggestedState: 'Recovered',
      suggestedStatus: 'Overturned — Full Payment',
      updates: {},
      diffs: [
        { field: 'status', label: 'Suggested Status', from: 'Appeal Drafting',   to: 'Overturned — Full Payment' },
        { field: 'state',  label: 'Suggested State',  from: 'Active',            to: 'Recovered' },
        { field: 'amount', label: 'Approved Amount',  from: '—',                 to: '$4,210.00 (full payment authorized)' },
      ],
    },
  }],

  'EOB_UHC_HaroldSimmons_CLM9921847.pdf': [{
    sourceType: 'underpayment' as const,
    patientName: 'Harold Simmons',
    mrn: 'MRN-109432',
    claimId: 'CLM-9921847',
    payer: 'UnitedHealthcare',
    denialType: 'Underpayment',
    denialSubtype: 'Contracted Rate Dispute',
    dos: '2026-02-18',
    deadline: '2026-04-28',
    uncertainFields: [],
    paidAmount: 8430,
    adjustmentAmount: 4820,
  }],
}

const TYPE_EXTRACTIONS: Record<string, RawExtraction[]> = {
  edi: [
    {
      sourceType: 'edi-835',
      patientName: 'Harold Nguyen', mrn: 'MRN-558821',
      claimId: 'CLM-9901234', har: 'HAR-882001',
      payer: 'Aetna', denialType: 'Medical Necessity', denialSubtype: 'Inpatient Level of Care',
      carc: 'CARC-50', rarc: 'N386',
      deniedAmount: 7340.00, paidAmount: 0, adjustmentAmount: 7340.00,
      dos: '2026-03-10', deadline: addDays(TODAY, 52), uncertainFields: [],
    },
    {
      sourceType: 'edi-835',
      patientName: 'Lucinda Park', mrn: 'MRN-441902',
      claimId: 'CLM-9901235', har: 'HAR-882002',
      payer: 'Aetna', denialType: 'Authorization', denialSubtype: 'No Prior Authorization',
      carc: 'CARC-15', rarc: 'N30',
      deniedAmount: 3120.00, paidAmount: 0, adjustmentAmount: 3120.00,
      dos: '2026-03-11', deadline: addDays(TODAY, 38), uncertainFields: [],
    },
  ],
  pdf: [
    {
      sourceType: 'med-nec-denial',
      patientName: 'Constance Adler', mrn: 'MRN-609344',
      claimId: 'CLM-7723901', har: 'HAR-991100',
      payer: 'Blue Cross Blue Shield', denialType: 'Medical Necessity', denialSubtype: 'Observation vs Inpatient',
      carc: 'CARC-50', rarc: 'N115', deniedAmount: 5680.00,
      clinicalCriteria: 'MCG Inpatient Admission Criteria',
      reviewingPhysician: 'Dr. R. Hoffman, MD',
      levelOfCare: 'Inpatient admission questioned — Observation suggested',
      dos: '2026-03-18', deadline: addDays(TODAY, 60), uncertainFields: ['har'],
    },
  ],
  csv: [
    {
      sourceType: 'edi-835',
      patientName: 'Yvonne Castellano', mrn: 'MRN-330281',
      claimId: 'CLM-5512001', har: 'HAR-660400',
      payer: 'UnitedHealthcare', denialType: 'Authorization', denialSubtype: 'Retro Auth Denied',
      carc: 'CARC-15', rarc: 'N30',
      deniedAmount: 9100.00, paidAmount: 0, adjustmentAmount: 9100.00,
      dos: '2026-03-05', deadline: addDays(TODAY, 30), uncertainFields: [],
    },
  ],
}

// ─── Seed staged data ─────────────────────────────────────────────────────────
// Shown on first load / after reset. possibleMatches computed at runtime.

type SeedEntry = Omit<StagedRecord, 'possibleMatches'>

const SEED_STAGED: SeedEntry[] = [

  // ── UPDATES: payer responses to existing cases ────────────────────────────

  // 1 — UPDATE: Appeal overturned, full payment
  //     Margaret Holloway / BCBS 835 → DN-2026-0412 (Active, Appeal Drafting)
  {
    tempId: 'seed-1', selected: false, status: 'update',
    sourceFile: '835_BCBS_MargaretHolloway_overturned.edi', suggestedEngine: 'Appeal',
    sourceType: 'edi-835',
    patientName: 'Margaret Holloway', mrn: 'MRN-104823',
    claimId: 'CLM-8847291', har: 'HAR-774112',
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 0, paidAmount: 4210, adjustmentAmount: 0,
    dos: '2026-02-14', deadline: addDays(TODAY, 4),
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0412',
      label: 'Appeal Overturned — Full Payment',
      updateType: 'payment_full',
      suggestedState: 'Recovered',
      suggestedStatus: 'Overturned — Full Payment',
      updates: {},
      diffs: [
        { field: 'state',  label: 'Suggested State',  from: 'Active',          to: 'Recovered' },
        { field: 'status', label: 'Suggested Status', from: 'Appeal Drafting', to: 'Overturned — Full Payment' },
        { field: 'amount', label: 'Payment',           from: '—',               to: '$4,210.00 paid in full' },
      ],
      episodeResultLabel: 'Appeal Overturned — Full Payment Authorized',
      episodeResultDescription: 'BCBS 835 remit confirms full $4,210 payment. MS-DRG 291 reinstated. Case resolved.',
    },
    rawContent: `ISA*00*          *00*          *ZZ*BCBSIL         *ZZ*RMCPROVIDER    *260214*1200*^*00501*000018847*0*P*:~
GS*HP*BCBSIL*RMCPROVIDER*20260214*1200*18847*X*005010X221A1~
ST*835*0001~
BPR*I*4210.00*C*ACH*CTX*01*BCBS*DA*072400052*9800000001*01*RMCPROVIDER*DA*123456789*20260214~
TRN*1*835-BCBS-18847*1234567890~
REF*EV*BCBS-RMT-18847~
DTM*405*20260214~
N1*PR*BLUE CROSS BLUE SHIELD OF ILLINOIS*XV*60054~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-8847291*1*4210.00*4210.00**13*BCBS-ADJ-88210*11*1~
NM1*QC*1*HOLLOWAY*MARGARET****MI*MRN104823~
NM1*82*1*PATEL*SUNITA MD****XX*1234567893~
SVC*HC:99285*4210.00*4210.00**2~
DTM*472*20260214~
CAS*CO*253*0.00~
SE*15*0001~
GE*1*18847~
IEA*1*000018847~`,
  },

  // 2 — UPDATE: Partial payment received — decision required (accept partial or continue)
  //     Timothy Reyes / Aetna 835 → DN-2026-0318 (Active, Appeal Drafting)
  {
    tempId: 'seed-2', selected: false, status: 'update',
    sourceFile: '835_Aetna_TimothyReyes_partial.edi', suggestedEngine: 'Appeal',
    sourceType: 'edi-835',
    patientName: 'Timothy Reyes', mrn: 'MRN-701023',
    claimId: 'CLM-2209115', har: 'HAR-108334',
    payer: 'Aetna',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 470 → 483',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 2820, paidAmount: 2820, adjustmentAmount: 2820,
    dos: '2026-03-12', deadline: addDays(TODAY, 28),
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0318',
      label: 'Partial Payment Received',
      updateType: 'payment_partial',
      suggestedState: 'Recovered',
      suggestedStatus: 'Overturned — Partial Payment',
      updates: { deniedAmount: 2820 },
      diffs: [
        { field: 'deniedAmount', label: 'Denied Amount',    from: '$5,640.00', to: '$2,820.00 (50% recovered)' },
        { field: 'state',        label: 'Suggested State',  from: 'Active',    to: 'Recovered' },
        { field: 'status',       label: 'Suggested Status', from: 'Appeal Drafting', to: 'Overturned — Partial Payment' },
      ],
      episodeResultLabel: 'Partial Payment Received',
      episodeResultDescription: 'Aetna remit shows $2,820 paid on $5,640 claim — 50% recovered. Consider whether to accept partial or escalate for remaining balance.',
    },
    rawContent: `ISA*00*          *00*          *ZZ*AETNA          *ZZ*RMCPROVIDER    *260318*0900*^*00501*000022091*0*P*:~
GS*HP*AETNA*RMCPROVIDER*20260318*0900*22091*X*005010X221A1~
ST*835*0001~
BPR*I*2820.00*C*ACH*CTX*01*AETNA*DA*011000015*8800000012*01*RMCPROVIDER*DA*987654321*20260318~
TRN*1*835-AETNA-22091*1357924680~
DTM*405*20260318~
N1*PR*AETNA HEALTH PLANS*XV*60001~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-2209115*1*5640.00*2820.00**13*AETNA-ADJ-22091*11*1~
CAS*CO*4*2820.00~
NM1*QC*1*REYES*TIMOTHY****MI*MRN701023~
SVC*HC:47562*5640.00*2820.00**1~
DTM*472*20260312~
CAS*CO*4*2820.00~
REF*6R*AETNA-DRG-REVIEW-470~
SE*14*0001~
GE*1*22091~
IEA*1*000022091~`,
  },

  // 3 — UPDATE: L1 appeal upheld — reopen for escalation decision
  //     James Okafor / UHC → DN-2026-0377 (Submitted, Submission Failed)
  {
    tempId: 'seed-3', selected: false, status: 'update',
    sourceFile: 'AppealUpheld_UHC_JamesOkafor.pdf', suggestedEngine: 'Appeal',
    sourceType: 'appeal-upheld' as const,
    patientName: 'James Okafor', mrn: 'MRN-318740',
    claimId: 'CLM-6634882', har: 'HAR-559001',
    payer: 'UnitedHealthcare',
    denialType: 'Authorization', denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 6750,
    dos: '2026-03-01', deadline: addDays(TODAY, 14),
    furtherAppealRights: 'Level 2 external review available within 60 days.',
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0377',
      label: 'L1 Appeal Upheld by Payer',
      updateType: 'denial_upheld' as const,
      suggestedState: 'Active' as const,
      suggestedStatus: 'In Progress' as const,
      updates: {},
      diffs: [
        { field: 'state',  label: 'Suggested State',  from: 'Submitted',         to: 'Active — reopen for escalation' },
        { field: 'status', label: 'Payer Decision',    from: 'Submission Failed', to: 'L1 upheld — consider L2 or IRO' },
      ],
      episodeResultLabel: 'L1 Appeal Upheld by Payer',
      episodeResultDescription: 'UnitedHealthcare upheld the authorization denial. L1 appeal reviewed and denied. Level 2 external review available within 60 days.',
    },
    rawContent: `UNITEDHEALTHCARE
APPEAL REVIEW DECISION NOTICE

Date: April 1, 2026
Reference: UHC-APPEAL-2026-66348
Provider: Regional Medical Center
NPI: 1982736450

Patient: James Okafor
Member ID: MRN318740
Date of Service: March 1, 2026
Claim Number: CLM-6634882

RE: FIRST LEVEL APPEAL DECISION — UPHELD

Dear Provider Relations,

UnitedHealthcare has completed its review of the first level appeal submitted for the above-referenced
claim. After review by our medical director, the original coverage determination has been upheld.

DENIAL REASON:
Services billed under CPT procedure code(s) were rendered without prior authorization on file. Per
the member's benefit plan, services require prior authorization to be eligible for coverage.
Denial Code: CARC-15 / RARC N130.

YOUR FURTHER APPEAL RIGHTS:
You may request a Level 2 external independent review within 60 days of this notice. To initiate
an external review, submit a written request to:

  UnitedHealthcare External Review Unit
  PO Box 30880, Salt Lake City, UT 84130

Amount at issue: $6,750.00

If you have questions, contact Provider Services at 1-877-842-3210.

Sincerely,
Dr. R. Ellison, MD — UnitedHealthcare Medical Director`,
  },

  // 4 — UPDATE: Payer changed denial reason on re-adjudication — strategy change needed
  //     Carolyn Brandt / Cigna 835 → DN-2026-0358 (Active, Appeal Drafting)
  //     Originally denied as Medical Necessity (CARC-50), now re-adjudicated to Authorization (CARC-15)
  {
    tempId: 'seed-4', selected: false, status: 'update',
    sourceFile: '835_Cigna_CarolynBrandt_readjudicated.edi', suggestedEngine: 'Appeal',
    sourceType: 'edi-835',
    patientName: 'Carolyn Brandt', mrn: 'MRN-447129',
    claimId: 'CLM-5521334', har: 'HAR-430887',
    payer: 'Cigna',
    denialType: 'Authorization', denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 3210.75, paidAmount: 0, adjustmentAmount: 3210.75,
    dos: '2026-03-10', deadline: addDays(TODAY, 35),
    uncertainFields: [],
    updateProposal: {
      existingDenialId: 'DN-2026-0358',
      label: 'Denial Reason Changed on Re-adjudication',
      updateType: 'denial_new_reason' as const,
      suggestedState: 'Active' as const,
      suggestedStatus: 'In Progress' as const,
      updates: { carc: 'CARC-15', denialType: 'Authorization' },
      diffs: [
        { field: 'carc',       label: 'Denial Code',  from: 'CARC-50 — Medical Necessity', to: 'CARC-15 — Authorization' },
        { field: 'denialType', label: 'Denial Type',  from: 'Medical Necessity',            to: 'Authorization' },
        { field: 'status',     label: 'Status',       from: 'Appeal Drafting',              to: 'In Progress — strategy reassessment needed' },
      ],
      episodeResultLabel: 'Payer Changed Denial Reason on Re-adjudication',
      episodeResultDescription: 'Cigna re-adjudicated from Medical Necessity (CARC-50) to Authorization (CARC-15). In-progress appeal strategy needs to change — auth denial requires retro-auth pathway, not clinical criteria argument.',
    },
    rawContent: `ISA*00*          *00*          *ZZ*CIGNA          *ZZ*RMCPROVIDER    *260407*1015*^*00501*000033213*0*P*:~
GS*HP*CIGNA*RMCPROVIDER*20260407*1015*33213*X*005010X221A1~
ST*835*0001~
BPR*I*0.00*C*ACH*CTX*01*CIGNA*DA*021000021*4400000031*01*RMCPROVIDER*DA*111222333*20260407~
TRN*1*835-CIGNA-33213*1928374650~
DTM*405*20260407~
N1*PR*CIGNA HEALTH AND LIFE INSURANCE CO*XV*60052~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-5521334*4*3210.75*0.00**13*CIGNA-ADJ-33213*11*1~
CAS*CO*15*3210.75~
NM1*QC*1*BRANDT*CAROLYN****MI*MRN447129~
SVC*HC:93458*3210.75*0.00**1~
DTM*472*20260310~
CAS*CO*15*3210.75~
REF*6R*CIGNA-READJ-55213~
SE*14*0001~
GE*1*33213~
IEA*1*000033213~`,
  },

  // ── NEW RECORDS: 835 batch — clean extractions ───────────────────────────

  // 5 — NEW: 835 batch, Medical Necessity, full denial
  //     Dorothy Simmonds / UHC — new patient, clean extraction
  {
    tempId: 'seed-5', selected: true, status: 'new',
    sourceFile: '835_UHC_batch_20260403.edi', suggestedEngine: 'Appeal',
    sourceType: 'edi-835',
    patientName: 'Dorothy Simmonds', mrn: 'MRN-8821',
    claimId: 'CLM-NEW-5001', har: 'HAR-NEW-5001',
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity', denialSubtype: 'Inpatient Stay — COPD Exacerbation',
    carc: 'CARC-50', rarc: 'N386',
    deniedAmount: 8920, paidAmount: 0, adjustmentAmount: 8920,
    dos: '2026-03-15', deadline: addDays(TODAY, 26),
    uncertainFields: [],
    rawContent: `ISA*00*          *00*          *ZZ*UHCINSURANCE    *ZZ*RMCPROVIDER    *260403*1100*^*00501*000044001*0*P*:~
GS*HP*UHCINSURANCE*RMCPROVIDER*20260403*1100*44001*X*005010X221A1~
ST*835*0001~
BPR*I*0.00*C*ACH*CTX*01*UHC*DA*091000019*9900000041*01*RMCPROVIDER*DA*444555666*20260403~
TRN*1*835-UHC-44001*1029384756~
DTM*405*20260403~
N1*PR*UNITEDHEALTHCARE INSURANCE CO*XV*60006~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-NEW-5001*4*8920.00*0.00**13*UHC-ADJ-44001*11*1~
CAS*CO*50*8920.00~
NM1*QC*1*SIMMONDS*DOROTHY****MI*MRN8821~
SVC*HC:99234*8920.00*0.00**1~
DTM*472*20260315~
CAS*CO*50*8920.00~
REF*LU*N386~
SE*14*0001~
GE*1*44001~
IEA*1*000044001~`,
  },

  // 6 — NEW: 835 batch, DRG Downgrade with partial payment
  //     Harold Nguyen / Aetna — new patient, DRG paid at lower rate
  {
    tempId: 'seed-6', selected: true, status: 'new',
    sourceFile: '835_Aetna_batch_20260403.edi', suggestedEngine: 'Appeal',
    sourceType: 'edi-835',
    patientName: 'Harold Nguyen', mrn: 'MRN-558821',
    claimId: 'CLM-9901234', har: 'HAR-882001',
    payer: 'Aetna',
    denialType: 'DRG Downgrade', denialSubtype: 'MS-DRG 871 → 872',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 2140, paidAmount: 5200, adjustmentAmount: 2140,
    dos: '2026-03-10', deadline: addDays(TODAY, 52),
    uncertainFields: [],
    rawContent: `ISA*00*          *00*          *ZZ*AETNA          *ZZ*RMCPROVIDER    *260403*1100*^*00501*000044002*0*P*:~
GS*HP*AETNA*RMCPROVIDER*20260403*1100*44002*X*005010X221A1~
ST*835*0002~
BPR*I*5200.00*C*ACH*CTX*01*AETNA*DA*011000015*8800000012*01*RMCPROVIDER*DA*987654321*20260403~
TRN*1*835-AETNA-44002*1357924681~
DTM*405*20260403~
N1*PR*AETNA HEALTH PLANS*XV*60001~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-9901234*1*7340.00*5200.00**13*AETNA-ADJ-44002*11*1~
CAS*CO*4*2140.00~
NM1*QC*1*NGUYEN*HAROLD****MI*MRN558821~
SVC*HC:99234*7340.00*5200.00**1~
DTM*472*20260310~
CAS*CO*4*2140.00~
REF*LU*N115~
SE*14*0002~
GE*1*44002~
IEA*1*000044002~`,
  },

  // 7 — NEW: 835 batch, Timely Filing defense needed
  //     Lucinda Park / Aetna — denial for late submission
  {
    tempId: 'seed-7', selected: true, status: 'new',
    sourceFile: '835_Aetna_batch_20260403.edi', suggestedEngine: 'Filing Defense',
    sourceType: 'edi-835',
    patientName: 'Lucinda Park', mrn: 'MRN-441902',
    claimId: 'CLM-9901235', har: 'HAR-882002',
    payer: 'Aetna',
    denialType: 'Timely Filing', denialSubtype: 'Claim Received After 90-Day Limit',
    carc: 'CARC-29',
    deniedAmount: 3120, paidAmount: 0, adjustmentAmount: 3120,
    dos: '2025-12-15', deadline: addDays(TODAY, 12),
    uncertainFields: [],
    rawContent: `ISA*00*          *00*          *ZZ*AETNA          *ZZ*RMCPROVIDER    *260403*1100*^*00501*000044003*0*P*:~
GS*HP*AETNA*RMCPROVIDER*20260403*1100*44003*X*005010X221A1~
ST*835*0003~
BPR*I*0.00*C*ACH*CTX*01*AETNA*DA*011000015*8800000012*01*RMCPROVIDER*DA*987654321*20260403~
TRN*1*835-AETNA-44003*1357924682~
DTM*405*20260403~
N1*PR*AETNA HEALTH PLANS*XV*60001~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-9901235*4*3120.00*0.00**13*AETNA-ADJ-44003*11*1~
CAS*CO*29*3120.00~
NM1*QC*1*PARK*LUCINDA****MI*MRN441902~
SVC*HC:99234*3120.00*0.00**1~
DTM*472*20251215~
CAS*CO*29*3120.00~
SE*13*0003~
GE*1*44003~
IEA*1*000044003~`,
  },

  // 8 — NEW: 835 batch, Eligibility / COB issue
  //     Elena Vasquez / Medicare — coverage inactive on DOS
  {
    tempId: 'seed-8', selected: true, status: 'new',
    sourceFile: '835_Medicare_batch_20260403.edi', suggestedEngine: 'Eligibility',
    sourceType: 'edi-835',
    patientName: 'Elena Vasquez', mrn: 'MRN-771203',
    claimId: 'CLM-9901236', har: 'HAR-882003',
    payer: 'Medicare',
    denialType: 'Eligibility', denialSubtype: 'Coverage Inactive on Date of Service',
    carc: 'CARC-31',
    deniedAmount: 4480, paidAmount: 0, adjustmentAmount: 4480,
    dos: '2026-03-08', deadline: addDays(TODAY, 40),
    uncertainFields: [],
    rawContent: `ISA*00*          *00*          *ZZ*MEDICARE       *ZZ*RMCPROVIDER    *260403*1100*^*00501*000044004*0*P*:~
GS*HP*MEDICARE*RMCPROVIDER*20260403*1100*44004*X*005010X221A1~
ST*835*0001~
BPR*I*0.00*C*ACH*CTX*01*MEDICARE*DA*021030004*3700000044*01*RMCPROVIDER*DA*777888999*20260403~
TRN*1*835-MCR-44004*2938475610~
DTM*405*20260403~
N1*PR*CENTERS FOR MEDICARE AND MEDICAID SERVICES*XV*00001~
N1*PE*REGIONAL MEDICAL CENTER*XX*1982736450~
CLP*CLM-9901236*4*4480.00*0.00**13*MCR-ADJ-44004*11*1~
CAS*CO*31*4480.00~
NM1*QC*1*VASQUEZ*ELENA****MI*MRN771203~
SVC*HC:99234*4480.00*0.00**1~
DTM*472*20260308~
CAS*CO*31*4480.00~
SE*13*0001~
GE*1*44004~
IEA*1*000044004~`,
  },

  // ── NEW RECORDS: PDF/letter extractions — uncertain fields ───────────────

  // 9 — NEW: PDF denial letter, uncertain CARC / amount / HAR
  //     Daniel Forsythe / Cigna — lumbar fusion medical necessity
  {
    tempId: 'seed-9', selected: true, status: 'new',
    sourceFile: 'DenialLetter_Cigna_DanielForsythe.pdf', suggestedEngine: 'Appeal',
    sourceType: 'med-nec-denial',
    patientName: 'Daniel Forsythe', mrn: 'MRN-9034',
    claimId: 'CLM-NEW-5002', har: '',
    payer: 'Cigna',
    denialType: 'Medical Necessity', denialSubtype: 'Lumbar Spinal Fusion — L4-L5',
    carc: '', rarc: '', deniedAmount: 0,
    clinicalCriteria: 'MCG Surgical Criteria — Lumbar Fusion (A-0581)',
    reviewingPhysician: 'Dr. Patricia Wells, MD — Cigna Clinical Review',
    levelOfCare: 'Surgical procedure — medical necessity questioned per policy',
    dos: '2026-03-22', deadline: addDays(TODAY, 33),
    uncertainFields: ['carc', 'har', 'deniedAmount'],
    rawContent: `CIGNA HEALTH AND LIFE INSURANCE COMPANY
CLINICAL REVIEW — NOTIFICATION OF ADVERSE DETERMINATION

Date: March 27, 2026
Cigna Reference: CGN-CLN-2026-88234
Fax Received: Regional Medical Center — Revenue Cycle

Patient Name: Daniel Forsythe
Member ID: U81209034
Date of Service: March 22, 2026

RE: NOTIFICATION OF NON-COVERAGE — LUMBAR SPINAL FUSION (CPT 22630, 22612)

Dear Provider,

Following clinical review by Dr. Patricia Wells, MD, Cigna Clinical Review, the above-referenced
procedure has been determined NOT MEDICALLY NECESSARY per Cigna's coverage policy for
Lumbar Spinal Fusion (Policy #MED.00030).

CRITERIA APPLIED: MCG Surgical Criteria — Lumbar Fusion (A-0581)
The submitted documentation does not meet criteria for surgical intervention, specifically:
  - Conservative treatment (physical therapy, epidural injections) not documented for minimum 6 months
  - Functional status assessment (Oswestry Disability Index) not included

YOU HAVE THE RIGHT TO APPEAL THIS DECISION.
Submit appeal documentation within 180 days to:
  Cigna Health and Life Insurance Co. — Appeal Review Unit
  PO Box 188011, Chattanooga, TN 37422

For questions, call: 1-800-244-6224 (Provider Services)

Patricia Wells, MD — Cigna Clinical Review Medical Director`,
  },

  // 10 — NEW: ADR letter, uncertain claim ID + HAR, medium fuzzy match
  //      Raymond Castellano / Palmetto GBA — MRN-091247 matches DN-2026-0389 (Aetna, different payer)
  {
    tempId: 'seed-10', selected: true, status: 'new',
    sourceFile: 'ADR_Palmetto_RaymondCastellano.pdf', suggestedEngine: 'Records Request',
    sourceType: 'adr',
    patientName: 'Raymond Castellano', mrn: 'MRN-091247',
    claimId: 'CLM-NEW-5003', har: '',
    payer: 'Palmetto GBA (Medicare)',
    denialType: 'ADR', denialSubtype: 'Prepayment Review — Total Hip Arthroplasty (MS-DRG 470)',
    dos: '2026-02-18', deadline: addDays(TODAY, 36),
    recordsRequested: 'H&P, operative note, discharge summary, pre-op conservative treatment documentation (6 months)',
    submissionDeadline: addDays(TODAY, 36),
    uncertainFields: ['har', 'claimId'],
    rawContent: `PALMETTO GBA — MEDICARE ADMINISTRATIVE CONTRACTOR
ADDITIONAL DOCUMENTATION REQUEST (ADR)
PREPAYMENT REVIEW

Date: March 15, 2026
ADR Reference: PGR-ADR-2026-09247
Provider: Regional Medical Center (NPI: 1982736450)

Beneficiary: Raymond Castellano
HIC Number: MRN-091247
Date of Service: February 18, 2026
MS-DRG: 470 — Major Joint Replacement or Reattachment of Lower Extremity

RE: REQUEST FOR MEDICAL RECORDS — PREPAYMENT REVIEW

This claim has been selected for prepayment medical review. Payment is suspended pending
receipt of the requested documentation. Please submit the following within 45 days:

RECORDS REQUIRED:
  1. History & Physical (H&P) — dated within 30 days of procedure
  2. Operative report (full, signed)
  3. Discharge summary
  4. Pre-operative imaging reports (X-ray, MRI)
  5. Documentation of conservative treatment (minimum 6 months) — physical therapy notes,
     injection records, or equivalent non-surgical management

SUBMISSION INSTRUCTIONS:
  Submit records via fax to: 1-855-820-9522 (Palmetto GBA ADR Unit)
  Or mail to: Palmetto GBA, P.O. Box 100306, Columbia, SC 29202
  Reference ADR Number: PGR-ADR-2026-09247 on all submissions.

DEADLINE: Records must be received within 45 days of this notice.
Failure to respond will result in claim denial.

Palmetto GBA Medical Review Department`,
  },

  // 11 — NEW: Auth denial letter, uncertain amount + HAR, HIGH fuzzy match
  //      Carolyn Brandt / Cigna — MRN-447129 + same payer matches DN-2026-0358
  {
    tempId: 'seed-11', selected: true, status: 'new',
    sourceFile: 'AuthDenial_Cigna_CarolynBrandt_NewClaim.pdf', suggestedEngine: 'Appeal',
    sourceType: 'auth-denial',
    patientName: 'Carolyn Brandt', mrn: 'MRN-447129',
    claimId: 'CLM-NEW-5004', har: '',
    payer: 'Cigna',
    denialType: 'Authorization', denialSubtype: 'No Prior Authorization — Cardiac Catheterization',
    carc: 'CARC-15', rarc: 'N30', deniedAmount: 0,
    authNumber: '',
    serviceRequiringAuth: 'Diagnostic Cardiac Catheterization (CPT 93458)',
    dos: '2026-03-28', deadline: addDays(TODAY, 45),
    uncertainFields: ['deniedAmount', 'har', 'authNumber'],
    rawContent: `CIGNA HEALTH AND LIFE INSURANCE COMPANY
EXPLANATION OF BENEFITS / NOTICE OF NON-COVERED SERVICES

Date: April 2, 2026
Document Reference: CGN-EOB-2026-55204
Provider: Regional Medical Center

Patient Name: Carolyn Brandt
Member ID: U44712900
Date of Service: March 28, 2026
Service: Diagnostic Cardiac Catheterization (CPT 93458)

CLAIM STATUS: DENIED

REASON FOR DENIAL:
  CARC 15 — Claim/service denied. The submitted service required prior authorization which
  is not on file with Cigna at the time of adjudication.
  RARC N30 — No prior authorization was obtained for this service.

NOTE: Our records do not show a prior authorization request for CPT 93458 for this member
on the date of service. Please verify authorization records. If authorization was obtained
in error, submit corrected claim with authorization number.

AMOUNT BILLED: [Not legible — see claim file]
AMOUNT COVERED: $0.00
PATIENT RESPONSIBILITY: $0.00 (provider adjustment)

APPEAL RIGHTS:
You may appeal this determination within 180 days. Submit to:
  Cigna Appeals & Grievances — Provider Division
  PO Box 188011, Chattanooga, TN 37422

Questions: 1-800-244-6224`,
  },

  // 12 — NEW: Underpayment EOB — contracted rate dispute
  //      Michael Torres / Humana — paid at wrong rate, new patient
  {
    tempId: 'seed-12', selected: true, status: 'new',
    sourceFile: 'EOB_Humana_MichaelTorres.pdf', suggestedEngine: 'Payment Dispute',
    sourceType: 'underpayment',
    patientName: 'Michael Torres', mrn: 'MRN-662910',
    claimId: 'CLM-NEW-5005', har: 'HAR-NEW-5005',
    payer: 'Humana',
    denialType: 'Underpayment', denialSubtype: 'Contracted Rate Dispute',
    carc: 'CARC-45',
    deniedAmount: 3180, paidAmount: 6840, adjustmentAmount: 3180,
    dos: '2026-03-05', deadline: addDays(TODAY, 55),
    uncertainFields: [],
    rawContent: `HUMANA HEALTH PLAN
EXPLANATION OF BENEFITS

Date: April 3, 2026
Humana Reference: HUM-EOB-2026-66291
Provider: Regional Medical Center (NPI: 1982736450)

Patient: Michael Torres
Member ID: HUM662910
Date of Service: March 5, 2026

CPT Code: 27447 — Total Knee Arthroplasty (Bilateral)
Billed Amount: $10,020.00
Contracted Rate (per agreement): $10,020.00
Amount Paid: $6,840.00
Adjustment: $3,180.00
  CARC 45 — Charge exceeds fee schedule / maximum allowable

NOTE: Payment was issued at the non-facility rate (POS 11) rather than the
contracted facility rate (POS 21). Please verify place of service coding.
If facility rate applies, submit a corrected claim with correct POS code for
re-adjudication at contracted facility rate.

Questions regarding this payment: 1-800-457-4708 (Humana Provider Services)`,
  },

  // ── DUPLICATE: already in the system ─────────────────────────────────────

  // 13 — DUPLICATE: Harold Simmons / UHC underpayment EOB — CLM-9921847 = DN-2026-0521
  {
    tempId: 'seed-13', selected: false, status: 'duplicate',
    sourceFile: 'EOB_UHC_HaroldSimmons_CLM9921847.pdf', suggestedEngine: 'Payment Dispute',
    sourceType: 'underpayment',
    patientName: 'Harold Simmons', mrn: 'MRN-109432',
    claimId: 'CLM-9921847', har: 'HAR-773290',
    payer: 'UnitedHealthcare',
    denialType: 'Underpayment', denialSubtype: 'Contracted Rate Dispute',
    deniedAmount: 4820, paidAmount: 8430, adjustmentAmount: 4820,
    dos: '2026-02-18', deadline: '2026-04-28',
    uncertainFields: [],
    rawContent: `UNITEDHEALTHCARE
EXPLANATION OF BENEFITS

Date: March 12, 2026
UHC Reference: UHC-EOB-2026-99218
Provider: Regional Medical Center (NPI: 1982736450)

Patient: Harold Simmons
Member ID: UHC109432
Date of Service: February 18, 2026
Claim Number: CLM-9921847

CPT Code: 27447 — Total Knee Arthroplasty
Billed Amount: $13,250.00
Contracted Rate: $13,250.00
Amount Paid: $8,430.00
Adjustment: $4,820.00
  CARC 45 — Charge exceeds fee schedule / maximum allowable (implant pricing dispute)

NOTE: This EOB was previously received on March 5, 2026. This document appears to be a
re-transmission of the same EOB. Claim CLM-9921847 is already on file.

Questions: 1-800-842-3210 (UHC Provider Services)`,
  },
]

function getFileType(name: string): 'edi' | 'pdf' | 'csv' | null {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'edi' || ext === '835' || ext === 'txt') return 'edi'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'csv' || ext === 'xlsx') return 'csv'
  return null
}

let tempIdCounter = 1

// ─── Chips ────────────────────────────────────────────────────────────────────

const ENGINE_COLORS: Record<string, { bg: string; color: string }> = {
  'Appeal':          { bg: '#EBF4FF', color: '#1B3A5C' },
  'Corrected Claim': { bg: '#FFF8E6', color: '#7D5A00' },
  'Records Request': { bg: '#F0FFF4', color: '#276749' },
  'Filing Defense':  { bg: '#FFF5F5', color: '#C0392B' },
  'Recoupment':      { bg: '#F5F0FF', color: '#553C9A' },
  'Eligibility':     { bg: '#F0F4FF', color: '#2D4799' },
  '?':               { bg: '#F7F7F7', color: '#718096' },
}

function EngineChip({ engine }: { engine: string }) {
  const col = ENGINE_COLORS[engine] ?? ENGINE_COLORS['?']!
  return (
    <Chip
      label={engine === '?' ? 'Needs Classification' : engine}
      size="small"
      sx={{
        height: 18, fontSize: '0.6rem', fontWeight: 600,
        '& .MuiChip-label': { px: 0.75 },
        bgcolor: col.bg, color: col.color,
        border: engine === '?' ? '1px dashed #CBD5E0' : 'none',
      }}
    />
  )
}

function SourceChip({ sourceType }: { sourceType: SourceType }) {
  const col = SOURCE_COLORS[sourceType]
  return (
    <Chip
      label={SOURCE_LABELS[sourceType]}
      size="small"
      sx={{
        height: 16, fontSize: '0.6rem', fontWeight: 500,
        '& .MuiChip-label': { px: 0.625 },
        bgcolor: col.bg, color: col.color,
      }}
    />
  )
}

// ─── Drawer field ─────────────────────────────────────────────────────────────

function DrawerField({
  label, value, uncertain, onChange, multiline, type, readOnly,
}: {
  label: string; value: string; uncertain?: boolean
  onChange: (v: string) => void; multiline?: boolean; type?: string; readOnly?: boolean
}) {
  if (readOnly) {
    return (
      <Box>
        <TextField
          fullWidth size="small" label={label}
          value={value}
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
              bgcolor: 'grey.50',
              cursor: 'default',
              '& fieldset': { borderColor: 'divider', borderStyle: 'dashed' },
              '&:hover fieldset': { borderColor: 'divider', borderStyle: 'dashed' },
              '&.Mui-focused fieldset': { borderColor: 'divider', borderStyle: 'dashed', borderWidth: 1 },
            },
            '& .MuiInputLabel-root': { color: 'text.disabled' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'text.disabled' },
            '& input': { cursor: 'default', color: 'text.secondary' },
            '& textarea': { cursor: 'default', color: 'text.secondary' },
          }}
        />
      </Box>
    )
  }
  return (
    <Box>
      <TextField
        fullWidth size="small" label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        multiline={multiline} rows={multiline ? 2 : undefined}
        type={type}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            bgcolor: uncertain ? '#fffbeb' : 'background.paper',
            '& fieldset': { borderColor: uncertain ? '#f59e0b' : undefined },
            '&:hover fieldset': { borderColor: uncertain ? '#d97706' : undefined },
          },
          '& .MuiInputLabel-root': { color: uncertain ? '#d97706' : undefined },
        }}
      />
      {uncertain && (
        <Typography variant="caption" sx={{ color: '#d97706', fontSize: '0.7rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <WarningAmberOutlined sx={{ fontSize: 11 }} />
          Could not extract confidently — please verify
        </Typography>
      )}
    </Box>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.07em', display: 'block', mb: 1.25 }}>
      {children}
    </Typography>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

// ─── Review drawer ────────────────────────────────────────────────────────────

function RecordDrawer({
  record, open, onClose, onUpdate, onApplyUpdate, onViewRaw, hasRaw, matchedDenial,
}: {
  record: StagedRecord | null; open: boolean; onClose: () => void
  onUpdate: <K extends keyof StagedRecord>(key: K, value: StagedRecord[K]) => void
  onApplyUpdate: (proposal: UpdateProposal, updates: Partial<DenialRecord>) => void
  onViewRaw: () => void
  hasRaw: boolean
  matchedDenial?: DenialRecord
}) {
  const [selectedOutcome, setSelectedOutcome] = useState(0)

  // Reset selection when the record changes
  const prevTempId = useRef<string | null>(null)
  if (record && record.tempId !== prevTempId.current) {
    prevTempId.current = record.tempId
    setSelectedOutcome(0)
  }

  if (!record) return null
  const u = record.uncertainFields
  const isUpdate = record.status === 'update'
  const isDupe = record.status === 'duplicate'
  const st = record.sourceType
  const isAppealResponse = st === 'appeal-upheld' || st === 'appeal-overturned'
  const isAdr = st === 'adr'
  const is835 = st === 'edi-835'

  const outcomeOptions = record.updateProposal?.updateType
    ? (UPDATE_OUTCOMES[record.updateProposal.updateType] ?? [])
    : []
  const chosenOutcome = outcomeOptions[selectedOutcome] ?? outcomeOptions[0]

  return (
    <Drawer
      anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: 440, display: 'flex', flexDirection: 'column' } } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
            {record.patientName || 'Unknown Patient'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{record.mrn}</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={isDupe ? 'Duplicate' : isUpdate ? 'Update' : 'New'}
              size="small"
              sx={{
                height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 },
                bgcolor: isDupe ? 'grey.200' : isUpdate ? '#fef3c7' : '#e6f4ea',
                color:   isDupe ? 'text.secondary' : isUpdate ? '#92400e' : '#276749',
              }}
            />
            <SourceChip sourceType={st} />
            <EngineChip engine={record.suggestedEngine} />
            {u.length > 0 && (
              <Chip
                icon={<WarningAmberOutlined sx={{ fontSize: 11, ml: '4px !important' }} />}
                label={`${u.length} field${u.length !== 1 ? 's' : ''} need review`}
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.5 }, bgcolor: '#fffbeb', color: '#92400e' }}
              />
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: 0.25, color: 'text.secondary' }}>
          <CloseOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Scrollable body */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Possible Matches ─────────────────────────────────────────────── */}
        {record.possibleMatches.length > 0 && (
          <Box sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <AccountTreeOutlined sx={{ fontSize: 15, color: '#1E40AF', mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E40AF', mb: 0.25 }}>
                {record.possibleMatches.length} possible match{record.possibleMatches.length > 1 ? 'es' : ''} flagged
              </Typography>
              <Typography variant="caption" sx={{ color: '#1E40AF', fontSize: '0.75rem', lineHeight: 1.4, display: 'block' }}>
                {record.possibleMatches.map(m => m.existingDenialId).join(', ')} — linking can be reviewed from the case view after import.
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Matched Instance ─────────────────────────────────────────────── */}
        {isUpdate && record.updateProposal && matchedDenial && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em', display: 'block', mb: 1 }}>
              Matched Instance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{matchedDenial.patient.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem' }}>{record.updateProposal.existingDenialId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Chip label={matchedDenial.state} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }} />
                <Chip label={matchedDenial.status} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Payer</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{matchedDenial.payer}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Denial Type</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{matchedDenial.denialType}</Typography>
              </Box>
              {matchedDenial.assignedTo && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Assigned To</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{matchedDenial.assignedTo.name}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── Update diff ──────────────────────────────────────────────────── */}
        {isUpdate && record.updateProposal && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <UpdateOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', color: 'warning.dark' }}>
                Proposed Update — {record.updateProposal.label}
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Field', 'Current', 'Incoming'].map(h => (
                      <TableCell key={h} sx={{ py: 0.75, fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.updateProposal.diffs.map(diff => (
                    <TableRow key={diff.field} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>{diff.label}</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', color: 'text.secondary', textDecoration: 'line-through' }}>{diff.from}</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.8rem', fontWeight: 600, color: 'success.dark' }}>{diff.to}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {/* Outcome selector */}
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em', display: 'block', mb: 1 }}>
                How would you like to record this?
              </Typography>
              {outcomeOptions.length === 1 ? (
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, bgcolor: '#F0FDF4', borderColor: '#86EFAC' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#166534' }}>{outcomeOptions[0]!.label}</Typography>
                  <Typography variant="caption" sx={{ color: '#166534' }}>{outcomeOptions[0]!.sublabel}</Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {outcomeOptions.map((opt, i) => (
                    <Paper
                      key={i}
                      variant="outlined"
                      onClick={() => setSelectedOutcome(i)}
                      sx={{
                        p: 1.25, borderRadius: 1.5, cursor: 'pointer',
                        borderColor: selectedOutcome === i ? 'primary.main' : 'divider',
                        bgcolor: selectedOutcome === i ? 'primary.50' : 'background.paper',
                        transition: 'border-color 0.15s, background-color 0.15s',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{
                          mt: 0.25, width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                          border: '2px solid', borderColor: selectedOutcome === i ? 'primary.main' : 'text.disabled',
                          bgcolor: selectedOutcome === i ? 'primary.main' : 'transparent',
                        }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }}>{opt.label}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{opt.sublabel}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── Patient & Claim ──────────────────────────────────────────────── */}
        <Box>
          <SectionHeading>Patient & Claim</SectionHeading>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <DrawerField label="Patient Name" value={record.patientName} onChange={v => onUpdate('patientName', v)} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <DrawerField label="MRN" value={record.mrn} onChange={v => onUpdate('mrn', v)} />
              <DrawerField label="Claim ID" value={record.claimId} onChange={v => onUpdate('claimId', v)} />
            </Box>
            {!isAppealResponse && (
              <DrawerField label="HAR" value={record.har ?? ''} uncertain={u.includes('har')} onChange={v => onUpdate('har', v)} />
            )}
          </Box>
        </Box>

        <Divider />

        {/* ── 835: Financial breakdown ─────────────────────────────────────── */}
        {is835 && (
          <Box>
            <SectionHeading>Remittance Detail</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Denied ($)" value={String(record.deniedAmount ?? 0)} uncertain={u.includes('deniedAmount')} readOnly={!u.includes('deniedAmount')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('deniedAmount', n) }} />
                <DrawerField label="Paid ($)" value={String(record.paidAmount ?? 0)} readOnly onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('paidAmount', n) }} />
                <DrawerField label="Adjustment ($)" value={String(record.adjustmentAmount ?? 0)} readOnly onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('adjustmentAmount', n) }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField
                  label="CARC" value={record.carc ?? ''} uncertain={u.includes('carc')}
                  readOnly={!u.includes('carc')}
                  onChange={v => {
                    onUpdate('carc', v)
                    const derived = denialTypeFromCarc(v)
                    if (derived) {
                      onUpdate('denialType', derived)
                      onUpdate('suggestedEngine', ENGINE_FROM_TYPE[derived] ?? '?')
                    }
                  }}
                />
                <DrawerField label="RARC" value={record.rarc ?? ''} uncertain={u.includes('rarc')} readOnly={!u.includes('rarc')} onChange={v => onUpdate('rarc', v)} />
              </Box>
              <DrawerField
                label="Denial Type" value={record.denialType}
                readOnly={!u.includes('denialType') && !u.includes('carc')}
                uncertain={u.includes('denialType')}
                onChange={v => {
                  onUpdate('denialType', v)
                  onUpdate('suggestedEngine', ENGINE_FROM_TYPE[v] ?? '?')
                }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
                <DrawerField label="Deadline" value={record.deadline} type="date" onChange={v => onUpdate('deadline', v)} />
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Payer & Denial — denial letter types ─────────────────────────── */}
        {!is835 && !isAppealResponse && (
          <Box>
            <SectionHeading>Payer & Denial</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Payer" value={record.payer} onChange={v => onUpdate('payer', v)} />
              {!isAdr && (
                <>
                  <DrawerField
                    label="Denial Type" value={record.denialType}
                    readOnly={!u.includes('denialType')}
                    uncertain={u.includes('denialType')}
                    onChange={v => {
                      onUpdate('denialType', v)
                      onUpdate('suggestedEngine', ENGINE_FROM_TYPE[v] ?? '?')
                    }}
                  />
                  <DrawerField label="Denial Subtype / Description" value={record.denialSubtype} multiline onChange={v => onUpdate('denialSubtype', v)} />
                </>
              )}
              {isAdr && (
                <DrawerField label="Review Subtype" value={record.denialSubtype} multiline onChange={v => onUpdate('denialSubtype', v)} />
              )}
            </Box>
          </Box>
        )}

        {/* ── Payer — appeal responses ─────────────────────────────────────── */}
        {isAppealResponse && (
          <Box>
            <SectionHeading>Payer</SectionHeading>
            <DrawerField label="Payer" value={record.payer} onChange={v => onUpdate('payer', v)} />
          </Box>
        )}

        <Divider />

        {/* ── Med nec: clinical review ─────────────────────────────────────── */}
        {st === 'med-nec-denial' && (
          <Box>
            <SectionHeading>Clinical Review</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Clinical Criteria Referenced" value={record.clinicalCriteria ?? ''} uncertain={u.includes('clinicalCriteria')} onChange={v => onUpdate('clinicalCriteria', v)} />
              <DrawerField label="Reviewing Physician" value={record.reviewingPhysician ?? ''} uncertain={u.includes('reviewingPhysician')} onChange={v => onUpdate('reviewingPhysician', v)} />
              <DrawerField label="Level of Care Issue" value={record.levelOfCare ?? ''} uncertain={u.includes('levelOfCare')} multiline onChange={v => onUpdate('levelOfCare', v)} />
            </Box>
          </Box>
        )}

        {/* ── Auth: authorization detail ───────────────────────────────────── */}
        {st === 'auth-denial' && (
          <Box>
            <SectionHeading>Authorization</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Auth Number on File" value={record.authNumber ?? ''} uncertain={u.includes('authNumber')} onChange={v => onUpdate('authNumber', v)} />
              <DrawerField label="Service Requiring Auth" value={record.serviceRequiringAuth ?? ''} uncertain={u.includes('serviceRequiringAuth')} multiline onChange={v => onUpdate('serviceRequiringAuth', v)} />
            </Box>
          </Box>
        )}

        {/* ── DRG: comparison ─────────────────────────────────────────────── */}
        {st === 'drg-downgrade' && (
          <Box>
            <SectionHeading>DRG Comparison</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Original DRG" value={record.originalDrg ?? ''} uncertain={u.includes('originalDrg')} onChange={v => onUpdate('originalDrg', v)} />
                <DrawerField label="Adjusted DRG" value={record.adjustedDrg ?? ''} uncertain={u.includes('adjustedDrg')} onChange={v => onUpdate('adjustedDrg', v)} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <DrawerField label="Original Payment ($)" value={String(record.originalPayment ?? 0)} uncertain={u.includes('originalPayment')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('originalPayment', n) }} />
                <DrawerField label="Adjusted Payment ($)" value={String(record.adjustedPayment ?? 0)} uncertain={u.includes('adjustedPayment')} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('adjustedPayment', n) }} />
              </Box>
            </Box>
          </Box>
        )}

        {/* ── ADR: records request ─────────────────────────────────────────── */}
        {isAdr && (
          <Box>
            <SectionHeading>Records Request</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DrawerField label="Records Requested" value={record.recordsRequested ?? ''} uncertain={u.includes('recordsRequested')} multiline onChange={v => onUpdate('recordsRequested', v)} />
              <DrawerField label="Submission Deadline" value={record.submissionDeadline ?? ''} type="date" onChange={v => onUpdate('submissionDeadline', v)} />
              <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
            </Box>
          </Box>
        )}

        {/* ── Appeal overturned: decision detail ──────────────────────────── */}
        {st === 'appeal-overturned' && (
          <Box>
            <SectionHeading>Appeal Decision</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#ECFDF5', borderColor: '#6EE7B7' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#065F46' }}>Appeal Overturned</Typography>
                <Typography variant="caption" color="text.secondary">Payment authorized. Apply update to mark as Won.</Typography>
              </Paper>
              <DrawerField label="Approved Amount ($)" value={String(record.approvedAmount ?? 0)} onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('approvedAmount', n) }} />
            </Box>
          </Box>
        )}

        {/* ── Appeal upheld: decision detail ──────────────────────────────── */}
        {st === 'appeal-upheld' && (
          <Box>
            <SectionHeading>Appeal Decision</SectionHeading>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#991B1B' }}>Appeal Upheld</Typography>
                <Typography variant="caption" color="text.secondary">Original denial stands. Review further appeal rights below.</Typography>
              </Paper>
              <DrawerField label="Further Appeal Rights" value={record.furtherAppealRights ?? ''} multiline onChange={v => onUpdate('furtherAppealRights', v)} />
            </Box>
          </Box>
        )}

        {/* ── Financials — denial letter types (not 835, adr, appeal) ────────  */}
        {!is835 && !isAdr && !isAppealResponse && (
          <>
            <Divider />
            <Box>
              <SectionHeading>Financials & Dates</SectionHeading>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <DrawerField
                  label="Denied Amount ($)"
                  value={String(record.deniedAmount ?? 0)}
                  uncertain={u.includes('deniedAmount')}
                  onChange={v => { const n = parseFloat(v); if (!isNaN(n)) onUpdate('deniedAmount', n) }}
                />
                {st !== 'drg-downgrade' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <DrawerField label="CARC" value={record.carc ?? ''} uncertain={u.includes('carc')} onChange={v => onUpdate('carc', v)} />
                    <DrawerField label="RARC" value={record.rarc ?? ''} uncertain={u.includes('rarc')} onChange={v => onUpdate('rarc', v)} />
                  </Box>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <DrawerField label="Date of Service" value={record.dos} type="date" onChange={v => onUpdate('dos', v)} />
                  <DrawerField label="Deadline" value={record.deadline} type="date" onChange={v => onUpdate('deadline', v)} />
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* ── Assignment ── */}
        {!isUpdate && !isDupe && (
          <>
            <Divider />
            <Box>
              <SectionHeading>Assignment</SectionHeading>
              <FormControl fullWidth size="small">
                <Select
                  value={record.assignedTo?.id ?? ''}
                  onChange={e => {
                    const member = TEAM_MEMBERS.find(m => m.id === e.target.value) ?? null
                    onUpdate('assignedTo', member)
                  }}
                  displayEmpty
                  renderValue={v => v ? (TEAM_MEMBERS.find(m => m.id === v)?.name ?? 'Unassigned') : <span style={{ color: '#9e9e9e' }}>Unassigned</span>}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Unassigned</MenuItem>
                  {TEAM_MEMBERS.map(m => (
                    <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.875rem' }}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </>
        )}

        {/* ── Classification — only for uncertain new records ── */}
        {!isUpdate && !isAdr && !isAppealResponse && record.suggestedEngine === '?' && (
          <>
            <Divider />
            <Box>
              <SectionHeading>Classification Required</SectionHeading>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                Denial type could not be determined from the source. Select the correct type before importing.
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Denial Type</InputLabel>
                <Select
                  value={record.denialType ?? ''}
                  label="Denial Type"
                  onChange={e => {
                    onUpdate('denialType', e.target.value)
                    onUpdate('suggestedEngine', ENGINE_FROM_TYPE[e.target.value] ?? '?')
                  }}
                  sx={{ fontSize: '0.875rem', bgcolor: '#fffbeb' }}
                >
                  {Object.keys(ENGINE_FROM_TYPE).filter(t => t !== 'ADR').map(t => (
                    <MenuItem key={t} value={t} sx={{ fontSize: '0.875rem' }}>{t}</MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ color: '#d97706', fontSize: '0.7rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <WarningAmberOutlined sx={{ fontSize: 11 }} />
                  Required before importing
                </Typography>
              </FormControl>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            Source: {record.sourceFile}
          </Typography>
          {hasRaw && (
            <Button
              size="small" variant="text" startIcon={<CodeOutlined sx={{ fontSize: 14 }} />}
              onClick={onViewRaw}
              sx={{ fontSize: '0.7rem', color: 'text.secondary', py: 0.25, minWidth: 0 }}
            >
              View source file
            </Button>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        {isUpdate && record.updateProposal ? (
          <>
            <Button fullWidth variant="outlined" onClick={onClose} sx={{ color: 'text.secondary', borderColor: 'divider' }}>Ignore</Button>
            <Button
              fullWidth variant="contained" disableElevation
              color={chosenOutcome?.state === 'Won' || chosenOutcome?.state === 'Recovered' || chosenOutcome?.state === 'Closed' ? 'success' : 'warning'}
              onClick={() => {
                onApplyUpdate(record.updateProposal!, {
                  state: chosenOutcome?.state ?? record.updateProposal!.suggestedState,
                  status: chosenOutcome?.status ?? record.updateProposal!.suggestedStatus,
                  ...record.updateProposal!.updates,
                  ...(record.paidAmount !== undefined ? { paidAmount: record.paidAmount } : {}),
                })
                onClose()
              }}
            >
              Apply — {chosenOutcome?.label ?? 'Apply Update'}
            </Button>
          </>
        ) : (
          <Button fullWidth variant="outlined" onClick={onClose}>Done</Button>
        )}
      </Box>
    </Drawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IngestPageProps {
  denials: DenialRecord[]
  onCommit: (newRecords: DenialRecord[]) => void
  onUpdate: (denialId: string, updates: Partial<DenialRecord>) => void
}

export default function IngestPage({ denials, onCommit, onUpdate }: IngestPageProps) {
  const [processing, setProcessing] = useState<string[]>([])
  const [staged, setStaged] = useState<StagedRecord[]>(() =>
    SEED_STAGED.map(entry => ({
      ...entry,
      possibleMatches: entry.status === 'new' ? findFuzzyMatches(entry as RawExtraction, denials) : [],
    }))
  )
  const [committed, setCommitted] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [rawFiles, setRawFiles] = useState<Record<string, string>>({})
  const [rawViewFile, setRawViewFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingDenialByClaimId = Object.fromEntries(denials.map(d => [d.claim.claimId, d]))

  function processFile(file: File) {
    const fileType = getFileType(file.name)
    if (!fileType) return

    setProcessing(prev => [...prev, file.name])
    setCommitted(null)

    // Read raw content for the "view raw" feature
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRawFiles(prev => ({ ...prev, [file.name]: text }))
    }
    reader.readAsText(file)

    setTimeout(() => {
      const rawList: RawExtraction[] = FILE_EXTRACTIONS[file.name] ?? TYPE_EXTRACTIONS[fileType] ?? []

      const newStaged: StagedRecord[] = rawList.map(r => {
        const uncertain = r.uncertainFields ?? []
        const existing = existingDenialByClaimId[r.claimId]
        const status: StagedRecord['status'] = existing
          ? (r.updateProposal ? 'update' : 'duplicate')
          : 'new'

        const possibleMatches = status === 'new' ? findFuzzyMatches(r, denials) : []
        return {
          ...r,
          tempId: `tmp-${tempIdCounter++}`,
          selected: status === 'new',
          status,
          sourceFile: file.name,
          uncertainFields: uncertain,
          suggestedEngine: classifyEngine(r.sourceType, r.denialType, uncertain.includes('denialType')),
          possibleMatches,
        }
      })

      setProcessing(prev => prev.filter(n => n !== file.name))
      setStaged(prev => {
        const alreadyStaged = prev.some(r => r.sourceFile === file.name)
        return alreadyStaged ? prev : [...prev, ...newStaged]
      })
    }, 1400)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(processFile)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [denials])

  function updateField<K extends keyof StagedRecord>(tempId: string, key: K, value: StagedRecord[K]) {
    setStaged(prev => prev.map(r => {
      if (r.tempId !== tempId) return r
      const updated = { ...r, [key]: value }
      if (typeof key === 'string' && updated.uncertainFields.includes(key) && value) {
        updated.uncertainFields = updated.uncertainFields.filter(f => f !== key)
      }
      return updated
    }))
  }

  function toggleSelect(tempId: string) {
    setStaged(prev => prev.map(r => r.tempId === tempId ? { ...r, selected: !r.selected } : r))
  }

  function removeRow(tempId: string) {
    setStaged(prev => prev.filter(r => r.tempId !== tempId))
    if (drawerId === tempId) setDrawerId(null)
  }

  function handleApplyUpdate(proposal: UpdateProposal, updates: Partial<DenialRecord>) {
    const today = new Date().toISOString().split('T')[0]!
    const fullUpdates: Partial<DenialRecord> = { ...updates }
    if (proposal.episodeResultLabel) {
      fullUpdates.incomingEpisodeResult = {
        label: proposal.episodeResultLabel,
        date: today,
        source: proposal.label,
        description: proposal.episodeResultDescription,
      }
    }
    onUpdate(proposal.existingDenialId, fullUpdates)
    setStaged(prev => prev.filter(r => r.updateProposal?.existingDenialId !== proposal.existingDenialId))
  }

  const newRows     = staged.filter(r => r.status === 'new')
  const updateRows  = staged.filter(r => r.status === 'update')
  const dupeRows    = staged.filter(r => r.status === 'duplicate')
  const selectedNew = staged.filter(r => r.selected && r.status === 'new')
  const allNewSelected  = newRows.length > 0 && newRows.every(r => r.selected)
  const someNewSelected = newRows.some(r => r.selected) && !allNewSelected
  const hasUncertain    = staged.some(r => r.uncertainFields.length > 0 && r.status !== 'duplicate')

  function toggleAllNew() {
    const next = !allNewSelected
    setStaged(prev => prev.map(r => r.status === 'new' ? { ...r, selected: next } : r))
  }

  function handleCommit() {
    const toCommit = staged.filter(r => r.selected && r.status === 'new')
    const newDenials: DenialRecord[] = toCommit.map((r, i) => {
      const newId = `DN-2026-${String(1500 + i).padStart(4, '0')}`
      const possibleMatches: PossibleMatch[] | undefined = r.possibleMatches.length > 0
        ? r.possibleMatches.map(m => ({ denialId: m.existingDenialId, confidence: m.confidence, reasons: m.reasons }))
        : undefined
      return {
        id: newId,
        patient: { name: r.patientName, mrn: r.mrn },
        claim: { claimId: r.claimId, har: r.har ?? '' },
        payer: r.payer,
        denialType: r.denialType,
        denialSubtype: r.denialSubtype,
        carc: r.carc ?? '',
        rarc: r.rarc || undefined,
        deniedAmount: r.deniedAmount ?? 0,
        deadline: r.deadline || r.submissionDeadline || addDays(TODAY, 30),
        createdAt: TODAY,
        dos: r.dos,
        state: 'Active' as const,
        status: 'In Progress' as const,
        assignedTo: r.assignedTo ?? null,
        nextAction: '',
        notes: '',
        ...(possibleMatches ? { possibleMatches } : {}),
      }
    })

    onCommit(newDenials)
    setCommitted(newDenials.length)
    setStaged(prev => prev.filter(r => !(r.selected && r.status === 'new')))
    setDrawerId(null)
  }

  const drawerRecord = staged.find(r => r.tempId === drawerId) ?? null
  const drawerMatchedDenial = drawerRecord?.updateProposal
    ? denials.find(d => d.id === drawerRecord.updateProposal!.existingDenialId) ?? null
    : null

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Drop zone ──────────────────────────────────────────────────────── */}
      <Paper
        variant="outlined"
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 4, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
          borderStyle: 'dashed', borderWidth: 2,
          borderColor: dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? 'rgba(27,58,92,0.04)' : 'background.paper',
          transition: 'all 0.15s',
          '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(27,58,92,0.02)' },
        }}
      >
        <input
          ref={fileInputRef} type="file" multiple
          accept=".edi,.835,.pdf,.csv,.xlsx,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <UploadFileOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>Drop files here or click to browse</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Accepts 835 EDI remits, PDF denial letters, ADR letters, appeal responses, and CSV exports
        </Typography>
      </Paper>

      {processing.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LinearProgress sx={{ flex: 1, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Parsing {processing.length} file{processing.length !== 1 ? 's' : ''}…
          </Typography>
        </Box>
      )}

      {/* ── Banners ────────────────────────────────────────────────────────── */}
      {committed !== null && (
        <Alert severity="success" onClose={() => setCommitted(null)} sx={{ borderRadius: 1.5 }}>
          {committed} denial{committed !== 1 ? 's' : ''} added to the <strong>Active</strong> worklist.
        </Alert>
      )}
      {hasUncertain && (
        <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ borderRadius: 1.5 }}>
          Some records have fields that could not be confidently extracted. Click a row to open and review.
        </Alert>
      )}

      {/* ── Staging table ──────────────────────────────────────────────────── */}
      {staged.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Staging
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                Click any row to review and edit. Select new records to import.
              </Typography>
            </Box>
            <Button
              variant="contained" disableElevation
              disabled={selectedNew.length === 0}
              onClick={handleCommit}
              sx={{ fontWeight: 600 }}
            >
              Accept & Activate{selectedNew.length > 0 ? ` (${selectedNew.length})` : ''}
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox" sx={{ width: 44, pl: 1.5 }}>
                      <Checkbox size="small" indeterminate={someNewSelected} checked={allNewSelected} onChange={toggleAllNew} />
                    </TableCell>
                    {['Status', 'Patient', 'Payer', 'Document Type', 'Amount', 'Engine', ''].map(h => (
                      <TableCell key={h} sx={{ py: 1 }}>
                        <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.secondary', letterSpacing: '0.07em' }}>{h}</Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staged.map(row => {
                    const isDupe   = row.status === 'duplicate'
                    const isUpdate = row.status === 'update'
                    const hasFlags = row.uncertainFields.length > 0
                    const isAppeal = row.sourceType === 'appeal-upheld' || row.sourceType === 'appeal-overturned'
                    const hasPossibleMatches = row.status === 'new' && row.possibleMatches.length > 0

                    // Amount display: 835 shows denied, appeal-overturned shows approved, adr shows —
                    const amountDisplay = row.sourceType === 'adr'
                      ? '— pre-payment'
                      : row.sourceType === 'appeal-overturned' && row.approvedAmount
                        ? fmt(row.approvedAmount)
                        : row.sourceType === 'appeal-upheld'
                          ? '—'
                          : row.deniedAmount !== undefined
                            ? fmt(row.deniedAmount)
                            : '—'

                    return (
                      <TableRow
                        key={row.tempId}
                        hover
                        onClick={() => setDrawerId(row.tempId)}
                        sx={{
                          cursor: 'pointer',
                          opacity: isDupe ? 0.5 : 1,
                          bgcolor: drawerId === row.tempId ? 'rgba(27,58,92,0.04)' : isUpdate ? 'rgba(237,137,54,0.03)' : 'background.paper',
                          borderLeft: isUpdate ? '3px solid' : '3px solid transparent',
                          borderLeftColor: isUpdate ? 'warning.main' : 'transparent',
                          '&:last-child td': { border: 0 },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 1.5 }} onClick={e => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={row.selected}
                            disabled={isDupe || isUpdate || isAppeal}
                            onChange={() => toggleSelect(row.tempId)}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ width: 110 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={isDupe ? 'Duplicate' : isUpdate ? 'Update' : 'New'}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, width: 'fit-content',
                                bgcolor: isDupe ? 'grey.200' : isUpdate ? '#fef3c7' : '#e6f4ea',
                                color:   isDupe ? 'text.secondary' : isUpdate ? '#92400e' : '#276749',
                              }}
                            />
                            {hasPossibleMatches && (
                              <Tooltip title={`${row.possibleMatches.length} possible match${row.possibleMatches.length > 1 ? 'es' : ''} — linking can be reviewed from the case view`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: 'fit-content' }}>
                                  <AccountTreeOutlined sx={{ fontSize: 11, color: 'text.secondary' }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Possible match</Typography>
                                </Box>
                              </Tooltip>
                            )}
                            {hasFlags && !isDupe && (
                              <Tooltip title={`Uncertain: ${row.uncertainFields.join(', ')}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, width: 'fit-content' }}>
                                  <WarningAmberOutlined sx={{ fontSize: 11, color: 'warning.main' }} />
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.dark' }}>Review</Typography>
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Patient */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{row.patientName}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem' }}>{row.mrn}</Typography>
                        </TableCell>

                        {/* Payer */}
                        <TableCell>
                          <Typography variant="body2">{row.payer}</Typography>
                        </TableCell>

                        {/* Document Type */}
                        <TableCell>
                          <SourceChip sourceType={row.sourceType} />
                          {row.denialType && row.denialType !== 'ADR' && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.25 }}>
                              {row.denialType}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Amount */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.sourceType === 'appeal-overturned' ? 'success.dark' : 'inherit' }}>
                            {amountDisplay}
                          </Typography>
                        </TableCell>

                        {/* Engine */}
                        <TableCell><EngineChip engine={row.suggestedEngine} /></TableCell>

                        {/* Chevron */}
                        <TableCell align="right" sx={{ pr: 1, width: 52 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={e => { e.stopPropagation(); removeRow(row.tempId) }}
                              sx={{ p: 0.25, color: 'text.disabled', opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 }, '&:hover': { color: 'error.main' } }}
                            >
                              <CloseOutlined sx={{ fontSize: 13 }} />
                            </IconButton>
                            <ChevronRightOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />
            <Box sx={{ px: 2, py: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{staged.length} record{staged.length !== 1 ? 's' : ''} staged</Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" sx={{ color: 'success.dark' }}>{newRows.length} new</Typography>
              {updateRows.length > 0 && <><Typography variant="caption" color="text.secondary">·</Typography><Typography variant="caption" sx={{ color: 'warning.dark' }}>{updateRows.length} update{updateRows.length !== 1 ? 's' : ''}</Typography></>}
              {dupeRows.length > 0 && <><Typography variant="caption" color="text.secondary">·</Typography><Typography variant="caption" color="text.secondary">{dupeRows.length} duplicate{dupeRows.length !== 1 ? 's' : ''}</Typography></>}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── Record drawer ──────────────────────────────────────────────────── */}
      <RecordDrawer
        record={drawerRecord}
        open={Boolean(drawerRecord)}
        onClose={() => setDrawerId(null)}
        onUpdate={(key, value) => drawerId && updateField(drawerId, key, value)}
        onApplyUpdate={handleApplyUpdate}
        hasRaw={Boolean(drawerRecord && (rawFiles[drawerRecord.sourceFile] || drawerRecord.rawContent))}
        onViewRaw={() => drawerRecord && setRawViewFile(drawerRecord.sourceFile)}
        matchedDenial={drawerMatchedDenial ?? undefined}
      />

      {/* ── Raw file viewer ────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(rawViewFile)}
        onClose={() => setRawViewFile(null)}
        maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2, height: '80vh' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Source File</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{rawViewFile}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setRawViewFile(null)}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box
            component="pre"
            sx={{
              m: 0, p: 2.5,
              fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              color: 'text.primary', bgcolor: '#FAFAFA',
              height: '100%', overflow: 'auto',
            }}
          >
            {rawViewFile ? (rawFiles[rawViewFile] ?? staged.find(r => r.sourceFile === rawViewFile)?.rawContent ?? '(No content — file could not be read)') : ''}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
