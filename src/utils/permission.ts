export const hasPermission = (userPermissions: Set<string>, code: string): boolean =>
  userPermissions.has(code);

export const hasAnyPermission = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.some((c) => userPermissions.has(c));

export const hasAllPermissions = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.every((c) => userPermissions.has(c));
