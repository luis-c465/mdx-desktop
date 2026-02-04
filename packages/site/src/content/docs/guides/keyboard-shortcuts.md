---
title: Keyboard Shortcuts
description: Complete keyboard shortcut reference for MDX Desktop.
---

Master these keyboard shortcuts to dramatically improve your productivity in MDX Desktop. Shortcuts work on Windows, Linux, and macOS (replace `Ctrl` with `Cmd` on macOS).

## Notation

- `Ctrl/Cmd` = Control on Windows/Linux, Command on macOS
- `Alt/Opt` = Alt on Windows/Linux, Option on macOS
- `Shift` = Shift key
- `+` = Press keys simultaneously
- `→` = Press keys in sequence

## Quick Reference

### Most Important Shortcuts

| Shortcut | Action | Category |
|----------|--------|----------|
| `Ctrl/Cmd + O` | Open Folder | File Operations |
| `Ctrl/Cmd + N` | New File | File Operations |
| `Ctrl/Cmd + S` | Manual Save | Editor |
| `Ctrl/Cmd + B` | Bold | Formatting |
| `Ctrl/Cmd + I` | Italic | Formatting |
| `Ctrl/Cmd + K` | Insert Link | Formatting |
| `F2` | Rename File | File Operations |
| `Delete` | Delete File | File Operations |

## File Operations

### Opening and Closing

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + O` | Open Folder | Opens system file picker to select a markdown folder |
| `Ctrl/Cmd + W` | Close Folder | Closes the currently open folder |
| `Ctrl/Cmd + Q` | Quit Application | Closes MDX Desktop (auto-saves all files first) |

### Creating Files and Folders

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + N` | New File | Creates a new markdown file in the selected folder |
| `Ctrl/Cmd + Shift + N` | New Folder | Creates a new folder in the selected location |

### File Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `F2` | Rename | Renames the selected file or folder |
| `Delete` | Delete | Moves selected file or folder to system trash |
| `Backspace` | Delete (alternate) | Same as Delete key (works on macOS) |
| `Ctrl/Cmd + C` | Copy Path | Copies the full file path to clipboard |
| `Ctrl/Cmd + Shift + C` | Copy Relative Path | Copies the relative path from project root |

## File Tree Navigation

### Moving Around

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` or `K` | Move Up | Selects the previous file/folder in the tree |
| `↓` or `J` | Move Down | Selects the next file/folder in the tree |
| `→` or `L` | Expand Folder | Expands the selected folder to show children |
| `←` or `H` | Collapse Folder | Collapses the selected folder to hide children |
| `Enter` | Open File | Opens the selected file in the editor |
| `Home` | Go to First | Jumps to the first item in the file tree |
| `End` | Go to Last | Jumps to the last visible item in the file tree |
| `Page Up` | Scroll Up | Scrolls the file tree up one page |
| `Page Down` | Scroll Down | Scrolls the file tree down one page |

:::tip[Vim-style Navigation]
If you're familiar with Vim, use `J`, `K`, `H`, `L` for navigation instead of arrow keys!
:::

### Quick Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|

| `Backspace` | Go to Parent | Navigates to the parent folder of the selected item |

## Editor Shortcuts

### Saving

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + S` | Manual Save | Forces an immediate save (normally auto-save handles this) |

:::note[Auto-Save]
MDX Desktop auto-saves after 300ms of inactivity, so manual saving is rarely needed. Use `Ctrl/Cmd + S` if you want to force an immediate save.
:::

### Text Formatting

| Shortcut | Action | Markdown Equivalent |
|----------|--------|---------------------|
| `Ctrl/Cmd + B` | Bold | `**text**` |
| `Ctrl/Cmd + I` | Italic | `*text*` |
| `Ctrl/Cmd + E` | Inline Code | `` `text` `` |
| `Ctrl/Cmd + Shift + X` | Strikethrough | `~~text~~` |
| `Ctrl/Cmd + K` | Insert Link | `[text](url)` |

### Headings

| Shortcut | Action | Markdown Equivalent |
|----------|--------|---------------------|
| `Ctrl/Cmd + Alt + 1` | Heading 1 | `# Heading` |
| `Ctrl/Cmd + Alt + 2` | Heading 2 | `## Heading` |
| `Ctrl/Cmd + Alt + 3` | Heading 3 | `### Heading` |
| `Ctrl/Cmd + Alt + 4` | Heading 4 | `#### Heading` |
| `Ctrl/Cmd + Alt + 5` | Heading 5 | `##### Heading` |
| `Ctrl/Cmd + Alt + 6` | Heading 6 | `###### Heading` |
| `Ctrl/Cmd + Alt + 0` | Paragraph | Removes heading formatting |

### Lists

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + Shift + 8` | Unordered List | Converts line to bulleted list |
| `Ctrl/Cmd + Shift + 7` | Ordered List | Converts line to numbered list |
| `Tab` | Indent List Item | Increases nesting level |
| `Shift + Tab` | Outdent List Item | Decreases nesting level |

### Text Selection

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + A` | Select All | Selects all text in the editor |
| `Shift + →` | Select Right | Extends selection one character right |
| `Shift + ←` | Select Left | Extends selection one character left |
| `Shift + ↑` | Select Up | Extends selection one line up |
| `Shift + ↓` | Select Down | Extends selection one line down |
| `Ctrl/Cmd + Shift + →` | Select Word Right | Extends selection one word right |
| `Ctrl/Cmd + Shift + ←` | Select Word Left | Extends selection one word left |
| `Shift + Home` | Select to Line Start | Selects from cursor to start of line |
| `Shift + End` | Select to Line End | Selects from cursor to end of line |

