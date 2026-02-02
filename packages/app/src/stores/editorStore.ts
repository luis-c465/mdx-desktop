/**
 * Editor store - manages the markdown editor state and operations
 */

import { create } from "zustand";
import { readFile, writeFile } from "../lib/api";
import { toast } from "sonner";
import { EDITOR_CONFIG } from "../config/editor";

interface EditorStore {
  /** Current file path being edited */
  currentPath: string | null;

  /** Current editor content */
  content: string | null;

  /** Original content as loaded from disk (for dirty check) */
  originalContent: string | null;

  /** Whether there are unsaved changes */
  isDirty: boolean;

  /** Save operation in progress */
  isSaving: boolean;

  /** File load operation in progress */
  isLoading: boolean;

  /** Last successful save timestamp */
  lastSaved: Date | null;

  /** Error message if load/save fails */
  error: string | null;

  /** File size in bytes (for large file warning) */
  fileSize: number | null;

  /** ID of the pending auto-save timeout */
  autoSaveTimeoutId: ReturnType<typeof setTimeout> | null;
  
  /** Show conflict modal when file modified externally with unsaved changes */
  showConflictModal: boolean;
  
  /** Path of the file that has a conflict */
  conflictFilePath: string | null;
  
  /** Show deletion modal when file deleted externally (unused - kept for DeletionModal component) */
  showDeletionModal: boolean;

  /**
   * Load file content from disk
   */
  loadFile: (path: string, size?: number | null) => Promise<boolean>;

  /**
   * Update editor content (marks as dirty and schedules auto-save)
   */
  updateContent: (content: string) => void;

  /**
   * Schedule auto-save after delay
   */
  scheduleAutoSave: () => void;

  /**
   * Cancel pending auto-save
   */
  cancelAutoSave: () => void;

  /**
   * Trigger immediate manual save
   */
  manualSave: () => Promise<boolean>;

  /**
   * Save current content to disk
   */
  saveFile: () => Promise<boolean>;

  /**
   * Reset editor state (when closing file)
   */
  resetEditor: () => void;

  /**
   * Clear error message
   */
  clearError: () => void;
  
  /**
   * Reload file from disk (for conflict resolution)
   */
  reloadFromDisk: () => Promise<void>;
  
  /**
   * Keep user changes and dismiss conflict modal
   */
  keepMyChanges: () => void;
  
  /**
   * Close deletion modal (unused stub for DeletionModal component)
   */
  closeDeletionModal: () => void;
}

const MAX_FILE_SIZE = EDITOR_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentPath: null,
  content: null,
  originalContent: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  lastSaved: null,
  error: null,
  fileSize: null,
  autoSaveTimeoutId: null,
  showConflictModal: false,
  conflictFilePath: null,
  showDeletionModal: false,

  loadFile: async (path: string, size: number | null = null) => {
    // If file size provided and exceeds limit, warn user
    if (size && size > MAX_FILE_SIZE) {
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      const confirmed = window.confirm(
        `This file is ${sizeMB}MB and may impact performance.\n\nDo you want to continue opening it?`
      );
      if (!confirmed) {
        return false;
      }
    }

    // Cancel any pending auto-saves before loading new file
    get().cancelAutoSave();

    set({ isLoading: true, error: null, fileSize: size });
    try {
      const fileContent = await readFile(path);
      set({
        currentPath: path,
        content: fileContent,
        originalContent: fileContent,
        isDirty: false,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(`Failed to load file: ${errorMessage}`);
      return false;
    }
  },

  updateContent: (content: string) => {
    const { originalContent } = get();
    const isDirty = content !== originalContent;
    
    set({
      content,
      isDirty,
    });

    if (isDirty) {
      get().scheduleAutoSave();
    }
  },

  scheduleAutoSave: () => {
    const { autoSaveTimeoutId } = get();
    
    // Clear existing timeout
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }

    // Schedule new save
    const timeoutId = setTimeout(() => {
      get().saveFile();
    }, EDITOR_CONFIG.AUTO_SAVE_DELAY_MS);

    set({ autoSaveTimeoutId: timeoutId });
  },

  cancelAutoSave: () => {
    const { autoSaveTimeoutId } = get();
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
      set({ autoSaveTimeoutId: null });
    }
  },

  manualSave: async () => {
    // Cancel pending auto-save to avoid double saves
    get().cancelAutoSave();
    return await get().saveFile();
  },

  saveFile: async () => {
    const { currentPath, content, isSaving } = get();

    if (!currentPath || content === null || isSaving) {
      return false;
    }

    // Clear timeout ID since we're saving now
    set({ isSaving: true, error: null, autoSaveTimeoutId: null });
    
    try {
      await writeFile(currentPath, content);
      set({
        originalContent: content,
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      });
      // We don't show toast for auto-saves to avoid spamming the user
      // But we will handle visual feedback via the toolbar indicator
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(`Failed to save file: ${errorMessage}`, {
        action: {
          label: "Retry",
          onClick: () => get().saveFile(),
        },
      });
      return false;
    }
  },

  resetEditor: () => {
    get().cancelAutoSave();
    set({
      currentPath: null,
      content: null,
      originalContent: null,
      isDirty: false,
      isSaving: false,
      isLoading: false,
      lastSaved: null,
      error: null,
      fileSize: null,
      autoSaveTimeoutId: null,
    });
  },

  clearError: () => set({ error: null }),
  
  reloadFromDisk: async () => {
    const { conflictFilePath } = get();
    if (!conflictFilePath) return;
    
    try {
      const fileContent = await readFile(conflictFilePath);
      set({
        content: fileContent,
        originalContent: fileContent,
        isDirty: false,
        showConflictModal: false,
        conflictFilePath: null,
      });
      toast.success("File reloaded from disk");
    } catch (error) {
      console.error('Failed to reload file from disk:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to reload file: ${errorMessage}`);
    }
  },
  
  keepMyChanges: () => {
    set({ 
      showConflictModal: false,
      conflictFilePath: null 
    });
    toast.info("Keeping your changes");
  },
  
  closeDeletionModal: () => {
    // Stub for DeletionModal component (not actively used)
    set({ showDeletionModal: false });
  },
}));
