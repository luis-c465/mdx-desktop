/**
 * FindBar - Search and replace widget for the markdown editor
 * Uses MDXEditor's searchPlugin and useEditorSearch hook
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorSearch } from "@mdxeditor/editor";
import { Button } from "../ui/button";
import { X, ChevronDown, ChevronUp, Search } from "lucide-react";

interface FindBarProps {
  isOpen: boolean;
  mode: "find" | "replace";
  onClose: () => void;
}

export function FindBar({ isOpen, mode, onClose }: FindBarProps) {
  const {
    search,
    setSearch,
    next,
    prev,
    cursor,
    total,
    replace,
    replaceAll,
    closeSearch,
  } = useEditorSearch();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchValue, setLocalSearchValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [showReplace, setShowReplace] = useState(mode === "replace");
  const debounceTimerRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  // Sync mode prop to internal state
  useEffect(() => {
    setShowReplace(mode === "replace");
  }, [mode]);

  // Initialize local search value when widget opens
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      setLocalSearchValue(search);
      isInitialMount.current = false;
    }
    if (!isOpen) {
      isInitialMount.current = true;
    }
  }, [isOpen, search]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [isOpen]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchValue(value);

    // Clear existing timer
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // If clearing the search (empty string), update immediately to clear highlights
    if (value === "") {
      setSearch("");
      return;
    }

    // Set new timer - only update actual search after user stops typing
    debounceTimerRef.current = window.setTimeout(() => {
      setSearch(value);
    }, 100); // 150ms debounce - fast enough to feel instant, slow enough to skip intermediate searches
  }, [setSearch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeSearch();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSearch, onClose]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // If there's a pending debounce, execute search immediately
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        setSearch(localSearchValue);
      }

      // Then navigate
      if (e.shiftKey) {
        prev();
      } else {
        next();
      }
    }
  };

  const handleClose = () => {
    closeSearch();
    onClose();
  };

  const handleReplace = () => {
    replace(replaceValue);
  };

  const handleReplaceAll = () => {
    replaceAll(replaceValue);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-2 right-2 z-[50] bg-background border border-border rounded-lg shadow-lg p-3 min-w-[340px]">
      {/* Find row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={total === 0}
            className="h-7 w-7 p-0"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={total === 0}
            className="h-7 w-7 p-0"
            title="Next (Enter)"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Match counter */}
        <div className="text-xs text-muted-foreground min-w-[60px] text-center">
          {localSearchValue && total === 0 && "No results"}
          {localSearchValue && total > 0 && `${cursor} of ${total}`}
        </div>

        {/* Toggle replace button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplace(!showReplace)}
          className="h-7 w-7 p-0"
          title={showReplace ? "Hide replace" : "Show replace"}
        >
          {showReplace ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-7 w-7 p-0"
          title="Close (Esc)"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Replace row (conditional) */}
      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            placeholder="Replace"
            className="flex-1 px-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReplace}
            disabled={total === 0 || cursor === 0}
            className="h-7 text-xs px-3"
          >
            Replace
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReplaceAll}
            disabled={total === 0}
            className="h-7 text-xs px-3"
          >
            All
          </Button>
        </div>
      )}
    </div>
  );
}
