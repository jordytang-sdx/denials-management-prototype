import { useState, useRef } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Chip, Avatar, Tooltip, IconButton,
  Button, Paper, Badge, Snackbar, Alert, Popover,
} from '@mui/material'
import {
  DashboardOutlined, ListAltOutlined, UploadFileOutlined,
  SettingsOutlined, AccountTreeOutlined,
  NotificationsOutlined, HelpOutlineOutlined, RestartAltOutlined,
  ChevronLeftOutlined, ChevronRightOutlined,
} from '@mui/icons-material'
import theme from './theme'
import smarterDxLogo from './assets/SmarterDX.svg'
import WorklistPage, {
  type WorklistActiveTab, type WorklistSort, type WorklistFilters, DEFAULT_WORKLIST_FILTERS,
} from './pages/WorklistPage'
import DenialDetailPage from './pages/DenialDetailPage'
import DashboardPage from './pages/DashboardPage'
import IngestPage from './pages/IngestPage'
import RoutingRulesPage from './pages/RoutingRulesPage'
import { SEED_DENIALS, type DenialRecord } from './data/denials'

const SIDEBAR_WIDTH = 224
const SIDEBAR_COLLAPSED_WIDTH = 56

type NavItem = 'Dashboard' | 'Worklist' | 'Ingest' | 'Routing Rules' | 'Settings'

