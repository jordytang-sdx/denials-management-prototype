import { useState } from 'react'
import { Box, Typography, Button, TextField, Alert } from '@mui/material'
import { ArrowBackOutlined, AddOutlined, InfoOutlined } from '@mui/icons-material'
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
}

const MOCK_RESULT: EncounterResult = {
  patientName: 'Susan Smith',
  dob: '08/14/1955',
  har: '5291037',
  mrn: '3921847',
  visitId: '8847201',
  admit: '05/28/2024',
  discharge: '06/05/2024',
  principalDx: 'A41.9 — Sepsis, unspecified organism',
  billedDrg: '871',
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

export default function FullPageFindEncounter({ chrome, initialIdentifierValue = '', onSelect }: Props) {
  const [identifier, setIdentifier] = useState('HAR')
  const [value, setValue] = useState(initialIdentifierValue)
  const [searched, setSearched] = useState(false)

  const handleSearch = () => setSearched(true)

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
        <Box sx={{ maxWidth: 960, mx: 'auto', py: 2, px: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

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

            {!searched && (
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

          {/* Results table */}
          {searched && (
            <Box sx={{
              bgcolor: 'background.paper',
              border: '1px solid', borderColor: 'var(--colors-grey-3)',
              borderRadius: 'var(--radii-card-radius)',
              overflow: 'hidden',
            }}>
              <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'var(--colors-grey-3)' }}>
                <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                  Displaying 1 result
                </Typography>
              </Box>
              <Box sx={{ overflow: 'auto' }}>
                <Box component="table" sx={{
                  width: '100%', borderCollapse: 'collapse',
                  '& th, & td': {
                    px: 2, py: 1.5,
                    textAlign: 'left',
                    fontSize: 'var(--font-sizes-12)',
                    borderBottom: '1px solid', borderColor: 'divider',
                  },
                  '& th': {
                    fontWeight: 'var(--font-weights-semibold)',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    bgcolor: 'var(--colors-grey-1)',
                    fontSize: 'var(--font-sizes-10)',
                  },
                  '& td': {
                    fontSize: 'var(--font-sizes-14)',
                  },
                  '& tr:last-of-type td': { borderBottom: 'none' },
                }}>
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
                    <tr>
                      <td>
                        <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)' }}>
                          {MOCK_RESULT.patientName}
                        </Typography>
                        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'text.secondary' }}>
                          {MOCK_RESULT.dob}
                        </Typography>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{MOCK_RESULT.har}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{MOCK_RESULT.mrn}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{MOCK_RESULT.visitId}</td>
                      <td>{MOCK_RESULT.admit} — {MOCK_RESULT.discharge}</td>
                      <td>{MOCK_RESULT.principalDx}</td>
                      <td>{MOCK_RESULT.billedDrg}</td>
                      <td>
                        <Button
                          size="small"
                          onClick={() => onSelect(MOCK_RESULT)}
                          sx={{ fontSize: 'var(--font-sizes-14)', textTransform: 'none', color: 'var(--colors-ocean-4)' }}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </Box>
              </Box>
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  )
}
