import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2557D6',      // medium blue — matches SmarterDX interactive elements
      light: '#3B82F6',
      dark: '#1B3A8C',      // dark navy — filled buttons / hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2557D6',
      light: '#3B82F6',
      dark: '#1B3A8C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#B7770D',
    },
    success: {
      main: '#16A34A',
    },
    background: {
      default: '#F4F5F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#4A5568' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem', color: '#4A5568' },
    caption: { fontSize: '0.75rem', color: '#718096' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em' },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #DDE3EC',
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#4A5568',
          backgroundColor: '#F4F6F9',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
        },
      },
    },
  },
})

export default theme
