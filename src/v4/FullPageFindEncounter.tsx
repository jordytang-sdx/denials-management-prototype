import { useState, useRef } from 'react'
import { Box, Typography, Button, TextField, Alert, CircularProgress } from '@mui/material'
import { ArrowBackOutlined, AddOutlined, InfoOutlined, ManageSearchOutlined, ExpandLessOutlined, ExpandMoreOutlined } from '@mui/icons-material'
import SmarterSelect from './SmarterSelect'

const GHOST_BTN_SX = {
  fontSize: 'var(--font-sizes-14)' as const,  // btn size sm = 14px (design system ghost default)
  textTransform: 'none' as const,
  color: 'var(--colors-interactive-ghost-text)',
  '&:hover': {
    color: 'var(--colors-interactive-hover-ghost-text)',
    bgcolor: 'var(--colors-interactive-hover-ghost-background)',
  },
} as const

export type FindEncounterChrome =
  | { kind: 'wizard'; onCancel: () => void; onBackToList: () => void }
  | { kind: 'change'; onBack: () => void }

interface EncounterResult {
  patientName: string
  dob: string
  har: string
  mrn: string
  visitId: string
  admit: string
  discharge: string
  principalDx: string
  billedDrg: string
}

interface Props {
  chrome: FindEncounterChrome
  initialIdentifierValue?: string
  onSelect: (result: EncounterResult) => void
  onMarkUnavailable?: () => void
}

// ── Mock patient pool ─────────────────────────────────────────────────────────
// Covers both encounter_not_found exception cases plus a general-use record.
// Search is cross-field so typing any fragment (name, HAR, MRN, etc.) returns
// relevant results. Falls back to the full list if nothing matches.

const MOCK_PATIENTS: EncounterResult[] = [
  // stg-007 candidates — extracted as "J. Smith", no_patient_match
  {
    patientName: 'James Smith',
    dob: '04/12/1968',
    har: '2025-5502',
    mrn: 'MRN-77001',
    visitId: '7721445',
    admit: '03/22/2026',
    discharge: '03/28/2026',
    principalDx: 'J18.9 — Pneumonia, unspecified organism',
    billedDrg: '193',
  },
  {
    patientName: 'Jonathan Smith',
    dob: '04/15/1968',
    har: '2025-5503',
    mrn: 'MRN-77002',
    visitId: '7721446',
    admit: '03/20/2026',
    discharge: '03/25/2026',
    principalDx: 'J18.9 — Pneumonia, unspecified organism',
    billedDrg: '194',
  },
  // stg-012 candidates — extracted as "T. Brennan", low_confidence
  {
    patientName: 'Thomas Brennan',
    dob: '09/08/1952',
    har: '2025-8803',
    mrn: 'MRN-99881',
    visitId: '9901337',
    admit: '03/01/2026',
    discharge: '03/07/2026',
    principalDx: 'I50.9 — Heart failure, unspecified',
    billedDrg: '293',
  },
  {
    patientName: 'Thomas E. Brennan',
    dob: '09/08/1952',
    har: '2025-8804',
    mrn: 'MRN-99882',
    visitId: '9901338',
    admit: '03/01/2026',
    discharge: '03/06/2026',
    principalDx: 'I50.9 — Heart failure, unspecified',
    billedDrg: '291',
  },
  // General — wizard "Start New Denial" flow
  {
    patientName: 'Susan Smith',
    dob: '08/14/1955',
    har: '5291037',
    mrn: '3921847',
    visitId: '8847201',
    admit: '05/28/2024',
    discharge: '06/05/2024',
    principalDx: 'A41.9 — Sepsis, unspecified organism',
    billedDrg: '871',
  },
]

function searchPatients(query: string): EncounterResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const matches = MOCK_PATIENTS.filter(p =>
    p.patientName.toLowerCase().includes(q) ||
    p.har.toLowerCase().includes(q) ||
    p.mrn.toLowerCase().includes(q) ||
    p.visitId.toLowerCase().includes(q) ||
    p.dob.includes(q)
  )
  // Never dead-end: if nothing matches, show everyone
  return matches.length > 0 ? matches : MOCK_PATIENTS
}

// ── Chrome variants ───────────────────────────────────────────────────────────

