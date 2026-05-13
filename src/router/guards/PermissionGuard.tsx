import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
}

export default function PermissionGuard({ code, codes, mode = 'any' }: Props) {
  const { has, hasAll, hasAny } = usePermission();

  const ok = code ? has(code) : mode === 'all' ? hasAll(codes!) : hasAny(codes!);

  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
