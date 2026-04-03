export type DenialState = 'Intake' | 'Active' | 'Submitted' | 'Resolved' | 'Closed' | 'Archived'

// ── Per-state status types ────────────────────────────────────────────────────
// Intake: describes how far along the triage/acceptance decision is
export type IntakeStatus = 'Unreviewed' | 'Pending Acceptance'

// Active: describes what work is currently happening or what's blocking progress
export type ActiveStatus =
  | 'In Progress'
  | 'Appeal Drafting'
  | 'Awaiting Records'
  | 'Records Ready — Review Needed'
  | 'Awaiting Payer Portal'
  | 'Eligibility Investigation'
  | 'Corrected Claim Submitted'

// Submitted: describes why it hasn't resolved yet
export type SubmittedStatus = 'Awaiting Payer Decision' | 'Submission Failed' | 'Response Overdue'

// Resolved/Closed: mirrors the outcome — status IS the outcome for terminal states
export type ResolvedStatus =
  | 'Overturned — Full Payment'
  | 'Overturned — Partial Payment'
  | 'Upheld by Payer'
  | 'Partial Settlement'
  | 'Corrected Claim Paid'
  | 'Secondary Payer Paid'
  | 'Will Not Appeal'

export type ClosedStatus = 'Will Not Appeal' | 'Dismissed' | 'Escalated to DRG Dispute' | 'Closed'

export type ArchivedStatus = 'Archived'

export type DenialStatus = IntakeStatus | ActiveStatus | SubmittedStatus | ResolvedStatus | ClosedStatus | ArchivedStatus

export interface TeamMember {
  id: string
  name: string
  initials: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'sc', name: 'Sarah Chen', initials: 'SC' },
  { id: 'mw', name: 'Marcus Webb', initials: 'MW' },
  { id: 'pn', name: 'Priya Nair', initials: 'PN' },
  { id: 'dr', name: 'Devon Ross', initials: 'DR' },
]

export interface DenialRecord {
  id: string
  patient: { name: string; mrn: string }
  claim: { claimId: string; har: string }
  payer: string
  denialType: string
  denialSubtype: string
  carc: string
  rarc?: string
  deniedAmount: number
  deadline: string   // ISO date string YYYY-MM-DD
  createdAt: string  // ISO date string YYYY-MM-DD
  dos: string        // date of service
  state: DenialState
  status: DenialStatus
  assignedTo: TeamMember | null
  nextAction: string
  needsAttention: boolean
  relatedDenialIds?: string[]
  needsAttentionReasons: string[]
  notes: string
  archivedFrom?: { state: DenialState; status: DenialStatus }
}

// Reference date: 2026-04-02
function d(offset: number): string {
  const base = new Date('2026-04-02')
  base.setDate(base.getDate() + offset)
  return base.toISOString().split('T')[0]!
}

