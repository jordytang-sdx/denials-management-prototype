---
title: Design System Tokens & UI Color Conventions
type: decision
last_reviewed: 2026-05-05
when_to_revisit: When new module/status types are added, or when smarterdx-react package becomes installable via private registry
---

# Design System Tokens & UI Color Conventions

The prototype's visual language is live-synced from the SmarterDX Storybook at `https://frontend.dev.smarterdx.net/storybook/`. Run `npm run sync-ds` to pull the latest token CSS from Storybook into `src/design-system-tokens.css`. This file is auto-generated — edit the source via Storybook, not by hand.

All UI work should use CSS variables (e.g. `var(--colors-ocean-4)`) rather than hardcoded hex strings. The MUI theme palette keeps hex equivalents for MUI's internal color math; `styleOverrides` use CSS variables.

## Token System

The design system uses Panda CSS with CSS custom properties. Full token reference in `src/design-system-tokens.css`.

Key namespaces:
- `--colors-{scale}-{step}` — primitive colors (grey, ocean, green, red, orange, blue, amber)
- `--colors-text-{role}` — semantic text (primary, secondary, disabled, error, etc.)
- `--colors-interactive-{state}-{variant}-{part}` — button/input states
- `--colors-badge-variant-{type}-{part}` — badge component tokens
- `--colors-card-*` — card component tokens
- `--spacing-{n}` — spacing scale (1=4px, 2=8px, 3=12px, 4=16px…)
- `--radii-{size}` — sm=4px, md=8px, lg=12px, full=9999px, pill=24px
- `--shadows-{level}` — low, medium, high
- `--font-sizes-{n}` — 10/12/14/16/18/20/24/32/40px
- `--font-weights-{name}` — regular=400, medium=500, semibold=600, bold=700

## Component Library

The Storybook (`smarterdx-react`) exposes: AppLayout, AppBar, AppNav, AppHeader, AppContent, AppFooter, AppBanner, Button, ButtonLink, IconButton, Badge, Card, NavTabList, Field, Input, Checkbox, CheckboxGroup, Radio, RadioGroup, SearchField, FilterBar, Menu, Dialog. The package is private — ask the frontend platform team for registry access. When available, these can replace the MUI equivalents.

---

## Color Token Reference (oklch → hex)

### Ocean scale — primary interactive color
| Token     | Hex       | Use                              |
|-----------|-----------|----------------------------------|
| ocean-1   | `#e8f2f5` | Selected nav bg, chip backgrounds |
| ocean-2   | `#dcecf0` | Hover states                     |
| ocean-3   | `#b6d7e1` | Borders on ocean-tinted elements |
| ocean-4   | `#157d9d` | **Primary** — buttons, links, focus rings |
| ocean-5   | `#13718d` | Hover on primary                 |
| ocean-6   | `#11647e` | Active / dark primary            |

### Teal scale — brand logo only
| Token  | Hex       | Use                        |
|--------|-----------|----------------------------|
| teal-4 | `#00adb5` | Logo/brand mark only — do not use for interactive elements |

### Grey scale — neutral
| Token   | Hex       | Use                          |
|---------|-----------|------------------------------|
| grey-1  | `#ffffff` | Paper / card backgrounds     |
| grey-2  | `#f8fafb` | Sidebar background           |
| grey-3  | `#f1f4f6` | Page background              |
| grey-4  | `#e2e6e9` | Dividers, default borders    |
| grey-5  | `#c8cdd1` | Hover borders                |
| grey-6  | `#939a9f` | Disabled text                |
| grey-7  | `#636a6f` | Secondary text               |
| grey-8  | `#4a5154` | Medium-emphasis text         |
| grey-9  | `#31373a` | Primary text                 |
| grey-10 | `#1a1e20` | High-contrast text           |

### Semantic scales
| Token      | Hex       | Use                   |
|------------|-----------|------------------------|
| green-1    | `#eaf6f4` | Success chip bg        |
| green-4    | `#2da390` | Success main           |
| green-7    | `#227a6c` | Success dark / text    |
| red-1      | `#fbedee` | Error chip bg          |
| red-4      | `#d44a52` | Error main             |
| red-7      | `#9f383e` | Error dark / text      |
| orange-1   | `#fef3ea` | Warning chip bg        |
| orange-4   | `#f58a2e` | Warning main           |
| orange-7   | `#b86823` | Warning dark / text    |
| blue-1     | `#ebf5fb` | Info chip bg           |
| blue-4     | `#349dd6` | Info main              |
| blue-7     | `#2776a1` | Info dark / text       |

---

## Badge / Chip Pattern

The DS uses an **outlined badge** style: light-tinted background + colored border + colored text. No solid fills on status chips.

```
Default/Open:   bgcolor: '#ffffff',  color: '#636a6f', border: '1px solid #e2e6e9'
New (unworked): bgcolor: '#e8f2f5', color: '#157d9d', border: '1px solid #b6d7e1'
Warning/Action: bgcolor: '#fef3ea', color: '#b86823', border: '1px solid #b86823'
Error/Denied:   bgcolor: '#fbedee', color: '#9f383e', border: '1px solid #9f383e'
Success/Won:    bgcolor: '#eaf6f4', color: '#227a6c', border: '1px solid #227a6c'
Info/Submitted: bgcolor: '#ebf5fb', color: '#2776a1', border: '1px solid #2776a1'
Neutral/Grey:   bgcolor: '#f1f4f6', color: '#636a6f', border: '1px solid #e2e6e9'
```

---

## Module Color Assignments

Each module has a distinct accent color used for worklist row highlights, dashboard module cards, and ingest type indicators:

| Module        | Color  | Hex (main) | Rationale                                     |
|---------------|--------|------------|-----------------------------------------------|
| Denials       | Orange | `#f58a2e`  | Warning-adjacent — denials require action     |
| Underpayments | Ocean  | `#157d9d`  | Primary blue — financial/analytical work      |
| Audits        | Blue   | `#349dd6`  | Info blue — compliance/review oriented        |

---

## Typography

- Font: **Inter** (system fallback: `system-ui, "Segoe UI", Roboto, Helvetica, Arial`)
- Base spacing unit: **4px**
- Border radius: buttons=4px (all sizes per Figma Component Lab), cards/surfaces=8px, modals/popovers=8px, pill=24px

---

## Sidebar & Navigation

- Sidebar background: `#f8fafb` (grey-2)
- Selected nav item: `bgcolor: '#e8f2f5'` (ocean-1), `color: '#157d9d'` (ocean-4)
- Hover nav item: `rgba(21,125,157,0.06)` (ocean-tinted hover)
- Active hover: `bgcolor: '#dcecf0'` (ocean-2)

---

## MUI Theme File

All tokens are applied in `src/theme.ts`. When adding new MUI component overrides, use `var(--colors-*)` CSS variables in `styleOverrides` and the existing palette values for anything requiring a JavaScript color value. Never hardcode hex strings.
