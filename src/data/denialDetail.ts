// ─── Denial Outcomes ──────────────────────────────────────────────────────────

export type OutcomeDisposition =
  | 'overturned_full'
  | 'overturned_partial'
  | 'upheld'
  | 'will_not_appeal'
  | 'settled_partial'
  | 'corrected_paid'
  | 'secondary_paid'

export interface DenialOutcome {
  disposition: OutcomeDisposition
  resolvedAt: string            // ISO date YYYY-MM-DD
  recoveredAmount: number       // cash recovered by provider
  writtenOffAmount: number      // amount written off
  repaidAmount?: number         // amount repaid to payer (recoupments)
  daysToResolution: number
  appealRoundsCompleted: number
  finalNote: string
}

export const DENIAL_OUTCOMES: Record<string, DenialOutcome> = {
  'DN-2025-0847': {
    disposition: 'overturned_full',
    resolvedAt: '2025-10-18',
    recoveredAmount: 8940.00,
    writtenOffAmount: 0,
    daysToResolution: 82,
    appealRoundsCompleted: 3,
    finalNote: 'External independent review overturned payer denial. L1 and L2 upheld by Aetna clinical team; external reviewer found inpatient level of care clinically appropriate. Full payment posted 2025-10-18.',
  },
  'DN-2025-1201': {
    disposition: 'will_not_appeal',
    resolvedAt: '2025-12-10',
    recoveredAmount: 0,
    writtenOffAmount: 6200.00,
    daysToResolution: 89,
    appealRoundsCompleted: 2,
    finalNote: 'UHC upheld denial at L1 and L2. Recovery ROI analysis showed expected value below cost of external review at $6,200 denied. Finance approved write-off per policy.',
  },
  'DN-2025-0932': {
    disposition: 'upheld',
    resolvedAt: '2025-08-20',
    recoveredAmount: 0,
    writtenOffAmount: 0,
    daysToResolution: 50,
    appealRoundsCompleted: 0,
    finalNote: 'ADR records submitted. Medicare post-review issued DRG downgrade — denial escalated to new instance DN-2025-0933. This ADR case closed as escalated.',
  },
  'DN-2025-0933': {
    disposition: 'overturned_full',
    resolvedAt: '2025-10-30',
    recoveredAmount: 3840.00,
    writtenOffAmount: 0,
    daysToResolution: 71,
    appealRoundsCompleted: 2,
    finalNote: 'Level 2 appeal overturned Medicare DRG downgrade. MS-DRG 194 (with MCC) restored. $3,840 recovered. Original ADR that preceded this dispute: DN-2025-0932.',
  },
  'DN-2025-1089': {
    disposition: 'overturned_full',
    resolvedAt: '2026-01-08',
    recoveredAmount: 9450.00,
    writtenOffAmount: 0,
    daysToResolution: 78,
    appealRoundsCompleted: 1,
    finalNote: 'L1 appeal with peer-to-peer review with Cigna medical director. P2P resulted in overturn — Cigna accepted retroactive authorization documentation. Full $9,450 paid.',
  },
  'DN-2025-1156': {
    disposition: 'will_not_appeal',
    resolvedAt: '2026-01-20',
    recoveredAmount: 0,
    writtenOffAmount: 2100.00,
    daysToResolution: 73,
    appealRoundsCompleted: 1,
    finalNote: 'BCBS upheld L1 appeal. No retroactive authorization pathway available per contract. Finance approved write-off — external review cost exceeds denied amount.',
  },
  'DN-2025-0788': {
    disposition: 'settled_partial',
    resolvedAt: '2025-11-14',
    recoveredAmount: 0,
    writtenOffAmount: 6200.00,
    repaidAmount: 6200.00,
    daysToResolution: 88,
    appealRoundsCompleted: 0,
    finalNote: 'Medicare recoupment of $12,400 disputed with complete clinical record. Negotiated settlement: $6,200 repaid to Medicare, $6,200 forgiven. Settlement accepted 2025-11-14.',
  },
  'DN-2025-1302': {
    disposition: 'overturned_full',
    resolvedAt: '2025-09-02',
    recoveredAmount: 3100.00,
    writtenOffAmount: 0,
    daysToResolution: 49,
    appealRoundsCompleted: 1,
    finalNote: '277-CA acceptance report confirmed claim transmitted to Aetna within the 180-day filing window. Aetna reversed denial and processed payment. $3,100 paid.',
  },
  'DN-2026-0044': {
    disposition: 'corrected_paid',
    resolvedAt: '2026-01-08',
    recoveredAmount: 1240.00,
    writtenOffAmount: 0,
    daysToResolution: 38,
    appealRoundsCompleted: 0,
    finalNote: 'ICD-10 principal dx sequencing corrected (E11.65 moved to secondary). BCBS processed corrected claim — $1,240 paid in full.',
  },
  'DN-2026-0077': {
    disposition: 'secondary_paid',
    resolvedAt: '2026-02-20',
    recoveredAmount: 2340.00,
    writtenOffAmount: 0,
    daysToResolution: 43,
    appealRoundsCompleted: 0,
    finalNote: 'Medicaid coverage confirmed inactive on DOS 12/10/2025. Medicare identified as primary payer. Claim billed to Medicare and paid in full — $2,340 recovered.',
  },
  'DN-2026-0103': {
    disposition: 'will_not_appeal',
    resolvedAt: '2026-03-15',
    recoveredAmount: 0,
    writtenOffAmount: 4100.00,
    daysToResolution: 59,
    appealRoundsCompleted: 1,
    finalNote: 'Cigna upheld L1 appeal — documentation did not support extended LOS beyond Cigna InterQual criteria. Finance approved write-off. Closed 2026-03-15.',
  },
}

// ─── Underpayment ─────────────────────────────────────────────────────────────

export interface UnderpaymentRecord {
  procedureCode: string
  procedureDesc: string
  billedAmount: number
  contractedRate: number
  paidAmount: number
  underpaidAmount: number
  contractRef: string
  rationale: string
}

export const UNDERPAYMENT_DATA: Record<string, UnderpaymentRecord> = {
  'DN-2026-0521': {
    procedureCode: '33533',
    procedureDesc: 'Coronary Artery Bypass, Arterial',
    billedAmount: 48200,
    contractedRate: 13250,
    paidAmount: 8430,
    underpaidAmount: 4820,
    contractRef: 'UHC Memorial Health System Agreement 2024 — Appendix B, Rate Schedule §4.2',
    rationale: 'UHC applied commercial fee schedule rate ($8,430) instead of the negotiated case rate ($13,250) specified in contract §4.2 for CABG procedures.',
  },
  'DN-2026-0538': {
    procedureCode: '27447',
    procedureDesc: 'Total Knee Arthroplasty',
    billedAmount: 38900,
    contractedRate: 11750,
    paidAmount: 9445,
    underpaidAmount: 2305,
    contractRef: 'Aetna Memorial Health System Agreement 2024 — Schedule A, Inpatient Case Rates §2.1',
    rationale: 'Aetna reimbursed at the outpatient ambulatory rate ($9,445) rather than the inpatient case rate ($11,750) per contract §2.1.',
  },
}

// ─── CARC / RARC Reference ────────────────────────────────────────────────────

export const CARC_DESCRIPTIONS: Record<string, { short: string; full: string }> = {
  'CARC-4':  { short: 'Service not covered', full: 'The service/care/equipment/drug is not covered by this payer. Please see the benefit booklet or call customer service for more information.' },
  'CARC-15': { short: 'Authorization missing or invalid', full: 'The authorization number is missing, invalid, or does not apply to the billed services or provider.' },
  'CARC-16': { short: 'Missing or invalid billing information', full: 'Claim/service lacks information or has submission/billing error(s). At least one Remark Code must be provided.' },
  'CARC-18': { short: 'Duplicate claim', full: 'Exact duplicate claim/service. Use only with Group Code OA except where state workers\' compensation regulations require CO.' },
  'CARC-29': { short: 'Timely filing expired', full: 'The time limit for filing has expired.' },
  'CARC-31': { short: 'Patient not identified as insured', full: 'Patient cannot be identified as our insured.' },
  'CARC-45': { short: 'Charge exceeds fee schedule', full: 'Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.' },
  'CARC-50': { short: 'Not medically necessary', full: 'These are non-covered services because this is not deemed a medical necessity by the payer.' },
}

export const RARC_DESCRIPTIONS: Record<string, { short: string; full: string }> = {
  'N115': { short: 'Based on LCD', full: 'This decision was based on a Local Coverage Determination (LCD). An LCD provides a guide to assist in determining whether a particular item or service is covered.' },
  'M86':  { short: 'Duplicate service window', full: 'Service denied because payment already made for same/similar procedure within set time frame.' },
  'N130': { short: 'See contractual agreement', full: 'Consult the contractual agreement for further information.' },
}

// ─── Remit Data ───────────────────────────────────────────────────────────────

export interface RemitAdjustment {
  groupCode: 'CO' | 'PR' | 'OA' | 'PI'
  carc: string
  rarc?: string
  amount: number
}

export interface RemitServiceLine {
  lineNum: number
  procedureCode: string
  modifier?: string
  dos: string
  billedAmount: number
  allowedAmount: number
  paidAmount: number
  adjustments: RemitAdjustment[]
}

export interface RemitData {
  denialId: string
  eftNumber: string
  paymentDate: string
  payerName: string
  payerID: string
  payerICN: string
  patientControlNumber: string
  renderingNPI: string
  dos: string
  claimBilledAmount: number
  claimAllowedAmount: number
  claimPaidAmount: number
  claimStatusCode: string
  claimStatusDescription: string
  adjustments: RemitAdjustment[]
  serviceLines: RemitServiceLine[]
}

export const REMIT_DATA: Record<string, RemitData> = {
  'DN-2026-0412': {
    denialId: 'DN-2026-0412',
    eftNumber: 'EFT-20260218-004821',
    paymentDate: '2026-02-18',
    payerName: 'Blue Cross Blue Shield',
    payerID: '00610',
    payerICN: 'ICN-2026-044-8847291',
    patientControlNumber: 'PCN-104823-2026214',
    renderingNPI: '1234567890',
    dos: '2026-02-14',
    claimBilledAmount: 18450.00,
    claimAllowedAmount: 14240.00,
    claimPaidAmount: 14240.00,
    claimStatusCode: '4',
    claimStatusDescription: 'Denial',
    adjustments: [
      { groupCode: 'CO', carc: 'CARC-4', rarc: 'N115', amount: 4210.00 },
    ],
    serviceLines: [
      { lineNum: 1, procedureCode: 'MS-DRG 291', dos: '2026-02-14', billedAmount: 18450.00, allowedAmount: 14240.00, paidAmount: 14240.00, adjustments: [{ groupCode: 'CO', carc: 'CARC-4', rarc: 'N115', amount: 4210.00 }] },
    ],
  },
  'DN-2026-0389': {
    denialId: 'DN-2026-0389',
    eftNumber: 'EFT-20260222-009144',
    paymentDate: '2026-02-22',
    payerName: 'Aetna',
    payerID: '60054',
    payerICN: 'ICN-2026-053-9920441',
    patientControlNumber: 'PCN-091247-2026218',
    renderingNPI: '1234567890',
    dos: '2026-02-18',
    claimBilledAmount: 31200.00,
    claimAllowedAmount: 18720.00,
    claimPaidAmount: 18720.00,
    claimStatusCode: '4',
    claimStatusDescription: 'Denial',
    adjustments: [
      { groupCode: 'CO', carc: 'CARC-50', rarc: 'M86', amount: 12480.00 },
    ],
    serviceLines: [
      { lineNum: 1, procedureCode: 'MS-DRG 470', dos: '2026-02-18', billedAmount: 31200.00, allowedAmount: 18720.00, paidAmount: 18720.00, adjustments: [{ groupCode: 'CO', carc: 'CARC-50', rarc: 'M86', amount: 12480.00 }] },
    ],
  },
  'DN-2026-0377': {
    denialId: 'DN-2026-0377',
    eftNumber: 'EFT-20260305-002271',
    paymentDate: '2026-03-05',
    payerName: 'UnitedHealthcare',
    payerID: '87726',
    payerICN: 'ICN-2026-064-6634882',
    patientControlNumber: 'PCN-318740-2026301',
    renderingNPI: '1234567890',
    dos: '2026-03-01',
    claimBilledAmount: 14800.00,
    claimAllowedAmount: 8050.00,
    claimPaidAmount: 8050.00,
    claimStatusCode: '4',
    claimStatusDescription: 'Denial',
    adjustments: [
      { groupCode: 'CO', carc: 'CARC-15', rarc: 'N130', amount: 6750.00 },
    ],
    serviceLines: [
      { lineNum: 1, procedureCode: 'MS-DRG 247', dos: '2026-03-01', billedAmount: 14800.00, allowedAmount: 8050.00, paidAmount: 8050.00, adjustments: [{ groupCode: 'CO', carc: 'CARC-15', rarc: 'N130', amount: 6750.00 }] },
    ],
  },
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'signal_835'
  | 'signal_pdf_denial'
  | 'signal_pdf_adr'
  | 'signal_pdf_recoupment'
  | 'instance_created'
  | 'routing_applied'
  | 'match_flagged'
  | 'action_appeal_l1'
  | 'action_appeal_l2'
  | 'action_appeal_l3'
  | 'action_records_requested'
  | 'action_records_submitted'
  | 'action_resubmit'
  | 'action_note'
  | 'action_assign'
  | 'action_peer_to_peer'
  | 'payer_pending'
  | 'payer_upheld'
  | 'payer_overturned'
  | 'payer_partial'

export type ActorType = 'payer' | 'provider' | 'system'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: string   // ISO string
  actor: string
  actorType: ActorType
  summary: string
  detail?: string
  amount?: number
  document?: string
}

// Reference date: 2026-04-02
function ts(daysOffset: number, hour = 8, minute = 0): string {
  const d = new Date('2026-04-02T00:00:00')
  d.setDate(d.getDate() + daysOffset)
  d.setHours(hour, minute)
  return d.toISOString()
}

