/**
 * EditorToolbar - Top toolbar with save button and status indicators
 */

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Save, Loader2, Check, Circle } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { useFileTreeStore } from "../../stores/fileTreeStore";
import { EDITOR_CONFIG } from "../../config/editor";

export function EditorToolbar() {
  const activePath = useFileTreeStore((state) => state.activePath);
  const isDirty = useEditorStore((state) => state.isDirty);
  const isSaving = useEditorStore((state) => state.isSaving);
  const lastSaved = useEditorStore((state) => state.lastSaved);
  const manualSave = useEditorStore((state) => state.manualSave);
  
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" indicator for a brief period after successful save
  useEffect(() => {
    if (lastSaved && !isDirty && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, EDITOR_CONFIG.SAVE_STATUS_DISPLAY_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isDirty, isSaving]);

  const handleSave = async () => {
    await manualSave();
  };

  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4 select-none">
      {/* File path */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium truncate" title={activePath || ""}>
          {activePath?.split("/").pop() || "No file"}
        </span>
        <span className="text-xs text-muted-foreground truncate hidden md:inline opacity-60">
          {activePath}
        </span>
      </div>

      {/* Status and save button */}
      <div className="flex items-center gap-4">
        {/* Minimal Status Indicator */}
        <div className="flex items-center text-sm transition-all duration-300 ease-in-out">
          {isSaving ? (
            <div className="flex items-center text-muted-foreground gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">Saving...</span>
            </div>
          ) : showSaved ? (
            <div className="flex items-center text-green-600 gap-1.5 animate-in fade-in zoom-in duration-300">
              <Check className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Saved</span>
            </div>
          ) : isDirty ? (
            <div className="flex items-center text-yellow-600 gap-1.5">
              <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-medium">Unsaved</span>
            </div>
          ) : null}
        </div>

        <div className="h-4 w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="h-8 gap-2 text-xs"
          title="Save (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
    </div>
  );
}
