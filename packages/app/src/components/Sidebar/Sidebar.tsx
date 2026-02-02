/**
 * Sidebar - Left panel containing workspace selector and file tree
 */

import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { FileTree } from "../FileTree";
import { FileTreeToolbar } from "../FileTree/FileTreeToolbar";

export function Sidebar() {
  const { 
    workspacePath, 
    selectWorkspace, 
    isLoading,
  } = useWorkspaceStore();

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header with workspace selector */}
      <div className="p-4 border-b space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={selectWorkspace}
          disabled={isLoading}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="truncate text-xs">
            {workspacePath
              ? workspacePath.split("/").pop() || workspacePath
              : "Open Workspace"}
          </span>
        </Button>
        
        {workspacePath && (
          <p className="text-xs text-muted-foreground truncate" title={workspacePath}>
            {workspacePath}
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
