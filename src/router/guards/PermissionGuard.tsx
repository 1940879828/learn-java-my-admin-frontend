import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
  children?: React.ReactNode;
}

export default function PermissionGuard({ code, codes, mode = 'any', children }: Props) {
  const { has, hasAll, hasAny } = usePermission();

  const ok = code ? has(code) : mode === 'all' ? hasAll(codes!) : hasAny(codes!);

  if (!ok) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
