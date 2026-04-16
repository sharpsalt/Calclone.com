import { create } from 'zustand';
import * as api from '../lib/api';

type Flags = Record<string, any>;

interface FeatureFlagsStore {
  flags: Flags;
  fetch: () => Promise<void>;
  get: (name: string) => any;
}

export const useFeatureFlagsStore = create<FeatureFlagsStore>((set, get) => ({
  flags: {},
  fetch: async () => {
    try {
      const res = await api.fetchFeatureFlags();
      const features = res?.features || {};
      set({ flags: features });
    } catch (err) {
      // ignore errors, keep empty flags
      console.error('fetch feature flags error', err);
    }
  },
  get: (name: string) => {
    const f = get().flags;
    return f && Object.prototype.hasOwnProperty.call(f, name) ? f[name] : undefined;
  },
}));

export default useFeatureFlagsStore;
