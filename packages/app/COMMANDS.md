# Tauri Commands Documentation

This document describes all available Tauri commands exposed by the MDX Desktop application.

## Architecture Overview

The command layer provides a secure bridge between the React frontend and Rust backend. All commands:

- **Validate paths** against the current workspace to prevent directory traversal attacks
- **Use async I/O** with `tokio::task::spawn_blocking` for non-blocking operations
- **Return structured errors** with user-friendly messages
- **Require a workspace** to be set before file operations (except `show_open_dialog`)

## State Management

The application maintains workspace state that persists across app restarts:

```rust
pub struct AppState {
    workspace_dir: Option<PathBuf>,    // Currently open workspace
    last_dialog_dir: Option<PathBuf>,  // Last folder picker location
}
```

Configuration is saved to `~/.local/share/mdx-desktop/config.json` (or equivalent per-platform data directory).

## Commands

### Workspace Commands

#### `show_open_dialog() -> Result<String>`

Opens a native folder picker dialog. When a folder is selected:
- Sets it as the active workspace
- Saves to config for persistence
- Returns the absolute path

**Example:**
```javascript
const workspacePath = await invoke('show_open_dialog')
console.log('Workspace:', workspacePath)
```

#### `get_workspace() -> Result<Option<String>>`

Returns the currently open workspace path, if any.

**Example:**
```javascript
const workspace = await invoke('get_workspace')
if (workspace) {
  console.log('Current workspace:', workspace)
}
```

#### `clear_workspace() -> Result<()>`

Closes the current workspace. File operations will fail until a new workspace is opened.

**Example:**
```javascript
await invoke('clear_workspace')
```

---

### File Operations

All file paths are **relative to the workspace directory**.

#### `read_file(path: String) -> Result<String>`

Reads file content as a UTF-8 string.

**Parameters:**
- `path`: Relative path to file (e.g., `"notes/hello.md"`)

**Returns:** File contents as string

**Errors:**
- No workspace open
- File not found
- File too large (>4GB)
- Permission denied

**Example:**
```javascript
const content = await invoke('read_file', { path: 'notes/hello.md' })
console.log(content)
```

#### `write_file(path: String, content: String) -> Result<()>`

Writes content to a file atomically (using temp file + rename).

**Parameters:**
- `path`: Relative path to file
- `content`: Content to write

**Example:**
```javascript
await invoke('write_file', {
  path: 'notes/hello.md',
  content: '# Hello World\n\nThis is markdown.'
})
```

#### `create_file_command(path: String) -> Result<()>`

Creates a new empty file.

**Parameters:**
- `path`: Relative path for new file

**Errors:**
- File already exists
- Parent directory doesn't exist

**Example:**
```javascript
await invoke('create_file_command', { path: 'new-note.md' })
```

#### `rename_path_command(oldPath: String, newPath: String) -> Result<()>`

Renames or moves a file or directory.

**Parameters:**
- `oldPath`: Current relative path
- `newPath`: New relative path

**Note:** Handles cross-device moves by copy + delete.

**Example:**
```javascript
await invoke('rename_path_command', {
  oldPath: 'old-name.md',
  newPath: 'new-name.md'
})
```

#### `delete_path_command(path: String) -> Result<()>`

Deletes a file or directory (recursively for directories).

**Parameters:**
- `path`: Relative path to delete

**Example:**
```javascript
await invoke('delete_path_command', { path: 'old-note.md' })
```

---

### Directory Operations

#### `create_folder_command(path: String) -> Result<()>`

Creates a new directory.

**Parameters:**
- `path`: Relative path for new directory

**Errors:**
- Directory already exists

**Example:**
```javascript
await invoke('create_folder_command', { path: 'new-folder' })
```

#### `read_directory(path: String, includeHidden: boolean) -> Result<FileNode>`

Reads a directory and returns a `FileNode` with immediate children (lazy loading).

**Parameters:**
- `path`: Relative path to directory (use `"."` or `""` for workspace root)
- `includeHidden`: Include hidden files (starting with `.`)

**Returns:**
```typescript
interface FileNode {
  path: string
  name: string
  is_file: boolean
  size?: number  // bytes, only for files
  modified?: number  // Unix timestamp
  children?: FileNode[]  // populated for directories
}
```

**Example:**
```javascript
const dirNode = await invoke('read_directory', {
  path: '.',
  includeHidden: false
})

console.log('Files:', dirNode.children.filter(n => n.is_file))
console.log('Folders:', dirNode.children.filter(n => !n.is_file))
```

