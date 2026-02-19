/**
 * FileTreeToolbar - Toolbar with buttons for file operations
 * Provides quick access to New File, New Folder, and Delete actions
 */

import { FilePlus, FolderPlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useFileTreeStore } from "../../stores/fileTreeStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";

export function FileTreeToolbar() {
  const { 
    activePath, 
    startInlineCreation,
    deleteNodeOptimistic,
    nodes,
    loadRootDirectory,
    isLoading,
  } = useFileTreeStore();
  const workspacePath = useWorkspaceStore((state) => state.workspacePath);

  const handleNewFile = () => {
    // Determine parent path and insert position
    let parentPath = workspacePath || '.';
    let insertAfterPath: string | null = null;

    if (activePath) {
      // Find the active node to determine if it's a file or folder
      const findNode = (nodes: any[], path: string): any => {
        for (const node of nodes) {
          if (node.path === path) return node;
          if (node.children) {
            const found = findNode(node.children, path);
            if (found) return found;
          }
        }
        return null;
      };

      const activeNode = findNode(nodes, activePath);
      if (activeNode) {
        if (activeNode.is_file) {
          // If active node is a file, insert after it in the same folder
          const pathParts = activePath.split('/');
          pathParts.pop(); // Remove filename
          parentPath = pathParts.join('/') || '.';
          insertAfterPath = activePath;
        } else {
          // If active node is a folder, insert inside it
          parentPath = activePath;
          insertAfterPath = null; // Top of folder
        }
      }
    }

    startInlineCreation('file', parentPath, insertAfterPath);
  };

  const handleNewFolder = () => {
    // Same logic as handleNewFile
    let parentPath = workspacePath || '.';
    let insertAfterPath: string | null = null;

    if (activePath) {
      const findNode = (nodes: any[], path: string): any => {
        for (const node of nodes) {
          if (node.path === path) return node;
          if (node.children) {
            const found = findNode(node.children, path);
            if (found) return found;
          }
        }
        return null;
      };

      const activeNode = findNode(nodes, activePath);
      if (activeNode) {
        if (activeNode.is_file) {
          const pathParts = activePath.split('/');
          pathParts.pop();
          parentPath = pathParts.join('/') || '.';
          insertAfterPath = activePath;
        } else {
          parentPath = activePath;
          insertAfterPath = null;
        }
      }
    }

    startInlineCreation('folder', parentPath, insertAfterPath);
  };

  const handleDelete = () => {
    if (activePath) {
      deleteNodeOptimistic(activePath);
    }
  };

  return (
    <div className="flex flex-col border-b bg-background">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Reloading...</span>
        </div>
      )}
      
      {/* Toolbar buttons */}
      <div className="flex gap-1 p-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNewFile}
          title="New File"
          className="h-8 px-2"
        >
          <FilePlus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNewFolder}
          title="New Folder"
          className="h-8 px-2"
        >
          <FolderPlus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={!activePath}
          title="Delete (Del)"
          className="h-8 px-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => loadRootDirectory()}
          disabled={isLoading}
          title="Reload file tree (Ctrl+R)"
          className="h-8 px-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