const navItems: { label: NavItem; icon: React.ReactNode }[] = [
  { label: 'Dashboard',     icon: <DashboardOutlined fontSize="small" /> },
  { label: 'Worklist',      icon: <ListAltOutlined fontSize="small" /> },
  { label: 'Ingest',        icon: <UploadFileOutlined fontSize="small" /> },
  { label: 'Routing Rules', icon: <AccountTreeOutlined fontSize="small" /> },
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
  submitted:  '#2557D6',
  attention:  '#B7770D',
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

const PAGE_SUBTITLES: Omit<Record<NavItem, string>, 'Worklist'> & { Worklist?: string } = {
  Dashboard:       'Operational snapshot and trend analysis',
  Ingest:          'Upload 835s and PDFs for processing',
  'Routing Rules': 'Configure routing logic by payer and denial type',
  Settings:        'Client configuration and system preferences',
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

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>('Worklist')
  const [navCollapsed, setNavCollapsed] = useState(false)
  const sidebarWidth = navCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
  const [selectedDenialId, setSelectedDenialId] = useState<string | null>(null)
  const [denials, setDenials] = useState<DenialRecord[]>(SEED_DENIALS)
  const [worklistTab, setWorklistTab] = useState<WorklistActiveTab>('Active')
  const [worklistSort, setWorklistSort] = useState<WorklistSort>(null)
  const [worklistFilters, setWorklistFilters] = useState<WorklistFilters>(DEFAULT_WORKLIST_FILTERS)
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS)
  const [ingestKey, setIngestKey] = useState(0)
  const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  function handleSelectDenial(id: string) {
    setSelectedDenialId(id)
  }

  function handleBack() {
    setSelectedDenialId(null)
  }

  function handleNavClick(label: NavItem) {
    setActiveNav(label)
    setSelectedDenialId(null)
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

  const showingDetail  = activeNav === 'Worklist' && selectedDenialId !== null
  const showingWorklist = activeNav === 'Worklist' && !showingDetail

  const isTerminal = (s: string) => s === 'Resolved' || s === 'Closed' || s === 'Archived'
  const openCount     = denials.filter(d => !isTerminal(d.state)).length
  const deadlineCount = denials.filter(d => {
    if (isTerminal(d.state)) return false
    const days = Math.ceil((new Date(d.deadline).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 3
  }).length

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── AppBar ──────────────────────────────────────────────────────────── */}
        <AppBar
          position="fixed"
          sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: '#FFFFFF', height: 52, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 52, px: 2, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, bgcolor: '#0F2057', borderRadius: 1.5, px: 1.5, py: 0.625 }}>
              <Box component="img" src={smarterDxLogo} alt="SmarterDX" sx={{ height: 22, display: 'block' }} />
            </Box>

            <Chip
              label="Memorial Health System"
              size="small"
              sx={{
                bgcolor: '#EEF2FF', color: '#2557D6',
                fontWeight: 500, fontSize: '0.75rem', border: '1px solid #C7D7FA',
              }}
            />

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
            <Tooltip title="Jordan Tang — RCM Specialist">
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.dark', cursor: 'pointer', ml: 0.5 }}>
                JT
              </Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
        <Drawer
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
              bgcolor: '#F8F9FB',
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
            {navItems.map(({ label, icon }) => (
              <Tooltip key={label} title={navCollapsed ? label : ''} placement="right">
                <ListItemButton
                  selected={activeNav === label}
                  onClick={() => handleNavClick(label)}
                  sx={{
                    borderRadius: 1.5, mb: 0.25,
                    px: navCollapsed ? 1 : 1.5, py: 0.75,
                    justifyContent: navCollapsed ? 'center' : 'flex-start',
                    minWidth: 0,
                    '&.Mui-selected': {
                      bgcolor: '#EEF2FF', color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: '#E0E9FF' },
                    },
                    '&:hover': { bgcolor: 'rgba(37,87,214,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: navCollapsed ? 0 : 32, color: 'text.secondary', justifyContent: 'center' }}>{icon}</ListItemIcon>
                  {!navCollapsed && (
                    <>
                      <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }} />
                      {label === 'Worklist' && openCount > 0 && (
                        <Chip label={openCount} size="small" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'error.main', color: '#fff', '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                    </>
                  )}
                  {navCollapsed && label === 'Worklist' && openCount > 0 && (
                    <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
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
                      bgcolor: '#EEF2FF', color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                    },
                    '&:hover': { bgcolor: 'rgba(37,87,214,0.06)' },
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
                  '&:hover': { bgcolor: 'rgba(37,87,214,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: navCollapsed ? 0 : 32, color: 'text.secondary', justifyContent: 'center' }}>
                  {navCollapsed ? <ChevronRightOutlined fontSize="small" /> : <ChevronLeftOutlined fontSize="small" />}
                </ListItemIcon>
                {!navCollapsed && <ListItemText primary="Collapse" primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.secondary' }} />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Drawer>

        {/* ── Main Content ─────────────────────────────────────────────────────── */}
        <Box
          component="main"
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', mt: '52px', overflow: 'hidden', bgcolor: 'background.default' }}
        >
          {/* Page header — hidden for Worklist (owns its own header) and detail (has its own header) */}
          {!showingDetail && !showingWorklist && (
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
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{activeNav}</Typography>
                <Typography variant="body2">
                  {activeNav === 'Worklist'
                    ? `${openCount} open denial${openCount !== 1 ? 's' : ''}${deadlineCount > 0 ? ` · ${deadlineCount} approaching deadline` : ''}`
                    : PAGE_SUBTITLES[activeNav]}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Page body */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {showingWorklist && (
              <WorklistPage
                denials={denials} onDenialsChange={setDenials} onSelectDenial={handleSelectDenial}
                activeTab={worklistTab} onActiveTabChange={setWorklistTab}
                sort={worklistSort} onSortChange={setWorklistSort}
                filters={worklistFilters} onFiltersChange={setWorklistFilters}
              />
            )}
            {showingDetail && selectedDenialId && (() => {
              const selectedDenial = denials.find(d => d.id === selectedDenialId)
              if (!selectedDenial) return null
              return (
                <DenialDetailPage
                  denial={selectedDenial}
                  onBack={handleBack}
                  onDenialUpdate={updates => setDenials(prev => prev.map(d => d.id === selectedDenialId ? { ...d, ...updates } : d))}
                  onSubmitSuccess={handleSubmitSuccess}
                  onNavigateToDenial={id => setSelectedDenialId(id)}
                  allDenials={denials}
                  onUpdateDenial={(id, updates) => setDenials(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))}
                />
              )
            })()}
            {activeNav === 'Dashboard' && <DashboardPage denials={denials} />}
            {activeNav === 'Ingest' && <IngestPage key={ingestKey} denials={denials} onCommit={newRecords => setDenials(prev => [...newRecords, ...prev])} onUpdate={(id, updates) => setDenials(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))} />}
            {activeNav === 'Routing Rules' && <RoutingRulesPage />}
            {activeNav === 'Settings' && (
              <SettingsPage onReset={() => {
                setDenials(SEED_DENIALS)
                setSelectedDenialId(null)
                setWorklistTab('Active')
                setWorklistSort(null)
                setWorklistFilters(DEFAULT_WORKLIST_FILTERS)
                setNotifications(SEED_NOTIFICATIONS)
                setIngestKey(k => k + 1)
              }} />
            )}
            {activeNav !== 'Worklist' && activeNav !== 'Dashboard' && activeNav !== 'Ingest' && activeNav !== 'Routing Rules' && activeNav !== 'Settings' && (
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Box
                  sx={{
                    height: '100%', minHeight: 400, border: '2px dashed',
                    borderColor: 'divider', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2">{activeNav} content area</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

      </Box>

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
                if (n.denialId) { setActiveNav('Worklist'); setSelectedDenialId(n.denialId) }
                if (!n.denialId) setBellAnchor(null)
              }}
              sx={{
                px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: n.read ? 'transparent' : '#F5F8FF',
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
