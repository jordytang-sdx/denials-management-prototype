import { useState } from 'react'
import { Box, Typography, Button, Chip, IconButton } from '@mui/material'
import { AddOutlined, CloseOutlined } from '@mui/icons-material'
import SmarterSelect from './SmarterSelect'
import SmarterRadioGroup from './SmarterRadio'
import SmarterComboBox from './SmarterComboBox'
import {
  type DrgAdjustments, type DiagnosisAdjustment, type DrgSeverity, type DrgBilledLabel,
  DIAGNOSIS_ADJUSTMENT_OPTIONS, DRG_CODE_OPTIONS, ICD10_CODE_OPTIONS, PROCEDURE_CODE_OPTIONS,
  parseDrgSeverity,
} from './drgMockData'

// ── Design token shorthand ────────────────────────────────────────────────────

const SUBSECTION_TITLE_SX = {
  fontSize: 'var(--font-sizes-14)',
  fontWeight: 'var(--font-weights-medium)',
  color: 'text.primary' as const,
}

const FIELD_LABEL_SX = {
  fontSize: 'var(--font-sizes-12)',
  color: 'text.secondary' as const,
}

const TABLE_BORDER_SX = {
  border: '1px solid', borderColor: 'var(--colors-grey-4)',
  borderRadius: 'var(--radii-table-layout-border-radius)',
  overflow: 'hidden',
}

const TABLE_HEADER_SX = {
  display: 'flex',
  bgcolor: 'var(--colors-grey-2)',
  borderBottom: '1px solid var(--colors-grey-4)',
}

