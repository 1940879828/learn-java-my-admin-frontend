const V1 = '/v1';

export const API = {
  auth: {
    login: `${V1}/auth/login`,
    register: `${V1}/auth/register`,
    refresh: `${V1}/auth/refresh`,
    logout: `${V1}/auth/logout`,
  },
  user: {
    list: `${V1}/users`,
    detail: (id: number) => `${V1}/users/${id}`,
    create: `${V1}/users`,
    update: (id: number) => `${V1}/users/${id}`,
    remove: (id: number) => `${V1}/users/${id}`,
    roles: (id: number) => `${V1}/users/${id}/roles`,
    role: (id: number, roleId: number) => `${V1}/users/${id}/roles/${roleId}`,
    lock: (id: number) => `${V1}/users/${id}/lock`,
    unlock: (id: number) => `${V1}/users/${id}/unlock`,
    resetPw: (id: number) => `${V1}/users/${id}/password:reset`,
    me: `${V1}/users/me`,
    myPassword: `${V1}/users/me/password`,
  },
  role: {
    list: `${V1}/roles`,
    detail: (id: number) => `${V1}/roles/${id}`,
    create: `${V1}/roles`,
    update: (id: number) => `${V1}/roles/${id}`,
    remove: (id: number) => `${V1}/roles/${id}`,
    menus: (id: number) => `${V1}/roles/${id}/menus`,
    menu: (id: number, menuId: number) => `${V1}/roles/${id}/menus/${menuId}`,
    users: (id: number) => `${V1}/roles/${id}/users`,
  },
  menu: {
    list: `${V1}/menus`,
    tree: `${V1}/menus/tree`,
    detail: (id: number) => `${V1}/menus/${id}`,
    create: `${V1}/menus`,
    update: (id: number) => `${V1}/menus/${id}`,
    remove: (id: number) => `${V1}/menus/${id}`,
    roles: (id: number) => `${V1}/menus/${id}/roles`,
  },
} as const;
