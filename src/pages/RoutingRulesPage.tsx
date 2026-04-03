import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Chip, Divider, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Drawer, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Stack, Alert,
} from '@mui/material'
import {
  AddOutlined, EditOutlined, DeleteOutlined, ArrowUpwardOutlined,
  ArrowDownwardOutlined, CheckCircleOutlined, CancelOutlined,
  AccountTreeOutlined, FilterListOutlined,
} from '@mui/icons-material'
import { TEAM_MEMBERS, type TeamMember } from '../data/denials'

// ── Types ────────────────────────────────────────────────────────────────────

type ConditionField = 'payer' | 'denialType' | 'carc' | 'amount' | 'serviceType'
type ConditionOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
type ResolutionEngine = 'appeal' | 'corrected_claim' | 'underpayment' | null
type Priority = 'High' | 'Medium' | 'Low'

interface RoutingCondition {
  id: string
  field: ConditionField
  operator: ConditionOperator
  value: string
}

interface RoutingAction {
  assignToId: string | null   // team member id or null = unassigned
  resolutionEngine: ResolutionEngine
  priority: Priority
  autoAccept: boolean
  slaDays: number
}

interface RoutingRule {
  id: string
  name: string
  description: string
  priority: number   // 1 = evaluated first
  enabled: boolean
  conditionLogic: 'AND' | 'OR'
  conditions: RoutingCondition[]
  action: RoutingAction
  matchCount: number
  lastMatched: string | null
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const ENGINE_LABELS: Record<Exclude<ResolutionEngine, null>, string> = {
  appeal:          'Appeal',
  corrected_claim: 'Corrected Claim',
  underpayment:    'Payment Dispute',
}

const FIELD_LABELS: Record<ConditionField, string> = {
  payer:       'Payer',
  denialType:  'Denial Type',
  carc:        'CARC Code',
  amount:      'Denied Amount',
  serviceType: 'Service Type',
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals:      'equals',
  contains:    'contains',
  greaterThan: '>',
  lessThan:    '<',
  in:          'is one of',
}

const PAYER_OPTIONS = ['Blue Cross Blue Shield', 'UnitedHealthcare', 'Aetna', 'Cigna', 'Medicare', 'Medicaid', 'Humana']
const DENIAL_TYPE_OPTIONS = ['DRG Downgrade', 'Medical Necessity', 'Prior Authorization', 'Underpayment', 'Duplicate Claim', 'Timely Filing', 'Corrected Claim']
const SERVICE_TYPE_OPTIONS = ['Inpatient', 'Outpatient', 'Emergency', 'Surgical', 'Observation', 'Rehab']

const SEED_RULES: RoutingRule[] = [
  {
    id: 'rr-001',
    name: 'DRG Downgrade → Senior Reviewer',
    description: 'All DRG downgrades require clinical review by Sarah Chen; set to 14-day SLA.',
    priority: 1,
    enabled: true,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'denialType', operator: 'equals', value: 'DRG Downgrade' },
    ],
    action: {
      assignToId: 'sc',
      resolutionEngine: 'appeal',
      priority: 'High',
      autoAccept: true,
      slaDays: 14,
    },
    matchCount: 47,
    lastMatched: '2026-04-02',
  },
  {
    id: 'rr-002',
    name: 'UHC High-Dollar Medical Necessity',
    description: 'UnitedHealthcare med-necessity denials over $5,000 are escalated to Marcus Webb with aggressive SLA.',
    priority: 2,
    enabled: true,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'payer', operator: 'equals', value: 'UnitedHealthcare' },
      { id: 'c2', field: 'denialType', operator: 'equals', value: 'Medical Necessity' },
      { id: 'c3', field: 'amount', operator: 'greaterThan', value: '5000' },
    ],
    action: {
      assignToId: 'mw',
      resolutionEngine: 'appeal',
      priority: 'High',
      autoAccept: true,
      slaDays: 10,
    },
    matchCount: 23,
    lastMatched: '2026-04-01',
  },
  {
    id: 'rr-003',
    name: 'Prior Auth Denials → Priya Nair',
    description: 'Route all prior authorization denials to Priya Nair for retrospective auth follow-up.',
    priority: 3,
    enabled: true,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'denialType', operator: 'equals', value: 'Prior Authorization' },
    ],
    action: {
      assignToId: 'pn',
      resolutionEngine: 'appeal',
      priority: 'Medium',
      autoAccept: true,
      slaDays: 21,
    },
    matchCount: 31,
    lastMatched: '2026-03-31',
  },
  {
    id: 'rr-004',
    name: 'Underpayment CARC-45 → Payment Dispute',
    description: 'CARC-45 (contracted rate) denials go directly into the payment dispute workflow.',
    priority: 4,
    enabled: true,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'carc', operator: 'contains', value: 'CARC-45' },
    ],
    action: {
      assignToId: 'dr',
      resolutionEngine: 'underpayment',
      priority: 'Medium',
      autoAccept: true,
      slaDays: 30,
    },
    matchCount: 18,
    lastMatched: '2026-03-29',
  },
  {
    id: 'rr-005',
    name: 'Corrected Claim (CO-16) → Devon Ross',
    description: 'Coding errors flagged by CO-16 are routed to Devon Ross for corrected claim submission.',
    priority: 5,
    enabled: true,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'carc', operator: 'contains', value: 'CARC-16' },
    ],
    action: {
      assignToId: 'dr',
      resolutionEngine: 'corrected_claim',
      priority: 'Medium',
      autoAccept: true,
      slaDays: 14,
    },
    matchCount: 12,
    lastMatched: '2026-03-27',
  },
  {
    id: 'rr-006',
    name: 'Low-Dollar Write-Off',
    description: 'Denials under $250 are auto-closed as Will Not Appeal to preserve team capacity.',
    priority: 6,
    enabled: false,
    conditionLogic: 'AND',
    conditions: [
      { id: 'c1', field: 'amount', operator: 'lessThan', value: '250' },
    ],
    action: {
      assignToId: null,
      resolutionEngine: null,
      priority: 'Low',
      autoAccept: false,
      slaDays: 0,
    },
    matchCount: 8,
    lastMatched: '2026-03-15',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function conditionSummary(conditions: RoutingCondition[], logic: 'AND' | 'OR'): string {
  if (conditions.length === 0) return 'No conditions'
  return conditions
    .map(c => `${FIELD_LABELS[c.field]} ${OPERATOR_LABELS[c.operator]} "${c.value}"`)
    .join(logic === 'AND' ? ' AND ' : ' OR ')
}

function actionSummary(action: RoutingAction, members: TeamMember[]): string {
  const parts: string[] = []
  if (action.resolutionEngine) parts.push(ENGINE_LABELS[action.resolutionEngine])
  const member = members.find(m => m.id === action.assignToId)
  if (member) parts.push(`→ ${member.name}`)
  else parts.push('→ Unassigned')
  parts.push(action.priority)
  if (action.slaDays > 0) parts.push(`${action.slaDays}d SLA`)
  return parts.join(' · ')
}

function priorityColor(p: Priority): 'error' | 'warning' | 'default' {
  if (p === 'High') return 'error'
  if (p === 'Medium') return 'warning'
  return 'default'
}

function nextId(): string {
  return `c${Date.now()}`
}

// ── Rule Edit Drawer ─────────────────────────────────────────────────────────

const BLANK_RULE: Omit<RoutingRule, 'id' | 'matchCount' | 'lastMatched'> = {
  name: '',
  description: '',
  priority: 99,
  enabled: true,
  conditionLogic: 'AND',
  conditions: [],
  action: {
    assignToId: null,
    resolutionEngine: 'appeal',
    priority: 'Medium',
    autoAccept: true,
    slaDays: 14,
  },
}

interface RuleDrawerProps {
  rule: RoutingRule | null   // null = creating new
  onClose: () => void
  onSave: (rule: RoutingRule) => void
}

function RuleDrawer({ rule, onClose, onSave }: RuleDrawerProps) {
  const isNew = rule === null
  const initial = rule ?? { ...BLANK_RULE, id: `rr-${Date.now()}`, matchCount: 0, lastMatched: null }

  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [logic, setLogic] = useState<'AND' | 'OR'>(initial.conditionLogic)
  const [conditions, setConditions] = useState<RoutingCondition[]>(initial.conditions)
  const [action, setAction] = useState<RoutingAction>(initial.action)
  const [enabled, setEnabled] = useState(initial.enabled)

  function addCondition() {
    setConditions(prev => [...prev, { id: nextId(), field: 'payer', operator: 'equals', value: '' }])
  }

  function removeCondition(id: string) {
    setConditions(prev => prev.filter(c => c.id !== id))
  }

  function updateCondition(id: string, patch: Partial<RoutingCondition>) {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      ...initial,
      name: name.trim(),
      description: description.trim(),
      conditionLogic: logic,
      conditions,
      action,
      enabled,
    })
  }

  const fieldOptions: { value: ConditionField; label: string }[] = [
    { value: 'payer', label: 'Payer' },
    { value: 'denialType', label: 'Denial Type' },
    { value: 'carc', label: 'CARC Code' },
    { value: 'amount', label: 'Denied Amount ($)' },
    { value: 'serviceType', label: 'Service Type' },
  ]

  function operatorsFor(field: ConditionField): ConditionOperator[] {
    if (field === 'amount') return ['equals', 'greaterThan', 'lessThan']
    return ['equals', 'contains', 'in']
  }

  function valueOptionsFor(field: ConditionField): string[] | null {
    if (field === 'payer') return PAYER_OPTIONS
    if (field === 'denialType') return DENIAL_TYPE_OPTIONS
    if (field === 'serviceType') return SERVICE_TYPE_OPTIONS
    return null
  }

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: 520, display: 'flex', flexDirection: 'column' } }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isNew ? 'New Routing Rule' : 'Edit Rule'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isNew ? 'Define conditions and the action to take when they match.' : `Editing: ${rule.name}`}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Name + Description */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1 }}>Rule Info</Typography>
          <TextField
            label="Rule Name"
            size="small"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            error={!name.trim()}
            helperText={!name.trim() ? 'Required' : ''}
          />
          <TextField
            label="Description (optional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Rule enabled</Typography>}
          />
        </Box>

        <Divider />

        {/* Conditions */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1 }}>Conditions</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {conditions.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select value={logic} onChange={e => setLogic(e.target.value as 'AND' | 'OR')} sx={{ fontSize: '0.75rem' }}>
                    <MenuItem value="AND">ALL (AND)</MenuItem>
                    <MenuItem value="OR">ANY (OR)</MenuItem>
                  </Select>
                </FormControl>
              )}
              <Button size="small" startIcon={<AddOutlined />} onClick={addCondition}>Add</Button>
            </Box>
          </Box>

          {conditions.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
              No conditions — this rule will match all incoming denials.
            </Typography>
          )}

          <Stack spacing={1.5}>
            {conditions.map((cond, i) => {
              const valueOpts = valueOptionsFor(cond.field)
              const operators = operatorsFor(cond.field)
              return (
                <Paper key={cond.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {i === 0 ? 'IF' : logic}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => removeCondition(cond.id)}>
                      <CancelOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>Field</InputLabel>
                      <Select
                        label="Field"
                        value={cond.field}
                        onChange={e => updateCondition(cond.id, { field: e.target.value as ConditionField, operator: 'equals', value: '' })}
                      >
                        {fieldOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        label="Operator"
                        value={operators.includes(cond.operator) ? cond.operator : operators[0]}
                        onChange={e => updateCondition(cond.id, { operator: e.target.value as ConditionOperator })}
                      >
                        {operators.map(op => <MenuItem key={op} value={op}>{OPERATOR_LABELS[op]}</MenuItem>)}
                      </Select>
                    </FormControl>
                    {valueOpts ? (
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Value</InputLabel>
                        <Select
                          label="Value"
                          value={cond.value}
                          onChange={e => updateCondition(cond.id, { value: e.target.value })}
                        >
                          {valueOpts.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        size="small"
                        label="Value"
                        sx={{ flex: 1 }}
                        value={cond.value}
                        onChange={e => updateCondition(cond.id, { value: e.target.value })}
                        placeholder={cond.field === 'amount' ? 'e.g. 5000' : 'e.g. CARC-45'}
                      />
                    )}
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Action */}
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1, display: 'block', mb: 1.5 }}>Action</Typography>
          <Stack spacing={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                label="Assign To"
                value={action.assignToId ?? ''}
                onChange={e => setAction(a => ({ ...a, assignToId: e.target.value || null }))}
              >
                <MenuItem value=""><em>Unassigned</em></MenuItem>
                {TEAM_MEMBERS.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Resolution Engine</InputLabel>
              <Select
                label="Resolution Engine"
                value={action.resolutionEngine ?? ''}
                onChange={e => setAction(a => ({ ...a, resolutionEngine: (e.target.value || null) as ResolutionEngine }))}
              >
                <MenuItem value=""><em>None (manual)</em></MenuItem>
                <MenuItem value="appeal">Appeal</MenuItem>
                <MenuItem value="corrected_claim">Corrected Claim</MenuItem>
                <MenuItem value="underpayment">Payment Dispute</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={action.priority}
                  onChange={e => setAction(a => ({ ...a, priority: e.target.value as Priority }))}
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="SLA Days"
                type="number"
                sx={{ flex: 1 }}
                value={action.slaDays}
                onChange={e => setAction(a => ({ ...a, slaDays: Number(e.target.value) }))}
                inputProps={{ min: 0, max: 90 }}
              />
            </Box>

            <FormControlLabel
              control={<Switch checked={action.autoAccept} onChange={e => setAction(a => ({ ...a, autoAccept: e.target.checked }))} size="small" />}
              label={<Typography variant="body2">Auto-accept (skip intake review)</Typography>}
            />
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose} size="small">Cancel</Button>
        <Button variant="contained" onClick={handleSave} size="small" disabled={!name.trim()}>
          {isNew ? 'Create Rule' : 'Save Changes'}
        </Button>
      </Box>
    </Drawer>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoutingRulesPage() {
  const [rules, setRules] = useState<RoutingRule[]>(SEED_RULES)
  const [editingRule, setEditingRule] = useState<RoutingRule | null | undefined>(undefined) // undefined = closed, null = new
  const [savedBanner, setSavedBanner] = useState(false)

  function moveUp(id: string) {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!]
      return next.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }

  function moveDown(id: string) {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!]
      return next.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }

  function toggleEnabled(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, priority: i + 1 })))
  }

  function handleSave(updated: RoutingRule) {
    setRules(prev => {
      const exists = prev.some(r => r.id === updated.id)
      if (exists) return prev.map(r => r.id === updated.id ? updated : r)
      return [...prev, { ...updated, priority: prev.length + 1 }]
    })
    setEditingRule(undefined)
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  const activeCount = rules.filter(r => r.enabled).length
  const totalMatches = rules.reduce((s, r) => s + r.matchCount, 0)

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {savedBanner && (
        <Alert severity="success" onClose={() => setSavedBanner(false)} sx={{ mb: 0 }}>
          Rule saved successfully.
        </Alert>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Active Rules', value: activeCount, color: '#16A34A' },
          { label: 'Disabled Rules', value: rules.length - activeCount, color: '#6B7280' },
          { label: 'Denials Matched (total)', value: totalMatches, color: '#2557D6' },
        ].map(stat => (
          <Paper key={stat.label} variant="outlined" sx={{ px: 2.5, py: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', minWidth: 160 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>{stat.label}</Typography>
          </Paper>
        ))}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setEditingRule(null)}
          sx={{ alignSelf: 'center', height: 36 }}
        >
          Add Rule
        </Button>
      </Box>

      {/* ── Info banner ───────────────────────────────────────────────────────── */}
      <Paper
        variant="outlined"
        sx={{ px: 2.5, py: 1.5, borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5, bgcolor: '#EEF2FF', borderColor: '#C7D2FE' }}
      >
        <AccountTreeOutlined sx={{ color: 'primary.main', mt: 0.25, fontSize: 18, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>Rules are evaluated in priority order</Typography>
          <Typography variant="body2" color="text.secondary">
            When a denial is ingested, the first matching enabled rule wins. Use the arrows to reorder. Disabled rules are skipped.
          </Typography>
        </Box>
      </Paper>

      {/* ── Rules table ───────────────────────────────────────────────────────── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48, pl: 1.5 }}>#</TableCell>
              <TableCell>Rule</TableCell>
              <TableCell sx={{ minWidth: 240 }}>Conditions</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Action</TableCell>
              <TableCell align="right" sx={{ width: 80 }}>Matches</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>Enabled</TableCell>
              <TableCell sx={{ width: 130 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule, idx) => (
              <TableRow
                key={rule.id}
                sx={{
                  opacity: rule.enabled ? 1 : 0.5,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                }}
              >
                {/* Priority # + arrows */}
                <TableCell sx={{ pl: 1.5, verticalAlign: 'middle' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <IconButton size="small" disabled={idx === 0} onClick={() => moveUp(rule.id)} sx={{ p: 0.25 }}>
                      <ArrowUpwardOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>{rule.priority}</Typography>
                    <IconButton size="small" disabled={idx === rules.length - 1} onClick={() => moveDown(rule.id)} sx={{ p: 0.25 }}>
                      <ArrowDownwardOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </TableCell>

                {/* Name + description */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.name}</Typography>
                  {rule.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, maxWidth: 220 }}>
                      {rule.description}
                    </Typography>
                  )}
                </TableCell>

                {/* Conditions */}
                <TableCell>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', lineHeight: 1.6 }}>
                    {conditionSummary(rule.conditions, rule.conditionLogic)}
                  </Typography>
                </TableCell>

                {/* Action */}
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {rule.action.resolutionEngine && (
                        <Chip
                          label={ENGINE_LABELS[rule.action.resolutionEngine]}
                          size="small"
                          sx={{ bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 600, height: 20, fontSize: '0.6875rem' }}
                        />
                      )}
                      <Chip
                        label={rule.action.priority}
                        size="small"
                        color={priorityColor(rule.action.priority)}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6875rem' }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {(() => {
                        const member = TEAM_MEMBERS.find(m => m.id === rule.action.assignToId)
                        const parts = []
                        if (member) parts.push(member.name)
                        else parts.push('Unassigned')
                        if (rule.action.slaDays > 0) parts.push(`${rule.action.slaDays}d SLA`)
                        if (rule.action.autoAccept) parts.push('Auto-accept')
                        return parts.join(' · ')
                      })()}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Match count */}
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.matchCount}</Typography>
                  {rule.lastMatched && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {rule.lastMatched}
                    </Typography>
                  )}
                </TableCell>

                {/* Enabled toggle */}
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={rule.enabled}
                    onChange={() => toggleEnabled(rule.id)}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditingRule(rule)}>
                        <EditOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => deleteRule(rule.id)} color="error">
                        <DeleteOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                  <FilterListOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No routing rules yet. Add one to get started.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rule editor drawer */}
      {editingRule !== undefined && (
        <RuleDrawer
          rule={editingRule}
          onClose={() => setEditingRule(undefined)}
          onSave={handleSave}
        />
      )}
    </Box>
  )
}