export const SEED_DENIALS: DenialRecord[] = [
  {
    id: 'DN-2026-0412',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847291', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 4210.00,
    deadline: d(4), createdAt: d(-18), dos: '2026-02-14',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'Physician attestation obtained. Drafting level 1 appeal — deadline in 4 days.',
    needsAttention: true,
    needsAttentionReasons: ['Appeal deadline in 4 days'],
  },
  {
    id: 'DN-2026-0389',
    patient: { name: 'Raymond Castellano', mrn: 'MRN-091247' },
    claim: { claimId: 'CLM-9920441', har: 'HAR-881033' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 12480.00,
    deadline: d(21), createdAt: d(-15), dos: '2026-02-18',
    state: 'Intake', status: 'Unreviewed',
    assignedTo: null,
    notes: '',
    needsAttention: true,
    needsAttentionReasons: ['High-value claim ($12,480) unworked for 15 days', 'Unassigned'],
  },
  {
    id: 'DN-2026-0401',
    patient: { name: 'Dorothy Kim', mrn: 'MRN-203881' },
    claim: { claimId: 'CLM-7712993', har: 'HAR-662200' },
    payer: 'Medicare',
    denialType: 'Coding Error',
    denialSubtype: 'ICD-10 Principal Dx Sequencing',
    carc: 'CARC-4',
    deniedAmount: 892.50,
    deadline: d(30), createdAt: d(-8), dos: '2026-02-28',
    state: 'Active', status: 'In Progress',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'CDI flagged sequencing issue on 2/28 admit. Corrected claim ready to resubmit.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0377',
    patient: { name: 'James Okafor', mrn: 'MRN-318740' },
    claim: { claimId: 'CLM-6634882', har: 'HAR-559001' },
    payer: 'UnitedHealthcare',
    denialType: 'Authorization',
    denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 6750.00,
    deadline: d(14), createdAt: d(-10), dos: '2026-03-01',
    state: 'Submitted', status: 'Submission Failed',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'Portal submission failed 4/1 — payer ID mismatch. Confirmed correct routing with clearinghouse.',
    needsAttention: true,
    needsAttentionReasons: ['Last submission attempt failed'],
  },
  {
    id: 'DN-2026-0358',
    patient: { name: 'Carolyn Brandt', mrn: 'MRN-447129' },
    claim: { claimId: 'CLM-5521334', har: 'HAR-430887' },
    payer: 'Cigna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50',
    deniedAmount: 3210.75,
    deadline: d(35), createdAt: d(-5), dos: '2026-03-10',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: '',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0344',
    patient: { name: 'Louis Tremblay', mrn: 'MRN-509334' },
    claim: { claimId: 'CLM-4408772', har: 'HAR-321099' },
    payer: 'Medicaid',
    denialType: 'Eligibility',
    denialSubtype: 'Coverage Inactive on DOS',
    carc: 'CARC-31',
    deniedAmount: 1450.00,
    deadline: d(10), createdAt: d(-6), dos: '2026-03-05',
    state: 'Active', status: 'Eligibility Investigation',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Low-confidence match flagged. Verifying coverage — patient may have had dual eligibility on DOS.',
    needsAttention: true,
    needsAttentionReasons: ['Low-confidence patient match — verify identity before action'],
  },
  {
    id: 'DN-2026-0331',
    patient: { name: 'Nancy Whitfield', mrn: 'MRN-612847' },
    claim: { claimId: 'CLM-3317661', har: 'HAR-210445' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Recoupment',
    denialSubtype: 'Overpayment — MS-DRG Audit',
    carc: 'CARC-45',
    deniedAmount: 8920.00,
    deadline: d(6), createdAt: d(-14), dos: '2026-01-30',
    state: 'Active', status: 'Awaiting Records',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'BCBS initiated recoupment on 3/19 audit. Clinical docs pulled — submitting dispute this week.',
    needsAttention: true,
    needsAttentionReasons: ['Active recoupment — timely response required', 'Deadline in 6 days'],
  },
  {
    id: 'DN-2026-0318',
    patient: { name: 'Timothy Reyes', mrn: 'MRN-701023' },
    claim: { claimId: 'CLM-2209115', har: 'HAR-108334' },
    payer: 'Aetna',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 470 → 483',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 5640.00,
    deadline: d(28), createdAt: d(-4), dos: '2026-03-12',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: '',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0305',
    patient: { name: 'Helen Nakamura', mrn: 'MRN-834512' },
    claim: { claimId: 'CLM-1198004', har: 'HAR-009771' },
    payer: 'UnitedHealthcare',
    denialType: 'Timely Filing',
    denialSubtype: 'Claim Received After 90-Day Limit',
    carc: 'CARC-29',
    deniedAmount: 2130.00,
    deadline: d(2), createdAt: d(-22), dos: '2025-11-18',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Clearinghouse confirmed 11/18 transmission. Pulling 277 report to attach to appeal.',
    needsAttention: true,
    needsAttentionReasons: ['Appeal deadline in 2 days'],
  },
  {
    id: 'DN-2026-0292',
    patient: { name: 'Franklin Pierce', mrn: 'MRN-922771' },
    claim: { claimId: 'CLM-0087213', har: 'HAR-899002' },
    payer: 'Humana',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 9820.00,
    deadline: d(45), createdAt: d(-3), dos: '2026-03-20',
    state: 'Intake', status: 'Pending Acceptance',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: '',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0278',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9876541', har: 'HAR-788229' },
    payer: 'Medicare',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 4110.00,
    deadline: d(9), createdAt: d(-12), dos: '2026-02-10',
    state: 'Active', status: 'Awaiting Records',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'ADR received 3/21. HealthSource request pending — records not yet retrieved after 12 days.',
    needsAttention: true,
    needsAttentionReasons: ['ADR open — medical records not retrieved after 12 days'],
  },
  {
    id: 'DN-2026-0261',
    patient: { name: 'Arthur Delacroix', mrn: 'MRN-187440' },
    claim: { claimId: 'CLM-8765432', har: 'HAR-677114' },
    payer: 'Cigna',
    denialType: 'Administrative',
    denialSubtype: 'Missing Billing NPI on Claim',
    carc: 'CARC-16',
    deniedAmount: 760.00,
    deadline: d(20), createdAt: d(-2), dos: '2026-03-25',
    state: 'Active', status: 'Corrected Claim Submitted',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: '',
    needsAttention: false,
    needsAttentionReasons: [],
  },

  // ── Resolved / Closed historical records ──────────────────────────────────

  {
    id: 'DN-2025-0847',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8819001', har: 'HAR-772001' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Medically Necessary',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8940.00,
    deadline: '2025-10-20', createdAt: '2025-07-28', dos: '2025-07-20',
    state: 'Resolved', status: 'Overturned — Full Payment',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 upheld, L2 upheld, external independent review overturned denial. Full $8,940 payment received 2025-10-18.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2025-1201',
    patient: { name: 'Raymond Castellano', mrn: 'MRN-091247' },
    claim: { claimId: 'CLM-9901002', har: 'HAR-880002' },
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 6200.00,
    deadline: '2026-01-05', createdAt: '2025-09-12', dos: '2025-09-05',
    state: 'Closed', status: 'Will Not Appeal',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'L1 and L2 upheld. Recovery ROI at $6,200 below external review threshold. Closed per finance approval.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2025-0932',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9862003', har: 'HAR-787003' },
    payer: 'Medicare',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 3840.00,
    deadline: '2025-08-15', createdAt: '2025-07-01', dos: '2025-06-15',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'Records submitted to Medicare in response to ADR. Post-review Medicare issued DRG downgrade — escalated to DN-2025-0933.',
    needsAttention: false,
    needsAttentionReasons: [],
    relatedDenialIds: ['DN-2025-0933'],
  },
  {
    id: 'DN-2025-0933',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9862004', har: 'HAR-787003' },
    payer: 'Medicare',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 194 → 195',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 3840.00,
    deadline: '2025-11-01', createdAt: '2025-08-20', dos: '2025-06-15',
    state: 'Resolved', status: 'Overturned — Full Payment',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'DRG downgrade issued after ADR record review (see DN-2025-0932). L2 appeal overturned — MS-DRG 194 restored. $3,840 recovered.',
    needsAttention: false,
    needsAttentionReasons: [],
    relatedDenialIds: ['DN-2025-0932'],
  },
  {
    id: 'DN-2025-1089',
    patient: { name: 'James Okafor', mrn: 'MRN-318740' },
    claim: { claimId: 'CLM-6618005', har: 'HAR-558005' },
    payer: 'Cigna',
    denialType: 'Authorization',
    denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 9450.00,
    deadline: '2026-01-15', createdAt: '2025-10-22', dos: '2025-10-15',
    state: 'Resolved', status: 'Overturned — Full Payment',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'Retro-auth request denied. L1 appeal + peer-to-peer with Cigna MD resulted in overturn. Full $9,450 recovered.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2025-1156',
    patient: { name: 'Carolyn Brandt', mrn: 'MRN-447129' },
    claim: { claimId: 'CLM-5504006', har: 'HAR-429006' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Authorization',
    denialSubtype: 'Service Not Authorized',
    carc: 'CARC-15',
    deniedAmount: 2100.00,
    deadline: '2026-02-01', createdAt: '2025-11-08', dos: '2025-11-01',
    state: 'Closed', status: 'Will Not Appeal',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 appeal upheld. Authorization gap confirmed — no retroactive pathway available. Closed per policy.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2025-0788',
    patient: { name: 'Nancy Whitfield', mrn: 'MRN-612847' },
    claim: { claimId: 'CLM-3302007', har: 'HAR-209007' },
    payer: 'Medicare',
    denialType: 'Recoupment',
    denialSubtype: 'Overpayment — Post-Payment Audit',
    carc: 'CARC-45',
    deniedAmount: 12400.00,
    deadline: '2025-10-10', createdAt: '2025-08-18', dos: '2025-08-10',
    state: 'Resolved', status: 'Partial Settlement',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'Medicare recoupment disputed with full clinical record. Settlement reached: $6,200 repaid, $6,200 written off by Medicare. Case closed 2025-11-14.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2025-1302',
    patient: { name: 'Helen Nakamura', mrn: 'MRN-834512' },
    claim: { claimId: 'CLM-1188008', har: 'HAR-008008' },
    payer: 'Aetna',
    denialType: 'Timely Filing',
    denialSubtype: 'Claim Received After 180-Day Limit',
    carc: 'CARC-29',
    deniedAmount: 3100.00,
    deadline: '2025-09-10', createdAt: '2025-07-15', dos: '2025-05-10',
    state: 'Resolved', status: 'Overturned — Full Payment',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: '277-CA confirmed timely transmission within filing window. Aetna accepted defense — full $3,100 paid.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0044',
    patient: { name: 'Dorothy Kim', mrn: 'MRN-203881' },
    claim: { claimId: 'CLM-7700009', har: 'HAR-661009' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Coding Error',
    denialSubtype: 'ICD-10 Principal Dx Sequencing',
    carc: 'CARC-4',
    deniedAmount: 1240.00,
    deadline: '2026-02-20', createdAt: '2025-12-01', dos: '2025-09-20',
    state: 'Resolved', status: 'Corrected Claim Paid',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'ICD-10 sequencing corrected per CDI review. BCBS processed corrected claim — $1,240 paid 2026-01-08.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0077',
    patient: { name: 'Louis Tremblay', mrn: 'MRN-509334' },
    claim: { claimId: 'CLM-4396010', har: 'HAR-319010' },
    payer: 'Medicaid',
    denialType: 'Eligibility',
    denialSubtype: 'Coverage Inactive on DOS',
    carc: 'CARC-31',
    deniedAmount: 2340.00,
    deadline: '2026-03-10', createdAt: '2026-01-08', dos: '2025-12-10',
    state: 'Resolved', status: 'Secondary Payer Paid',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Medicaid coverage confirmed inactive on DOS. Medicare identified as primary — billed and paid in full. $2,340 recovered.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0103',
    patient: { name: 'Franklin Pierce', mrn: 'MRN-922771' },
    claim: { claimId: 'CLM-0075011', har: 'HAR-897011' },
    payer: 'Cigna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50',
    deniedAmount: 4100.00,
    deadline: '2026-03-28', createdAt: '2026-01-15', dos: '2025-12-28',
    state: 'Closed', status: 'Will Not Appeal',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 appeal upheld. Cigna criteria for extended LOS not supported by documentation. Closed per finance — recovery below external review threshold.',
    needsAttention: false,
    needsAttentionReasons: [],
  },
  {
    id: 'DN-2026-0521',
    patient: { name: 'Harold Simmons', mrn: 'MRN-109432' },
    claim: { claimId: 'CLM-9921847', har: 'HAR-773290' },
    payer: 'UnitedHealthcare',
    denialType: 'Underpayment',
    denialSubtype: 'Contracted Rate Dispute',
    carc: 'CARC-45',
    deniedAmount: 4820.00,
    deadline: d(26), createdAt: d(-12), dos: '2026-02-18',
    state: 'Active', status: 'In Progress',
    assignedTo: TEAM_MEMBERS[1]!,
    nextAction: 'File payment dispute with contractual rate documentation',
    needsAttention: true,
    needsAttentionReasons: ['Contracted rate mismatch — paid $8,430, expected $13,250'],
    notes: 'UHC applied commercial fee schedule instead of negotiated case rate. Contract §4.2 specifies $13,250 for CABG.',
  },
  {
    id: 'DN-2026-0538',
    patient: { name: 'Beverly Santos', mrn: 'MRN-204417' },
    claim: { claimId: 'CLM-6634019', har: 'HAR-558802' },
    payer: 'Aetna',
    denialType: 'Underpayment',
    denialSubtype: 'Rate Schedule Mismatch',
    carc: 'CARC-45',
    deniedAmount: 2305.00,
    deadline: d(18), createdAt: d(-7), dos: '2026-03-01',
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    nextAction: 'Verify contracted rate and draft payment dispute letter',
    needsAttention: false,
    needsAttentionReasons: [],
    notes: 'Aetna paid at outpatient DRG rate for inpatient joint replacement. Contracted inpatient case rate should apply.',
  },
]
