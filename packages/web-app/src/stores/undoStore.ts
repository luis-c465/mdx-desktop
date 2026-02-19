/**
 * Undo store - manages undo history for file operations
 * Allows users to undo delete operations within a 5-second window
 */

import { create } from "zustand";
import type { FileNode } from "../types";
import * as api from "../lib/api";
import { useFileTreeStore } from "./fileTreeStore";

/**
 * Represents an undoable action
 */
interface UndoableAction {
  /** Unique action identifier */
  id: string;
  
  /** Type of action (currently only delete is undoable) */
  type: 'delete';
  
  /** Path of the deleted item */
  path: string;
  
  /** The deleted node (for recreation) */
  node: FileNode;
  
  /** Timestamp when action was performed */
  timestamp: number;
  
  /** Content of the file (if it's a file) for restoration */
  content?: string;
}

/** Duration in milliseconds that actions remain undoable (5 seconds) */
const UNDO_WINDOW_MS = 5000;

interface UndoStore {
  /** Stack of undoable actions */
  undoStack: UndoableAction[];

  /**
   * Add an undoable action to the stack
   * @param action - Action to add
   */
  addUndoAction: (action: UndoableAction) => void;

  /**
   * Remove an undoable action from the stack
   * @param id - Action ID to remove
   */
  removeUndoAction: (id: string) => void;

  /**
   * Undo the most recent action
   * Recreates deleted files/folders
   */
  undo: () => Promise<void>;

  /**
   * Clean up expired actions (older than UNDO_WINDOW_MS)
   */
  clearExpired: () => void;
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  undoStack: [],

  addUndoAction: (action: UndoableAction) => {
    // Add action to stack
    set((state) => ({
      undoStack: [...state.undoStack, action],
    }));

    // Schedule automatic cleanup after undo window expires
    setTimeout(() => {
      get().removeUndoAction(action.id);
    }, UNDO_WINDOW_MS);
  },

  removeUndoAction: (id: string) => {
    set((state) => ({
      undoStack: state.undoStack.filter((action) => action.id !== id),
    }));
  },

  undo: async () => {
    const { undoStack } = get();
    
    if (undoStack.length === 0) {
      console.warn('[UndoStore] No actions to undo');
      return;
    }

    // Get most recent action
    const action = undoStack[undoStack.length - 1];

    // Remove from stack immediately
    get().removeUndoAction(action.id);

    try {
      if (action.type === 'delete') {
        // Recreate the deleted item
        if (action.node.is_file) {
          // For files, restore with content if available
          if (action.content !== undefined) {
            await api.writeFile(action.path, action.content);
          } else {
            // Fallback: create empty file if content wasn't captured
            await api.createFile(action.path);
          }
        } else {
          // For folders, create folder
          await api.createFolder(action.path);
        }
        console.log(`[UndoStore] Undid delete of ${action.path}`);
        
        // Calculate parent path for refresh
        const parentPath = action.path.includes('/') 
          ? action.path.substring(0, action.path.lastIndexOf('/'))
          : '.';
        
        // Refresh parent folder to show restored file/folder in UI
        await useFileTreeStore.getState().refreshNode(parentPath);
        
        console.log(`[UndoStore] Refreshed UI for ${parentPath}`);
      }
    } catch (error) {
      console.error('[UndoStore] Failed to undo action:', error);
      throw error;
    }
  },

  clearExpired: () => {
    const now = Date.now();
    set((state) => ({
      undoStack: state.undoStack.filter(
        (action) => now - action.timestamp < UNDO_WINDOW_MS
      ),
    }));
  },
}));
