import type { MenuTreeNode } from '../types/menu';

/**
 * Flatten tree structure to array
 */
export function flattenTree(tree: MenuTreeNode[]): MenuTreeNode[] {
  const result: MenuTreeNode[] = [];

  const walk = (nodes: MenuTreeNode[]) => {
    nodes.forEach((node) => {
      result.push(node);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };

  walk(tree);
  return result;
}

/**
 * Build tree from flat array
 */
export function buildTree(items: MenuTreeNode[], parentId?: number): MenuTreeNode[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

/**
 * Find node by id in tree
 */
export function findNodeById(tree: MenuTreeNode[], id: number): MenuTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
