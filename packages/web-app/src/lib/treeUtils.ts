/**
 * Tree utilities for virtualized rendering
 */

import type { FileNode } from "../types";

/**
 * Flattened tree node for virtualized rendering
 * Combines node data with rendering metadata
 */
export interface FlatNode {
  /** The original file node */
  node: FileNode;
  
  /** Nesting depth (0-based) */
  depth: number;
  
  /** Position in the flat array */
  index: number;
  
  /** Whether this node has children that can be expanded */
  hasChildren: boolean;
  
  /** Whether this folder is currently expanded */
  isExpanded: boolean;
}

/**
 * Flatten a hierarchical tree structure into a flat array for virtualization
 * Only includes visible nodes (respects expansion state)
 * 
 * @param nodes - Root nodes to flatten
 * @param expandedFolders - Set of expanded folder paths
 * @param depth - Current nesting depth (internal use)
 * @returns Flat array of nodes in display order
 */
export function flattenTree(
  nodes: FileNode[],
  expandedFolders: Set<string>,
  depth = 0
): FlatNode[] {
  const flat: FlatNode[] = [];
  const stack: Array<{ node: FileNode; depth: number }> = [];

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    stack.push({ node: nodes[index], depth });
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }

    const isExpanded = expandedFolders.has(current.node.path);
    const hasChildren = !current.node.is_file && (current.node.children?.length ?? 0) > 0;

    flat.push({
      node: current.node,
      depth: current.depth,
      index: flat.length,
      hasChildren,
      isExpanded,
    });

    if (isExpanded && current.node.children) {
      for (let index = current.node.children.length - 1; index >= 0; index -= 1) {
        stack.push({
          node: current.node.children[index],
          depth: current.depth + 1,
        });
      }
    }
  }

  return flat;
}
