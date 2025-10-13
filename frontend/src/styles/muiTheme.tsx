'use client';

import * as React from 'react';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider as MuiThemeProvider
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PropsWithChildren } from 'react';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7b39e8' }, // brand purple
    secondary: { main: '#2d69ea' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    background: { default: '#ffffff', paper: '#f7f7fb' }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'var(--color-background, #ffffff)',
          color: 'var(--color-foreground, #0a0a0f)'
        }
      }
    },
    MuiButton: {
      defaultProps: { variant: 'contained', color: 'primary' },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          boxShadow: '0 6px 18px rgba(123,57,232,0.15)',
          ':hover': { boxShadow: '0 8px 22px rgba(123,57,232,0.25)' }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(10,10,15,0.10)',
          boxShadow:
            '0 2px 4px rgba(10,10,15,0.05), 0 10px 20px rgba(10,10,15,0.08)'
        }
      }
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } }
  }
});

export function PrimaryThemeProvider({ children }: PropsWithChildren) {
  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={appTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
}
