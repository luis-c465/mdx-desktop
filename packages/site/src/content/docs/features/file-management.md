---
title: File Management
description: Navigate and manage your markdown files with MDX Desktop's efficient file tree.
---

MDX Desktop provides a powerful file management system designed for handling collections of markdown files efficiently. The file tree makes it easy to organize and navigate your projects, whether you're managing a handful of files or extensive documentation.

## File Tree Overview

The file tree is displayed in the left sidebar and provides:

- **Hierarchical navigation**: Browse files and folders in a clear structure
- **Lazy loading**: Only loads content as you need it for optimal performance
- **Smooth scrolling**: Navigate large folder structures easily
- **Context menu**: Right-click for quick file operations
- **Keyboard navigation**: Navigate without touching the mouse

{/* TODO: Add file tree screenshot here */}

## Opening a Folder

To start working with files, you need to open a folder:

1. Click **"Open Folder"** button or use `Ctrl/Cmd + O`
2. System file picker appears
3. Select the folder containing your markdown files
4. File tree populates with the folder contents

:::tip[Choose the Right Folder]
Open the **root folder** of your markdown project, not individual files. MDX Desktop works with entire folder structures.
:::

## Navigating the File Tree

### Expanding and Collapsing Folders

- **Click the arrow icon** (►) next to a folder to expand it
- **Click again** to collapse the folder
- **Keyboard**: Use `→` to expand, `←` to collapse

Folder contents are loaded when you expand them, keeping initial load times fast.

### Opening Files

- **Single click** a file to open it in the editor
- **File activates** immediately, previous file is saved automatically
- **No "unsaved changes" prompts**: Auto-save handles everything seamlessly

### Keyboard Navigation

| Action | Keyboard Shortcut |
|--------|-------------------|
| Move up | `↑` or `K` |
| Move down | `↓` or `J` |
| Expand folder | `→` or `L` |
| Collapse folder | `←` or `H` |
| Open selected file | `Enter` |
| Go to parent folder | `Backspace` |

:::tip[Vim-style Navigation]
Use `J` and `K` for up/down if you prefer Vim-style key bindings!
:::

## File Operations

### Creating New Files

**Method 1: Context Menu**
1. Right-click on a folder
2. Select **"New File"**
3. Type the filename (include `.md` extension)
4. Press `Enter`

**Method 2: Keyboard Shortcut**
- Press `Ctrl/Cmd + N`
- File is created in the currently selected folder
- File opens automatically in the editor

**Naming conventions**:
- Use `.md` or `.markdown` extensions
- Avoid special characters: `/ \ : * ? " < > |`
- Spaces are allowed but hyphens are recommended: `my-file.md`

### Creating New Folders

1. Right-click in the file tree
2. Select **"New Folder"**
3. Type the folder name
4. Press `Enter`

**Keyboard shortcut**: `Ctrl/Cmd + Shift + N`

### Renaming Files and Folders

**Method 1: Context Menu**
1. Right-click the file or folder
2. Select **"Rename"**
3. Edit the name
4. Press `Enter` to confirm

**Method 2: Keyboard Shortcut**
1. Select the file or folder
2. Press `F2`
3. Edit the name
4. Press `Enter`

:::note[Renaming Open Files]
If you rename a file that's currently open in the editor, it will automatically reload with the new name. Your content is preserved.
:::

### Deleting Files and Folders

**Method 1: Context Menu**
1. Right-click the file or folder
2. Select **"Delete"**
3. Confirm the deletion in the dialog

**Method 2: Keyboard Shortcut**
1. Select the file or folder
2. Press `Delete` or `Backspace`
3. Confirm the deletion

**Safety features**:
- Files are sent to system trash/recycle bin (not permanently deleted)
- Confirmation dialog prevents accidental deletion
- Protected against deleting files with unsaved changes

:::tip[Recovering Deleted Files]
Check your system's trash/recycle bin if you accidentally delete a file. Files are not permanently erased.
:::

## Efficient File Tree Features

### Lazy Loading

The file tree uses lazy loading to maintain responsiveness:

- **Initial files** load immediately when you open a folder
- **Additional files** load when folders are expanded
- **Nested content** loads only when parent folders are expanded

This approach ensures fast loading times regardless of project size.

### File Type Icons

Files and folders have distinct icons:

- 📁 **Folder** (collapsed)
- 📂 **Folder** (expanded)
- 📄 **Markdown file** (`.md`, `.markdown`)
- 📄 **Text file** (`.txt`)
- 📄 **Other files** (generic icon)

### Active File Highlighting

The currently open file is highlighted in the tree:

- **Background color** distinguishes the active file
- **Automatic scrolling** to keep active file visible
- **Easy to locate** your current position in projects

### File Metadata Display

Hover over a file to see:

- **Full file path**
- **File size**
- **Last modified date**

### Sorting

Files and folders are sorted automatically:

1. **Folders first**, then files
2. **Alphabetically** by name
3. **Case-insensitive** sorting

## Working with Multiple Folders

Currently, MDX Desktop can open one root folder at a time.

**To switch between projects**:
1. Close the current folder (`Ctrl/Cmd + W`)
2. Open a different folder (`Ctrl/Cmd + O`)
3. Your previous project can be reopened anytime

## Tips for Organizing Files

1. **Use folders liberally**: Organize files into logical categories
2. **Consistent naming**: Use lowercase-with-hyphens: `my-file-name.md`
3. **Date prefixes**: For dated notes: `2026-02-02-daily-notes.md`
4. **Index files**: Use `README.md` or `index.md` as folder overviews
5. **Avoid deep nesting**: Keep folder structures simple (3-4 levels max)

## Context Menu Reference

Right-click menu options:

| Option | Action | Keyboard Shortcut |
|--------|--------|-------------------|
| New File | Create file in folder | `Ctrl/Cmd + N` |
| New Folder | Create subfolder | `Ctrl/Cmd + Shift + N` |
| Rename | Rename file/folder | `F2` |
| Delete | Move to trash | `Delete` |
| Copy Path | Copy full file path | - |
| Reveal in File Manager | Open in system file browser | - |

## Best Practices for Large Projects

When working with extensive markdown collections:

### Navigation Strategy

1. **Keep folders collapsed** when not actively using them
2. **Use keyboard shortcuts** for faster navigation
3. **Organize hierarchically** with clear folder structures
4. **Use naming conventions** for easy sorting

### File Organization

Create a consistent structure like:

```
docs/
├── README.md              (start here)
├── getting-started/       (new user content)
├── guides/                (how-to articles)
├── reference/             (detailed specs)
└── assets/                (images, files)
```

Benefits:
- **Predictable structure**: Easy to find content
- **Scalable**: Add more sections as needed
- **Collaborative**: Team members know where to put new content

### Naming Conventions

**For dated content**:
```
journal/
├── 2026-01-15-meeting-notes.md
├── 2026-01-20-project-update.md
└── 2026-02-02-daily-standup.md
```

**For topic-based content**:
```
notes/
├── programming-python.md
├── programming-rust.md
└── design-patterns.md
```

## Related Documentation

- [Markdown Editor](/features/editor/) - Editing file content
- [Quick Start](/getting-started/quick-start/) - Basic file operations walkthrough
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Complete shortcut reference
- [Basic Usage](/guides/basic-usage/) - Workflow examples
