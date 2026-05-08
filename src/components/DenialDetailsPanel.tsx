import { useState } from 'react'
import {
  Box, Typography, Button, Divider, Chip, IconButton, Tooltip,
  FormControl, Select, MenuItem, RadioGroup, FormControlLabel, Radio,
  TextField, CircularProgress,
} from '@mui/material'
import {
  CloseOutlined, ArrowBackOutlined, ArrowForwardOutlined,
  AddOutlined, DeleteOutlined, DoneOutlined, ContentCopyOutlined, EditOutlined,
} from '@mui/icons-material'
import type { StagingRecord } from '../data/staging'

// ── Types ─────────────────────────────────────────────────────────────────────

type Encounter = {
  id: string
  patientName: string
  dob: string
  har: string
  mrn: string
  visitId: string
  admit: string
  discharge: string
}

type AdjDiag = {
  code: string
  description: string
  billedTag?: string
  adjustment: 'removed' | 'changed_to_principal' | 'unchanged' | ''
}

export interface DenialDetailsPanelProps {
  mode: 'new' | 'edit'
  record?: StagingRecord
  onClose: () => void
  onSave?: () => void
  reviewIndex?: number
  reviewTotal?: number
  onPrev?: () => void
  onNext?: () => void
  highlightSection?: 'classification' | 'adjustments'
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ENCOUNTER: Encounter = {
  id: 'SE1',
  patientName: 'Susan Smith',
  dob: '08/14/1955',
  har: '5291037',
  mrn: '3921847',
  visitId: '8847201',
  admit: '05/28/2024',
  discharge: '06/05/2024',
}

const MOCK_ADJUSTED_DIAGNOSES: AdjDiag[] = [
  { code: 'A41.9',  description: 'Sepsis, unspecified organism',                      billedTag: 'Billed Principal', adjustment: 'removed' },
  { code: 'R65.20', description: 'Severe sepsis without septic shock',                adjustment: 'removed' },
  { code: 'J96.21', description: 'Acute and chronic respiratory failure with hypoxia', billedTag: 'Billed MCC', adjustment: 'removed' },
  { code: 'J18.9',  description: 'Pneumonia, unspecified organism',                   adjustment: 'changed_to_principal' },
  { code: 'N17.9',  description: 'Acute kidney failure, unspecified',                 adjustment: 'unchanged' },
  { code: 'I10',    description: 'Essential (primary) hypertension',                  adjustment: 'unchanged' },
]

const LEVEL_OPTIONS    = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']
const DRG_REV_OPTIONS  = ['Clinical Validation Review', 'Coding Audit']

const ADJ_LABEL: Record<string, string> = {
  removed:              'Removed',
  changed_to_principal: 'Changed to Principal',
  unchanged:            'Unchanged',
}
const ADJ_COLOR: Record<string, string> = {
  removed:              '#DC2626',
  changed_to_principal: '#D97706',
  unchanged:            'rgba(0,0,0,0.54)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveEncounter(record: StagingRecord): Encounter | null {
  const ext = record.extraction
  if (!ext.har && !record.patientName) return null
  return {
    id:          record.id,
    patientName: record.patientName ?? 'Unknown',
    dob:         '—',
    har:         String(ext.har ?? '—'),
    mrn:         record.patientMrn ?? '—',
    visitId:     String(ext.claimId ?? '—'),
    admit:       '—',
    discharge:   '—',
  }
}

function deriveDenialType(record: StagingRecord): string {
  const c = record.classifiedAs ?? ''
  if (c.includes('DRG')) return 'drg_downgrade'
  if (c.includes('Medical Necessity')) return 'medical_necessity'
  return 'other'
}

// ── CodeValue ─────────────────────────────────────────────────────────────────

function CodeValue({ value, label, fontSize = '0.75rem' }: { value: string; label: string; fontSize?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, '&:hover .ddp-copy': { opacity: 1 } }}>
      <Typography sx={{ fontSize, fontFamily: '"Roboto Mono","Courier New",monospace', color: '#475569', letterSpacing: '0.01em' }}>
        {value}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} placement="top">
        <IconButton className="ddp-copy" size="small" onClick={handleCopy}
          sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: copied ? '#16A34A' : 'text.disabled' }}>
          {copied ? <DoneOutlined sx={{ fontSize: 11 }} /> : <ContentCopyOutlined sx={{ fontSize: 11 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ title, highlighted }: { title: string; highlighted?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
        {title}
      </Typography>
      {highlighted && (
        <Chip
          label="Needs attention"
          size="small"
          sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', '& .MuiChip-label': { px: 0.75 } }}
        />
      )}
    </Box>
  )
}

// ── DenialDetailsPanel ────────────────────────────────────────────────────────

export default function DenialDetailsPanel({
  mode,
  record,
  onClose,
  onSave,
  reviewIndex,
  reviewTotal,
  onPrev,
  onNext,
  highlightSection,
}: DenialDetailsPanelProps) {
  const initialEncounter    = mode === 'edit' && record ? deriveEncounter(record) : null
  const initialDenialType   = record ? deriveDenialType(record) : 'drg_downgrade'

  const [encounter,           setEncounter]           = useState<Encounter | null>(initialEncounter)
  const [showEncSearch,       setShowEncSearch]        = useState(mode === 'new')
  const [searchField,         setSearchField]          = useState('HAR')
  const [searchQuery,         setSearchQuery]          = useState('')
  const [searching,           setSearching]            = useState(false)
  const [searchResults,       setSearchResults]        = useState<Encounter[]>([])
  const [hasSearched,         setHasSearched]          = useState(false)
  const [denialType,          setDenialType]           = useState(initialDenialType)
  const [drgReviewType,       setDrgReviewType]        = useState('Clinical Validation Review')
  const [level,               setLevel]                = useState('Level 2')
  const [payer,               setPayer]                = useState(record?.payer ?? '')
  const [deadlineISO,         setDeadlineISO]          = useState('')
  const [payerRationale,      setPayerRationale]       = useState('')
  const [adjDiagnoses,        setAdjDiagnoses]         = useState<AdjDiag[]>(
    initialDenialType === 'drg_downgrade' ? MOCK_ADJUSTED_DIAGNOSES : []
  )

  const hasNav     = reviewIndex !== undefined && reviewTotal !== undefined
  const formReady  = encounter !== null

  const runSearch = () => {
    setSearching(true)
    setHasSearched(true)
    setTimeout(() => {
      setSearchResults(searchQuery.trim().length > 0 ? [MOCK_ENCOUNTER] : [])
      setSearching(false)
    }, 1200)
  }

  const handleSelectEncounter = (enc: Encounter) => {
    setEncounter(enc)
    setShowEncSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
  }

  const handleDenialTypeChange = (val: string) => {
    setDenialType(val)
    setAdjDiagnoses(val === 'drg_downgrade' ? MOCK_ADJUSTED_DIAGNOSES : [])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>

      {/* ── Nav strip ─────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, py: 0.875, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.25, bgcolor: '#F8FAFC', flexShrink: 0 }}>
        {hasNav ? (
          <>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1 }}>
              Review item {(reviewIndex ?? 0) + 1} of {reviewTotal}
            </Typography>
            <Tooltip title="Previous exception">
              <span>
                <IconButton size="small" disabled={reviewIndex === 0} onClick={onPrev}
                  sx={{ color: reviewIndex === 0 ? 'text.disabled' : 'text.secondary' }}>
                  <ArrowBackOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next exception">
              <span>
                <IconButton size="small" disabled={reviewIndex === (reviewTotal ?? 1) - 1} onClick={onNext}
                  sx={{ color: reviewIndex === (reviewTotal ?? 1) - 1 ? 'text.disabled' : 'text.secondary' }}>
                  <ArrowForwardOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1 }}>
            {mode === 'new' ? 'New Denial' : 'Edit Denial Details'}
          </Typography>
        )}
        <IconButton size="small" onClick={onClose} sx={{ ml: hasNav ? 0.5 : 0 }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary' }}>
          {encounter?.patientName ?? record?.patientName ?? (mode === 'new' ? 'New Denial' : 'Unknown patient')}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
          {mode === 'new' && !encounter
            ? 'Search for an encounter to continue'
            : [record?.payer, 'PDF Denial'].filter(Boolean).join(' · ')}
        </Typography>
      </Box>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>

        {/* Encounter section */}
        <SectionLabel title="Encounter" />

        {encounter && !showEncSearch && (
          <>
            <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.75, mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 20px' }}>
                {[
                  { label: 'Name',         value: encounter.patientName, isCode: false },
                  { label: 'Date of Birth', value: encounter.dob,         isCode: false },
                  { label: 'HAR',          value: encounter.har,         isCode: true  },
                  { label: 'MRN',          value: encounter.mrn,         isCode: true  },
                  { label: 'Visit ID',     value: encounter.visitId,     isCode: true  },
                  { label: 'Discharged',   value: encounter.discharge,   isCode: false },
                ].map(({ label, value, isCode }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.25 }}>{label}</Typography>
                    {isCode
                      ? <CodeValue value={value} label={label} />
                      : <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{value}</Typography>
                    }
                  </Box>
                ))}
              </Box>
            </Box>
            <Button
              size="small"
              startIcon={<EditOutlined sx={{ fontSize: '14px !important' }} />}
              onClick={() => setShowEncSearch(true)}
              sx={{ fontSize: '0.75rem', color: 'var(--colors-ocean-4)', p: 0, minWidth: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
            >
              Change encounter
            </Button>
          </>
        )}

        {/* Encounter search — new mode or change mode */}
        {(mode === 'new' || showEncSearch) && (
          <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid', borderColor: showEncSearch && encounter ? 'primary.main' : 'divider', borderRadius: 1, p: 2, mb: 1.5 }}>
            {showEncSearch && encounter && (
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1.25 }}>
                Find new encounter
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mb: showEncSearch && encounter ? 1 : 0 }}>
              <FormControl size="small" sx={{ width: 130, flexShrink: 0 }}>
                <Select value={searchField} onChange={e => setSearchField(e.target.value)}>
                  <MenuItem value="HAR">HAR</MenuItem>
                  <MenuItem value="Patient Name">Patient Name</MenuItem>
                  <MenuItem value="MRN">MRN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label={searchField}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" size="small" onClick={runSearch} sx={{ flexShrink: 0, px: 2 }}>
                Search
              </Button>
            </Box>
            {showEncSearch && encounter && (
              <Button
                size="small"
                onClick={() => { setShowEncSearch(false); setSearchQuery(''); setSearchResults([]); setHasSearched(false) }}
                sx={{ fontSize: '0.75rem', color: 'text.secondary', p: 0, minWidth: 0, textTransform: 'none' }}
              >
                Cancel
              </Button>
            )}
          </Box>
        )}

        {/* Search results */}
        {hasSearched && (
          <Box sx={{ mb: 2 }}>
            {searching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : searchResults.length > 0 ? (
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: 2, px: 2, py: 1, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider' }}>
                  {['Patient', 'HAR', 'Admit — Discharge', ''].map(h => (
                    <Typography key={h} sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</Typography>
                  ))}
                </Box>
                {searchResults.map(enc => (
                  <Box key={enc.id} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: 2, px: 2, py: 1.5, alignItems: 'center', '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{enc.patientName}</Typography>
                      <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{enc.dob}</Typography>
                    </Box>
                    <CodeValue value={enc.har} label="HAR" />
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{enc.admit} — {enc.discharge}</Typography>
                    <Button
                      size="small"
                      onClick={() => handleSelectEncounter(enc)}
                      sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--colors-ocean-4)', p: 0, minWidth: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                    >
                      Select
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>No encounters found</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Progressive disclosure placeholder */}
        {!formReady && mode === 'new' && (
          <Box sx={{ mt: 3, py: 5, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>
              Select an encounter above to continue
            </Typography>
          </Box>
        )}

        {/* Form sections */}
        {formReady && (
          <>
            <Divider sx={{ my: 2.5 }} />

            {/* Denial Classification */}
            <Box sx={highlightSection === 'classification' ? { pl: 1.5, borderLeft: '3px solid #F59E0B' } : {}}>
              <SectionLabel title="Denial Classification" highlighted={highlightSection === 'classification'} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>Denial Type</Typography>
                  <RadioGroup value={denialType} onChange={e => handleDenialTypeChange(e.target.value)}>
                    <FormControlLabel value="drg_downgrade"     control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>DRG Downgrade</Typography>} />
                    <FormControlLabel value="medical_necessity" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Medical Necessity</Typography>} />
                    <FormControlLabel value="other"             control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Other</Typography>} />
                  </RadioGroup>
                </Box>
                {denialType === 'drg_downgrade' && (
                  <Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>DRG Review Type</Typography>
                    <FormControl size="small" sx={{ maxWidth: 280 }}>
                      <Select value={drgReviewType} onChange={e => setDrgReviewType(e.target.value)}>
                        {DRG_REV_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Denial Logistics */}
            <SectionLabel title="Denial Logistics" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>Level</Typography>
                  <FormControl size="small" fullWidth>
                    <Select value={level} onChange={e => setLevel(e.target.value)}>
                      {LEVEL_OPTIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>Appeal Deadline</Typography>
                  <TextField size="small" type="date" fullWidth value={deadlineISO} onChange={e => setDeadlineISO(e.target.value)} />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>Payer</Typography>
                <FormControl size="small" fullWidth>
                  <Select value={payer} onChange={e => setPayer(e.target.value)} displayEmpty renderValue={payer ? undefined : () => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Select payer</span>}>
                    <MenuItem value="Blue Cross Blue Shield of Michigan">Blue Cross Blue Shield of Michigan</MenuItem>
                    <MenuItem value="Aetna">Aetna</MenuItem>
                    <MenuItem value="United Healthcare">United Healthcare</MenuItem>
                    <MenuItem value="Cigna">Cigna</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0.75 }}>
                  Review Entity <span style={{ color: 'rgba(0,0,0,0.38)' }}>(optional)</span>
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select value="" displayEmpty renderValue={() => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Search review entity</span>}>
                    <MenuItem value="Optum">Optum</MenuItem>
                    <MenuItem value="Cotiviti">Cotiviti</MenuItem>
                    <MenuItem value="Performant">Performant</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Payer Adjustments — DRG only */}
            {denialType === 'drg_downgrade' && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Box sx={highlightSection === 'adjustments' ? { pl: 1.5, borderLeft: '3px solid #F59E0B' } : {}}>
                  <SectionLabel title="Payer Adjustments" highlighted={highlightSection === 'adjustments'} />

                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, mb: 1 }}>Adjusted Diagnoses</Typography>
                  {adjDiagnoses.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                      {adjDiagnoses.map((diag, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                              <Typography sx={{ fontSize: '0.8125rem', fontFamily: '"Roboto Mono","Courier New",monospace', color: '#475569', flexShrink: 0 }}>
                                {diag.code}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {diag.description}
                              </Typography>
                            </Box>
                            {diag.billedTag && (
                              <Chip label={diag.billedTag} size="small" sx={{ mt: 0.25, height: 16, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569', '& .MuiChip-label': { px: 0.75 } }} />
                            )}
                          </Box>
                          <FormControl size="small" sx={{ minWidth: 178, flexShrink: 0 }}>
                            <Select
                              value={diag.adjustment}
                              onChange={e => setAdjDiagnoses(prev => prev.map((d, j) => j === i ? { ...d, adjustment: e.target.value as AdjDiag['adjustment'] } : d))}
                              displayEmpty
                              renderValue={v => {
                                const label = ADJ_LABEL[v] ?? ''
                                const color = ADJ_COLOR[v] ?? 'rgba(0,0,0,0.38)'
                                return <span style={{ fontSize: '0.8125rem', color, fontWeight: v ? 600 : 400 }}>{label || 'Adjustment'}</span>
                              }}
                              sx={{ fontSize: '0.8125rem' }}
                            >
                              <MenuItem value="removed"              sx={{ fontSize: '0.8125rem', color: '#DC2626', fontWeight: 600 }}>Removed</MenuItem>
                              <MenuItem value="changed_to_principal" sx={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 600 }}>Changed to Principal</MenuItem>
                              <MenuItem value="unchanged"            sx={{ fontSize: '0.8125rem' }}>Unchanged</MenuItem>
                            </Select>
                          </FormControl>
                          <IconButton size="small" onClick={() => setAdjDiagnoses(prev => prev.filter((_, j) => j !== i))}
                            sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                            <DeleteOutlined sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  <Button
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    size="small"
                    onClick={() => setAdjDiagnoses(prev => [...prev, { code: '', description: '', adjustment: '' }])}
                    sx={{ fontSize: '0.8125rem', color: 'var(--colors-ocean-4)', p: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}
                  >
                    Add diagnosis code
                  </Button>

                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, mt: 2.5, mb: 0.75 }}>Adjusted Procedures</Typography>
                  <Button
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    size="small"
                    sx={{ fontSize: '0.8125rem', color: 'var(--colors-ocean-4)', p: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent' } }}
                  >
                    Add procedure
                  </Button>
                </Box>
              </>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Payer Rationale */}
            <SectionLabel title="Payer Rationale" />
            <TextField
              multiline fullWidth size="small"
              value={payerRationale}
              onChange={e => setPayerRationale(e.target.value)}
              placeholder="Enter the payer's rationale for denial…"
              minRows={4}
            />

            <Box sx={{ height: 16 }} />
          </>
        )}
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Button
          variant="text" size="small"
          sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'var(--colors-ocean-4)', mr: 'auto' }}
        >
          Dismiss
        </Button>
        <Button
          variant="outlined" size="small"
          onClick={onClose}
          sx={{ textTransform: 'none', fontSize: '0.8125rem', color: 'rgba(0,0,0,0.87)', borderColor: 'rgba(0,0,0,0.23)' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained" size="small"
          disabled={!formReady}
          onClick={() => onSave?.()}
          sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
        >
          {hasNav ? 'Save & next' : 'Save'}
        </Button>
      </Box>
    </Box>
  )
}
