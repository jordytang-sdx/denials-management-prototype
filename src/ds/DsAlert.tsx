// Mirrors: https://frontend.dev.smarterdx.net/storybook/?path=/docs/smarterdx-react-alert--docs
// Variants: default | info | success | warning | error (each with optional subtle/emphasized)
// Sizes: sm (12/14 type, 16px icon, 12px padding) · md (14/16 type, 20px icon, 16px padding)
// Spec tokens:
//   --colors-alert-variant-{variant}-{background|text|border|icon}
//   --colors-alert-variant-{variant}-{subtle|emphasized}-{background|text|border|icon}
//   --radii-alert-radius, --border-widths-alert-border-width
//   --spacing-alert-size-sm-padding-x, --spacing-alert-size-sm-padding-y
//   --spacing-alert-size-sm-gap, --spacing-alert-size-sm-body-gap
//   --spacing-alert-size-sm-actions-gap, --sizes-alert-size-sm-icon-size
//   (md tokens parallel, suffix size-md)
//
// Implementation parity notes vs @smarterdx/react Alert.tsx:
//   - Default variant icons match the upstream component (Info / CheckCircle2 /
//     AlertTriangle / AlertOctagon) via lucide-react.
//   - Title and description colors INHERIT the root's text color (per upstream).
//   - Icon cell gets a +2px top margin when a title is present so the icon
//     visually aligns to the title baseline rather than to title+description.

import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react'

export type DsAlertVariant =
  | 'default' | 'defaultSubtle' | 'defaultEmphasized'
  | 'info'    | 'infoSubtle'    | 'infoEmphasized'
  | 'success' | 'successSubtle' | 'successEmphasized'
  | 'warning' | 'warningSubtle' | 'warningEmphasized'
  | 'error'   | 'errorSubtle'   | 'errorEmphasized'

export type DsAlertSize = 'sm' | 'md'
export type DsAlertWidth = 'auto' | 'full'

export interface DsAlertProps {
  variant?: DsAlertVariant
  size?: DsAlertSize
  width?: DsAlertWidth
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  onDismiss?: () => void
  className?: string
}

// variant → token slug used in `--colors-alert-variant-<slug>-...`
function variantSlug(v: DsAlertVariant): string {
  switch (v) {
    case 'defaultSubtle':    return 'default-subtle'
    case 'defaultEmphasized':return 'default-emphasized'
    case 'infoSubtle':       return 'info-subtle'
    case 'infoEmphasized':   return 'info-emphasized'
    case 'successSubtle':    return 'success-subtle'
    case 'successEmphasized':return 'success-emphasized'
    case 'warningSubtle':    return 'warning-subtle'
    case 'warningEmphasized':return 'warning-emphasized'
    case 'errorSubtle':      return 'error-subtle'
    case 'errorEmphasized':  return 'error-emphasized'
    default: return v
  }
}

// variant → the variant FAMILY (no emphasis suffix). Drives default-icon choice.
function variantFamily(v: DsAlertVariant): 'default' | 'info' | 'success' | 'warning' | 'error' {
  if (v.startsWith('info'))    return 'info'
  if (v.startsWith('success')) return 'success'
  if (v.startsWith('warning')) return 'warning'
  if (v.startsWith('error'))   return 'error'
  return 'default'
}

function defaultIconFor(family: ReturnType<typeof variantFamily>, iconPx: number) {
  const props = { 'aria-hidden': true, focusable: false, size: iconPx, strokeWidth: 2 } as const
  switch (family) {
    case 'success': return <CheckCircle2 {...props} />
    case 'warning': return <AlertTriangle {...props} />
    case 'error':   return <AlertOctagon {...props} />
    case 'info':
    default:        return <Info {...props} />
  }
}

export default function DsAlert({
  variant = 'default',
  size = 'sm',
  width = 'auto',
  title,
  description,
  children,
  icon,
  actions,
  onDismiss,
  className,
}: DsAlertProps) {
  const slug = variantSlug(variant)
  const family = variantFamily(variant)
  const iconPx = size === 'md' ? 20 : 16
  const hasDismiss = onDismiss !== undefined
  const hasIconColumn = true

  // Grid: icon | body | (dismiss)?
  const gridTemplateColumns = hasDismiss
    ? (hasIconColumn ? 'auto 1fr auto' : '1fr auto')
    : (hasIconColumn ? 'auto 1fr' : '1fr')

  const c = (slot: 'bg' | 'text' | 'border' | 'icon') =>
    `var(--colors-alert-variant-${slug}-${slot === 'bg' ? 'background' : slot})`

  const sizeToken = (slot: 'padding-x' | 'padding-y' | 'gap' | 'body-gap' | 'actions-gap' | 'icon-size') =>
    `var(--${slot === 'icon-size' ? 'sizes' : 'spacing'}-alert-size-${size}-${slot})`

  return (
    <Box
      role="alert"
      data-comp="Alert"
      data-testid="Alert"
      className={className}
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'start',
        width: width === 'full' ? '100%' : 'auto',
        boxSizing: 'border-box',
        bgcolor: c('bg'),
        color: c('text'),
        border: `var(--border-widths-alert-border-width) solid ${c('border')}`,
        borderRadius: 'var(--radii-alert-radius)',
        px: sizeToken('padding-x'),
        py: sizeToken('padding-y'),
        columnGap: sizeToken('gap'),
      }}
    >
      {hasIconColumn && (
        <Box component="span" sx={{
          gridColumn: '1',
          gridRow: '1',
          alignSelf: 'start',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizeToken('icon-size'),
          height: sizeToken('icon-size'),
          color: c('icon'),
          // Align icon to title baseline when title is present.
          mt: title ? '2px' : 0,
          '& svg': { display: 'block' },
        }}>
          {icon ?? defaultIconFor(family, iconPx)}
        </Box>
      )}

      <Box sx={{
        gridColumn: hasIconColumn ? '2' : '1',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        rowGap: sizeToken('body-gap'),
      }}>
        {title && (
          <Box component="p" sx={{
            m: 0,
            color: 'inherit',
            fontSize: 'var(--font-sizes-12)',
            fontWeight: 'var(--font-weights-semibold)',
            lineHeight: 1.35,
          }}>
            {title}
          </Box>
        )}
        {description && (
          <Box component="p" sx={{
            m: 0,
            color: 'inherit',
            fontSize: 'var(--font-sizes-12)',
            lineHeight: 1.45,
          }}>
            {description}
          </Box>
        )}
        {children && (
          <Box sx={{ m: 0, color: 'inherit', minWidth: 0 }}>{children}</Box>
        )}
        {actions && (
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            columnGap: sizeToken('actions-gap'),
            rowGap: sizeToken('actions-gap'),
            mt: sizeToken('gap'),
          }}>
            {actions}
          </Box>
        )}
      </Box>

      {hasDismiss && (
        <Box component="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          sx={{
            all: 'unset',
            gridColumn: hasIconColumn ? '3' : '2',
            gridRow: '1',
            alignSelf: 'start',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24, height: 24,
            borderRadius: 'var(--radii-sm)',
            color: 'inherit',
            cursor: 'pointer',
            '&:hover':  { bgcolor: 'var(--colors-interactive-hover-ghost-background)' },
            '&:focus-visible': { boxShadow: 'var(--shadows-interactive-focus-focus-ring)', outline: 'none' },
          }}
        >
          <X size={size === 'md' ? 18 : 16} strokeWidth={2} aria-hidden focusable={false} />
        </Box>
      )}
    </Box>
  )
}
