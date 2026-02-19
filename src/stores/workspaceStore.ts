/**
 * Workspace store - manages the current workspace path
 */

import { create } from "zustand";
import { 
  showOpenDialog, 
  getWorkspace,
  requestWorkspacePermission,
  hasStoredWorkspace,
} from "../lib/api";

interface WorkspaceStore {
  /** Current workspace path (null if no workspace selected) */
  workspacePath: string | null;

  /** Loading state for workspace operations */
  isLoading: boolean;

  /** Error message if workspace operation failed */
  error: string | null;

  /** True when a remembered workspace needs permission re-grant */
  needsPermissionGrant: boolean;

  /**
   * Open workspace selection dialog and set workspace
   */
  selectWorkspace: () => Promise<void>;

  /**
   * Load current workspace from backend state
   */
  loadWorkspace: () => Promise<void>;

  /**
   * Request permission again for remembered workspace handle
   */
  regrantWorkspacePermission: () => Promise<void>;

  /**
   * Clear error message
   */
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspacePath: null,
  isLoading: false,
  error: null,
  needsPermissionGrant: false,

  selectWorkspace: async () => {
    set({ isLoading: true, error: null, needsPermissionGrant: false });
    try {
      const path = await showOpenDialog();
      if (path) {
        set({ workspacePath: path, isLoading: false, needsPermissionGrant: false });
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
    set({ isLoading: true, error: null, needsPermissionGrant: false });
    try {
      const path = await getWorkspace();

      if (path) {
        set({ workspacePath: path, isLoading: false, needsPermissionGrant: false });
        return;
      }

      const restoredAfterGrant = await requestWorkspacePermission();
      if (restoredAfterGrant) {
        set({ workspacePath: restoredAfterGrant, isLoading: false, needsPermissionGrant: false });
        return;
      }

      const hasRememberedWorkspace = await hasStoredWorkspace();
      set({
        workspacePath: null,
        isLoading: false,
        needsPermissionGrant: hasRememberedWorkspace,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  regrantWorkspacePermission: async () => {
    set({ isLoading: true, error: null });
    try {
      const path = await requestWorkspacePermission();

      if (path) {
        set({ workspacePath: path, isLoading: false, needsPermissionGrant: false });
        return;
      }

      set({ isLoading: false, needsPermissionGrant: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
