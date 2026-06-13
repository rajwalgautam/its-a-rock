import { create } from 'zustand';
import {
  getLastNotifiedVersion,
  markVersionNotified,
  performUpdateCheck,
} from '@/utils/updateChecker';

interface UpdateState {
  availableVersion: string | null;
  runStartupCheck: () => Promise<void>;
  dismiss: () => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  availableVersion: null,

  runStartupCheck: async () => {
    try {
      const result = await performUpdateCheck();
      if (!result.isNewer || result.remoteVersion === null) return;
      const lastNotified = await getLastNotifiedVersion();
      if (lastNotified === result.remoteVersion) return;
      set({ availableVersion: result.remoteVersion });
    } catch {
      // Silent failure on startup — user can manually retry from settings.
    }
  },

  dismiss: async () => {
    const v = get().availableVersion;
    if (v === null) return;
    await markVersionNotified(v);
    set({ availableVersion: null });
  },
}));
