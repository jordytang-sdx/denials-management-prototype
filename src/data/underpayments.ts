import type { CaseReference } from './audits'

// ── State / Status types ──────────────────────────────────────────────────────

export type UnderpaymentState = 'Active' | 'Submitted' | 'Won' | 'Recovered' | 'Closed' | 'Archived'

export type UnderpaymentActiveStatus =
  | 'Contract Analysis in Progress'
  | 'Variance Confirmed'
  | 'Demand Letter Drafting'
  | 'Awaiting Additional Documentation'
  | 'Peer Review Requested'

export type UnderpaymentSubmittedStatus =
  | 'Awaiting Payer Response'
  | 'Response Overdue'
  | 'Under Negotiation'

export type UnderpaymentWonStatus =
  | 'Payment Adjustment Authorized'
  | 'Partial Adjustment Authorized'
  | 'Settlement Agreed'

export type UnderpaymentRecoveredStatus =
  | 'Payment Adjustment Confirmed'
  | 'Partial Recovery Confirmed'
  | 'Settlement Paid'

export type UnderpaymentClosedStatus =
  | 'Payer Upheld'
  | 'Will Not Pursue'
  | 'Written Off'
  | 'Below Work Threshold'

export type UnderpaymentArchivedStatus = 'Archived'

export type UnderpaymentStatus =
  | UnderpaymentActiveStatus
  | UnderpaymentSubmittedStatus
  | UnderpaymentWonStatus
  | UnderpaymentRecoveredStatus
  | UnderpaymentClosedStatus
  | UnderpaymentArchivedStatus

// ── Work queue taxonomy ───────────────────────────────────────────────────────

export type UnderpaymentCategory =
  | 'Contract Variance'
  | 'Payer Processing Error'
  | 'Provider Billing Error'
  | 'Administrative & Eligibility'

export type ContractVarianceSubtype =
  | 'Incorrect Fee Schedule Applied'
  | 'Incorrect Contract Payment Rate'
  | 'Outlier Payment Calculation Error'
  | 'Add-On Payment Error'
  | 'APC Payment Variance'
  | 'DRG Base Rate or Weight Error'
  | 'Implant / Device Carveout Variance'
  | 'Lesser of Contract Clause Variance'
  | 'Stop Loss Threshold Error'

export type PayerProcessingErrorSubtype =
  | 'Bundling Error'
  | 'Multiple Procedure Reduction Error'
  | 'Incorrect Processing of Billed Units'
  | 'Payer Downcoding'

export type ProviderBillingErrorSubtype =
  | 'Coding / Modifier Issue'
  | 'DRG Downgrade'
  | 'Level of Service Error'

export type AdminEligibilitySubtype =
  | 'Coordination of Benefits Issue'
  | 'Administrative / Timely Filing Issue'

export type UnderpaymentSubtype =
  | ContractVarianceSubtype
  | PayerProcessingErrorSubtype
  | ProviderBillingErrorSubtype
  | AdminEligibilitySubtype

// ── Core record type ──────────────────────────────────────────────────────────

export interface UnderpaymentRecord {
  caseType?: 'underpayment'
  id: string
  patient: { name: string; mrn: string }
  claim: { claimId: string; har: string }
  payer: string
  lineOfBusiness?: string
  dos: string
  createdAt: string
  deadline: string
  state: UnderpaymentState
  status: UnderpaymentStatus
  category: UnderpaymentCategory
  subtype: UnderpaymentSubtype
  // Financials
  billedAmount: number
  paidAmount: number
  expectedAmount: number       // contracted rate
  varianceAmount: number       // expectedAmount - paidAmount
  recoveredAmount?: number     // confirmed recovery (Recovered state)
  // Metadata
  carc?: string
  rarc?: string
  assignedTo: { id: string; name: string; initials: string } | null
  notes: string
  nextAction?: string
  // Relationships
  originatingDenialId?: string  // for post-overturn or partial denial handoffs
  handoffReason?: 'direct_underpayment' | 'silent_downcode' | 'partial_denial' | 'post_overturn' | 'ambiguous_payment'
  relatedCases?: CaseReference[]
}

