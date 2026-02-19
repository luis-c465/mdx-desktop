/**
 * Deletion Modal Component
 * 
 * Displays when a file has been deleted externally while open in the editor.
 * Gives the user the option to close the editor or save to a new location.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useEditorStore } from "../stores/editorStore";
import { FileX } from "lucide-react";
import { toast } from "sonner";

export function DeletionModal() {
  const showDeletionModal = useEditorStore((state) => state.showDeletionModal);
  const currentPath = useEditorStore((state) => state.currentPath);
  // const content = useEditorStore((state) => state.content); // TODO: Use for Save As feature
  const closeDeletionModal = useEditorStore((state) => state.closeDeletionModal);

  // Extract filename from path for display
  const filename = currentPath?.split('/').pop() || 'this file';

  const handleSaveAs = async () => {
    // In a real implementation, we'd show a save dialog
    // For now, we'll just show a toast
    toast.info('Save As feature coming soon. For now, copy your content before closing.');
    
    // TODO: Implement save dialog using Tauri's dialog API
    // const newPath = await invoke('show_save_dialog');
    // if (newPath && content) {
    //   await writeFile(newPath, content);
    //   closeDeletionModal();
    // }
  };

  return (
    <Dialog open={showDeletionModal} onOpenChange={(open) => !open && closeDeletionModal()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileX className="h-6 w-6 text-red-500" />
            <DialogTitle>File Deleted</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            The file <span className="font-medium text-foreground">{filename}</span> has been 
            deleted from disk.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-sm text-muted-foreground">
          The file no longer exists on disk. You can:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Close:</strong> Close the editor and discard the content</li>
            <li><strong>Save As:</strong> Save the content to a new file location</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={closeDeletionModal}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveAs}
            disabled
          >
            Save As... (Coming Soon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
