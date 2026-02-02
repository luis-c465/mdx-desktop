/**
 * MainContent - Right panel for displaying file content
 * Integrates MDXEditor for editing markdown files
 */

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { useFileTreeStore } from "../../stores/fileTreeStore";
import { useEditorStore } from "../../stores/editorStore";
import { Editor } from "../Editor";

export function MainContent() {
  const activePath = useFileTreeStore((state) => state.activePath);
  const nodes = useFileTreeStore((state) => state.nodes);
  const isDirty = useEditorStore((state) => state.isDirty);
  const saveFile = useEditorStore((state) => state.saveFile);
  const loadFile = useEditorStore((state) => state.loadFile);
  const resetEditor = useEditorStore((state) => state.resetEditor);
  const currentPath = useEditorStore((state) => state.currentPath);
  const cancelAutoSave = useEditorStore((state) => state.cancelAutoSave);
  
  const previousPathRef = useRef<string | null>(null);

  // Helper function to find node by path
  const findNodeByPath = (nodes: any[], path: string): any => {
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
  };

  // Handle file switching with auto-save
  useEffect(() => {
    const handleFileSwitch = async () => {
      // If activePath hasn't changed, do nothing
      if (activePath === previousPathRef.current) {
        return;
      }

      // If no active path, reset editor
      if (!activePath) {
        if (isDirty && currentPath) {
          // Cancel pending auto-save before immediate save
          cancelAutoSave();
          await saveFile();
        }
        resetEditor();
        previousPathRef.current = null;
        return;
      }

      // Check if it's a markdown file
      const isMarkdown = activePath.endsWith('.md') || activePath.endsWith('.mdx');
      if (!isMarkdown) {
        // This shouldn't happen since we filter, but just in case
        previousPathRef.current = activePath;
        return;
      }

      // Auto-save current file before switching if dirty
      if (isDirty && currentPath && currentPath !== activePath) {
        // Cancel pending auto-save before immediate save
        cancelAutoSave();
        await saveFile();
      }

      // Find the node to get file size
      const node = findNodeByPath(nodes, activePath);
      const fileSize = node?.size || null;

      // Load the new file
      await loadFile(activePath, fileSize);
      previousPathRef.current = activePath;
    };

    handleFileSwitch();
  }, [activePath, isDirty, currentPath, nodes, loadFile, saveFile, resetEditor, cancelAutoSave]);

  // Show empty state when no file selected
  if (!activePath) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No file selected</p>
          <p className="text-sm mt-2">
            Select a markdown file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  // Show editor for markdown files
  return (
    <div className="h-full bg-background">
      <Editor />
    </div>
  );
}
