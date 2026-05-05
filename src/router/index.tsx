import { createBrowserRouter } from 'react-router-dom';
import AuthRoute from './AuthRoute';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/Login';
import HomePage from '../pages/Home';
import NotFoundPage from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AuthRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            path: '/',
            element: <HomePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
