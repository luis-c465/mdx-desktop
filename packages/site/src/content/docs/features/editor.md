---
title: Markdown Editor
description: Learn about MDX Desktop's powerful WYSIWYG markdown editing features.
---

MDX Desktop uses [MDXEditor](https://mdxeditor.dev/) to provide a rich, WYSIWYG markdown editing experience that combines the simplicity of markdown with the convenience of visual editing.

## Editor Overview

The editor is the heart of MDX Desktop, providing a seamless writing experience with:

- **WYSIWYG editing**: See your formatting in real-time as you type
- **Markdown syntax support**: Type markdown naturally, or use the toolbar
- **Toolbar shortcuts**: Format text with convenient buttons
- **Auto-save**: Focus on writing, not saving
- **Smooth performance**: Responsive editing experience

{/* TODO: Add editor interface screenshot here */}

## Supported Markdown Features

### Text Formatting

| Feature | Markdown Syntax | Keyboard Shortcut | Toolbar Button |
|---------|----------------|-------------------|----------------|
| Bold | `**text**` or `__text__` | `Ctrl/Cmd + B` | **B** |
| Italic | `*text*` or `_text_` | `Ctrl/Cmd + I` | *I* |
| Inline Code | `` `code` `` | `Ctrl/Cmd + E` | `</>` |
| Strikethrough | `~~text~~` | `Ctrl/Cmd + Shift + X` | ~~S~~ |

### Headings

Create headings by typing `#` at the start of a line:

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

**Keyboard shortcuts**:
- `Ctrl/Cmd + Alt + 1` through `6` for heading levels
- `Ctrl/Cmd + Alt + 0` to convert back to paragraph

### Lists

**Unordered Lists**:
```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3
```

Type `-` followed by space to start an unordered list.

**Ordered Lists**:
```markdown
1. First item
2. Second item
3. Third item
```

Type `1.` followed by space to start an ordered list.

**Task Lists**:
```markdown
- [ ] Incomplete task
- [x] Completed task
```

### Links

**Inline links**:
```markdown
[Link text](https://example.com)
```

**Reference links**:
```markdown
[Link text][1]

[1]: https://example.com
```

**Keyboard shortcut**: `Ctrl/Cmd + K` to insert a link

### Images

```markdown
![Alt text](./path/to/image.png)
![Alt text](https://example.com/image.png)
```

Images can be:
- **Relative paths**: `./images/photo.jpg`
- **Absolute URLs**: `https://example.com/image.png`

### Code Blocks

**Inline code**: Use single backticks `` `code` ``

**Code blocks**: Use triple backticks with optional language

````markdown
```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

**Supported languages**: JavaScript, TypeScript, Python, Rust, HTML, CSS, Markdown, and many more.

### Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> > Nested blockquotes are also supported.
```

Type `>` followed by space to start a blockquote.

### Horizontal Rules

```markdown
---
```

or

```markdown
***
```

Type three or more hyphens, asterisks, or underscores on a line.

### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**Alignment**:
```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    |   C    |     R |
```

## Auto-Save

MDX Desktop automatically saves your changes to prevent data loss.

**How it works**:
1. You type in the editor
2. After a brief pause in typing, auto-save triggers
3. Content is written to a temporary file first
4. Once write completes successfully, the temp file is atomically renamed to the original filename
5. Status bar shows "Saved" confirmation

**Benefits**:
- **No manual saving required**: Focus on writing, not saving
- **Atomic operations**: Files are never left in a corrupted state
- **Efficient**: Only saves when you stop typing
- **Reliable**: Temporary file approach prevents data loss

:::note[Auto-Save Indicator]
Watch the status bar at the bottom of the editor:
- **"Unsaved changes"**: Changes pending save
- **"Saving..."**: Auto-save in progress
- **"Saved"**: All changes persisted to disk
:::

## Toolbar Overview

The editor toolbar provides quick access to common formatting operations:

{/* TODO: Add toolbar screenshot here */}

| Button | Function | Keyboard Shortcut |
|--------|----------|-------------------|
| **B** | Bold | `Ctrl/Cmd + B` |
| *I* | Italic | `Ctrl/Cmd + I` |
| `</>` | Inline Code | `Ctrl/Cmd + E` |
| Link | Insert Link | `Ctrl/Cmd + K` |
| H1-H6 | Headings | `Ctrl/Cmd + Alt + 1-6` |
| List | Unordered List | - |
| 1,2,3 | Ordered List | - |
| Quote | Blockquote | - |
| Code | Code Block | - |

## Tips for Effective Editing

1. **Learn keyboard shortcuts**: They're faster than reaching for the toolbar
2. **Use markdown syntax**: Often quicker than toolbar for simple formatting
3. **Trust auto-save**: No need to manually save constantly
4. **Break up large documents**: Smaller files are easier to navigate and faster to load
5. **Use headings liberally**: Creates a clear document structure and improves readability

## Working with Different File Sizes

MDX Desktop handles files of various sizes:

- **Small files** (a few KB): Instant loading and editing
- **Medium files** (tens of KB): Smooth performance
- **Large files** (hundreds of KB): Still performant, may have slight initial load delay
- **Very large files** (1MB+): For the best experience, consider splitting into smaller, focused documents

:::tip[Optimizing Large Documents]
For very large markdown files:
- Consider breaking them into smaller, focused documents
- Use links to connect related documents
- Take advantage of MDX Desktop's fast file switching
:::

## Editor Settings

Currently, editor settings are optimized for the best experience out of the box. The editor provides a clean, distraction-free writing environment with sensible defaults.

## Current Capabilities

The editor currently supports:
- All standard markdown syntax
- WYSIWYG visual editing
- Keyboard shortcuts for common operations
- Auto-save with atomic file operations
- Multiple file editing with quick switching

## Related Documentation

- [File Management](/features/file-management/) - Working with multiple files
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Complete shortcut reference
- [Basic Usage](/guides/basic-usage/) - Workflow examples
