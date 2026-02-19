/**
 * Sidebar - Left panel containing workspace selector and file tree
 */

import { AlertTriangle, FolderOpen, KeyRound, X } from "lucide-react";
import { Button } from "../ui/button";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { FileTree } from "../FileTree";
import { FileTreeToolbar } from "../FileTree/FileTreeToolbar";

export function Sidebar() {
  const {
    workspacePath,
    selectWorkspace,
    isLoading,
    error,
    clearError,
    needsPermissionGrant,
    regrantWorkspacePermission,
  } = useWorkspaceStore();

  const isFsAccessSupported =
    typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header with workspace selector */}
      <div className="p-4 border-b space-y-2">
        {!isFsAccessSupported && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                This app needs the File System Access API. Use a recent Chromium browser (Chrome, Edge, Brave, or Arc).
              </p>
            </div>
          </div>
        )}

        {needsPermissionGrant && isFsAccessSupported && (
          <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>Your saved workspace needs permission again.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[11px]"
                onClick={regrantWorkspacePermission}
                disabled={isLoading}
              >
                Grant access
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <div className="flex items-start justify-between gap-2">
              <p className="leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={clearError}
                className="shrink-0 rounded p-0.5 hover:bg-destructive/15"
                aria-label="Dismiss workspace error"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={selectWorkspace}
          disabled={isLoading || !isFsAccessSupported}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="truncate text-xs">
            {workspacePath
              ? workspacePath
              : "Open Workspace Folder"}
          </span>
        </Button>

        {workspacePath && (
          <p className="text-xs text-muted-foreground truncate">
            Workspace: {workspacePath}
          </p>
        )}
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <FileTreeToolbar />
        <FileTree />
      </div>
    </div>
  );
}
