import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

export default function Permission({
  code,
  codes,
  mode = 'any',
  fallback = null,
  children,
}: Props) {
  const { has, hasAll, hasAny } = usePermission();

  const ok = code
    ? has(code)
    : mode === 'all'
      ? hasAll(codes ?? [])
      : hasAny(codes ?? []);

  return <>{ok ? children : fallback}</>;
}
