// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionType =
  | 'sftp-835'
  | 'api-835'
  | 'sftp-pdf'
  | 'emdr-pdf'
  | 'sftp-adr'
  | 'spreadsheet'
  | 'contract-fee-schedule'
  | 'manual'

export type ConnectionStatus = 'active' | 'warning' | 'error' | 'inactive'

export interface DataConnection {
  id: string
  type: ConnectionType
  label: string
  description: string
  status: ConnectionStatus
  statusNote: string | null       // shown when status is warning or error
  lastIngestedAt: string | null
  lastBatchCount: number | null
  autoAcceptThreshold: number | null   // 0–100; null = manual review required
  weeklyActivity: number[]             // 7-day record counts, index 0 = oldest
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_CONNECTIONS: DataConnection[] = [
  {
    id: 'conn-001',
    type: 'sftp-835',
    label: '835 via SFTP — Clearinghouse Feed',
    description: 'Automated 835 remittance files from Change Healthcare',
    status: 'active',
    statusNote: null,
    lastIngestedAt: '2026-04-03T06:02:00',
    lastBatchCount: 14,
    autoAcceptThreshold: 90,
    weeklyActivity: [8, 12, 7, 14, 10, 11, 14],
  },
  {
    id: 'conn-002',
    type: 'sftp-pdf',
    label: 'PDF via SFTP — Denial Letters Inbox',
    description: 'Scanned denial letters and audit notices from shared SFTP folder',
    status: 'warning',
    statusNote: '2 files failed OCR in last batch — manual review needed',
    lastIngestedAt: '2026-04-03T06:15:00',
    lastBatchCount: 6,
    autoAcceptThreshold: null,
    weeklyActivity: [3, 5, 2, 6, 4, 5, 6],
  },
  {
    id: 'conn-003',
    type: 'spreadsheet',
    label: 'Spreadsheet — Batch Audit Claim List',
    description: 'Excel uploads mapping CMS audit notices to claim details',
    status: 'active',
    statusNote: null,
    lastIngestedAt: '2026-04-03T07:16:00',
    lastBatchCount: 3,
    autoAcceptThreshold: null,
    weeklyActivity: [0, 0, 3, 0, 0, 2, 3],
  },
  {
    id: 'conn-manual',
    type: 'manual',
    label: 'Manual Upload',
    description: 'Upload individual files directly. Always available.',
    status: 'active',
    statusNote: null,
    lastIngestedAt: '2026-04-03T08:00:00',
    lastBatchCount: 1,
    autoAcceptThreshold: null,
    weeklyActivity: [1, 0, 2, 1, 0, 1, 1],
  },
]

// ── Connection type metadata ──────────────────────────────────────────────────

export interface ConnectionTypeMeta {
  type: ConnectionType
  label: string
  description: string
  availableFor: ('denials' | 'underpayments' | 'audits')[]
  configFields: string[]    // for the add wizard (labels only)
}

export const CONNECTION_TYPE_META: ConnectionTypeMeta[] = [
  {
    type: 'sftp-835',
    label: '835 via SFTP',
    description: 'Automated remittance files from your clearinghouse',
    availableFor: ['denials', 'underpayments'],
    configFields: ['Host', 'Port', 'Username', 'Password / Key', 'Remote path', 'File pattern'],
  },
  {
    type: 'api-835',
    label: '835 via Clearinghouse API',
    description: 'Real-time 835 delivery via clearinghouse API',
    availableFor: ['denials', 'underpayments'],
    configFields: ['API endpoint', 'API key', 'Payer filter'],
  },
  {
    type: 'sftp-pdf',
    label: 'PDF via SFTP',
    description: 'Denial letters and audit notices from a shared folder',
    availableFor: ['denials', 'audits'],
    configFields: ['Host', 'Port', 'Username', 'Password / Key', 'Remote path'],
  },
  {
    type: 'emdr-pdf',
    label: 'PDF via eMDR Mailbox',
    description: 'Inbound documents through HealthSource eMDR',
    availableFor: ['denials', 'audits'],
    configFields: ['eMDR mailbox ID', 'API key'],
  },
  {
    type: 'sftp-adr',
    label: 'ADR / Audit Notice Inbox',
    description: 'Dedicated inbox for ADR letters and audit notices',
    availableFor: ['audits'],
    configFields: ['Host', 'Port', 'Username', 'Password / Key', 'Remote path'],
  },
  {
    type: 'contract-fee-schedule',
    label: 'Contract / Fee Schedule',
    description: 'Contracted rates used to detect underpayments',
    availableFor: ['underpayments'],
    configFields: ['Payer', 'Effective date', 'Upload file'],
  },
  {
    type: 'spreadsheet',
    label: 'Spreadsheet / Batch Audit List',
    description: 'CSV or Excel uploads mapping audit notices to claims',
    availableFor: ['audits'],
    configFields: ['Upload file', 'Column mapping'],
  },
]

// ── History batches (illustrative) ───────────────────────────────────────────

export interface HistoryBatch {
  id: string
  connectionId: string
  connectionLabel: string
  processedAt: string
  totalCount: number
  acceptedCount: number
  needsAttentionCount: number
  dismissedCount: number
}

export const SEED_HISTORY: HistoryBatch[] = [
  {
    id: 'batch-001',
    connectionId: 'conn-001',
    connectionLabel: '835 via SFTP — Clearinghouse Feed',
    processedAt: '2026-04-03T06:02:00',
    totalCount: 14,
    acceptedCount: 11,
    needsAttentionCount: 2,
    dismissedCount: 1,
  },
  {
    id: 'batch-002',
    connectionId: 'conn-002',
    connectionLabel: 'PDF via SFTP — Denial Letters Inbox',
    processedAt: '2026-04-03T06:15:00',
    totalCount: 6,
    acceptedCount: 3,
    needsAttentionCount: 2,
    dismissedCount: 1,
  },
  {
    id: 'batch-003',
    connectionId: 'conn-003',
    connectionLabel: 'Spreadsheet — Batch Audit Claim List',
    processedAt: '2026-04-03T07:16:00',
    totalCount: 3,
    acceptedCount: 0,
    needsAttentionCount: 3,
    dismissedCount: 0,
  },
  {
    id: 'batch-004',
    connectionId: 'conn-001',
    connectionLabel: '835 via SFTP — Clearinghouse Feed',
    processedAt: '2026-04-02T06:04:00',
    totalCount: 11,
    acceptedCount: 9,
    needsAttentionCount: 1,
    dismissedCount: 1,
  },
  {
    id: 'batch-005',
    connectionId: 'conn-002',
    connectionLabel: 'PDF via SFTP — Denial Letters Inbox',
    processedAt: '2026-04-02T06:18:00',
    totalCount: 5,
    acceptedCount: 4,
    needsAttentionCount: 1,
    dismissedCount: 0,
  },
  {
    id: 'batch-006',
    connectionId: 'conn-001',
    connectionLabel: '835 via SFTP — Clearinghouse Feed',
    processedAt: '2026-04-01T06:01:00',
    totalCount: 10,
    acceptedCount: 8,
    needsAttentionCount: 2,
    dismissedCount: 0,
  },
]
