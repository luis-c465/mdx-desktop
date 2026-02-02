/**
 * Tree snapshot utilities for rollback functionality
 * Provides deep cloning and restoration of file tree state
 */

import type { FileNode } from "../types";

/**
 * Create a deep copy snapshot of the file tree
 * Uses structuredClone for efficient, native deep copying
 * @param nodes - Current tree state to snapshot
 * @returns Deep cloned copy of the tree
 */
export function createTreeSnapshot(nodes: FileNode[]): FileNode[] {
  return structuredClone(nodes);
}

/**
 * Restore tree state from a snapshot
 * @param snapshot - Previously saved tree snapshot
 * @returns Deep cloned copy of the snapshot (to prevent mutation)
 */
export function restoreTreeSnapshot(snapshot: FileNode[]): FileNode[] {
  return structuredClone(snapshot);
}
