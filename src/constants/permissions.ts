export const PERMISSIONS = {
  USER: {
    LIST: 'user:list',
    VIEW: 'user:view',
    ADD: 'user:add',
    EDIT: 'user:edit',
    DELETE: 'user:delete',
    ASSIGN_ROLE: 'user:assign-role',
    LOCK: 'user:lock',
    UNLOCK: 'user:unlock',
    RESET_PASSWORD: 'user:reset-password',
  },
  ROLE: {
    LIST: 'role:list',
    VIEW: 'role:view',
    ADD: 'role:add',
    EDIT: 'role:edit',
    DELETE: 'role:delete',
    ASSIGN_MENU: 'role:assign-menu',
  },
  MENU: {
    LIST: 'menu:list',
    VIEW: 'menu:view',
    ADD: 'menu:add',
    EDIT: 'menu:edit',
    DELETE: 'menu:delete',
  },
} as const;
