/**
 * FindBarWrapper - Wrapper that manages find bar state and keyboard shortcuts
 * This component is rendered within MDXEditor's Realm context via plugin
 */

import { useEffect, useState } from "react";
import { FindBar } from "./FindBar";

export function FindBarWrapper() {
  const [showFind, setShowFind] = useState(false);
  const [findMode, setFindMode] = useState<"find" | "replace">("find");

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F: Find
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setFindMode("find");
        setShowFind(true);
      }
      
      // Ctrl/Cmd+H: Find and Replace
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setFindMode("replace");
        setShowFind(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <FindBar 
      isOpen={showFind}
      mode={findMode}
      onClose={() => setShowFind(false)}
    />
  );
}
