import { createBrowserRouter } from 'react-router-dom';
import type { MenuTreeNode } from '../types/menu';
import AuthGuard from './guards/AuthGuard';
import BootstrapGuard from './guards/BootstrapGuard';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';
import ForbiddenPage from '../pages/Forbidden';
import ProfilePage from '../pages/Profile';
import { buildRoutes } from './buildRoutes';

export function createAppRouter(menuTree: MenuTreeNode[]) {
  const dynamicRoutes = buildRoutes(menuTree);

  return createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/403', element: <ForbiddenPage /> },
    {
      element: <AuthGuard />,
      children: [
        {
          element: <BootstrapGuard />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { path: '/profile', element: <ProfilePage /> },
                ...dynamicRoutes,
              ],
            },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ]);
}
