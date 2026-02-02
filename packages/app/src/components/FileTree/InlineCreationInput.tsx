/**
 * InlineCreationInput - Input field for inline file/folder creation
 * Appears as a tree node with an editable name field
 */

import { useEffect, useRef, useState } from "react";
import { File, Folder } from "lucide-react";
import { cn } from "../../lib/utils";

interface InlineCreationInputProps {
  /** Type of item being created */
  type: 'file' | 'folder';
  /** Depth in tree for proper indentation */
  depth: number;
  /** Callback when user confirms (presses Enter) */
  onConfirm: (name: string) => void;
  /** Callback when user cancels (presses Escape or clicks away) */
  onCancel: () => void;
}

export function InlineCreationInput({ type, depth, onConfirm, onCancel }: InlineCreationInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        onConfirm(value.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Cancel on blur (clicking away from input)
    onCancel();
  };

  const indentStyle = { paddingLeft: `${depth * 12 + 8}px` };
  const Icon = type === 'file' ? File : Folder;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 mr-2 my-0.5",
        "border border-primary/20 rounded bg-accent/5", 
        "italic", 
      )}
      style={indentStyle}
    >
      {/* Icon */}
      <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={type === 'file' ? 'filename.md' : 'folder-name'}
        className={cn(
          "flex-1 bg-transparent border-none outline-none",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "focus:ring-1 focus:ring-primary rounded px-1",
        )}
      />
    </div>
  );
}
