import { useUserStore } from '../store/useUserStore';

export function usePermission() {
  const permissions = useUserStore((s) => s.permissions);

  return {
    has: (code: string) => permissions.has(code),
    hasAny: (codes: string[]) => codes.some((c) => permissions.has(c)),
    hasAll: (codes: string[]) => codes.every((c) => permissions.has(c)),
  };
}
