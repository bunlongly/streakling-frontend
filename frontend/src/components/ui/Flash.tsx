'use client';

import * as React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  IconButton,
  type AlertColor
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export type FlashKind = AlertColor; // 'success' | 'error' | 'info' | 'warning'

type Props = {
  open: boolean;
  kind: FlashKind;
  title?: string;
  message: string | null;
  onClose: () => void;
  autoHideMs?: number;
  anchor?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
};

function TransitionSlide(props: any) {
  return <Slide {...props} direction='up' />;
}

export default function Flash({
  open,
  kind,
  title,
  message,
  onClose,
  autoHideMs = 4000,
  anchor = { vertical: 'bottom', horizontal: 'right' }
}: Props) {
  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideMs}
      anchorOrigin={anchor}
      TransitionComponent={TransitionSlide}
    >
      <Alert
        elevation={0}
        variant='filled'
        severity={kind}
        onClose={onClose}
        iconMapping={{
          success: <span>✅</span>,
          error: <span>⚠️</span>,
          info: <span>💡</span>,
          warning: <span>🟨</span>
        }}
        action={
          <IconButton
            aria-label='close'
            size='small'
            onClick={onClose}
            sx={{ color: 'inherit' }}
          >
            <CloseRoundedIcon fontSize='small' />
          </IconButton>
        }
        sx={{
          borderRadius: 2,
          color: 'common.white',
          // soft glossy background that adapts to severity
          background:
            kind === 'success'
              ? 'linear-gradient(135deg, #16a34a 0%, #109c42 100%)'
              : kind === 'error'
              ? 'linear-gradient(135deg, #dc2626 0%, #b81e1e 100%)'
              : kind === 'warning'
              ? 'linear-gradient(135deg, #d97706 0%, #bb6505 100%)'
              : 'linear-gradient(135deg, #2d69ea 0%, #214db0 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          minWidth: 320
        }}
      >
        {title ? (
          <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
        ) : null}
        {message}
      </Alert>
    </Snackbar>
  );
}
