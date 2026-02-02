/**
 * MDX Desktop - Main Application Component
 */

import { useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { Toaster } from "./components/ui/sonner";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEditorStore } from "./stores/editorStore";
import { useFileTreeStore } from "./stores/fileTreeStore";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { ConflictModal } from "./components/ConflictModal";

function App() {
  const isDirty = useEditorStore((state) => state.isDirty);
  const loadWorkspace = useWorkspaceStore((state) => state.loadWorkspace);
  const cleanupStaleOperations = useFileTreeStore((state) => state.cleanupStaleOperations);

  // Load workspace from backend on app startup
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Periodically clean up stale pending operations
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupStaleOperations();
    }, 5000); // Run every 5 seconds

    return () => clearInterval(interval);
  }, [cleanupStaleOperations]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+R or Cmd+R: Reload file tree
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        useFileTreeStore.getState().loadRootDirectory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Warn before closing window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <>
      {/* Main layout with header and resizable panels */}
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-2 bg-background flex-shrink-0">
          <h1 className="text-lg font-semibold">MDX Desktop</h1>
          <ThemeToggle />
        </header>

        {/* Content area with resizable panels */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup orientation="horizontal">
            {/* Sidebar panel */}
            <ResizablePanel
              defaultSize="20%"
              minSize="15%"
              maxSize="40%"
              className="min-w-[200px]">
              <Sidebar />
            </ResizablePanel>

            {/* Resize handle */}
            <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />

            {/* Main content panel */}
            <ResizablePanel defaultSize="80%" minSize="50%">
              <MainContent />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
      
      {/* Conflict resolution modal */}
      <ConflictModal />
    </>
  );
}

export default App;
