import type { CaseReference } from './audits'

export type DenialState = 'Queue' | 'InProgress' | 'Submitted' | 'Overturned' | 'Closed' | 'Archive'

// ── Per-state status types ────────────────────────────────────────────────────

// Queue: freshly ingested, not yet picked up; or upheld cases routed back
export type QueueStatus = 'New' | 'Returned — Upheld'

// InProgress: describes what work is currently happening or what's blocking progress
export type InProgressStatus =
  | 'In Progress'
  | 'Appeal Drafting'
  | 'Awaiting Records'
  | 'Records Ready — Review Needed'
  | 'Awaiting Payer Portal'
  | 'Eligibility Investigation'
  | 'Corrected Claim Submitted'

// Submitted: describes why it hasn't resolved yet
export type SubmittedStatus = 'Awaiting Payer Decision' | 'Submission Failed' | 'Response Overdue'

// Overturned: positive decision received
// paymentStatus field distinguishes Pending (awaiting 835) vs Received (cash posted)
export type OverturnedStatus =
  | 'Overturned — Full Payment'
  | 'Overturned — Partial Payment'
  | 'Partial Settlement'
  | 'Corrected Claim Paid'
  | 'Secondary Payer Paid'

export type ClosedStatus = 'Upheld by Payer' | 'Will Not Appeal' | 'Dismissed' | 'Escalated to DRG Dispute' | 'Closed'

export type ArchiveStatus = 'Archived'

export type DenialStatus = QueueStatus | InProgressStatus | SubmittedStatus | OverturnedStatus | ClosedStatus | ArchiveStatus

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
  { id: 'ks', name: 'Krista Soriano', initials: 'KS' },
]

export const JORDY = { id: 'jt', name: 'Jordy Tang', initials: 'JT' } as const
export const KRISTA = { id: 'ks', name: 'Krista Soriano', initials: 'KS' } as const

export type LineOfBusiness = 'Commercial' | 'Medicare' | 'Medicaid' | 'Medicare Advantage'
export type AppealLevel = 'L1' | 'L2' | 'L3'
export type PacketStatus = 'Assembling' | 'Ready for Review'
export type PaymentStatus = 'Pending' | 'Received'

export interface DenialRecord {
  caseType?: 'denial'
  id: string
  patient: { name: string; mrn: string }
  claim: { claimId: string; har: string }
  payer: string
  lineOfBusiness: LineOfBusiness
  denialType: string
  denialSubtype: string
  carc: string
  rarc?: string
  deniedAmount: number
  paidAmount?: number
  deadline: string       // ISO date string YYYY-MM-DD — appeal filing deadline
  createdAt: string      // ISO date string YYYY-MM-DD — ingestion date
  dos: string            // date of service
  state: DenialState
  status: DenialStatus
  assignedTo: TeamMember | null
  appealLevel: AppealLevel
  priorityScore?: number          // 0–100, higher = higher priority (Queue/InProgress)
  packetStatus?: PacketStatus     // InProgress tab signal
  paymentStatus?: PaymentStatus   // Overturned tab signal
  paymentReceivedDate?: string    // when payment confirmed (Overturned/Received)
  overturnDate?: string           // date payer issued overturn decision
  submissionDate?: string         // date appeal was submitted (Submitted tab)
  responseDueDate?: string        // payer response deadline (Submitted tab)
  closeReason?: string            // reason case was closed
  closedDate?: string             // date case was closed
  archiveReason?: string          // reason case was archived
  archivedBy?: string             // who archived it
  nextAction?: string
  notes: string
  archivedFrom?: { state: DenialState; status: DenialStatus }
  // Instance model fields
  source?: InstanceSource
  denialLetterOnFile?: boolean
  appealRounds?: AppealRound[]
  relatedInstances?: RelatedInstance[]
  relatedCases?: CaseReference[]
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

  // ── In Progress ───────────────────────────────────────────────────────────