function WizardChrome({ onBackToList }: { onBackToList: () => void }) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
    }}>
      <Box sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={onBackToList}
          sx={GHOST_BTN_SX}
        >
          Back to Intake
        </Button>
      </Box>
      <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)' }}>
          Start New Denial Manually
        </Typography>
        <WizardStepper currentStep={1} />
      </Box>
    </Box>
  )
}

function WizardStepper({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Find Encounter' },
    { n: 2, label: 'Denial Details' },
  ]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {steps.map((s, i) => (
        <Box key={s.n} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-semibold)',
            bgcolor: currentStep >= s.n ? 'var(--colors-ocean-4)' : 'var(--colors-grey-3)',
            color: currentStep >= s.n ? '#fff' : 'var(--colors-text-secondary)',
          }}>
            {currentStep > s.n ? '✓' : s.n}
          </Box>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            fontWeight: currentStep === s.n ? 'var(--font-weights-semibold)' : 'var(--font-weights-regular)',
            color: currentStep === s.n ? 'text.primary' : 'text.secondary',
          }}>
            {s.label}
          </Typography>
          {i < steps.length - 1 && (
            <Box sx={{ width: 32, height: 1, bgcolor: 'var(--colors-grey-3)', mx: 0.5 }} />
          )}
        </Box>
      ))}
    </Box>
  )
}