### Clipboard

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + C` | Copy | Copies selected text to clipboard |
| `Ctrl/Cmd + X` | Cut | Cuts selected text to clipboard |
| `Ctrl/Cmd + V` | Paste | Pastes from clipboard |
| `Ctrl/Cmd + Shift + V` | Paste Plain | Pastes without formatting (plain text) |

### Undo and Redo

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + Z` | Undo | Undoes the last change |
| `Ctrl/Cmd + Shift + Z` | Redo | Redoes the last undone change |
| `Ctrl/Cmd + Y` | Redo (alternate) | Same as redo (Windows/Linux) |

### Find and Replace

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + F` | Find in File | Opens find dialog to search in current file |
| `Ctrl/Cmd + H` | Replace in File | Opens find-and-replace dialog |
| `F3` or `Ctrl/Cmd + G` | Find Next | Jumps to next search result |
| `Shift + F3` or `Ctrl/Cmd + Shift + G` | Find Previous | Jumps to previous search result |

### Lines and Blocks

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + D` | Duplicate Line | Duplicates the current line or selection |
| `Ctrl/Cmd + Shift + K` | Delete Line | Deletes the current line |
| `Ctrl/Cmd + ]` | Indent | Indents the current line or selection |
| `Ctrl/Cmd + [` | Outdent | Outdents the current line or selection |
| `Ctrl/Cmd + /` | Toggle Comment | Adds/removes comment (wraps in `<!-- -->`) |

## Application Shortcuts

### View and Layout

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + B` | Toggle Sidebar | Shows/hides the file tree sidebar (if available) |
| `Ctrl/Cmd + \\` | Split Editor | Splits editor into two panes (if available) |
| `F11` | Fullscreen | Toggles fullscreen mode |
| `Ctrl/Cmd + +` | Zoom In | Increases editor font size |
| `Ctrl/Cmd + -` | Zoom Out | Decreases editor font size |
| `Ctrl/Cmd + 0` | Reset Zoom | Resets editor font size to default |

### Help and Settings

| Shortcut | Action | Description |
|----------|--------|-------------|
| `F1` | Help | Opens help documentation (if available) |
| `Ctrl/Cmd + ,` | Settings | Opens application settings (if available) |
| `Ctrl/Cmd + Shift + P` | Command Palette | Opens command palette for quick actions (if available) |

### Developer Tools

| Shortcut | Action | Description |
|----------|--------|-------------|
| `F12` | Developer Tools | Opens Chrome DevTools for debugging (development builds only) |
| `Ctrl/Cmd + R` | Reload | Reloads the application (development builds only) |

## Platform-Specific Shortcuts

### macOS Only

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd + Q` | Quit | Quits the application |
| `Cmd + H` | Hide Window | Hides MDX Desktop window |
| `Cmd + M` | Minimize | Minimizes window to dock |
| `Cmd + Option + H` | Hide Others | Hides all other application windows |
| `Cmd + W` | Close Tab/Window | Closes current tab or window |
| `Cmd + N` | New Window | Opens a new window (if supported) |

### Windows/Linux Only

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt + F4` | Close Window | Closes the application window |
| `F10` | Menu Bar | Activates the menu bar (if available) |
| `Alt + Space` | Window Menu | Opens window control menu |

## Customization

:::note[Custom Shortcuts]
Custom keyboard shortcut mapping is not yet available but may be added in future versions. Check the [GitHub repository](https://github.com/luis-c465/mdx-desktop) for updates.
:::

## Tips for Mastering Shortcuts

### Start Small

Don't try to memorize all shortcuts at once. Start with these essentials:

1. `Ctrl/Cmd + O` - Open folder
2. `Ctrl/Cmd + N` - New file
3. `Ctrl/Cmd + B` - Bold
4. `Ctrl/Cmd + I` - Italic
5. `F2` - Rename

Add more shortcuts to your repertoire gradually.

### Create Muscle Memory

Use shortcuts consistently for a week, and they'll become second nature:

- Day 1-2: Reference this guide frequently
- Day 3-4: Try to recall shortcuts before looking them up
- Day 5-7: Shortcuts feel natural

### Print a Cheat Sheet

Print the "Quick Reference" section and keep it near your workspace until you've memorized your most-used shortcuts.

### Focus on Your Workflow

Learn shortcuts for actions **you** perform frequently:

- **Writers**: Focus on formatting shortcuts
- **Organizers**: Focus on file management shortcuts
- **Power users**: Focus on navigation shortcuts

## Troubleshooting

### Shortcut Not Working

**Possible causes**:

1. **Wrong key combination**: Verify you're using `Ctrl` (Windows/Linux) or `Cmd` (macOS)
2. **Conflicting app**: Another application may be intercepting the shortcut
3. **Feature not available**: Some shortcuts apply only to specific versions or modes
4. **Focus issue**: Ensure the relevant panel (file tree or editor) has focus

**Solutions**:

- Try clicking in the editor or file tree first
- Check if other apps are using the same shortcut
- Restart MDX Desktop if shortcuts stop working

### Different Behavior Than Expected

Some shortcuts may behave differently depending on context:

- File tree shortcuts require file tree focus
- Editor shortcuts require editor focus
- Some shortcuts only work when text is selected

## Related Documentation

- [Markdown Editor](/features/editor/) - Learn editor capabilities
- [File Management](/features/file-management/) - File tree and operations
- [Basic Usage](/guides/basic-usage/) - Common workflows and patterns

---

**Have suggestions for new shortcuts?** [Open an issue](https://github.com/luis-c465/mdx-desktop/issues) or [start a discussion](https://github.com/luis-c465/mdx-desktop/discussions) on GitHub!