  {
    id: 'DN-2026-0412',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847291', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 4210.00,
    deadline: d(4), createdAt: d(-18), dos: '2026-02-14',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 78, packetStatus: 'Assembling',
    assignedTo: KRISTA,
    notes: 'Physician attestation obtained. Drafting level 1 appeal — deadline in 4 days.',
    relatedInstances: [{ denialId: 'DN-2026-0394', relationship: 'adr_preceded' }],
    relatedCases: [{ caseId: 'AU-2026-0394', caseType: 'audit', relationship: 'spawned_from' }],
  },
  {
    id: 'DN-2026-0389',
    patient: { name: 'Raymond Castellano', mrn: 'MRN-091247' },
    claim: { claimId: 'CLM-9920441', har: 'HAR-881033' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 12480.00,
    deadline: d(21), createdAt: d(-15), dos: '2026-02-18',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 82,
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
    lineOfBusiness: 'Medicare',
    denialType: 'Coding Error',
    denialSubtype: 'ICD-10 Principal Dx Sequencing',
    carc: 'CARC-4',
    deniedAmount: 892.50,
    deadline: d(30), createdAt: d(-8), dos: '2026-02-28',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 45, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'CDI flagged sequencing issue on 2/28 admit. Corrected claim ready to resubmit.',
  },
  {
    id: 'DN-2026-0377',
    patient: { name: 'James Okafor', mrn: 'MRN-318740' },
    claim: { claimId: 'CLM-6634882', har: 'HAR-559001' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Authorization',
    denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 6750.00,
    deadline: d(14), createdAt: d(-10), dos: '2026-03-01',
    state: 'Submitted', status: 'Submission Failed',
    appealLevel: 'L1',
    submissionDate: '2026-03-28',
    responseDueDate: d(14),
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
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50',
    deniedAmount: 3210.75,
    deadline: d(35), createdAt: d(-5), dos: '2026-03-10',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 55, packetStatus: 'Assembling',
    assignedTo: KRISTA,
    notes: '',
  },
  {
    id: 'DN-2026-0344',
    patient: { name: 'Louis Tremblay', mrn: 'MRN-509334' },
    claim: { claimId: 'CLM-4408772', har: 'HAR-321099' },
    payer: 'Medicaid',
    lineOfBusiness: 'Medicaid',
    denialType: 'Eligibility',
    denialSubtype: 'Coverage Inactive on DOS',
    carc: 'CARC-31',
    deniedAmount: 1450.00,
    deadline: d(10), createdAt: d(-6), dos: '2026-03-05',
    state: 'InProgress', status: 'Eligibility Investigation',
    appealLevel: 'L1', priorityScore: 62, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Low-confidence match flagged. Verifying coverage — patient may have had dual eligibility on DOS.',
  },
  {
    id: 'DN-2026-0331',
    patient: { name: 'Nancy Whitfield', mrn: 'MRN-612847' },
    claim: { claimId: 'CLM-3317661', har: 'HAR-210445' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Recoupment',
    denialSubtype: 'Overpayment — MS-DRG Audit',
    carc: 'CARC-45',
    deniedAmount: 8920.00,
    deadline: d(6), createdAt: d(-14), dos: '2026-01-30',
    state: 'InProgress', status: 'Awaiting Records',
    appealLevel: 'L1', priorityScore: 71, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'BCBS initiated recoupment on 3/19 audit. Clinical docs pulled — submitting dispute this week.',
  },
  {
    id: 'DN-2026-0318',
    patient: { name: 'Timothy Reyes', mrn: 'MRN-701023' },
    claim: { claimId: 'CLM-2209115', har: 'HAR-108334' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 470 → 483',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 5640.00,
    deadline: d(28), createdAt: d(-4), dos: '2026-03-12',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 65, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: '',
    relatedInstances: [{ denialId: 'DN-2026-0301', relationship: 'adr_preceded' }],
    relatedCases: [{ caseId: 'AU-2026-0301', caseType: 'audit', relationship: 'spawned_from' }],
  },
  {
    id: 'DN-2026-0305',
    patient: { name: 'Helen Nakamura', mrn: 'MRN-834512' },
    claim: { claimId: 'CLM-1198004', har: 'HAR-009771' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Timely Filing',
    denialSubtype: 'Claim Received After 90-Day Limit',
    carc: 'CARC-29',
    deniedAmount: 2130.00,
    deadline: d(2), createdAt: d(-22), dos: '2025-11-18',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 74, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Clearinghouse confirmed 11/18 transmission. Pulling 277 report to attach to appeal.',
  },
  {
    id: 'DN-2026-0292',
    patient: { name: 'Franklin Pierce', mrn: 'MRN-922771' },
    claim: { claimId: 'CLM-0087213', har: 'HAR-899002' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 9820.00,
    deadline: d(45), createdAt: d(-3), dos: '2026-03-20',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 88, packetStatus: 'Ready for Review',
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
    lineOfBusiness: 'Medicare',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 4110.00,
    deadline: d(9), createdAt: d(-12), dos: '2026-02-10',
    state: 'InProgress', status: 'Records Ready — Review Needed',
    appealLevel: 'L1', priorityScore: 66, packetStatus: 'Ready for Review',
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
    lineOfBusiness: 'Commercial',
    denialType: 'Administrative',
    denialSubtype: 'Missing Billing NPI on Claim',
    carc: 'CARC-16',
    deniedAmount: 760.00,
    deadline: d(20), createdAt: d(-2), dos: '2026-03-25',
    state: 'InProgress', status: 'Corrected Claim Submitted',
    appealLevel: 'L1', priorityScore: 39, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Billing NPI missing from original claim. Corrected claim submitted 4/4 with NPI included. Awaiting Cigna reprocessing.',
    relatedInstances: [{ denialId: 'DN-2025-1144', relationship: 'corrected_claim_led_to' }],
  },

  // ── Queue ─────────────────────────────────────────────────────────────────

  {
    id: 'DN-2026-0445',
    patient: { name: 'Patricia Goldstein', mrn: 'MRN-541209' },
    claim: { claimId: 'CLM-3847201', har: 'HAR-312091' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 291 → 292',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 7340.00,
    deadline: d(28), createdAt: d(0), dos: '2026-04-01',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 70,
    assignedTo: null,
    notes: '',
    possibleMatches: [
      { denialId: 'DN-2026-0412', confidence: 'medium' as const, reasons: ['Same payer (Blue Cross Blue Shield)', 'Same denial type — DRG Downgrade, MS-DRG 291 → 292', 'Same diagnosis group'] },
    ],
  },
  {
    id: 'DN-2026-0463',
    patient: { name: 'Rosa Espinoza', mrn: 'MRN-728441' },
    claim: { claimId: 'CLM-5290017', har: 'HAR-471003' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Authorization',
    denialSubtype: 'Concurrent Review Not Obtained',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 11200.00,
    deadline: d(18), createdAt: d(0), dos: '2026-03-28',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 76,
    assignedTo: null,
    notes: '',
  },
  {
    id: 'DN-2026-0471',
    patient: { name: 'Chen Wei', mrn: 'MRN-833097' },
    claim: { claimId: 'CLM-6445882', har: 'HAR-558201' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Coding Error',
    denialSubtype: 'Procedure Code Bundling Error',
    carc: 'CARC-97',
    deniedAmount: 2890.00,
    deadline: d(40), createdAt: d(-1), dos: '2026-03-30',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 50,
    assignedTo: null,
    notes: '',
  },
  {
    id: 'DN-2026-0480',
    patient: { name: 'Ethan Graves', mrn: 'MRN-555201' },
    claim: { claimId: 'CLM-7722019', har: 'HAR-590018' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 9150.00,
    deadline: d(14), createdAt: d(0), dos: '2026-02-20',
    state: 'Queue', status: 'Returned — Upheld',
    appealLevel: 'L2', priorityScore: 85,
    assignedTo: null,
    notes: 'L1 appeal upheld by Humana on 3/31. Returned to queue for Level 2 external review. Filing deadline in 14 days.',
    relatedInstances: [{ denialId: 'DN-2026-0431', relationship: 'escalated_from' }],
    incomingEpisodeResult: {
      label: 'L1 Appeal Upheld',
      date: d(-2),
      source: 'Humana Portal',
      description: 'Humana upheld the initial denial — medical necessity criteria not met per payer clinical policy. Level 2 external review available.',
    },
  },
  {
    id: 'DN-2026-0538',
    patient: { name: 'Beverly Santos', mrn: 'MRN-204417' },
    claim: { claimId: 'CLM-6634019', har: 'HAR-558802' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Underpayment',
    denialSubtype: 'Rate Schedule Mismatch',
    carc: 'CARC-45',
    deniedAmount: 2305.00,
    deadline: d(18), createdAt: d(-7), dos: '2026-03-01',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 61,
    assignedTo: null,
    nextAction: 'Verify contracted rate and draft payment dispute letter',
    notes: 'Aetna paid at outpatient DRG rate for inpatient joint replacement. Contracted inpatient case rate should apply.',
  },

  // ── In Progress (additional) ───────────────────────────────────────────────

  {
    id: 'DN-2026-0521',
    patient: { name: 'Harold Simmons', mrn: 'MRN-109432' },
    claim: { claimId: 'CLM-9921847', har: 'HAR-773290' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Underpayment',
    denialSubtype: 'Contracted Rate Dispute',
    carc: 'CARC-45',
    deniedAmount: 4820.00,
    deadline: d(26), createdAt: d(-12), dos: '2026-02-18',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 73, packetStatus: 'Assembling',
    assignedTo: TEAM_MEMBERS[1]!,
    nextAction: 'File payment dispute with contractual rate documentation',
    notes: 'UHC applied commercial fee schedule instead of negotiated case rate. Contract §4.2 specifies $13,250 for CABG.',
  },

  // ── Overturned: payment pending (awaiting 835) ────────────────────────────

  {
    id: 'DN-2026-0388',
    patient: { name: 'Victor Osei', mrn: 'MRN-209341' },
    claim: { claimId: 'CLM-4412881', har: 'HAR-330712' },
    payer: 'Cigna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Level of Care — CHF Exacerbation',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 11240.00,
    deadline: d(12), createdAt: d(-42), dos: '2026-02-08',
    state: 'Overturned', status: 'Overturned — Full Payment',
    appealLevel: 'L1',
    paymentStatus: 'Pending',
    overturnDate: d(-3),
    assignedTo: KRISTA,
    notes: 'L1 appeal submitted with clinical documentation. Cigna issued overturn letter 4/05 — full $11,240 approved. Awaiting 835 remit to confirm payment posted.',
    appealRounds: [
      { id: 'r-0388-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: d(-14), submissionMethod: 'portal', decision: 'overturned', decisionDate: d(-3) },
    ],
  },
  {
    id: 'DN-2026-0341',
    patient: { name: 'Sandra Pruitt', mrn: 'MRN-771204' },
    claim: { claimId: 'CLM-7709002', har: 'HAR-558341' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 470 → 483',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 5830.00,
    deadline: d(8), createdAt: d(-30), dos: '2026-02-22',
    state: 'Overturned', status: 'Overturned — Partial Payment',
    appealLevel: 'L2',
    paymentStatus: 'Pending',
    overturnDate: d(-1),
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'UHC peer-to-peer resulted in partial overturn — MS-DRG 483 restored to MS-DRG 470 for 3 of 5 days. Estimated recovery ~$3,500. Awaiting 835 to confirm exact amount.',
    appealRounds: [
      { id: 'r-0341-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: d(-18), submissionMethod: 'portal', decision: 'upheld', decisionDate: d(-10) },
      { id: 'r-0341-2', roundNumber: 2, roundType: 'L2_external', submittedAt: d(-8), submissionMethod: 'mail', decision: 'partial', decisionDate: d(-1) },
    ],
  },
  {
    id: 'DN-2026-0295',
    patient: { name: 'Marcus Webb', mrn: 'MRN-448812' },
    claim: { claimId: 'CLM-3301447', har: 'HAR-219004' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Administrative',
    denialSubtype: 'Missing Billing NPI on Claim',
    carc: 'CARC-16',
    deniedAmount: 2190.00,
    deadline: d(20), createdAt: d(-25), dos: '2026-03-05',
    state: 'Overturned', status: 'Corrected Claim Paid',
    appealLevel: 'L1',
    paymentStatus: 'Pending',
    overturnDate: d(-2),
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Corrected claim submitted 3/28 with billing NPI added. Aetna confirmed claim accepted for processing 4/06. Awaiting 835 remit.',
  },

  // ── Overturned: payment received (cash posted) ────────────────────────────

  {
    id: 'DN-2025-0847',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8819001', har: 'HAR-772001' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Medically Necessary',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8940.00,
    paidAmount: 8940.00,
    deadline: '2025-10-20', createdAt: '2025-07-28', dos: '2025-07-20',
    state: 'Overturned', status: 'Overturned — Full Payment',
    appealLevel: 'L3',
    paymentStatus: 'Received',
    overturnDate: '2025-10-18',
    paymentReceivedDate: '2025-10-24',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 upheld, L2 upheld, external independent review overturned denial. Full $8,940 payment received 2025-10-18.',
    appealRounds: [
      { id: 'r-0847-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-08-20', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-09-08' },
      { id: 'r-0847-2', roundNumber: 2, roundType: 'L2_external', submittedAt: '2025-09-22', submissionMethod: 'mail', decision: 'upheld', decisionDate: '2025-10-03' },
      { id: 'r-0847-3', roundNumber: 3, roundType: 'IRO', submittedAt: '2025-10-06', submissionMethod: 'mail', decision: 'overturned', decisionDate: '2025-10-18', recoveryAmount: 8940 },
    ],
  },
  {
    id: 'DN-2025-0933',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9862004', har: 'HAR-787003' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    denialType: 'DRG Downgrade',
    denialSubtype: 'MS-DRG 194 → 195',
    carc: 'CARC-4', rarc: 'N115',
    deniedAmount: 3840.00,
    paidAmount: 3840.00,
    deadline: '2025-11-01', createdAt: '2025-08-20', dos: '2025-06-15',
    state: 'Overturned', status: 'Overturned — Full Payment',
    appealLevel: 'L2',
    paymentStatus: 'Received',
    overturnDate: '2025-10-25',
    paymentReceivedDate: '2025-11-03',
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
    lineOfBusiness: 'Commercial',
    denialType: 'Authorization',
    denialSubtype: 'No Prior Authorization on File',
    carc: 'CARC-15', rarc: 'N130',
    deniedAmount: 9450.00,
    paidAmount: 9450.00,
    deadline: '2026-01-15', createdAt: '2025-10-22', dos: '2025-10-15',
    state: 'Overturned', status: 'Overturned — Full Payment',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2025-12-01',
    paymentReceivedDate: '2025-12-10',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'Retro-auth request denied. L1 appeal + peer-to-peer with Cigna MD resulted in overturn. Full $9,450 recovered.',
    appealRounds: [
      { id: 'r-1089-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-11-10', submissionMethod: 'portal', decision: 'overturned', decisionDate: '2025-12-01', recoveryAmount: 9450, notes: 'Peer-to-peer with Cigna MD conducted 11/28 — contributed to overturn.' },
    ],
  },
  {
    id: 'DN-2025-0788',
    patient: { name: 'Nancy Whitfield', mrn: 'MRN-612847' },
    claim: { claimId: 'CLM-3302007', har: 'HAR-209007' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    denialType: 'Recoupment',
    denialSubtype: 'Overpayment — Post-Payment Audit',
    carc: 'CARC-45',
    deniedAmount: 12400.00,
    paidAmount: 6200.00,
    deadline: '2025-10-10', createdAt: '2025-08-18', dos: '2025-08-10',
    state: 'Overturned', status: 'Partial Settlement',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2025-10-20',
    paymentReceivedDate: '2025-11-14',
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
    lineOfBusiness: 'Commercial',
    denialType: 'Timely Filing',
    denialSubtype: 'Claim Received After 180-Day Limit',
    carc: 'CARC-29',
    deniedAmount: 3100.00,
    paidAmount: 3100.00,
    deadline: '2025-09-10', createdAt: '2025-07-15', dos: '2025-05-10',
    state: 'Overturned', status: 'Overturned — Full Payment',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2025-08-22',
    paymentReceivedDate: '2025-09-05',
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
    lineOfBusiness: 'Commercial',
    denialType: 'Administrative',
    denialSubtype: 'Missing Billing NPI on Claim',
    carc: 'CARC-16',
    deniedAmount: 635.00,
    paidAmount: 635.00,
    deadline: '2026-01-15', createdAt: '2025-10-22', dos: '2025-10-18',
    state: 'Overturned', status: 'Corrected Claim Paid',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2025-11-19',
    paymentReceivedDate: '2025-11-24',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Same issue as current denial — billing NPI missing on original claim. Corrected claim submitted 11/04, Cigna processed and paid $635 on 11/19.',
    relatedInstances: [{ denialId: 'DN-2026-0261', relationship: 'corrected_claim_of' }],
  },
  {
    id: 'DN-2026-0044',
    patient: { name: 'Dorothy Kim', mrn: 'MRN-203881' },
    claim: { claimId: 'CLM-7700009', har: 'HAR-661009' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Coding Error',
    denialSubtype: 'ICD-10 Principal Dx Sequencing',
    carc: 'CARC-4',
    deniedAmount: 1240.00,
    paidAmount: 1240.00,
    deadline: '2026-02-20', createdAt: '2025-12-01', dos: '2025-09-20',
    state: 'Overturned', status: 'Corrected Claim Paid',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2026-01-08',
    paymentReceivedDate: '2026-01-15',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'ICD-10 sequencing corrected per CDI review. BCBS processed corrected claim — $1,240 paid 2026-01-08.',
  },
  {
    id: 'DN-2026-0077',
    patient: { name: 'Louis Tremblay', mrn: 'MRN-509334' },
    claim: { claimId: 'CLM-4396010', har: 'HAR-319010' },
    payer: 'Medicaid',
    lineOfBusiness: 'Medicaid',
    denialType: 'Eligibility',
    denialSubtype: 'Coverage Inactive on DOS',
    carc: 'CARC-31',
    deniedAmount: 2340.00,
    paidAmount: 2340.00,
    deadline: '2026-03-10', createdAt: '2026-01-08', dos: '2025-12-10',
    state: 'Overturned', status: 'Secondary Payer Paid',
    appealLevel: 'L1',
    paymentStatus: 'Received',
    overturnDate: '2026-02-28',
    paymentReceivedDate: '2026-03-04',
    assignedTo: TEAM_MEMBERS[3]!,
    notes: 'Medicaid coverage confirmed inactive on DOS. Medicare identified as primary — billed and paid in full. $2,340 recovered.',
  },

  // ── Closed ────────────────────────────────────────────────────────────────

  {
    id: 'DN-2026-0431',
    patient: { name: 'Ethan Graves', mrn: 'MRN-555201' },
    claim: { claimId: 'CLM-7722018', har: 'HAR-590018' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 9150.00,
    deadline: d(-2), createdAt: d(-32), dos: '2026-02-20',
    state: 'Closed', status: 'Upheld by Payer',
    appealLevel: 'L1',
    closeReason: 'L1 Upheld — Escalated to L2',
    closedDate: d(-2),
    assignedTo: KRISTA,
    notes: 'L1 appeal submitted 3/15. Humana upheld denial on 3/31 — medical necessity criteria not met per payer clinical policy. Escalated to Level 2 external review as DN-2026-0480.',
    appealRounds: [
      { id: 'r-0431-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2026-03-15', submissionMethod: 'portal', decision: 'upheld', decisionDate: d(-2) },
    ],
    relatedInstances: [{ denialId: 'DN-2026-0480', relationship: 'escalated_from' }],
  },
  {
    id: 'DN-2026-0394',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847100', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 4210.00,
    deadline: '2026-03-28', createdAt: '2026-02-28', dos: '2026-02-14',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    appealLevel: 'L1',
    closeReason: 'Other',
    closedDate: '2026-03-28',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'BCBS requested documentation for 2/14 inpatient admit. Records submitted 3/12. BCBS completed review and issued DRG downgrade — escalated to DN-2026-0412.',
    relatedInstances: [{ denialId: 'DN-2026-0412', relationship: 'adr_followed' }],
  },
  {
    id: 'DN-2026-0301',
    patient: { name: 'Timothy Reyes', mrn: 'MRN-701023' },
    claim: { claimId: 'CLM-2209001', har: 'HAR-108334' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 5640.00,
    deadline: '2026-04-01', createdAt: '2026-03-20', dos: '2026-03-12',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    appealLevel: 'L1',
    closeReason: 'Other',
    closedDate: '2026-04-01',
    assignedTo: TEAM_MEMBERS[2]!,
    notes: 'Aetna requested records for 3/12 surgical admit. Records submitted 3/26. Aetna completed utilization review and issued DRG downgrade — escalated to DN-2026-0318.',
    relatedInstances: [{ denialId: 'DN-2026-0318', relationship: 'adr_followed' }],
  },
  {
    id: 'DN-2025-1201',
    patient: { name: 'Raymond Castellano', mrn: 'MRN-091247' },
    claim: { claimId: 'CLM-9901002', har: 'HAR-880002' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 6200.00,
    deadline: '2026-01-05', createdAt: '2025-09-12', dos: '2025-09-05',
    state: 'Closed', status: 'Will Not Appeal',
    appealLevel: 'L2',
    closeReason: 'Low ROI',
    closedDate: '2025-12-15',
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
    lineOfBusiness: 'Medicare',
    denialType: 'ADR',
    denialSubtype: 'Additional Documentation Request',
    carc: 'CARC-18',
    deniedAmount: 3840.00,
    deadline: '2025-08-15', createdAt: '2025-07-01', dos: '2025-06-15',
    state: 'Closed', status: 'Escalated to DRG Dispute',
    appealLevel: 'L1',
    closeReason: 'Other',
    closedDate: '2025-08-20',
    assignedTo: TEAM_MEMBERS[1]!,
    notes: 'Records submitted to Medicare in response to ADR. Post-review Medicare issued DRG downgrade — escalated to DN-2025-0933.',
    relatedInstances: [{ denialId: 'DN-2025-0933', relationship: 'adr_followed' }],
  },
  {
    id: 'DN-2025-1156',
    patient: { name: 'Carolyn Brandt', mrn: 'MRN-447129' },
    claim: { claimId: 'CLM-5504006', har: 'HAR-429006' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Authorization',
    denialSubtype: 'Service Not Authorized',
    carc: 'CARC-15',
    deniedAmount: 2100.00,
    deadline: '2026-02-01', createdAt: '2025-11-08', dos: '2025-11-01',
    state: 'Closed', status: 'Will Not Appeal',
    appealLevel: 'L1',
    closeReason: 'Low ROI',
    closedDate: '2026-01-05',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 appeal upheld. Authorization gap confirmed — no retroactive pathway available. Closed per policy.',
    appealRounds: [
      { id: 'r-1156-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2025-12-01', submissionMethod: 'portal', decision: 'upheld', decisionDate: '2025-12-22' },
    ],
  },
  {
    id: 'DN-2026-0103',
    patient: { name: 'Franklin Pierce', mrn: 'MRN-922771' },
    claim: { claimId: 'CLM-0075011', har: 'HAR-897011' },
    payer: 'Cigna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50',
    deniedAmount: 4100.00,
    deadline: '2026-03-28', createdAt: '2026-01-15', dos: '2025-12-28',
    state: 'Closed', status: 'Will Not Appeal',
    appealLevel: 'L1',
    closeReason: 'Low ROI',
    closedDate: '2026-03-01',
    assignedTo: TEAM_MEMBERS[0]!,
    notes: 'L1 appeal upheld. Cigna criteria for extended LOS not supported by documentation. Closed per finance — recovery below external review threshold.',
    appealRounds: [
      { id: 'r-0103-1', roundNumber: 1, roundType: 'L1_internal', submittedAt: '2026-02-03', submissionMethod: 'portal', decision: 'upheld', decisionDate: '2026-02-24' },
    ],
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
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Concurrent Review — Continued Stay Denied',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 18400.00,
    deadline: d(7), createdAt: d(-1), dos: '2026-04-04',
    state: 'InProgress', status: 'Awaiting Records',
    appealLevel: 'L1', priorityScore: 95, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Records requested from HIM on 4/7 — not yet received. Deadline tomorrow.',
  },
  {
    id: 'SB-0002',
    patient: { name: 'James Whitfield', mrn: 'MRN-334490' },
    claim: { claimId: 'CLM-8802341', har: 'HAR-556123' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 9200.00,
    deadline: d(8), createdAt: d(-3), dos: '2026-04-01',
    state: 'InProgress', status: 'Records Ready — Review Needed',
    appealLevel: 'L1', priorityScore: 87, packetStatus: 'Ready for Review',
    assignedTo: JORDY,
    notes: 'Records received. Physician attestation pending — needs clinical review before appeal can be drafted.',
  },
  {
    id: 'SB-0003',
    patient: { name: 'Diane Torres', mrn: 'MRN-771234' },
    claim: { claimId: 'CLM-3301892', har: 'HAR-449017' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 14800.00,
    deadline: d(9), createdAt: d(-5), dos: '2026-03-28',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 91, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'MCG criteria reviewed. Drafting Level 1 appeal — attending attestation obtained.',
  },
  // ── HIGH (deadline 4–7 days) ───────────────────────────────────────────────
  {
    id: 'SB-0004',
    patient: { name: 'Martin Okafor', mrn: 'MRN-229045' },
    claim: { claimId: 'CLM-7710034', har: 'HAR-882341' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 11300.00,
    deadline: d(10), createdAt: d(-6), dos: '2026-03-26',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 83, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Reviewing clinical documentation. Interqual criteria borderline — consulting with UM.',
  },
  {
    id: 'SB-0005',
    patient: { name: 'Linda Schwartz', mrn: 'MRN-664510' },
    claim: { claimId: 'CLM-5503891', har: 'HAR-334782' },
    payer: 'Cigna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Level of Care Not Supported',
    carc: 'CARC-4', rarc: 'N-115',
    deniedAmount: 7650.00,
    deadline: d(11), createdAt: d(-4), dos: '2026-03-30',
    state: 'InProgress', status: 'Awaiting Payer Portal',
    appealLevel: 'L1', priorityScore: 79, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Portal login credentials expired. IT ticket submitted 4/6 — unresolved.',
  },
  {
    id: 'SB-0006',
    patient: { name: 'Thomas Reyes', mrn: 'MRN-118823' },
    claim: { claimId: 'CLM-9904512', har: 'HAR-771209' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 22100.00,
    deadline: d(12), createdAt: d(-7), dos: '2026-03-25',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 98, packetStatus: 'Ready for Review',
    assignedTo: JORDY,
    notes: 'Highest-value claim in queue. Peer-to-peer scheduled for 4/10 with Dr. Patel.',
  },
  {
    id: 'SB-0007',
    patient: { name: 'Beverly Park', mrn: 'MRN-990023' },
    claim: { claimId: 'CLM-2201348', har: 'HAR-009823' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 5400.00,
    deadline: d(13), createdAt: d(-8), dos: '2026-03-24',
    state: 'Queue', status: 'New',
    appealLevel: 'L1', priorityScore: 72,
    assignedTo: null,
    notes: 'Unassigned — originally routed to Devon Ross who is out this week.',
  },
  // ── MEDIUM (deadline 8–20 days) ────────────────────────────────────────────
  {
    id: 'SB-0008',
    patient: { name: 'Carlos Mendez', mrn: 'MRN-445671' },
    claim: { claimId: 'CLM-6607823', har: 'HAR-223018' },
    payer: 'Medicaid',
    lineOfBusiness: 'Medicaid',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 3200.00,
    deadline: d(16), createdAt: d(-10), dos: '2026-03-22',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 60, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: '',
  },
  {
    id: 'SB-0009',
    patient: { name: 'Patricia Holt', mrn: 'MRN-337821' },
    claim: { claimId: 'CLM-1103245', har: 'HAR-558904' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Concurrent Review — Continued Stay Denied',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8900.00,
    deadline: d(18), createdAt: d(-9), dos: '2026-03-23',
    state: 'InProgress', status: 'Records Ready — Review Needed',
    appealLevel: 'L1', priorityScore: 75, packetStatus: 'Ready for Review',
    assignedTo: JORDY,
    notes: 'Complete records received. Ready for clinical review and appeal drafting.',
  },
  {
    id: 'SB-0010',
    patient: { name: 'Edward Chu', mrn: 'MRN-882310' },
    claim: { claimId: 'CLM-4408921', har: 'HAR-660012' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 6100.00,
    deadline: d(20), createdAt: d(-11), dos: '2026-03-21',
    state: 'InProgress', status: 'Awaiting Records',
    appealLevel: 'L1', priorityScore: 68, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Second records request sent 4/5. HIM response pending.',
  },
  {
    id: 'SB-0011',
    patient: { name: 'Frances Larkin', mrn: 'MRN-556712' },
    claim: { claimId: 'CLM-7709123', har: 'HAR-334109' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Level of Care Not Supported',
    carc: 'CARC-4', rarc: 'N-115',
    deniedAmount: 15600.00,
    deadline: d(21), createdAt: d(-12), dos: '2026-03-20',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 89, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Drafting Level 1. Strong clinical argument — patient had active sepsis on day 4.',
  },
  {
    id: 'SB-0012',
    patient: { name: 'Harold Kim', mrn: 'MRN-223490' },
    claim: { claimId: 'CLM-8801234', har: 'HAR-991023' },
    payer: 'Cigna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 4300.00,
    deadline: d(24), createdAt: d(-13), dos: '2026-03-19',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 57, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: '',
  },
  // ── LOW (deadline 21+ days) ────────────────────────────────────────────────
  {
    id: 'SB-0013',
    patient: { name: 'Dorothy Walsh', mrn: 'MRN-771098' },
    claim: { claimId: 'CLM-3309871', har: 'HAR-445612' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    denialType: 'Medical Necessity',
    denialSubtype: 'Experimental — Investigational Treatment',
    carc: 'CARC-50', rarc: 'N-115',
    deniedAmount: 2800.00,
    deadline: d(31), createdAt: d(-15), dos: '2026-03-17',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 42, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Literature review in progress to support medical necessity of off-label use.',
  },
  {
    id: 'SB-0014',
    patient: { name: 'Samuel Price', mrn: 'MRN-119023' },
    claim: { claimId: 'CLM-6601234', har: 'HAR-882009' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 19200.00,
    deadline: d(36), createdAt: d(-16), dos: '2026-03-16',
    state: 'InProgress', status: 'Appeal Drafting',
    appealLevel: 'L1', priorityScore: 85, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: 'Level 1 appeal in progress. Complex case — multi-comorbidity patient.',
  },
  {
    id: 'SB-0015',
    patient: { name: 'Gloria Nguyen', mrn: 'MRN-334781' },
    claim: { claimId: 'CLM-2200987', har: 'HAR-116034' },
    payer: 'Humana',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 7100.00,
    deadline: d(51), createdAt: d(-20), dos: '2026-03-12',
    state: 'InProgress', status: 'In Progress',
    appealLevel: 'L1', priorityScore: 55, packetStatus: 'Assembling',
    assignedTo: JORDY,
    notes: '',
  },
  // ── Submitted ─────────────────────────────────────────────────────────────
  {
    id: 'SB-0016',
    patient: { name: 'Andre Dubois', mrn: 'MRN-667823' },
    claim: { claimId: 'CLM-5503012', har: 'HAR-228901' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Stay Not Justified',
    carc: 'CARC-50', rarc: 'N-130',
    deniedAmount: 12400.00,
    deadline: d(14), createdAt: d(-22), dos: '2026-03-10',
    state: 'Submitted', status: 'Response Overdue',
    appealLevel: 'L1',
    submissionDate: '2026-03-12',
    responseDueDate: '2026-04-02',
    assignedTo: KRISTA,
    notes: 'Appeal submitted 3/12. Payer response window closed 4/2 — follow up call placed, no response.',
  },
  {
    id: 'SB-0017',
    patient: { name: 'Christine Bell', mrn: 'MRN-441902' },
    claim: { claimId: 'CLM-9908712', har: 'HAR-667023' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Length of Stay Exceeds Criteria',
    carc: 'CARC-50', rarc: 'M86',
    deniedAmount: 8750.00,
    deadline: d(22), createdAt: d(-25), dos: '2026-03-07',
    state: 'Submitted', status: 'Awaiting Payer Decision',
    appealLevel: 'L1',
    submissionDate: '2026-03-15',
    responseDueDate: d(22),
    assignedTo: KRISTA,
    notes: 'Appeal submitted 3/15. Expected BCBS turnaround is 30 days — response due 4/14.',
  },
  {
    id: 'SB-0018',
    patient: { name: 'Nathan Ford', mrn: 'MRN-229834' },
    claim: { claimId: 'CLM-1104523', har: 'HAR-554019' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    denialType: 'Medical Necessity',
    denialSubtype: 'Inpatient Criteria Not Met',
    carc: 'CARC-50', rarc: 'N-56',
    deniedAmount: 16300.00,
    deadline: d(15), createdAt: d(-18), dos: '2026-03-15',
    state: 'Submitted', status: 'Submission Failed',
    appealLevel: 'L1',
    submissionDate: '2026-04-07',
    responseDueDate: d(15),
    assignedTo: JORDY,
    notes: 'Portal submission rejected 4/7 — invalid NPI on file. Needs immediate resubmission.',
  },
]