#### `get_directory_page(path: String, offset: number, limit: number, includeHidden: boolean) -> Result<DirectoryPage>`

Returns a paginated slice of directory entries (for large directories).

**Parameters:**
- `path`: Relative path to directory
- `offset`: Number of items to skip
- `limit`: Maximum items to return
- `includeHidden`: Include hidden files

**Returns:**
```typescript
interface DirectoryPage {
  nodes: FileNode[]
  total_count: number
  has_more: boolean
}
```

**Example:**
```javascript
// Get first 100 items
const page1 = await invoke('get_directory_page', {
  path: 'large-folder',
  offset: 0,
  limit: 100,
  includeHidden: false
})

if (page1.has_more) {
  // Get next 100
  const page2 = await invoke('get_directory_page', {
    path: 'large-folder',
    offset: 100,
    limit: 100,
    includeHidden: false
  })
}
```

---

## Error Handling

All commands return `Result<T, AppError>`. Errors are serialized to JSON:

```typescript
interface AppError {
  type: 'PermissionDenied' | 'InvalidPath' | 'FileNotFound' | 'PathTraversal' | 'IoError' | 'FileTooLarge'
  message: string
}
```

**Example error handling:**
```javascript
try {
  await invoke('read_file', { path: '../etc/passwd' })
} catch (error) {
  // error.type === 'PathTraversal'
  // error.message === 'Path attempts to escape base directory: ../etc/passwd'
  console.error('Failed:', error.message)
}
```

---

## Security

### Path Validation

All paths are validated to prevent directory traversal:

1. Paths containing `..` are rejected
2. Paths are canonicalized to absolute paths
3. Final path must start with workspace directory

**Allowed:**
- `notes/hello.md`
- `folder/subfolder/file.md`
- `./relative/path.md`

**Blocked:**
- `../etc/passwd` (traversal)
- `/absolute/path.md` (outside workspace)
- `folder/../../../etc/passwd` (traversal)

### Future Extension

The path validation is designed to support individual file access outside the workspace:

```rust
// Future: Support for allowed_paths
pub struct AppConfig {
    workspace_dir: Option<PathBuf>,
    allowed_paths: Vec<PathBuf>,  // Individual files outside workspace
}
```

This will enable VS Code-like behavior where users can:
1. Open a workspace directory (current behavior)
2. Open individual files outside the workspace (future feature)

---

## Testing Commands

### Via Browser Console

1. Run `bun run tauri dev`
2. Open DevTools (F12)
3. Test commands in console:

```javascript
// Open workspace
const workspace = await window.__TAURI__.core.invoke('show_open_dialog')

// Create a file
await window.__TAURI__.core.invoke('create_file_command', { path: 'test.md' })

// Write content
await window.__TAURI__.core.invoke('write_file', {
  path: 'test.md',
  content: '# Test\n\nHello from console!'
})

// Read it back
const content = await window.__TAURI__.core.invoke('read_file', { path: 'test.md' })
console.log(content)

// List directory
const dir = await window.__TAURI__.core.invoke('read_directory', {
  path: '.',
  includeHidden: false
})
console.log(dir)
```

### Via UI

The app includes a command tester UI with buttons for each operation. Use it to:
1. Open a workspace
2. Create test files
3. Read/write content
4. List directories

---

## Implementation Notes

### Non-blocking I/O

All file operations use `tokio::task::spawn_blocking` to prevent blocking the main thread:

```rust
tokio::task::spawn_blocking(move || {
    tokio::runtime::Handle::current().block_on(async {
        read_file_content(&validated_path).await
    })
})
```

### Atomic Writes

File writes use atomic operations to prevent corruption:

1. Write to temporary file (`filename.md.tmp`)
2. Sync to disk
3. Atomically rename to target file
4. Clean up temp file on error

### State Persistence

Workspace configuration is saved after every change:

```rust
state.set_workspace(path)?;  // Saves to config.json automatically
```

Configuration location per platform:
- **Linux:** `~/.local/share/mdx-desktop/config.json`
- **macOS:** `~/Library/Application Support/mdx-desktop/config.json`
- **Windows:** `%APPDATA%\mdx-desktop\config.json`

---

## Next Steps (Future Features)

From PLAN.md step 7 onwards:

1. **File Watcher** (Step 7): Emit events when files change on disk
2. **Frontend State** (Step 4): Zustand store for file tree
3. **MDXEditor** (Step 5): Integrate markdown editor
4. **Auto-save** (Step 6): 300ms debounced saves
5. **Individual Files**: Support opening files outside workspace
