# Tauri Markdown Editor - Complete Architecture & Implementation Plan

## Executive Summary

**Architecture Pattern**: Unidirectional data flow with centralized state management. Backend handles all file system operations as the single source of truth; frontend maintains optimistic UI updates for responsiveness. The design prioritizes performance at scale (1000+ files), security (path traversal prevention), and native desktop experience.

---

## Backend Design (Rust)

### Core Module Structure

**File System Service** (`src/fs/`)

- **`explorer.rs`**: Recursive directory scanning using `jwalk` with Rayon parallelism for non-blocking operations. Returns hierarchical tree structure with file metadata only (no content).
- **`operations.rs`**: Atomic file operations with validation. All paths canonicalized through `std::path::PathBuf` to prevent directory traversal attacks. Returns structured `Result<T, AppError>`.
- **`watcher.rs`**: File system watcher using `notify` crate with `notify-debouncer-mini` (100ms debounce) to batch rapid changes. Watches root directory recursively and emits delta events only.

**Command Layer** (`src/commands/`)

- Exposes `#[tauri::command]` functions that accept string paths and return serialized results
- Input validation layer rejects paths containing `..` or absolute paths outside the base directory
- All I/O operations run on `tokio::task::spawn_blocking` to prevent blocking the main thread

**State Management** (`src/state/`)

- `AppState`: Stores current `baseDir` path and in-memory `HashMap<PathBuf, FileNode>` index for O(1) lookups
- `WindowState`: Per-window state tracking active file and dirty flag
- State is behind `Arc<RwLock<T>>` for thread-safe access across commands and watcher events

**Error Handling** (`src/error.rs`)

- Custom `AppError` enum with variants: `PermissionDenied`, `InvalidPath`, `FileNotFound`, `IoError`
- Maps OS errors to user-actionable messages (e.g., "File is open in another program")

### Scaling Optimizations

- **Lazy Loading**: Only immediate children loaded initially; grandchildren loaded on folder expand
- **Pagination**: Folders with 1000+ items return paginated results (500 items/page) with `has_more` flag
- **Delta Updates**: Watcher emits only changed nodes, not entire tree. Frontend merges via incremental updates
- **Memory Efficiency**: File contents never stored in backend state; only metadata (path, size, modified time)

---

## Frontend Design (React + TypeScript)

### State Management (Zustand)

**File Tree Store** (`stores/fileTreeStore.ts`)

```typescript
interface FileTreeStore {
  nodes: FileNode[]; // Hierarchical tree structure
  activePath: string | null; // Currently open file path
  isDirty: boolean; // Unsaved changes flag
  expandedFolders: Set<string>; // Tracks expanded state
  searchQuery: string; // Fuzzy search term
  visibleNodes: FileNode[]; // Virtualized view window

  // Core actions
  loadDirectory: (path: string, offset?: number) => Promise<void>;
  createNode: (parentPath: string, type: "file" | "folder") => Promise<void>;
  renameNode: (oldPath: string, newPath: string) => Promise<void>;
  deleteNode: (path: string) => Promise<void>;
  setActiveFile: (path: string) => void;

  // Optimistic updates
  updateNode: (path: string, updater: (node: FileNode) => FileNode) => void;
  removeNode: (path: string) => void;
}
```

**Component Architecture**

```
App
├── Sidebar (resizable with react-resizable-panels)
│   ├── FolderSelectorButton (opens system dialog via Tauri API)
│   ├── SearchInput (debounced 200ms, uses Fuse.js in web worker)
│   ├── FileTree (virtualized with react-window)
│   │   └── TreeNode (recursive component with inline rename)
│   └── NewFileButton (creates "untitled.md" with timestamp suffix)
└── MainContent
    ├── EditorToolbar (save status, formatting buttons, word count)
    ├── MDXEditor (with custom autosave plugin)
    └── StatusBar (file path, line count, git-style dirty indicator)
```

### Editor Integration (MDXEditor)

**Library Choice**: MDXEditor over TipTap because:

