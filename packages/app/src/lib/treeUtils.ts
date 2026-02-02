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
  
  for (const node of nodes) {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = !node.is_file && (node.children?.length ?? 0) > 0;
    
    // Add current node
    flat.push({
      node,
      depth,
      index: flat.length,
      hasChildren,
      isExpanded,
    });
    
    // Recursively add children if folder is expanded
    if (isExpanded && node.children) {
      const childNodes = flattenTree(node.children, expandedFolders, depth + 1);
      flat.push(...childNodes);
    }
  }
  
  // Update indices to be sequential
  flat.forEach((item, idx) => {
    item.index = idx;
  });
  
  return flat;
}
