/**
 * FileTreeVirtualized - Container component for virtualized file tree
 * Uses @tanstack/react-virtual for optimal performance with large trees
 */

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { useFileTreeStore } from "../../stores/fileTreeStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { TreeNodeFlat } from "./TreeNodeFlat";
import { InlineCreationInput } from "./InlineCreationInput";
import { toast } from "sonner";
import { flattenTree } from "../../lib/treeUtils";

export function FileTreeVirtualized() {
  // Use individual selectors for proper reactivity
  const nodes = useFileTreeStore((state) => state.nodes);
  const expandedFolders = useFileTreeStore((state) => state.expandedFolders);
  const isLoading = useFileTreeStore((state) => state.isLoading);
  const error = useFileTreeStore((state) => state.error);
  const loadRootDirectory = useFileTreeStore((state) => state.loadRootDirectory);
  const clearError = useFileTreeStore((state) => state.clearError);
  const activePath = useFileTreeStore((state) => state.activePath);
  const toggleFolder = useFileTreeStore((state) => state.toggleFolder);
  const setActiveFile = useFileTreeStore((state) => state.setActiveFile);
  const deleteNodeOptimistic = useFileTreeStore((state) => state.deleteNodeOptimistic);
  const creationState = useFileTreeStore((state) => state.creationState);
  const confirmInlineCreation = useFileTreeStore((state) => state.confirmInlineCreation);
  const cancelInlineCreation = useFileTreeStore((state) => state.cancelInlineCreation);
  
  const workspacePath = useWorkspaceStore((state) => state.workspacePath);

  // Reference to scrollable container
  const parentRef = useRef<HTMLDivElement>(null);

  // Load tree when workspace changes
  useEffect(() => {
    if (workspacePath) {
      loadRootDirectory();
    }
  }, [workspacePath, loadRootDirectory]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast.error("File Tree Error", {
        description: error,
        action: {
          label: "Dismiss",
          onClick: () => clearError(),
        },
      });
    }
  }, [error, clearError]);

  // Memoize flat nodes based on actual state dependencies
  const flatNodes = useMemo(() => {
    return flattenTree(nodes, expandedFolders);
  }, [nodes, expandedFolders]);

  // Extended flat nodes with inline creation input injected
  const extendedFlatNodes = useMemo(() => {
    if (!creationState) {
      return flatNodes;
    }

    // Find insertion index
    let insertionIndex = 0;
    let depth = 0;

    if (creationState.insertAfterPath) {
      // Insert after the specified node
      const afterIndex = flatNodes.findIndex(fn => fn.node.path === creationState.insertAfterPath);
      if (afterIndex !== -1) {
        insertionIndex = afterIndex + 1;
        const afterNode = flatNodes[afterIndex].node;

        // If creating inside a folder (parentPath === insertAfterPath), indent deeper
        if (creationState.parentPath === creationState.insertAfterPath && !afterNode.is_file) {
          depth = flatNodes[afterIndex].depth + 1;
        } else {
          // Creating after a sibling, use same depth
          depth = flatNodes[afterIndex].depth;
        }
      }
    } else {
      // Insert at the start of parent folder (first child)
      const parentIndex = flatNodes.findIndex(fn => fn.node.path === creationState.parentPath);
      if (parentIndex !== -1) {
        insertionIndex = parentIndex + 1;
        depth = flatNodes[parentIndex].depth + 1;
      }
    }

    // Create a marker object for inline creation
    const creationMarker = {
      type: 'creation' as const,
      creationType: creationState.type,
      depth,
    };

    // Insert marker into flat nodes
    const result = [...flatNodes];
    result.splice(insertionIndex, 0, creationMarker as any);
    return result;
  }, [flatNodes, creationState]);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: extendedFlatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28, // Fixed row height: 28px (h-7 = 1.75rem)
    overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
  });

  // Scroll to active file when it changes
  useEffect(() => {
    if (activePath && flatNodes.length > 0) {
      const index = flatNodes.findIndex((flatNode) => flatNode.node.path === activePath);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
      }
    }
  }, [activePath, flatNodes, virtualizer]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle keyboard when inline creation is active
      if (creationState) {
        return;
      }

      if (flatNodes.length === 0) return;

      // Find current active index
      let currentIndex = flatNodes.findIndex((flatNode) => flatNode.node.path === activePath);
      if (currentIndex === -1) currentIndex = 0;

      const currentNode = flatNodes[currentIndex];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          // Move to next item
          if (currentIndex < flatNodes.length - 1) {
            const nextNode = flatNodes[currentIndex + 1];
            if (nextNode.node.is_file) {
              setActiveFile(nextNode.node.path);
            } else {
              setActiveFile(nextNode.node.path);
            }
            virtualizer.scrollToIndex(currentIndex + 1, { align: "auto" });
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          // Move to previous item
          if (currentIndex > 0) {
            const prevNode = flatNodes[currentIndex - 1];
            if (prevNode.node.is_file) {
              setActiveFile(prevNode.node.path);
            } else {
              setActiveFile(prevNode.node.path);
            }
            virtualizer.scrollToIndex(currentIndex - 1, { align: "auto" });
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          // Expand folder if collapsed
          if (currentNode && !currentNode.node.is_file && !currentNode.isExpanded) {
            toggleFolder(currentNode.node.path);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          // Collapse folder if expanded
          if (currentNode && !currentNode.node.is_file && currentNode.isExpanded) {
            toggleFolder(currentNode.node.path);
          }
          break;

        case "Enter":
          e.preventDefault();
          // Open file or toggle folder
          if (currentNode) {
            if (currentNode.node.is_file) {
              setActiveFile(currentNode.node.path);
            } else {
              toggleFolder(currentNode.node.path);
            }
          }
          break;

        case "Home":
          e.preventDefault();
          // Jump to first item
          if (flatNodes[0]) {
            setActiveFile(flatNodes[0].node.path);
            virtualizer.scrollToIndex(0, { align: "start" });
          }
          break;

        case "End":
          e.preventDefault();
          // Jump to last item
          if (flatNodes[flatNodes.length - 1]) {
            setActiveFile(flatNodes[flatNodes.length - 1].node.path);
            virtualizer.scrollToIndex(flatNodes.length - 1, { align: "end" });
          }
          break;

        case "Delete":
          e.preventDefault();
          // Delete active file/folder
          if (activePath) {
            deleteNodeOptimistic(activePath);
          }
          break;
      }
    },
    [flatNodes, activePath, setActiveFile, toggleFolder, virtualizer, deleteNodeOptimistic, creationState]
  );

  // Loading state
  if (isLoading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {workspacePath ? "No files found in workspace" : "Select a workspace to begin"}
        </p>
      </div>
    );
  }

  // Render virtualized tree
  return (
    <div
      ref={parentRef}
      className="overflow-auto h-full focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = extendedFlatNodes[virtualItem.index];
          
          // Check if this is the inline creation marker
          if ((item as any).type === 'creation') {
            const creationItem = item as any;
            return (
              <div
                key="inline-creation"
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <InlineCreationInput
                  type={creationItem.creationType}
                  depth={creationItem.depth}
                  onConfirm={confirmInlineCreation}
                  onCancel={cancelInlineCreation}
                />
              </div>
            );
          }
          
          // Regular tree node
          const flatNode = item as any;
          return (
            <div
              key={flatNode.node.path}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TreeNodeFlat flatNode={flatNode} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
