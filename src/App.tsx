import { useState, useRef, Component, type ErrorInfo, type ReactNode } from 'react'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Dashboard error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, margin: 16 }}>
          <strong style={{ color: '#991B1B' }}>Dashboard render error:</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 12, color: '#7F1D1D' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
import { ThemeProvider, CssBaseline } from '@mui/material'
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Chip, Avatar, Tooltip, IconButton,
  Button, ButtonGroup, Paper, Badge, Snackbar, Alert, Popover, Menu, MenuItem,
} from '@mui/material'
import {
  DashboardOutlined, ListAltOutlined, UploadFileOutlined,
  SettingsOutlined, AccountTreeOutlined, AddOutlined,
  NotificationsOutlined, HelpOutlineOutlined, RestartAltOutlined,
  ChevronLeftOutlined, ChevronRightOutlined, ArchiveOutlined,
  PaymentsOutlined, GavelOutlined, ViewListOutlined,
  ExpandMoreOutlined, ExpandLessOutlined, UnfoldMoreOutlined,
} from '@mui/icons-material'
import theme from './theme'
import WorklistPage, {
  type WorklistActiveTab, type WorklistSort, type WorklistFilters, DEFAULT_WORKLIST_FILTERS,
} from './pages/WorklistPage'
import DenialDetailPage from './pages/DenialDetailPage'
import DashboardPage from './pages/DashboardPage'
import IngestPage from './pages/IngestPage'
import RoutingRulesPage from './pages/RoutingRulesPage'
import UnderpaymentWorklistPage from './pages/UnderpaymentWorklistPage'
import UnderpaymentDetailPage from './pages/UnderpaymentDetailPage'
import { SEED_DENIALS, type DenialRecord, type DenialState, type TeamMember } from './data/denials'
import { SEED_UNDERPAYMENTS } from './data/underpayments'
import { SEED_AUDITS, type AuditRecord } from './data/audits'
import { SEED_STAGING } from './data/staging'
import { DEFAULT_FLAGS, type FeatureFlags } from './data/featureFlags'
import AuditWorklistPage from './pages/AuditWorklistPage'
import AuditDetailPage from './pages/AuditDetailPage'
import DenialListStyleEPage from './pages/DenialListStyleEPage'
import DenialsWorklistV2Page from './pages/DenialsWorklistV2Page'
import DenialsWorklistV3Page from './pages/DenialsWorklistV3Page'
import DenialsWorklistFutureScopePage from './pages/DenialsWorklistFutureScopePage'
import NewDenialFlow from './pages/NewDenialFlow'
import CasePageAiEditing from './case-page/CasePageAiEditing'

const SIDEBAR_WIDTH = 224
const SIDEBAR_COLLAPSED_WIDTH = 56

type NavItem = 'Dashboard' | 'Denials' | 'Underpayments' | 'Audits' | 'Ingest' | 'Routing Rules' | 'Settings' | 'Archive' | 'Style E'
type UserRole = 'Manager' | 'FrontlineWorker'

// Full nav definition — filtered at render time based on features + role
const ALL_NAV_ITEMS: { label: NavItem; icon: React.ReactNode; packageKey?: keyof FeatureFlags }[] = [
  { label: 'Dashboard',     icon: <DashboardOutlined fontSize="small" /> },
  { label: 'Denials',       icon: <ListAltOutlined fontSize="small" />,   packageKey: 'denials' },
  { label: 'Underpayments', icon: <PaymentsOutlined fontSize="small" />,  packageKey: 'underpayments' },
  { label: 'Audits',        icon: <GavelOutlined fontSize="small" />,     packageKey: 'audits' },
  { label: 'Ingest',        icon: <UploadFileOutlined fontSize="small" /> },
  { label: 'Routing Rules', icon: <AccountTreeOutlined fontSize="small" /> },
  { label: 'Style E',       icon: <ViewListOutlined fontSize="small" /> },
]

const bottomNavItems: { label: NavItem; icon: React.ReactNode }[] = [
  { label: 'Settings', icon: <SettingsOutlined fontSize="small" /> },
]

// ── Notifications ─────────────────────────────────────────────────────────────

interface AppNotification {
  id: string
  type: 'deadline' | 'submitted' | 'attention' | 'overturned' | 'ingested'
  title: string
  body: string
  timestamp: string
  read: boolean
  denialId?: string
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'overturned', title: 'Appeal Overturned',        body: 'BCBS approved full payment of $12,450 — Margaret Holloway',      timestamp: '2026-04-03T09:15:00', read: false },
  { id: 'n2', type: 'deadline',   title: 'Deadline in 2 days',       body: 'Appeal due Apr 5 — Daniel Forsythe · Cigna Medical Necessity',      timestamp: '2026-04-03T08:00:00', read: false },
  { id: 'n3', type: 'ingested',   title: '6 records ingested',       body: 'UHC batch processed — 4 new appeals pending assignment',          timestamp: '2026-04-02T16:30:00', read: true  },
  { id: 'n4', type: 'attention',  title: 'Records ready for review', body: 'HealthSource submitted ADR records for Vivienne Okafor',          timestamp: '2026-04-02T14:00:00', read: true  },
  { id: 'n5', type: 'deadline',   title: 'Deadline tomorrow',        body: 'Filing defense due Apr 4 — Daniel Forsythe · Cigna Authorization',    timestamp: '2026-04-02T08:00:00', read: true  },
]

const NOTIF_ICON_COLORS: Record<AppNotification['type'], string> = {
  overturned: '#16A34A',
  deadline:   '#DC2626',
  submitted:  '#157d9d',
  attention:  '#b86823',
  ingested:   '#553C9A',
}

const NOTIF_LABELS: Record<AppNotification['type'], string> = {
  overturned: 'Overturned',
  deadline:   'Deadline',
  submitted:  'Submitted',
  attention:  'Attention',
  ingested:   'Ingested',
}

