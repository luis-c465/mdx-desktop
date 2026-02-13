---
title: Editor Plugins
description: Discover the powerful plugins that extend your markdown editing experience.
---

MDX Desktop comes with 17 built-in plugins that power your markdown editing experience. These plugins provide everything from basic text formatting to advanced features like syntax highlighting, image uploads, and find-and-replace functionality. All plugins are enabled by default—no installation or configuration required.

## Plugin Categories

### Text Formatting Plugins

These plugins handle the fundamental markdown formatting features:

| Plugin | What It Does | How to Use |
|--------|--------------|------------|
| **Headings** | Create H1-H6 headings | Type `#` through `######` followed by space |
| **Lists** | Ordered, unordered, and task lists | Type `-`, `1.`, or `- [ ]` followed by space |
| **Quotes** | Block quotes for highlighting text | Type `>` followed by space |
| **Thematic Break** | Horizontal rules to separate content | Type `---` on its own line |
| **Markdown Shortcuts** | Quick keyboard shortcuts for formatting | Use `Ctrl/Cmd + B` for bold, etc. |

### Content Enhancement Plugins

These plugins help you add rich content to your markdown files:

| Plugin | What It Does | Key Feature |
|--------|--------------|-------------|
| **Link Plugin** | Insert and edit hyperlinks | Click the link button or use shortcuts |
| **Link Dialog** | Visual dialog for link creation | Easy URL and text entry |
| **Image Plugin** | Upload and insert images | Paste, drag-and-drop, or browse files |
| **Table Plugin** | Create and edit tables | Full table editing with add/remove rows |

:::tip[Learn More About Images]
The image plugin has special features and important caveats. See the complete [Working with Images](/features/images/) guide for details.
:::

### Advanced Editing Plugins

Power features for advanced markdown authoring:

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **Front Matter** | YAML metadata at top of files | Add titles, dates, tags, and custom metadata |
| **Code Blocks** | Syntax-highlighted code | Insert code with language selection |
| **Directives** | Admonitions and callouts | Create note, tip, caution, and warning boxes |
| **Search** | Find and replace text | `Ctrl/Cmd + F` to search, `Ctrl/Cmd + H` to replace |

### Editor Tools

Plugins that enhance the editing interface:

| Plugin | What It Does | Access |
|--------|--------------|--------|
| **Toolbar** | Visual formatting buttons | Always visible at top of editor |
| **Source Mode Toggle** | Switch between rich text and raw markdown | Click the code icon in toolbar |

## Using Plugins

All plugins are automatically enabled and ready to use. You don't need to install or configure anything—just start editing!

### Discovering Features

- **Hover over toolbar buttons** to see tooltips explaining what each button does
- **Use keyboard shortcuts** for faster editing (see [Keyboard Shortcuts](/guides/keyboard-shortcuts/))
- **Experiment** with different markdown syntax—plugins automatically format as you type

:::note[No Configuration Needed]
Unlike some markdown editors that require plugin installation and setup, MDX Desktop comes with everything built-in and configured for optimal performance.
:::

## Code Syntax Highlighting

The **Code Block Plugin** and **CodeMirror Plugin** work together to provide syntax highlighting for 18 programming languages:

### Programming Languages

| Language | Supported | Language | Supported |
|----------|-----------|----------|-----------|
| JavaScript | ✅ | TypeScript | ✅ |
| JSX | ✅ | TSX | ✅ |
| Python | ✅ | Rust | ✅ |
| HTML | ✅ | CSS | ✅ |
| JSON | ✅ | Markdown | ✅ |
| Bash | ✅ | Shell | ✅ |
| GraphQL | ✅ | | |

### SQL Dialects

MDX Desktop includes special support for multiple SQL dialects:

- **SQL** (Standard SQL)
- **PostgreSQL**
- **MySQL**
- **T-SQL** (Microsoft SQL Server)
- **SQLite**
- **PL/SQL** (Oracle)

:::tip[Default Code Language]
When you insert a code block, the default language is set to SQL. You can change it by selecting a different language from the dropdown in the code block.
:::

## Front Matter Support

The **Front Matter Plugin** allows you to add YAML metadata at the top of your markdown files:

```markdown
---
title: My Document
date: 2026-02-13
tags: [documentation, guide]
author: Your Name
---

Your markdown content starts here...
```

Front matter is commonly used for:
- **Blog posts** - titles, dates, authors, categories
- **Documentation** - page metadata, navigation settings
- **Site generators** - Astro, Next.js, Hugo, Jekyll all use front matter

## Admonitions and Callouts

The **Directives Plugin** enables you to create eye-catching callout boxes:

```markdown
:::note
This is a note callout. Use it for supplementary information.
:::

:::tip
This is a tip callout. Use it for helpful suggestions.
:::

:::caution
This is a caution callout. Use it for warnings and important notices.
:::
```

These render as styled boxes that stand out from regular content, making important information more noticeable.

## Search and Replace

The **Search Plugin** provides powerful find-and-replace functionality:

- **Find text**: `Ctrl/Cmd + F` opens the find bar
- **Replace text**: `Ctrl/Cmd + H` opens find and replace mode
- **Navigate results**: Use `Enter` for next match, `Shift + Enter` for previous
- **Case sensitivity**: Toggle case-sensitive search
- **Whole word**: Match entire words only

:::tip[Highlighted Results]
Search results are highlighted in the editor with different colors for the current match and other matches, making it easy to see all occurrences.
:::

## Rich Text and Source Modes

The editor supports two viewing modes:

### Rich Text Mode (Default)

See your markdown rendered with formatting as you type. This is the **WYSIWYG** (What You See Is What You Get) editing experience:

- Headings appear larger
- Bold and italic text is styled
- Links are clickable
- Images display inline
- Code blocks have syntax highlighting

### Source Mode

View and edit the raw markdown syntax. This is useful when you need to:

- See exact markdown syntax
- Make precise formatting edits
- Copy markdown to other applications
- Troubleshoot formatting issues

Toggle between modes by clicking the **code icon** in the toolbar or using the keyboard shortcut.

## Plugin Performance

All 17 plugins are optimized for performance:

- **Fast initialization**: Editor loads in under a second
- **Smooth typing**: No lag even with complex formatting
- **Large files**: Handle documents with thousands of lines
- **Low memory**: Efficient resource usage

The plugin system is built on [MDXEditor](https://mdxeditor.dev/), a modern markdown editor specifically designed for performance and extensibility.

## Related Documentation

- [Working with Images](/features/images/) - Detailed guide to the image plugin with important caveats
- [Markdown Editor](/features/editor/) - Overview of the editor interface
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Complete list of editing shortcuts
- [Basic Usage](/guides/basic-usage/) - Getting started with MDX Desktop
