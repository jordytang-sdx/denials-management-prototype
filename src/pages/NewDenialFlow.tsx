import { useState } from 'react'
import {
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, CircularProgress, RadioGroup, FormControlLabel, Radio, IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_FIND_ENCOUNTER = {
  id: 'SE1',
  patientName: 'Susan Smith',
  dob: '08/14/1955',
  har: '5291037',
  mrn: '3921847',
  visitId: '8847201',
  admit: '05/28/2024',
  discharge: '06/05/2024',
  dxCode: 'A41.9',
  dxName: 'Sepsis, unspecified organism',
  billedDrg: '871',
}

type Encounter = {
  id: string
  patientName: string
  dob: string
  har: string
  mrn: string
  visitId: string
  admit: string
  discharge: string
  dxCode: string
  dxName: string
  billedDrg: string
  defaults?: { denialType?: string; payer?: string; deadline?: string; payerRationale?: string }
}

const FIND_ENCOUNTER_LOOKUP: Encounter[] = [MOCK_FIND_ENCOUNTER]

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']

const DRG_REVIEW_TYPE_OPTIONS = ['Clinical Validation Review', 'Coding Audit']

// ── CodeValue ─────────────────────────────────────────────────────────────────

function CodeValue({ value, label, fontSize = '0.6875rem' }: { value: string; label: string; fontSize?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, '&:hover .code-copy-icon': { opacity: 1 } }}>
      <Typography sx={{ fontSize, fontVariantNumeric: 'tabular-nums', color: '#475569', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} placement="top">
        <IconButton
          className="code-copy-icon"
          size="small"
          aria-label={`Copy ${label} ${value}`}
          onClick={handleCopy}
          sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.15s', color: copied ? '#16A34A' : 'text.disabled', '&:focus-visible': { opacity: 1 } }}
        >
          {copied ? <DoneOutlinedIcon sx={{ fontSize: 11 }} /> : <ContentCopyOutlinedIcon sx={{ fontSize: 11 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ── Encounter lookup map ──────────────────────────────────────────────────────

const RECORD_ENCOUNTER_MAP: Record<string, Encounter> = {
  'stg-007': {
    id: 'stg-007', patientName: 'Unknown', dob: '04/12/1968',
    har: '2025-5502', mrn: '—', visitId: '5502-001',
    admit: '03/19/2026', discharge: '03/22/2026',
    dxCode: 'J18.9', dxName: 'Pneumonia, unspecified organism', billedDrg: '194',
    defaults: { payer: '' },
  },
  'stg-008': {
    id: 'stg-008', patientName: 'Patricia Nguyen', dob: '05/14/1971',
    har: 'HAR-88210', mrn: 'MRN-88210', visitId: '7882-100',
    admit: '03/22/2026', discharge: '03/25/2026',
    dxCode: 'E11.9', dxName: 'Type 2 diabetes mellitus without complications', billedDrg: '638',
    defaults: { payer: 'Aetna', deadline: '2026-04-07', denialType: 'drg_downgrade' },
  },
  'stg-009': {
    id: 'stg-009', patientName: 'George Okafor', dob: '08/03/1967',
    har: '2025-6604', mrn: 'MRN-99312', visitId: '6604-001',
    admit: '03/10/2026', discharge: '03/14/2026',
    dxCode: 'J96.00', dxName: 'Acute respiratory failure, unspecified', billedDrg: '207',
    defaults: { payer: 'United Healthcare' },
  },
  'stg-010': {
    id: 'stg-010', patientName: 'Linda Chen', dob: '03/21/1979',
    har: '2025-1142', mrn: 'MRN-20817', visitId: '1142-001',
    admit: '03/15/2026', discharge: '03/18/2026',
    dxCode: 'F32.9', dxName: 'Major depressive disorder, single episode', billedDrg: '885',
    defaults: { payer: 'United Healthcare', denialType: 'drg_downgrade' },
  },
  'stg-011': {
    id: 'stg-011', patientName: 'Jose Martinez', dob: '11/28/1963',
    har: '2024-7102', mrn: 'MRN-10042', visitId: '7102-001',
    admit: '02/25/2026', discharge: '03/01/2026',
    dxCode: 'I50.9', dxName: 'Heart failure, unspecified', billedDrg: '293',
    defaults: { payer: 'Aetna', denialType: 'drg_downgrade' },
  },
  'stg-012': {
    id: 'stg-012', patientName: 'Thomas Brennan', dob: '09/08/1952',
    har: '2025-8803', mrn: 'MRN-99881', visitId: '8803-001',
    admit: '02/26/2026', discharge: '03/01/2026',
    dxCode: 'J44.1', dxName: 'COPD with acute exacerbation', billedDrg: '190',
    defaults: { denialType: 'drg_downgrade' },
  },
  'stg-013': {
    id: 'stg-013', patientName: 'Sandra Kim', dob: '07/19/1982',
    har: '2025-9910', mrn: 'MRN-12045', visitId: '9910-001',
    admit: '03/25/2026', discharge: '03/28/2026',
    dxCode: 'J96.21', dxName: 'Acute and chronic respiratory failure with hypoxia', billedDrg: '208',
    defaults: { payer: 'Cigna', denialType: 'medical_necessity' },
  },
}

// ── FindEncounterStep ─────────────────────────────────────────────────────────

function FindEncounterStep({ onSelect, onCancel, encounterOnly }: { onSelect: (enc: Encounter) => void; onCancel: () => void; encounterOnly?: boolean }) {
  const [searchField, setSearchField] = useState('HAR')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<Encounter[]>([])

  const runSearch = () => {
    const q = searchQuery.trim().toLowerCase()
    setSearching(true)
    setHasSearched(true)
    setTimeout(() => {
      setSearchResults(q.length > 0 ? FIND_ENCOUNTER_LOOKUP : [])
      setSearching(false)
    }, 1500)
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F6F8FA' }}>
      <Box sx={{ width: '100%', px: 3, pt: 4, pb: 6 }}>

        {/* Breadcrumb + Cancel row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
          {encounterOnly ? (
            <Button
              startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />}
              onClick={onCancel}
              sx={{ fontSize: '0.875rem', p: 0, minWidth: 0 }}
            >
              Back
            </Button>
          ) : (
            <Box />
          )}
          {!encounterOnly && (
            <Button
              onClick={onCancel}
              sx={{ fontSize: '0.875rem' }}
            >
              Cancel
            </Button>
          )}
        </Box>

        {/* Title + step label */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)', lineHeight: 1.4 }}>
            {encounterOnly ? 'Change Encounter' : 'New Denial'}
          </Typography>
          {!encounterOnly && (
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.54)', mt: 0.5 }}>
              Step 1 of 2 · Find the Encounter for the Denial
            </Typography>
          )}
        </Box>

        {/* Search card */}
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E5E5', borderRadius: '8px', p: 3, mb: hasSearched ? 3 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel>Identifier</InputLabel>
              <Select value={searchField} label="Identifier" onChange={e => setSearchField(e.target.value)}>
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
              sx={{ width: 300 }}
            />
            <Button variant="contained" onClick={runSearch} sx={{ flexShrink: 0, px: 3, height: 40 }}>
              Search
            </Button>
          </Box>

          <Button
            startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
            size="small"
            sx={{ fontSize: '0.8125rem', p: 0, minWidth: 0, mb: 2.5 }}
          >
            Add identifier
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, bgcolor: 'var(--colors-blue-1)', borderRadius: '6px', p: 1.5 }}>
            <InfoOutlinedIcon sx={{ color: 'var(--colors-blue-4)', fontSize: 16, mt: '1px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.8125rem', color: 'var(--colors-text-primary)', lineHeight: 1.55 }}>
              <strong>Tip:</strong> Try searching by HAR/FIN from the denial letter. If unavailable, use full patient name or MRN.
            </Typography>
          </Box>
        </Box>

        {/* Results */}
        {hasSearched && (
          searching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Typography sx={{ fontSize: '0.8125rem', color: 'var(--colors-text-secondary)', mb: 1.5 }}>
                Displaying {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Typography>

              {searchResults.length > 0 ? (
                <Box sx={{ bgcolor: 'var(--colors-table-row-background)', border: '1px solid var(--colors-table-layout-border)', borderRadius: '8px', overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 860 }}>
                    <TableHead>
                      <TableRow>
                        {['Patient Name', 'HAR', 'MRN', 'Visit ID', 'Admit — Discharge', 'Principle Dx', 'Billed DRG'].map(h => (
                          <TableCell key={h} sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>
                            {h}
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map(enc => (
                        <TableRow key={enc.id} sx={{ cursor: 'default', verticalAlign: 'top' }}>
                          <TableCell sx={{ py: '12px', pl: 2, pr: 2 }}>
                            <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.patientName}</Typography>
                            <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap' }}>{enc.dob}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.har} label="HAR" /></TableCell>
                          <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.mrn} label="MRN" /></TableCell>
                          <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}><CodeValue value={enc.visitId} label="Visit ID" /></TableCell>
                          <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.admit} — {enc.discharge}</TableCell>
                          <TableCell sx={{ py: '12px', px: 2, maxWidth: 160 }}>
                            <Tooltip title={`${enc.dxCode} — ${enc.dxName}`} placement="top" arrow>
                              <Box>
                                <Typography sx={{ fontSize: 'var(--font-sizes-table-cell-font-size)', color: 'var(--colors-text-primary)', whiteSpace: 'nowrap' }}>{enc.dxCode}</Typography>
                                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{enc.dxName}</Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ py: '12px', px: 2, whiteSpace: 'nowrap' }}>{enc.billedDrg}</TableCell>
                          <TableCell sx={{ py: '12px', textAlign: 'right', pr: 2 }}>
                            <Button
                              size="small"
                              onClick={() => onSelect(enc)}
                              sx={{ color: 'var(--colors-ocean-4)', fontSize: '0.8125rem', fontWeight: 500, p: 0, minWidth: 0, whiteSpace: 'nowrap', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'var(--colors-table-row-background)', border: '1px solid var(--colors-table-layout-border)', borderRadius: '8px' }}>
                  <Typography sx={{ fontSize: '0.9375rem', color: 'var(--colors-text-secondary)' }}>
                    No encounters found. Try a different search term or identifier.
                  </Typography>
                </Box>
              )}
            </>
          )
        )}
      </Box>
    </Box>
  )
}

// ── SectionCard ───────────────────────────────────────────────────────────────

function SectionCard({ title, children, highlighted }: { title: string; children: React.ReactNode; highlighted?: boolean }) {
  return (
    <Box sx={{
      bgcolor: '#fff',
      border: highlighted ? '1.5px solid #F59E0B' : '1px solid #E5E5E5',
      borderRadius: '8px',
      boxShadow: highlighted ? '0 0 0 3px rgba(245,158,11,0.08)' : '0px 1px 2px 0px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      <Box sx={{
        px: 3, py: 1.75,
        bgcolor: highlighted ? '#FFFBEB' : '#FAFAFA',
        borderBottom: '1px solid',
        borderColor: highlighted ? '#FDE68A' : '#F0F0F0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(0,0,0,0.54)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title}
        </Typography>
        {highlighted && (
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#92400E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Needs attention
          </Typography>
        )}
      </Box>
      <Box sx={{ px: 3, py: 2.5 }}>
        {children}
      </Box>
    </Box>
  )
}

// ── NewDenialDetailsStep ──────────────────────────────────────────────────────

function NewDenialDetailsStep({ selectedEncounter, onBack, onCancel, fromDrawer, highlightSection }: {
  selectedEncounter: Encounter
  onBack: () => void
  onCancel: () => void
  fromDrawer?: boolean
  highlightSection?: 'classification' | 'adjustments'
}) {
  const [denialType, setDenialType]         = useState(selectedEncounter.defaults?.denialType ?? 'drg_downgrade')
  const [level, setLevel]                   = useState('Level 2')
  const [payer, setPayer]                   = useState(selectedEncounter.defaults?.payer ?? '')
  const [payerRationale, setPayerRationale] = useState(selectedEncounter.defaults?.payerRationale ?? '')
  const [drgReviewType, setDrgReviewType]   = useState('Clinical Validation Review')
  const [deadlineISO, setDeadlineISO]       = useState(selectedEncounter.defaults?.deadline ?? '')

  const caseIdentifiers: Array<{ label: string; value: string; isCode?: boolean }> = [
    { label: 'Name',          value: selectedEncounter.patientName },
    { label: 'Date of Birth', value: selectedEncounter.dob },
    { label: 'HAR',           value: selectedEncounter.har,     isCode: true },
    { label: 'MRN',           value: selectedEncounter.mrn,     isCode: true },
    { label: 'Visit ID',      value: selectedEncounter.visitId, isCode: true },
    { label: 'Discharged',    value: selectedEncounter.discharge },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: '#F6F8FA' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 680, mx: 'auto', px: 3, pt: 4 }}>

          {/* Breadcrumb + Cancel row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5 }}>
            <Button
              startIcon={<ArrowBackIcon sx={{ fontSize: '18px !important' }} />}
              onClick={onBack}
              sx={{ fontSize: '0.875rem', p: 0, minWidth: 0 }}
            >
              {fromDrawer ? 'Back' : 'Find Encounter'}
            </Button>
            {!fromDrawer && (
              <Button onClick={onCancel} sx={{ fontSize: '0.875rem' }}>
                Cancel
              </Button>
            )}
          </Box>

          {/* Title + step label */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)', lineHeight: 1.4 }}>
              {fromDrawer ? 'Edit Denial Details' : 'New Denial'}
            </Typography>
            {!fromDrawer && (
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.54)', mt: 0.5 }}>
                Step 2 of 2 · Enter Denial Details
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Encounter */}
            <SectionCard title="Encounter">
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 24px' }}>
                {caseIdentifiers.map(({ label, value, isCode }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(0,0,0,0.54)', letterSpacing: '0.4px', lineHeight: 1.66, mb: 0.25 }}>
                      {label}
                    </Typography>
                    {isCode
                      ? <CodeValue value={value} label={label} fontSize="0.875rem" />
                      : <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)', lineHeight: 1.43 }}>{value}</Typography>
                    }
                  </Box>
                ))}
              </Box>
            </SectionCard>

            {/* Denial Classification */}
            <SectionCard title="Denial Classification" highlighted={highlightSection === 'classification'}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Denial Type</Typography>
                  <RadioGroup value={denialType} onChange={e => setDenialType(e.target.value)}>
                    <FormControlLabel value="drg_downgrade"      control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>DRG Downgrade</Typography>} />
                    <FormControlLabel value="medical_necessity"  control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Medical Necessity</Typography>} />
                    <FormControlLabel value="other"              control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.9375rem' }}>Other</Typography>} />
                  </RadioGroup>
                </Box>
                {denialType === 'drg_downgrade' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>DRG Review Type</Typography>
                    <FormControl size="small" sx={{ maxWidth: 320 }}>
                      <Select value={drgReviewType} onChange={e => setDrgReviewType(e.target.value)}>
                        {DRG_REVIEW_TYPE_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </SectionCard>

            {/* Denial Logistics */}
            <SectionCard title="Denial Logistics">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Level</Typography>
                    <FormControl size="small" fullWidth>
                      <Select value={level} onChange={e => setLevel(e.target.value)}>
                        {LEVEL_OPTIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Appeal Deadline</Typography>
                    <TextField size="small" type="date" fullWidth value={deadlineISO} onChange={e => setDeadlineISO(e.target.value)} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>Payer</Typography>
                  <FormControl size="small" fullWidth>
                    <Select value={payer} onChange={e => setPayer(e.target.value)} displayEmpty renderValue={payer ? undefined : () => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Select payer</span>}>
                      <MenuItem value="Blue Cross Blue Shield of Michigan">Blue Cross Blue Shield of Michigan</MenuItem>
                      <MenuItem value="Aetna">Aetna</MenuItem>
                      <MenuItem value="United Healthcare">United Healthcare</MenuItem>
                      <MenuItem value="Cigna">Cigna</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#616161' }}>
                    Review Entity <span style={{ color: 'rgba(0,0,0,0.38)', fontWeight: 400 }}>(optional)</span>
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
            </SectionCard>

            {/* Payer Adjustments — DRG downgrade only */}
            {denialType === 'drg_downgrade' && (
              <SectionCard title="Payer Adjustments" highlighted={highlightSection === 'adjustments'}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.5 }}>
                    Add the diagnoses and procedures the payer adjusted.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)' }}>Adjusted Diagnoses</Typography>
                    <Button startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />} sx={{ fontSize: '0.875rem', p: 0, alignSelf: 'flex-start' }}>
                      Add Diagnosis Code
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0,0,0,0.87)' }}>Adjusted Procedures</Typography>
                    <Button startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />} sx={{ fontSize: '0.875rem', p: 0, alignSelf: 'flex-start' }}>
                      Add Procedure
                    </Button>
                  </Box>
                </Box>
              </SectionCard>
            )}

            {/* Payer Rationale */}
            <SectionCard title="Payer Rationale">
              <TextField
                multiline fullWidth size="small"
                value={payerRationale}
                onChange={e => setPayerRationale(e.target.value)}
                placeholder="Enter the payer's rationale for denial…"
                minRows={5}
              />
            </SectionCard>

            <Box sx={{ height: 48 }} />
          </Box>
        </Box>
      </Box>

      {/* Sticky footer */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #E0E0E0', px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
        <Button variant="outlined" onClick={fromDrawer ? onCancel : onBack} sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          {fromDrawer ? 'Cancel' : 'Back'}
        </Button>
        <Button variant="contained" onClick={onCancel} sx={{ fontSize: '0.9375rem', px: 2.5 }}>
          {fromDrawer ? 'Save' : 'Create Denial'}
        </Button>
      </Box>
    </Box>
  )
}

// ── NewDenialFlow ─────────────────────────────────────────────────────────────

export default function NewDenialFlow({ onDone, initialStep = 'find', encounterOnly = false, fromDrawer = false, recordId }: { onDone: () => void; initialStep?: 'find' | 'details'; encounterOnly?: boolean; fromDrawer?: boolean; recordId?: string }) {
  const [step, setStep] = useState<'find' | 'details'>(initialStep)
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(
    initialStep === 'details'
      ? (recordId ? (RECORD_ENCOUNTER_MAP[recordId] ?? MOCK_FIND_ENCOUNTER) : MOCK_FIND_ENCOUNTER)
      : null
  )

  if (step === 'details' && selectedEncounter) {
    return (
      <NewDenialDetailsStep
        selectedEncounter={selectedEncounter}
        onBack={fromDrawer ? onDone : () => setStep('find')}
        onCancel={onDone}
        fromDrawer={fromDrawer}
      />
    )
  }

  return (
    <FindEncounterStep
      encounterOnly={encounterOnly}
      onSelect={enc => {
        if (encounterOnly) { onDone() }
        else { setSelectedEncounter(enc); setStep('details') }
      }}
      onCancel={onDone}
    />
  )
}
