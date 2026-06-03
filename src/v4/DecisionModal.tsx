import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Radio, RadioGroup, FormControlLabel, IconButton, Divider, TextField,
} from '@mui/material'
import { Close as CloseIcon, ArrowBack as ArrowBackIcon, AttachFile as AttachFileIcon } from '@mui/icons-material'

/**
 * V2 only — two-step "Record Decision" modal.
 *
 * Step 1 (always shown): payer decision details. The outcome radio drives a
 *   progressive-disclosure form below: decision date (always), amount
 *   recovered (only for Overturned outcomes), payer rationale (optional),
 *   determination letter attachment (optional).
 * Step 2 (conditional): user intent. Skipped when the outcome leaves no
 *   ambiguity (Overturned full / Overturned corrected claim paid / Dismissed).
 *
 * The two-step structure keeps payer outcome and user intent as distinct data
 * points (matches how ERA/835 outcomes arrive separately from user
 * disposition), while the conditional skip avoids extra clicks for the
 * unambiguous cases.
 *
 * This modal is the canonical entry point for Submitted → Closed/Overturned
 * transitions. The Outcome tab on the case page is a *display* of the data
 * captured here, not a parallel entry surface. See V3DetailConceptC's Outcome
 * tab rendering.
 */

export type PayerOutcome =
  | 'overturned_full'
  | 'overturned_partial'
  | 'overturned_corrected'
  | 'upheld'
  | 'dismissed'

export type AppealIntent = 'appeal_again' | 'close_out'

export interface DecisionResult {
  outcome: PayerOutcome
  intent?: AppealIntent              // only present when step 2 was shown
  decisionDate: string               // ISO date YYYY-MM-DD
  recoveredAmount?: number           // only for Overturned outcomes
  payerRationale?: string
  determinationLetterFileName?: string
}

const OUTCOME_OPTIONS: { value: PayerOutcome; label: string; description: string }[] = [
  { value: 'overturned_full',      label: 'Overturned — full payment',           description: 'Payer reversed the denial; full amount approved.' },
  { value: 'overturned_partial',   label: 'Overturned — partial payment',        description: 'Payer paid a portion of the denied amount.' },
  { value: 'overturned_corrected', label: 'Overturned — corrected claim paid',   description: 'Resolved via a corrected claim rather than appeal.' },
  { value: 'upheld',               label: 'Upheld',                              description: 'Payer maintained the denial.' },
  { value: 'dismissed',            label: 'Dismissed',                           description: 'Payer dismissed the appeal procedurally (not on merits).' },
]

function outcomeNeedsIntent(outcome: PayerOutcome): boolean {
  return outcome === 'overturned_partial' || outcome === 'upheld'
}

function outcomeRecoversAmount(outcome: PayerOutcome): boolean {
  // Only Overturned variants involve money coming back. Amount-recovered is
  // nonsensical for Upheld / Dismissed and would invite stray zeros in
  // reporting, so it's hidden for those.
  return outcome === 'overturned_full'
    || outcome === 'overturned_partial'
    || outcome === 'overturned_corrected'
}

