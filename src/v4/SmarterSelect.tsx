import { useState, useRef } from 'react'
import { Box, Popover, Typography } from '@mui/material'
import { KeyboardArrowDown, Check } from '@mui/icons-material'

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}

export default function SmarterSelect({ value, onChange, options, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [focused, setFocused] = useState(false)

  const isPlaceholder = !value
  const displayText = value || placeholder || 'Select…'

  return (
    <>
      <Box
        component="button"
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        sx={{
          width: '100%',
          height: 32,
          px: 1.25,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 1,
          bgcolor: 'var(--colors-select-trigger-background)',
          color: isPlaceholder
            ? 'var(--colors-select-trigger-placeholder)'
            : 'var(--colors-select-trigger-text)',
          border: '1px solid',
          borderColor: focused || open
            ? 'var(--colors-select-trigger-focus-border)'
            : 'var(--colors-select-trigger-border)',
          borderRadius: 'var(--radii-select-trigger-radius)',
          fontSize: 'var(--font-sizes-14)',
          fontFamily: 'inherit',
          fontWeight: 'var(--font-weights-regular)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          boxShadow: (focused || open) ? '0 0 0 2px var(--colors-select-trigger-focus-ring-color)' : 'none',
          transition: 'border-color 120ms, box-shadow 120ms',
          '&:hover': !disabled && !open ? {
            borderColor: 'var(--colors-grey-6)',
          } : undefined,
        }}
      >
        <Box component="span" sx={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {displayText}
        </Box>
        <KeyboardArrowDown sx={{
          fontSize: 18,
          color: 'var(--colors-select-trigger-icon-color)',
          flexShrink: 0,
          transition: 'transform 120ms',
          transform: open ? 'rotate(180deg)' : 'none',
        }} />
      </Box>

      <Popover
        open={open}
        anchorEl={triggerRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: triggerRef.current?.offsetWidth ?? 0,
              bgcolor: 'var(--colors-select-content-background)',
              border: '1px solid var(--colors-select-content-border-color)',
              borderRadius: 'var(--radii-select-content-radius)',
              boxShadow: 'var(--shadows-low)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ py: 0.5, maxHeight: 320, overflow: 'auto' }}>
          {options.map(o => {
            const selected = o === value
            return (
              <Box
                key={o}
                onClick={() => { onChange(o); setOpen(false) }}
                sx={{
                  mx: 0.5,
                  px: 1.25, py: 0.75,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 1.5,
                  cursor: 'pointer',
                  borderRadius: 'var(--radii-select-item-radius)',
                  fontSize: 'var(--font-sizes-14)',
                  color: selected
                    ? 'var(--colors-select-item-selected-text)'
                    : 'var(--colors-select-item-text)',
                  fontWeight: selected ? 'var(--font-weights-medium)' : 'var(--font-weights-regular)',
                  '&:hover': {
                    bgcolor: 'var(--colors-interactive-menu-item-background-hover, var(--colors-grey-2))',
                  },
                }}
              >
                <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
                  {o}
                </Typography>
                {selected && (
                  <Check sx={{ fontSize: 16, color: 'var(--colors-select-item-selected-indicator-color)', flexShrink: 0 }} />
                )}
              </Box>
            )
          })}
        </Box>
      </Popover>
    </>
  )
}
