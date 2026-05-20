import { createTheme } from '@mui/material/styles'

// Palette values stay as hex — MUI uses these for internal color math (lighten/darken/alpha).
// These hex values are the resolved equivalents of the design system's oklch tokens.
// styleOverrides reference CSS variables directly so they update when you run `npm run sync-ds`.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      // --colors-ocean-4 / --colors-ocean-5 / --colors-ocean-1 / --colors-ocean-6
      main: '#157d9d',
      light: '#e8f2f5',
      dark: '#11647e',
      contrastText: '#ffffff',
    },
    secondary: {
      // --colors-teal-4
      main: '#00adb5',
      light: '#e6f7f8',
      dark: '#008288',
      contrastText: '#ffffff',
    },
    error:   { main: '#d44a52', light: '#fbedee', dark: '#9f383e', contrastText: '#ffffff' },
    warning: { main: '#f58a2e', light: '#fef3ea', dark: '#b86823', contrastText: '#ffffff' },
    success: { main: '#2da390', light: '#eaf6f4', dark: '#227a6c', contrastText: '#ffffff' },
    info:    { main: '#349dd6', light: '#ebf5fb', dark: '#2776a1', contrastText: '#ffffff' },
    background: { default: '#f1f4f6', paper: '#ffffff' },
    text: { primary: '#31373a', secondary: '#636a6f', disabled: '#939a9f' },
    divider: '#e2e6e9',
  },
  typography: {
    fontFamily: 'Inter, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: 'var(--colors-text-secondary)' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem', color: 'var(--colors-text-secondary)' },
    caption: { fontSize: '0.75rem', color: 'var(--colors-text-secondary)' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 0 var(--colors-grey-4)' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'var(--border-widths-thin) solid var(--colors-grey-4)',
          boxShadow: 'none',
          backgroundColor: 'var(--colors-grey-2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'var(--font-weights-semibold)' as unknown as number,
          textTransform: 'none',
          letterSpacing: '0.01em',
          borderRadius: 'var(--radii-sm)',
        },
        containedPrimary: {
          backgroundColor: 'var(--colors-interactive-action-background)',
          color: 'var(--colors-interactive-action-text)',
          '&:hover': { backgroundColor: 'var(--colors-interactive-hover-action-background)' },
          '&:active': { backgroundColor: 'var(--colors-interactive-active-action-background)' },
        },
        outlinedPrimary: {
          borderColor: 'var(--colors-interactive-default-border)',
          color: 'var(--colors-interactive-default-text)',
          '&:hover': {
            borderColor: 'var(--colors-interactive-hover-default-border)',
            backgroundColor: 'var(--colors-interactive-hover-default-background)',
          },
        },
        textPrimary: {
          color: 'var(--colors-interactive-ghost-text)',
          '&:hover': {
            color: 'var(--colors-interactive-hover-ghost-text)',
            backgroundColor: 'var(--colors-interactive-hover-ghost-background)',
          },
          '&:active': {
            color: 'var(--colors-interactive-active-ghost-text)',
            backgroundColor: 'var(--colors-interactive-active-ghost-background)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 'var(--font-weights-regular)' as unknown as number,
          fontSize: 'var(--font-sizes-12)',
          borderRadius: 'var(--radii-full)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: 'var(--colors-grey-4)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'var(--font-weights-medium)' as unknown as number,
          fontSize: 'var(--font-sizes-table-header-font-size)',
          color: 'var(--colors-table-header-text)',
          backgroundColor: 'var(--colors-table-header-background)',
          borderBottom: '1px solid var(--colors-table-header-border)',
        },
        body: {
          fontSize: 'var(--font-sizes-table-cell-font-size)',
          color: 'var(--colors-text-primary)',
          borderBottom: '1px solid var(--colors-table-row-border)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--colors-table-row-background)',
          '&:hover': {
            backgroundColor: 'var(--colors-table-row-hover-background)',
          },
        },
        head: {
          backgroundColor: 'var(--colors-table-header-background)',
          '&:hover': {
            backgroundColor: 'var(--colors-table-header-background)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'var(--colors-grey-4)' } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'var(--font-weights-medium)' as unknown as number,
          fontSize: 'var(--font-sizes-14)',
          color: 'var(--colors-text-secondary)',
          '&.Mui-selected': {
            color: 'var(--colors-text-primary)',
            fontWeight: 'var(--font-weights-semibold)' as unknown as number,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: 'var(--colors-interactive-action-background)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // sm input size = rounded: "sm" = 4px per design system InputLayout spec
          borderRadius: 'var(--radii-sm)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--colors-interactive-default-border)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--colors-grey-5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--colors-interactive-focus-input-border)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radii-md)',
          '&.Mui-selected': {
            backgroundColor: 'var(--colors-ocean-1)',
            color: 'var(--colors-interactive-action-background)',
            '& .MuiListItemIcon-root': {
              color: 'var(--colors-interactive-action-background)',
            },
            '&:hover': { backgroundColor: 'var(--colors-ocean-2)' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--colors-card-background)',
          borderColor: 'var(--colors-card-border-color)',
          boxShadow: 'var(--shadows-card-shadow)',
        },
      },
    },
  },
})

export default theme
