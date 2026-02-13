---
title: Basic Usage
description: Learn common workflows and usage patterns in MDX Desktop.
---

This guide walks through common workflows and usage patterns to help you get the most out of MDX Desktop. Whether you're writing documentation, taking notes, or managing a knowledge base, these examples will help you work efficiently.

## Opening and Managing Projects

### Opening Your First Project

1. **Launch MDX Desktop**
2. **Click "Open Folder"** or press `Ctrl/Cmd + O`
3. **Navigate to your markdown folder**
4. **Select the folder** (don't select individual files)
5. **Click "Open"** or press Enter

The file tree will populate with your markdown files and folders.

:::tip[Folder Selection]
Always select the **root folder** of your project, not individual files. MDX Desktop works best when it can see your entire folder structure.
:::

### Switching Between Projects

To switch to a different markdown folder:

1. **Close current folder**: `Ctrl/Cmd + W` or File → Close Folder
2. **Open new folder**: `Ctrl/Cmd + O`
3. **Select the folder**

**Quick tip**: MDX Desktop remembers your recently opened folders for quick access (feature may vary by version).

## Daily Writing Workflow

### Morning Notes Routine

A typical daily notes workflow:

1. **Open MDX Desktop** to your notes folder
2. **Navigate** to your daily notes folder (e.g., `daily/`)
3. **Create a new file**: Right-click → New File
4. **Name it** with today's date: `2026-02-02.md`
5. **Start writing** - auto-save handles the rest
6. **Add headings** for different sections (tasks, meetings, ideas)
7. **Link to other notes** using markdown links
8. **Close when done** - everything is saved automatically

**Example daily note structure**:
```markdown
# February 2, 2026

## Tasks
- [ ] Review pull requests
- [ ] Write documentation
- [x] Team standup

## Meetings
### Team Standup (10:00 AM)
- Discussed new features
- Assigned tasks for sprint

## Ideas
- Add dark mode toggle
- Improve navigation features

## Links
- [Yesterday's notes](2026-02-01.md)
- [Project roadmap](../projects/roadmap.md)
```

### Document Writing Workflow

For longer documents:

1. **Create a dedicated folder** for your document
2. **Break into multiple files** by chapter or section
3. **Use an index file** (`README.md` or `index.md`) with links to sections
4. **Write iteratively**: Draft → Edit → Polish
5. **Trust auto-save** - no need to manually save

**Example structure**:
```
my-book/
├── README.md        (table of contents)
├── chapter-01.md
├── chapter-02.md
├── chapter-03.md
└── appendix.md
```

## File Organization Patterns

### By Topic

Organize files by subject matter:

```
notes/
├── programming/
│   ├── python.md
│   ├── rust.md
│   └── javascript.md
├── design/
│   ├── ui-patterns.md
│   └── color-theory.md
└── business/
    ├── marketing.md
    └── finance.md
```

**Best for**: Knowledge bases, reference materials

### By Date

Organize files chronologically:

```
journal/
├── 2026/
│   ├── 01/
│   │   ├── 2026-01-15.md
│   │   └── 2026-01-16.md
│   └── 02/
│       ├── 2026-02-01.md
│       └── 2026-02-02.md
└── archive/
```

**Best for**: Journals, daily notes, logs

### By Project

Organize files by project or context:

```
work/
├── project-alpha/
│   ├── README.md
│   ├── planning.md
│   └── progress.md
├── project-beta/
│   └── README.md
└── meetings/
    └── 2026-02-02-standup.md
```

**Best for**: Work documents, project management

## Editing and Formatting

### Quick Formatting

Use keyboard shortcuts for fast formatting:

1. **Select text** with mouse or keyboard
2. **Press shortcut**:
   - `Ctrl/Cmd + B` for **bold**
   - `Ctrl/Cmd + I` for *italic*
   - `Ctrl/Cmd + E` for `code`
3. **Continue writing**

**Pro tip**: Learn shortcuts for your most-used formats to dramatically speed up writing.

### Writing Markdown Natively

Type markdown syntax directly for even faster formatting:

- Type `**` before and after text for bold
- Type `*` before and after text for italic
- Type `#` at line start for headings
- Type `-` or `*` at line start for lists
- Type `1.` at line start for numbered lists

The editor recognizes these patterns automatically.

### Pasting Content

When pasting text from other applications:

- **Plain text** pastes as-is
- **Rich text** (from web or Word) converts to markdown automatically
- **Images** (varies by version) - paste or use markdown image syntax

### Linking Between Notes

Create links between your notes:

**Relative links** (recommended for portable folders):
```markdown
See [related topic](./related-topic.md)
See [other section](../section/other.md)
```

**Link to headings** within documents:
```markdown
See [Introduction](#introduction)
See [Chapter 2 section](./chapter-02.md#important-section)
```

**External links**:
```markdown
Read more on [MDX Desktop](https://github.com/luis-c465/mdx-desktop)
```

## Working with Large Projects

### Navigating Large File Trees

When working with hundreds or thousands of files:

1. **Use folder collapsing**: Keep folders collapsed unless actively using them
2. **Navigate efficiently**: Use keyboard shortcuts to navigate the file tree
3. **Organize hierarchically**: Use subfolders to group related files
4. **Use naming conventions**: Prefix files for easy sorting (`01-intro.md`, `02-main.md`)

### Managing Performance

MDX Desktop is optimized for large projects, but you can help:

1. **Close unused folders**: Collapse folders you're not currently using
2. **Split large files**: Break 100KB+ files into smaller chunks
3. **Use lazy loading**: Don't expand all folders at once
4. **Trust pagination**: Let MDX Desktop load files in batches

### Project Structure Best Practices

For large projects:

```
docs/
├── README.md              (start here)
├── getting-started/       (new user content)
├── guides/                (how-to articles)
├── reference/             (detailed specs)
├── api/                   (API documentation)
└── assets/                (images, files)
```

Benefits:
- **Predictable structure**: Easy to find content
- **Scalable**: Add more sections as needed
- **Collaborative**: Team knows where to put new content

## Collaboration Workflows

### Using Git for Collaboration

MDX Desktop works seamlessly with Git:

**Typical workflow**:

1. **Edit files** in MDX Desktop (auto-saved)
2. **Switch to terminal** or Git GUI
3. **Review changes**: `git status`, `git diff`
4. **Commit changes**: `git add . && git commit -m "message"`
5. **Push to remote**: `git push`
6. **Pull updates**: `git pull`
7. **MDX Desktop updates** automatically

**Handling merge conflicts**:

1. Git reports conflict during pull
2. Open conflicted file in MDX Desktop
3. See conflict markers: `<<<<<<`, `======`, `>>>>>>`
4. Manually resolve by editing the file
5. Save (auto-save)
6. Commit the resolution: `git add . && git commit`

### Sharing Files

Options for sharing your markdown files:

1. **Git hosting**: GitHub, GitLab, Bitbucket (recommended)
2. **Cloud sync**: Dropbox, Google Drive, OneDrive (be careful with conflicts)
3. **Export**: Copy files to share via email or messaging
4. **Convert**: Use tools like Pandoc to convert to PDF, HTML, etc.

## Time-Saving Tips

### Keyboard-First Workflow

Minimize mouse usage for speed:

1. **Open folder**: `Ctrl/Cmd + O`
2. **Navigate tree**: Arrow keys or `J`/`K`
3. **Open file**: `Enter`
4. **Create file**: `Ctrl/Cmd + N`
5. **Format text**: `Ctrl/Cmd + B`, `I`, `E`
6. **Switch files**: Click in tree or use file switcher (if available)

### Templates for Common Documents

Create template files for repeated formats:

**Example: Meeting notes template** (`templates/meeting.md`):
```markdown
# Meeting: [TOPIC]

**Date**: [DATE]  
**Attendees**: [NAMES]  

## Agenda
1. 
2. 
3. 

## Discussion

## Action Items
- [ ] 
- [ ] 

## Next Steps
```

To use:
1. Copy template file
2. Rename with today's date
3. Fill in the brackets

### Snippets and Common Patterns

Keep a "snippets" file with frequently used markdown:

````markdown
# Snippets

## Table Template
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell     | Cell     | Cell     |

## Admonition
> **Note**: Important information here

## Code Block
```language
code here
```

## Task List
- [ ] Task one
- [ ] Task two
````

Copy and paste from this file as needed.

## Common Pitfalls to Avoid

### Don't Fight Auto-Save

**❌ Bad practice**: Constantly checking if your file saved

**✅ Good practice**: Trust auto-save and focus on writing. Check status bar only if you're concerned.

### Don't Over-Nest Folders

**❌ Bad practice**: `docs/articles/tech/programming/languages/rust/beginner/basics/intro.md`

**✅ Good practice**: `docs/rust/beginner-intro.md`

Keep nesting to 3-4 levels maximum for easier navigation.

### Don't Use Special Characters in Filenames

**❌ Bad practice**: `My Notes: January 15, 2026 (draft).md`

**✅ Good practice**: `2026-01-15-notes-draft.md`

Avoid: `/ \ : * ? " < > |` and excessive spaces.

### Don't Edit the Same File in Multiple Apps Simultaneously

**❌ Bad practice**: Editing `notes.md` in VSCode while it's open in MDX Desktop

**✅ Good practice**: Edit in one app at a time, or accept that you'll need to reload when switching.

## Next Steps

Now that you understand basic workflows:

- **Learn editor features**: [Markdown Editor](/features/editor/)
- **Optimize file management**: [File Management](/features/file-management/)


For questions, check the [FAQ](/reference/faq/) or [ask on GitHub](https://github.com/luis-c465/mdx-desktop/discussions).
