// src/components/ui/useFlash.tsx
'use client';

import * as React from 'react';
import Flash, { type FlashKind, type FlashAnchor } from './Flash';

type FlashState = {
  open: boolean;
  kind: FlashKind;
  title?: string;
  message: React.ReactNode | null;
};

type ShowArgs = Omit<FlashState, 'open'> & {
  autoHideMs?: number;
  anchor?: FlashAnchor;
};

export function useFlash() {
  const [state, setState] = React.useState<FlashState>({
    open: false,
    kind: 'info',
    message: null
  });
  const [autoHideMs, setAutoHideMs] = React.useState<number>(4000);
  const [anchor, setAnchor] = React.useState<FlashAnchor>({
    vertical: 'bottom',
    horizontal: 'right'
  });

  const show = React.useCallback((args: ShowArgs) => {
    setAnchor(args.anchor ?? { vertical: 'bottom', horizontal: 'right' });
    setAutoHideMs(args.autoHideMs ?? 4000);
    setState({ open: true, kind: args.kind, title: args.title, message: args.message });
  }, []);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const node = (
    <Flash
      open={state.open}
      kind={state.kind}
      title={state.title}
      message={state.message}
      onClose={close}
      autoHideMs={autoHideMs}
      anchor={anchor}
    />
  );

  return { show, close, node };
}
