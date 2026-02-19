/**
 * File Tree store - manages the file tree state and operations
 */

import { create } from "zustand";
import { toast } from "sonner";
import type { FileNode } from "../types";
import * as api from "../lib/api";
import { readDirectory } from "../lib/api";
import { flattenTree, type FlatNode } from "../lib/treeUtils";
import { createTreeSnapshot, restoreTreeSnapshot } from "../lib/treeSnapshot";
import { useUndoStore } from "./undoStore";

/**
 * Represents a pending optimistic operation
 * Used for rollback on failure and watcher reconciliation
 */
interface PendingOperation {
  /** Unique operation identifier */
  id: string;
  
  /** Type of operation being performed */
  type: 'create_file' | 'create_folder' | 'rename' | 'delete';
  
  /** Target path for the operation */
  path: string;
  
  /** Original path (used for rename operations) */
  originalPath?: string;
  
  /** Timestamp when operation started (for timeout cleanup) */
  timestamp: number;
  
  /** Tree state snapshot before operation (for rollback) */
  snapshot: FileNode[];
}

/** Operation timeout in milliseconds (10 seconds) */
const OPERATION_TIMEOUT = 10000;

interface FileTreeStore {
  /** Root file tree nodes */
  nodes: FileNode[];

  /** Workspace root identifier returned by the FS service */
  workspaceRootPath: string | null;

  /** Currently selected/active file path */
  activePath: string | null;

  /** Set of expanded folder paths */
  expandedFolders: Set<string>;

  /** Loading state for tree operations */
  isLoading: boolean;

  /** Error message if operation failed */
  error: string | null;

  /** Map of pending operations for rollback and reconciliation */
  pendingOperations: Map<string, PendingOperation>;

  /** Inline creation state (null when not creating) */
  creationState: {
    type: 'file' | 'folder';
    parentPath: string;
    insertAfterPath: string | null;
  } | null;

  /**
   * Load directory tree from workspace root
   */
  loadRootDirectory: () => Promise<void>;

  /**
   * Toggle folder expansion state
   * If folder not loaded, fetches children from backend
   */
  toggleFolder: (path: string) => Promise<void>;

  /**
   * Set active file for selection
   */
  setActiveFile: (path: string | null) => void;

  /**
   * Update a specific node in the tree
   */
  updateNode: (path: string, children: FileNode[]) => void;

  /**
   * Clear error message
   */
  clearError: () => void;

  /**
   * Reset the entire tree (useful when workspace changes)
   */
  resetTree: () => void;

  /**
   * Get flattened tree for virtualized rendering
   * Returns a flat array of visible nodes based on expansion state
   */
  getFlatNodes: () => FlatNode[];

  /**
   * Add a pending operation to track
   */
  addPendingOperation: (operation: PendingOperation) => void;

  /**
   * Remove a pending operation by ID
   */
  removePendingOperation: (id: string) => void;

  /**
   * Get a pending operation by ID
   */
  getPendingOperation: (id: string) => PendingOperation | undefined;

  /**
   * Rollback an operation by restoring tree snapshot
   */
  rollbackOperation: (operationId: string) => void;

  /**
   * Clean up stale pending operations (timeout exceeded)
   */
  cleanupStaleOperations: () => void;

  /**
   * Add a node optimistically to the tree
   * @param parentPath - Path of parent folder
   * @param node - Node to add
   */
  addOptimisticNode: (parentPath: string, node: FileNode) => void;

  /**
   * Remove a node optimistically from the tree
   * @param path - Path of node to remove
   */
  removeOptimisticNode: (path: string) => void;

  /**
   * Update a node optimistically in the tree
   * @param path - Path of node to update
   * @param updates - Partial node updates to apply
   */
  updateOptimisticNode: (path: string, updates: Partial<FileNode>) => void;

  /**
   * Mark a node as pending or confirmed
   * @param path - Path of node to mark
   * @param isPending - Whether node has pending operation
   */
  markNodePending: (path: string, isPending: boolean) => void;

  /**
   * Create a new file with optimistic update
   * @param parentPath - Path of parent folder
   * @param fileName - Name of file to create
   */
  createFileOptimistic: (parentPath: string, fileName: string) => Promise<void>;

  /**
   * Create a new folder with optimistic update
   * @param parentPath - Path of parent folder
   * @param folderName - Name of folder to create
   */
  createFolderOptimistic: (parentPath: string, folderName: string) => Promise<void>;