- Built specifically for markdown (no custom serialization needed)
- Direct MDX support for future extensibility (components, plugins)
- Lighter bundle size (~150KB vs TipTap's ~200KB with extensions)
- Better TypeScript definitions and React-first API
- Built-in markdown shortcuts and toolbar system

**Auto-save Implementation**

- Debounced 300ms content change listener
- Saves to temp file first (`filename.md.tmp`), then atomic rename on success
- Dirty flag prevents window close: `window.onbeforeunload` handler when `isDirty === true`
- Conflict detection: Compare file hash before save; if changed on disk, show modal with diff view

**Performance Optimizations**

- **Virtualization**: `@tanstack/react-virtual` renders only visible nodes (+ overscan buffer of 5)
- **Granular Selectors**: Zustand selectors prevent re-renders of unaffected tree branches
- **startTransition**: Large folder loads wrapped in `React.startTransition()` for concurrent rendering
- **Web Worker**: Fuse.js search index built in worker to prevent main thread blocking

---

## Tauri Communication Layer

### Commands (Frontend → Backend)

```rust
// File operations
#[tauri::command]
async fn read_file(path: String) -> Result<String, AppError>

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), AppError>

#[tauri::command]
async fn create_file(path: String) -> Result<(), AppError>

#[tauri::command]
async fn create_folder(path: String) -> Result<(), AppError>

#[tauri::command]
async fn rename_path(old: String, new: String) -> Result<(), AppError>

#[tauri::command]
async fn delete_path(path: String) -> Result<(), AppError>

// Directory operations
#[tauri::command]
async fn read_directory(path: String) -> Result<FileNode, AppError>

#[tauri::command]
async fn get_directory_page(
    path: String,
    offset: usize,
    limit: usize
) -> Result<DirectoryPage, AppError>

// System dialogs
#[tauri::command]
async fn show_open_dialog() -> Result<String, AppError>
```

### Events (Backend → Frontend)

- **`file-changed-on-disk`**: `{ path: string, change_type: 'modified' | 'deleted' | 'created' }`
  - Frontend checks if file is active; if so, prompts user to reload or shows diff
- **`fs-error`**: `{ message: string, action: string }`
  - Triggers toast notification with retry button
- **`directory-page`**: `{ nodes: FileNode[], has_more: boolean }`
  - Streaming response for large directories; frontend appends incrementally

---

## Key Design Decisions & Reasoning

### 1. **Path Handling & Security**

- **Decision**: All paths canonicalized to absolute paths in backend; frontend uses relative paths for display
- **Reason**: Prevents directory traversal attacks (`../../etc/passwd`). Tauri's fs scope automatically restricts access to `baseDir`. Validation happens at command entry point.

### 2. **Optimistic UI Updates**

- **Decision**: Frontend updates state immediately before backend confirmation; rolls back on error
- **Reason**: Feels instant to user. Network latency to Rust backend is negligible, but file I/O can be slow on HDDs. Rollback strategy with toast notifications provides best UX.

### 3. **Auto-save Strategy**

- **Decision**: 300ms debounce + temp file + atomic rename
- **Reason**: Prevents data corruption on crash/power loss. Temp file ensures write operation is all-or-nothing. Debounce balances responsiveness vs. performance.

### 4. **Virtualization Over Pagination**

- **Decision**: Virtual scroll for tree view; pagination for directory loading
- **Reason**: Tree needs to feel native (smooth scroll). Virtualization gives illusion of infinite scroll without DOM bloat. Pagination reduces initial IPC payload size.

### 5. **In-Memory Index**

- **Decision**: Maintain `HashMap<PathBuf, FileNode>` in backend state
- **Reason**: O(1) lookups for watcher events and operations. Memory cost is minimal (~200 bytes per file). Enables efficient delta updates.

### 6. **MDXEditor Choice**

- **Decision**: MDXEditor instead of TipTap/Milkdown
- **Reason**: Native markdown support eliminates serialization complexity. MDX support future-proofs for custom components. Smaller bundle improves startup time.

---

## Scaling Strategy (1000+ Files, 100+ Folders)

### Backend

- **Parallel Scanning**: `jwalk` with Rayon utilizes all CPU cores for initial scan
- **Streaming Results**: `directory-page` events send 500-item chunks; frontend renders progressively
- **Watcher Limits**: On Linux, check `fs.inotify.max_user_watches` and warn user to increase limit if needed
- **Thread Pool**: File operations run on separate thread pool to avoid blocking Tauri's main thread

### Frontend

- **Windowed State**: Only expanded folders and their immediate children kept in Zustand
- **LRU Cache**: File contents evicted from memory after 10 minutes of inactivity
- **Search Worker**: Fuse.js index built in web worker; results limited to 1000 items with "Load More"
- **Debounced Search**: 200ms debounce on search input prevents excessive filtering

### Performance Targets

- **Initial Load**: First 100 files render in <200ms
- **Folder Expand**: 500 children load in <100ms
- **Search**: Fuzzy search 10k files in <50ms
- **Memory**: <100MB for 10k file tree structure
- **IPC**: Individual messages <1MB, batched updates <5MB

---

## Technology Stack Justification

| Layer              | Technology              | Reason                                                              |
| ------------------ | ----------------------- | ------------------------------------------------------------------- |
| **Backend**        | Rust                    | Zero-cost abstractions, memory safety, excellent Tauri integration  |
| **FS Watch**       | notify + debouncer-mini | Cross-platform, battle-tested, debounce prevents UI thrash          |
| **Parallelism**    | jwalk + Rayon           | Multi-core scanning speeds up large directories 3-5x                |
| **Frontend**       | React 18                | Concurrent features (`startTransition`) for responsive UI           |
| **State**          | Zustand                 | Minimal boilerplate, granular selectors, small bundle               |
| **UI**             | shadcn/ui               | Headless components, customizable, native desktop aesthetic         |
| **Editor**         | MDXEditor               | Native markdown, MDX support, TypeScript, lighter than alternatives |
| **Virtualization** | react-window            | Battle-tested, small API surface, works with dynamic heights        |
| **Styling**        | Tailwind CSS            | Rapid development, consistent design system with shadcn             |

---

## Implementation Order

1. **Setup**: Tauri init, Rust project structure, React + Vite setup
2. **Core FS**: `explorer.rs` + `operations.rs` with unit tests
3. **Commands**: Expose basic CRUD commands; test via Tauri invoke
4. **Frontend State**: Zustand store with basic tree rendering (non-virtualized)
5. **MDXEditor**: Integrate editor with manual save button
6. [x] **Auto-save**: Implement debounce + temp file logic (Done: 300ms debounce + manual save option)
   - *Note*: Added conflict detection todo for step 7
7. **Watcher**: Add `notify` integration; emit events to frontend
8. **Virtualization**: Add react-window to tree view
9. [x] **Optimistic Updates**: Implement rollback logic + toast notifications (Done: Full implementation with undo support)
   - *Implementation Details*:
     - **Operation Tracking**: Added `PendingOperation` interface with operation ID, type, timestamp, and tree snapshots for rollback
     - **Optimistic UI Updates**: File/folder operations update UI immediately before backend confirmation
     - **Rollback System**: Uses `structuredClone()` for tree snapshots; restores state on operation failure
     - **Undo Capability**: 5-second window to undo delete operations via toast action button
     - **Watcher Reconciliation**: Ignores watcher events for pending operations to prevent duplicate updates and flickering
     - **Toast Integration**: Uses `toast.promise()` for loading/success/error states with retry actions
     - **UI Components**: Context menu (right-click), inline rename, toolbar buttons, Delete key support
     - **Error Handling**: User-friendly error messages, unsaved changes confirmation, concurrent operation prevention
     - **Stale Operation Cleanup**: Automatic cleanup every 5 seconds for operations exceeding 10-second timeout
   - *Architecture Decisions*:
     - No confirmation modals for delete (undo button instead) - modern UX pattern
     - F2 rename via context menu only (inline state management complexity)
     - Ignore watcher events for pending ops (prevents flicker, keeps optimistic state)
     - `formatApiError()` utility parses backend errors for actionable messages
10. **Polish**: Resizable sidebar, search, conflict modal, performance profiling

This design provides a solid foundation for a native-speed markdown editor that scales to enterprise file structures while maintaining security and developer ergonomics.

---

## Known Issues & Fix Plan (January 2026)

### Overview
This section documents bugs discovered during initial manual testing after implementing the 6 user-reported issues. Four issues require fixes before production release.

---

### 🔴 Issue #1: File Watcher Toast Spam (CRITICAL)

**Status**: Requires fix before production  
**Priority**: P0 - Critical UX bug  
**Affected Features**: Auto-save, file opening, external file changes

#### Symptoms
- Toast "File was updated - File reloaded automatically" appears on auto-save (should be silent)
- Toast appears when opening files (spurious notification)
- Multiple toasts appear during rapid file operations

#### Root Cause
Despite implementing `pendingSaveOperation` and `pendingLoadOperation` tracking in `editorStore.ts`, race conditions persist due to:
1. **File watcher debouncing**: Rust backend debounces events by 100ms (`notify-debouncer-mini`)
2. **Timing gaps**: Save operation completes → tracking flag cleared → debounced watcher event arrives 50-100ms later → toast shown
3. **Metadata changes**: File modified timestamp changes even when content unchanged, triggering watcher
4. **Multi-source updates**: Multiple concurrent saves tracked only by last operation

#### Attempted Fixes (Did Not Work)
- Added `pendingSaveOperation` tracking in `src/stores/editorStore.ts:231`
- Added `pendingLoadOperation` tracking in `src/stores/editorStore.ts:151`
- Early returns in `handleFileModified` when flags set (lines 285-294)

#### Architectural Flaw
The file watcher coordination pattern is inherently complex:
- Requires perfect synchronization between async operations (save/load) and async events (watcher)
- No reliable way to distinguish "our change" vs "external change" after operation completes
- Adds 200+ lines of coordination code across multiple stores

#### Decision: Remove File Watcher Entirely

**User Preference**: Full removal with manual reload system

**Rationale**:
- Eliminates all race conditions permanently
- Reduces complexity (removes 200+ lines of coordination code)
- Reduces memory/CPU overhead (no background watcher)
- Clear mental model for users: "Reload to see external changes"
- Common pattern in many desktop text editors

#### Implementation Plan

**Phase 1: Frontend Removal** (45 minutes)

1. **Delete file watcher hook**
   - File: `src/hooks/useFileWatcher.ts` (85 lines) - DELETE ENTIRE FILE

2. **Remove watcher setup from App**
   - File: `src/App.tsx`
   - Lines 18, 24-28: Remove imports for watcher handlers
   - Lines 45-58: Remove `useFileWatcher` hook call
   - Impact: ~20 lines removed

3. **Remove watcher handlers from fileTreeStore**
   - File: `src/stores/fileTreeStore.ts`
   - Remove functions:
     - `handleFileCreated` (lines ~330-360)
     - `handleFileModified` (lines ~362-390)
     - `handleFileDeleted` (lines ~377-395)
   - Remove from interface: Lines ~115-120
   - Impact: ~80 lines removed

4. **Remove watcher handlers from editorStore**
   - File: `src/stores/editorStore.ts`
   - Remove functions:
     - `handleFileModified` (lines 276-324)
     - `handleFileDeleted` (lines 327-346)
   - Remove fields:
     - `pendingSaveOperation` (lines ~50, ~143, ~231, ~240, ~247)
     - `pendingLoadOperation` (lines ~51, ~143, ~151, ~176)
   - Remove from interface: Lines ~106
   - Impact: ~90 lines removed + ~10 lines simplified

5. **Add manual reload UI**
   - File: `src/components/FileTree/FileTreeToolbar.tsx`
   - Add `RefreshCw` icon import from lucide-react
   - Add button:
     ```tsx
     <Button
       variant="ghost"
       size="icon"
       onClick={() => loadRootDirectory()}
       title="Reload file tree (Ctrl+R)"
     >
       <RefreshCw className="w-4 h-4" />
     </Button>
     ```
   - Impact: ~10 lines added

6. **Add keyboard shortcut**
   - File: `src/App.tsx`
   - Add global keydown listener in useEffect:
     ```tsx
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
           e.preventDefault();
           useFileTreeStore.getState().loadRootDirectory();
         }
       };
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, []);
     ```
   - Impact: ~10 lines added

**Phase 2: Backend Cleanup** (Optional - 30 minutes)

Backend watcher can remain (harmless) or be removed for cleaner codebase:

1. **Remove watcher initialization**
   - File: `src-tauri/src/main.rs`
   - Remove watcher setup code in app builder
   
2. **Remove watcher module**
   - File: `src-tauri/src/watcher.rs` - DELETE or comment out
   
3. **Remove dependencies** (optional)
   - File: `src-tauri/Cargo.toml`
   - Remove: `notify`, `notify-debouncer-mini`

**Files Modified**: 6 frontend, ~3 backend (optional)  
**Lines Changed**: ~200 removed, ~20 added  
**Risk**: MODERATE - Large refactor but reduces complexity  

#### Testing After Fix
1. ✅ Auto-save a file → No toast should appear
2. ✅ Open different files rapidly → No toasts
3. ✅ Edit file externally (VS Code) while app open → No toast until manual reload
4. ✅ Click "Reload Tree" button → Tree updates
5. ✅ Press Ctrl+R → Tree reloads
6. ✅ External changes appear after reload

---

### ⚠️ Issue #2: MDX Toolbar Icons Gray in Dark Mode (MINOR)

**Status**: Cosmetic issue, easy fix  
**Priority**: P2 - Minor visual bug  
**Affected Features**: MDXEditor toolbar in dark mode

#### Symptoms
- MDXEditor toolbar icons appear as gray squares/unreadable in dark mode
- Light mode icons display correctly

#### Root Cause
- MDXEditor's default CSS doesn't respond to our CSS variables
- File: `src/index.css` lines 134-137
- Current styling only sets background/border, not icon colors:
  ```css
  .mdx-editor-container .mdxeditor-toolbar {
    background-color: var(--muted) !important;
    border-bottom: 1px solid var(--border) !important;
  }
  ```

#### Fix
Add CSS to target toolbar button SVG icons:

```css
/* MDXEditor toolbar icons */
.mdx-editor-container .mdxeditor-toolbar button svg {
  color: var(--foreground);
}

.mdx-editor-container .mdxeditor-toolbar button[data-state="on"] svg {
  color: var(--primary);
}
```

**Files Modified**: 1 (`src/index.css`)  
**Lines Changed**: +6 lines  
**Risk**: LOW - Pure CSS change, no logic affected  
**Estimated Time**: 5 minutes

---

### ⚠️ Issue #3: Inline Creation Visual Hierarchy (MINOR UX)

**Status**: Functional but confusing UX  
**Priority**: P2 - UX polish  
**Affected Features**: Inline file/folder creation

#### Symptoms
When creating a file/folder inside an existing folder (right-click folder → "New File"), the input field appears at the same indentation level as the folder itself, making it unclear that the item will be created *inside* the folder rather than as a sibling.

**Expected**: Input indented one level deeper (as a child)  
**Actual**: Input at same level (appears as sibling)

#### Root Cause
- File: `src/components/FileTree/FileTreeVirtualized.tsx` lines 69-88
- Depth calculation in `extendedFlatNodes` memo:
  ```typescript
  if (creationState.insertAfterPath) {
    const afterIndex = flatNodes.findIndex(fn => fn.node.path === creationState.insertAfterPath);
    if (afterIndex !== -1) {
      insertionIndex = afterIndex + 1;
      depth = flatNodes[afterIndex].depth + (flatNodes[afterIndex].node.is_file ? 0 : 1);
    }
  }
  ```
- The logic adds +1 depth for folders, BUT visually the input still appears "after" the folder node rather than "inside" it

#### Fix
Adjust depth calculation to properly indent when creating inside a folder:

```typescript
if (creationState.insertAfterPath) {
  const afterIndex = flatNodes.findIndex(fn => fn.node.path === creationState.insertAfterPath);
  if (afterIndex !== -1) {
    insertionIndex = afterIndex + 1;
    const afterNode = flatNodes[afterIndex].node;
    
    // If creating inside a folder (parentPath === insertAfterPath), indent deeper
    if (creationState.parentPath === creationState.insertAfterPath && !afterNode.is_file) {
      depth = flatNodes[afterIndex].depth + 1;
    } else {
      // Creating after a sibling file, use same depth
      depth = flatNodes[afterIndex].depth;
    }
  }
}
```

**Files Modified**: 1 (`src/components/FileTree/FileTreeVirtualized.tsx`)  
**Lines Changed**: ~10 lines modified (lines 72-78)  
**Risk**: LOW - Simple arithmetic fix, well-isolated  
**Estimated Time**: 10 minutes

#### Testing After Fix
1. Right-click folder → "New File" → Input should be indented +1 level
2. Right-click file → "New File" → Input should be at same level as file
3. Toolbar "New File" → Input should be at correct depth based on active node

---

### ⚠️ Issue #4: Delete Undo Doesn't Restore File Contents (MODERATE)

**Status**: Feature incomplete  
**Priority**: P1 - Important feature completion  
**Affected Features**: Delete undo functionality

#### Symptoms
When deleting a file and clicking "Undo" within 5 seconds:
- ✅ File is recreated in correct location
- ❌ File content is lost (empty file created)

#### Root Cause
- File: `src/stores/undoStore.ts` line 100
- Undo logic calls `api.createFile(action.path)` which creates empty file
- The `UndoableAction` interface stores only `FileNode` metadata, not file content
- File content never read before deletion

Current flow:
1. User deletes file → `deleteNodeOptimistic` stores `FileNode` in undo action (line 724)
2. User clicks Undo → `undo()` calls `createFile()` → empty file created
3. Original content is lost

#### Fix Strategy
Store file content in undo action for deleted files

**Implementation**:

1. **Update `UndoableAction` interface** (`src/stores/undoStore.ts`)
   ```typescript
   interface UndoableAction {
     id: string;
     type: 'delete';
     path: string;
     node: FileNode;
     timestamp: number;
     content?: string;  // NEW: File content for restoration
   }
   ```

2. **Modify `deleteNodeOptimistic`** (`src/stores/fileTreeStore.ts` lines 682-770)
   ```typescript
   deleteNodeOptimistic: async (path: string) => {
     // ... existing code ...
     
     const node = findNodeByPath(get().nodes, path);
     if (!node) {
       toast.error("File not found");
       return;
     }

     // NEW: Read file content before deletion (if it's a file)
     let fileContent: string | undefined;
     if (node.is_file) {
       try {
         fileContent = await api.readFile(path);
       } catch (error) {
         console.warn(`[FileTreeStore] Could not read file content for undo:`, error);
         // Continue with deletion even if read fails
       }
     }

     // ... existing confirmation checks ...

     // Add to undo stack with content
     const undoAction = {
       id: operationId,
       type: 'delete' as const,
       path,
       node: structuredClone(node),
       timestamp: Date.now(),
       content: fileContent,  // NEW: Include content
     };
     useUndoStore.getState().addUndoAction(undoAction);

     // ... rest of function ...
   }
   ```

3. **Update undo logic** (`src/stores/undoStore.ts` lines 97-107)
   ```typescript
   undo: async () => {
     const { undoStack } = get();
     
     if (undoStack.length === 0) {
       console.warn('[UndoStore] No actions to undo');
       return;
     }

     const action = undoStack[undoStack.length - 1];
     get().removeUndoAction(action.id);

     try {
       if (action.type === 'delete') {
         if (action.node.is_file) {
           // NEW: Restore with content if available
           if (action.content !== undefined) {
             await api.writeFile(action.path, action.content);
           } else {
             // Fallback: create empty file
             await api.createFile(action.path);
           }
         } else {
           // Folders: create empty folder
           await api.createFolder(action.path);
         }
         console.log(`[UndoStore] Undid delete of ${action.path}`);
       }
     } catch (error) {
       console.error('[UndoStore] Failed to undo action:', error);
       throw error;
     }
   }
   ```

**Files Modified**: 2
- `src/stores/undoStore.ts` - Interface + undo logic (~15 lines changed)
- `src/stores/fileTreeStore.ts` - Delete operation to capture content (~20 lines changed)

**Memory Impact**: 
- Stores file content for 5 seconds (UNDO_WINDOW_MS)
- Typical markdown file: 10-50KB
- Maximum memory overhead: ~50KB × concurrent deletes (negligible)

**Risk**: MODERATE
- Adds async read operation before delete (potential latency)
- Needs proper error handling if read fails
- Should not block delete if content read fails

**Estimated Time**: 30 minutes

#### Testing After Fix
1. ✅ Delete file with content → Undo → File restored with original content
2. ✅ Delete empty file → Undo → Empty file restored
3. ✅ Delete folder → Undo → Folder restored (content not applicable)
4. ✅ Delete file, wait 6 seconds, undo → Should fail gracefully (expired)
5. ✅ Delete file with large content (>1MB) → Should not timeout

---

## Implementation Priority & Timeline

### Recommended Order

1. **Issue #2 - MDX Icons** (5 min)
   - Quick win, immediate visual improvement
   - Zero risk, pure CSS change
   - Can be done in parallel with planning other fixes

2. **Issue #3 - Inline Indent** (10 min)
   - Low risk, isolated change
   - UX polish before larger refactor
   - Can be done in parallel

3. **Issue #1 - Remove File Watcher** (45 min)
   - Largest change but reduces complexity
   - Fixes critical UX bug
   - Must test thoroughly before moving to next

4. **Issue #4 - Delete Undo Content** (30 min)
   - Completes undo feature properly
   - Moderate risk, requires careful error handling
   - Should be done after file watcher removal (simpler testing)

**Total Estimated Time**: ~90 minutes

### Testing Checklist After All Fixes

#### Manual Testing
- [ ] Dark mode toolbar icons visible and correct color
- [ ] Inline creation indentation correct for folders/files
- [ ] Auto-save doesn't show toast
- [ ] Opening files doesn't show toast
- [ ] External file changes don't show toast until manual reload
- [ ] Ctrl+R reloads tree
- [ ] Reload button works in toolbar
- [ ] Delete file → Undo restores content
- [ ] Delete folder → Undo restores structure
- [ ] Undo after 6 seconds expires gracefully

#### Build Verification
```bash
bun run build
bun run tauri build
```

#### Performance Regression Check
- [ ] Initial load time unchanged (<200ms for 100 files)
- [ ] Memory usage reduced (no watcher overhead)
- [ ] CPU usage reduced (no background watcher)

---

## Architecture Changes

### Before (With File Watcher)
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌─────────────┐        ┌──────────────┐       │
│  │ EditorStore │◄───────┤ FileTreeStore│       │
│  └──────▲──────┘        └───────▲──────┘       │
│         │                       │               │
│         │ handleFileModified()  │               │
│         │                       │               │
│  ┌──────┴───────────────────────┴──────┐       │
│  │      useFileWatcher Hook             │       │
│  └──────────────▲───────────────────────┘       │
└─────────────────┼───────────────────────────────┘
                  │ fs:event
┌─────────────────┼───────────────────────────────┐
│  ┌──────────────▼───────────────────────────┐  │
│  │   File Watcher (notify + debouncer)      │  │
│  │   - Watches all files recursively         │  │
│  │   - Debounces events (100ms)              │  │
│  │   - Emits: Created/Modified/Deleted       │  │
│  └───────────────────────────────────────────┘  │
│                   Backend                        │
└─────────────────────────────────────────────────┘

Issues:
- Race conditions between operation tracking and watcher
- 200+ lines of coordination code
- Memory/CPU overhead from watcher
- Complex state synchronization
```

### After (Manual Reload)
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌─────────────┐        ┌──────────────┐       │
│  │ EditorStore │        │ FileTreeStore│       │
│  └─────────────┘        └───────▲──────┘       │
│                                 │               │
│                                 │               │
│  ┌──────────────────────────────┴──────┐       │
│  │   Manual Reload (Ctrl+R / Button)   │       │
│  │   - User-initiated                   │       │
│  │   - Explicit, predictable            │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
                  │ invoke("read_directory")
┌─────────────────▼───────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │   File Operations (no watcher)            │  │
│  │   - Read directory on demand               │  │
│  │   - No background processes                │  │
│  │   - Simpler, more predictable              │  │
│  └───────────────────────────────────────────┘  │
│                   Backend                        │
└─────────────────────────────────────────────────┘

Benefits:
- Zero race conditions
- 200+ lines of code removed
- Lower memory/CPU usage
- Clear mental model for users
- Simpler testing and maintenance
```

---

## Related Documentation

- Original issue report: See git commit history for user-reported issues 1-6
- Optimistic updates implementation: See PLAN.md lines 253-269
- Auto-save implementation: See PLAN.md line 249

---

*Last updated: January 30, 2026*