// ── Team members (reuse from denials context) ────────────────────────────────

const TEAM = [
  { id: 'jt', name: 'Jordan Tang',    initials: 'JT' },
  { id: 'ms', name: 'Marcus Spencer', initials: 'MS' },
  { id: 'lr', name: 'Lisa Reyes',     initials: 'LR' },
  { id: 'ab', name: 'Anika Brown',    initials: 'AB' },
]

// ── Date helpers ──────────────────────────────────────────────────────────────

function d(offset: number): string {
  const base = new Date('2026-04-02')
  base.setDate(base.getDate() + offset)
  return base.toISOString().split('T')[0]!
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_UNDERPAYMENTS: UnderpaymentRecord[] = [

  // ── CONTRACT VARIANCE ─────────────────────────────────────────────────────

  {
    id: 'UP-2026-0041',
    patient: { name: 'Harold Nguyen', mrn: 'MRN-558821' },
    claim: { claimId: 'CLM-9901234', har: 'HAR-882001' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Preferred Blue PPO',
    dos: '2026-02-10',
    createdAt: d(-20),
    deadline: d(10),
    state: 'Active',
    status: 'Variance Confirmed',
    category: 'Contract Variance',
    subtype: 'Incorrect Fee Schedule Applied',
    billedAmount: 18400.00,
    paidAmount: 12100.00,
    expectedAmount: 16580.00,
    varianceAmount: 4480.00,
    carc: 'CARC-45',
    assignedTo: TEAM[0]!,
    notes: 'BCBS applied 2024 fee schedule instead of 2025 contracted rates. DRG 470 base rate should be $14,800 per 2025 agreement.',
    nextAction: 'Draft demand letter citing contract §3.1 fee schedule effective date',
  },
  {
    id: 'UP-2026-0039',
    patient: { name: 'Margaret Holloway', mrn: 'MRN-104823' },
    claim: { claimId: 'CLM-8847291', har: 'HAR-774112' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Commercial',
    dos: '2026-02-14',
    createdAt: d(-18),
    deadline: d(12),
    state: 'Active',
    status: 'Contract Analysis in Progress',
    category: 'Contract Variance',
    subtype: 'Incorrect Contract Payment Rate',
    billedAmount: 18450.00,
    paidAmount: 14240.00,
    expectedAmount: 15680.00,
    varianceAmount: 1440.00,
    carc: 'CARC-45',
    assignedTo: TEAM[0]!,
    notes: 'BCBS paid $14,240 on this claim; contracted DRG 291 rate is $15,680 per 2025 agreement. Separate from the $4,210 DRG downgrade denial on this claim.',
    nextAction: 'Confirm expected rate against current fee schedule; draft demand',
    originatingDenialId: 'DN-2026-0412',
    handoffReason: 'partial_denial',
    relatedCases: [{ caseId: 'DN-2026-0412', caseType: 'denial', relationship: 'related_claim' }],
  },
  {
    id: 'UP-2026-0044',
    patient: { name: 'Renata Okonkwo', mrn: 'MRN-302841' },
    claim: { claimId: 'CLM-4412009', har: 'HAR-331008' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'UHC Choice Plus',
    dos: '2026-01-08',
    createdAt: d(-32),
    deadline: d(4),
    state: 'Active',
    status: 'Demand Letter Drafting',
    category: 'Contract Variance',
    subtype: 'Outlier Payment Calculation Error',
    billedAmount: 94200.00,
    paidAmount: 61400.00,
    expectedAmount: 78900.00,
    varianceAmount: 17500.00,
    carc: 'CARC-45',
    assignedTo: TEAM[1]!,
    notes: 'High-cost outlier threshold calculation appears to use incorrect cost-to-charge ratio. UHC used 0.41 per 835; contracted CCR is 0.52 per 2025 amendment.',
    nextAction: 'Submit outlier recalculation with correct CCR documentation',
  },
  {
    id: 'UP-2026-0051',
    patient: { name: 'Constance Waller', mrn: 'MRN-447712' },
    claim: { claimId: 'CLM-5503881', har: 'HAR-429100' },
    payer: 'Aetna',
    lineOfBusiness: 'Aetna PPO',
    dos: '2026-02-02',
    createdAt: d(-28),
    deadline: d(18),
    state: 'Active',
    status: 'Contract Analysis in Progress',
    category: 'Contract Variance',
    subtype: 'DRG Base Rate or Weight Error',
    billedAmount: 22800.00,
    paidAmount: 14920.00,
    expectedAmount: 18650.00,
    varianceAmount: 3730.00,
    carc: 'CARC-45',
    assignedTo: TEAM[2]!,
    notes: 'Aetna paid at MS-DRG 392 weight (0.8812) but claim was correctly coded to MS-DRG 391 (weight 1.1041). Silent downcode — no denial letter issued.',
    handoffReason: 'silent_downcode',
    nextAction: 'Confirm DRG weight differential and draft variance analysis',
  },
  {
    id: 'UP-2026-0058',
    patient: { name: 'Douglas Patel', mrn: 'MRN-881204' },
    claim: { claimId: 'CLM-7712004', har: 'HAR-558990' },
    payer: 'Cigna',
    lineOfBusiness: 'Cigna Open Access Plus',
    dos: '2026-01-15',
    createdAt: d(-45),
    deadline: d(2),
    state: 'Submitted',
    status: 'Awaiting Payer Response',
    category: 'Contract Variance',
    subtype: 'Implant / Device Carveout Variance',
    billedAmount: 41200.00,
    paidAmount: 29800.00,
    expectedAmount: 38100.00,
    varianceAmount: 8300.00,
    carc: 'CARC-45',
    assignedTo: TEAM[0]!,
    notes: 'Spinal implant device cost ($8,200) should be carved out per contract §7.4 — implants exceeding $5,000 reimbursed at invoice cost + 10%. Cigna bundled into DRG payment.',
    nextAction: 'Follow up with Cigna provider relations if no response by Apr 4',
  },
  {
    id: 'UP-2026-0062',
    patient: { name: 'Miriam Tran', mrn: 'MRN-203449' },
    claim: { claimId: 'CLM-3301228', har: 'HAR-219881' },
    payer: 'Humana',
    lineOfBusiness: 'Humana Gold Plus HMO',
    dos: '2025-12-19',
    createdAt: d(-60),
    deadline: d(-5),
    state: 'Won',
    status: 'Payment Adjustment Authorized',
    billedAmount: 15600.00,
    paidAmount: 10200.00,
    expectedAmount: 13800.00,
    varianceAmount: 3600.00,
    category: 'Contract Variance',
    subtype: 'Incorrect Contract Payment Rate',
    carc: 'CARC-45',
    assignedTo: TEAM[3]!,
    notes: 'Humana acknowledged rate error — applied HMO base rate to PPO-contracted facility. Adjustment of $3,600 authorized in writing 4/01. Awaiting 835 to confirm.',
  },
  {
    id: 'UP-2026-0033',
    patient: { name: 'Arthur Finley', mrn: 'MRN-119204' },
    claim: { claimId: 'CLM-8801004', har: 'HAR-772441' },
    payer: 'Medicare Advantage',
    lineOfBusiness: 'UHC Dual Complete',
    dos: '2025-11-30',
    createdAt: d(-90),
    deadline: d(-30),
    state: 'Recovered',
    status: 'Payment Adjustment Confirmed',
    billedAmount: 28400.00,
    paidAmount: 19800.00,
    expectedAmount: 25600.00,
    varianceAmount: 5800.00,
    recoveredAmount: 5800.00,
    category: 'Contract Variance',
    subtype: 'Stop Loss Threshold Error',
    carc: 'CARC-45',
    assignedTo: TEAM[1]!,
    notes: 'Stop loss threshold of $25,000 triggered per contract §9.2 — UHC incorrectly calculated using billed charges instead of allowed amount. $5,800 adjustment confirmed on 835.',
  },

  // ── PAYER PROCESSING ERRORS ───────────────────────────────────────────────

  {
    id: 'UP-2026-0071',
    patient: { name: 'Sylvester Moon', mrn: 'MRN-440129' },
    claim: { claimId: 'CLM-6621008', har: 'HAR-553009' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Blue Essentials HMO',
    dos: '2026-02-18',
    createdAt: d(-18),
    deadline: d(14),
    state: 'Active',
    status: 'Variance Confirmed',
    category: 'Payer Processing Error',
    subtype: 'Bundling Error',
    billedAmount: 9400.00,
    paidAmount: 4200.00,
    expectedAmount: 8100.00,
    varianceAmount: 3900.00,
    carc: 'CARC-97',
    rarc: 'N70',
    assignedTo: TEAM[2]!,
    notes: 'BCBS bundled CPT 93306 (echo with Doppler) into the facility E&M visit. Per NCCI edits, these are separately billable in an outpatient facility setting. CARC 97 / N70.',
    nextAction: 'Draft demand letter citing NCCI unbundling rules and CMS transmittal',
    handoffReason: 'direct_underpayment',
  },
  {
    id: 'UP-2026-0074',
    patient: { name: 'Patricia Osei', mrn: 'MRN-772041' },
    claim: { claimId: 'CLM-3302771', har: 'HAR-208441' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'UHC Navigate HMO',
    dos: '2026-03-01',
    createdAt: d(-10),
    deadline: d(22),
    state: 'Active',
    status: 'Contract Analysis in Progress',
    category: 'Payer Processing Error',
    subtype: 'Multiple Procedure Reduction Error',
    billedAmount: 12800.00,
    paidAmount: 7600.00,
    expectedAmount: 10900.00,
    varianceAmount: 3300.00,
    carc: 'CARC-4',
    assignedTo: TEAM[0]!,
    notes: 'UHC applied 50% multiple procedure reduction to all three procedures. Per contract, reduction applies only to the second procedure; third is a separately billable service per modifier -59.',
    nextAction: 'Confirm modifier -59 usage and document separate service nature',
    handoffReason: 'direct_underpayment',
  },
  {
    id: 'UP-2026-0079',
    patient: { name: 'Glenn Vasquez', mrn: 'MRN-330814' },
    claim: { claimId: 'CLM-1101884', har: 'HAR-008812' },
    payer: 'Aetna',
    lineOfBusiness: 'Aetna HMO',
    dos: '2026-02-25',
    createdAt: d(-12),
    deadline: d(20),
    state: 'Active',
    status: 'Variance Confirmed',
    category: 'Payer Processing Error',
    subtype: 'Incorrect Processing of Billed Units',
    billedAmount: 7200.00,
    paidAmount: 3600.00,
    expectedAmount: 7200.00,
    varianceAmount: 3600.00,
    carc: 'CARC-4',
    assignedTo: TEAM[3]!,
    notes: 'Billed 4 units of J0696 (ceftriaxone 500mg); Aetna processed 2 units. No CARC explanation for unit reduction. No denial letter issued.',
    nextAction: 'Submit corrected claim with unit documentation from medication administration record',
    handoffReason: 'direct_underpayment',
  },
  {
    id: 'UP-2026-0082',
    patient: { name: 'Lucinda Park', mrn: 'MRN-441902' },
    claim: { claimId: 'CLM-9901235', har: 'HAR-882002' },
    payer: 'Cigna',
    lineOfBusiness: 'Cigna Connect',
    dos: '2026-01-22',
    createdAt: d(-50),
    deadline: d(-10),
    state: 'Submitted',
    status: 'Under Negotiation',
    category: 'Payer Processing Error',
    subtype: 'Payer Downcoding',
    billedAmount: 8900.00,
    paidAmount: 5100.00,
    expectedAmount: 7800.00,
    varianceAmount: 2700.00,
    carc: 'CARC-4',
    rarc: 'N522',
    assignedTo: TEAM[1]!,
    notes: 'Cigna silently downcoded 99285 to 99283 with no denial notice. Variance of $2,700 confirmed. Demand letter submitted 3/18; Cigna requested additional documentation.',
    handoffReason: 'silent_downcode',
  },
  {
    id: 'UP-2025-0944',
    patient: { name: 'Theodore Banks', mrn: 'MRN-119008' },
    claim: { claimId: 'CLM-5514009', har: 'HAR-428801' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Blue Essentials PPO',
    dos: '2025-10-14',
    createdAt: d(-120),
    deadline: d(-60),
    state: 'Recovered',
    status: 'Partial Recovery Confirmed',
    billedAmount: 11200.00,
    paidAmount: 6400.00,
    expectedAmount: 9800.00,
    varianceAmount: 3400.00,
    recoveredAmount: 2100.00,
    category: 'Payer Processing Error',
    subtype: 'Bundling Error',
    carc: 'CARC-97',
    assignedTo: TEAM[2]!,
    notes: 'Partial recovery — BCBS agreed to unbundle CPT 93306 but applied a different rate than contracted. $2,100 of $3,400 variance recovered. Accepted per finance review.',
  },

  // ── PROVIDER BILLING ERRORS ───────────────────────────────────────────────

  {
    id: 'UP-2026-0091',
    patient: { name: 'Francesca Bloom', mrn: 'MRN-882140' },
    claim: { claimId: 'CLM-7701441', har: 'HAR-661200' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'UHC Choice Plus',
    dos: '2026-03-05',
    createdAt: d(-8),
    deadline: d(24),
    state: 'Active',
    status: 'Contract Analysis in Progress',
    category: 'Provider Billing Error',
    subtype: 'Coding / Modifier Issue',
    billedAmount: 6400.00,
    paidAmount: 4100.00,
    expectedAmount: 5900.00,
    varianceAmount: 1800.00,
    carc: 'CARC-4',
    assignedTo: TEAM[0]!,
    notes: 'Modifier -25 missing on 99214 billed same day as minor procedure. UHC reduced E&M payment per CCI. CDI confirmed -25 is appropriate — E&M was significant and separately identifiable.',
    nextAction: 'Submit corrected claim with modifier -25 and medical record documentation',
  },
  {
    id: 'UP-2026-0094',
    patient: { name: 'Calvin Reyes', mrn: 'MRN-330481' },
    claim: { claimId: 'CLM-4408812', har: 'HAR-330009' },
    payer: 'Aetna',
    lineOfBusiness: 'Aetna Open Choice PPO',
    dos: '2026-02-12',
    createdAt: d(-22),
    deadline: d(16),
    state: 'Active',
    status: 'Demand Letter Drafting',
    category: 'Provider Billing Error',
    subtype: 'DRG Downgrade',
    billedAmount: 31400.00,
    paidAmount: 22100.00,
    expectedAmount: 28800.00,
    varianceAmount: 6700.00,
    carc: 'CARC-4',
    rarc: 'N115',
    assignedTo: TEAM[3]!,
    notes: 'Aetna silently paid at MS-DRG 392 vs billed MS-DRG 391. No audit notice issued. CDI confirmed principal diagnosis supports 391. Drafting variance demand.',
    handoffReason: 'silent_downcode',
    nextAction: 'Complete demand letter with CDI attestation attached',
  },
  {
    id: 'UP-2026-0097',
    patient: { name: 'Ingrid Hoffmann', mrn: 'MRN-119774' },
    claim: { claimId: 'CLM-8800991', har: 'HAR-772009' },
    payer: 'Cigna',
    lineOfBusiness: 'Cigna Preferred',
    dos: '2026-01-08',
    createdAt: d(-55),
    deadline: d(-15),
    state: 'Closed',
    status: 'Payer Upheld',
    category: 'Provider Billing Error',
    subtype: 'Level of Service Error',
    billedAmount: 4800.00,
    paidAmount: 3200.00,
    expectedAmount: 4200.00,
    varianceAmount: 1000.00,
    carc: 'CARC-4',
    assignedTo: TEAM[2]!,
    notes: 'Cigna upheld level of service downcode from 99285 to 99284. Medical record documentation review confirmed Cigna\'s position — complexity criteria for 99285 not fully met per MDM requirements.',
  },

  // ── ADMINISTRATIVE & ELIGIBILITY ──────────────────────────────────────────

  {
    id: 'UP-2026-0101',
    patient: { name: 'Nathaniel Cruz', mrn: 'MRN-558004' },
    claim: { claimId: 'CLM-3309004', har: 'HAR-209771' },
    payer: 'Blue Cross Blue Shield',
    lineOfBusiness: 'Blue Essentials PPO',
    dos: '2026-02-20',
    createdAt: d(-15),
    deadline: d(17),
    state: 'Active',
    status: 'Awaiting Additional Documentation',
    category: 'Administrative & Eligibility',
    subtype: 'Coordination of Benefits Issue',
    billedAmount: 14200.00,
    paidAmount: 8100.00,
    expectedAmount: 12400.00,
    varianceAmount: 4300.00,
    carc: 'CARC-23',
    assignedTo: TEAM[1]!,
    notes: 'BCBS paid as secondary at 57% of billed charges instead of coordinating to bring patient responsibility to zero per COB agreement. Medicare primary paid $6,100; BCBS secondary should cover the remaining $6,300.',
    nextAction: 'Obtain Medicare EOB and submit to BCBS for COB recalculation',
    handoffReason: 'ambiguous_payment',
  },
  {
    id: 'UP-2026-0104',
    patient: { name: 'Serena Whitmore', mrn: 'MRN-881009' },
    claim: { claimId: 'CLM-7700112', har: 'HAR-661009' },
    payer: 'Medicaid',
    lineOfBusiness: 'SC Medicaid',
    dos: '2026-01-30',
    createdAt: d(-35),
    deadline: d(8),
    state: 'Active',
    status: 'Variance Confirmed',
    category: 'Administrative & Eligibility',
    subtype: 'Administrative / Timely Filing Issue',
    billedAmount: 5600.00,
    paidAmount: 2800.00,
    expectedAmount: 5100.00,
    varianceAmount: 2300.00,
    carc: 'CARC-29',
    assignedTo: TEAM[0]!,
    notes: 'Medicaid applied timely filing penalty reducing payment by 50%. Original claim submitted within filing window per 277-CA acknowledgment dated 2/02. Contesting the penalty application.',
    nextAction: 'Submit 277-CA acknowledgment as proof of timely filing',
  },
  {
    id: 'UP-2025-0812',
    patient: { name: 'Raymond Castillo', mrn: 'MRN-330041' },
    claim: { claimId: 'CLM-1100441', har: 'HAR-008004' },
    payer: 'Humana',
    lineOfBusiness: 'Humana PPO',
    dos: '2025-09-15',
    createdAt: d(-150),
    deadline: d(-90),
    state: 'Closed',
    status: 'Will Not Pursue',
    category: 'Administrative & Eligibility',
    subtype: 'Coordination of Benefits Issue',
    billedAmount: 3200.00,
    paidAmount: 2400.00,
    expectedAmount: 3000.00,
    varianceAmount: 600.00,
    carc: 'CARC-23',
    assignedTo: TEAM[3]!,
    notes: 'COB variance of $600 — below cost-of-pursuit threshold. Closed per finance approval.',
  },
  {
    id: 'UP-2026-0108',
    patient: { name: 'Beverly Okafor', mrn: 'MRN-440881' },
    claim: { claimId: 'CLM-5512881', har: 'HAR-428009' },
    payer: 'UnitedHealthcare',
    lineOfBusiness: 'UHC Choice',
    dos: '2025-12-10',
    createdAt: d(-80),
    deadline: d(-20),
    state: 'Won',
    status: 'Partial Adjustment Authorized',
    category: 'Administrative & Eligibility',
    subtype: 'Coordination of Benefits Issue',
    billedAmount: 18900.00,
    paidAmount: 11200.00,
    expectedAmount: 16400.00,
    varianceAmount: 5200.00,
    carc: 'CARC-23',
    assignedTo: TEAM[2]!,
    notes: 'UHC agreed to partial adjustment of $3,800 of the $5,200 variance. COB recalculation confirmed $3,800 is owed; remaining $1,400 relates to benefit limit. Awaiting 835.',
  },
]