export const TIMELINE_EVENTS: Record<string, TimelineEvent[]> = {

  // ── DN-2026-0412: BCBS DRG Downgrade — Margaret Holloway ──────────────────
  'DN-2026-0412': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-18, 6, 14), actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: '835 remit received — claim adjusted', detail: 'Payment posted with $4,210.00 CO adjustment. DRG downgraded from MS-DRG 291 to MS-DRG 292.', amount: 4210.00, document: 'ERA_BCBS_20260215.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-18, 6, 15), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-8847291 (HAR-774112) with 98% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-18, 6, 15), actor: 'System', actorType: 'system', summary: 'Routed to DRG Downgrade queue', detail: 'Routing rule: BCBS + CARC-4 → DRG Downgrade worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-17, 9, 30), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Sarah Chen', detail: 'Assigned during morning queue review.' },
    { id: 'e5', type: 'action_note', timestamp: ts(-14, 10, 45), actor: 'Sarah Chen', actorType: 'provider', summary: 'Note added', detail: 'Reviewed clinical documentation. Attending supports MS-DRG 291 — patient had significant CC. Requesting peer-to-peer with BCBS medical director before drafting appeal.' },
    { id: 'e6', type: 'action_peer_to_peer', timestamp: ts(-10, 14, 0), actor: 'Sarah Chen', actorType: 'provider', summary: 'Peer-to-peer scheduled with BCBS', detail: 'Scheduled for 2026-03-26 at 2:00 PM with BCBS medical director.' },
    { id: 'e7', type: 'action_note', timestamp: ts(-7, 15, 20), actor: 'Sarah Chen', actorType: 'provider', summary: 'Peer-to-peer outcome — appeal required', detail: 'BCBS medical director maintained downgrade position. Proceeding with written level 1 appeal. Physician attestation obtained.' },
  ],

  // ── DN-2026-0389: Aetna Med Nec — Raymond Castellano ─────────────────────
  'DN-2026-0389': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-15, 7, 2), actor: 'Aetna', actorType: 'payer', summary: '835 remit received — medical necessity denial', detail: 'Full claim denied under CARC-50/M86. Inpatient stay deemed not medically necessary.', amount: 12480.00, document: 'ERA_AETNA_20260218.835' },
    { id: 'e2', type: 'signal_pdf_denial', timestamp: ts(-13, 11, 0), actor: 'Aetna', actorType: 'payer', summary: 'Denial determination letter received', detail: 'Aetna clinical denial letter. Criteria cited: InterQual acute care criteria not met for admission date. Appeal rights and deadline included.', document: 'AETNA_DENIAL_CLM9920441.pdf' },
    { id: 'e3', type: 'instance_created', timestamp: ts(-15, 7, 3), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-9920441 (HAR-881033) with 96% confidence.' },
    { id: 'e4', type: 'routing_applied', timestamp: ts(-15, 7, 3), actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: Aetna + CARC-50 → Med Nec worklist. High-value flag applied ($12,480).' },
    { id: 'e5', type: 'match_flagged', timestamp: ts(-15, 7, 4), actor: 'System', actorType: 'system', summary: 'High-value unworked flag set', detail: 'Claim exceeds $5,000 threshold. No action taken after 7 days in Intake.' },
  ],

  // ── DN-2026-0278: Medicare ADR — Sylvia Moreau ────────────────────────────
  'DN-2026-0278': [
    { id: 'e1', type: 'signal_pdf_adr', timestamp: ts(-12, 5, 30), actor: 'Medicare', actorType: 'payer', summary: 'Additional Documentation Request received', detail: 'Medicare ADR via eMDR mailbox. Requesting complete medical records for DOS 2/10/2026 inpatient stay. Response required within 30 days.', document: 'MEDICARE_ADR_CLM9876541.pdf' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-12, 5, 31), actor: 'System', actorType: 'system', summary: 'ADR instance created', detail: 'Matched to CLM-9876541 (HAR-788229) with 99% confidence via eMDR document ID.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-12, 5, 31), actor: 'System', actorType: 'system', summary: 'Routed: ADR → HealthSource', detail: 'Routing rule: Medicare ADR → HealthSource ROI workflow.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-11, 8, 15), actor: 'System', actorType: 'system', summary: 'Assigned to Daniel Forsythe', detail: 'Auto-assigned per Medicare ADR rotation schedule.' },
    { id: 'e5', type: 'action_records_requested', timestamp: ts(-11, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Records request sent to HealthSource', detail: 'ADR metadata and request ID submitted to HealthSource ROI. Expected retrieval: 5–7 business days.', document: 'HEALTHSOURCE_REQUEST_HS-2026-0412.pdf' },
    { id: 'e6', type: 'match_flagged', timestamp: ts(-5, 8, 0), actor: 'System', actorType: 'system', summary: 'ADR open — records not retrieved after 7 days', detail: 'HealthSource retrieval SLA exceeded. No records received. Needs attention flag set.' },
  ],

  // ── DN-2026-0377: UHC Auth — James Okafor ────────────────────────────────
  'DN-2026-0377': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-10, 6, 45), actor: 'UnitedHealthcare', actorType: 'payer', summary: '835 remit received — authorization denial', detail: 'Claim denied: no prior authorization on file for MS-DRG 247. Full claim denied under CARC-15/N130.', amount: 6750.00, document: 'ERA_UHC_20260302.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-10, 6, 46), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-6634882 (HAR-559001) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-10, 6, 46), actor: 'System', actorType: 'system', summary: 'Routed to Authorization queue', detail: 'Routing rule: UHC + CARC-15 → Auth worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-9, 10, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Priya Nair', detail: 'Assigned to UHC authorization specialist.' },
    { id: 'e5', type: 'action_note', timestamp: ts(-8, 11, 30), actor: 'Priya Nair', actorType: 'provider', summary: 'Authorization research completed', detail: 'Auth #UHC-2026-0318-A was obtained pre-admission but applied to wrong NPI. Retroactive authorization request submitted to UHC on 3/25.' },
    { id: 'e6', type: 'action_appeal_l1', timestamp: ts(-5, 14, 0), actor: 'Priya Nair', actorType: 'provider', summary: 'Level 1 appeal submitted via UHC portal', detail: 'Appeal submitted with retroactive authorization documentation and admission notes. Payer confirmation #UHC-APP-2026-0312.', document: 'APPEAL_L1_CLM6634882.pdf' },
    { id: 'e7', type: 'match_flagged', timestamp: ts(-3, 9, 0), actor: 'System', actorType: 'system', summary: 'Submission failure detected', detail: 'Portal submission status returned error code 504. Resubmission required. Needs attention flag set.' },
  ],

  // ── DN-2026-0305: UHC Timely Filing — Helen Nakamura ─────────────────────
  'DN-2026-0305': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-22, 6, 0), actor: 'UnitedHealthcare', actorType: 'payer', summary: '835 remit received — timely filing denial', detail: 'Claim denied: received after 90-day contractual filing limit. DOS 11/18/2025, received 02/27/2026.', amount: 2130.00, document: 'ERA_UHC_20260310.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-22, 6, 1), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-1198004 (HAR-009771) with 95% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-22, 6, 1), actor: 'System', actorType: 'system', summary: 'Routed to Timely Filing queue', detail: 'Routing rule: UHC + CARC-29 → Timely Filing worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-21, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Devon Ross', detail: 'Assigned for clearinghouse proof of timely filing research.' },
    { id: 'e5', type: 'action_note', timestamp: ts(-18, 11, 0), actor: 'Devon Ross', actorType: 'provider', summary: 'Clearinghouse transmission confirmed', detail: 'Obtained 277CA from Availity showing claim accepted 11/20/2025 — within 90 days of DOS. Pulling acceptance report to attach to appeal.' },
  ],

  // ── Minimal timelines for remaining denials ───────────────────────────────
  'DN-2026-0401': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-8, 7, 0), actor: 'Medicare', actorType: 'payer', summary: '835 remit received — coding adjustment', detail: 'Claim adjusted under CARC-4 due to ICD-10 principal diagnosis sequencing error.', amount: 892.50, document: 'ERA_MEDICARE_20260325.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-8, 7, 1), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-7712993 (HAR-662200) with 99% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-8, 7, 1), actor: 'System', actorType: 'system', summary: 'Routed to Coding queue', detail: 'Routing rule: Medicare + CARC-4 + ICD sequencing → Coding worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-7, 8, 30), actor: 'System', actorType: 'system', summary: 'Assigned to Daniel Forsythe', detail: 'Auto-assigned per Medicare coding rotation.' },
  ],
  'DN-2026-0358': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-5, 6, 30), actor: 'Cigna', actorType: 'payer', summary: '835 remit received — medical necessity denial', detail: 'Inpatient stay denied under Cigna clinical criteria. CARC-50 applied.', amount: 3210.75, document: 'ERA_CIGNA_20260328.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-5, 6, 31), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-5521334 (HAR-430887) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-5, 6, 31), actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: Cigna + CARC-50 → Med Nec worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-4, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Sarah Chen', detail: '' },
  ],
  'DN-2026-0344': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-6, 7, 15), actor: 'Medicaid', actorType: 'payer', summary: '835 remit received — eligibility denial', detail: 'Patient coverage inactive on DOS per Medicaid eligibility records. CARC-31 applied.', amount: 1450.00, document: 'ERA_MEDICAID_20260327.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-6, 7, 16), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-4408772 (HAR-321099) with 74% confidence — low confidence flag set.' },
    { id: 'e3', type: 'match_flagged', timestamp: ts(-6, 7, 16), actor: 'System', actorType: 'system', summary: 'Low-confidence match flagged', detail: 'Patient name/DOB match only. MRN and member ID not found in payer remit. Manual verification required before action.' },
    { id: 'e4', type: 'routing_applied', timestamp: ts(-6, 7, 16), actor: 'System', actorType: 'system', summary: 'Routed to Eligibility queue', detail: 'Routing rule: Medicaid + CARC-31 → Eligibility worklist.' },
    { id: 'e5', type: 'action_assign', timestamp: ts(-5, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Devon Ross', detail: '' },
  ],
  'DN-2026-0331': [
    { id: 'e1', type: 'signal_pdf_recoupment', timestamp: ts(-14, 8, 0), actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: 'Recoupment notice received', detail: 'BCBS audit identified overpayment of $8,920.00 on MS-DRG audit for DOS 1/30/2026. Response required within 30 days.', amount: 8920.00, document: 'BCBS_RECOUPMENT_CLM3317661.pdf' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-14, 8, 1), actor: 'System', actorType: 'system', summary: 'Recoupment instance created', detail: 'Matched to CLM-3317661 (HAR-210445) with 99% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-14, 8, 1), actor: 'System', actorType: 'system', summary: 'Routed to Recoupment queue', detail: 'Routing rule: BCBS recoupment → Recoupment worklist. Urgency flag applied.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-13, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Daniel Forsythe', detail: 'Self-assigned — Marcus leads BCBS recoupment disputes.' },
    { id: 'e5', type: 'action_records_requested', timestamp: ts(-12, 10, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Clinical documentation pull initiated', detail: 'Requested complete medical record from HIM for DOS 1/30/2026 admission.' },
  ],
  'DN-2026-0318': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-4, 7, 0), actor: 'Aetna', actorType: 'payer', summary: '835 remit received — DRG downgrade', detail: 'DRG downgraded from MS-DRG 470 to MS-DRG 483. $5,640 adjusted under CARC-4/N115.', amount: 5640.00, document: 'ERA_AETNA_20260329.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-4, 7, 1), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-2209115 (HAR-108334) with 98% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-4, 7, 1), actor: 'System', actorType: 'system', summary: 'Routed to DRG Downgrade queue', detail: 'Routing rule: Aetna + CARC-4 → DRG worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-3, 9, 30), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Priya Nair', detail: '' },
  ],
  'DN-2026-0292': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-3, 6, 0), actor: 'Humana', actorType: 'payer', summary: '835 remit received — length of stay denial', detail: 'Inpatient LOS exceeds Humana criteria. $9,820 denied under CARC-50/M86.', amount: 9820.00, document: 'ERA_HUMANA_20260330.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-3, 6, 1), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-0087213 (HAR-899002) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-3, 6, 1), actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: Humana + CARC-50 → Med Nec worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-2, 8, 0), actor: 'System', actorType: 'system', summary: 'Assigned to Sarah Chen', detail: 'Auto-assigned per Humana med nec rotation.' },
  ],
  'DN-2026-0261': [
    { id: 'e1', type: 'signal_835', timestamp: ts(-2, 6, 0), actor: 'Cigna', actorType: 'payer', summary: '835 remit received — administrative denial', detail: 'Billing NPI missing from claim submission. CARC-16 applied. Corrected claim accepted.', amount: 760.00, document: 'ERA_CIGNA_20260401.835' },
    { id: 'e2', type: 'instance_created', timestamp: ts(-2, 6, 1), actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-8765432 (HAR-677114) with 99% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: ts(-2, 6, 1), actor: 'System', actorType: 'system', summary: 'Routed to Administrative queue', detail: 'Routing rule: Cigna + CARC-16 → Admin worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: ts(-1, 9, 0), actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Devon Ross', detail: '' },
  ],

  // ── DN-2025-0847: Aetna Med Nec L1→L2→External Review→Overturned — Margaret Holloway ──
  'DN-2025-0847': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-07-28T07:02:00.000Z', actor: 'Aetna', actorType: 'payer', summary: '835 remit received — medical necessity denial', detail: 'Inpatient stay denied under CARC-50/M86. Aetna determined admission did not meet acute inpatient criteria. $8,940 denied.', amount: 8940.00, document: 'ERA_AETNA_20250728.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-07-28T07:03:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-8819001 (HAR-772001) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-07-28T07:03:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: Aetna + CARC-50 → Med Nec worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-07-29T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Sarah Chen', detail: 'Assigned during morning queue review.' },
    { id: 'e5', type: 'action_appeal_l1', timestamp: '2025-08-15T14:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Level 1 appeal submitted to Aetna', detail: 'Appeal submitted via Aetna provider portal with clinical documentation — attending physician statement, InterQual criteria review, and H&P. Confirmation #AET-APP-20250815-8819001.', document: 'L1_Appeal_CLM8819001.pdf' },
    { id: 'e6', type: 'payer_upheld', timestamp: '2025-09-05T11:00:00.000Z', actor: 'Aetna', actorType: 'payer', summary: 'Level 1 appeal upheld', detail: 'Aetna clinical review upheld denial. Level of care determination unchanged — InterQual criteria not met per payer review.' },
    { id: 'e7', type: 'action_appeal_l2', timestamp: '2025-09-20T10:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Level 2 appeal submitted to Aetna', detail: 'Escalated to L2 with additional specialist attestation and peer-reviewed literature supporting inpatient level of care for acute presentation.', document: 'L2_Appeal_CLM8819001.pdf' },
    { id: 'e8', type: 'payer_upheld', timestamp: '2025-10-02T09:00:00.000Z', actor: 'Aetna', actorType: 'payer', summary: 'Level 2 appeal upheld', detail: 'Aetna final internal denial upheld. Proceeding to external independent review.' },
    { id: 'e9', type: 'action_appeal_l3', timestamp: '2025-10-08T13:30:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'External review request submitted', detail: 'Case submitted to state-approved Independent Review Organization (IRO). All supporting clinical documentation transmitted electronically.', document: 'External_Review_Request_CLM8819001.pdf' },
    { id: 'e10', type: 'payer_overturned', timestamp: '2025-10-18T10:00:00.000Z', actor: 'IRO — MedStar Review', actorType: 'payer', summary: 'External review: denial overturned', detail: 'IRO determined inpatient level of care was medically appropriate for the acute presentation. Aetna directed to pay at MS-DRG billed rate. $8,940 recovery.' },
  ],

  // ── DN-2025-1201: UHC Med Nec L1→L2→Will Not Appeal — Raymond Castellano ──
  'DN-2025-1201': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-09-12T07:00:00.000Z', actor: 'UnitedHealthcare', actorType: 'payer', summary: '835 remit received — medical necessity denial', detail: 'CARC-50/M86. UHC determined inpatient admission clinically not justified. $6,200 denied.', amount: 6200.00, document: 'ERA_UHC_20250912.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-09-12T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-9901002 (HAR-880002) with 96% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-09-12T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: UHC + CARC-50 → Med Nec worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-09-13T09:30:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Priya Nair', detail: 'Assigned to UHC medical necessity specialist.' },
    { id: 'e5', type: 'action_appeal_l1', timestamp: '2025-10-01T11:00:00.000Z', actor: 'Priya Nair', actorType: 'provider', summary: 'Level 1 appeal submitted', detail: 'Appeal submitted with clinical notes, H&P, and attending physician attestation supporting medical necessity.', document: 'L1_Appeal_CLM9901002.pdf' },
    { id: 'e6', type: 'payer_upheld', timestamp: '2025-10-22T10:00:00.000Z', actor: 'UnitedHealthcare', actorType: 'payer', summary: 'Level 1 appeal upheld', detail: 'UHC clinical team upheld denial — observation criteria cited as appropriate level of care.' },
    { id: 'e7', type: 'action_appeal_l2', timestamp: '2025-11-04T14:00:00.000Z', actor: 'Priya Nair', actorType: 'provider', summary: 'Level 2 appeal submitted', detail: 'Escalated with peer-reviewed literature and secondary attestation from department chief.', document: 'L2_Appeal_CLM9901002.pdf' },
    { id: 'e8', type: 'payer_upheld', timestamp: '2025-11-25T09:00:00.000Z', actor: 'UnitedHealthcare', actorType: 'payer', summary: 'Level 2 appeal upheld — final internal', detail: 'UHC issued final internal denial. External review considered.' },
    { id: 'e9', type: 'action_note', timestamp: '2025-12-10T10:00:00.000Z', actor: 'Priya Nair', actorType: 'provider', summary: 'Decision: Will Not Appeal', detail: 'Finance and clinical team reviewed external review ROI. Expected recovery value ($6,200) below cost and effort threshold. Approved to close without external review.' },
  ],

  // ── DN-2025-0932: Medicare ADR → Closed/Escalated — Sylvia Moreau ──────────
  'DN-2025-0932': [
    { id: 'e1', type: 'signal_pdf_adr', timestamp: '2025-07-01T06:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Additional Documentation Request received', detail: 'Medicare ADR via eMDR mailbox requesting full medical records for DOS 6/15/2025 inpatient stay. 30-day response window.', document: 'MEDICARE_ADR_CLM9862003.pdf' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-07-01T06:01:00.000Z', actor: 'System', actorType: 'system', summary: 'ADR instance created', detail: 'Matched to CLM-9862003 (HAR-787003) with 99% confidence via eMDR document ID.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-07-01T06:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed: ADR → HealthSource', detail: 'Routing rule: Medicare ADR → HealthSource ROI workflow.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-07-02T08:15:00.000Z', actor: 'System', actorType: 'system', summary: 'Assigned to Daniel Forsythe', detail: 'Auto-assigned per Medicare ADR rotation.' },
    { id: 'e5', type: 'action_records_requested', timestamp: '2025-07-02T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Records request sent to HealthSource', detail: 'ADR metadata submitted to HealthSource ROI. Records retrieved and submitted to Medicare within deadline.', document: 'HealthSource_Request_HS-2025-0114.pdf' },
    { id: 'e6', type: 'action_records_submitted', timestamp: '2025-07-18T14:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Medical records submitted to Medicare', detail: 'Full clinical record transmitted to Medicare via esMD. Submission tracking #MCR-ESMD-2025-0718-003.' },
    { id: 'e7', type: 'payer_upheld', timestamp: '2025-08-20T11:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Medicare post-review: DRG downgrade issued', detail: 'Medicare clinical review determined MS-DRG 194 billed with MCC is not supported — MCC coded incorrectly. DRG downgraded to MS-DRG 195. Escalated to new denial instance DN-2025-0933.' },
    { id: 'e8', type: 'action_note', timestamp: '2025-08-20T13:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Case escalated to DRG dispute', detail: 'ADR response completed. Medicare issued DRG downgrade as a result of records review. New denial DN-2025-0933 created for dispute workflow. This ADR case closed.' },
  ],

  // ── DN-2025-0933: Medicare DRG Downgrade L1→L2→Overturned — Sylvia Moreau ──
  'DN-2025-0933': [
    { id: 'e1', type: 'signal_pdf_denial', timestamp: '2025-08-20T11:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'DRG downgrade notice received post-ADR review', detail: 'Medicare issued DRG downgrade from MS-DRG 194 (with MCC) to MS-DRG 195 following records review from ADR (DN-2025-0932). $3,840 adjusted.', amount: 3840.00, document: 'MCR_DRG_DOWNGRADE_CLM9862004.pdf' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-08-20T13:00:00.000Z', actor: 'System', actorType: 'system', summary: 'DRG Downgrade instance created', detail: 'Linked from ADR denial DN-2025-0932. Matched to CLM-9862004 (HAR-787003).' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-08-20T13:00:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to DRG Downgrade queue', detail: 'Routing rule: Medicare + CARC-4 + DRG → DRG Downgrade worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-08-21T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Daniel Forsythe (continuity from ADR)', detail: 'Self-assigned — maintains continuity with ADR case.' },
    { id: 'e5', type: 'action_note', timestamp: '2025-08-25T10:30:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Clinical review — MCC dispute identified', detail: 'CDI review confirms J18.9 (pneumonia) coded as secondary diagnosis IS a valid MCC under CMS grouper rules. MCC coding was correct. Drafting appeal.' },
    { id: 'e6', type: 'action_appeal_l1', timestamp: '2025-09-05T14:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Level 1 appeal submitted to Medicare', detail: 'Submitted via esMD with coding attestation, attending letter, and CMS grouper documentation supporting MCC classification.', document: 'L1_Appeal_CLM9862004.pdf' },
    { id: 'e7', type: 'payer_upheld', timestamp: '2025-09-30T10:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Level 1 appeal upheld', detail: 'Medicare Contractor upheld downgrade. Escalating to L2 Qualified Independent Contractor (QIC) review.' },
    { id: 'e8', type: 'action_appeal_l2', timestamp: '2025-10-10T11:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Level 2 QIC appeal submitted', detail: 'Full record and augmented coding analysis submitted to QIC. Highlighted CMS IOM guidance on J18.9 MCC classification.', document: 'L2_QIC_Appeal_CLM9862004.pdf' },
    { id: 'e9', type: 'payer_overturned', timestamp: '2025-10-30T09:00:00.000Z', actor: 'QIC — C2C Innovative Solutions', actorType: 'payer', summary: 'Level 2 QIC: denial overturned', detail: 'QIC determined J18.9 pneumonia as complicating comorbidity qualifies as MCC. MS-DRG 194 restored. $3,840 payment ordered.' },
  ],

  // ── DN-2025-1089: Cigna Auth P2P→Overturned — James Okafor ─────────────────
  'DN-2025-1089': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-10-22T06:30:00.000Z', actor: 'Cigna', actorType: 'payer', summary: '835 remit received — authorization denial', detail: 'CARC-15/N130. No prior authorization on file for inpatient admission DOS 10/15/2025. $9,450 denied.', amount: 9450.00, document: 'ERA_CIGNA_20251022.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-10-22T06:31:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-6618005 (HAR-558005) with 98% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-10-22T06:31:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Authorization queue', detail: 'Routing rule: Cigna + CARC-15 → Auth worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-10-23T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Priya Nair', detail: 'Assigned to Cigna authorization specialist.' },
    { id: 'e5', type: 'action_note', timestamp: '2025-10-28T11:00:00.000Z', actor: 'Priya Nair', actorType: 'provider', summary: 'Retroactive authorization request submitted', detail: 'Submitted retro-auth request to Cigna with admission documentation and clinical necessity statement. Cigna denied retro-auth — no emergent exception applicable.' },
    { id: 'e6', type: 'action_appeal_l1', timestamp: '2025-11-10T14:00:00.000Z', actor: 'Priya Nair', actorType: 'provider', summary: 'Level 1 appeal with P2P request submitted', detail: 'L1 appeal submitted via Cigna portal. P2P review with Cigna medical director requested for clinical discussion.', document: 'L1_Appeal_CLM6618005.pdf' },
    { id: 'e7', type: 'action_peer_to_peer', timestamp: '2025-11-20T13:00:00.000Z', actor: 'Dr. Marcus Osei, MD', actorType: 'provider', summary: 'Peer-to-peer with Cigna medical director', detail: 'Attending physician presented acute clinical findings — sepsis workup, hemodynamic instability — justifying emergent inpatient admission without prior auth. Cigna MD agreed.' },
    { id: 'e8', type: 'payer_overturned', timestamp: '2025-12-08T10:00:00.000Z', actor: 'Cigna', actorType: 'payer', summary: 'Appeal overturned after P2P', detail: 'Cigna accepted emergent admission exception following peer-to-peer. Authorization issued retroactively. $9,450 payment released.' },
  ],

  // ── DN-2025-1156: BCBS Auth L1→Will Not Appeal — Carolyn Brandt ─────────────
  'DN-2025-1156': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-11-08T07:00:00.000Z', actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: '835 remit received — authorization denial', detail: 'CARC-15. Service not authorized — no valid authorization number on file. $2,100 denied.', amount: 2100.00, document: 'ERA_BCBS_20251108.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-11-08T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-5504006 (HAR-429006) with 98% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-11-08T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Authorization queue', detail: 'Routing rule: BCBS + CARC-15 → Auth worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-11-09T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Sarah Chen', detail: '' },
    { id: 'e5', type: 'action_appeal_l1', timestamp: '2025-11-25T14:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Level 1 appeal submitted', detail: 'L1 appeal submitted with authorization request documentation and clinical necessity letter.', document: 'L1_Appeal_CLM5504006.pdf' },
    { id: 'e6', type: 'payer_upheld', timestamp: '2025-12-18T10:00:00.000Z', actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: 'Level 1 appeal upheld', detail: 'BCBS upheld denial — no retroactive authorization pathway under contract terms. Auth gap was provider error.' },
    { id: 'e7', type: 'action_note', timestamp: '2026-01-20T10:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Decision: Will Not Appeal', detail: 'External review cost ($800+ filing fee) exceeds denied amount net of expected recovery. Finance approved write-off. Case closed.' },
  ],

  // ── DN-2025-0788: Medicare Recoupment Dispute→Partial Settlement — Nancy Whitfield ──
  'DN-2025-0788': [
    { id: 'e1', type: 'signal_pdf_recoupment', timestamp: '2025-08-18T08:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Recoupment demand received — post-payment audit', detail: 'Medicare post-payment audit identified alleged overpayment of $12,400 on DOS 8/10/2025 inpatient stay. 30-day response window.', amount: 12400.00, document: 'MCR_RECOUPMENT_CLM3302007.pdf' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-08-18T08:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Recoupment instance created', detail: 'Matched to CLM-3302007 (HAR-209007) with 99% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-08-18T08:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Recoupment queue', detail: 'Routing rule: Medicare recoupment → Recoupment worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-08-19T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Daniel Forsythe', detail: 'Self-assigned — Medicare recoupment specialist.' },
    { id: 'e5', type: 'action_records_requested', timestamp: '2025-08-20T10:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Clinical documentation pull initiated', detail: 'Full medical record requested from HIM for DOS 8/10/2025 admission for dispute package.' },
    { id: 'e6', type: 'action_appeal_l1', timestamp: '2025-09-05T14:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Formal dispute submitted to Medicare', detail: 'Dispute letter with complete clinical record submitted to Medicare via certified mail. Documentation supports medical necessity and coding accuracy.', document: 'Dispute_Letter_CLM3302007.pdf' },
    { id: 'e7', type: 'action_note', timestamp: '2025-10-15T11:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Settlement offer received from Medicare', detail: 'Medicare offered partial settlement: $6,200 repayment in lieu of full $12,400. Finance and legal reviewed — accepted as favorable given litigation risk.' },
    { id: 'e8', type: 'payer_partial', timestamp: '2025-11-14T09:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Partial settlement finalized', detail: '$6,200 remitted to Medicare. Medicare issued written confirmation of settlement and case closure. $6,200 written off.' },
  ],

  // ── DN-2025-1302: Aetna Timely Filing Defense Accepted — Helen Nakamura ──────
  'DN-2025-1302': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-07-15T07:00:00.000Z', actor: 'Aetna', actorType: 'payer', summary: '835 remit received — timely filing denial', detail: 'CARC-29. Aetna records show claim received outside 180-day filing window. DOS 5/10/2025. $3,100 denied.', amount: 3100.00, document: 'ERA_AETNA_20250715.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-07-15T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-1188008 (HAR-008008) with 96% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-07-15T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Timely Filing queue', detail: 'Routing rule: Aetna + CARC-29 → Timely Filing worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-07-16T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Devon Ross', detail: 'Assigned to timely filing research specialist.' },
    { id: 'e5', type: 'action_note', timestamp: '2025-07-22T11:00:00.000Z', actor: 'Devon Ross', actorType: 'provider', summary: 'Clearinghouse research complete', detail: 'Availity 277-CA shows claim accepted by Aetna clearinghouse on 7/2/2025 — within the 180-day window from DOS 5/10/2025. Defense package ready.' },
    { id: 'e6', type: 'action_appeal_l1', timestamp: '2025-08-01T13:00:00.000Z', actor: 'Devon Ross', actorType: 'provider', summary: 'Timely filing defense submitted', detail: 'Defense submitted via Aetna portal with 277-CA acceptance report as proof of timely transmission.', document: 'TimeFiling_Defense_CLM1188008.pdf' },
    { id: 'e7', type: 'payer_overturned', timestamp: '2025-09-02T10:00:00.000Z', actor: 'Aetna', actorType: 'payer', summary: 'Defense accepted — denial reversed', detail: 'Aetna confirmed 277-CA acceptance date validates timely filing. Denial reversed. $3,100 payment released.' },
  ],

  // ── DN-2026-0044: BCBS Coding Error Corrected→Paid — Dorothy Kim ─────────────
  'DN-2026-0044': [
    { id: 'e1', type: 'signal_835', timestamp: '2025-12-01T07:00:00.000Z', actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: '835 remit received — coding adjustment', detail: 'CARC-4. ICD-10 principal diagnosis sequencing error — primary and secondary diagnoses transposed. $1,240 adjusted.', amount: 1240.00, document: 'ERA_BCBS_20251201.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2025-12-01T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-7700009 (HAR-661009) with 99% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2025-12-01T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Coding queue', detail: 'Routing rule: BCBS + CARC-4 + sequencing → Coding worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2025-12-02T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Daniel Forsythe', detail: '' },
    { id: 'e5', type: 'action_note', timestamp: '2025-12-10T10:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'CDI review completed — sequencing corrected', detail: 'CDI confirmed E11.65 (Type 2 DM with hyperglycemia) should be secondary to I50.9 (Heart failure). Corrected claim prepared.' },
    { id: 'e6', type: 'action_resubmit', timestamp: '2025-12-15T14:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Corrected claim submitted via clearinghouse', detail: 'Corrected claim submitted to BCBS via Change Healthcare clearinghouse. 277-CA acknowledgment received.', document: 'Corrected_Claim_CLM7700009.txt' },
    { id: 'e7', type: 'payer_overturned', timestamp: '2026-01-08T11:00:00.000Z', actor: 'Blue Cross Blue Shield', actorType: 'payer', summary: 'Corrected claim processed — payment received', detail: 'BCBS processed corrected claim with proper sequencing. $1,240 paid in full.' },
  ],

  // ── DN-2026-0077: Medicaid Eligibility→Secondary Medicare→Paid — Louis Tremblay ──
  'DN-2026-0077': [
    { id: 'e1', type: 'signal_835', timestamp: '2026-01-08T07:15:00.000Z', actor: 'Medicaid', actorType: 'payer', summary: '835 remit received — eligibility denial', detail: 'CARC-31. Patient coverage shown inactive on DOS 12/10/2025. $2,340 denied.', amount: 2340.00, document: 'ERA_MEDICAID_20260108.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2026-01-08T07:16:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-4396010 (HAR-319010) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2026-01-08T07:16:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Eligibility queue', detail: 'Routing rule: Medicaid + CARC-31 → Eligibility worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2026-01-09T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Devon Ross', detail: '' },
    { id: 'e5', type: 'action_note', timestamp: '2026-01-14T11:00:00.000Z', actor: 'Devon Ross', actorType: 'provider', summary: 'Eligibility verification: Medicaid lapsed, Medicare primary', detail: 'Confirmed Medicaid coverage ended 12/1/2025. Patient enrolled in Medicare Part A effective 11/1/2025. Medicare is primary payer for DOS 12/10/2025.' },
    { id: 'e6', type: 'action_resubmit', timestamp: '2026-01-20T13:00:00.000Z', actor: 'Devon Ross', actorType: 'provider', summary: 'Claim billed to Medicare as primary', detail: 'Original Medicaid claim crossed to Medicare via clearinghouse crossover. Medicare claim submitted.' },
    { id: 'e7', type: 'payer_overturned', timestamp: '2026-02-20T10:00:00.000Z', actor: 'Medicare', actorType: 'payer', summary: 'Medicare paid in full', detail: 'Medicare processed and paid $2,340 in full. Secondary billing not required.' },
  ],

  // ── DN-2026-0103: Cigna Med Nec L1→Will Not Appeal — Franklin Pierce ─────────
  'DN-2026-0103': [
    { id: 'e1', type: 'signal_835', timestamp: '2026-01-15T07:00:00.000Z', actor: 'Cigna', actorType: 'payer', summary: '835 remit received — medical necessity denial', detail: 'CARC-50. Cigna LOS criteria not met — extended stay beyond criteria day. $4,100 denied.', amount: 4100.00, document: 'ERA_CIGNA_20260115.835' },
    { id: 'e2', type: 'instance_created', timestamp: '2026-01-15T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Denial instance created', detail: 'Matched to CLM-0075011 (HAR-897011) with 97% confidence.' },
    { id: 'e3', type: 'routing_applied', timestamp: '2026-01-15T07:01:00.000Z', actor: 'System', actorType: 'system', summary: 'Routed to Medical Necessity queue', detail: 'Routing rule: Cigna + CARC-50 → Med Nec worklist.' },
    { id: 'e4', type: 'action_assign', timestamp: '2026-01-16T09:00:00.000Z', actor: 'Daniel Forsythe', actorType: 'provider', summary: 'Assigned to Sarah Chen', detail: '' },
    { id: 'e5', type: 'action_appeal_l1', timestamp: '2026-02-01T14:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Level 1 appeal submitted', detail: 'Appeal submitted with attending attestation and extended LOS justification documentation.', document: 'L1_Appeal_CLM0075011.pdf' },
    { id: 'e6', type: 'payer_upheld', timestamp: '2026-02-25T10:00:00.000Z', actor: 'Cigna', actorType: 'payer', summary: 'Level 1 appeal upheld', detail: 'Cigna clinical review upheld — extended LOS criteria not met per InterQual. Discharge planning notes indicate criteria were not clearly documented.' },
    { id: 'e7', type: 'action_note', timestamp: '2026-03-15T10:00:00.000Z', actor: 'Sarah Chen', actorType: 'provider', summary: 'Decision: Will Not Appeal', detail: 'L2 reviewed with finance. Recovery probability at L2 assessed at <30%. $4,100 denied amount is below external review filing cost threshold. Approved to close.' },
  ],
}

