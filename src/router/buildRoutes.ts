import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { MenuTreeNode } from '../types/menu';
import PermissionGuard from './guards/PermissionGuard';

const componentRegistry: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  'User/List': lazy(() => import('../pages/User')),
  'Role/List': lazy(() => import('../pages/Role')),
  'Menu/List': lazy(() => import('../pages/Menu')),
  Home: lazy(() => import('../pages/Home')),
  Profile: lazy(() => import('../pages/Profile')),
};

export function buildRoutes(menuTree: MenuTreeNode[]): RouteObject[] {
  const result: RouteObject[] = [];

  const walk = (nodes: MenuTreeNode[], parentPath = '') => {
    nodes.forEach((node) => {
      if (node.menuType === 'BUTTON' || !node.path) return;

      const fullPath = node.path.startsWith('/')
        ? node.path
        : `${parentPath}/${node.path}`;
      const Component = node.component
        ? componentRegistry[node.component]
        : null;

      if (Component) {
        result.push({
          path: fullPath,
          element: node.perms ? (
            <PermissionGuard code={node.perms}>
              <Component />
            </PermissionGuard>
          ) : (
            <Component />
          ),
        });
      }

      if (node.children?.length) {
        walk(node.children, fullPath);
      }
    });
  };

  walk(menuTree);
  return result;
}
