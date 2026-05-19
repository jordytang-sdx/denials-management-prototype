import { useState } from 'react'
import { Box, Typography, Button, Chip } from '@mui/material'
import { AddOutlined } from '@mui/icons-material'
import SmarterSelect from './SmarterSelect'
import SmarterRadioGroup from './SmarterRadio'
import {
  type DrgAdjustments, type DiagnosisAdjustment, type DrgSeverity, type DrgBilledLabel,
  DIAGNOSIS_ADJUSTMENT_OPTIONS,
} from './drgMockData'

// ── Tokens shorthand ─────────────────────────────────────────────────────────

const SECTION_TITLE_SX = {
  fontSize: 'var(--font-sizes-14)',
  fontWeight: 'var(--font-weights-semibold)',
  color: 'text.primary' as const,
}

const SUBSECTION_TITLE_SX = {
  fontSize: 'var(--font-sizes-14)',
  fontWeight: 'var(--font-weights-medium)',
  color: 'text.primary' as const,
}

const FIELD_LABEL_SX = {
  fontSize: 'var(--font-sizes-12)',
  color: 'text.secondary' as const,
}

// ── Severity badge (MCC / CC / Base) ─────────────────────────────────────────

function SeverityBadge({ severity, emphasized }: { severity: DrgSeverity; emphasized?: boolean }) {
  if (!severity) return null
  if (emphasized) {
    return (
      <Chip
        label={severity}
        size="small"
        sx={{
          height: 22,
          fontSize: 'var(--font-sizes-12)',
          fontWeight: 'var(--font-weights-medium)',
          bgcolor: 'var(--colors-badge-variant-warning-emphasized-background)',
          color: 'var(--colors-badge-variant-warning-emphasized-text)',
          borderRadius: 'var(--radii-badge-radius)',
          '& .MuiChip-label': { px: 1 },
        }}
      />
    )
  }
  return (
    <Chip
      label={severity}
      size="small"
      sx={{
        height: 22,
        fontSize: 'var(--font-sizes-12)',
        fontWeight: 'var(--font-weights-medium)',
        bgcolor: 'var(--colors-badge-variant-default-subtle-background)',
        color: 'var(--colors-badge-variant-default-subtle-text)',
        borderRadius: 'var(--radii-badge-radius)',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

function BilledRoleBadge({ label }: { label: DrgBilledLabel }) {
  if (!label) return null
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: 'var(--font-sizes-12)',
        fontWeight: 'var(--font-weights-regular)',
        bgcolor: 'var(--colors-badge-variant-default-subtle-background)',
        color: 'var(--colors-badge-variant-default-subtle-text)',
        borderRadius: 'var(--radii-badge-radius)',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

// ── DRG row (Billed / Payer-adjusted) ───────────────────────────────────────

function DrgRowDisplay({
  label, code, description, severity, variant = 'default',
}: {
  label: string
  code: string
  description: string
  severity: DrgSeverity
  variant?: 'default' | 'adjusted'
}) {
  const isAdjusted = variant === 'adjusted'
  return (
    <Box sx={{
      display: 'flex', alignItems: 'stretch',
      border: '1px solid',
      borderColor: isAdjusted ? 'var(--colors-badge-variant-warning-border)' : 'var(--colors-grey-4)',
      borderRadius: 'var(--radii-sm)',
      overflow: 'hidden',
      bgcolor: isAdjusted ? 'var(--colors-badge-variant-warning-background)' : 'var(--colors-grey-1)',
    }}>
      <Box sx={{
        width: 132, flexShrink: 0,
        px: 1.5, py: 1,
        borderRight: '1px solid',
        borderColor: isAdjusted ? 'var(--colors-orange-3)' : 'var(--colors-grey-4)',
        display: 'flex', alignItems: 'center',
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)',
          fontWeight: 'var(--font-weights-medium)',
          color: isAdjusted ? 'var(--colors-badge-variant-warning-text)' : 'text.primary',
        }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{
        flex: 1,
        px: 1.5, py: 1,
        display: 'flex', alignItems: 'center', gap: 1.5,
        minWidth: 0,
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-14)',
          fontWeight: 'var(--font-weights-semibold)',
          color: 'text.primary',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {code}
        </Typography>
        <Typography sx={{
          fontSize: 'var(--font-sizes-14)',
          color: 'text.secondary',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1, minWidth: 0,
        }}>
          {description}
        </Typography>
        <SeverityBadge severity={severity} emphasized={isAdjusted} />
      </Box>
    </Box>
  )
}

// ── Adjustment select (small pill with warning tone when changed) ────────────

function AdjustmentSelect({
  value, onChange,
}: {
  value: DiagnosisAdjustment
  onChange: (v: DiagnosisAdjustment) => void
}) {
  const isChanged = value !== 'Unchanged'
  return (
    <Box sx={{
      // Override SmarterSelect's defaults to make it pill-shaped + warning-toned when changed.
      '& > button': {
        height: 28,
        borderRadius: 'var(--radii-badge-radius)',
        borderColor: isChanged ? 'var(--colors-badge-variant-warning-border)' : 'var(--colors-grey-4)',
        color: isChanged ? 'var(--colors-badge-variant-warning-text)' : 'var(--colors-select-trigger-text)',
        fontSize: 'var(--font-sizes-12)',
        px: 1.25,
      },
      '& > button svg': {
        color: isChanged ? 'var(--colors-badge-variant-warning-text)' : 'var(--colors-select-trigger-icon-color)',
      },
    }}>
      <SmarterSelect
        value={value}
        onChange={v => onChange(v as DiagnosisAdjustment)}
        options={DIAGNOSIS_ADJUSTMENT_OPTIONS as unknown as string[]}
      />
    </Box>
  )
}

// ── Diagnoses table ──────────────────────────────────────────────────────────

function DiagnosesTable({
  rows, adjustments, onChange,
}: {
  rows: DrgAdjustments['diagnoses']
  adjustments: Record<string, DiagnosisAdjustment>
  onChange: (id: string, v: DiagnosisAdjustment) => void
}) {
  return (
    <Box sx={{
      border: '1px solid', borderColor: 'var(--colors-grey-4)',
      borderRadius: 'var(--radii-table-layout-border-radius)',
      overflow: 'hidden',
    }}>
      <Box sx={{
        display: 'grid', gridTemplateColumns: '1fr 160px 200px',
        bgcolor: 'var(--colors-grey-2)',
        borderBottom: '1px solid', borderColor: 'var(--colors-grey-4)',
      }}>
        {['Diagnosis Code', 'Billed', 'Payer Adjustment'].map(h => (
          <Box key={h} sx={{ px: 1.5, py: 1 }}>
            <Typography sx={{
              fontSize: 'var(--font-sizes-12)',
              fontWeight: 'var(--font-weights-medium)',
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {h}
            </Typography>
          </Box>
        ))}
      </Box>
      {rows.map((row, i) => (
        <Box
          key={row.id}
          sx={{
            display: 'grid', gridTemplateColumns: '1fr 160px 200px',
            alignItems: 'center',
            borderBottom: i < rows.length - 1 ? '1px solid var(--colors-grey-3)' : 'none',
          }}
        >
          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
            <Typography sx={{
              fontSize: 'var(--font-sizes-14)',
              fontWeight: 'var(--font-weights-semibold)',
              color: 'text.primary',
              fontVariantNumeric: 'tabular-nums',
              width: 60, flexShrink: 0,
            }}>
              {row.code}
            </Typography>
            <Typography sx={{
              fontSize: 'var(--font-sizes-14)',
              color: 'text.secondary',
              lineHeight: 1.4,
            }}>
              {row.name}
            </Typography>
          </Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <BilledRoleBadge label={row.billedLabel} />
          </Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <AdjustmentSelect
              value={adjustments[row.id] ?? row.defaultAdjustment}
              onChange={v => onChange(row.id, v)}
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  adjustments: DrgAdjustments
}

export default function DrgAdjustmentsSection({ adjustments }: Props) {
  const [drgSystem, setDrgSystem] = useState<'MS-DRG' | 'APR-DRG'>(adjustments.drgSystem)
  const [diagAdjustments, setDiagAdjustments] = useState<Record<string, DiagnosisAdjustment>>({})

  const updateAdj = (id: string, v: DiagnosisAdjustment) =>
    setDiagAdjustments(prev => ({ ...prev, [id]: v }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* DRG sub-block */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={SUBSECTION_TITLE_SX}>DRG</Typography>
          <SmarterRadioGroup
            value={drgSystem}
            onChange={v => setDrgSystem(v as 'MS-DRG' | 'APR-DRG')}
            direction="row"
            columnGap="20px"
            options={[
              { value: 'MS-DRG',  label: 'MS-DRG'  },
              { value: 'APR-DRG', label: 'APR-DRG' },
            ]}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <DrgRowDisplay
            label="Billed DRG"
            code={adjustments.billed.code}
            description={adjustments.billed.description}
            severity={adjustments.billed.severity}
          />
          <DrgRowDisplay
            label="Payer-adjusted"
            code={adjustments.payerAdjusted.code}
            description={adjustments.payerAdjusted.description}
            severity={adjustments.payerAdjusted.severity}
            variant="adjusted"
          />
        </Box>
      </Box>

      {/* Adjusted Diagnoses */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <Typography sx={SUBSECTION_TITLE_SX}>Adjusted Diagnoses</Typography>
          <Typography sx={{ ...FIELD_LABEL_SX, mt: 0.25 }}>
            Review the payer's adjustment for each diagnosis. Use the dropdown to update any row.
          </Typography>
        </Box>
        <DiagnosesTable
          rows={adjustments.diagnoses}
          adjustments={diagAdjustments}
          onChange={updateAdj}
        />
        <Button
          size="small"
          startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
          sx={{
            alignSelf: 'flex-start', p: 0,
            fontSize: 'var(--font-sizes-12)',
            textTransform: 'none',
            color: 'var(--colors-ocean-4)',
            fontWeight: 'var(--font-weights-regular)',
          }}
        >
          Add Diagnosis Code
        </Button>
      </Box>

      {/* Adjusted Procedures */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={SUBSECTION_TITLE_SX}>Adjusted Procedures</Typography>
        {adjustments.procedures.length > 0 ? (
          <Box sx={{
            border: '1px solid', borderColor: 'var(--colors-grey-4)',
            borderRadius: 'var(--radii-table-layout-border-radius)',
            overflow: 'hidden',
          }}>
            <Box sx={{
              display: 'grid', gridTemplateColumns: '1fr 200px',
              bgcolor: 'var(--colors-grey-2)',
              borderBottom: '1px solid', borderColor: 'var(--colors-grey-4)',
            }}>
              {['Procedure Code', 'Payer Adjustment'].map(h => (
                <Box key={h} sx={{ px: 1.5, py: 1 }}>
                  <Typography sx={{
                    fontSize: 'var(--font-sizes-12)',
                    fontWeight: 'var(--font-weights-medium)',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </Typography>
                </Box>
              ))}
            </Box>
            {adjustments.procedures.map((p, i) => (
              <Box
                key={p.id}
                sx={{
                  display: 'grid', gridTemplateColumns: '1fr 200px',
                  alignItems: 'center',
                  borderBottom: i < adjustments.procedures.length - 1 ? '1px solid var(--colors-grey-3)' : 'none',
                }}
              >
                <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
                  <Typography sx={{
                    fontSize: 'var(--font-sizes-14)',
                    fontWeight: 'var(--font-weights-semibold)',
                    color: 'text.primary',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}>
                    {p.code}
                  </Typography>
                  <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary' }}>
                    {p.name}
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 1 }}>
                  <AdjustmentSelect value={p.defaultAdjustment} onChange={() => {}} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        <Button
          size="small"
          startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />}
          sx={{
            alignSelf: 'flex-start', p: 0,
            fontSize: 'var(--font-sizes-12)',
            textTransform: 'none',
            color: 'var(--colors-ocean-4)',
            fontWeight: 'var(--font-weights-regular)',
          }}
        >
          Add Procedure
        </Button>
      </Box>

    </Box>
  )
}

// Re-export for convenience
export { SECTION_TITLE_SX }
