// ── State / Status types ──────────────────────────────────────────────────────

export type AuditState =
  | 'NoticeReceived'
  | 'RecordsPending'
  | 'UnderReview'
  | 'FindingsIssued'
  | 'Disputed'
  | 'Closed'

export type AuditNoticeReceivedStatus = 'New' | 'Under Initial Review'

export type AuditRecordsPendingStatus =
  | 'Records Requested'
  | 'Records Overdue'
  | 'Records Retrieved — Pending Submission'

export type AuditUnderReviewStatus =
  | 'Awaiting Audit Decision'
  | 'Decision Overdue'

export type AuditFindingsIssuedStatus =
  | 'Findings Received — Review Needed'
  | 'Dispute Decision Required'

export type AuditDisputedStatus =
  | 'Formal Dispute Filed'
  | 'Awaiting Payer Response'
  | 'Response Overdue'

export type AuditClosedStatus =
  | 'Successfully Disputed'
  | 'Settled'
  | 'Accepted Findings'
  | 'Written Off'
  | 'Withdrawn'

export type AuditStatus =
  | AuditNoticeReceivedStatus
  | AuditRecordsPendingStatus
  | AuditUnderReviewStatus
  | AuditFindingsIssuedStatus
  | AuditDisputedStatus
  | AuditClosedStatus

// ── Classification types ──────────────────────────────────────────────────────

export type AuditType = 'RAC' | 'MAC' | 'OIG' | 'Commercial' | 'Internal'

export type AuditSubtype =
  | 'ADR'                 // pre-determination records request
  | 'post_payment_audit'  // retrospective claim review
  | 'recoupment_demand'   // payer demands repayment after audit
  | 'prospective_review'  // pre-payment probe audit

// ── Cross-case relationship model ─────────────────────────────────────────────

export type CaseRelationship =
  | 'spawned_from'       // this case was created as a result of another
  | 'spawned'            // this case spawned another case
  | 'related_claim'      // same patient/encounter, different case
  | 'recoupment_of'      // audit demanding repayment of a paid claim
  | 'corrected_claim_of'
  | 'escalated_from'

export interface CaseReference {
  caseId: string
  caseType: 'denial' | 'underpayment' | 'audit'
  relationship: CaseRelationship
}

// ── Core record type ──────────────────────────────────────────────────────────

export interface AuditRecord {
  caseType: 'audit'
  id: string
  patient: { name: string; mrn: string }
  claim: { claimId: string; har: string }
  payer: string
  lineOfBusiness?: string
  dos: string
  createdAt: string
  deadline: string
  state: AuditState
  status: AuditStatus
  auditType: AuditType
  auditSubtype: AuditSubtype
  auditBody?: string         // e.g., 'Cotiviti', 'Palmetto GBA', 'Performant'
  auditNoticeDate: string
  amountAtRisk: number       // total exposure if audit goes against provider
  proposedRecoupment?: number
  settledAmount?: number
  recoveredAmount?: number   // if provider successfully disputed
  assignedTo: { id: string; name: string; initials: string } | null
  notes: string
  nextAction?: string
  relatedCases?: CaseReference[]
}

// ── Date helper ───────────────────────────────────────────────────────────────

function d(offset: number): string {
  const base = new Date('2026-04-02')
  base.setDate(base.getDate() + offset)
  return base.toISOString().split('T')[0]!
}

// ── Team ──────────────────────────────────────────────────────────────────────