  /**
   * Rename a file or folder with optimistic update
   * @param oldPath - Current path
   * @param newName - New name (not full path, just name)
   */
  renameNodeOptimistic: (oldPath: string, newName: string) => Promise<void>;

  /**
   * Delete a file or folder with optimistic update and undo capability
   * @param path - Path to delete
   */
  deleteNodeOptimistic: (path: string) => Promise<void>;

  /**
   * Start inline creation mode
   * @param type - 'file' or 'folder'
   * @param parentPath - Path of parent folder
   * @param insertAfterPath - Path of node to insert after (null for top of folder)
   */
  startInlineCreation: (type: 'file' | 'folder', parentPath: string, insertAfterPath?: string | null) => void;

  /**
   * Cancel inline creation mode
   */
  cancelInlineCreation: () => void;

  /**
   * Confirm inline creation with provided name
   * Validates, normalizes, and creates the file/folder
   * @param name - User-provided name
   */
  confirmInlineCreation: (name: string) => Promise<void>;

  /**
   * Refresh a specific node's children from the backend
   * Used to sync state after operations without a full watcher
   * @param path - Path of the folder to refresh (or '.' for root)
   */
  refreshNode: (path: string) => Promise<void>;
}

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  nodes: [],
  workspaceRootPath: null,
  activePath: null,
  expandedFolders: new Set(),
  isLoading: false,
  error: null,
  pendingOperations: new Map(),
  creationState: null,

  loadRootDirectory: async () => {
    set({ isLoading: true, error: null });
    try {
      // Read root directory (use "." for workspace root)
      const rootNode = await readDirectory(".", false);
      const workspaceRootPath = normalizeStorePath(rootNode.path);

      // Set root nodes to children of the root directory, filtered to only markdown files
      const nodes = filterMarkdownFiles(
        normalizeNodesToRelative(rootNode.children || [], workspaceRootPath)
      );
      set({ nodes, workspaceRootPath, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false, nodes: [] });
    }
  },

  toggleFolder: async (path: string) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    const { expandedFolders, nodes } = get();
    
    // Check if already expanded
    const isExpanded = expandedFolders.has(normalizedPath);
    
    if (isExpanded) {
      // Collapse: remove from expanded set
      const newExpanded = new Set(expandedFolders);
      newExpanded.delete(normalizedPath);
      set({ expandedFolders: newExpanded });
    } else {
      // Expand: check if we need to load children
      const node = findNodeByPath(nodes, normalizedPath);
      
      if (!node) {
        set({ error: `Node not found: ${normalizedPath}` });
        return;
      }

      // If children not loaded yet, fetch from backend
      if (node.children === null) {
        set({ isLoading: true, error: null });
        try {
          const dirNode = await readDirectory(normalizedPath, false);
          
          // Update node with children, filtered to only markdown files
          const children = filterMarkdownFiles(
            normalizeNodesToRelative(dirNode.children || [], get().workspaceRootPath)
          );
          get().updateNode(normalizedPath, children);
          
          // Add to expanded set
          const newExpanded = new Set(expandedFolders);
          newExpanded.add(normalizedPath);
          set({ expandedFolders: newExpanded, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ error: errorMessage, isLoading: false });
        }
      } else {
        // Children already loaded, just toggle expansion
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(normalizedPath);
        set({ expandedFolders: newExpanded });
      }
    }
  },

  setActiveFile: (path: string | null) => {
    set({ activePath: path ? normalizeTreePath(path, get().workspaceRootPath) : null });
  },

  updateNode: (path: string, children: FileNode[]) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    set((state) => ({
      nodes: updateNodeChildren(state.nodes, normalizedPath, children),
    }));
  },

  clearError: () => set({ error: null }),

  resetTree: () => set({
    nodes: [],
    workspaceRootPath: null,
    activePath: null,
    expandedFolders: new Set(),
    isLoading: false,
    error: null,
  }),

  getFlatNodes: () => {
    const { nodes, expandedFolders } = get();
    return flattenTree(nodes, expandedFolders);
  },

  addPendingOperation: (operation: PendingOperation) => {
    const newPendingOps = new Map(get().pendingOperations);
    newPendingOps.set(operation.id, operation);
    set({ pendingOperations: newPendingOps });
  },

  removePendingOperation: (id: string) => {
    const newPendingOps = new Map(get().pendingOperations);
    newPendingOps.delete(id);
    set({ pendingOperations: newPendingOps });
  },

  getPendingOperation: (id: string) => {
    return get().pendingOperations.get(id);
  },

  rollbackOperation: (operationId: string) => {
    const op = get().pendingOperations.get(operationId);
    if (!op) {
      console.warn(`[FileTreeStore] Cannot rollback: operation ${operationId} not found`);
      return;
    }

    // Restore tree from snapshot
    set({ nodes: restoreTreeSnapshot(op.snapshot) });

    // Remove from pending operations
    get().removePendingOperation(operationId);

    console.warn(`[FileTreeStore] Rolled back operation ${operationId} (type: ${op.type}, path: ${op.path})`);
  },

  cleanupStaleOperations: () => {
    const now = Date.now();
    const staleOps: string[] = [];

    // Find stale operations
    for (const [id, op] of get().pendingOperations) {
      if (now - op.timestamp > OPERATION_TIMEOUT) {
        staleOps.push(id);
      }
    }

    // Remove stale operations
    if (staleOps.length > 0) {
      const newPendingOps = new Map(get().pendingOperations);
      for (const id of staleOps) {
        console.warn(`[FileTreeStore] Operation ${id} timed out, cleaning up`);
        newPendingOps.delete(id);
      }
      set({ pendingOperations: newPendingOps });
    }
  },

  addOptimisticNode: (parentPath: string, node: FileNode) => {
    const normalizedParentPath = normalizeTreePath(parentPath, get().workspaceRootPath);
    set((state) => ({
      nodes: addNodeToTree(state.nodes, normalizedParentPath, node),
    }));

    // Expand parent folder if not already expanded
    const { expandedFolders } = get();
    if (normalizedParentPath !== '.' && !expandedFolders.has(normalizedParentPath)) {
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(normalizedParentPath);
      set({ expandedFolders: newExpanded });
    }
  },

  removeOptimisticNode: (path: string) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    set((state) => ({
      nodes: removeNodeByPath(state.nodes, normalizedPath),
    }));

    // If removed node was active, clear active path
    if (get().activePath === normalizedPath) {
      set({ activePath: null });
    }
  },

  updateOptimisticNode: (path: string, updates: Partial<FileNode>) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    const normalizedUpdates = {
      ...updates,
      path:
        typeof updates.path === "string"
          ? normalizeTreePath(updates.path, get().workspaceRootPath)
          : updates.path,
    };

    set((state) => ({
      nodes: updateNodeInTree(state.nodes, normalizedPath, normalizedUpdates),
    }));
  },

  markNodePending: (path: string, isPending: boolean) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    set((state) => ({
      nodes: updateNodeInTree(state.nodes, normalizedPath, { isPending }),
    }));
  },

  createFileOptimistic: async (parentPath: string, fileName: string) => {
    const operationId = crypto.randomUUID();
    const normalizedParentPath = normalizeTreePath(parentPath, get().workspaceRootPath);
    const fullPath = normalizedParentPath === '.' ? fileName : `${normalizedParentPath}/${fileName}`;
    const snapshot = createTreeSnapshot(get().nodes);

    // Check for concurrent operations on same path
    const existingOp = Array.from(get().pendingOperations.values())
      .find(op => op.path === fullPath);
    
    if (existingOp) {
      toast.error("Operation already in progress for this item");
      return;
    }

    // Add to pending operations
    get().addPendingOperation({
      id: operationId,
      type: 'create_file',
      path: fullPath,
      timestamp: Date.now(),
      snapshot,
    });

    // Optimistic update - add node to tree
    get().addOptimisticNode(normalizedParentPath, {
      name: fileName,
      path: fullPath,
      is_file: true,
      size: 0,
      modified: new Date().toISOString(),
      children: null,
      isPending: true,
    });

    // Backend call with toast
    const promise = api.createFile(fullPath);

    toast.promise(promise, {
      loading: `Creating ${fileName}...`,
      success: () => {
        get().removePendingOperation(operationId);
        get().markNodePending(fullPath, false);
        // Focus the newly created file
        get().setActiveFile(fullPath);
        // Refresh parent folder to get real metadata from backend
        get().refreshNode(normalizedParentPath);
        return `Created ${fileName}`;
      },
      error: (err) => {
        get().rollbackOperation(operationId);
        const message = err instanceof Error ? err.message : String(err);
        return `Failed to create: ${message}`;
      },
    });

    try {
      await promise;
    } catch (error) {
      // Error already handled in toast.error callback
      throw error;
    }
  },

  createFolderOptimistic: async (parentPath: string, folderName: string) => {
    const operationId = crypto.randomUUID();
    const normalizedParentPath = normalizeTreePath(parentPath, get().workspaceRootPath);
    const fullPath = normalizedParentPath === '.' ? folderName : `${normalizedParentPath}/${folderName}`;
    const snapshot = createTreeSnapshot(get().nodes);

    // Check for concurrent operations on same path
    const existingOp = Array.from(get().pendingOperations.values())
      .find(op => op.path === fullPath);
    
    if (existingOp) {
      toast.error("Operation already in progress for this item");
      return;
    }

    // Add to pending operations
    get().addPendingOperation({
      id: operationId,
      type: 'create_folder',
      path: fullPath,
      timestamp: Date.now(),
      snapshot,
    });

    // Optimistic update - add folder to tree
    get().addOptimisticNode(normalizedParentPath, {
      name: folderName,
      path: fullPath,
      is_file: false,
      size: null,
      modified: new Date().toISOString(),
      children: [],
      isPending: true,
    });

    // Backend call with toast
    const promise = api.createFolder(fullPath);

    toast.promise(promise, {
      loading: `Creating folder ${folderName}...`,
      success: () => {
        get().removePendingOperation(operationId);
        get().markNodePending(fullPath, false);
        
        // Expand the new folder
        const newExpanded = new Set(get().expandedFolders);
        newExpanded.add(fullPath);
        set({ expandedFolders: newExpanded });
        
        // Refresh parent folder to get real metadata from backend
        get().refreshNode(normalizedParentPath);

        return `Created folder ${folderName}`;
      },
      error: (err) => {
        get().rollbackOperation(operationId);
        const message = err instanceof Error ? err.message : String(err);
        return `Failed to create folder: ${message}`;
      },
    });

    try {
      await promise;
    } catch (error) {
      // Error already handled in toast.error callback
      throw error;
    }
  },

  renameNodeOptimistic: async (oldPath: string, newName: string) => {
    const operationId = crypto.randomUUID();
    const normalizedOldPath = normalizeTreePath(oldPath, get().workspaceRootPath);
    const parentPath = normalizedOldPath.includes('/') 
      ? normalizedOldPath.substring(0, normalizedOldPath.lastIndexOf('/'))
      : '.';
    const newPath = parentPath === '.' ? newName : `${parentPath}/${newName}`;
    const snapshot = createTreeSnapshot(get().nodes);
    const wasActive = get().activePath === normalizedOldPath;

    // Check for concurrent operations
    const existingOp = Array.from(get().pendingOperations.values())
      .find(op => op.path === newPath || op.originalPath === normalizedOldPath);
    
    if (existingOp) {
      toast.error("Operation already in progress for this item");
      return;
    }

    // Add to pending operations
    get().addPendingOperation({
      id: operationId,
      type: 'rename',
      path: newPath,
      originalPath: normalizedOldPath,
      timestamp: Date.now(),
      snapshot,
    });

    // Optimistic update - rename node
    get().updateOptimisticNode(normalizedOldPath, {
      name: newName,
      path: newPath,
      isPending: true,
    });

    // Update active path if this was the active file
    if (wasActive) {
      set({ activePath: newPath });
    }

    // Backend call with toast
    const promise = api.renamePath(normalizedOldPath, newPath);

    toast.promise(promise, {
      loading: `Renaming to ${newName}...`,
      success: () => {
        get().removePendingOperation(operationId);
        get().markNodePending(newPath, false);
        // Refresh parent folder to ensure consistency
        get().refreshNode(parentPath);
        return `Renamed to ${newName}`;
      },
      error: (err) => {
        get().rollbackOperation(operationId);
        // Restore active path if needed
        if (wasActive) {
          set({ activePath: normalizedOldPath });
        }
        const message = err instanceof Error ? err.message : String(err);
        return `Failed to rename: ${message}`;
      },
    });

    try {
      await promise;
    } catch (error) {
      // Error already handled in toast.error callback
      throw error;
    }
  },

  deleteNodeOptimistic: async (path: string) => {
    const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
    const operationId = crypto.randomUUID();
    const snapshot = createTreeSnapshot(get().nodes);
    const wasActive = get().activePath === normalizedPath;
    const node = findNodeByPath(get().nodes, normalizedPath);
    const fileName = normalizedPath.split('/').pop() || normalizedPath;

    if (!node) {
      toast.error("File not found");
      return;
    }

    // Check if file has unsaved changes
    if (wasActive && node.is_file) {
      // Import editor store to check dirty state
      const { useEditorStore } = await import('./editorStore');
      const editorState = useEditorStore.getState();
      
      if (editorState.isDirty) {
        const confirmed = window.confirm(
          `"${fileName}" has unsaved changes. Delete anyway?`
        );
        if (!confirmed) {
          return; // User cancelled
        }
      }
    }

    // Check for concurrent operations
    const existingOp = Array.from(get().pendingOperations.values())
      .find(op => op.path === normalizedPath);
    
    if (existingOp) {
      toast.error("Operation already in progress for this item");
      return;
    }

    // Read file content before deletion (if it's a file)
    let fileContent: string | undefined;
    if (node.is_file) {
      try {
        fileContent = await api.readFile(normalizedPath);
      } catch (error) {
        console.warn(`[FileTreeStore] Could not read file content for undo:`, error);
        // Continue with deletion even if read fails
      }
    }

    // Add to undo stack (5 second window)
    const undoAction = {
      id: operationId,
      type: 'delete' as const,
      path: normalizedPath,
      node: structuredClone(node),
      timestamp: Date.now(),
      content: fileContent,
    };
    useUndoStore.getState().addUndoAction(undoAction);

    // Add to pending operations
    get().addPendingOperation({
      id: operationId,
      type: 'delete',
      path: normalizedPath,
      timestamp: Date.now(),
      snapshot,
    });

    // Optimistic update - remove node
    get().removeOptimisticNode(normalizedPath);
    
    // Clear active file if deleted
    if (wasActive) {
      set({ activePath: null });
    }

    // Backend call with toast
    const promise = api.deletePath(normalizedPath);

    // Calculate parent path for refresh
    const parentPath = normalizedPath.includes('/') 
      ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/'))
      : '.';

    toast.promise(promise, {
      loading: `Deleting ${fileName}...`,
      success: () => {
        get().removePendingOperation(operationId);
        // Refresh parent folder to ensure consistency
        get().refreshNode(parentPath);
        return `Deleted ${fileName}`;
      },
      error: (err) => {
        get().rollbackOperation(operationId);
        // Restore active file if needed
        if (wasActive) {
          set({ activePath: normalizedPath });
        }
        // Remove from undo stack on error
        useUndoStore.getState().removeUndoAction(operationId);
        const message = err instanceof Error ? err.message : String(err);
        return `Failed to delete: ${message}`;
      },
      duration: 5000, // 5 seconds for undo
      action: {
        label: "Undo",
        onClick: () => {
          useUndoStore.getState().undo().catch((error) => {
            toast.error(`Failed to undo: ${error.message}`);
          });
        },
      },
    });

    try {
      await promise;
    } catch (error) {
      // Error already handled in toast.error callback
      throw error;
    }
  },

  startInlineCreation: (type: 'file' | 'folder', parentPath: string, insertAfterPath: string | null = null) => {
    const normalizedParentPath = normalizeTreePath(parentPath, get().workspaceRootPath);
    const normalizedInsertAfterPath = insertAfterPath
      ? normalizeTreePath(insertAfterPath, get().workspaceRootPath)
      : null;

    set({
      creationState: {
        type,
        parentPath: normalizedParentPath,
        insertAfterPath: normalizedInsertAfterPath,
      },
    });
  },

  cancelInlineCreation: () => {
    set({ creationState: null });
  },

  confirmInlineCreation: async (name: string) => {
    const state = get().creationState;
    if (!state) return;

    // Import validation utilities
    const { validateAndNormalizeFilename, validateFolderName } = await import('../lib/filenameUtils');
    
    // Validate and normalize based on type
    const validation = state.type === 'file' 
      ? validateAndNormalizeFilename(name)
      : validateFolderName(name);
    
    if (!validation.isValid) {
      toast.error(validation.errorMessage || 'Invalid name');
      return; // Don't close input, let user fix
    }
    
    // Use normalized name
    const finalName = validation.normalizedName;
    
    // Clear creation state first
    get().cancelInlineCreation();
    
    // Proceed with optimistic creation
    try {
      if (state.type === 'file') {
        await get().createFileOptimistic(state.parentPath, finalName);
      } else {
        await get().createFolderOptimistic(state.parentPath, finalName);
      }
    } catch (error) {
      // Error already handled by optimistic functions
      console.error('Failed to create:', error);
    }
  },

  refreshNode: async (path: string) => {
    try {
      const normalizedPath = normalizeTreePath(path, get().workspaceRootPath);
      const isRoot = normalizedPath === '.';

      if (isRoot) {
        // If refreshing root, reuse loadRootDirectory logic but keep it silent
        const rootNode = await readDirectory(".", false);
        const workspaceRootPath = normalizeStorePath(rootNode.path);
        const nodes = filterMarkdownFiles(
          normalizeNodesToRelative(rootNode.children || [], workspaceRootPath)
        );
        set({ nodes, workspaceRootPath });
        return;
      }

      // Check if folder is currently expanded (if not, no need to refresh as it will load on expand)
      const { expandedFolders } = get();
      if (!expandedFolders.has(normalizedPath)) {
        return;
      }

      // Refresh specific folder
      const dirNode = await readDirectory(normalizedPath, false);
      const children = filterMarkdownFiles(
        normalizeNodesToRelative(dirNode.children || [], get().workspaceRootPath)
      );
      get().updateNode(normalizedPath, children);
    } catch (error) {
      console.error(`Failed to refresh node ${path}:`, error);
      // Don't show error to user as this is a background sync
    }
  },
}));

function normalizeStorePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
  return normalized === "" ? "." : normalized;
}

function normalizeTreePath(path: string, workspaceRootPath: string | null): string {
  const normalizedPath = normalizeStorePath(path);

  if (!workspaceRootPath || normalizedPath === ".") {
    return normalizedPath;
  }

  if (normalizedPath === workspaceRootPath) {
    return ".";
  }

  const workspacePrefix = `${workspaceRootPath}/`;
  if (normalizedPath.startsWith(workspacePrefix)) {
    const relativePath = normalizedPath.slice(workspacePrefix.length);
    return relativePath === "" ? "." : relativePath;
  }

  return normalizedPath;
}

function normalizeNodesToRelative(
  nodes: FileNode[],
  workspaceRootPath: string | null
): FileNode[] {
  return nodes.map((node) => ({
    ...node,
    path: normalizeTreePath(node.path, workspaceRootPath),
    children: node.children ? normalizeNodesToRelative(node.children, workspaceRootPath) : node.children,
  }));
}

/**
 * Helper function to filter nodes to only include markdown files and directories
 */
function filterMarkdownFiles(nodes: FileNode[]): FileNode[] {
  return nodes.filter(node => {
    // Keep all directories
    if (!node.is_file) {
      return true;
    }
    // Keep only .md and .mdx files
    const ext = node.name.toLowerCase();
    return ext.endsWith('.md') || ext.endsWith('.mdx');
  }).map(node => {
    // Recursively filter children if they exist
    if (node.children) {
      return {
        ...node,
        children: filterMarkdownFiles(node.children)
      };
    }
    return node;
  });
}

