/**
 * Conflict Modal Component
 * 
 * Displays when a file has been modified externally while the user has unsaved changes.
 * Gives the user the option to reload from disk or keep their changes.
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
import { AlertTriangle } from "lucide-react";

export function ConflictModal() {
  const showConflictModal = useEditorStore((state) => state.showConflictModal);
  const currentPath = useEditorStore((state) => state.currentPath);
  const reloadFromDisk = useEditorStore((state) => state.reloadFromDisk);
  const keepMyChanges = useEditorStore((state) => state.keepMyChanges);

  // Extract filename from path for display
  const filename = currentPath?.split('/').pop() || 'this file';

  return (
    <Dialog open={showConflictModal} onOpenChange={(open) => !open && keepMyChanges()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <DialogTitle>File Modified Externally</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            The file <span className="font-medium text-foreground">{filename}</span> has been 
            modified by another program. You have unsaved changes in the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-sm text-muted-foreground">
          Choose how to proceed:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Reload from Disk:</strong> Discard your changes and load the external version</li>
            <li><strong>Keep My Changes:</strong> Ignore the external changes and continue editing</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={reloadFromDisk}
          >
            Reload from Disk
          </Button>
          <Button
            onClick={keepMyChanges}
          >
            Keep My Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