// ─── Submission Episodes ───────────────────────────────────────────────────────

export type DeliveryMethod = 'fax' | 'mail' | 'portal' | 'esmd' | 'clearinghouse' | 'phone'

export type AttachmentType = '835_remit' | 'pdf_denial' | 'pdf_adr' | 'pdf_recoupment' | 'report_277' | 'document'

export interface EpisodeAttachment {
  type: AttachmentType
  label: string
  ref?: string   // denialId for 835_remit; filename/tracking ref for others
}

export interface EpisodeSignal {
  label: string
  date: string
  source?: string
  description?: string
  attachments?: EpisodeAttachment[]
}

export interface EpisodeAction {
  label: string
  date: string
  method: DeliveryMethod
  vendor?: string
  reference?: string
  notes?: string
  attachments?: EpisodeAttachment[]
}

export interface EpisodeResult {
  label: string
  date: string
  description?: string
  source?: string
  attachments?: EpisodeAttachment[]
}

export interface SubmissionEpisode {
  id: string
  round: string
  openedAt: string
  signal?: EpisodeSignal
  action?: EpisodeAction
  result?: EpisodeResult
}

export const SUBMISSION_EPISODES: Record<string, SubmissionEpisode[]> = {

  'DN-2026-0412': [
    {
      id: 'ep-0412-1',
      round: 'Initial Denial',
      openedAt: '2026-03-15',
      signal: {
        label: '835 Remittance — DRG Downgrade',
        date: '2026-03-15',
        source: 'EFT-20260315-BCBS-441',
        description: 'MS-DRG 291 billed, paid as MS-DRG 292. CARC-4 / N115. $4,210.00 adjusted.',
        attachments: [
          { type: '835_remit',   label: '835 Remittance',     ref: 'DN-2026-0412' },
          { type: 'pdf_denial',  label: 'BCBS_DENIAL_CLM8847291.pdf' },
        ],
      },
    },
  ],

  'DN-2026-0389': [
    {
      id: 'ep-0389-1',
      round: 'Medical Necessity Denial',
      openedAt: '2026-03-18',
      signal: {
        label: 'Denial Letter — Inpatient Stay Not Justified',
        date: '2026-03-18',
        source: 'AET-LTR-20260318-9920441',
        description: 'CARC-50 / M86. Payer determined inpatient level of care was not medically warranted. $12,480.00 denied.',
        attachments: [
          { type: 'pdf_denial', label: 'AET-LTR-20260318-9920441.pdf' },
          { type: '835_remit',  label: '835 Remittance', ref: 'DN-2026-0389' },
        ],
      },
    },
  ],

  'DN-2026-0401': [
    {
      id: 'ep-0401-1',
      round: 'Initial Denial',
      openedAt: '2026-02-28',
      signal: {
        label: '835 Remittance — ICD-10 Sequencing Error',
        date: '2026-02-28',
        source: 'EFT-20260228-MCR-771',
        description: 'CARC-4. Principal diagnosis sequencing flagged. $892.50 adjusted.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0401' },
        ],
      },
      action: {
        label: 'Corrected Claim Prepared',
        date: '2026-04-01',
        method: 'clearinghouse',
        vendor: 'Change Healthcare',
        reference: 'CHC-CX-20260401-7712993',
        notes: 'DX sequencing corrected per CDI review. Pending submission acknowledgment.',
        attachments: [
          { type: 'document', label: 'Corrected_Claim_CLM7712993.txt', ref: 'CHC-CX-20260401-7712993' },
        ],
      },
    },
  ],

  'DN-2026-0377': [
    {
      id: 'ep-0377-1',
      round: 'Authorization Denial',
      openedAt: '2026-03-23',
      signal: {
        label: 'Denial Letter — No Prior Authorization on File',
        date: '2026-03-23',
        source: 'UHC-LTR-20260323-6634882',
        description: 'CARC-15 / N130. No authorization found for inpatient admission DOS 3/1/2026. $6,750.00 denied.',
        attachments: [
          { type: 'pdf_denial', label: 'UHC-LTR-20260323-6634882.pdf' },
          { type: '835_remit',  label: '835 Remittance', ref: 'DN-2026-0377' },
        ],
      },
      action: {
        label: 'Level 1 Appeal Submitted',
        date: '2026-03-31',
        method: 'portal',
        vendor: 'UnitedHealthcare Provider Portal',
        reference: 'UHC-APP-20260331-6634882',
        notes: 'Submission failed — payer ID mismatch detected by clearinghouse. Correct routing confirmed. Resubmitting.',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM6634882.pdf', ref: 'UHC-APP-20260331-6634882' },
        ],
      },
    },
  ],

  'DN-2026-0358': [
    {
      id: 'ep-0358-1',
      round: 'Medical Necessity Denial',
      openedAt: '2026-03-28',
      signal: {
        label: 'Denial Letter — Inpatient Criteria Not Met',
        date: '2026-03-28',
        source: 'CGN-LTR-20260328-5521334',
        description: 'CARC-50. Cigna InterQual criteria not satisfied for inpatient admission. $3,210.75 denied.',
        attachments: [
          { type: 'pdf_denial', label: 'CGN-LTR-20260328-5521334.pdf' },
        ],
      },
    },
  ],

  'DN-2026-0344': [
    {
      id: 'ep-0344-1',
      round: 'Eligibility Denial',
      openedAt: '2026-03-27',
      signal: {
        label: '835 Remittance — Coverage Inactive on DOS',
        date: '2026-03-27',
        source: 'EFT-20260327-MCD-509',
        description: 'CARC-31. Medicaid coverage shown as inactive on DOS 3/5/2026. Low-confidence patient match flagged. $1,450.00 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0344' },
        ],
      },
      action: {
        label: 'Eligibility Verification Initiated',
        date: '2026-03-28',
        method: 'phone',
        vendor: 'State Medicaid Office',
        notes: 'Calling to confirm coverage status and potential dual eligibility on DOS. Patient identity verification also required.',
      },
    },
  ],

  'DN-2026-0331': [
    {
      id: 'ep-0331-1',
      round: 'Recoupment Demand',
      openedAt: '2026-03-19',
      signal: {
        label: 'Recoupment Notice — MS-DRG Audit',
        date: '2026-03-19',
        source: 'BCBS-RCQ-20260319-CLM3317661',
        description: 'CARC-45. BCBS post-payment audit identified overpayment on MS-DRG assignment for DOS 1/30/2026. $8,920.00 recoupment demanded.',
        attachments: [
          { type: 'pdf_recoupment', label: 'BCBS-RCQ-20260319-CLM3317661.pdf' },
        ],
      },
      action: {
        label: 'Dispute Letter with Clinical Documentation',
        date: '2026-03-28',
        method: 'mail',
        vendor: 'HIM Department',
        reference: 'USPS-9400111899223456781234',
        notes: 'Full medical record and physician attestation compiled. Formal dispute submitted via certified mail.',
        attachments: [
          { type: 'document', label: 'Dispute_Letter_CLM3317661.pdf' },
          { type: 'document', label: 'Clinical_Records_HAR210445.pdf' },
        ],
      },
    },
  ],

  'DN-2026-0318': [
    {
      id: 'ep-0318-1',
      round: 'Initial Denial',
      openedAt: '2026-03-29',
      signal: {
        label: '835 Remittance — DRG Downgrade',
        date: '2026-03-29',
        source: 'EFT-20260329-AET-220',
        description: 'MS-DRG 470 billed, paid as MS-DRG 483. CARC-4 / N115. $5,640.00 adjusted.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0318' },
        ],
      },
    },
  ],

  'DN-2026-0305': [
    {
      id: 'ep-0305-1',
      round: 'Timely Filing Denial',
      openedAt: '2026-03-11',
      signal: {
        label: 'Denial Letter — Claim Received After 90-Day Limit',
        date: '2026-03-11',
        source: 'UHC-LTR-20260311-2209115',
        description: 'CARC-29. Payer records show claim received outside 90-day filing window. Original transmission Nov 18, 2025 per clearinghouse. $2,130.00 denied.',
        attachments: [
          { type: 'pdf_denial', label: 'UHC-LTR-20260311-2209115.pdf' },
        ],
      },
      action: {
        label: 'Timely Filing Appeal with 277 Acknowledgment',
        date: '2026-04-01',
        method: 'portal',
        vendor: 'UnitedHealthcare Provider Portal',
        reference: 'UHC-APP-20260401-2209115',
        notes: 'Attaching 277-CA acknowledgment as proof of timely Nov 18 transmission. Deadline Apr 4.',
        attachments: [
          { type: 'report_277', label: '277-CA-20251118-UHC.edi' },
          { type: 'document',   label: 'L1_Appeal_CLM2209115.pdf', ref: 'UHC-APP-20260401-2209115' },
        ],
      },
    },
  ],

  'DN-2026-0292': [
    {
      id: 'ep-0292-1',
      round: 'Medical Necessity Denial',
      openedAt: '2026-03-30',
      signal: {
        label: 'Denial Letter — Length of Stay Exceeds Criteria',
        date: '2026-03-30',
        source: 'HUM-LTR-20260330-0087213',
        description: 'CARC-50 / M86. Humana criteria not met for LOS beyond day 4. $9,820.00 denied.',
        attachments: [
          { type: 'pdf_denial', label: 'HUM-LTR-20260330-0087213.pdf' },
        ],
      },
    },
  ],

  'DN-2026-0278': [
    {
      id: 'ep-0278-1',
      round: 'ADR Request',
      openedAt: '2026-03-21',
      signal: {
        label: 'Additional Documentation Request',
        date: '2026-03-21',
        source: 'MCR-ADR-20260321-9876541',
        description: 'CARC-18. Medicare requesting clinical documentation to support medical necessity for DOS 2/10/2026 admission.',
        attachments: [
          { type: 'pdf_adr', label: 'MCR-ADR-20260321-9876541.pdf' },
        ],
      },
      action: {
        label: 'Medical Records Requested',
        date: '2026-03-23',
        method: 'fax',
        vendor: 'HealthSource',
        reference: 'HS-REQ-44821',
        notes: 'Records not yet retrieved after 12 days. Escalation sent to HealthSource on Apr 1.',
        attachments: [
          { type: 'document', label: 'HealthSource_Request_HS44821.pdf', ref: 'HS-REQ-44821' },
        ],
      },
    },
  ],

  'DN-2026-0261': [
    {
      id: 'ep-0261-1',
      round: 'Administrative Denial',
      openedAt: '2026-03-31',
      signal: {
        label: '835 Remittance — Missing Billing NPI',
        date: '2026-03-31',
        source: 'EFT-20260331-CGN-876',
        description: 'CARC-16. Billing NPI absent from claim loop 2010BB. $760.00 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0261' },
        ],
      },
      action: {
        label: 'Corrected Claim Submitted',
        date: '2026-04-01',
        method: 'clearinghouse',
        vendor: 'Change Healthcare',
        reference: 'CHC-CX-20260401-8765432',
        notes: 'NPI added to billing provider loop. Awaiting 277-CA acknowledgment.',
        attachments: [
          { type: 'document', label: 'Corrected_Claim_CLM8765432.txt', ref: 'CHC-CX-20260401-8765432' },
        ],
      },
    },
  ],

  // ── Historical resolved/closed records ────────────────────────────────────

  'DN-2025-0847': [
    {
      id: 'ep-0847-1',
      round: 'Initial Denial',
      openedAt: '2025-07-28',
      signal: {
        label: '835 Remittance — Medical Necessity Denial',
        date: '2025-07-28',
        source: 'EFT-20250728-AET-881',
        description: 'CARC-50 / M86. Aetna denied inpatient stay as not medically necessary. $8,940.00 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2025-0847' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Appeal',
        date: '2025-08-15',
        description: 'Denial reviewed internally. Decision made to pursue Level 1 appeal with clinical documentation.',
      },
    },
    {
      id: 'ep-0847-2',
      round: 'Level 1 Appeal',
      openedAt: '2025-08-15',
      signal: {
        label: 'L1 Appeal Submitted',
        date: '2025-08-15',
        source: 'AET-APP-20250815-8819001',
        description: 'Level 1 appeal submitted with clinical documentation and attending physician statement.',
      },
      action: {
        label: 'Level 1 Appeal',
        date: '2025-08-15',
        method: 'portal',
        vendor: 'Aetna Provider Portal',
        reference: 'AET-APP-20250815-8819001',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM8819001.pdf', ref: 'AET-APP-20250815-8819001' },
        ],
      },
      result: {
        label: 'Upheld',
        date: '2025-09-05',
        description: 'Aetna upheld denial — InterQual criteria not met per internal clinical review.',
      },
    },
    {
      id: 'ep-0847-3',
      round: 'Level 2 Appeal',
      openedAt: '2025-09-20',
      signal: {
        label: 'L1 Upheld — Escalating to Level 2',
        date: '2025-09-05',
        source: 'Aetna Clinical Review Decision 2025-09-05',
        description: 'Aetna internal clinical review upheld the denial. Proceeding with Level 2 escalation.',
      },
      action: {
        label: 'Level 2 Appeal',
        date: '2025-09-20',
        method: 'portal',
        vendor: 'Aetna Provider Portal',
        reference: 'AET-APP-20250920-8819001-L2',
        attachments: [
          { type: 'document', label: 'L2_Appeal_CLM8819001.pdf', ref: 'AET-APP-20250920-8819001-L2' },
        ],
      },
      result: {
        label: 'Upheld — Final Internal',
        date: '2025-10-02',
        description: 'Aetna final internal denial upheld. Proceeding to external review.',
      },
    },
    {
      id: 'ep-0847-4',
      round: 'External Independent Review',
      openedAt: '2025-10-08',
      signal: {
        label: 'L2 Upheld — Escalating to External IRO',
        date: '2025-10-02',
        source: 'Aetna Final Internal Denial 2025-10-02',
        description: 'Aetna issued final internal denial. Case referred to state-approved Independent Review Organization.',
      },
      action: {
        label: 'External Review (IRO)',
        date: '2025-10-08',
        method: 'esmd',
        vendor: 'MedStar Review (IRO)',
        reference: 'IRO-2025-1008-MED-847',
        attachments: [
          { type: 'document', label: 'External_Review_Request_CLM8819001.pdf', ref: 'IRO-2025-1008-MED-847' },
        ],
      },
      result: {
        label: 'Overturned',
        date: '2025-10-18',
        description: 'IRO determined inpatient level of care was medically appropriate. Aetna directed to pay. $8,940 recovered.',
        source: 'MedStar Review — Final Determination Letter 2025-10-18',
      },
    },
  ],

  'DN-2025-1201': [
    {
      id: 'ep-1201-1',
      round: 'Initial Denial',
      openedAt: '2025-09-12',
      signal: {
        label: '835 Remittance — Medical Necessity Denial',
        date: '2025-09-12',
        source: 'EFT-20250912-UHC-990',
        description: 'CARC-50 / M86. UHC denied inpatient admission. $6,200.00 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2025-1201' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Appeal',
        date: '2025-10-01',
        description: 'Denial reviewed internally. Level 1 appeal approved with clinical documentation package.',
      },
    },
    {
      id: 'ep-1201-2',
      round: 'Level 1 Appeal',
      openedAt: '2025-10-01',
      action: {
        label: 'Level 1 Appeal',
        date: '2025-10-01',
        method: 'portal',
        vendor: 'UHC Provider Portal',
        reference: 'UHC-APP-20251001-9901002',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM9901002.pdf', ref: 'UHC-APP-20251001-9901002' },
        ],
      },
      result: {
        label: 'Upheld',
        date: '2025-10-22',
        description: 'UHC upheld denial — observation criteria cited as appropriate level of care.',
      },
    },
    {
      id: 'ep-1201-3',
      round: 'Level 2 Appeal',
      openedAt: '2025-11-04',
      signal: {
        label: 'L1 Upheld — Escalating to Level 2',
        date: '2025-10-22',
        source: 'UHC Clinical Review Decision 2025-10-22',
        description: 'UHC upheld denial citing observation criteria. Proceeding with Level 2 escalation.',
      },
      action: {
        label: 'Level 2 Appeal',
        date: '2025-11-04',
        method: 'portal',
        vendor: 'UHC Provider Portal',
        reference: 'UHC-APP-20251104-9901002-L2',
        attachments: [
          { type: 'document', label: 'L2_Appeal_CLM9901002.pdf', ref: 'UHC-APP-20251104-9901002-L2' },
        ],
      },
      result: {
        label: 'Upheld — Final Internal / Will Not Appeal',
        date: '2025-12-10',
        description: 'UHC issued final denial. ROI analysis: external review cost exceeds recovery value. Closed per finance approval.',
      },
    },
  ],

  'DN-2025-0932': [
    {
      id: 'ep-0932-1',
      round: 'ADR Request',
      openedAt: '2025-07-01',
      signal: {
        label: 'Additional Documentation Request',
        date: '2025-07-01',
        source: 'MCR-ADR-20250701-9862003',
        description: 'CARC-18. Medicare requesting full clinical records for DOS 6/15/2025 inpatient stay.',
        attachments: [
          { type: 'pdf_adr', label: 'MCR-ADR-20250701-9862003.pdf' },
        ],
      },
      action: {
        label: 'Medical Records Submitted via HealthSource',
        date: '2025-07-18',
        method: 'esmd',
        vendor: 'HealthSource',
        reference: 'MCR-ESMD-2025-0718-003',
        notes: 'Records retrieved and submitted within 30-day ADR window.',
        attachments: [
          { type: 'document', label: 'HealthSource_Submission_HS-2025-0114.pdf', ref: 'HS-REQ-2025-0114' },
        ],
      },
      result: {
        label: 'DRG Downgrade Issued — Escalated',
        date: '2025-08-20',
        description: 'Medicare post-review issued DRG downgrade. Case escalated to DN-2025-0933 for dispute.',
        source: 'MCR DRG Downgrade Notice 2025-08-20',
      },
    },
  ],

  'DN-2025-0933': [
    {
      id: 'ep-0933-1',
      round: 'Initial DRG Downgrade (from ADR)',
      openedAt: '2025-08-20',
      signal: {
        label: 'DRG Downgrade Notice — Post-ADR Review',
        date: '2025-08-20',
        source: 'MCR-DRG-20250820-9862004',
        description: 'Medicare downgraded MS-DRG 194 → 195 following ADR records review. $3,840 adjusted. Related ADR: DN-2025-0932.',
        attachments: [
          { type: 'pdf_denial', label: 'MCR_DRG_DOWNGRADE_CLM9862004.pdf' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Redetermination',
        date: '2025-09-05',
        description: 'DRG downgrade disputed. Level 1 Redetermination appeal filed with Medicare contractor.',
      },
    },
    {
      id: 'ep-0933-2',
      round: 'Level 1 Appeal (Redetermination)',
      openedAt: '2025-09-05',
      action: {
        label: 'L1 Redetermination Appeal',
        date: '2025-09-05',
        method: 'esmd',
        vendor: 'Medicare esMD',
        reference: 'MCR-RDET-20250905-9862004',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM9862004.pdf', ref: 'MCR-RDET-20250905-9862004' },
        ],
      },
      result: {
        label: 'Upheld',
        date: '2025-09-30',
        description: 'Medicare Contractor upheld DRG downgrade. Escalating to QIC L2.',
      },
    },
    {
      id: 'ep-0933-3',
      round: 'Level 2 Appeal (QIC)',
      openedAt: '2025-10-10',
      signal: {
        label: 'L1 Upheld — Escalating to QIC',
        date: '2025-09-30',
        source: 'Medicare Contractor Redetermination 2025-09-30',
        description: 'Medicare Contractor upheld DRG downgrade. Escalating to Qualified Independent Contractor (QIC) for L2 review.',
      },
      action: {
        label: 'L2 QIC Appeal',
        date: '2025-10-10',
        method: 'mail',
        vendor: 'C2C Innovative Solutions (QIC)',
        reference: 'QIC-C2C-20251010-9862004',
        attachments: [
          { type: 'document', label: 'L2_QIC_Appeal_CLM9862004.pdf', ref: 'QIC-C2C-20251010-9862004' },
        ],
      },
      result: {
        label: 'Overturned',
        date: '2025-10-30',
        description: 'QIC overturned downgrade — MS-DRG 194 restored. $3,840 recovered.',
        source: 'C2C Innovative Solutions QIC Decision 2025-10-30',
      },
    },
  ],

  'DN-2025-1089': [
    {
      id: 'ep-1089-1',
      round: 'Initial Denial',
      openedAt: '2025-10-22',
      signal: {
        label: '835 Remittance — Authorization Denial',
        date: '2025-10-22',
        source: 'EFT-20251022-CGN-661',
        description: 'CARC-15 / N130. No prior authorization on file. $9,450 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2025-1089' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Appeal with Peer-to-Peer',
        date: '2025-11-10',
        description: 'Retroactive authorization denied. Proceeding with L1 appeal and peer-to-peer review request with Cigna medical director.',
      },
    },
    {
      id: 'ep-1089-2',
      round: 'Level 1 Appeal with Peer-to-Peer',
      openedAt: '2025-11-10',
      action: {
        label: 'L1 Appeal + Peer-to-Peer Review',
        date: '2025-11-10',
        method: 'portal',
        vendor: 'Cigna Provider Portal',
        reference: 'CGN-APP-20251110-6618005',
        notes: 'P2P with Cigna medical director held 11/20/2025. Attending presented emergent admission criteria.',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM6618005.pdf', ref: 'CGN-APP-20251110-6618005' },
        ],
      },
      result: {
        label: 'Overturned — P2P Accepted',
        date: '2025-12-08',
        description: 'Cigna accepted emergent admission exception post peer-to-peer. Retroactive authorization issued. $9,450 paid.',
        source: 'Cigna P2P Determination 2025-12-08',
      },
    },
  ],

  'DN-2025-1156': [
    {
      id: 'ep-1156-1',
      round: 'Initial Denial',
      openedAt: '2025-11-08',
      signal: {
        label: '835 Remittance — Authorization Denial',
        date: '2025-11-08',
        source: 'EFT-20251108-BCBS-550',
        description: 'CARC-15. No valid authorization on file. $2,100 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2025-1156' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Appeal',
        date: '2025-11-25',
        description: 'No retroactive authorization pathway identified. Proceeding with standard Level 1 appeal.',
      },
    },
    {
      id: 'ep-1156-2',
      round: 'Level 1 Appeal',
      openedAt: '2025-11-25',
      action: {
        label: 'Level 1 Appeal',
        date: '2025-11-25',
        method: 'portal',
        vendor: 'BCBS Provider Portal',
        reference: 'BCBS-APP-20251125-5504006',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM5504006.pdf', ref: 'BCBS-APP-20251125-5504006' },
        ],
      },
      result: {
        label: 'Upheld — Will Not Appeal',
        date: '2026-01-20',
        description: 'BCBS upheld denial — no retroactive authorization pathway. External review cost exceeds recovery. Closed.',
      },
    },
  ],

  'DN-2025-0788': [
    {
      id: 'ep-0788-1',
      round: 'Recoupment Demand',
      openedAt: '2025-08-18',
      signal: {
        label: 'Medicare Recoupment Notice',
        date: '2025-08-18',
        source: 'MCR-RCQ-20250818-CLM3302007',
        description: 'Post-payment audit. Medicare demanding $12,400 recoupment for DOS 8/10/2025.',
        attachments: [
          { type: 'pdf_recoupment', label: 'MCR_RECOUPMENT_CLM3302007.pdf' },
        ],
      },
      result: {
        label: 'Escalated to Formal Dispute',
        date: '2025-09-05',
        description: 'Clinical record review completed. Formal dispute with full medical record compiled and submitted.',
      },
    },
    {
      id: 'ep-0788-2',
      round: 'Dispute',
      openedAt: '2025-09-05',
      action: {
        label: 'Formal Dispute with Clinical Record',
        date: '2025-09-05',
        method: 'mail',
        vendor: 'HIM Department',
        reference: 'USPS-9400111899221122334455',
        notes: 'Full medical record submitted. Medicare responded with settlement offer.',
        attachments: [
          { type: 'document', label: 'Dispute_Letter_CLM3302007.pdf' },
          { type: 'document', label: 'Clinical_Records_HAR209007.pdf' },
        ],
      },
      result: {
        label: 'Partial Settlement',
        date: '2025-11-14',
        description: '$6,200 repaid to Medicare; $6,200 written off. Settlement accepted and case closed.',
        source: 'Medicare Settlement Confirmation 2025-11-14',
      },
    },
  ],

  'DN-2025-1302': [
    {
      id: 'ep-1302-1',
      round: 'Timely Filing Denial',
      openedAt: '2025-07-15',
      signal: {
        label: '835 Remittance — Timely Filing Denial',
        date: '2025-07-15',
        source: 'EFT-20250715-AET-118',
        description: 'CARC-29. Aetna asserts claim received outside 180-day window. DOS 5/10/2025. $3,100 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2025-1302' },
        ],
      },
      result: {
        label: 'Escalated to Timely Filing Defense',
        date: '2025-08-01',
        description: 'Clearinghouse 277-CA research confirmed timely transmission. Defense package submitted via Aetna portal.',
      },
    },
    {
      id: 'ep-1302-2',
      round: 'Timely Filing Defense',
      openedAt: '2025-08-01',
      action: {
        label: 'Timely Filing Defense with 277-CA',
        date: '2025-08-01',
        method: 'portal',
        vendor: 'Aetna Provider Portal',
        reference: 'AET-TF-20250801-1188008',
        notes: '277-CA Availity report proves claim transmitted 7/2/2025 — within the 180-day window.',
        attachments: [
          { type: 'report_277', label: '277-CA-20250702-AET.edi' },
          { type: 'document', label: 'TimeFiling_Defense_CLM1188008.pdf', ref: 'AET-TF-20250801-1188008' },
        ],
      },
      result: {
        label: 'Accepted — Denial Reversed',
        date: '2025-09-02',
        description: 'Aetna confirmed 277-CA acceptance validates timely filing. $3,100 paid.',
        source: 'Aetna Reversal Confirmation 2025-09-02',
      },
    },
  ],

  'DN-2026-0044': [
    {
      id: 'ep-0044-1',
      round: 'Initial Denial',
      openedAt: '2025-12-01',
      signal: {
        label: '835 Remittance — Coding Adjustment',
        date: '2025-12-01',
        source: 'EFT-20251201-BCBS-770',
        description: 'CARC-4. ICD-10 principal diagnosis sequencing error. $1,240 adjusted.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0044' },
        ],
      },
      result: {
        label: 'Escalated to Corrected Claim',
        date: '2025-12-15',
        description: 'CDI confirmed sequencing error. Corrected claim submitted via Change Healthcare clearinghouse.',
      },
    },
    {
      id: 'ep-0044-2',
      round: 'Corrected Claim',
      openedAt: '2025-12-15',
      action: {
        label: 'Corrected Claim Submitted',
        date: '2025-12-15',
        method: 'clearinghouse',
        vendor: 'Change Healthcare',
        reference: 'CHC-CX-20251215-7700009',
        notes: 'E11.65 moved to secondary per CDI review. Corrected claim resubmitted.',
        attachments: [
          { type: 'document', label: 'Corrected_Claim_CLM7700009.txt', ref: 'CHC-CX-20251215-7700009' },
        ],
      },
      result: {
        label: 'Paid in Full',
        date: '2026-01-08',
        description: 'BCBS processed corrected claim — $1,240 paid.',
        source: 'BCBS ERA 2026-01-08',
      },
    },
  ],

  'DN-2026-0077': [
    {
      id: 'ep-0077-1',
      round: 'Eligibility Denial',
      openedAt: '2026-01-08',
      signal: {
        label: '835 Remittance — Eligibility Denial',
        date: '2026-01-08',
        source: 'EFT-20260108-MCD-439',
        description: 'CARC-31. Medicaid coverage inactive on DOS 12/10/2025. $2,340 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0077' },
        ],
      },
      result: {
        label: 'Escalated to Secondary Billing — Medicare',
        date: '2026-01-20',
        description: 'Eligibility verified: Medicare primary as of 11/1/2025. Cross-over claim submitted to Medicare.',
      },
    },
    {
      id: 'ep-0077-2',
      round: 'Secondary Billing — Medicare',
      openedAt: '2026-01-20',
      action: {
        label: 'Claim Billed to Medicare (Secondary/Primary)',
        date: '2026-01-20',
        method: 'clearinghouse',
        vendor: 'Change Healthcare',
        reference: 'CHC-CX-20260120-4396010',
        notes: 'Medicare identified as primary. Cross-over claim submitted.',
        attachments: [
          { type: 'document', label: 'Medicare_Claim_CLM4396010.txt', ref: 'CHC-CX-20260120-4396010' },
        ],
      },
      result: {
        label: 'Paid in Full by Medicare',
        date: '2026-02-20',
        description: 'Medicare paid $2,340 in full.',
        source: 'Medicare ERA 2026-02-20',
      },
    },
  ],

  'DN-2026-0103': [
    {
      id: 'ep-0103-1',
      round: 'Initial Denial',
      openedAt: '2026-01-15',
      signal: {
        label: '835 Remittance — Medical Necessity Denial',
        date: '2026-01-15',
        source: 'EFT-20260115-CGN-007',
        description: 'CARC-50. Cigna LOS criteria not met beyond day 4. $4,100 denied.',
        attachments: [
          { type: '835_remit', label: '835 Remittance', ref: 'DN-2026-0103' },
        ],
      },
      result: {
        label: 'Escalated to Level 1 Appeal',
        date: '2026-02-01',
        description: 'Attending attestation and extended LOS justification compiled. Level 1 appeal submitted via Cigna portal.',
      },
    },
    {
      id: 'ep-0103-2',
      round: 'Level 1 Appeal',
      openedAt: '2026-02-01',
      action: {
        label: 'Level 1 Appeal',
        date: '2026-02-01',
        method: 'portal',
        vendor: 'Cigna Provider Portal',
        reference: 'CGN-APP-20260201-0075011',
        attachments: [
          { type: 'document', label: 'L1_Appeal_CLM0075011.pdf', ref: 'CGN-APP-20260201-0075011' },
        ],
      },
      result: {
        label: 'Upheld — Will Not Appeal',
        date: '2026-03-15',
        description: 'Cigna upheld denial. Extended LOS criteria not clearly documented. Finance approved write-off — $4,100 below external review threshold.',
      },
    },
  ],
}

