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

export type AppealRoundType = 'L1_internal' | 'L2_external' | 'IRO' | 'redetermination' | 'reconsideration' | 'reopening'
export type AppealDecision = 'overturned' | 'upheld' | 'partial' | 'pending' | 'withdrawn'
export type InstanceSource = 'manual_upload' | '835_auto' | 'user_action' | 'system'
export type RelationshipType = 'adr_preceded' | 'adr_followed' | 'corrected_claim_of' | 'corrected_claim_led_to' | 'recoupment_of' | 'escalated_from'

export interface AppealRound {
  id: string
  roundNumber: number
  roundType: AppealRoundType
  submittedAt?: string
  submissionMethod?: 'mail' | 'portal' | 'fax' | 'electronic'
  payerResponseDeadline?: string
  decision: AppealDecision
  decisionDate?: string
  recoveryAmount?: number
  notes?: string
}

export interface RelatedInstance {
  denialId: string
  relationship: RelationshipType
}

export interface IncomingEpisodeResult {
  label: string
  date: string
  source?: string
  description?: string
}

export interface PossibleMatch {
  denialId: string
  confidence: 'high' | 'medium'
  reasons: string[]
}

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
  { id: 'jt', name: 'Jordy Tang', initials: 'JT' },
]

export const JORDY = { id: 'jt', name: 'Jordy Tang', initials: 'JT' } as const

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
  nextAction?: string
  notes: string
  archivedFrom?: { state: DenialState; status: DenialStatus }
  // Instance model fields
  source?: InstanceSource
  denialLetterOnFile?: boolean
  appealRounds?: AppealRound[]
  relatedInstances?: RelatedInstance[]
  possibleMatches?: PossibleMatch[]
  incomingEpisodeResult?: IncomingEpisodeResult
  /** @deprecated use relatedInstances */
  relatedDenialIds?: string[]
}

