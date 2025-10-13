// src/components/ui/Flash.tsx
'use client';

import * as React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  IconButton,
  type AlertColor,
  type AlertProps
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import type { SlideProps } from '@mui/material/Slide';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export type FlashKind = AlertColor; // 'success' | 'error' | 'info' | 'warning'

export type FlashAnchor = {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
};

type Props = {
  open: boolean;
  kind: FlashKind;
  title?: string;
  message: React.ReactNode | null;
  onClose: (e?: unknown, reason?: string) => void;
  autoHideMs?: number;
  anchor?: FlashAnchor;
  alertVariant?: AlertProps['variant'];
  hideClose?: boolean;
  closeOnClickAway?: boolean;
  icons?: Partial<Record<FlashKind, React.ReactNode>>;
  onExited?: () => void;
};

const defaultIcons: Record<FlashKind, React.ReactNode> = {
  success: (
    <span role='img' aria-label='Success'>
      ✅
    </span>
  ),
  error: (
    <span role='img' aria-label='Error'>
      ⚠️
    </span>
  ),
  info: (
    <span role='img' aria-label='Info'>
      💡
    </span>
  ),
  warning: (
    <span role='img' aria-label='Warning'>
      🟨
    </span>
  )
};

function getSlideDirectionFromAnchor(
  anchor: FlashAnchor
): SlideProps['direction'] {
  return anchor.vertical === 'bottom' ? 'up' : 'down';
}

const TransitionSlide = React.forwardRef(function TransitionSlide(
  props: SlideProps & { anchor: FlashAnchor },
  ref: React.Ref<unknown>
) {
  const { anchor, ...rest } = props;
  return (
    <Slide
      ref={ref}
      {...rest}
      direction={getSlideDirectionFromAnchor(anchor)}
    />
  );
});

function gradientFor(kind: FlashKind) {
  switch (kind) {
    case 'success':
      return 'linear-gradient(135deg, #16a34a 0%, #109c42 100%)';
    case 'error':
      return 'linear-gradient(135deg, #dc2626 0%, #b81e1e 100%)';
    case 'warning':
      return 'linear-gradient(135deg, #d97706 0%, #bb6505 100%)';
    case 'info':
    default:
      return 'linear-gradient(135deg, #2d69ea 0%, #214db0 100%)';
  }
}

const Flash = React.memo(function Flash({
  open,
  kind,
  title,
  message,
  onClose,
  autoHideMs = 4000,
  anchor = { vertical: 'bottom', horizontal: 'right' },
  alertVariant = 'filled',
  hideClose = false,
  closeOnClickAway = true,
  icons = defaultIcons,
  onExited
}: Props) {
  const ariaLive =
    kind === 'error' || kind === 'warning' ? 'assertive' : 'polite';

  const handleClose = React.useCallback(
    (_e?: unknown, reason?: string) => {
      if (!closeOnClickAway && reason === 'clickaway') return;
      onClose?.(_e, reason);
    },
    [closeOnClickAway, onClose]
  );

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={autoHideMs}
      anchorOrigin={anchor}
      // Cast props coming from Snackbar to SlideProps, then add our anchor
      TransitionComponent={(p: TransitionProps) => (
        <TransitionSlide {...(p as SlideProps)} anchor={anchor} />
      )}
      TransitionProps={{ onExited }}
      role='status'
      aria-live={ariaLive}
    >
      <Alert
        elevation={0}
        variant={alertVariant}
        severity={kind}
        onClose={hideClose ? undefined : handleClose}
        iconMapping={{
          success: icons.success ?? defaultIcons.success,
          error: icons.error ?? defaultIcons.error,
          info: icons.info ?? defaultIcons.info,
          warning: icons.warning ?? defaultIcons.warning
        }}
        action={
          hideClose ? null : (
            <IconButton
              aria-label='Close'
              size='small'
              onClick={handleClose}
              sx={{ color: 'inherit' }}
            >
              <CloseRoundedIcon fontSize='small' />
            </IconButton>
          )
        }
        sx={{
          borderRadius: 2,
          color: 'common.white',
          background: alertVariant === 'filled' ? gradientFor(kind) : undefined,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          minWidth: 320
        }}
      >
        {title ? (
          <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>{title}</AlertTitle>
        ) : null}
        {message}
      </Alert>
    </Snackbar>
  );
});

export default Flash;