// ─── 837 Claim Data ───────────────────────────────────────────────────────────

export interface Claim837ServiceLine {
  revenueCode: string
  revenueDescription: string
  procedureCode?: string
  dos: string
  units: number
  billedAmount: number
}

export interface Claim837Data {
  denialId: string
  claimId: string
  typeOfBill: string                              // e.g. '111' = inpatient hospital
  billingProviderName: string
  billingProviderNPI: string
  billingProviderTaxId: string
  subscriberName: string
  subscriberInsuranceId: string
  subscriberGroupNumber: string
  patientDob: string
  admissionDate: string
  dischargeDate: string
  admissionType: string                           // '1' Elective, '2' Urgent, '3' Emergency
  admissionSource: string
  dischargeStatus: string                         // '01' Home, '20' Expired, etc.
  totalBilledAmount: number
  principalDiagnosis: { code: string; description: string }
  secondaryDiagnoses: { code: string; description: string }[]
  principalProcedure?: { code: string; description: string }
  drgClaimed?: string
  serviceLines: Claim837ServiceLine[]
}

export const CLAIM_DATA_837: Record<string, Claim837Data> = {

  // ── DN-2026-0412: BCBS DRG Downgrade — Margaret Holloway ─────────────────
  'DN-2026-0412': {
    denialId: 'DN-2026-0412',
    claimId: 'CLM-8847291',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Margaret Holloway',
    subscriberInsuranceId: 'BCB-774112-MH',
    subscriberGroupNumber: 'GRP-4821-MHS',
    patientDob: '1952-03-14',
    admissionDate: '2026-02-11',
    dischargeDate: '2026-02-15',
    admissionType: '2',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 18450.00,
    drgClaimed: 'MS-DRG 291 — Heart Failure & Shock w/ MCC',
    principalDiagnosis: { code: 'I50.43', description: 'Acute on chronic combined systolic and diastolic heart failure' },
    secondaryDiagnoses: [
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'N18.3',  description: 'Chronic kidney disease, stage 3' },
      { code: 'J96.00', description: 'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia' },
    ],
    principalProcedure: { code: '5A1935Z', description: 'Respiratory ventilation, >96 consecutive hours' },
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',        dos: '2026-02-11', units: 4, billedAmount: 9200.00 },
      { revenueCode: '0130', revenueDescription: 'Intensive Care Unit',                dos: '2026-02-11', units: 1, billedAmount: 3800.00 },
      { revenueCode: '0250', revenueDescription: 'Pharmacy',                           dos: '2026-02-11', units: 1, billedAmount: 1840.00 },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',             dos: '2026-02-12', units: 1, billedAmount: 620.00  },
      { revenueCode: '0481', revenueDescription: 'Cardiology — Echocardiography',      dos: '2026-02-12', units: 1, billedAmount: 1450.00 },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',          dos: '2026-02-11', units: 1, billedAmount: 890.00  },
      { revenueCode: '0710', revenueDescription: 'Recovery Room',                      dos: '2026-02-11', units: 1, billedAmount: 650.00  },
    ],
  },

  // ── DN-2026-0389: Aetna Med Nec — Raymond Castellano ─────────────────────
  'DN-2026-0389': {
    denialId: 'DN-2026-0389',
    claimId: 'CLM-9920441',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Raymond Castellano',
    subscriberInsuranceId: 'AET-881033-RC',
    subscriberGroupNumber: 'GRP-7710-EMPL',
    patientDob: '1968-07-22',
    admissionDate: '2026-02-15',
    dischargeDate: '2026-02-20',
    admissionType: '3',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 31200.00,
    drgClaimed: 'MS-DRG 177 — Respiratory Infections & Inflammations w/ MCC',
    principalDiagnosis: { code: 'J18.1', description: 'Lobar pneumonia, unspecified organism' },
    secondaryDiagnoses: [
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
      { code: 'R65.20', description: 'Severe sepsis without septic shock' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-02-15', units: 5,  billedAmount: 11500.00 },
      { revenueCode: '0130', revenueDescription: 'Intensive Care Unit',             dos: '2026-02-15', units: 2,  billedAmount: 7600.00  },
      { revenueCode: '0250', revenueDescription: 'Pharmacy',                        dos: '2026-02-15', units: 1,  billedAmount: 4820.00  },
      { revenueCode: '0260', revenueDescription: 'IV Therapy',                      dos: '2026-02-15', units: 1,  billedAmount: 2100.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-02-16', units: 1,  billedAmount: 1440.00  },
      { revenueCode: '0320', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-02-15', units: 1,  billedAmount: 2180.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-02-15', units: 1,  billedAmount: 1560.00  },
    ],
  },

  // ── DN-2026-0401: Cigna Coding Error — Vivienne Okafor ───────────────────
  'DN-2026-0401': {
    denialId: 'DN-2026-0401',
    claimId: 'CLM-7723019',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Vivienne Okafor',
    subscriberInsuranceId: 'CGN-448821-VO',
    subscriberGroupNumber: 'GRP-3310-CORP',
    patientDob: '1979-11-05',
    admissionDate: '2026-02-26',
    dischargeDate: '2026-03-01',
    admissionType: '2',
    admissionSource: '4',
    dischargeStatus: '01',
    totalBilledAmount: 8920.00,
    drgClaimed: 'MS-DRG 470 — Major Joint Replacement w/o MCC',
    principalDiagnosis: { code: 'M16.11', description: 'Unilateral primary osteoarthritis, right hip' },
    secondaryDiagnoses: [
      { code: 'Z96.641', description: 'Presence of right artificial hip joint' },
      { code: 'I10',     description: 'Essential (primary) hypertension' },
    ],
    principalProcedure: { code: '0SRB019', description: 'Replacement of right hip joint with metal synthetic substitute, cemented, open approach' },
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-02-26', units: 3, billedAmount: 3900.00 },
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',         dos: '2026-02-26', units: 1, billedAmount: 2450.00 },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-02-26', units: 1, billedAmount: 1320.00 },
      { revenueCode: '0250', revenueDescription: 'Pharmacy',                        dos: '2026-02-26', units: 1, billedAmount: 680.00  },
      { revenueCode: '0420', revenueDescription: 'Physical Therapy',                dos: '2026-02-27', units: 2, billedAmount: 570.00  },
    ],
  },

  // ── DN-2026-0388: Cigna Med Nec — Daniel Forsythe ───────────────────────────
  'DN-2026-0388': {
    denialId: 'DN-2026-0388',
    claimId: 'CLM-6612847',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Daniel Forsythe',
    subscriberInsuranceId: 'CGN-229471-RT',
    subscriberGroupNumber: 'GRP-3310-CORP',
    patientDob: '1971-04-18',
    admissionDate: '2026-03-28',
    dischargeDate: '2026-03-31',
    admissionType: '3',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 12840.00,
    drgClaimed: 'MS-DRG 194 — Simple Pneumonia & Pleurisy w/ MCC',
    principalDiagnosis: { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
    secondaryDiagnoses: [
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-03-28', units: 3, billedAmount: 6900.00 },
      { revenueCode: '0250', revenueDescription: 'Pharmacy',                        dos: '2026-03-28', units: 1, billedAmount: 2310.00 },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-29', units: 1, billedAmount: 880.00  },
      { revenueCode: '0320', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-03-28', units: 1, billedAmount: 1440.00 },
      { revenueCode: '0260', revenueDescription: 'IV Therapy',                      dos: '2026-03-28', units: 1, billedAmount: 1310.00 },
    ],
  },

  // ── DN-2026-0292: Humana Med Nec — Franklin Pierce ────────────────────────
  'DN-2026-0292': {
    denialId: 'DN-2026-0292',
    claimId: 'CLM-0087213',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Franklin Pierce',
    subscriberInsuranceId: 'HUM-899002-FP',
    subscriberGroupNumber: 'GRP-5521-HUM',
    patientDob: '1955-09-03',
    admissionDate: '2026-03-17',
    dischargeDate: '2026-03-24',
    admissionType: '2',
    admissionSource: '2',
    dischargeStatus: '03',
    totalBilledAmount: 24600.00,
    drgClaimed: 'MS-DRG 291 — Heart Failure & Shock w/ MCC',
    principalDiagnosis: { code: 'I50.41', description: 'Acute combined systolic and diastolic heart failure' },
    secondaryDiagnoses: [
      { code: 'N18.4',  description: 'Chronic kidney disease, stage 4' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
      { code: 'I48.19', description: 'Persistent atrial fibrillation, unspecified' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      { code: 'E87.5',  description: 'Hyperkalemia' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-03-17', units: 7, billedAmount: 16100.00 },
      { revenueCode: '0250', revenueDescription: 'Pharmacy',                        dos: '2026-03-17', units: 1, billedAmount: 3480.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-18', units: 1, billedAmount: 1220.00  },
      { revenueCode: '0481', revenueDescription: 'Cardiology — Echocardiography',   dos: '2026-03-18', units: 1, billedAmount: 1950.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-03-17', units: 1, billedAmount: 1850.00  },
    ],
  },

  // ── DN-2026-0377: UHC Authorization — James Okafor ────────────────────────
  'DN-2026-0377': {
    denialId: 'DN-2026-0377',
    claimId: 'CLM-6634882',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'James Okafor',
    subscriberInsuranceId: 'UHC-559001-JO',
    subscriberGroupNumber: 'GRP-7714-MHS',
    patientDob: '1968-09-22',
    admissionDate: '2026-03-01',
    dischargeDate: '2026-03-03',
    admissionType: '1',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 32500.00,
    drgClaimed: 'MS-DRG 470 — Major Joint Replacement w/o MCC',
    principalDiagnosis: { code: 'M17.11', description: 'Primary osteoarthritis, right knee' },
    secondaryDiagnoses: [
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'Z96.641', description: 'Presence of right artificial knee joint' },
    ],
    principalProcedure: { code: '0SRC0J9', description: 'Replacement of right knee joint with synthetic substitute, cemented' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',         dos: '2026-03-01', units: 1, billedAmount: 14200.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                       dos: '2026-03-01', units: 1, billedAmount: 3100.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',        dos: '2026-03-01', units: 1, billedAmount: 8400.00  },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',      dos: '2026-03-01', units: 2, billedAmount: 4200.00  },
      { revenueCode: '0420', revenueDescription: 'Physical Therapy',                 dos: '2026-03-02', units: 1, billedAmount: 1400.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',           dos: '2026-03-01', units: 1, billedAmount: 620.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',           dos: '2026-03-01', units: 2, billedAmount: 580.00   },
    ],
  },

  // ── DN-2026-0358: Cigna Medical Necessity — Carolyn Brandt ────────────────
  'DN-2026-0358': {
    denialId: 'DN-2026-0358',
    claimId: 'CLM-5521334',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Carolyn Brandt',
    subscriberInsuranceId: 'CGN-430887-CB',
    subscriberGroupNumber: 'GRP-3309-MHS',
    patientDob: '1955-06-18',
    admissionDate: '2026-03-10',
    dischargeDate: '2026-03-14',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 14820.00,
    drgClaimed: 'MS-DRG 193 — Simple Pneumonia & Pleurisy w/ MCC',
    principalDiagnosis: { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
    secondaryDiagnoses: [
      { code: 'J96.00', description: 'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia' },
      { code: 'N17.9',  description: 'Acute kidney failure, unspecified' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',      dos: '2026-03-10', units: 4, billedAmount: 6800.00  },
      { revenueCode: '0410', revenueDescription: 'Respiratory Services',              dos: '2026-03-10', units: 3, billedAmount: 2100.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',         dos: '2026-03-10', units: 1, billedAmount: 1480.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',            dos: '2026-03-10', units: 1, billedAmount: 980.00   },
      { revenueCode: '0302', revenueDescription: 'Laboratory — Hematology',           dos: '2026-03-11', units: 1, billedAmount: 640.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic (Chest)',    dos: '2026-03-10', units: 2, billedAmount: 820.00   },
							{ revenueCode: '0761', revenueDescription: 'Treatment/Observation Room',        dos: '2026-03-10', units: 1, billedAmount: 2000.00  },
    ],
  },

  // ── DN-2026-0344: Medicaid Eligibility — Louis Tremblay ───────────────────
  'DN-2026-0344': {
    denialId: 'DN-2026-0344',
    claimId: 'CLM-4408772',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Louis Tremblay',
    subscriberInsuranceId: 'MCD-321099-LT',
    subscriberGroupNumber: 'GRP-MCD-STATE',
    patientDob: '1972-11-04',
    admissionDate: '2026-03-05',
    dischargeDate: '2026-03-07',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 7200.00,
    drgClaimed: 'MS-DRG 602 — Cellulitis w/ MCC',
    principalDiagnosis: { code: 'L03.115', description: 'Cellulitis of right lower limb' },
    secondaryDiagnoses: [
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'L89.619', description: 'Pressure-induced deep tissue damage of left heel' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',   dos: '2026-03-05', units: 2, billedAmount: 3400.00 },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',      dos: '2026-03-05', units: 1, billedAmount: 840.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-05', units: 1, billedAmount: 620.00  },
      { revenueCode: '0302', revenueDescription: 'Laboratory — Hematology',         dos: '2026-03-06', units: 1, billedAmount: 480.00  },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-03-05', units: 1, billedAmount: 540.00  },
      { revenueCode: '0761', revenueDescription: 'Treatment/Observation Room',      dos: '2026-03-05', units: 1, billedAmount: 1320.00 },
    ],
  },

  // ── DN-2026-0331: BCBS Recoupment — Nancy Whitfield ───────────────────────
  'DN-2026-0331': {
    denialId: 'DN-2026-0331',
    claimId: 'CLM-3317661',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Nancy Whitfield',
    subscriberInsuranceId: 'BCB-210445-NW',
    subscriberGroupNumber: 'GRP-4821-MHS',
    patientDob: '1948-02-27',
    admissionDate: '2026-01-28',
    dischargeDate: '2026-02-03',
    admissionType: '2',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 48200.00,
    drgClaimed: 'MS-DRG 236 — Coronary Bypass w/ Cardiac Cath w/o MCC',
    principalDiagnosis: { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
    secondaryDiagnoses: [
      { code: 'I10',   description: 'Essential (primary) hypertension' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I50.9', description: 'Heart failure, unspecified' },
      { code: 'N18.3', description: 'Chronic kidney disease, stage 3' },
    ],
    principalProcedure: { code: '0210093', description: 'Bypass coronary artery, one site from left internal mammary, open approach' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',        dos: '2026-01-29', units: 1, billedAmount: 22400.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                      dos: '2026-01-29', units: 1, billedAmount: 4800.00  },
      { revenueCode: '0200', revenueDescription: 'Intensive Care',                  dos: '2026-01-29', units: 2, billedAmount: 9600.00  },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-01-31', units: 4, billedAmount: 6800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-01-29', units: 1, billedAmount: 2200.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-01-29', units: 1, billedAmount: 1400.00  },
      { revenueCode: '0481', revenueDescription: 'Cardiology — Echocardiography',   dos: '2026-01-30', units: 1, billedAmount: 1000.00  },
    ],
  },

  // ── DN-2026-0318: Aetna DRG Downgrade — Timothy Reyes ────────────────────
  'DN-2026-0318': {
    denialId: 'DN-2026-0318',
    claimId: 'CLM-2209115',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Timothy Reyes',
    subscriberInsuranceId: 'AET-108334-TR',
    subscriberGroupNumber: 'GRP-5502-MHS',
    patientDob: '1963-07-15',
    admissionDate: '2026-03-12',
    dischargeDate: '2026-03-14',
    admissionType: '1',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 28400.00,
    drgClaimed: 'MS-DRG 470 — Major Joint Replacement w/o MCC',
    principalDiagnosis: { code: 'M16.11', description: 'Primary osteoarthritis, right hip' },
    secondaryDiagnoses: [
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'M79.3',  description: 'Panniculitis' },
    ],
    principalProcedure: { code: '0SR90J9', description: 'Replacement of right hip joint with synthetic substitute, cemented' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',         dos: '2026-03-12', units: 1, billedAmount: 12600.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                       dos: '2026-03-12', units: 1, billedAmount: 2900.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',        dos: '2026-03-12', units: 1, billedAmount: 7800.00  },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',      dos: '2026-03-12', units: 2, billedAmount: 3400.00  },
      { revenueCode: '0420', revenueDescription: 'Physical Therapy',                 dos: '2026-03-13', units: 1, billedAmount: 900.00   },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',           dos: '2026-03-12', units: 1, billedAmount: 480.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',           dos: '2026-03-12', units: 2, billedAmount: 320.00   },
    ],
  },

  // ── DN-2026-0305: UHC Timely Filing — Helen Nakamura ─────────────────────
  'DN-2026-0305': {
    denialId: 'DN-2026-0305',
    claimId: 'CLM-1198004',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Helen Nakamura',
    subscriberInsuranceId: 'UHC-009771-HN',
    subscriberGroupNumber: 'GRP-6610-MHS',
    patientDob: '1957-04-30',
    admissionDate: '2025-11-18',
    dischargeDate: '2025-11-23',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 19840.00,
    drgClaimed: 'MS-DRG 871 — Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC',
    principalDiagnosis: { code: 'A41.9', description: 'Sepsis, unspecified organism' },
    secondaryDiagnoses: [
      { code: 'N39.0',  description: 'Urinary tract infection, site not specified' },
      { code: 'R65.20', description: 'Severe sepsis without septic shock' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',   dos: '2025-11-18', units: 5, billedAmount: 8500.00  },
      { revenueCode: '0200', revenueDescription: 'Intensive Care',                  dos: '2025-11-19', units: 1, billedAmount: 4800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2025-11-18', units: 1, billedAmount: 2100.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',           dos: '2025-11-18', units: 1, billedAmount: 1640.00  },
      { revenueCode: '0302', revenueDescription: 'Laboratory — Hematology',          dos: '2025-11-19', units: 1, billedAmount: 980.00   },
      { revenueCode: '0410', revenueDescription: 'Respiratory Services',              dos: '2025-11-19', units: 2, billedAmount: 1220.00  },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',           dos: '2025-11-18', units: 1, billedAmount: 600.00   },
    ],
  },

  // ── DN-2026-0278: Medicare ADR — Sylvia Moreau ────────────────────────────
  'DN-2026-0278': {
    denialId: 'DN-2026-0278',
    claimId: 'CLM-9876541',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Sylvia Moreau',
    subscriberInsuranceId: 'MCR-788229-SM',
    subscriberGroupNumber: 'MEDICARE-A',
    patientDob: '1944-08-11',
    admissionDate: '2026-02-10',
    dischargeDate: '2026-02-13',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 16320.00,
    drgClaimed: 'MS-DRG 190 — Chronic Obstructive Pulmonary Disease w/ MCC',
    principalDiagnosis: { code: 'J44.1', description: 'Chronic obstructive pulmonary disease with (acute) exacerbation' },
    secondaryDiagnoses: [
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'I50.9',  description: 'Heart failure, unspecified' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',   dos: '2026-02-10', units: 3, billedAmount: 5100.00  },
      { revenueCode: '0410', revenueDescription: 'Respiratory Services',            dos: '2026-02-10', units: 3, billedAmount: 3600.00  },
      { revenueCode: '0200', revenueDescription: 'Intensive Care',                  dos: '2026-02-10', units: 1, billedAmount: 4800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-02-10', units: 1, billedAmount: 1100.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-02-10', units: 1, billedAmount: 820.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic (Chest)',  dos: '2026-02-10', units: 2, billedAmount: 900.00   },
    ],
  },

  // ── DN-2026-0261: Cigna Administrative — Arthur Delacroix ─────────────────
  'DN-2026-0261': {
    denialId: 'DN-2026-0261',
    claimId: 'CLM-8765432',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Arthur Delacroix',
    subscriberInsuranceId: 'CGN-677114-AD',
    subscriberGroupNumber: 'GRP-3309-MHS',
    patientDob: '1980-03-19',
    admissionDate: '2026-03-25',
    dischargeDate: '2026-03-26',
    admissionType: '1',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 8900.00,
    drgClaimed: 'MS-DRG 418 — Laparoscopic Cholecystectomy w/o C.D.E. w/o CC/MCC',
    principalDiagnosis: { code: 'K80.20', description: 'Calculus of gallbladder without chronic cholecystitis without obstruction' },
    secondaryDiagnoses: [
      { code: 'K57.30', description: 'Diverticulosis of large intestine without perforation or abscess without bleeding' },
    ],
    principalProcedure: { code: '0FT44ZZ', description: 'Resection of gallbladder, percutaneous endoscopic approach' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',        dos: '2026-03-25', units: 1, billedAmount: 4800.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                      dos: '2026-03-25', units: 1, billedAmount: 1600.00 },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-03-25', units: 1, billedAmount: 1700.00 },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-03-25', units: 1, billedAmount: 480.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-25', units: 1, billedAmount: 200.00  },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-03-25', units: 1, billedAmount: 120.00  },
    ],
  },

  // ── DN-2026-0521: UHC Underpayment — Harold Simmons (CABG) ───────────────
  'DN-2026-0521': {
    denialId: 'DN-2026-0521',
    claimId: 'CLM-9921847',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Harold Simmons',
    subscriberInsuranceId: 'UHC-773290-HS',
    subscriberGroupNumber: 'GRP-7714-MHS',
    patientDob: '1950-12-08',
    admissionDate: '2026-02-17',
    dischargeDate: '2026-02-24',
    admissionType: '2',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 127400.00,
    drgClaimed: 'MS-DRG 231 — Coronary Bypass w/ PTCA w/ MCC',
    principalDiagnosis: { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
    secondaryDiagnoses: [
      { code: 'I21.9',  description: 'Acute myocardial infarction, unspecified' },
      { code: 'I50.9',  description: 'Heart failure, unspecified' },
      { code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'Z87.891', description: 'Personal history of other specified conditions' },
    ],
    principalProcedure: { code: '0210093', description: 'Bypass coronary artery, one site from left internal mammary, open approach' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',        dos: '2026-02-18', units: 1, billedAmount: 54000.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                      dos: '2026-02-18', units: 1, billedAmount: 8200.00  },
      { revenueCode: '0200', revenueDescription: 'Intensive Care',                  dos: '2026-02-18', units: 3, billedAmount: 28800.00 },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-02-21', units: 4, billedAmount: 13600.00 },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-02-18', units: 1, billedAmount: 12400.00 },
      { revenueCode: '0481', revenueDescription: 'Cardiology — Echocardiography',   dos: '2026-02-19', units: 1, billedAmount: 2800.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-02-18', units: 1, billedAmount: 2200.00  },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-02-18', units: 2, billedAmount: 4400.00  },
							{ revenueCode: '0730', revenueDescription: 'EKG/ECG',                             dos: '2026-02-17', units: 1, billedAmount: 1000.00  },
    ],
  },

  // ── DN-2026-0538: Aetna Underpayment — Beverly Santos ────────────────────
  'DN-2026-0538': {
    denialId: 'DN-2026-0538',
    claimId: 'CLM-6634019',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Beverly Santos',
    subscriberInsuranceId: 'AET-558802-BS',
    subscriberGroupNumber: 'GRP-5502-MHS',
    patientDob: '1966-09-14',
    admissionDate: '2026-03-01',
    dischargeDate: '2026-03-03',
    admissionType: '1',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 34800.00,
    drgClaimed: 'MS-DRG 470 — Major Joint Replacement w/o MCC',
    principalDiagnosis: { code: 'M17.11', description: 'Primary osteoarthritis, right knee' },
    secondaryDiagnoses: [
      { code: 'M79.621', description: 'Pain in right upper arm' },
      { code: 'I10',     description: 'Essential (primary) hypertension' },
    ],
    principalProcedure: { code: '0SRC0J9', description: 'Replacement of right knee joint with synthetic substitute, cemented' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',        dos: '2026-03-01', units: 1, billedAmount: 15600.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                      dos: '2026-03-01', units: 1, billedAmount: 3200.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-03-01', units: 1, billedAmount: 9400.00  },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-03-01', units: 2, billedAmount: 4400.00  },
      { revenueCode: '0420', revenueDescription: 'Physical Therapy',                dos: '2026-03-02', units: 1, billedAmount: 1300.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-01', units: 1, billedAmount: 560.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-03-01', units: 2, billedAmount: 340.00   },
    ],
  },

  // ── DN-2026-0445: BCBS DRG Downgrade — Patricia Goldstein (Intake) ────────
  'DN-2026-0445': {
    denialId: 'DN-2026-0445',
    claimId: 'CLM-3847201',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Patricia Goldstein',
    subscriberInsuranceId: 'BCB-312091-PG',
    subscriberGroupNumber: 'GRP-4821-MHS',
    patientDob: '1949-05-03',
    admissionDate: '2026-03-29',
    dischargeDate: '2026-04-02',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 21800.00,
    drgClaimed: 'MS-DRG 291 — Heart Failure & Shock w/ MCC',
    principalDiagnosis: { code: 'I50.43', description: 'Acute on chronic combined systolic (congestive) and diastolic (congestive) heart failure' },
    secondaryDiagnoses: [
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
      { code: 'N18.3',  description: 'Chronic kidney disease, stage 3' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',   dos: '2026-03-29', units: 4, billedAmount: 6800.00  },
      { revenueCode: '0200', revenueDescription: 'Intensive Care',                  dos: '2026-03-30', units: 1, billedAmount: 4800.00  },
      { revenueCode: '0410', revenueDescription: 'Respiratory Services',             dos: '2026-03-29', units: 2, billedAmount: 2400.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',        dos: '2026-03-29', units: 1, billedAmount: 2100.00  },
      { revenueCode: '0481', revenueDescription: 'Cardiology — Echocardiography',    dos: '2026-03-30', units: 1, billedAmount: 1950.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',            dos: '2026-03-29', units: 1, billedAmount: 1200.00  },
      { revenueCode: '0730', revenueDescription: 'EKG/ECG',                           dos: '2026-03-29', units: 1, billedAmount: 550.00   },
							{ revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic (Chest)',    dos: '2026-03-29', units: 2, billedAmount: 2000.00  },
    ],
  },

  // ── DN-2026-0451: Medicare RAC — Daniel Forsythe (Intake) ─────────────────────
  'DN-2026-0451': {
    denialId: 'DN-2026-0451',
    claimId: 'CLM-4112830',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Daniel Forsythe',
    subscriberInsuranceId: 'MCR-388902-MW',
    subscriberGroupNumber: 'MEDICARE-A',
    patientDob: '1941-11-20',
    admissionDate: '2026-03-22',
    dischargeDate: '2026-03-24',
    admissionType: '3',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 12400.00,
    drgClaimed: 'MS-DRG 192 — Chronic Obstructive Pulmonary Disease w/ CC',
    principalDiagnosis: { code: 'J44.0', description: 'Chronic obstructive pulmonary disease with acute lower respiratory infection' },
    secondaryDiagnoses: [
      { code: 'J18.9',  description: 'Pneumonia, unspecified organism' },
      { code: 'J96.01', description: 'Acute respiratory failure with hypoxia' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
    ],
    serviceLines: [
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',   dos: '2026-03-22', units: 2, billedAmount: 3400.00  },
      { revenueCode: '0410', revenueDescription: 'Respiratory Services',            dos: '2026-03-22', units: 2, billedAmount: 2800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-03-22', units: 1, billedAmount: 1600.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-22', units: 1, billedAmount: 980.00   },
      { revenueCode: '0302', revenueDescription: 'Laboratory — Hematology',         dos: '2026-03-23', units: 1, billedAmount: 720.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic (Chest)',  dos: '2026-03-22', units: 2, billedAmount: 1400.00  },
      { revenueCode: '0761', revenueDescription: 'Treatment/Observation Room',      dos: '2026-03-22', units: 1, billedAmount: 1500.00  },
    ],
  },

  // ── DN-2026-0463: UHC Authorization — Rosa Espinoza (Intake) ──────────────
  'DN-2026-0463': {
    denialId: 'DN-2026-0463',
    claimId: 'CLM-5290017',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Rosa Espinoza',
    subscriberInsuranceId: 'UHC-471003-RE',
    subscriberGroupNumber: 'GRP-7714-MHS',
    patientDob: '1971-02-14',
    admissionDate: '2026-03-28',
    dischargeDate: '2026-04-01',
    admissionType: '1',
    admissionSource: '1',
    dischargeStatus: '01',
    totalBilledAmount: 58600.00,
    drgClaimed: 'MS-DRG 460 — Spinal Fusion Except Cervical w/ MCC',
    principalDiagnosis: { code: 'M47.816', description: 'Spondylosis with radiculopathy, lumbar region' },
    secondaryDiagnoses: [
      { code: 'M51.16',  description: 'Intervertebral disc degeneration, lumbar region' },
      { code: 'G54.4',   description: 'Lumbosacral root disorders, not elsewhere classified' },
      { code: 'I10',     description: 'Essential (primary) hypertension' },
    ],
    principalProcedure: { code: '0SG0071', description: 'Fusion of lumbar vertebral joint with autologous tissue substitute, posterior approach, anterior column, open' },
    serviceLines: [
      { revenueCode: '0360', revenueDescription: 'Operating Room Services',        dos: '2026-03-28', units: 1, billedAmount: 28400.00 },
      { revenueCode: '0370', revenueDescription: 'Anesthesia',                      dos: '2026-03-28', units: 1, billedAmount: 5800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies',       dos: '2026-03-28', units: 1, billedAmount: 14200.00 },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',     dos: '2026-03-28', units: 4, billedAmount: 6800.00  },
      { revenueCode: '0420', revenueDescription: 'Physical Therapy',                dos: '2026-03-30', units: 2, billedAmount: 1800.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',          dos: '2026-03-28', units: 1, billedAmount: 820.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',          dos: '2026-03-28', units: 2, billedAmount: 780.00   },
    ],
  },

  // ── DN-2026-0471: Aetna Coding Error — Chen Wei (Intake) ──────────────────
  'DN-2026-0471': {
    denialId: 'DN-2026-0471',
    claimId: 'CLM-6445882',
    typeOfBill: '111',
    billingProviderName: 'Memorial Health System',
    billingProviderNPI: '1234567890',
    billingProviderTaxId: '47-1234567',
    subscriberName: 'Chen Wei',
    subscriberInsuranceId: 'AET-558201-CW',
    subscriberGroupNumber: 'GRP-5502-MHS',
    patientDob: '1975-07-28',
    admissionDate: '2026-03-30',
    dischargeDate: '2026-03-31',
    admissionType: '2',
    admissionSource: '7',
    dischargeStatus: '01',
    totalBilledAmount: 18900.00,
    drgClaimed: 'MS-DRG 247 — Perc Cardiovascular Proc w/ Drug-Eluting Stent w/o MCC',
    principalDiagnosis: { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
    secondaryDiagnoses: [
      { code: 'I21.9',  description: 'Acute myocardial infarction, unspecified' },
      { code: 'I10',    description: 'Essential (primary) hypertension' },
      { code: 'E78.5',  description: 'Hyperlipidemia, unspecified' },
    ],
    principalProcedure: { code: '027034Z', description: 'Dilation of coronary artery, one artery with drug-eluting intraluminal device, percutaneous approach' },
    serviceLines: [
      { revenueCode: '0481', revenueDescription: 'Cardiology — Cardiac Catheterization', dos: '2026-03-30', units: 1, billedAmount: 9800.00  },
      { revenueCode: '0270', revenueDescription: 'Medical/Surgical Supplies (Stent)',     dos: '2026-03-30', units: 1, billedAmount: 4200.00  },
      { revenueCode: '0120', revenueDescription: 'Room & Board — Semi-Private',            dos: '2026-03-30', units: 1, billedAmount: 1700.00  },
      { revenueCode: '0301', revenueDescription: 'Laboratory — Chemistry',                 dos: '2026-03-30', units: 1, billedAmount: 980.00   },
      { revenueCode: '0730', revenueDescription: 'EKG/ECG',                                dos: '2026-03-30', units: 1, billedAmount: 420.00   },
      { revenueCode: '0490', revenueDescription: 'Radiology — Diagnostic',                 dos: '2026-03-30', units: 1, billedAmount: 1800.00  },
    ],
  },
}