function intentPromptFor(outcome: PayerOutcome): { question: string; appealLabel: string; closeLabel: string; hint?: string } {
  if (outcome === 'overturned_partial') {
    return {
      question: 'Appeal the remaining amount?',
      appealLabel: 'Yes — appeal remaining amount',
      closeLabel:  'No — close as Overturned (partial)',
      hint: 'Appealing creates a new next-level instance with the unrecovered balance.',
    }
  }
  // upheld
  return {
    question: 'Appeal further?',
    appealLabel: 'Yes — appeal to next level',
    closeLabel:  'No — close as Upheld',
    hint: 'Appealing creates a new next-level instance. Check your timely filing window before submitting.',
  }
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface Props {
  open: boolean
  appealLevel?: string         // e.g. 'L1' — used in hint copy
  onClose: () => void
  onConfirm: (result: DecisionResult) => void
}

export default function DecisionModal({ open, appealLevel, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [outcome, setOutcome] = useState<PayerOutcome | null>(null)
  const [intent, setIntent]   = useState<AppealIntent | null>(null)
  const [decisionDate, setDecisionDate]   = useState<string>(todayISO())
  const [recoveredAmount, setRecoveredAmount] = useState<string>('')
  const [payerRationale, setPayerRationale]   = useState<string>('')
  const [letterFileName, setLetterFileName]   = useState<string>('')

  // Reset on each open. Decision date re-defaults to today rather than
  // sticking to a previous session's value.
  useEffect(() => {
    if (open) {
      setStep(1); setOutcome(null); setIntent(null)
      setDecisionDate(todayISO())
      setRecoveredAmount('')
      setPayerRationale('')
      setLetterFileName('')
    }
  }, [open])

  // Step counter is only meaningful for multi-step paths. For single-step
  // (unambiguous) outcomes, hiding the counter avoids "Step 1 of 1" noise.
  // Pre-selection we don't know the total, so the counter is also hidden.
  const isMultiStep = outcome !== null && outcomeNeedsIntent(outcome)
  const stepCounterText = isMultiStep ? `Step ${step} of 2` : ''

  // Step 1 is valid when an outcome is picked AND a decision date is set
  // (the date defaults to today, so the only way it's empty is if the user
  // explicitly clears it). Amount/rationale/letter are optional.
  const step1Valid = Boolean(outcome) && Boolean(decisionDate)

  function buildResult(includeIntent: boolean): DecisionResult {
    const recovered = recoveredAmount.trim() === '' ? undefined : Number(recoveredAmount)
    return {
      outcome: outcome!,
      ...(includeIntent && intent ? { intent } : {}),
      decisionDate,
      ...(outcome && outcomeRecoversAmount(outcome) && recovered !== undefined && !Number.isNaN(recovered)
        ? { recoveredAmount: recovered } : {}),
      ...(payerRationale.trim() ? { payerRationale: payerRationale.trim() } : {}),
      ...(letterFileName ? { determinationLetterFileName: letterFileName } : {}),
    }
  }

  function handleNext() {
    if (!step1Valid) return
    if (outcome && outcomeNeedsIntent(outcome)) {
      setStep(2)
    } else {
      onConfirm(buildResult(false))
    }
  }

  function handleConfirmStep2() {
    if (!outcome || !intent) return
    onConfirm(buildResult(true))
  }

  const intentPrompt = outcome && outcomeNeedsIntent(outcome) ? intentPromptFor(outcome) : null
  const nextLevelLabel = appealLevel === 'L1' ? 'L2' : appealLevel === 'L2' ? 'L3' : 'next level'
  const showRecoveredField = outcome !== null && outcomeRecoversAmount(outcome)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-semibold)' }}>
        {step === 2 && (
          <IconButton size="small" onClick={() => setStep(1)} sx={{ mr: -0.5 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }}>
          {step === 1 ? 'Record decision' : 'What’s next?'}
        </Box>
        {stepCounterText && (
          <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', fontWeight: 'var(--font-weights-regular)' }}>
            {stepCounterText}
          </Typography>
        )}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {step === 1 && (
          <>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-secondary)', mb: 2 }}>
              What did the payer decide?
            </Typography>
            <RadioGroup
              value={outcome ?? ''}
              onChange={(_, v) => setOutcome(v as PayerOutcome)}
            >
              {OUTCOME_OPTIONS.map(opt => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  sx={{
                    alignItems: 'flex-start',
                    py: 0.5,
                    '& .MuiFormControlLabel-label': { width: '100%' },
                    '& .MuiRadio-root': { pt: 0.5 },
                  }}
                  label={
                    <Box sx={{ pl: 0.5 }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)' }}>
                        {opt.label}
                      </Typography>
                      <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>
                        {opt.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>

            {/* Progressive-disclosure fields. Appear only after the user has
                selected an outcome — keeps the modal compact pre-selection
                and avoids asking for data that's irrelevant (e.g. amount
                recovered for Upheld/Dismissed). */}
            {outcome && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: showRecoveredField ? '1fr 1fr' : '1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Decision date"
                    type="date"
                    size="small"
                    required
                    value={decisionDate}
                    onChange={(e) => setDecisionDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& input': { fontSize: 'var(--font-sizes-14)' } }}
                  />
                  {showRecoveredField && (
                    <TextField
                      label="Amount recovered"
                      type="number"
                      size="small"
                      placeholder="0.00"
                      value={recoveredAmount}
                      onChange={(e) => setRecoveredAmount(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 0, step: '0.01' }}
                      sx={{ '& input': { fontSize: 'var(--font-sizes-14)', fontVariantNumeric: 'tabular-nums' } }}
                    />
                  )}
                </Box>
                <TextField
                  label="Payer's rationale"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Paste the payer's stated reasoning from the determination letter…"
                  value={payerRationale}
                  onChange={(e) => setPayerRationale(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, '& textarea': { fontSize: 'var(--font-sizes-14)' } }}
                />
                {/* Letter attachment — mock for prototype. Real impl would
                    open a file picker and POST to storage. Here we accept a
                    file and record its name only. */}
                <Box>
                  <Typography sx={{
                    fontSize: 'var(--font-sizes-12)',
                    color: 'var(--colors-text-secondary)',
                    fontWeight: 'var(--font-weights-medium)',
                    mb: 0.75,
                  }}>
                    Payer determination letter
                  </Typography>
                  <Box
                    component="label"
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      border: 'var(--border-widths-thin) dashed var(--colors-grey-5)',
                      borderRadius: 'var(--radii-sm)',
                      px: 'var(--spacing-3)', py: 'var(--spacing-2)',
                      cursor: 'pointer',
                      bgcolor: letterFileName ? 'var(--colors-ocean-1)' : 'transparent',
                      '&:hover': { borderColor: 'var(--colors-ocean-4)' },
                    }}
                  >
                    <AttachFileIcon fontSize="small" sx={{ color: 'var(--colors-text-tertiary)' }} />
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: letterFileName ? 'var(--colors-text-primary)' : 'var(--colors-text-secondary)', flex: 1 }}>
                      {letterFileName || 'Attach the payer’s response letter (optional)'}
                    </Typography>
                    <Box
                      component="input"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.tiff,.heic"
                      sx={{ display: 'none' }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0]
                        if (file) setLetterFileName(file.name)
                      }}
                    />
                  </Box>
                </Box>
              </>
            )}
          </>
        )}

        {step === 2 && intentPrompt && (
          <>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'var(--colors-text-secondary)', mb: 0.5 }}>
              Payer outcome: <strong style={{ color: 'var(--colors-text-primary)' }}>{OUTCOME_OPTIONS.find(o => o.value === outcome)?.label}</strong>
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-16)', fontWeight: 'var(--font-weights-medium)', mt: 1.5, mb: 1.5 }}>
              {intentPrompt.question}
            </Typography>
            <RadioGroup
              value={intent ?? ''}
              onChange={(_, v) => setIntent(v as AppealIntent)}
            >
              <FormControlLabel
                value="appeal_again"
                control={<Radio size="small" />}
                sx={{ py: 0.5, '& .MuiFormControlLabel-label': { width: '100%' } }}
                label={
                  <Box sx={{ pl: 0.5 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)' }}>
                      {intentPrompt.appealLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>
                      A new {nextLevelLabel} appeal will be created in Ready.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="close_out"
                control={<Radio size="small" />}
                sx={{ py: 0.5, '& .MuiFormControlLabel-label': { width: '100%' } }}
                label={
                  <Box sx={{ pl: 0.5 }}>
                    <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-medium)' }}>
                      {intentPrompt.closeLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)' }}>
                      This denial moves to Closed. No further appeals will be filed for this round.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
            {intentPrompt.hint && (
              <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', mt: 1.5, fontStyle: 'italic' }}>
                {intentPrompt.hint}
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: 'var(--colors-text-secondary)' }}>Cancel</Button>
        {step === 1 ? (
          <Button
            variant="contained"
            disableElevation
            disabled={!step1Valid}
            onClick={handleNext}
          >
            {outcome && outcomeNeedsIntent(outcome) ? 'Next' : 'Record decision'}
          </Button>
        ) : (
          <Button
            variant="contained"
            disableElevation
            disabled={!intent}
            onClick={handleConfirmStep2}
          >
            Record decision
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
