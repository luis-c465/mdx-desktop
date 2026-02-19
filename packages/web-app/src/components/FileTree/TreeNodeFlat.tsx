/**
 * TreeNodeFlat - Non-recursive component for virtualized tree rendering
 * Renders a single node without recursively rendering children
 */

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import type { FlatNode } from "../../lib/treeUtils";
import { cn } from "../../lib/utils";
import { useFileTreeStore } from "../../stores/fileTreeStore";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { RenameInput } from "./RenameInput";

interface TreeNodeFlatProps {
  /** Flattened node data with rendering metadata */
  flatNode: FlatNode;
}

export function TreeNodeFlat({ flatNode }: TreeNodeFlatProps) {
  const { node, depth, isExpanded, hasChildren } = flatNode;
  const { 
    activePath, 
    toggleFolder, 
    setActiveFile,
    startInlineCreation,
    renameNodeOptimistic,
    deleteNodeOptimistic,
  } = useFileTreeStore();
  
  const isActive = activePath === node.path;
  const [isRenaming, setIsRenaming] = useState(false);

  const handleClick = () => {
    if (node.is_file) {
      setActiveFile(node.path);
    } else {
      toggleFolder(node.path);
    }
  };

  const handleIconClick = (e: React.MouseEvent) => {
    // For folders, clicking icon also toggles
    if (!node.is_file) {
      e.stopPropagation();
      toggleFolder(node.path);
    }
  };

  const handleNewFile = () => {
    // Always create inside the folder this was clicked on
    const parentPath = node.is_file 
      ? node.path.split('/').slice(0, -1).join('/') || '.' 
      : node.path;
    
    startInlineCreation('file', parentPath, node.path);
  };

  const handleNewFolder = () => {
    // Always create inside the folder this was clicked on
    const parentPath = node.is_file 
      ? node.path.split('/').slice(0, -1).join('/') || '.' 
      : node.path;
    
    startInlineCreation('folder', parentPath, node.path);
  };

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleRenameConfirm = (newName: string) => {
    setIsRenaming(false);
    if (newName !== node.name) {
      renameNodeOptimistic(node.path, newName);
    }
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
  };

  const handleDelete = () => {
    deleteNodeOptimistic(node.path);
  };

  // Determine icon based on node type
  const Icon = node.is_file ? File : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 cursor-pointer select-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "h-7", // Fixed height: 28px (1.75rem)
            "overflow-hidden", // Prevent text overflow
            isActive && "bg-accent text-accent-foreground font-medium",
            node.isPending && "opacity-60 italic", // Visual indicator for pending operations
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={handleClick}
        >
          {/* Chevron for folders (or spacer for files) */}
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {!node.is_file && hasChildren ? (
              <ChevronIcon
                className="w-4 h-4 text-muted-foreground"
                onClick={handleIconClick}
              />
            ) : null}
          </div>

          {/* File/folder icon */}
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />

          {/* Name - single line with ellipsis or rename input */}
          {isRenaming ? (
            <RenameInput
              initialValue={node.name}
              onConfirm={handleRenameConfirm}
              onCancel={handleRenameCancel}
            />
          ) : (
            <span className="text-sm truncate flex-1">{node.name}</span>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {!node.is_file && (
          <>
            <ContextMenuItem onClick={handleNewFile}>
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={handleNewFolder}>
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={handleRename}>
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
