// Mirrors: https://frontend.dev.smarterdx.net/storybook/?path=/docs/smarterdx-react-badge--docs
// Variants: default | info | success | warning | error  ·  Styles: subtle (default), emphasized, outline
// Spec tokens: --colors-badge-variant-{variant}-{style}-{background|text|border|icon},
//   --spacing-badge-{padding-x|padding-y|gap}, --radii-badge-radius,
//   --border-widths-badge-border-width, --sizes-badge-icon-size
//
// Typography note: the DS Badge does NOT declare its own font-size or font-weight
// — there are no --font-sizes-badge or --font-weights-badge tokens. Verified by
// inspecting the rendered Storybook story (computed style via Fontanello):
// font-weight is 400 (regular), letter-spacing is normal. Font-size inherits
// from the parent — set it on the caller's container if a specific size is
// needed for the context. Do NOT use medium or semibold — those are heavier
// than the rendered Storybook output.
//
// Display-only per DS — no hover/active interactive states, no dot decoration.
// Accepts an optional icon (mui-icons-material element); rendered at --sizes-badge-icon-size.

import { Box } from '@mui/material'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

export type DsBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error'
export type DsBadgeStyle = 'subtle' | 'emphasized' | 'outline'

interface DsBadgeProps {
  variant?: DsBadgeVariant
  style?: DsBadgeStyle
  icon?: ReactNode
  children: ReactNode
}

function tokens(variant: DsBadgeVariant, style: DsBadgeStyle) {
  // The 'outline' style only exists for the 'default' variant in the DS — fall
  // back to the matching subtle/emphasized tokens for other variants.
  if (style === 'outline') {
    return {
      bg:     'var(--colors-badge-variant-outline-background)',
      text:   'var(--colors-badge-variant-outline-text)',
      border: 'var(--colors-badge-variant-outline-border)',
      icon:   'var(--colors-badge-variant-outline-icon)',
    }
  }
  const suffix = style === 'emphasized' ? 'emphasized' : 'subtle'
  return {
    bg:     `var(--colors-badge-variant-${variant}-${suffix}-background)`,
    text:   `var(--colors-badge-variant-${variant}-${suffix}-text)`,
    border: `var(--colors-badge-variant-${variant}-${suffix}-border)`,
    icon:   `var(--colors-badge-variant-${variant}-${suffix}-icon)`,
  }
}

export default function DsBadge({
  variant = 'default',
  style = 'subtle',
  icon,
  children,
}: DsBadgeProps) {
  const t = tokens(variant, style)

  // Force any provided icon to render at the DS badge icon size, inheriting
  // the badge text color via currentColor.
  const sizedIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ sx?: Record<string, unknown> }>, {
        sx: {
          ...(((icon as ReactElement<{ sx?: Record<string, unknown> }>).props.sx) || {}),
          fontSize: 'var(--sizes-badge-icon-size)',
          color: t.icon,
        },
      })
    : icon

  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center',
      gap: 'var(--spacing-badge-gap)',
      px: 'var(--spacing-badge-padding-x)',
      py: 'var(--spacing-badge-padding-y)',
      borderRadius: 'var(--radii-badge-radius)',
      bgcolor: t.bg, color: t.text,
      border: 'var(--border-widths-badge-border-width) solid',
      borderColor: t.border,
      fontSize: 'var(--font-sizes-12)',
      fontWeight: 'var(--font-weights-regular)',
      lineHeight: 1.25, whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      flexShrink: 0,
    }}>
      {sizedIcon}
      {children}
    </Box>
  )
}
