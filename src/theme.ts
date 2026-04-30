import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#157d9d',
      light: '#e8f2f5',
      dark: '#11647e',
      contrastText: '#ffffff',
    },
    secondary: {
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
    fontFamily: '"Inter", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#636a6f' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem', color: '#636a6f' },
    caption: { fontSize: '0.75rem', color: '#636a6f' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 0 #e2e6e9' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid #e2e6e9', boxShadow: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em', borderRadius: 4 },
        containedPrimary: { backgroundColor: '#157d9d', '&:hover': { backgroundColor: '#11647e' } },
        outlinedPrimary: { borderColor: '#e2e6e9', color: '#636a6f', '&:hover': { borderColor: '#c8cdd1', backgroundColor: '#f1f4f6' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.75rem', borderRadius: 24 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: '#e2e6e9' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em',
          textTransform: 'uppercase', color: '#636a6f', backgroundColor: '#f8fafb',
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#e2e6e9' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, fontSize: '0.8125rem', color: '#636a6f', '&.Mui-selected': { color: '#31373a', fontWeight: 600 } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#157d9d' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e6e9' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c8cdd1' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#157d9d' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8, '&.Mui-selected': { backgroundColor: '#e8f2f5', color: '#157d9d', '& .MuiListItemIcon-root': { color: '#157d9d' }, '&:hover': { backgroundColor: '#dcecf0' } } },
      },
    },
  },
})

export default theme