const CHANNEL_DISPLAY: Record<string, string> = {
  esmd:   'esMD',
  agent:  'Agent Portal',
  portal: 'Provider Portal',
  fax:    'Fax',
  mail:   'Certified Mail',
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const PAGE_TITLES: Partial<Record<NavItem, string>> = {
  Denials: 'Denials Worklist',
}

const PAGE_SUBTITLES: Partial<Record<NavItem, string>> = {
  Dashboard:       'Operational snapshot and trend analysis',
  Denials:         'Manage and appeal denied claims',
  Underpayments:   'Identify and recover underpaid claims',
  Audits:          'RAC, MAC, and payer audit responses',
  'Routing Rules': 'Configure routing logic by payer and denial type',
  Settings:        'Client configuration and system preferences',
  Archive:         'Removed duplicates, bad ingestions, and data quality cases',
}

// Prototype reference "now" — signals arrive on 2026-04-03, last batch at t(78)=07:18
const PROTO_NOW = new Date('2026-04-03T07:24:00')
const PROTO_TODAY_STR = PROTO_NOW.toDateString()

function isProtoToday(isoString: string): boolean {
  return new Date(isoString).toDateString() === PROTO_TODAY_STR
}

function protoTimeAgo(timestamp: string): string {
  const diff = PROTO_NOW.getTime() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ingestAutoRoutedToday = SEED_STAGING.filter(r =>
  r.status === 'auto_processed' && r.autoProcessedAt != null && isProtoToday(r.autoProcessedAt)
).length
const ingestExceptionsToday = SEED_STAGING.filter(r =>
  r.status === 'needs_review' && isProtoToday(r.receivedAt)
).length
const lastBatchTime = SEED_STAGING.map(r => r.receivedAt).sort().at(-1) ?? ''
const ingestLastBatch = lastBatchTime ? protoTimeAgo(lastBatchTime) : null

function ArchiveListView({ denials }: { denials: DenialRecord[] }) {
  const archived = denials.filter(d => d.state === 'Archive')
  const cols = ['Patient / HAR', 'Payer', 'Denial Type', 'Denied Amount', 'Archive Reason', 'Archived By']
  const grid = '200px 140px 1fr 120px 1fr 150px'

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {archived.length} archived case{archived.length !== 1 ? 's' : ''}
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2, px: 2.5, py: 1, bgcolor: '#f8fafb', borderBottom: '1px solid', borderColor: 'divider' }}>
          {cols.map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </Typography>
          ))}
        </Box>
        {archived.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">No archived cases</Typography>
          </Box>
        ) : archived.map((d, idx) => (
          <Box
            key={d.id}
            sx={{
              display: 'grid', gridTemplateColumns: grid, gap: 2,
              px: 2.5, py: 1.5, alignItems: 'center',
              borderBottom: idx < archived.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              bgcolor: idx % 2 === 0 ? 'transparent' : '#FAFAFA',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.patient.name}</Typography>
              <Typography variant="caption" color="text.secondary">{d.claim.har}</Typography>
            </Box>
            <Typography variant="body2" noWrap>{d.payer}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{d.denialType}</Typography>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {d.deniedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{d.archiveReason ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary">{d.archivedBy ?? '—'}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  )
}

function SettingsPage({ onReset }: { onReset: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleReset() {
    onReset()
    setConfirmed(true)
    timerRef.current = setTimeout(() => setConfirmed(false), 3000)
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
      <Typography variant="overline" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 2 }}>
        Demo
      </Typography>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, maxWidth: 480 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Reset Demo Data</Typography>
            <Typography variant="caption" color="text.secondary">
              Restores all denial instances to their original seeded state. Ingested records and any edits will be discarded.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            color={confirmed ? 'success' : 'error'}
            startIcon={<RestartAltOutlined fontSize="small" />}
            onClick={handleReset}
            sx={{ flexShrink: 0, fontWeight: 600, minWidth: 100 }}
          >
            {confirmed ? 'Reset!' : 'Reset'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

const EXISTING_SIDEBAR_WIDTH = 256

function ExistingSystemSidebar({
  activeNav,
  onNavChange,
  needsReviewCount,
}: {
  activeNav: 'worklist' | 'ingest'
  onNavChange: (nav: 'worklist' | 'ingest') => void
  needsReviewCount: number
}) {
  const navItems: { id: 'worklist' | 'ingest'; label: string }[] = [
    { id: 'worklist', label: 'Worklist' },
    { id: 'ingest',   label: 'Intake' },
  ]

  return (
    // Outer box holds space in the flex row (same pattern as MUI permanent Drawer)
    <Box sx={{ width: EXISTING_SIDEBAR_WIDTH, flexShrink: 0 }}>
      {/* Fixed panel — visually occupies the sidebar area */}
      <Box
        sx={{
          position: 'fixed',
          top: 52,
          left: 0,
          width: EXISTING_SIDEBAR_WIDTH,
          height: 'calc(100vh - 52px)',
          bgcolor: '#FAFAFA',
          borderRight: '1px solid #E5E5E5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1200,
        }}
      >
        {/* Nav items */}
        <Box sx={{ flex: 1, p: 1, pt: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {navItems.map(({ id, label }) => (
              <Box
                key={id}
                onClick={() => onNavChange(id)}
                sx={{
                  px: 1, py: 1,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: activeNav === id ? 500 : 400,
                  color: activeNav === id ? '#0A0A0A' : '#31373A',
                  bgcolor: activeNav === id ? 'rgba(0,0,0,0.06)' : 'transparent',
                  transition: 'background-color 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { bgcolor: activeNav === id ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)' },
                }}
              >
                {label}
                {id === 'ingest' && needsReviewCount > 0 && (
                  <Box sx={{
                    minWidth: 18, height: 18, borderRadius: '9px',
                    bgcolor: '#b86823', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 700, px: 0.75,
                  }}>
                    {needsReviewCount}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 1, borderTop: '1px solid #E5E5E5' }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1, py: 1, borderRadius: '8px', cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              bgcolor: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>JT</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0A0A0A', lineHeight: 1, display: 'block' }}>
                Jordan Tang
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#636A6F', lineHeight: 1, mt: '3px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                j.tang@memorialhealth.org
              </Typography>
            </Box>
            <UnfoldMoreOutlined sx={{ fontSize: 16, color: '#636A6F', flexShrink: 0 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>('Denials')
  const [navCollapsed, setNavCollapsed] = useState(false)
  const sidebarWidth = navCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
  const [selectedDenialId, setSelectedDenialId] = useState<string | null>(null)
  const [selectedV2CaseId, setSelectedV2CaseId] = useState<string | null>(null)
  const [v2ReturnTab, setV2ReturnTab] = useState<DenialState>('InProgress')
  const [v2ReviewCompleteIds, setV2ReviewCompleteIds] = useState<Set<string>>(new Set())
  const [v2AssignedToMe, setV2AssignedToMe] = useState(false)
  const [selectedUnderpaymentId, setSelectedUnderpaymentId] = useState<string | null>(null)
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const [denials, setDenials] = useState<DenialRecord[]>(SEED_DENIALS)
  const [audits, setAudits] = useState<AuditRecord[]>(SEED_AUDITS)
  const [worklistTab, setWorklistTab] = useState<WorklistActiveTab>('Queue')
  const [worklistSort, setWorklistSort] = useState<WorklistSort>(null)
  const [worklistFilters, setWorklistFilters] = useState<WorklistFilters>(DEFAULT_WORKLIST_FILTERS)
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS)

  const [userRole, setUserRole] = useState<UserRole>('FrontlineWorker')
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [systemMode, setSystemMode] = useState<'new' | 'existing'>('existing')
  const [denialsView, setDenialsView] = useState<'v1' | 'v2' | 'v3' | 'ingest-mvp' | 'future-scope'>('v2')
  const [existingNav, setExistingNav] = useState<'worklist' | 'ingest' | 'new-denial' | 'new-denial-details'>('worklist')
  const [transitionDir, setTransitionDir] = useState<'forward' | 'back'>('forward')
  const [transitionKey, setTransitionKey] = useState(0)
  const [returnContext, setReturnContext] = useState<{ tab: 'exceptions' | 'in-progress'; recordId: string } | null>(null)
  const [widgetExpanded, setWidgetExpanded] = useState(false)
  const [pageKey, setPageKey] = useState(0)
  const [v3ShowUpload, setV3ShowUpload] = useState(false)
  const [v3NewDenialAnchor, setV3NewDenialAnchor] = useState<HTMLElement | null>(null)
  const [v3NewDenialPanelOpen, setV3NewDenialPanelOpen] = useState(false)

  // Filter out misclassified ADR and Underpayment denial records — these now live in SEED_AUDITS
  const visibleDenials = denials.filter(d => d.denialType !== 'ADR' && d.denialType !== 'Underpayment')
  const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  function handleV2SelectDenial(id: string, fromTab: DenialState) {
    setV2ReturnTab(fromTab)
    setSelectedV2CaseId(id)
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10)
  }

  function handleV2StatusAction(action: string) {
    if (!selectedV2CaseId) return
    const id = selectedV2CaseId
    if (action === 'submit') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Submitted' as DenialState, status: 'Awaiting Payer Decision' as const, submissionDate: todayISO() } : d))
      setV2ReturnTab('Submitted')
      setSelectedV2CaseId(null)
    } else if (action === 'will-not-submit') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Closed' as DenialState, status: 'Will Not Appeal' as const } : d))
      setV2ReturnTab('Closed')
      setSelectedV2CaseId(null)
    } else if (action === 'archive') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Archive' as DenialState, status: 'Archived' as const } : d))
      setV2ReturnTab('Archive')
      setSelectedV2CaseId(null)
    } else if (action === 'complete-review') {
      setV2ReviewCompleteIds(prev => new Set([...prev, id]))
    } else if (action === 'overturned') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Overturned' as DenialState, status: 'Overturned — Full Payment' as const, overturnDate: todayISO() } : d))
      setV2ReturnTab('Overturned')
      setSelectedV2CaseId(null)
    } else if (action === 'upheld-will-appeal') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'InProgress' as DenialState, status: 'In Progress' as const } : d))
      setV2ReturnTab('InProgress')
      setSelectedV2CaseId(null)
    } else if (action === 'upheld-will-not-appeal') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Closed' as DenialState, status: 'Upheld by Payer' as const } : d))
      setV2ReturnTab('Closed')
      setSelectedV2CaseId(null)
    } else if (action === 'return-to-review') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'InProgress' as DenialState, status: 'In Progress' as const } : d))
      setV2ReturnTab('InProgress')
      setSelectedV2CaseId(null)
    } else if (action === 'remove-outcome') {
      setDenials(prev => prev.map(d => d.id === id ? { ...d, state: 'Submitted' as DenialState, status: 'Awaiting Payer Decision' as const, overturnDate: undefined } : d))
      setV2ReturnTab('Submitted')
      setSelectedV2CaseId(null)
    }
  }

  function handleSelectDenial(id: string) {
    setSelectedDenialId(id)
  }

  function handleBack() {
    setSelectedDenialId(null)
  }

  function handleNavClick(label: NavItem) {
    setActiveNav(label)
    setSelectedDenialId(null)
    setSelectedUnderpaymentId(null)
    setSelectedAuditId(null)
  }

  function handleSubmitSuccess(channel: string, payer: string, patientName: string) {
    const channelLabel = CHANNEL_DISPLAY[channel] ?? channel
    const newNotif: AppNotification = {
      id: `submitted-${Date.now()}`,
      type: 'submitted',
      title: 'Appeal Submitted',
      body: `${patientName} · ${payer} — sent via ${channelLabel}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [newNotif, ...prev])
    setToast({ message: `Appeal submitted via ${channelLabel}` })
  }

  const showingDetail        = activeNav === 'Denials' && selectedDenialId !== null
  const showingWorklist      = activeNav === 'Denials' && !showingDetail
  const showingUPDetail      = activeNav === 'Underpayments' && selectedUnderpaymentId !== null
  const showingUPWorklist    = activeNav === 'Underpayments' && !showingUPDetail
  const showingAuditWorklist = activeNav === 'Audits' && selectedAuditId === null
  const showingAuditDetail   = activeNav === 'Audits' && selectedAuditId !== null

  const isTerminal = (s: string) => s === 'Overturned' || s === 'Closed' || s === 'Archive'
  const openCount = visibleDenials.filter(d => !isTerminal(d.state)).length
  const openAuditCount = audits.filter(a => a.state !== 'Closed').length
  const needsReviewCount = SEED_STAGING.filter(r =>
    r.status === 'needs_review' &&
    (systemMode !== 'existing' || !r.reviewReasons.includes('possible_duplicate'))
  ).length
  const navItems = ALL_NAV_ITEMS.filter(item => !item.packageKey || features[item.packageKey])


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── AppBar ──────────────────────────────────────────────────────────── */}
        <AppBar
          position="fixed"
          sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: '#FFFFFF', height: 52, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 52, px: 2, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mr: 2 }}>
              <Box component="img" src="/smarterdx_logo.webp" alt="SmarterDX" sx={{ height: 20, display: 'block', objectFit: 'contain' }} />
              {systemMode === 'existing' && (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, color: '#9CA3AF', letterSpacing: '0.01em' }}>
                  Denials
                </Typography>
              )}
            </Box>

            {systemMode === 'new' && (
              <Chip
                label="Memorial Health System"
                size="small"
                sx={{
                  bgcolor: '#e8f2f5', color: '#157d9d',
                  fontWeight: 500, fontSize: '0.75rem', border: '1px solid #b6d7e1',
                }}
              />
            )}

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={e => setBellAnchor(e.currentTarget)}>
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                  <NotificationsOutlined fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Help">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <HelpOutlineOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Krista Soriano">
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.dark', cursor: 'pointer', ml: 0.5 }}>
                KS
              </Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* ── Existing System Sidebar ─────────────────────────────────────────── */}
        {systemMode === 'existing' && (
          <ExistingSystemSidebar activeNav={existingNav} onNavChange={nav => { setReturnContext(null); setSelectedV2CaseId(null); setV3ShowUpload(false); setExistingNav(nav) }} needsReviewCount={needsReviewCount} />
        )}

        {/* ── New System Sidebar ───────────────────────────────────────────────── */}
        {systemMode === 'new' && <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              top: 52,
              height: 'calc(100% - 52px)',
              bgcolor: '#f8fafb',
              display: 'flex',
              flexDirection: 'column',
              overflowX: 'hidden',
              transition: 'width 0.2s ease',
            },
          }}
        >
          <List dense disablePadding sx={{ px: 1, pt: 1.5, flex: 1 }}>
            {!navCollapsed && (
              <Typography variant="overline" sx={{ px: 1.5, mb: 0.5, display: 'block', color: 'text.secondary' }}>
                Navigation
              </Typography>
            )}
            {[...navItems, ...(userRole === 'Manager' ? [{ label: 'Archive' as NavItem, icon: <ArchiveOutlined fontSize="small" /> }] : [])].map(({ label, icon }) => (
              <Tooltip key={label} title={navCollapsed ? label : ''} placement="right">
                <ListItemButton
                  selected={activeNav === label}
                  onClick={() => handleNavClick(label)}
                  sx={{
                    borderRadius: 1.5, mb: 0.25,
                    px: navCollapsed ? 1 : 1.5, py: 0.75,
                    justifyContent: navCollapsed ? 'center' : 'flex-start',
                    minWidth: 0,
                    position: 'relative',
                    '&.Mui-selected': {
                      bgcolor: '#e8f2f5', color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: '#dcecf0' },
                    },
                    '&:hover': { bgcolor: 'rgba(21,125,157,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: navCollapsed ? 0 : 32, color: 'text.secondary', justifyContent: 'center' }}>{icon}</ListItemIcon>
                  {!navCollapsed && (
                    <>
                      <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                      {label === 'Denials' && openCount > 0 && (
                        <Chip label={openCount} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'error.main', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                      {label === 'Audits' && openAuditCount > 0 && (
                        <Chip label={openAuditCount} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: '#C2410C', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                      {label === 'Ingest' && needsReviewCount > 0 && (
                        <Chip label={needsReviewCount} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: '#b86823', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                    </>
                  )}
                  {navCollapsed && label === 'Denials' && openCount > 0 && (
                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                  )}
                  {navCollapsed && label === 'Audits' && openAuditCount > 0 && (
                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: '#C2410C' }} />
                  )}
                  {navCollapsed && label === 'Ingest' && needsReviewCount > 0 && (
                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: '#b86823' }} />
                  )}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>

          <Divider sx={{ mx: 1 }} />

          <List dense disablePadding sx={{ px: 1, py: 1 }}>
            {bottomNavItems.map(({ label, icon }) => (
              <Tooltip key={label} title={navCollapsed ? label : ''} placement="right">
                <ListItemButton
                  selected={activeNav === label}
                  onClick={() => handleNavClick(label)}
                  sx={{
                    borderRadius: 1.5,
                    px: navCollapsed ? 1 : 1.5, py: 0.75,
                    justifyContent: navCollapsed ? 'center' : 'flex-start',
                    '&.Mui-selected': {
                      bgcolor: '#e8f2f5', color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                    },
                    '&:hover': { bgcolor: 'rgba(21,125,157,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: navCollapsed ? 0 : 32, color: 'text.secondary', justifyContent: 'center' }}>{icon}</ListItemIcon>
                  {!navCollapsed && <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }} />}
                </ListItemButton>
              </Tooltip>
            ))}
            <Tooltip title={navCollapsed ? 'Expand' : ''} placement="right">
              <ListItemButton
                onClick={() => setNavCollapsed(c => !c)}
                sx={{
                  borderRadius: 1.5,
                  px: navCollapsed ? 1 : 1.5, py: 0.75,
                  justifyContent: navCollapsed ? 'center' : 'flex-start',
                  '&:hover': { bgcolor: 'rgba(21,125,157,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: navCollapsed ? 0 : 32, color: 'text.secondary', justifyContent: 'center' }}>
                  {navCollapsed ? <ChevronRightOutlined fontSize="small" /> : <ChevronLeftOutlined fontSize="small" />}
                </ListItemIcon>
                {!navCollapsed && <ListItemText primary="Collapse" primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.secondary' }} />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Drawer>}

        {/* ── Main Content ─────────────────────────────────────────────────────── */}
        <Box
          component="main"
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: '52px', overflow: 'hidden', bgcolor: 'background.default' }}
        >
          {/* Page header — hidden for Worklist/detail views and in existing mode */}
          {systemMode === 'new' && !showingDetail && !showingWorklist && !showingUPWorklist && !showingUPDetail && !showingAuditWorklist && !showingAuditDetail && (
            <Box
              sx={{
                px: 3, py: 2,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{activeNav}</Typography>
                {activeNav === 'Ingest' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {ingestAutoRoutedToday} auto-routed today
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ingestExceptionsToday} need review
                    </Typography>
                    {ingestLastBatch && (
                      <>
                        <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>·</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last batch {ingestLastBatch}
                        </Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {PAGE_SUBTITLES[activeNav]}
                  </Typography>
                )}
              </Box>
              {activeNav === 'Ingest' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileOutlined sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  Upload file
                </Button>
              )}
            </Box>
          )}

          {/* Existing system page sub-header */}
          {systemMode === 'existing' && (existingNav === 'ingest' || existingNav === 'worklist') && !selectedV2CaseId && !((denialsView === 'ingest-mvp' || denialsView === 'v3' || denialsView === 'v2') && existingNav === 'ingest' && v3ShowUpload) && (
            <Box sx={{ px: 3, height: 56, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
                  {existingNav === 'worklist' ? 'Denials Worklist' : 'Denials Intake'}
                </Typography>
              </Box>
              {existingNav === 'ingest' && denialsView !== 'ingest-mvp' && denialsView !== 'v3' && denialsView !== 'v2' && (
                <Button
                  variant="contained"
                  onClick={() => { setReturnContext(null); setTransitionDir('forward'); setTransitionKey(k => k + 1); setExistingNav('new-denial') }}
                  sx={{ bgcolor: '#157d9d', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 500, px: 2, '&:hover': { bgcolor: '#11647e' } }}
                >
                  New Denial
                </Button>
              )}
              {existingNav === 'ingest' && (denialsView === 'v3' || denialsView === 'ingest-mvp' || denialsView === 'v2') && (
                <>
                  <ButtonGroup
                    variant="contained"
                    size="small"
                    sx={{ '& .MuiButton-root': { bgcolor: '#157d9d', '&:hover': { bgcolor: '#11647e' }, borderColor: '#11647e !important', textTransform: 'none', fontWeight: 500 } }}
                  >
                    <Button
                      onClick={e => setV3NewDenialAnchor(e.currentTarget)}
                      sx={{ fontSize: '0.8125rem', px: 2 }}
                    >
                      New Denial
                    </Button>
                    <Button
                      onClick={e => setV3NewDenialAnchor(e.currentTarget)}
                      sx={{ px: 0.75, minWidth: 'unset !important' }}
                    >
                      <ExpandMoreOutlined sx={{ fontSize: 16 }} />
                    </Button>
                  </ButtonGroup>
                  <Menu
                    anchorEl={v3NewDenialAnchor}
                    open={Boolean(v3NewDenialAnchor)}
                    onClose={() => setV3NewDenialAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
                  >
                    <MenuItem
                      dense
                      onClick={() => {
                        setV3NewDenialAnchor(null)
                        if (denialsView === 'ingest-mvp' || denialsView === 'v3') {
                          setV3NewDenialPanelOpen(true)
                        } else {
                          setV3ShowUpload(false)
                          setReturnContext(null)
                          setTransitionDir('forward')
                          setTransitionKey(k => k + 1)
                          setExistingNav('new-denial')
                        }
                      }}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Start manually
                    </MenuItem>
                    <MenuItem
                      dense
                      onClick={() => { setV3NewDenialAnchor(null); setV3ShowUpload(true) }}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Upload files
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}

          {/* Page body */}
          <Box key={pageKey} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box
              key={transitionKey}
              sx={{
                flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                ...(transitionKey > 0 && {
                  '@keyframes sdxSlideInRight': { from: { transform: 'translateX(28px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
                  '@keyframes sdxSlideInLeft':  { from: { transform: 'translateX(-28px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
                  animation: `${transitionDir === 'forward' ? 'sdxSlideInRight' : 'sdxSlideInLeft'} 220ms cubic-bezier(0.2, 0, 0, 1)`,
                }),
              }}
            >
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'v1' && <DenialListStyleEPage />}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'v2' && !selectedV2CaseId && (
              <DenialsWorklistV2Page
                denials={visibleDenials}
                onSelectDenial={handleV2SelectDenial}
                reviewCompleteIds={v2ReviewCompleteIds}
                initialTab={v2ReturnTab}
                assignedToMe={v2AssignedToMe}
                onAssignedToMeChange={setV2AssignedToMe}
                onAssign={(denialId: string, member: TeamMember | null) => setDenials(prev => prev.map(d => d.id === denialId ? { ...d, assignedTo: member } : d))}
              />
            )}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'v2' && selectedV2CaseId && (
              <CasePageAiEditing
                hideNav
                onBack={() => setSelectedV2CaseId(null)}
                caseRecord={visibleDenials.find(d => d.id === selectedV2CaseId) ?? undefined}
                onStatusAction={handleV2StatusAction}
              />
            )}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'v3' && (
              <DenialsWorklistV3Page denials={visibleDenials} />
            )}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'ingest-mvp' && !selectedV2CaseId && (
              <DenialsWorklistV3Page
                denials={visibleDenials}
                onSelectDenial={handleV2SelectDenial}
                reviewCompleteIds={v2ReviewCompleteIds}
                initialTab={v2ReturnTab}
                assignedToMe={v2AssignedToMe}
                onAssignedToMeChange={setV2AssignedToMe}
                onAssign={(denialId: string, member: TeamMember | null) => setDenials(prev => prev.map(d => d.id === denialId ? { ...d, assignedTo: member } : d))}
              />
            )}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'ingest-mvp' && selectedV2CaseId && (
              <CasePageAiEditing
                hideNav
                onBack={() => setSelectedV2CaseId(null)}
                caseRecord={visibleDenials.find(d => d.id === selectedV2CaseId) ?? undefined}
                onStatusAction={handleV2StatusAction}
              />
            )}
            {systemMode === 'existing' && existingNav === 'worklist' && denialsView === 'future-scope' && (
              <DenialsWorklistFutureScopePage denials={visibleDenials} />
            )}
            {systemMode === 'existing' && existingNav === 'new-denial' && (
              <NewDenialFlow encounterOnly={returnContext !== null} fromDrawer={returnContext !== null} onDone={() => { setTransitionDir('back'); setTransitionKey(k => k + 1); setExistingNav('ingest') }} />
            )}
            {systemMode === 'existing' && existingNav === 'new-denial-details' && (
              <NewDenialFlow initialStep="details" fromDrawer={returnContext !== null} recordId={returnContext?.recordId} onDone={() => { setTransitionDir('back'); setTransitionKey(k => k + 1); setExistingNav('ingest') }} />
            )}
            {systemMode === 'existing' && existingNav === 'ingest' && denialsView === 'v1' && (
              <>
                <Box
                  sx={{
                    mx: 3, my: 2, flexShrink: 0,
                    border: '2px dashed #e2e6e9', borderRadius: 2,
                    p: 3, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 0.75,
                    cursor: 'pointer', bgcolor: '#fafafa',
                    '&:hover': { bgcolor: '#f0f4f6', borderColor: '#b6d7e1' },
                  }}
                >
                  <UploadFileOutlined sx={{ fontSize: 32, color: '#939a9f' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#4a5154' }}>
                    Drop files here or click to browse
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#939a9f', textAlign: 'center' }}>
                    Appeal letters are created using patient data. Data availability varies per location.
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#939a9f', textAlign: 'center' }}>
                    Accepted formats: <strong>.pdf</strong> and <strong>.docx</strong>
                  </Typography>
                </Box>
                <Box sx={{ mx: 3, mb: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e6e9', borderRadius: 2, bgcolor: '#fff' }}>
                  <IngestPage features={features} onNavigate={(nav, returnCtx) => {
                    if (nav === 'Denials') { setReturnContext(null); setExistingNav('worklist') }
                    else if (nav === 'new-denial') { setReturnContext(returnCtx ?? null); setTransitionDir('forward'); setTransitionKey(k => k + 1); setExistingNav('new-denial') }
                    else if (nav === 'new-denial-details') { setReturnContext(returnCtx ?? null); setTransitionDir('forward'); setTransitionKey(k => k + 1); setExistingNav('new-denial-details') }
                  }} mode="existing" initialOpenDrawer={returnContext} />
                </Box>
              </>
            )}
            {systemMode === 'existing' && existingNav === 'ingest' && (denialsView === 'ingest-mvp' || denialsView === 'v3' || denialsView === 'v2') && (
              <IngestPage features={features} onNavigate={(nav, returnCtx) => {
                if (nav === 'Denials') { setReturnContext(null); setExistingNav('worklist') }
                else if (nav === 'new-denial') { setReturnContext(returnCtx ?? null); setTransitionDir('forward'); setTransitionKey(k => k + 1); setExistingNav('new-denial') }
                else if (nav === 'new-denial-details') { setReturnContext(returnCtx ?? null); setTransitionDir('forward'); setTransitionKey(k => k + 1); setExistingNav('new-denial-details') }
              }} mode="existing" initialOpenDrawer={returnContext} inlinePanels showUpload={v3ShowUpload} onShowUploadChange={setV3ShowUpload}
              newDenialPanelOpen={v3NewDenialPanelOpen} onNewDenialPanelClose={() => setV3NewDenialPanelOpen(false)} />
            )}
            {systemMode === 'new' && showingWorklist && (
              <WorklistPage
                denials={visibleDenials} onDenialsChange={setDenials} onSelectDenial={handleSelectDenial}
                activeTab={worklistTab} onActiveTabChange={setWorklistTab}
                sort={worklistSort} onSortChange={setWorklistSort}
                filters={worklistFilters} onFiltersChange={setWorklistFilters}
              />
            )}
            {systemMode === 'new' && showingDetail && selectedDenialId && (() => {
              const selectedDenial = visibleDenials.find(d => d.id === selectedDenialId)
              if (!selectedDenial) return null
              return (
                <DenialDetailPage
                  denial={selectedDenial}
                  onBack={handleBack}
                  onDenialUpdate={updates => setDenials(prev => prev.map(d => d.id === selectedDenialId ? { ...d, ...updates } : d))}
                  onSubmitSuccess={handleSubmitSuccess}
                  onNavigateToDenial={id => setSelectedDenialId(id)}
                  allDenials={visibleDenials}
                  onUpdateDenial={(id, updates) => setDenials(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))}
                  onNavigateToCase={(caseId, caseType) => {
                    if (caseType === 'denial') { setSelectedDenialId(caseId) }
                    else if (caseType === 'underpayment') { setActiveNav('Underpayments'); setSelectedUnderpaymentId(caseId) }
                    else { setActiveNav('Audits'); setSelectedAuditId(caseId) }
                  }}
                />
              )
            })()}
            {systemMode === 'new' && showingUPWorklist && (
              <UnderpaymentWorklistPage onSelectUnderpayment={id => setSelectedUnderpaymentId(id)} />
            )}
            {systemMode === 'new' && showingUPDetail && selectedUnderpaymentId && (
              <UnderpaymentDetailPage
                underpaymentId={selectedUnderpaymentId}
                onBack={() => setSelectedUnderpaymentId(null)}
                onNavigateToCase={(caseId, caseType) => {
                  if (caseType === 'underpayment') { setSelectedUnderpaymentId(caseId) }
                  else if (caseType === 'denial') { setActiveNav('Denials'); setSelectedDenialId(caseId) }
                  else { setActiveNav('Audits'); setSelectedAuditId(caseId) }
                }}
              />
            )}
            {systemMode === 'new' && showingAuditWorklist && (
              <AuditWorklistPage audits={audits} onSelectAudit={id => setSelectedAuditId(id)} />
            )}
            {systemMode === 'new' && showingAuditDetail && selectedAuditId && (() => {
              const audit = audits.find(a => a.id === selectedAuditId)
              if (!audit) return null
              return (
                <AuditDetailPage
                  audit={audit}
                  onBack={() => setSelectedAuditId(null)}
                  onNavigateToCase={(caseId, caseType) => {
                    if (caseType === 'audit') { setSelectedAuditId(caseId) }
                    else if (caseType === 'denial') { setActiveNav('Denials'); setSelectedDenialId(caseId) }
                    else { setActiveNav('Underpayments'); setSelectedUnderpaymentId(caseId) }
                  }}
                />
              )
            })()}
            {systemMode === 'new' && activeNav === 'Dashboard' && (
              <ErrorBoundary>
                <DashboardPage
                  denials={visibleDenials}
                  underpayments={SEED_UNDERPAYMENTS}
                  audits={audits}
                  features={features}
                  userRole={userRole}
                  onNavigate={nav => handleNavClick(nav)}
                  onSelectCase={(type, id) => {
                    if (type === 'denial')      { setActiveNav('Denials');      setSelectedDenialId(id) }
                    else if (type === 'underpayment') { setActiveNav('Underpayments'); setSelectedUnderpaymentId(id) }
                    else                        { setActiveNav('Audits');       setSelectedAuditId(id) }
                  }}
                />
              </ErrorBoundary>
            )}
            {systemMode === 'new' && activeNav === 'Ingest' && (
              <Box sx={{ mx: 3, my: 2, display: 'flex', flexDirection: 'column', border: '1px solid #e2e6e9', borderRadius: 2, bgcolor: '#fff', overflow: 'auto' }}>
                <IngestPage features={features} onNavigate={nav => handleNavClick(nav as NavItem)} />
              </Box>
            )}
            {systemMode === 'new' && activeNav === 'Routing Rules' && <RoutingRulesPage />}
            {systemMode === 'new' && activeNav === 'Style E' && <DenialListStyleEPage />}
            {systemMode === 'new' && activeNav === 'Archive' && <ArchiveListView denials={denials} />}
            {systemMode === 'new' && activeNav === 'Settings' && (
              <SettingsPage onReset={() => {
                setDenials(SEED_DENIALS)
                setAudits(SEED_AUDITS)
                setSelectedDenialId(null)
                setSelectedAuditId(null)
                setWorklistTab('Queue')
                setWorklistSort(null)
                setWorklistFilters(DEFAULT_WORKLIST_FILTERS)
                setNotifications(SEED_NOTIFICATIONS)
              }} />
            )}
            </Box>
          </Box>
        </Box>

      </Box>
      </ErrorBoundary>

      {/* ── Notifications Popover ─────────────────────────────────────────────── */}
      <Popover
        open={Boolean(bellAnchor)}
        anchorEl={bellAnchor}
        onClose={() => setBellAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, borderRadius: 2, mt: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</Typography>
          {notifications.some(n => !n.read) && (
            <Button size="small" sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'primary.main', fontWeight: 600, py: 0.25 }}
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
              Mark all read
            </Button>
          )}
        </Box>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.disabled">No notifications</Typography>
            </Box>
          ) : notifications.map(n => (
            <Box
              key={n.id}
              onClick={() => {
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                if (n.denialId) { setActiveNav('Denials'); setSelectedDenialId(n.denialId) }
                if (!n.denialId) setBellAnchor(null)
              }}
              sx={{
                px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: n.read ? 'transparent' : '#e8f2f5',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.50' },
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: n.read ? 'transparent' : NOTIF_ICON_COLORS[n.type], flexShrink: 0, mt: 0.75 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.read ? 500 : 700, fontSize: '0.8125rem', flex: 1 }}>{n.title}</Typography>
                  <Chip label={NOTIF_LABELS[n.type]} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 }, bgcolor: NOTIF_ICON_COLORS[n.type] + '20', color: NOTIF_ICON_COLORS[n.type], flexShrink: 0 }} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', lineHeight: 1.4 }}>{n.body}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>{timeAgo(n.timestamp)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>

      {/* ── Prototype Widget ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
          bgcolor: '#1A1A1A', color: '#fff', borderRadius: 1.5,
          px: 2, py: 1.25, display: 'flex', flexDirection: 'column', gap: 0.875,
          minWidth: 140,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.125 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
            PROTOTYPE
          </Typography>
          <Tooltip title="Reset page" placement="top">
            <IconButton
              size="small"
              onClick={() => setPageKey(k => k + 1)}
              sx={{ p: 0.25, color: 'rgba(255,255,255,0.35)', '&:hover': { color: 'rgba(255,255,255,0.8)', bgcolor: 'transparent' } }}
            >
              <RestartAltOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Current branch ── */}
        <Box>
          <Box
            onClick={() => setSystemMode('existing')}
            sx={{
              px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer',
              fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex',
              bgcolor: systemMode === 'existing' ? '#fff' : 'rgba(255,255,255,0.12)',
              color: systemMode === 'existing' ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
              '&:hover': { bgcolor: systemMode === 'existing' ? '#fff' : 'rgba(255,255,255,0.2)' },
            }}
          >
            Current
          </Box>

          {/* Version sub-toggles — indented, subordinate styling */}
          <Box sx={{ display: 'flex', gap: 0.375, mt: 0.625, ml: 0.375, pl: 0.5 }}>
            {(['v1', 'v2', 'v3'] as const).map(v => {
              const active = systemMode === 'existing' && denialsView === v
              return (
                <Box
                  key={v}
                  onClick={() => { setSystemMode('existing'); setDenialsView(v); setExistingNav('worklist') }}
                  sx={{
                    px: 0.875, py: 0.3125, borderRadius: 0.75, cursor: 'pointer',
                    fontSize: '0.65rem', fontWeight: 600,
                    bgcolor: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                    color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' },
                  }}
                >
                  {v.toUpperCase()}
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: -0.5 }} />

        {/* ── Ingest panel mvp ── */}
        <Box>
          <Box
            onClick={() => { setSystemMode('existing'); setDenialsView('ingest-mvp'); setExistingNav('ingest') }}
            sx={{
              px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer',
              fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex',
              bgcolor: systemMode === 'existing' && denialsView === 'ingest-mvp' ? '#fff' : 'rgba(255,255,255,0.12)',
              color: systemMode === 'existing' && denialsView === 'ingest-mvp' ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
              '&:hover': { bgcolor: systemMode === 'existing' && denialsView === 'ingest-mvp' ? '#fff' : 'rgba(255,255,255,0.2)' },
            }}
          >
            Ingest panel mvp
          </Box>
        </Box>

        {/* ── Ingest panel future state ── */}
        <Box>
          <Box
            onClick={() => { setSystemMode('existing'); setDenialsView('v3'); setExistingNav('ingest') }}
            sx={{
              px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer',
              fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex',
              bgcolor: systemMode === 'existing' && denialsView === 'v3' ? '#fff' : 'rgba(255,255,255,0.12)',
              color: systemMode === 'existing' && denialsView === 'v3' ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
              '&:hover': { bgcolor: systemMode === 'existing' && denialsView === 'v3' ? '#fff' : 'rgba(255,255,255,0.2)' },
            }}
          >
            Ingest panel future state
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: -0.5 }} />

        {/* ── Future scope ── */}
        <Box>
          <Box
            onClick={() => { setSystemMode('existing'); setDenialsView('future-scope'); setExistingNav('worklist') }}
            sx={{
              px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer',
              fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex',
              bgcolor: systemMode === 'existing' && denialsView === 'future-scope' ? '#fff' : 'rgba(255,255,255,0.12)',
              color: systemMode === 'existing' && denialsView === 'future-scope' ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
              '&:hover': { bgcolor: systemMode === 'existing' && denialsView === 'future-scope' ? '#fff' : 'rgba(255,255,255,0.2)' },
            }}
          >
            Future scope
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: -0.5 }} />

        {/* ── Old branch ── */}
        <Box>
          <Box
            onClick={() => setSystemMode('new')}
            sx={{
              px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer',
              fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex',
              bgcolor: systemMode === 'new' ? '#fff' : 'rgba(255,255,255,0.12)',
              color: systemMode === 'new' ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
              '&:hover': { bgcolor: systemMode === 'new' ? '#fff' : 'rgba(255,255,255,0.2)' },
            }}
          >
            Old
          </Box>

          {systemMode === 'new' && (
            <Box sx={{ mt: 0.625 }}>
              <Box
                onClick={() => setWidgetExpanded(e => !e)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                  color: 'rgba(255,255,255,0.38)', fontSize: '0.6rem', fontWeight: 700,
                  letterSpacing: '0.08em', userSelect: 'none',
                  '&:hover': { color: 'rgba(255,255,255,0.65)' },
                }}
              >
                {widgetExpanded
                  ? <ExpandLessOutlined sx={{ fontSize: 12 }} />
                  : <ExpandMoreOutlined sx={{ fontSize: 12 }} />}
                {widgetExpanded ? 'FEWER OPTIONS' : 'MORE OPTIONS'}
              </Box>

              {widgetExpanded && (
                <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.875 }}>
                  {/* VIEW AS */}
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)', mb: 0.625 }}>
                      VIEW AS
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {([
                        { role: 'Manager' as UserRole, label: 'Manager' },
                        { role: 'FrontlineWorker' as UserRole, label: 'Frontline' },
                      ]).map(({ role, label }) => (
                        <Box
                          key={role}
                          onClick={() => {
                            setUserRole(role)
                            if (role === 'FrontlineWorker' && activeNav === 'Archive') setActiveNav('Denials')
                          }}
                          sx={{
                            px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                            bgcolor: userRole === role ? '#fff' : 'rgba(255,255,255,0.12)',
                            color: userRole === role ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
                            '&:hover': { bgcolor: userRole === role ? '#fff' : 'rgba(255,255,255,0.2)' },
                          }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* PACKAGE */}
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)', mb: 0.625 }}>
                      PACKAGE
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                      {([
                        { key: 'denials' as const, label: 'Denials' },
                        { key: 'underpayments' as const, label: 'Underpay.' },
                        { key: 'audits' as const, label: 'Audits' },
                      ]).map(({ key, label }) => (
                        <Box
                          key={key}
                          onClick={() => {
                            const next = { ...features, [key]: !features[key] }
                            setFeatures(next)
                            if (!next[key] && activeNav.toLowerCase() === key) setActiveNav('Dashboard')
                          }}
                          sx={{
                            px: 1.25, py: 0.5, borderRadius: 1, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                            bgcolor: features[key] ? '#fff' : 'rgba(255,255,255,0.12)',
                            color: features[key] ? '#1A1A1A' : 'rgba(255,255,255,0.5)',
                            '&:hover': { bgcolor: features[key] ? '#f0f0f0' : 'rgba(255,255,255,0.2)' },
                          }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ borderRadius: 2, fontWeight: 500 }}>
          {toast?.message}
        </Alert>
      </Snackbar>

    </ThemeProvider>
  )
}
