export type AuditProgram = 'RAC' | 'TPE' | 'MAC_prepayment'
export type AuditCohortStatus = 'Discussion Period' | 'CAP Period' | 'Active' | 'Legal Hold' | 'Closed'

export interface AuditCohort {
  id: string
  program: AuditProgram
  name: string
  contractor: string
  probeFocus: string
  auditPeriodStart: string     // ISO date YYYY-MM-DD
  auditPeriodEnd: string       // ISO date YYYY-MM-DD
  status: AuditCohortStatus
  linkedDenialIds: string[]
  totalExposure: number
  extrapolationRisk: boolean
  complianceOwner: string
  openedAt: string             // ISO date
  nextDeadline?: string        // ISO date
  nextDeadlineLabel?: string
  notes?: string
  // Program-specific
  probeRound?: 1 | 2 | 3      // TPE
  discussionPeriodExpiry?: string  // RAC — 30-day window before demand is final
  capSubmittedAt?: string      // TPE
  legalHold?: boolean          // OIG
}

export interface AuditProgramConfig {
  label: string
  color: string
  bg: string
  description: string
}

export const PROGRAM_CONFIG: Record<AuditProgram, AuditProgramConfig> = {
  RAC:            { label: 'RAC', color: '#C2410C', bg: '#FFF7ED', description: 'Recovery Audit Contractor' },
  TPE:            { label: 'TPE', color: '#1D4ED8', bg: '#EFF6FF', description: 'Targeted Probe & Educate' },
  MAC_prepayment: { label: 'MAC', color: '#0F766E', bg: '#F0FDFA', description: 'MAC Prepayment Review' },
}

export const STATUS_CONFIG: Record<AuditCohortStatus, { color: string; bg: string; border: string }> = {
  'Discussion Period': { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  'CAP Period':        { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  'Active':            { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  'Legal Hold':        { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  'Closed':            { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
}

export const AUDIT_COHORTS: AuditCohort[] = [
  {
    id: 'AC-2026-001',
    program: 'RAC',
    name: 'BCBS DRG Overpayment Probe — Surgical Implant Cases',
    contractor: 'Cotiviti',
    probeFocus: 'MS-DRG 470/480/481/483 — CC/MCC validation, device carveout documentation',
    auditPeriodStart: '2024-01-01',
    auditPeriodEnd: '2025-12-31',
    status: 'Discussion Period',
    linkedDenialIds: ['DN-2026-0331', 'DN-2026-0412'],
    totalExposure: 13130.00,
    extrapolationRisk: true,
    complianceOwner: 'Marcus Webb',
    openedAt: '2026-03-19',
    nextDeadline: '2026-04-08',
    nextDeadlineLabel: 'Discussion Period expires',
    discussionPeriodExpiry: '2026-04-08',
    notes: 'BCBS initiated RAC probe on 3/19. Two claims identified under surgical implant DRG audit. Discussion Period window open — schedule call with Cotiviti before 4/8. Extrapolation risk is elevated: audit covers 2-year lookback across all DRG 470/480-series claims.',
  },
  {
    id: 'AC-2026-002',
    program: 'TPE',
    name: 'Medicare Sepsis & Pneumonia Coding — Round 1 Probe',
    contractor: 'Palmetto GBA (MAC J-M)',
    probeFocus: 'MS-DRG 870/871/872 (sepsis) and MS-DRG 177/178/179/193/194/195 (pneumonia) — principal diagnosis sequencing, MCC/CC clinical documentation support',
    auditPeriodStart: '2025-07-01',
    auditPeriodEnd: '2026-02-28',
    status: 'CAP Period',
    linkedDenialIds: ['DN-2026-0278'],
    totalExposure: 4110.00,
    extrapolationRisk: false,
    complianceOwner: 'Priya Nair',
    openedAt: '2026-02-15',
    nextDeadline: '2026-05-01',
    nextDeadlineLabel: 'CAP submission due',
    probeRound: 1,
    notes: 'Round 1 probe selected 10 claims; 1 currently linked to active denial (Sylvia Moreau ADR). Education session with coding team completed 3/28. CAP draft in progress — due May 1. If error rate exceeds 20% after Round 2, MAC will refer for extrapolation.',
  },
]
