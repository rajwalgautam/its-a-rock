import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action (red). */
  destructive?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  /** Open a themed confirm dialog; resolves true on confirm, false on cancel. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Settle the active request (called by the host modal). */
  resolve: (confirmed: boolean) => void;
}

/**
 * Drives a single app-wide themed confirm dialog ({@link ConfirmModalHost}).
 * Exposes an imperative, promise-based API so callers (even non-component code
 * like media helpers) can prompt without wiring up their own modal state.
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ request: { ...options, resolve } });
    }),
  resolve: (confirmed) => {
    const active = get().request;
    set({ request: null });
    active?.resolve(confirmed);
  },
}));
