import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Radio, RadioGroup, FormControlLabel, IconButton, Divider,
} from '@mui/material'
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'

/**
 * V2 only — two-step "Record Decision" modal.
 *
 * Step 1 (always shown): payer decision.
 * Step 2 (conditional): user intent. Skipped when the outcome leaves no ambiguity
 *   (Overturned full / Overturned corrected claim paid / Dismissed).
 *
 * The two-step structure keeps payer outcome and user intent as distinct data
 * points (matches how ERA/835 outcomes arrive separately from user disposition),
 * while the conditional skip avoids extra clicks for the unambiguous cases.
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
  intent?: AppealIntent      // only present when step 2 was shown
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

  useEffect(() => {
    if (open) { setStep(1); setOutcome(null); setIntent(null) }
  }, [open])

  function handleNext() {
    if (!outcome) return
    if (outcomeNeedsIntent(outcome)) {
      setStep(2)
    } else {
      onConfirm({ outcome })
    }
  }

  function handleConfirmStep2() {
    if (!outcome || !intent) return
    onConfirm({ outcome, intent })
  }

  const intentPrompt = outcome && outcomeNeedsIntent(outcome) ? intentPromptFor(outcome) : null
  const nextLevelLabel = appealLevel === 'L1' ? 'L2' : appealLevel === 'L2' ? 'L3' : 'next level'

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
        <Typography sx={{ fontSize: 'var(--font-sizes-12)', color: 'var(--colors-text-secondary)', fontWeight: 'var(--font-weights-regular)' }}>
          Step {step} of {outcome && outcomeNeedsIntent(outcome) ? 2 : 1}
        </Typography>
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
            disabled={!outcome}
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
