import { Box, Typography } from '@mui/material'

interface RadioOption {
  value: string
  label: string
  children?: React.ReactNode
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  direction?: 'row' | 'column'
  rowGap?: number | string
  columnGap?: number | string
}

function RadioItem({
  optValue, checked, label, onChange, children,
}: {
  optValue: string
  checked: boolean
  label: string
  onChange: (v: string) => void
  children?: React.ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Box
        component="label"
        sx={{
          display: 'inline-flex', alignItems: 'center',
          gap: '4px', // --spacing-radio-gap
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Hidden native input for a11y */}
        <Box
          component="input"
          type="radio"
          checked={checked}
          onChange={() => onChange(optValue)}
          sx={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />

        {/* Custom radio circle */}
        <Box sx={{
          width: 16, height: 16, // --sizes-radio-size
          borderRadius: '50%', // --radii-radio-radius
          flexShrink: 0,
          border: '1px solid',
          borderColor: checked
            ? 'var(--colors-radio-selected-border)'   // ocean-6
            : 'var(--colors-radio-unselected-border)', // ocean-4
          bgcolor: checked
            ? 'var(--colors-radio-selected-background)'   // grey-3
            : 'var(--colors-radio-unselected-background)', // grey-1
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 100ms, background-color 100ms',
        }}>
          {checked && (
            <Box sx={{
              width: 8, height: 8, // --sizes-radio-indicator-size
              borderRadius: '50%',
              bgcolor: 'var(--colors-radio-selected-indicator)', // ocean-6
            }} />
          )}
        </Box>

        <Typography sx={{
          fontSize: 'var(--font-sizes-radio-font-size)', // 12px
          lineHeight: 1,
          color: 'text.primary',
        }}>
          {label}
        </Typography>
      </Box>

      {/* Slot for sub-content (e.g. review type sub-radios) */}
      {checked && children && (
        <Box sx={{ ml: '20px' }}>
          {children}
        </Box>
      )}
    </Box>
  )
}

export default function SmarterRadioGroup({
  value, onChange, options,
  direction = 'column',
  rowGap = 2,
  columnGap = '20px',
}: Props) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: direction,
      ...(direction === 'row'
        ? { flexWrap: 'wrap', gap: columnGap }
        : { gap: rowGap }),
    }}>
      {options.map(o => (
        <RadioItem
          key={o.value}
          optValue={o.value}
          checked={value === o.value}
          label={o.label}
          onChange={onChange}
        >
          {o.children}
        </RadioItem>
      ))}
    </Box>
  )
}
