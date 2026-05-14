import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { MenuTreeNode } from '../types/menu';
import PermissionGuard from './guards/PermissionGuard';

const componentRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'User/List': lazy(() => import('../pages/User')),
  'Role/List': lazy(() => import('../pages/Role')),
  'Menu/List': lazy(() => import('../pages/Menu')),
  Home: lazy(() => import('../pages/Home')),
  Profile: lazy(() => import('../pages/Profile')),
};

function buildFullPath(path: string, parentPath: string): string {
  return path.startsWith('/') ? path : `${parentPath}/${path}`;
}

function createRouteElement(
  Component: React.LazyExoticComponent<React.ComponentType>,
  perms?: string
): React.ReactNode {
  return perms ? (
    <PermissionGuard code={perms}>
      <Component />
    </PermissionGuard>
  ) : (
    <Component />
  );
}

export function buildRoutes(menuTree: MenuTreeNode[]): RouteObject[] {
  const routes: RouteObject[] = [];

  function processMenuNode(node: MenuTreeNode, parentPath = ''): void {
    // Skip buttons and nodes without paths
    if (node.menuType === 'BUTTON' || !node.path) return;

    const fullPath = buildFullPath(node.path, parentPath);
    const Component = node.component ? componentRegistry[node.component] : null;

    if (Component) {
      routes.push({
        path: fullPath,
        element: createRouteElement(Component, node.perms),
      });
    }

    // Process child nodes recursively
    node.children?.forEach((child) => processMenuNode(child, fullPath));
  }

  menuTree.forEach((node) => processMenuNode(node));
  return routes;
}