export const REVERSE_RELATIONSHIP: Record<RelationshipType, RelationshipType> = {
  adr_preceded:           'adr_followed',
  adr_followed:           'adr_preceded',
  corrected_claim_of:     'corrected_claim_led_to',
  corrected_claim_led_to: 'corrected_claim_of',
  recoupment_of:          'recoupment_of',
  escalated_from:         'escalated_from',
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
    relatedInstances: [{ denialId: 'DN-2026-0394', relationship: 'adr_preceded' }],
  },
  {
    id: 'DN-2026-0394',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847100', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 4210.00,
    deadline: '2026-03-28', createdAt: '2026-02-28', dos: '2026-02-14',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'BCBS requested documentation for 2/14 inpatient admit. Records submitted 3/12. BCBS completed review and issued DRG downgrade — escalated to DN-2026-0412.',
    relatedInstances: [{ denialId: 'DN-2026-0412', relationship: 'adr_followed' }],
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
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    notes: '',
    possibleMatches: [
      { denialId: 'DN-2025-1201', confidence: 'medium', reasons: ['Same patient (MRN)', 'Prior Medical Necessity — Inpatient Stay denial on file'] },
    ],
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
    appealRounds: [
      { id: 'r-0377-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2026-03-28', submissionMethod: 'portal', decision: 'pending' },
    ],
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
    relatedInstances: [{ denialId: 'DN-2026-0301', relationship: 'adr_preceded' }],
  },
  {
    id: 'DN-2026-0301',
    patient: { name: 'Timothy Reyes', mrn: 'MRN-701023' },
    claim: { claimId: 'CLM-2209001', har: 'HAR-108334' },
    payer: 'Aetna',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 5640.00,
    deadline: '2026-04-01', createdAt: '2026-03-20', dos: '2026-03-12',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'Aetna requested records for 3/12 surgical admit. Records submitted 3/26. Aetna completed utilization review and issued DRG downgrade — escalated to DN-2026-0318.',
    relatedInstances: [{ denialId: 'DN-2026-0318', relationship: 'adr_followed' }],
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
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: '',
    possibleMatches: [
      { denialId: 'DN-2026-0103', confidence: 'medium', reasons: ['Same patient (MRN)', 'Same denial type — Medical Necessity, Length of Stay'] },
    ],
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
    state: 'Active', status: 'Records Ready — Review Needed',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'ADR received 3/21. Records retrieved from HealthSource on 4/5 — ready for review.',
    possibleMatches: [
      { denialId: 'DN-2026-0451', confidence: 'high' as const, reasons: ['Same payer (Medicare)', 'ADR commonly precedes Medical Necessity denial', 'Overlapping date of service window'] },
    ],
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
    notes: 'Billing NPI missing from original claim. Corrected claim submitted 4/4 with NPI included. Awaiting Cigna reprocessing.',
    relatedInstances: [{ denialId: 'DN-2025-1144', relationship: 'corrected_claim_led_to' }],
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
    appealRounds: [
      { id: 'r-0847-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-08-20', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-09-08' },
      { id: 'r-0847-2', roundNumber: 2, roundType: 'L2_external', submittedAt: '2025-09-22', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-10-03' },
      { id: 'r-0847-3', roundNumber: 3, roundType: 'IRO', submittedAt: '2025-10-06', submissionMethod: 'mail', decision: 'overturned', decisionDate: '2025-10-18', recoveryAmount: 8940 },
    ],
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
    appealRounds: [
      { id: 'r-1201-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-10-02', submissionMethod: 'portal', decision: 'upheld', decisionDate: '2025-10-28' },
      { id: 'r-1201-2', roundNumber: 2, roundType: 'L2_external', submittedAt: '2025-11-08', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-12-01' },
    ],
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
    relatedInstances: [{ denialId: 'DN-2025-0933', relationship: 'adr_followed' }],
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
    relatedInstances: [{ denialId: 'DN-2025-0932', relationship: 'escalated_from' }],
    appealRounds: [
      { id: 'r-0933-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-09-10', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-09-28' },
      { id: 'r-0933-2', roundNumber: 2, roundType: 'L2_external', submittedAt: '2025-10-06', submissionMethod: 'mail', decision: 'overturned', decisionDate: '2025-10-25', recoveryAmount: 3840 },
    ],
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
    appealRounds: [
      { id: 'r-1089-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-11-10', submissionMethod: 'portal', decision: 'overturned', decisionDate: '2025-12-01', recoveryAmount: 9450, notes: 'Peer-to-peer with Cigna MD conducted 11/28 — contributed to overturn.' },
    ],
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
    appealRounds: [
      { id: 'r-1156-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-12-01', submissionMethod: 'portal', decision: 'upheld', decisionDate: '2025-12-22' },
    ],
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
    appealRounds: [
      { id: 'r-0788-1', roundNumber: 1, roundType: 'redetermination', submittedAt: '2025-09-05', submissionMethod: 'mail', decision: 'partial', decisionDate: '2025-10-20', notes: 'Settlement: $6,200 repaid, $6,200 written off.' },
    ],
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
    appealRounds: [
      { id: 'r-1302-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-08-02', submissionMethod: 'mail', decision: 'overturned', decisionDate: '2025-08-22', recoveryAmount: 3100, notes: '277-CA timely filing evidence accepted.' },
    ],
  },
  {
    id: 'DN-2025-1144',
    patient: { name: 'Arthur Delacroix', mrn: 'MRN-187440' },
    claim: { claimId: 'CLM-8752009', har: 'HAR-675009' },
    payer: 'Cigna',
    denialType: 'Administrative',
    denialSubtype: 'Missing Billing NPI on Claim',
    carc: 'CARC-16',
    deniedAmount: 635.00,
    deadline: '2026-01-15', createdAt: '2025-10-22', dos: '2025-10-18',
    state: 'Resolved', status: 'Corrected Claim Paid',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Same issue as current denial — billing NPI missing on original claim. Corrected claim submitted 11/04, Cigna processed and paid $635 on 11/19.',
    relatedInstances: [{ denialId: 'DN-2026-0261', relationship: 'corrected_claim_of' }],
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
    appealRounds: [
      { id: 'r-0103-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2026-02-03', submissionMethod: 'portal', decision: 'upheld', decisionDate: '2026-02-24' },
    ],
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
    notes: 'Aetna paid at outpatient DRG rate for inpatient joint replacement. Contracted inpatient case rate should apply.',
  },

  // ── Additional Intake denials ──────────────────────────────────────────────

  {
    id: 'DN-2026-0445',
    patient: { name: 'Patricia Goldstein', mrn: 'MRN-541209' },
    claim: { claimId: 'CLM-3847201', har: 'HAR-312091' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 7340.00,
    deadline: d(28), createdAt: d(0), dos: '2026-04-01',
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    notes: '',
    possibleMatches: [
      { denialId: 'DN-2026-0412', confidence: 'medium' as const, reasons: ['Same payer (Blue Cross Blue Shield)', 'Same denial type — DRG Downgrade, MS-DRG 291 → 292', 'Same diagnosis group'] },
    ],
  },
  {
    id: 'DN-2026-0451',
    patient: { name: 'Marcus Webb', mrn: 'MRN-619038' },
    claim: { claimId: 'CLM-4112830', har: 'HAR-388902' },
    payer: 'Medicare',
    denialType: 'Medical Necessity',
    denialSubtype: 'RAC Audit — Inpatient Admission Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 5920.00,
    deadline: d(35), createdAt: d(-1), dos: '2026-03-22',
    state: 'Active', status: 'In Progress',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'RAC identified this claim in batch review. Admission order and physician notes on file.',
  },
  {
    id: 'DN-2026-0463',
    patient: { name: 'Rosa Espinoza', mrn: 'MRN-728441' },
    claim: { claimId: 'CLM-5290017', har: 'HAR-471003' },
    payer: 'UnitedHealthcare',
    denialType: 'Authorization',
    denialSubtype: 'Concurrent Review Not Obtained',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 11200.00,
    deadline: d(18), createdAt: d(0), dos: '2026-03-28',
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    notes: '',
  },
  {
    id: 'DN-2026-0471',
    patient: { name: 'Chen Wei', mrn: 'MRN-833097' },
    claim: { claimId: 'CLM-6445882', har: 'HAR-558201' },
    payer: 'Aetna',
    denialType: 'Coding Error',
    denialSubtype: 'Procedure Code Bundling Error',
    carc: 'CARC-97',
    deniedAmount: 2890.00,
    deadline: d(40), createdAt: d(-1), dos: '2026-03-30',
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    notes: '',
  },
  {
    id: 'DN-2025-1201',
    patient: { name: 'Raymond Castellano', mrn: 'MRN-091247' },
    claim: { claimId: 'CLM-7741002', har: 'HAR-660811' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified — COPD Exacerbation',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 9840.00,
    deadline: d(-120), createdAt: d(-180), dos: '2025-10-04',
    state: 'Resolved', status: 'Overturned — Full Payment',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'Appeal overturned on clinical criteria argument. MCG criteria met per peer-to-peer.',
  },
  {
    id: 'DN-2026-0103',
    patient: { name: 'Franklin Pierce', mrn: 'MRN-922771' },
    claim: { claimId: 'CLM-8812004', har: 'HAR-771023' },
    payer: 'Humana',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria — Knee Replacement',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 6120.00,
    deadline: d(-60), createdAt: d(-90), dos: '2026-01-12',
    state: 'Resolved', status: 'Overturned — Partial Payment',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'Partial overturn — 3 of 5 days approved. Accepted partial.',
  },
]

// ── Scenario B: Tuesday morning — 15-item queue ───────────────────────────────
// Reference date: 2026-04-02. Today in scenario = 2026-04-08, so d(6) = today.
export const SCENARIO_B_DENIALS: DenialRecord[] = [
  // ── CRITICAL (deadline ≤ 3 days from today) ────────────────────────────────
  {
    id: 'SB-0001',
    patient: { name: 'Rosa Kim', mrn: 'MRN-558812' },
    claim: { claimId: 'CLM-4419023', har: 'HAR-221007' },
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Concurrent Review — Continued Stay Denied',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 18400.00,
    deadline: d(7), createdAt: d(-1), dos: '2026-04-04',
    state: 'Active', status: 'Awaiting Records',
    assignedTo: JORDY,
    notes: 'Records requested from HIM on 4/7 — not yet received. Deadline tomorrow.',
  },
  {
    id: 'SB-0002',
    patient: { name: 'James Whitfield', mrn: 'MRN-334490' },
    claim: { claimId: 'CLM-8802341', har: 'HAR-556123' },
    payer: 'Humana',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 9200.00,
    deadline: d(8), createdAt: d(-3), dos: '2026-04-01',
    state: 'Active', status: 'Records Ready — Review Needed',
    assignedTo: JORDY,
    notes: 'Records received. Physician attestation pending — needs clinical review before appeal can be drafted.',
  },
  {
    id: 'SB-0003',
    patient: { name: 'Diane Torres', mrn: 'MRN-771234' },
    claim: { claimId: 'CLM-3301892', har: 'HAR-449017' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 14800.00,
    deadline: d(9), createdAt: d(-5), dos: '2026-03-28',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: JORDY,
    notes: 'MCG criteria reviewed. Drafting Level 1 appeal — attending attestation obtained.',
  },
  // ── HIGH (deadline 4–7 days) ───────────────────────────────────────────────
  {
    id: 'SB-0004',
    patient: { name: 'Martin Okafor', mrn: 'MRN-229045' },
    claim: { claimId: 'CLM-7710034', har: 'HAR-882341' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 11300.00,
    deadline: d(10), createdAt: d(-6), dos: '2026-03-26',
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: 'Reviewing clinical documentation. Interqual criteria borderline — consulting with UM.',
  },
  {
    id: 'SB-0005',
    patient: { name: 'Linda Schwartz', mrn: 'MRN-664510' },
    claim: { claimId: 'CLM-5503891', har: 'HAR-334782' },
    payer: 'Cigna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Level of Care Not Supported',
    carc: 'CARC-4', rarc: 'N-115',
    deniedAmount: 7650.00,
    deadline: d(11), createdAt: d(-4), dos: '2026-03-30',
    state: 'Active', status: 'Awaiting Payer Portal',
    assignedTo: JORDY,
    notes: 'Portal login credentials expired. IT ticket submitted 4/6 — unresolved.',
  },
  {
    id: 'SB-0006',
    patient: { name: 'Thomas Reyes', mrn: 'MRN-118823' },
    claim: { claimId: 'CLM-9904512', har: 'HAR-771209' },
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 22100.00,
    deadline: d(12), createdAt: d(-7), dos: '2026-03-25',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: JORDY,
    notes: 'Highest-value claim in queue. Peer-to-peer scheduled for 4/10 with Dr. Patel.',
  },
  {
    id: 'SB-0007',
    patient: { name: 'Beverly Park', mrn: 'MRN-990023' },
    claim: { claimId: 'CLM-2201348', har: 'HAR-009823' },
    payer: 'Medicare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 5400.00,
    deadline: d(13), createdAt: d(-8), dos: '2026-03-24',
    state: 'Active', status: 'In Progress',
    assignedTo: null,
    notes: 'Unassigned — originally routed to Devon Ross who is out this week.',
  },
  // ── MEDIUM (deadline 8–20 days) ────────────────────────────────────────────
  {
    id: 'SB-0008',
    patient: { name: 'Carlos Mendez', mrn: 'MRN-445671' },
    claim: { claimId: 'CLM-6607823', har: 'HAR-223018' },
    payer: 'Medicaid',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 3200.00,
    deadline: d(16), createdAt: d(-10), dos: '2026-03-22',
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: '',
  },
  {
    id: 'SB-0009',
    patient: { name: 'Patricia Holt', mrn: 'MRN-337821' },
    claim: { claimId: 'CLM-1103245', har: 'HAR-558904' },
    payer: 'Humana',
    denialType: 'Medical Necessity',
    denialSubtype: 'Concurrent Review — Continued Stay Denied',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8900.00,
    deadline: d(18), createdAt: d(-9), dos: '2026-03-23',
    state: 'Active', status: 'Records Ready — Review Needed',
    assignedTo: JORDY,
    notes: 'Complete records received. Ready for clinical review and appeal drafting.',
  },
  {
    id: 'SB-0010',
    patient: { name: 'Edward Chu', mrn: 'MRN-882310' },
    claim: { claimId: 'CLM-4408921', har: 'HAR-660012' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 6100.00,
    deadline: d(20), createdAt: d(-11), dos: '2026-03-21',
    state: 'Active', status: 'Awaiting Records',
    assignedTo: JORDY,
    notes: 'Second records request sent 4/5. HIM response pending.',
  },
  {
    id: 'SB-0011',
    patient: { name: 'Frances Larkin', mrn: 'MRN-556712' },
    claim: { claimId: 'CLM-7709123', har: 'HAR-334109' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Medical Necessity',
    denialSubtype: 'Level of Care Not Supported',
    carc: 'CARC-4', rarc: 'N-115',
    deniedAmount: 15600.00,
    deadline: d(21), createdAt: d(-12), dos: '2026-03-20',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: JORDY,
    notes: 'Drafting Level 1. Strong clinical argument — patient had active sepsis on day 4.',
  },
  {
    id: 'SB-0012',
    patient: { name: 'Harold Kim', mrn: 'MRN-223490' },
    claim: { claimId: 'CLM-8801234', har: 'HAR-991023' },
    payer: 'Cigna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 4300.00,
    deadline: d(24), createdAt: d(-13), dos: '2026-03-19',
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: '',
  },
  // ── LOW (deadline 21+ days) ────────────────────────────────────────────────
  {
    id: 'SB-0013',
    patient: { name: 'Dorothy Walsh', mrn: 'MRN-771098' },
    claim: { claimId: 'CLM-3309871', har: 'HAR-445612' },
    payer: 'Medicare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Experimental — Investigational Treatment',
    carc: 'CARC-50', rarc: 'N-115',
    deniedAmount: 2800.00,
    deadline: d(31), createdAt: d(-15), dos: '2026-03-17',
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: 'Literature review in progress to support medical necessity of off-label use.',
  },
  {
    id: 'SB-0014',
    patient: { name: 'Samuel Price', mrn: 'MRN-119023' },
    claim: { claimId: 'CLM-6601234', har: 'HAR-882009' },
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 19200.00,
    deadline: d(36), createdAt: d(-16), dos: '2026-03-16',
    state: 'Active', status: 'Appeal Drafting',
    assignedTo: JORDY,
    notes: 'Level 1 appeal in progress. Complex case — multi-comorbidity patient.',
  },
  {
    id: 'SB-0015',
    patient: { name: 'Gloria Nguyen', mrn: 'MRN-334781' },
    claim: { claimId: 'CLM-2200987', har: 'HAR-116034' },
    payer: 'Humana',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 7100.00,
    deadline: d(51), createdAt: d(-20), dos: '2026-03-12',
    state: 'Active', status: 'In Progress',
    assignedTo: JORDY,
    notes: '',
  },
  // ── Submitted ─────────────────────────────────────────────────────────────
  {
    id: 'SB-0016',
    patient: { name: 'Andre Dubois', mrn: 'MRN-667823' },
    claim: { claimId: 'CLM-5503012', har: 'HAR-228901' },
    payer: 'Aetna',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 12400.00,
    deadline: d(14), createdAt: d(-22), dos: '2026-03-10',
    state: 'Submitted', status: 'Response Overdue',
    assignedTo: JORDY,
    notes: 'Appeal submitted 3/12. Payer response window closed 4/2 — follow up call placed, no response.',
  },
  {
    id: 'SB-0017',
    patient: { name: 'Christine Bell', mrn: 'MRN-441902' },
    claim: { claimId: 'CLM-9908712', har: 'HAR-667023' },
    payer: 'Blue Cross Blue Shield',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8750.00,
    deadline: d(22), createdAt: d(-25), dos: '2026-03-07',
    state: 'Submitted', status: 'Awaiting Payer Decision',
    assignedTo: JORDY,
    notes: 'Appeal submitted 3/15. Expected BCBS turnaround is 30 days — response due 4/14.',
  },
  {
    id: 'SB-0018',
    patient: { name: 'Nathan Ford', mrn: 'MRN-229834' },
    claim: { claimId: 'CLM-1104523', har: 'HAR-554019' },
    payer: 'UnitedHealthcare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 16300.00,
    deadline: d(15), createdAt: d(-18), dos: '2026-03-15',
    state: 'Submitted', status: 'Submission Failed',
    assignedTo: JORDY,
    notes: 'Portal submission rejected 4/7 — invalid NPI on file. Needs immediate resubmission.',
  },
]