const TABLE_HEADER_CELL_SX = {
  fontSize: 'var(--font-sizes-10)',
  fontWeight: 'var(--font-weights-medium)',
  color: 'text.secondary' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

const ADD_BTN_SX = {
  alignSelf: 'flex-start' as const, p: 0,
  fontSize: 'var(--font-sizes-12)',
  textTransform: 'none' as const,
  color: 'var(--colors-ocean-4)',
  fontWeight: 'var(--font-weights-regular)',
}


// ── Severity / Billed-role badges ─────────────────────────────────────────────

function SeverityBadge({ severity, emphasized }: { severity: DrgSeverity; emphasized?: boolean }) {
  if (!severity) return null
  return (
    <Chip
      label={severity}
      size="small"
      sx={{
        height: 22, flexShrink: 0,
        fontSize: 'var(--font-sizes-12)',
        fontWeight: 'var(--font-weights-medium)',
        borderRadius: 'var(--radii-badge-radius)',
        '& .MuiChip-label': { px: 1 },
        ...(emphasized
          ? { bgcolor: 'var(--colors-badge-variant-warning-emphasized-background)', color: 'var(--colors-badge-variant-warning-emphasized-text)' }
          : { bgcolor: 'var(--colors-badge-variant-default-subtle-background)', color: 'var(--colors-badge-variant-default-subtle-text)' }),
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

// ── DRG row — read-only display ───────────────────────────────────────────────

function DrgRowDisplay({ label, code, description, severity, variant = 'default' }: {
  label: string; code: string; description: string; severity: DrgSeverity
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
        width: 132, flexShrink: 0, px: 1.5, py: 1,
        borderRight: '1px solid',
        borderColor: isAdjusted ? 'var(--colors-orange-3)' : 'var(--colors-grey-4)',
        display: 'flex', alignItems: 'center',
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)',
          color: isAdjusted ? 'var(--colors-badge-variant-warning-text)' : 'text.primary',
        }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {code}
        </Typography>
        <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {description}
        </Typography>
        <SeverityBadge severity={severity} emphasized={isAdjusted} />
      </Box>
    </Box>
  )
}

// ── DRG row — editable input (new-entry mode) ─────────────────────────────────

function DrgRowInput({ label, variant = 'default', value, onChange }: {
  label: string
  variant?: 'default' | 'adjusted'
  value: string
  onChange: (v: string) => void
}) {
  const isAdjusted = variant === 'adjusted'
  return (
    <Box sx={{
      display: 'flex', alignItems: 'stretch',
      border: '1px solid',
      borderColor: isAdjusted ? 'var(--colors-badge-variant-warning-border)' : 'var(--colors-grey-4)',
      borderRadius: 'var(--radii-sm)',
      overflow: 'hidden',
      bgcolor: isAdjusted ? 'var(--colors-badge-variant-warning-background)' : 'background.paper',
    }}>
      <Box sx={{
        width: 132, flexShrink: 0, px: 1.5, py: 1,
        borderRight: '1px solid',
        borderColor: isAdjusted ? 'var(--colors-orange-3)' : 'var(--colors-grey-4)',
        display: 'flex', alignItems: 'center',
      }}>
        <Typography sx={{
          fontSize: 'var(--font-sizes-12)', fontWeight: 'var(--font-weights-medium)',
          color: isAdjusted ? 'var(--colors-badge-variant-warning-text)' : 'text.primary',
        }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, pr: value ? 1.5 : 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SmarterComboBox
            variant="inline"
            value={value}
            onChange={onChange}
            options={DRG_CODE_OPTIONS}
            placeholder="Search DRG code or description…"
          />
        </Box>
        {value && <SeverityBadge severity={parseDrgSeverity(value)} emphasized={isAdjusted} />}
      </Box>
    </Box>
  )
}

// ── Adjustment select pill ────────────────────────────────────────────────────

function AdjustmentSelect({ value, onChange }: {
  value: DiagnosisAdjustment
  onChange: (v: DiagnosisAdjustment) => void
}) {
  const isChanged = value !== 'Unchanged'
  return (
    <Box sx={{
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

// ── Diagnoses table — read-only rows ─────────────────────────────────────────

function DiagnosesTable({ rows, adjustments, onChange }: {
  rows: DrgAdjustments['diagnoses']
  adjustments: Record<string, DiagnosisAdjustment>
  onChange: (id: string, v: DiagnosisAdjustment) => void
}) {
  return (
    <Box sx={TABLE_BORDER_SX}>
      <Box sx={{ ...TABLE_HEADER_SX, display: 'grid', gridTemplateColumns: '1fr 160px 200px' }}>
        {['Diagnosis Code', 'Billed', 'Payer Adjustment'].map(h => (
          <Box key={h} sx={{ px: 1.5, py: 1 }}>
            <Typography sx={TABLE_HEADER_CELL_SX}>{h}</Typography>
          </Box>
        ))}
      </Box>
      {rows.map((row, i) => (
        <Box key={row.id} sx={{
          display: 'grid', gridTemplateColumns: '1fr 160px 200px',
          alignItems: 'center',
          borderBottom: i < rows.length - 1 ? '1px solid var(--colors-grey-3)' : 'none',
        }}>
          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary', fontVariantNumeric: 'tabular-nums', width: 60, flexShrink: 0 }}>
              {row.code}
            </Typography>
            <Typography sx={{ fontSize: 'var(--font-sizes-14)', color: 'text.secondary', lineHeight: 1.4 }}>
              {row.name}
            </Typography>
          </Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <BilledRoleBadge label={row.billedLabel} />
          </Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <AdjustmentSelect value={adjustments[row.id] ?? row.defaultAdjustment} onChange={v => onChange(row.id, v)} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ── Editable diagnosis row (new-entry mode) ───────────────────────────────────

interface EditableDxRow { id: string; code: string; name: string; adjustment: DiagnosisAdjustment }

function EditableDiagnosisRow({ row, onUpdate, onRemove }: {
  row: EditableDxRow
  onUpdate: (id: string, field: 'code' | 'name' | 'adjustment', value: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: '1fr 200px 36px',
      alignItems: 'center',
      borderBottom: '1px solid var(--colors-grey-3)',
    }}>
      <Box sx={{ px: 1.5, py: 0.5 }}>
        <SmarterComboBox
          value={row.code || row.name ? (row.code ? `${row.code}${row.name ? ` – ${row.name}` : ''}` : row.name) : ''}
          onChange={v => {
            const sep = v.indexOf(' – ')
            if (sep > 0) { onUpdate(row.id, 'code', v.slice(0, sep)); onUpdate(row.id, 'name', v.slice(sep + 3)) }
            else { onUpdate(row.id, 'code', v); onUpdate(row.id, 'name', '') }
          }}
          options={ICD10_CODE_OPTIONS}
          placeholder="ICD-10 code or description…"
        />
      </Box>
      <Box sx={{ px: 1.5, py: 0.75 }}>
        <AdjustmentSelect
          value={row.adjustment}
          onChange={v => onUpdate(row.id, 'adjustment', v)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton size="small" onClick={() => onRemove(row.id)} sx={{ p: 0.25, color: 'var(--colors-grey-5)', '&:hover': { color: 'var(--colors-grey-7)' } }}>
          <CloseOutlined sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  )
}

// ── Editable procedure row (new-entry mode) ───────────────────────────────────

interface EditablePxRow { id: string; code: string; name: string; adjustment: DiagnosisAdjustment }

function EditableProcedureRow({ row, onUpdate, onRemove }: {
  row: EditablePxRow
  onUpdate: (id: string, field: 'code' | 'name' | 'adjustment', value: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: '1fr 200px 36px',
      alignItems: 'center',
      borderBottom: '1px solid var(--colors-grey-3)',
    }}>
      <Box sx={{ px: 1.5, py: 0.5 }}>
        <SmarterComboBox
          value={row.code || row.name ? (row.code ? `${row.code}${row.name ? ` – ${row.name}` : ''}` : row.name) : ''}
          onChange={v => {
            const sep = v.indexOf(' – ')
            if (sep > 0) { onUpdate(row.id, 'code', v.slice(0, sep)); onUpdate(row.id, 'name', v.slice(sep + 3)) }
            else { onUpdate(row.id, 'code', v); onUpdate(row.id, 'name', '') }
          }}
          options={PROCEDURE_CODE_OPTIONS}
          placeholder="Procedure code or description…"
        />
      </Box>
      <Box sx={{ px: 1.5, py: 0.75 }}>
        <AdjustmentSelect
          value={row.adjustment}
          onChange={v => onUpdate(row.id, 'adjustment', v)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton size="small" onClick={() => onRemove(row.id)} sx={{ p: 0.25, color: 'var(--colors-grey-5)', '&:hover': { color: 'var(--colors-grey-7)' } }}>
          <CloseOutlined sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  /** When provided, displays pre-filled read-only data with editable adjustments. When absent, shows the new-entry empty state. */
  adjustments?: DrgAdjustments
}

let rowCounter = 0
function nextId() { return `row-${++rowCounter}` }

export default function DrgAdjustmentsSection({ adjustments }: Props) {
  const isNewEntry = !adjustments

  const [drgSystem, setDrgSystem] = useState<'MS-DRG' | 'APR-DRG'>(adjustments?.drgSystem ?? 'MS-DRG')

  // Read-only adjustments state (existing denials)
  const [diagAdjustments, setDiagAdjustments] = useState<Record<string, DiagnosisAdjustment>>({})

  // New-entry state (wizard flow) — DRG fields store "CODE – Description" string
  const [billedDrg, setBilledDrg] = useState('')
  const [payerDrg, setPayerDrg] = useState('')
  const [editableDx, setEditableDx] = useState<EditableDxRow[]>([])
  const [editablePx, setEditablePx] = useState<EditablePxRow[]>([])

  const addDx = () => setEditableDx(prev => [...prev, { id: nextId(), code: '', name: '', adjustment: 'Removed' }])
  const updateDx = (id: string, field: 'code' | 'name' | 'adjustment', value: string) =>
    setEditableDx(prev => prev.map(r => r.id === id ? { ...r, [field]: value as DiagnosisAdjustment } : r))
  const removeDx = (id: string) => setEditableDx(prev => prev.filter(r => r.id !== id))

  const addPx = () => setEditablePx(prev => [...prev, { id: nextId(), code: '', name: '', adjustment: 'Removed' }])
  const updatePx = (id: string, field: 'code' | 'name' | 'adjustment', value: string) =>
    setEditablePx(prev => prev.map(r => r.id === id ? { ...r, [field]: value as DiagnosisAdjustment } : r))
  const removePx = (id: string) => setEditablePx(prev => prev.filter(r => r.id !== id))

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
          {isNewEntry ? (
            <>
              <DrgRowInput label="Billed DRG"    value={billedDrg} onChange={setBilledDrg} />
              <DrgRowInput label="Payer-adjusted" variant="adjusted" value={payerDrg} onChange={setPayerDrg} />
            </>
          ) : (
            <>
              <DrgRowDisplay label="Billed DRG" code={adjustments!.billed.code} description={adjustments!.billed.description} severity={adjustments!.billed.severity} />
              <DrgRowDisplay label="Payer-adjusted" code={adjustments!.payerAdjusted.code} description={adjustments!.payerAdjusted.description} severity={adjustments!.payerAdjusted.severity} variant="adjusted" />
            </>
          )}
        </Box>
      </Box>

      {/* Adjusted Diagnoses */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <Typography sx={SUBSECTION_TITLE_SX}>Adjusted Diagnoses</Typography>
          <Typography sx={{ ...FIELD_LABEL_SX, mt: 0.25 }}>
            {isNewEntry
              ? 'Add the diagnoses the payer adjusted, removed, or changed.'
              : 'Review the payer\'s adjustment for each diagnosis. Use the dropdown to update any row.'}
          </Typography>
        </Box>

        {isNewEntry ? (
          <>
            {editableDx.length > 0 && (
              <Box sx={TABLE_BORDER_SX}>
                <Box sx={{ ...TABLE_HEADER_SX, display: 'grid', gridTemplateColumns: '1fr 200px 36px' }}>
                  {['Diagnosis Code', 'Payer Adjustment', ''].map((h, i) => (
                    <Box key={i} sx={{ px: h ? 1.5 : 0, py: 1 }}>
                      <Typography sx={TABLE_HEADER_CELL_SX}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
                {editableDx.map(row => (
                  <EditableDiagnosisRow key={row.id} row={row} onUpdate={updateDx} onRemove={removeDx} />
                ))}
              </Box>
            )}
            <Button size="small" startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />} onClick={addDx} sx={ADD_BTN_SX}>
              Add Diagnosis Code
            </Button>
          </>
        ) : (
          <>
            <DiagnosesTable rows={adjustments!.diagnoses} adjustments={diagAdjustments} onChange={(id, v) => setDiagAdjustments(p => ({ ...p, [id]: v }))} />
            <Button size="small" startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />} sx={ADD_BTN_SX}>
              Add Diagnosis Code
            </Button>
          </>
        )}
      </Box>

      {/* Adjusted Procedures */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={SUBSECTION_TITLE_SX}>Adjusted Procedures</Typography>

        {isNewEntry ? (
          <>
            {editablePx.length > 0 && (
              <Box sx={TABLE_BORDER_SX}>
                <Box sx={{ ...TABLE_HEADER_SX, display: 'grid', gridTemplateColumns: '1fr 200px 36px' }}>
                  {['Procedure Code', 'Payer Adjustment', ''].map((h, i) => (
                    <Box key={i} sx={{ px: h ? 1.5 : 0, py: 1 }}>
                      <Typography sx={TABLE_HEADER_CELL_SX}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
                {editablePx.map(row => (
                  <EditableProcedureRow key={row.id} row={row} onUpdate={updatePx} onRemove={removePx} />
                ))}
              </Box>
            )}
            <Button size="small" startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />} onClick={addPx} sx={ADD_BTN_SX}>
              Add Procedure
            </Button>
          </>
        ) : (
          <>
            {adjustments!.procedures.length > 0 && (
              <Box sx={TABLE_BORDER_SX}>
                <Box sx={{ ...TABLE_HEADER_SX, display: 'grid', gridTemplateColumns: '1fr 200px' }}>
                  {['Procedure Code', 'Payer Adjustment'].map(h => (
                    <Box key={h} sx={{ px: 1.5, py: 1 }}>
                      <Typography sx={TABLE_HEADER_CELL_SX}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
                {adjustments!.procedures.map((p, i) => (
                  <Box key={p.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 200px', alignItems: 'center', borderBottom: i < adjustments!.procedures.length - 1 ? '1px solid var(--colors-grey-3)' : 'none' }}>
                    <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
                      <Typography sx={{ fontSize: 'var(--font-sizes-14)', fontWeight: 'var(--font-weights-semibold)', color: 'text.primary', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
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
            )}
            <Button size="small" startIcon={<AddOutlined sx={{ fontSize: '16px !important' }} />} sx={ADD_BTN_SX}>
              Add Procedure
            </Button>
          </>
        )}
      </Box>

    </Box>
  )
}

// Re-export for convenience
export { SUBSECTION_TITLE_SX as SECTION_TITLE_SX }
