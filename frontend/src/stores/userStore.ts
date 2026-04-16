import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { defaultUser } from '../data/seed';

interface UserStore {
    user: User;
    updateUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            user: defaultUser,
            updateUser: (updates: Partial<User>) =>
                set((state) => ({
                    user: { ...state.user, ...updates },
                })),
        }),
        {
            name: 'user-v2',
            merge: (persistedState, currentState) => {
                const persisted = (persistedState as { user?: Partial<User> } | undefined)?.user || {};
                return {
                    ...currentState,
                    user: {
                        ...currentState.user,
                        ...persisted,
                    },
                };
            },
        }
    )
);