function ChangeEncounterChrome({ onBack }: { onBack: () => void }) {
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid', borderColor: 'divider',
      flexShrink: 0,
    }}>
      <Box sx={{ px: 3, pt: 1, pb: 0.5 }}>
        <Button
          size="small"
          startIcon={<ArrowBackOutlined sx={{ fontSize: '14px !important' }} />}
          onClick={onBack}
          sx={{ ...GHOST_BTN_SX, p: 0, minWidth: 0 }}
        >
          Back
        </Button>
      </Box>
      <Box sx={{ px: 3, pb: 1.5, pt: 0.75 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)' }}>
          Change Encounter
        </Typography>
      </Box>
    </Box>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FullPageFindEncounter({ chrome, initialIdentifierValue = '', onSelect, onMarkUnavailable }: Props) {
  const [identifier, setIdentifier] = useState('HAR')
  const [value, setValue] = useState(initialIdentifierValue)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = searched ? searchPatients(value) : []

  const handleSearch = () => {
    setSearched(false)
    setSearching(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearching(false)
      setSearched(true)
    }, 900)
  }

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      bgcolor: 'var(--colors-grey-2)',
    }}>
      {chrome.kind === 'wizard'
        ? <WizardChrome onBackToList={chrome.onBackToList} />
        : <ChangeEncounterChrome onBack={chrome.onBack} />
      }

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2, px: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Search panel */}
          <Box sx={{
            bgcolor: 'background.paper',
            border: '1px solid', borderColor: 'var(--colors-grey-3)',
            borderRadius: 'var(--radii-card-radius)',
            p: 2,
          }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', mb: 1.5 }}>
              Find the Encounter for the Denial
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <Box sx={{ width: 160 }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.5 }}>Identifier</Typography>
                <SmarterSelect
                  value={identifier}
                  onChange={setIdentifier}
                  options={['HAR', 'MRN', 'Visit ID', 'Patient Name']}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary', mb: 0.5 }}>{identifier}</Typography>
                <TextField
                  size="small"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={`Enter ${identifier}…`}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { height: 32, fontSize: 'var(--font-sizes-14)' } }}
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={handleSearch}
                sx={{ fontSize: 'var(--font-sizes-14)', height: 32, px: 2 }}
              >
                Search
              </Button>
            </Box>

            <Button
              size="small"
              startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
              sx={{
                mt: 1.25,
                fontSize: 'var(--font-sizes-12)', textTransform: 'none',
                color: 'var(--colors-ocean-4)', p: 0, minWidth: 0,
                fontWeight: 'var(--font-weights-regular)',
              }}
            >
              Add identifier
            </Button>

            {!searched && !searching && (
              <Alert
                icon={<InfoOutlined fontSize="small" />}
                severity="info"
                sx={{
                  mt: 1.5,
                  bgcolor: 'var(--colors-ocean-1)',
                  border: '1px solid var(--colors-ocean-2)',
                  borderRadius: 'var(--radii-sm)',
                  color: 'var(--colors-text-secondary)',
                  fontSize: 'var(--font-sizes-12)',
                  py: 0.5,
                  '& .MuiAlert-icon': { color: 'var(--colors-ocean-4)' },
                }}
              >
                <strong>Tip:</strong> Try searching by HAR/FIN from the denial letter. If unavailable, use full patient name or MRN.
              </Alert>
            )}
          </Box>

          {/* Loading state */}
          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={24} thickness={4} sx={{ color: 'var(--colors-ocean-4)' }} />
            </Box>
          )}

          {/* Results table */}
          {searched && !searching && (
            <Box sx={{
              bgcolor: 'background.paper',
              border: '1px solid', borderColor: 'var(--colors-grey-3)',
              borderRadius: 'var(--radii-card-radius)',
              overflow: 'hidden',
            }}>
              <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'var(--colors-grey-3)' }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                  Displaying {results.length} {results.length === 1 ? 'result' : 'results'}
                </Typography>
              </Box>
              <Box sx={{ overflow: 'auto' }}>
                <Box component="table" sx={{
                  width: '100%', borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                  '& th, & td': {
                    px: 1.5, py: 1.25,
                    textAlign: 'left',
                    fontSize: 'var(--font-sizes-table-cell-font-size)',
                    borderBottom: '1px solid', borderColor: 'divider',
                    verticalAlign: 'top',
                  },
                  '& th': {
                    fontWeight: 'var(--font-weights-table-header-font-weight)',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    bgcolor: 'var(--colors-grey-1)',
                    fontSize: 'var(--font-sizes-table-header-font-size)',
                  },
                  '& tr:last-of-type td': { borderBottom: 'none' },
                }}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '9%' }}  />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '7%' }}  />
                    <col style={{ width: '6%' }}  />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>HAR</th>
                      <th>MRN</th>
                      <th>Visit ID</th>
                      <th>Admit — Discharge</th>
                      <th>Principal Dx</th>
                      <th>Billed DRG</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(p => (
                      <tr key={p.har}>
                        <td>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)' }}>
                            {p.patientName}
                          </Typography>
                          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                            {p.dob}
                          </Typography>
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.har}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.mrn}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.visitId}</td>
                        <td>{p.admit} — {p.discharge}</td>
                        <td>
                          <div
                            title={p.principalDx}
                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'default' }}
                          >
                            {p.principalDx}
                          </div>
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.billedDrg}</td>
                        <td>
                          <Button
                            size="small"
                            onClick={() => onSelect(p)}
                            sx={{ fontSize: 'var(--font-sizes-12)', textTransform: 'none', color: 'var(--colors-ocean-4)', p: 0, minWidth: 0 }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Box>
          )}

          {/* Can't find the encounter? — shown after first search */}
          {(searched || searching) && (
            <Box sx={{
              bgcolor: 'background.paper',
              border: '1px solid', borderColor: 'var(--colors-grey-3)',
              borderRadius: 'var(--radii-card-radius)',
            }}>
              {/* Accordion header */}
              <Box
                onClick={() => setHelpOpen(o => !o)}
                sx={{
                  px: 2, py: 1.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { bgcolor: 'background.paper' },
                  borderRadius: helpOpen ? 'var(--radii-card-radius) var(--radii-card-radius) 0 0' : 'var(--radii-card-radius)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ManageSearchOutlined sx={{ fontSize: 20, color: 'var(--colors-ocean-4)' }} />
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary' }}>
                    Can't find the encounter?
                  </Typography>
                </Box>
                {helpOpen
                  ? <ExpandLessOutlined sx={{ fontSize: 20, color: 'var(--colors-text-secondary)' }} />
                  : <ExpandMoreOutlined sx={{ fontSize: 20, color: 'var(--colors-text-secondary)' }} />
                }
              </Box>

              {/* Accordion body */}
              {helpOpen && (
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid', borderColor: 'var(--colors-grey-3)' }}>
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', lineHeight: 1.6, pt: 1.5, pb: 2 }}>
                    This can happen if the denial date is outside your supported start date, or the encounter isn't in the system. Contact support if you believe this is an error.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                    <Button
                      size="small"
                      sx={{ fontSize: 'var(--font-sizes-14)', textTransform: 'none', color: 'var(--colors-ocean-4)', p: 0 }}
                    >
                      Contact Support
                    </Button>
                    {onMarkUnavailable && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={onMarkUnavailable}
                        sx={{ fontSize: 'var(--font-sizes-14)', textTransform: 'none' }}
                      >
                        Mark This Encounter As Not Available
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  )
}
