/**
 * MDX Desktop - Main Application Component
 */

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { Button } from "./components/ui/button";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { Toaster } from "./components/ui/sonner";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEditorStore } from "./stores/editorStore";
import { useFileTreeStore } from "./stores/fileTreeStore";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { ConflictModal } from "./components/ConflictModal";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches;
}

function App() {
  const isDirty = useEditorStore((state) => state.isDirty);
  const loadWorkspace = useWorkspaceStore((state) => state.loadWorkspace);
  const cleanupStaleOperations = useFileTreeStore((state) => state.cleanupStaleOperations);
  const [installPromptEvent, setInstallPromptEvent] = useState<DeferredInstallPrompt | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneMode());

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

  // Capture PWA install prompt when available
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const updateStandaloneState = () => setIsStandalone(displayModeMedia.matches);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as DeferredInstallPrompt);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsStandalone(true);
    };

    updateStandaloneState();
    displayModeMedia.addEventListener("change", updateStandaloneState);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      displayModeMedia.removeEventListener("change", updateStandaloneState);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canInstallPwa = Boolean(installPromptEvent) && !isStandalone;

  const handleInstallPwa = async () => {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome !== "accepted") {
      setInstallPromptEvent(null);
    }
  };

  return (
    <>
      {/* Main layout with header and resizable panels */}
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-2 bg-background flex-shrink-0">
          <h1 className="text-lg font-semibold">MDX Web</h1>
          <div className="flex items-center gap-2">
            {canInstallPwa && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallPwa}
                title="Install app"
              >
                <Download className="w-4 h-4" />
                Install
              </Button>
            )}
            <ThemeToggle />
          </div>
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
