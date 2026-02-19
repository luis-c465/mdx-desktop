/**
 * RenameInput - Inline rename input component for file tree nodes
 * Handles validation, keyboard shortcuts (Enter/Escape), and auto-focus
 */

import { useState, useRef, useEffect } from "react";

interface RenameInputProps {
  /** Initial file/folder name */
  initialValue: string;
  
  /** Called when rename is confirmed (Enter or blur) */
  onConfirm: (newName: string) => void;
  
  /** Called when rename is cancelled (Escape) */
  onCancel: () => void;
}

export function RenameInput({
  initialValue,
  onConfirm,
  onCancel,
}: RenameInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select all text when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      
      // Select filename without extension
      const dotIndex = initialValue.lastIndexOf('.');
      if (dotIndex > 0) {
        // Select up to the extension
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        // Select all if no extension
        inputRef.current.select();
      }
    }
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && trimmed !== initialValue) {
        onConfirm(trimmed);
      } else if (trimmed === initialValue) {
        // No change, just cancel
        onCancel();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialValue) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="flex-1 bg-background border border-accent rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      onClick={(e) => e.stopPropagation()} // Prevent node click when clicking input
    />
  );
}
