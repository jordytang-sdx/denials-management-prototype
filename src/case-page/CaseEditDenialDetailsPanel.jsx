import { useState } from 'react'
import {
  Box, Typography, Button, IconButton, Divider, TextField,
  Radio, RadioGroup, FormControlLabel, FormControl, Select, MenuItem,
} from '@mui/material'
import { CloseOutlined, AddOutlined } from '@mui/icons-material'

const LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']
const DRG_REVIEW_TYPE_OPTIONS = ['Clinical Validation Review', 'Coding Audit']
const PAYER_OPTIONS = ['Aetna', 'BCBS', 'CMS / Medicare', 'Cigna', 'Humana', 'UnitedHealthcare']
const REVIEW_ENTITY_OPTIONS = ['Cotiviti', 'Optum', 'Performant']

function formatPatientName(name) {
  if (!name) return 'Unknown patient'
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
}

function mdyToISO(mdy) {
  if (!mdy) return ''
  const d = new Date(mdy)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inferDenialType(type) {
  if (!type) return 'other'
  const l = String(type).toLowerCase()
  if (l.includes('drg')) return 'drg_downgrade'
  if (l.includes('medical necessity')) return 'medical_necessity'
  return 'other'
}

const SECTION_LABEL_SX = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const FIELD_LABEL_SX = {
  fontSize: '0.75rem',
  color: 'text.secondary',
  mb: 0.5,
}

export default function CaseEditDenialDetailsPanel({ caseData, onClose }) {
  const [denialType, setDenialType] = useState(inferDenialType(caseData.type))
  const [drgReviewType, setDrgReviewType] = useState('Clinical Validation Review')
  const [level, setLevel] = useState(caseData.level || 'Level 2')
  const [payer, setPayer] = useState(caseData.payer || '')
  const [deadlineISO, setDeadlineISO] = useState(mdyToISO(caseData.appealDeadline))
  const [reviewEntity, setReviewEntity] = useState('')
  const [payerRationale, setPayerRationale] = useState(caseData.additionalRemarks || '')

  const encFields = [
    { label: 'Name',          value: caseData.patientName },
    { label: 'HAR',           value: caseData.har,         mono: true },
    { label: 'MRN',           value: caseData.mrn,         mono: true },
    { label: 'DOS',           value: caseData.dischargeDate },
    { label: 'Date of Birth', value: null },
    { label: 'Visit ID',      value: caseData.visitId },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>

      {/* Header with close button */}
      <Box sx={{
        px: 2.5, py: 1.5,
        borderBottom: '1px solid', borderColor: 'divider',
        flexShrink: 0,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
      }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Edit Denial Details
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caseData.patientName ? formatPatientName(caseData.patientName) : '—'}
            {caseData.payer ? ` · ${caseData.payer}` : ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, color: 'text.secondary' }}>
          <CloseOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* Encounter */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1 }}>Encounter</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 20px' }}>
            {encFields.map(({ label, value, mono }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                  {label}
                </Typography>
                {value ? (
                  mono
                    ? <Typography sx={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{value}</Typography>
                    : <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{value}</Typography>
                ) : (
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled' }}>—</Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Denial Type */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Denial Type</Typography>
          <RadioGroup value={denialType} onChange={e => setDenialType(e.target.value)}>
            <FormControlLabel
              value="drg_downgrade"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: '0.875rem' }}>DRG Downgrade</Typography>}
            />
            {denialType === 'drg_downgrade' && (
              <Box sx={{ ml: '30px', my: 0.5 }}>
                <Typography sx={{ ...FIELD_LABEL_SX, mb: 0.25 }}>Review type</Typography>
                <RadioGroup value={drgReviewType} onChange={e => setDrgReviewType(e.target.value)}>
                  {DRG_REVIEW_TYPE_OPTIONS.map(o => (
                    <FormControlLabel
                      key={o}
                      value={o}
                      control={<Radio size="small" sx={{ py: 0.25, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
                      label={<Typography sx={{ fontSize: '0.8125rem' }}>{o}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </Box>
            )}
            <FormControlLabel
              value="medical_necessity"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: '0.875rem' }}>Medical Necessity</Typography>}
            />
            <FormControlLabel
              value="other"
              control={<Radio size="small" sx={{ py: 0.5, '&.Mui-checked': { color: 'var(--colors-ocean-4)' } }} />}
              label={<Typography sx={{ fontSize: '0.875rem' }}>Other</Typography>}
            />
          </RadioGroup>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Denial Logistics */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Denial Logistics</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={FIELD_LABEL_SX}>Level</Typography>
                <FormControl size="small" fullWidth>
                  <Select value={level} onChange={e => setLevel(e.target.value)}>
                    {LEVEL_OPTIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={FIELD_LABEL_SX}>Appeal Deadline</Typography>
                <TextField
                  size="small"
                  type="date"
                  fullWidth
                  value={deadlineISO}
                  onChange={e => setDeadlineISO(e.target.value)}
                />
              </Box>
            </Box>
            <Box>
              <Typography sx={FIELD_LABEL_SX}>Payer</Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={payer}
                  onChange={e => setPayer(e.target.value)}
                  displayEmpty
                  renderValue={payer ? undefined : () => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Select payer</span>}
                >
                  {[payer, ...PAYER_OPTIONS.filter(p => p !== payer)].filter(Boolean).map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography sx={FIELD_LABEL_SX}>
                Review Entity{' '}
                <Typography component="span" sx={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.38)' }}>
                  (optional)
                </Typography>
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={reviewEntity}
                  onChange={e => setReviewEntity(e.target.value)}
                  displayEmpty
                  renderValue={reviewEntity ? undefined : () => <span style={{ color: 'rgba(0,0,0,0.38)' }}>Search review entity</span>}
                >
                  {REVIEW_ENTITY_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Payer Adjustments — DRG only */}
        {denialType === 'drg_downgrade' && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Payer Adjustments</Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
                Add the diagnoses and procedures the payer adjusted.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, mb: 0.75 }}>Adjusted Diagnoses</Typography>
                  <Button
                    size="small"
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    sx={{ fontSize: '0.8125rem', p: 0, textTransform: 'none', color: 'var(--colors-ocean-4)' }}
                  >
                    Add Diagnosis Code
                  </Button>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, mb: 0.75 }}>Adjusted Procedures</Typography>
                  <Button
                    size="small"
                    startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
                    sx={{ fontSize: '0.8125rem', p: 0, textTransform: 'none', color: 'var(--colors-ocean-4)' }}
                  >
                    Add Procedure
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Payer Rationale */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.25 }}>Payer Rationale</Typography>
          <TextField
            multiline
            fullWidth
            size="small"
            value={payerRationale}
            onChange={e => setPayerRationale(e.target.value)}
            placeholder="Enter the payer's rationale for denial…"
            minRows={4}
          />
        </Box>

      </Box>

      {/* Footer */}
      <Box sx={{
        borderTop: '1px solid', borderColor: 'divider',
        px: 2.5, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5,
        bgcolor: 'background.paper', flexShrink: 0,
      }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ fontSize: '0.8125rem' }}>
          Cancel
        </Button>
        <Button variant="contained" size="small" onClick={onClose} sx={{ fontSize: '0.8125rem' }}>
          Save
        </Button>
      </Box>
    </Box>
  )
}
