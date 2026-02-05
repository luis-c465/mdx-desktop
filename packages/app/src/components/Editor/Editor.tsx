/**
 * Editor - Main editor container with toolbar and markdown editor
 * Handles keyboard shortcuts and loading states
 */

import { useEffect } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { EditorToolbar } from "./EditorToolbar";
import { MarkdownEditor } from "./MarkdownEditor";
import { Loader2 } from "lucide-react";

export function Editor() {
  const isLoading = useEditorStore((state) => state.isLoading);
  const manualSave = useEditorStore((state) => state.manualSave);

  // Keyboard shortcut: Ctrl/Cmd+S to save
  // Note: Ctrl/Cmd+F and Ctrl/Cmd+H are now handled by FindBarWrapper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        manualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manualSave]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <EditorToolbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading file...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar />
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor />
      </div>
    </div>
  );
}
