import { create } from 'zustand';
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

export const useUserStore = create<UserState>((set) => ({
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
}));