const TEAM = [
  { id: 'sc', name: 'Sarah Chen',   initials: 'SC' },
  { id: 'mw', name: 'Marcus Webb',  initials: 'MW' },
  { id: 'pn', name: 'Priya Nair',   initials: 'PN' },
  { id: 'dr', name: 'Devon Ross',   initials: 'DR' },
  { id: 'jt', name: 'Jordy Tang',   initials: 'JT' },
]

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_AUDITS: AuditRecord[] = [

  // ── NOTICE RECEIVED ───────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0451',
    patient: { name: 'Marcus Webb', mrn: 'MRN-619038' },
    claim: { claimId: 'CLM-4112830', har: 'HAR-388902' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2026-03-22',
    createdAt: d(-1),
    deadline: d(35),
    state: 'NoticeReceived',
    status: 'New',
    auditType: 'RAC',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: d(-1),
    amountAtRisk: 5920.00,
    assignedTo: null,
    notes: 'RAC identified this claim in batch review. Admission order and physician notes on file.',
    nextAction: 'Request medical records; review admission order and physician notes',
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0058',
    patient: { name: 'Robert Okafor', mrn: 'MRN-554801' },
    claim: { claimId: 'CLM-7732009', har: 'HAR-660044' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2026-02-28',
    createdAt: d(-5),
    deadline: d(60),
    state: 'NoticeReceived',
    status: 'New',
    auditType: 'OIG',
    auditSubtype: 'post_payment_audit',
    auditBody: 'OIG Office of Audit Services',
    auditNoticeDate: d(-5),
    amountAtRisk: 156200.00,
    assignedTo: null,
    notes: 'OIG national audit initiative targeting inpatient cardiac procedures. Notice received 3/28. Covers 4 claims across FY2025. Compliance team notified — awaiting assignment.',
    nextAction: 'Assign to senior audit specialist; notify compliance officer',
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0061',
    patient: { name: 'Patricia Nguyen', mrn: 'MRN-219045' },
    claim: { claimId: 'CLM-4401882', har: 'HAR-321900' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    dos: '2026-01-14',
    createdAt: d(-3),
    deadline: d(45),
    state: 'NoticeReceived',
    status: 'Under Initial Review',
    auditType: 'Commercial',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Optum',
    auditNoticeDate: d(-3),
    amountAtRisk: 22400.00,
    assignedTo: TEAM[3]!,
    notes: 'UHC Optum retrospective audit of inpatient surgical case. Notice received 3/30. Devon reviewing initial scope before requesting records.',
    nextAction: 'Complete initial scope review; determine records needed',
  },

  // ── RECORDS PENDING ───────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0031',
    patient: { name: 'Charles Whitfield', mrn: 'MRN-387014' },
    claim: { claimId: 'CLM-5510044', har: 'HAR-492811' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2025-12-19',
    createdAt: '2026-03-01',
    deadline: d(23),
    state: 'RecordsPending',
    status: 'Records Retrieved — Pending Submission',
    auditType: 'RAC',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: '2026-03-01',
    amountAtRisk: 42100.00,
    assignedTo: TEAM[0]!,
    notes: 'Cotiviti RAC audit of MS-DRG 291 (Heart Failure with MCC) for 12/19 inpatient stay. ADR issued 3/10 — records deadline 4/25. Chart retrieved from HIM on 4/5. Awaiting final physician attestation before submission.',
    nextAction: 'Obtain physician attestation; submit complete records package to Cotiviti by 4/25',
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0278',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9876541', har: 'HAR-788229' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2026-02-10',
    createdAt: d(-12),
    deadline: d(9),
    state: 'RecordsPending',
    status: 'Records Retrieved — Pending Submission',
    auditType: 'MAC',
    auditSubtype: 'ADR',
    auditBody: 'Palmetto GBA',
    auditNoticeDate: d(-12),
    amountAtRisk: 4110.00,
    assignedTo: TEAM[1]!,
    notes: 'ADR received 3/21. Records retrieved from HealthSource on 4/5 — ready for review. Deadline in 9 days.',
    nextAction: 'Clinical review of retrieved records; submit to Palmetto GBA before deadline',
    relatedCases: [{ caseId: 'DN-2026-0451', caseType: 'denial', relationship: 'related_claim' }],
  },

  // ── UNDER REVIEW ──────────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0044',
    patient: { name: 'Linda Castellano', mrn: 'MRN-628104' },
    claim: { claimId: 'CLM-3302115', har: 'HAR-441007' },
    payer: 'Humana',
    lineOfBusiness: 'Medicare Advantage',
    dos: '2025-11-08',
    createdAt: '2026-02-15',
    deadline: d(18),
    state: 'UnderReview',
    status: 'Awaiting Audit Decision',
    auditType: 'Commercial',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: '2026-02-15',
    amountAtRisk: 18500.00,
    assignedTo: TEAM[2]!,
    notes: 'Cotiviti audit for Humana MA medical necessity — extended LOS beyond InterQual criteria. Complete clinical record (450 pages) submitted 3/22. Awaiting Cotiviti findings — decision due 4/20.',
    nextAction: 'Monitor for Cotiviti findings; escalate if no response by 4/22',
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0019',
    patient: { name: 'George Tran', mrn: 'MRN-771234' },
    claim: { claimId: 'CLM-6640021', har: 'HAR-554300' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    dos: '2025-10-22',
    createdAt: '2026-01-20',
    deadline: d(12),
    state: 'UnderReview',
    status: 'Decision Overdue',
    auditType: 'Commercial',
    auditSubtype: 'post_payment_audit',
    auditBody: 'BCBS Internal Audit',
    auditNoticeDate: '2026-01-20',
    amountAtRisk: 31400.00,
    assignedTo: TEAM[0]!,
    notes: 'BCBS post-payment audit of orthopedic surgical case. Records submitted 2/14. Decision was due 3/28 — now 5 days overdue. Escalation call scheduled with BCBS.',
    nextAction: 'Escalate to BCBS provider relations; document delay in writing',
  },

  // ── FINDINGS ISSUED ───────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0017',
    patient: { name: 'Maria Santos', mrn: 'MRN-190834' },
    claim: { claimId: 'CLM-8821003', har: 'HAR-703221' },
    payer: 'Humana',
    lineOfBusiness: 'Medicare Advantage',
    dos: '2025-10-05',
    createdAt: '2026-01-10',
    deadline: d(7),
    state: 'FindingsIssued',
    status: 'Dispute Decision Required',
    auditType: 'Commercial',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: '2026-01-10',
    amountAtRisk: 28700.00,
    proposedRecoupment: 28700.00,
    assignedTo: TEAM[2]!,
    notes: 'Cotiviti findings issued 3/29: MS-DRG 470 (Major Joint Replacement without MCC) downgraded to MS-DRG 469 (with MCC) reversed — proposed recoupment of $28,700. Physician believes documentation supports DRG 470. Dispute deadline 4/9.',
    nextAction: 'Manager review required: dispute or accept findings by 4/9',
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0052',
    patient: { name: 'Samuel Adeyemi', mrn: 'MRN-403812' },
    claim: { claimId: 'CLM-2201441', har: 'HAR-187005' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2026-01-07',
    createdAt: d(-20),
    deadline: d(14),
    state: 'FindingsIssued',
    status: 'Findings Received — Review Needed',
    auditType: 'MAC',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Noridian',
    auditNoticeDate: d(-20),
    amountAtRisk: 11800.00,
    proposedRecoupment: 11800.00,
    assignedTo: TEAM[4]!,
    notes: 'Noridian MAC audit of inpatient rehabilitation admission. Findings: admission medical necessity questioned — proposed denial of $11,800. Jordy reviewing clinical documentation. Deadline to dispute 4/16.',
    nextAction: 'Clinical review of IRF admission criteria documentation; recommend dispute/accept',
  },

  // ── DISPUTED ──────────────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0008',
    patient: { name: 'Dorothy Kim', mrn: 'MRN-820041' },
    claim: { claimId: 'CLM-1100887', har: 'HAR-092340' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2025-09-14',
    createdAt: '2025-12-01',
    deadline: d(30),
    state: 'Disputed',
    status: 'Awaiting Payer Response',
    auditType: 'RAC',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: '2025-12-01',
    amountAtRisk: 67300.00,
    proposedRecoupment: 67300.00,
    assignedTo: TEAM[0]!,
    notes: 'Cotiviti RAC audit of complex cardiac surgery. Findings: MS-DRG 216 downgraded to MS-DRG 218. Formal dispute filed 2/28 with physician attestation and supplemental clinical evidence. Awaiting Cotiviti rebuttal decision.',
    nextAction: 'Monitor for Cotiviti dispute decision; prepare for ALJ hearing if needed',
  },
  {
    caseType: 'audit',
    id: 'AU-2025-0091',
    patient: { name: 'Frank Morrison', mrn: 'MRN-115604' },
    claim: { claimId: 'CLM-9900231', har: 'HAR-841055' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    dos: '2025-07-19',
    createdAt: '2025-09-05',
    deadline: d(45),
    state: 'Disputed',
    status: 'Response Overdue',
    auditType: 'Commercial',
    auditSubtype: 'recoupment_demand',
    auditBody: 'Aetna Internal Audit',
    auditNoticeDate: '2025-09-05',
    amountAtRisk: 39500.00,
    proposedRecoupment: 39500.00,
    assignedTo: TEAM[3]!,
    notes: 'Aetna recoupment demand — spinal fusion case, claims coding error alleged. Dispute filed 11/14 with complete coding documentation. Response was due 1/10/2026 — now 82 days overdue. Escalating to Aetna provider relations.',
    nextAction: 'Send escalation letter to Aetna provider relations; document delay',
  },

  // ── CLOSED ────────────────────────────────────────────────────────────────

  {
    caseType: 'audit',
    id: 'AU-2026-0394',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847100', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    dos: '2026-02-14',
    createdAt: '2026-02-28',
    deadline: '2026-03-28',
    state: 'Closed',
    status: 'Accepted Findings',
    auditType: 'Commercial',
    auditSubtype: 'ADR',
    auditBody: 'BCBS Internal Audit',
    auditNoticeDate: '2026-02-28',
    amountAtRisk: 4210.00,
    proposedRecoupment: 4210.00,
    assignedTo: TEAM[0]!,
    notes: 'BCBS ADR for 2/14 inpatient admit. Records submitted 3/12. BCBS completed utilization review — issued DRG downgrade. Escalated to denial case for appeal.',
    relatedCases: [{ caseId: 'DN-2026-0412', caseType: 'denial', relationship: 'spawned' }],
  },
  {
    caseType: 'audit',
    id: 'AU-2026-0301',
    patient: { name: 'Timothy Reyes', mrn: 'MRN-701023' },
    claim: { claimId: 'CLM-2209001', har: 'HAR-108334' },
    payer: 'Aetna',
    lineOfBusiness: 'Commercial',
    dos: '2026-03-12',
    createdAt: '2026-03-20',
    deadline: '2026-04-01',
    state: 'Closed',
    status: 'Accepted Findings',
    auditType: 'Commercial',
    auditSubtype: 'ADR',
    auditBody: 'Aetna Internal Audit',
    auditNoticeDate: '2026-03-20',
    amountAtRisk: 5640.00,
    proposedRecoupment: 5640.00,
    assignedTo: TEAM[2]!,
    notes: 'Aetna ADR for 3/12 surgical admit. Records submitted 3/26. Aetna issued DRG downgrade — escalated to denial case for appeal.',
    relatedCases: [{ caseId: 'DN-2026-0318', caseType: 'denial', relationship: 'spawned' }],
  },
  {
    caseType: 'audit',
    id: 'AU-2025-0932',
    patient: { name: 'Sylvia Moreau', mrn: 'MRN-043881' },
    claim: { claimId: 'CLM-9862003', har: 'HAR-787003' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2025-06-15',
    createdAt: '2025-07-01',
    deadline: '2025-08-15',
    state: 'Closed',
    status: 'Accepted Findings',
    auditType: 'MAC',
    auditSubtype: 'ADR',
    auditBody: 'Palmetto GBA',
    auditNoticeDate: '2025-07-01',
    amountAtRisk: 3840.00,
    proposedRecoupment: 3840.00,
    assignedTo: TEAM[1]!,
    notes: 'Medicare ADR for 6/15 inpatient stay. Records submitted. Medicare post-review issued DRG downgrade — escalated to denial case DN-2025-0933. DRG dispute successfully overturned at L2.',
    relatedCases: [{ caseId: 'DN-2025-0933', caseType: 'denial', relationship: 'spawned' }],
  },
  {
    caseType: 'audit',
    id: 'AU-2025-0009',
    patient: { name: 'Eleanor Vasquez', mrn: 'MRN-663002' },
    claim: { claimId: 'CLM-4418770', har: 'HAR-330049' },
    payer: 'Medicare',
    lineOfBusiness: 'Medicare',
    dos: '2025-04-22',
    createdAt: '2025-06-10',
    deadline: '2025-10-31',
    state: 'Closed',
    status: 'Successfully Disputed',
    auditType: 'RAC',
    auditSubtype: 'post_payment_audit',
    auditBody: 'Cotiviti',
    auditNoticeDate: '2025-06-10',
    amountAtRisk: 31200.00,
    proposedRecoupment: 31200.00,
    recoveredAmount: 31200.00,
    assignedTo: TEAM[2]!,
    notes: 'Cotiviti RAC audit of inpatient spinal surgery — proposed DRG downgrade. Formal dispute filed 8/15 with supplemental physician attestation and clinical evidence. Cotiviti issued rebuttal decision 10/22 — original DRG upheld. Full $31,200 retained.',
  },
  {
    caseType: 'audit',
    id: 'AU-2025-0047',
    patient: { name: 'Bernard Walsh', mrn: 'MRN-409851' },
    claim: { claimId: 'CLM-7701123', har: 'HAR-619004' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'Commercial',
    dos: '2025-03-08',
    createdAt: '2025-05-14',
    deadline: '2025-09-30',
    state: 'Closed',
    status: 'Settled',
    auditType: 'Commercial',
    auditSubtype: 'recoupment_demand',
    auditBody: 'Optum',
    auditNoticeDate: '2025-05-14',
    amountAtRisk: 48600.00,
    proposedRecoupment: 48600.00,
    settledAmount: 24300.00,
    assignedTo: TEAM[0]!,
    notes: 'UHC Optum recoupment demand — complex orthopedic surgical case, alleged coding errors on implant billing. Dispute filed 7/01. Negotiated settlement 9/18: $24,300 repaid (50%), remainder forgiven. Finance approved settlement per policy.',
  },
]
