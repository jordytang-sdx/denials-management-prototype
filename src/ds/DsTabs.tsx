// Mirrors: https://frontend.dev.smarterdx.net/storybook/?path=/docs/smarterdx-react-tabs--docs
// Variants: underline (default)  ·  Sizes: sm | md
// Spec tokens: --sizes-tab-indicator-height, --sizes-tab-size-{sm|md}-height,
//   --spacing-tab-size-{sm|md}-{padding-x|gap}, --font-sizes-tab-size-{sm|md}-font-size,
//   --font-weights-tab-{default|selected}-font-weight, --sizes-tab-size-{sm|md}-icon-size,
//   --border-widths-tab-list-border-width, --colors-tab-list-border-color,
//   --colors-interactive-{default|hover|focus|active}-tab-{active-}*

import { Box, ButtonBase } from '@mui/material'
import type { ReactNode } from 'react'

export interface DsTabItem<TId extends string = string> {
  id: TId
  label: string
  icon?: ReactNode
}

interface DsTabsProps<TId extends string = string> {
  tabs: DsTabItem<TId>[]
  activeId: TId
  onChange: (id: TId) => void
  size?: 'sm' | 'md'
  // Padding on the list itself (matches the page's gutter for the main tabs;
  // 0 for in-panel rail toggles).
  paddingX?: string | number
}

export default function DsTabs<TId extends string = string>({
  tabs, activeId, onChange, size = 'md', paddingX = 0,
}: DsTabsProps<TId>) {
  const fontSizeToken      = size === 'sm' ? 'var(--font-sizes-tab-size-sm-font-size)' : 'var(--font-sizes-tab-size-md-font-size)'
  const heightToken        = size === 'sm' ? 'var(--sizes-tab-size-sm-height)'         : 'var(--sizes-tab-size-md-height)'
  const padXToken          = size === 'sm' ? 'var(--spacing-tab-size-sm-padding-x)'    : 'var(--spacing-tab-size-md-padding-x)'
  const gapToken           = size === 'sm' ? 'var(--spacing-tab-size-sm-gap)'          : 'var(--spacing-tab-size-md-gap)'
  const iconSizeToken      = size === 'sm' ? 'var(--sizes-tab-size-sm-icon-size)'      : 'var(--sizes-tab-size-md-icon-size)'

  return (
    <Box
      role="tablist"
      sx={{
        display: 'flex', alignItems: 'stretch',
        gap: 'var(--spacing-tab-list-gap)',
        px: paddingX,
        bgcolor: 'var(--colors-tab-list-background)',
        borderBottom: 'var(--border-widths-tab-list-border-width) solid var(--colors-tab-list-border-color)',
      }}
    >
      {tabs.map(t => {
        const active = activeId === t.id
        return (
          <ButtonBase
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: gapToken,
              height: heightToken,
              px: padXToken,
              fontSize: fontSizeToken,
              fontWeight: active
                ? 'var(--font-weights-tab-selected-font-weight)'
                : 'var(--font-weights-tab-default-font-weight)',
              color: active
                ? 'var(--colors-interactive-tab-active-text)'
                : 'var(--colors-interactive-tab-text)',
              bgcolor: active
                ? 'var(--colors-interactive-tab-active-background)'
                : 'var(--colors-interactive-tab-background)',
              // Indicator (2px) lives on the bottom border. Negative margin pulls
              // it over the tablist's baseline border so the active indicator
              // visually overlaps and replaces it.
              borderBottom: 'var(--sizes-tab-indicator-height) solid',
              borderBottomColor: active
                ? 'var(--colors-interactive-tab-active-indicator)'
                : 'var(--colors-interactive-tab-indicator)',
              marginBottom: 'calc(-1 * var(--border-widths-tab-list-border-width))',
              transition: 'color 160ms ease, border-color 160ms ease, background-color 160ms ease',
              '&:hover': {
                color: active
                  ? 'var(--colors-interactive-hover-tab-active-text)'
                  : 'var(--colors-interactive-hover-tab-text)',
                bgcolor: active
                  ? 'var(--colors-interactive-hover-tab-active-background)'
                  : 'var(--colors-interactive-hover-tab-background)',
                borderBottomColor: active
                  ? 'var(--colors-interactive-hover-tab-active-indicator)'
                  : 'var(--colors-interactive-hover-tab-indicator)',
              },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: 'var(--shadows-interactive-focus-focus-ring)',
              },
              '& svg': { fontSize: iconSizeToken },
            }}
          >
            {t.icon}
            {t.label}
          </ButtonBase>
        )
      })}
    </Box>
  )
}