/**
 * Helper function to find a node by path in the tree
 */
function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Helper function to update node children recursively
 */
function updateNodeChildren(
  nodes: FileNode[],
  path: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === path) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, path, children),
      };
    }
    return node;
  });
}

/**
 * Helper function to remove a node by path recursively
 */
function removeNodeByPath(nodes: FileNode[], path: string): FileNode[] {
  return nodes.filter((node) => {
    return node.path !== path; // Remove if path matches
  }).map((node) => {
    if (node.children) {
      return {
        ...node,
        children: removeNodeByPath(node.children, path),
      };
    }
    return node;
  });
}

/**
 * Helper function to add a node to the tree
 * Adds to parent's children and sorts alphabetically
 */
function addNodeToTree(
  nodes: FileNode[],
  parentPath: string,
  newNode: FileNode
): FileNode[] {
  // If adding to root (parentPath is '.')
  if (parentPath === '.') {
    const result = [...nodes, newNode];
    return sortNodesByName(result);
  }

  // Otherwise find parent and add to its children
  return nodes.map((node) => {
    if (node.path === parentPath) {
      const children = node.children || [];
      const updatedChildren = [...children, newNode];
      return {
        ...node,
        children: sortNodesByName(updatedChildren),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentPath, newNode),
      };
    }
    return node;
  });
}

/**
 * Helper function to update a node in the tree
 */
function updateNodeInTree(
  nodes: FileNode[],
  path: string,
  updates: Partial<FileNode>
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === path) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, path, updates),
      };
    }
    return node;
  });
}

/**
 * Helper function to sort nodes alphabetically by name
 * Folders come before files
 */
function sortNodesByName(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    // Folders first
    if (!a.is_file && b.is_file) return -1;
    if (a.is_file && !b.is_file) return 1;
    // Then alphabetically by name (case-insensitive)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}
