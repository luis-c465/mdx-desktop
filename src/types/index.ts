/**
 * Type definitions matching Rust backend types
 * Must stay in sync with src-tauri/src/fs/types.rs
 */

/**
 * Represents a file or directory node in the file tree
 * Matches Rust FileNode struct
 */
export interface FileNode {
  /** Absolute path to the file or directory */
  path: string;
  
  /** Display name (file/folder name without path) */
  name: string;
  
  /** True if this is a file, false if directory */
  is_file: boolean;
  
  /** File size in bytes (null for directories) */
  size: number | null;
  
  /** Last modified timestamp (ISO string from Rust SystemTime) */
  modified: string | null;
  
  /** Child nodes for directories (null if not loaded/lazy loaded) */
  children: FileNode[] | null;
  
  /** Whether this node has a pending operation (optimistic update indicator) */
  isPending?: boolean;
}

/**
 * Pagination result for large directories
 * Matches Rust DirectoryPage struct
 */
export interface DirectoryPage {
  /** Page of file nodes */
  nodes: FileNode[];
  
  /** Total number of items in the directory */
  total_count: number;
  
  /** Whether there are more items after this page */
  has_more: boolean;
}

/**
 * Helper type for path operations
 */
export type PathString = string;

/**
 * Error response from Tauri commands
 */
export interface TauriError {
  message: string;
}

/**
 * File system event payload for watcher events
 * Must stay in sync with src-tauri/src/fs/types.rs FsEventPayload
 */
export type FsEventPayload =
  | { type: 'Created'; data: { path: string } }
  | { type: 'Modified'; data: { path: string } }
  | { type: 'Deleted'; data: { path: string } };

