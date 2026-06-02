// V3 — Source data sheet. Right-side overlay drawer surfacing the extracted
// denial source (source file + parsed fields). Mirrors V3CommentsSheet's
// interaction model so the kebab → drawer relationship reads the same as
// the header → comments relationship. All visuals use SmarterDx design tokens.

import { Box, Typography, IconButton, ButtonBase, Tooltip } from '@mui/material'
import { useEffect } from 'react'
import { X, FileText, ExternalLink } from 'lucide-react'

export interface SourceField {
  label: string
  value: string
  /** Render the value with tabular-nums (identifiers, IDs, dates). */
  tabular?: boolean
}

export interface SourceSheetData {
  /** File name shown in the source-file row. */
  fileName: string | null
  /** Top-level extracted fields (HAR, claim, DOS, amounts). */
  extracted: SourceField[]
  /** Extracted patient identity fields (name, DOB). */
  patient: SourceField[]
}

interface V3SourceSheetProps {
  open: boolean
  onClose: () => void
  data: SourceSheetData
  /** Optional pagination chrome — matches the V4 source panel's "1 of N". */
  pagination?: { current: number; total: number; onPrev?: () => void; onNext?: () => void }
}

const LABEL_SX = {
  fontSize: 'var(--font-sizes-10)',
  fontWeight: 'var(--font-weights-semibold)',
  color: 'var(--colors-text-tertiary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  lineHeight: 1,
  mb: 'var(--spacing-2)',
}

export default function V3SourceSheet({ open, onClose, data }: V3SourceSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Scrim — scoped to the case workspace */}
      <Box
        onClick={onClose}
        sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          bgcolor: 'color-mix(in oklch, var(--colors-modal-overlay-background) 25%, transparent)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease',
        }}
      />

      {/* Sheet */}
      <Box
        role="dialog"
        aria-label="Source data"
        aria-hidden={!open}
        sx={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 100%)', zIndex: 11,
          bgcolor: 'var(--colors-grey-1)',
          borderLeft: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          boxShadow: 'var(--shadows-medium)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{
          flexShrink: 0,
          px: 'var(--spacing-4)',
          pt: 'var(--spacing-3)',
          pb: 'var(--spacing-3)',
          borderBottom: 'var(--border-widths-thin) solid var(--colors-grey-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-16)',
            fontWeight: 'var(--font-weights-semibold)',
            color: 'var(--colors-text-primary)',
          }}>
            Source Data
          </Typography>
          <Tooltip title="Close (Esc)">
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                width: 28, height: 28,
                borderRadius: 'var(--radii-sm)',
                color: 'var(--colors-interactive-ghost-text)',
                '&:hover': {
                  bgcolor: 'var(--colors-interactive-hover-ghost-background)',
                  color: 'var(--colors-interactive-hover-ghost-text)',
                },
                '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)' },
              }}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Body */}
        <Box sx={{
          flex: 1, overflowY: 'auto',
          px: 'var(--spacing-4)', py: 'var(--spacing-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)',
        }}>

          {/* Source File */}
          {data.fileName && (
            <Box>
              <Typography sx={LABEL_SX}>Source File</Typography>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
                px: 'var(--spacing-3)', py: 'var(--spacing-2)',
                bgcolor: 'var(--colors-grey-2)',
                border: 'var(--border-widths-thin) solid var(--colors-grey-3)',
                borderRadius: 'var(--radii-sm)',
              }}>
                <Box component="span" sx={{ display: 'inline-flex', color: 'var(--colors-ocean-4)', flexShrink: 0 }}>
                  <FileText size={18} strokeWidth={2} />
                </Box>
                <Typography sx={{
                  fontSize: 'var(--font-sizes-12)',
                  color: 'var(--colors-text-secondary)',
                  flex: 1, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {data.fileName}
                </Typography>
                <ButtonBase
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)',
                    fontSize: 'var(--font-sizes-12)',
                    fontWeight: 'var(--font-weights-semibold)',
                    color: 'var(--colors-ocean-4)',
                    flexShrink: 0,
                    '&:hover': { opacity: 0.75 },
                    '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadows-interactive-focus-focus-ring)', borderRadius: 'var(--radii-sm)' },
                  }}
                >
                  View
                  <ExternalLink size={12} strokeWidth={2} />
                </ButtonBase>
              </Box>
            </Box>
          )}

          {/* Extracted Data */}
          {data.extracted.length > 0 && (
            <Box>
              <Typography sx={LABEL_SX}>Extracted Data</Typography>
              <FieldList fields={data.extracted} />
            </Box>
          )}

          {/* Extracted Patient */}
          {data.patient.length > 0 && (
            <Box>
              <Typography sx={LABEL_SX}>Extracted Patient</Typography>
              <FieldList fields={data.patient} />
            </Box>
          )}
        </Box>
      </Box>
    </>
  )
}

function FieldList({ fields }: { fields: SourceField[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {fields.map((f, i) => (
        <Box key={f.label} sx={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 'var(--spacing-2)',
          py: 'var(--spacing-2)',
          borderBottom: i === fields.length - 1
            ? 'none'
            : 'var(--border-widths-thin) solid var(--colors-grey-3)',
        }}>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-secondary)',
            flexShrink: 0, minWidth: 110,
          }}>
            {f.label}
          </Typography>
          <Typography sx={{
            fontSize: 'var(--font-sizes-12)',
            color: 'var(--colors-text-primary)',
            fontWeight: 'var(--font-weights-medium)',
            fontVariantNumeric: f.tabular ? 'tabular-nums' : undefined,
            textAlign: 'right',
          }}>
            {f.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
