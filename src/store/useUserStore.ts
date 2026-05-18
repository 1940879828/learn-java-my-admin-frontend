import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserDetailResponse } from '../types/user';
import type { MenuTreeNode } from '../types/menu';

interface UserState {
  user: UserDetailResponse | null;
  permissions: Set<string>;
  menuTree: MenuTreeNode[];
  loaded: boolean;
  setUser: (u: UserDetailResponse) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      permissions: new Set(),
      menuTree: [],
      loaded: false,
      setUser: (u) =>
        set({
          user: u,
          permissions: new Set(u.permissions),
          menuTree: u.menuTree,
          loaded: true,
        }),
      reset: () =>
        set({ user: null, permissions: new Set(), menuTree: [], loaded: false }),
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        menuTree: state.menuTree,
        loaded: state.loaded,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore permissions Set from user data after rehydration
        if (state?.user?.permissions) {
          state.permissions = new Set(state.user.permissions);
        }
      },
    }
  )
);
