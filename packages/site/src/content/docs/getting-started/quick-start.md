---
title: Quick Start
description: Learn the basics of MDX Desktop in just a few minutes.
---

This guide will walk you through your first session with MDX Desktop, from opening a folder to editing markdown files.

## Opening Your First Project

1. **Launch MDX Desktop**
2. **Click "Open Folder"** in the welcome screen (or use `Ctrl/Cmd + O`)
3. **Select a folder** containing markdown files
   - If you don't have one, create a new folder and add a test file: `test.md`
4. **Wait for the file tree to load**
   - Large folders (1000+ files) may take a few seconds

:::tip[Recommended Test Folder]
Create a test folder with a few markdown files to experiment with:
```bash
mkdir ~/mdx-test
cd ~/mdx-test
echo "# Welcome to MDX Desktop" > README.md
echo "# My First Note" > note.md
```
Then open `~/mdx-test` in MDX Desktop.
:::

## Understanding the Interface

MDX Desktop has a clean, three-panel layout:

### Left Sidebar: File Tree
- **Browse** your markdown files and folders
- **Expand/collapse** folders by clicking the arrow icon
- **Click a file** to open it in the editor
- **Right-click** for context menu options (create, rename, delete)

### Center Panel: Editor
- **Edit** your markdown with WYSIWYG formatting
- **Auto-save** is active (saves after 300ms of inactivity)
- **Format text** using the toolbar or markdown syntax
- **Status bar** at bottom shows file path and save status

### Right Panel: Preview (Optional)
- Currently focuses on editing experience
- Preview features may be added in future updates

:::note[Auto-Save]
MDX Desktop automatically saves your changes. You'll see "Saved" in the status bar when auto-save completes. No need to manually save!
:::

## Creating Files and Folders

### Create a New File

1. **Right-click** on a folder in the file tree
2. Select **"New File"**
3. Type the filename (include `.md` extension)
4. Press `Enter`
5. The new file opens in the editor automatically

**Keyboard shortcut**: `Ctrl/Cmd + N` (creates file in current folder)

### Create a New Folder

1. **Right-click** on a folder or empty space
2. Select **"New Folder"**
3. Type the folder name
4. Press `Enter`

### Rename Files or Folders

1. **Right-click** the file or folder
2. Select **"Rename"**
3. Type the new name
4. Press `Enter`

**Keyboard shortcut**: `F2` (when file/folder is selected)

### Delete Files or Folders

1. **Right-click** the file or folder
2. Select **"Delete"**
3. Confirm the deletion

**Keyboard shortcut**: `Delete` or `Backspace` (when selected)

:::caution[Deletion is Permanent]
Deleted files are sent to your system's trash/recycle bin, but be careful! Always double-check before deleting.
:::

## Editing Markdown

### Formatting Text

MDX Desktop supports all standard markdown syntax:

**Bold text**: `**bold**` or use the toolbar button
*Italic text*: `*italic*` or use the toolbar button
`Code`: `` `code` `` or use the toolbar button

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
```

Or use `Ctrl/Cmd + 1`, `Ctrl/Cmd + 2`, `Ctrl/Cmd + 3`

### Lists

**Unordered list**:
```markdown
- Item 1
- Item 2
  - Nested item
```

**Ordered list**:
```markdown
1. First
2. Second
3. Third
```

### Links and Images

**Link**: `[Link text](https://example.com)`
**Image**: `![Alt text](./image.png)`

### Code Blocks

Use triple backticks for code blocks:

````markdown
```javascript
function hello() {
  console.log("Hello, MDX Desktop!");
}
```
````
## Next Steps

Now that you know the basics, explore more features:

- [Markdown Editor Features](/features/editor/) - Learn about the editor's capabilities
- [File Management](/features/file-management/) - Advanced file tree operations
- [Basic Usage Guide](/guides/basic-usage/) - Detailed workflow examples

:::tip[Pro Tip]
Press `Ctrl/Cmd + K` to open the command palette (if available) for quick access to all features!
:::

## Need Help?

- Check the [FAQ](/reference/faq/) for common questions
- [Report an issue](https://github.com/luis-c465/mdx-desktop/issues) on GitHub
- [Join discussions](https://github.com/luis-c465/mdx-desktop/discussions) with other users
