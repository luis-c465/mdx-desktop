/**
 * Workspace store - manages the current workspace path
 */

import { create } from "zustand";
import { 
  showOpenDialog, 
  getWorkspace,
} from "../lib/api";

interface WorkspaceStore {
  /** Current workspace path (null if no workspace selected) */
  workspacePath: string | null;

  /** Loading state for workspace operations */
  isLoading: boolean;

  /** Error message if workspace operation failed */
  error: string | null;

  /**
   * Open workspace selection dialog and set workspace
   */
  selectWorkspace: () => Promise<void>;

  /**
   * Load current workspace from backend state
   */
  loadWorkspace: () => Promise<void>;

  /**
   * Clear error message
   */
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspacePath: null,
  isLoading: false,
  error: null,

  selectWorkspace: async () => {
    set({ isLoading: true, error: null });
    try {
      const path = await showOpenDialog();
      if (path) {
        set({ workspacePath: path, isLoading: false });
      } else {
        // User cancelled dialog
        set({ isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadWorkspace: async () => {
    set({ isLoading: true, error: null });
    try {
      const path = await getWorkspace();
      set({ workspacePath: path, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
