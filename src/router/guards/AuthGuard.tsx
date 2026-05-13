import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthGuard() {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const loc = useLocation();

  if (!hasToken) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
