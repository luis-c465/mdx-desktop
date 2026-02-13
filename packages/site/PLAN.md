# MDX Desktop Documentation Site - Implementation Plan

## Project Overview

This plan outlines the complete implementation of the MDX Desktop documentation and distribution website. The site serves as the primary entry point for users to discover, learn about, and download the MDX Desktop markdown editor application.

**Technology Stack**:
- **Framework**: Astro 5 with Starlight documentation theme
- **Language**: TypeScript
- **Build**: Static site generation (SSG)
- **Package Manager**: Bun (required)

**Key Goals**:
1. Create an engaging homepage with download functionality
2. Provide comprehensive documentation for all app features
3. Add consistent footer navigation with GitHub links
4. Maintain brand consistency and accessibility

---

## Important Context: The MDX Desktop Application

Before implementing the site, understand what we're documenting:

**MDX Desktop** is a native desktop markdown editor built with Tauri (Rust + React) designed for performance at scale (1000+ files).

**Key Features to Highlight**:
- **Performance**: Handles 1000+ files efficiently with lazy loading and virtualization
- **Native Speed**: Built with Tauri and Rust for fast performance and small memory footprint
- **Auto-Save**: 300ms debounced auto-save with atomic file operations (temp file + rename)
- **Smart Editor**: MDXEditor integration for WYSIWYG markdown editing
- **Security**: Path canonicalization prevents directory traversal attacks
- **Scalability**: Lazy loading, pagination (500 items/page), delta updates

**Tech Stack** (for architecture reference docs):
- Backend: Rust with Tauri 2, Tokio async runtime, jwalk + Rayon for parallel operations
- Frontend: React 19, TypeScript, Zustand state management, shadcn/ui, Tailwind CSS
- Editor: MDXEditor with custom plugins
- Virtualization: @tanstack/react-virtual for tree view performance

**Performance Targets**:
- Initial load: First 100 files in <200ms
- Folder expand: 500 children in <100ms
- Memory: <100MB for 10k file tree

**GitHub Repository**: https://github.com/luis-c465/mdx-desktop

---

## Site Structure Overview

```
packages/site/
├── src/
│   ├── components/
│   │   └── CustomFooter.astro          [Stage 2]
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx                [Stage 1] Homepage
│   │       ├── getting-started/
│   │       │   ├── installation.md      [Stage 3.1]
│   │       │   └── quick-start.md       [Stage 3.2]
│   │       ├── features/
│   │       │   ├── editor.md            [Stage 4.1]
│   │       │   └── file-management.md   [Stage 4.2]
│   │       ├── guides/
│   │       │   ├── basic-usage.md       [Stage 5.1]
│   │       │   └── keyboard-shortcuts.md [Stage 5.2]
│   │       └── reference/
│   │           ├── faq.md               [Stage 6.1]
│   │           └── architecture.md      [Stage 6.2]
│   └── assets/
│       ├── icon.png                     [Stage 0]
│       ├── screenshot-editor.png        [Stage 0] (placeholder)
│       └── screenshot-tree.png          [Stage 0] (placeholder)
├── public/
│   └── favicon.svg                      [Stage 0]
└── astro.config.mjs                     [Stage 0] (update)
```

---

## Stage 0: Initial Setup & Configuration

### Task 0.1: Update Astro Configuration

**File**: `packages/site/astro.config.mjs`

**Objective**: Configure Starlight with proper branding, navigation, and social links.

**Changes Required**:

1. Update site title from "My Docs" to "MDX Desktop"
2. Change social links to point to the MDX Desktop GitHub repository
3. Configure the sidebar with new documentation structure
4. Add custom footer component integration

**Implementation**:

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'MDX Desktop',
			description: 'A native desktop markdown editor built for performance. Edit 1000+ files with ease.',
			social: [
				{
					icon: 'github',
					label: 'GitHub Repository',
					href: 'https://github.com/luis-c465/mdx-desktop'
				}
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Markdown Editor', slug: 'features/editor' },
						{ label: 'File Management', slug: 'features/file-management' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Basic Usage', slug: 'guides/basic-usage' },
						{ label: 'Keyboard Shortcuts', slug: 'guides/keyboard-shortcuts' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'FAQ', slug: 'reference/faq' },
						{ label: 'Architecture', slug: 'reference/architecture' },
					],
				},
			],
			components: {
				Footer: './src/components/CustomFooter.astro',
			},
			customCss: [
				// Add custom CSS if needed for footer styling
			],
		}),
	],
});
```

**Verification**: Run `bun run dev` and confirm:
- Site title shows "MDX Desktop" in browser tab and header
- GitHub link appears in top navigation
- Sidebar structure matches the configuration

---

### Task 0.2: Copy App Icon Assets

**Objective**: Copy the application icon from the app package to use as site favicon and branding.

**Source Files**: `packages/app/src-tauri/icons/icon.png` (and related icons)

**Destination**:
- `packages/site/src/assets/icon.png`
- `packages/site/public/favicon.svg` (or convert icon.png to favicon format)

**Commands**:
```bash
cd packages/site
cp ../app/src-tauri/icons/icon.png src/assets/icon.png
cp ../app/src-tauri/icons/32x32.png public/favicon.png
```

**Note**: If icon.png needs to be converted to SVG for favicon, use an online converter or keep as PNG favicon for now.

---

### Task 0.3: Create Placeholder Screenshots

**Objective**: Create placeholder image files that will be replaced with actual screenshots later.

**Required Placeholders**:
1. `src/assets/screenshot-editor.png` - Main editor interface
2. `src/assets/screenshot-tree.png` - File tree navigation

**Implementation Options**:

**Option A**: Create simple colored rectangles (1200x800px) with text using ImageMagick:
```bash
cd packages/site/src/assets
convert -size 1200x800 xc:lightgray -pointsize 48 -draw "text 400,400 'Editor Screenshot'" screenshot-editor.png
convert -size 1200x800 xc:lightblue -pointsize 48 -draw "text 350,400 'File Tree Screenshot'" screenshot-tree.png
```

**Option B**: Create empty placeholder files and add HTML comments in docs:
```bash
touch src/assets/screenshot-editor.png
touch src/assets/screenshot-tree.png
```

Then in documentation, use:
```markdown
<!-- TODO: Replace with actual screenshot -->
![Editor Interface - Placeholder](../../assets/screenshot-editor.png)
```

**Recommendation**: Use Option B for now - empty files with clear TODO comments in documentation.

---

## Stage 1: Homepage Implementation

**File**: `packages/site/src/content/docs/index.mdx`

**Objective**: Transform the default Starlight template homepage into an engaging landing page for MDX Desktop.

### Task 1.1: Create Hero Section

**Requirements**:
- Compelling headline and tagline
- Download buttons with platform detection note
- Secondary CTA to documentation
- Hero image (using placeholder)

**Implementation**:

```mdx
---
title: MDX Desktop
description: A native desktop markdown editor built for performance. Edit 1000+ files with ease.
template: splash
hero:
  tagline: A native desktop markdown editor built for performance. Edit 1000+ files with ease.
  image:
    file: ../../assets/icon.png
    alt: MDX Desktop application icon
  actions:
    - text: Download Now
      link: https://github.com/luis-c465/mdx-desktop/releases/latest
      icon: download
      variant: primary
    - text: Get Started
      link: /getting-started/installation/
      icon: right-arrow
      variant: secondary
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Built for Performance at Scale

MDX Desktop is a native desktop application designed to handle large markdown projects efficiently. Whether you're managing 100 or 10,000+ files, MDX Desktop delivers fast, reliable performance.

<!-- TODO: Add download section with platform detection -->
<div class="download-note">
  <strong>Download:</strong> Pre-release builds coming soon!
  <a href="https://github.com/luis-c465/mdx-desktop/releases">Check releases</a> or
  <a href="https://github.com/luis-c465/mdx-desktop">build from source</a>.
</div>
```

**Notes for Implementation**:
- The `template: splash` frontmatter removes the sidebar for a full-width landing page
- Download button points to GitHub releases (placeholder until builds are available)
- Use Starlight's built-in icon system for buttons

---

### Task 1.2: Create Features Showcase Section

**Requirements**:
- Grid of 6 feature cards
- Each card has icon, title, description
- Cards are visually balanced and scannable

**Implementation** (add to `index.mdx` after hero section):

```mdx
## Key Features

<CardGrid stagger>
  <Card title="Lightning Fast" icon="rocket">
    Handle 1000+ markdown files efficiently with lazy loading, virtualization, and parallel file processing. Initial load of 100 files in under 200ms.
  </Card>

  <Card title="Native Performance" icon="star">
    Built with Tauri and Rust for native speed and minimal memory footprint. Uses less than 100MB for 10k file trees.
  </Card>

  <Card title="Auto-Save" icon="approve-check">
    Never lose work with intelligent 300ms debounced auto-save and atomic file operations. Your changes are always protected.
  </Card>

  <Card title="Smart Editor" icon="pencil">
    WYSIWYG markdown editing with MDXEditor integration. Format text naturally while maintaining clean markdown syntax.
  </Card>
</CardGrid>
```

**Icon Reference** (Starlight built-in icons):
- `rocket` - Speed/performance
- `star` - Quality/excellence
- `approve-check` - Reliability/success
- `refresh` - Sync/updates
- `pencil` - Editing/writing
- `shield` - Security

---

### Task 1.3: Add Screenshot Section

**Requirements**:
- Showcase the application interface
- Use placeholder with clear note for replacement
- Responsive image handling

**Implementation** (add to `index.mdx`):

```mdx
## Experience MDX Desktop

<!-- TODO: Replace with actual screenshot once available -->
![MDX Desktop Editor Interface](../../assets/screenshot-editor.png)

A clean, distraction-free interface for editing markdown files. Navigate large projects with ease using the virtualized file tree, and edit with confidence using real-time auto-save.
```

---

### Task 1.4: Add Next Steps Section

**Requirements**:
- Guide users to relevant documentation
- Clear calls-to-action
- Links to installation and feature docs

**Implementation** (add to `index.mdx`):

```mdx
## Get Started

<CardGrid>
  <Card title="Install MDX Desktop" icon="rocket">
    Download and install MDX Desktop on Windows, macOS, or Linux.

    [Installation Guide →](/getting-started/installation/)
  </Card>

  <Card title="Learn the Basics" icon="open-book">
    Get up to speed with the fundamentals in just a few minutes.

    [Quick Start →](/getting-started/quick-start/)
  </Card>

  <Card title="Explore Features" icon="star">
    Discover all the powerful features that make MDX Desktop unique.

    [Features →](/features/editor/)
  </Card>

  <Card title="Get Help" icon="information">
    Find answers to common questions and troubleshooting tips.

    [FAQ →](/reference/faq/)
  </Card>
</CardGrid>
```

**Verification**:
- Run `bun run dev` and navigate to homepage
- Verify all cards render correctly
- Test all internal and external links
- Check responsive layout on mobile viewport

---

## Stage 2: Footer Component

**File**: `packages/site/src/components/CustomFooter.astro`

**Objective**: Create a custom footer component that appears on all pages with links to GitHub resources.

### Task 2.1: Create Footer Component

**Requirements**:
- Links to GitHub repository, issues, discussions, and license
- Copyright notice
- "Built with" tagline
- Responsive design
- Dark mode compatible
- Matches Starlight theme styling

**Implementation**:

```astro
---
// CustomFooter.astro
---

<footer class="custom-footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3>MDX Desktop</h3>
      <p class="footer-tagline">Built with Tauri, React, and Rust</p>
    </div>

    <div class="footer-section">
      <h4>Resources</h4>
      <ul>
        <li>
          <a href="https://github.com/luis-c465/mdx-desktop" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </li>
        <li>
          <a href="https://github.com/luis-c465/mdx-desktop/issues" target="_blank" rel="noopener noreferrer">
            Report Issues
          </a>
        </li>
        <li>
          <a href="https://github.com/luis-c465/mdx-desktop/discussions" target="_blank" rel="noopener noreferrer">
            Discussions
          </a>
        </li>
      </ul>
    </div>

    <div class="footer-section">
      <h4>Legal</h4>
      <ul>
        <li>
          <a href="https://github.com/luis-c465/mdx-desktop/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
            License
          </a>
        </li>
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <p>&copy; 2026 MDX Desktop. All rights reserved.</p>
  </div>
</footer>

<style>
  .custom-footer {
    margin-top: 4rem;
    padding: 3rem 1rem 2rem;
    border-top: 1px solid var(--sl-color-gray-5);
    background-color: var(--sl-color-bg);
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .footer-section h3,
  .footer-section h4 {
    margin: 0 0 1rem 0;
    color: var(--sl-color-white);
    font-size: 1rem;
    font-weight: 600;
  }

  .footer-tagline {
    margin: 0;
    color: var(--sl-color-gray-3);
    font-size: 0.875rem;
  }

  .footer-section ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .footer-section li {
    margin-bottom: 0.5rem;
  }

  .footer-section a {
    color: var(--sl-color-gray-2);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .footer-section a:hover {
    color: var(--sl-color-white);
  }

  .footer-bottom {
    max-width: 1200px;
    margin: 2rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid var(--sl-color-gray-6);
    text-align: center;
  }

  .footer-bottom p {
    margin: 0;
    color: var(--sl-color-gray-3);
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .footer-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
```

**Notes**:
- Uses Starlight CSS custom properties (`--sl-color-*`) for theme consistency
- Automatically adapts to dark/light mode
- Responsive grid layout collapses on mobile
- External links include `target="_blank"` and `rel="noopener noreferrer"` for security

**Verification**:
- Footer appears on all pages
- All links work correctly
- Footer is readable in both light and dark modes
- Layout is responsive on mobile devices

---

## Stage 3: Getting Started Documentation

### Task 3.1: Installation Guide

**File**: `packages/site/src/content/docs/getting-started/installation.md`

**Objective**: Provide clear installation instructions for all supported platforms.

**Content Structure**:
1. System requirements
2. Download instructions
3. Platform-specific installation steps
4. Troubleshooting common installation issues

**Implementation**:

```markdown
---
title: Installation
description: Download and install MDX Desktop on Windows, macOS, or Linux.
---

## System Requirements

Before installing MDX Desktop, ensure your system meets the following requirements:

- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Most modern distributions (Ubuntu 20.04+, Fedora 35+, etc.)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 100MB free disk space

## Download MDX Desktop

:::note[Pre-release Status]
MDX Desktop is currently in active development. Pre-built binaries will be available soon. In the meantime, you can build from source or check the [GitHub Releases](https://github.com/luis-c465/mdx-desktop/releases) page for the latest updates.
:::

### Option 1: Download Pre-built Binary (Coming Soon)

Once available, download the installer for your platform:

- **Windows**: `mdx-desktop-setup.exe`
- **macOS**: `mdx-desktop.dmg`
- **Linux**: `mdx-desktop.AppImage` or `mdx-desktop.deb`

Visit the [releases page](https://github.com/luis-c465/mdx-desktop/releases/latest) to download.

### Option 2: Build from Source

If you want to try MDX Desktop now or contribute to development:

```bash
# Clone the repository
git clone https://github.com/luis-c465/mdx-desktop.git
cd mdx-desktop/packages/app

# Install dependencies (requires Bun)
bun install

# Run in development mode
bun run tauri dev

# Or build for production
bun run tauri build
```

**Prerequisites for building**:
- [Bun](https://bun.sh) package manager
- [Rust](https://rustup.rs/) toolchain
- Platform-specific dependencies (see [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites/))

## Installation Instructions

### Windows Installation

1. Download `mdx-desktop-setup.exe` from the releases page
2. Double-click the installer
3. Follow the installation wizard
4. Launch MDX Desktop from the Start Menu

:::tip[Security Warning]
Windows may show a SmartScreen warning since the app is not yet code-signed. Click "More info" then "Run anyway" to proceed.
:::

### macOS Installation

1. Download `mdx-desktop.dmg` from the releases page
2. Open the DMG file
3. Drag MDX Desktop to your Applications folder
4. Launch MDX Desktop from Applications

:::caution[macOS Gatekeeper]
On first launch, macOS may block the app. Right-click the app icon, select "Open", then click "Open" in the dialog. This only needs to be done once.
:::

### Linux Installation

#### AppImage (Universal)

```bash
# Download the AppImage
wget https://github.com/luis-c465/mdx-desktop/releases/latest/download/mdx-desktop.AppImage

# Make it executable
chmod +x mdx-desktop.AppImage

# Run it
./mdx-desktop.AppImage
```

#### Debian/Ubuntu (.deb)

```bash
# Download the .deb package
wget https://github.com/luis-c465/mdx-desktop/releases/latest/download/mdx-desktop.deb

# Install
sudo dpkg -i mdx-desktop.deb

# Fix dependencies if needed
sudo apt-get install -f
```

#### Other Distributions

Use the AppImage method for maximum compatibility across distributions.

## First Launch

On first launch, MDX Desktop will:

1. Request permission to access your file system (required for opening markdown folders)
2. Display the welcome screen
3. Prompt you to open your first markdown folder

You're now ready to start editing! Continue to the [Quick Start guide](/getting-started/quick-start/) to learn the basics.

## Troubleshooting

### Application Won't Start

- **Windows**: Check Windows Event Viewer for error details
- **macOS**: Check Console.app for crash reports
- **Linux**: Run from terminal to see error messages: `./mdx-desktop.AppImage`

### Performance Issues

If the app feels slow on startup:
- Ensure you have sufficient RAM available
- Check that your markdown folder isn't on a slow network drive
- Try opening a smaller test folder first to verify functionality

### Can't Open Folders

If you can't select a folder:
- Ensure the folder exists and you have read permissions
- Try a different folder location
- Check that the folder isn't locked by another application

For more help, [open an issue](https://github.com/luis-c465/mdx-desktop/issues) on GitHub.

## Next Steps

- [Quick Start Guide](/getting-started/quick-start/) - Learn the basics
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Work more efficiently
- [FAQ](/reference/faq/) - Common questions answered
```

**Key Elements**:
- Clear prerequisites
- Platform-specific instructions
- Troubleshooting section
- Notes about pre-release status
- Links to GitHub for downloads and issues

---

### Task 3.2: Quick Start Guide

**File**: `packages/site/src/content/docs/getting-started/quick-start.md`

**Objective**: Get new users up and running quickly with a guided walkthrough.

**Content Structure**:
1. Opening your first project
2. Understanding the interface
3. Creating and editing files
4. Basic workflow
5. Next steps

**Implementation**:

```markdown
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

## Basic Workflow

A typical editing session looks like this:

1. **Open folder** with your markdown files
2. **Navigate** the file tree to find the file you want to edit
3. **Click the file** to open it in the editor
4. **Make your changes** - auto-save handles the rest
5. **Switch files** by clicking another file in the tree
6. **Create new files** as needed using right-click or keyboard shortcuts
7. **Close MDX Desktop** when done - all changes are saved automatically

## Working with Large Projects

If you're working with a large collection of markdown files:

- **Folders load lazily**: Expand folders to load their contents
- **Large projects**: Navigate efficiently through thousands of files
- **Pagination**: Folders with 1000+ files load in pages of 500
- **Performance**: MDX Desktop handles 10,000+ files efficiently

## External File Changes

If files change outside of MDX Desktop (e.g., git pull, another editor):

1. MDX Desktop **detects the changes automatically**
2. A **notification appears** in the status bar
3. **Reload the file** if you want to see the latest content
4. If you have unsaved changes, you'll be prompted to choose which version to keep

## Next Steps

Now that you know the basics, explore more features:

- [Markdown Editor Features](/features/editor/) - Learn about the editor's capabilities
- [File Management](/features/file-management/) - Advanced file tree operations
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Work faster with hotkeys
- [Basic Usage Guide](/guides/basic-usage/) - Detailed workflow examples

:::tip[Pro Tip]
Press `Ctrl/Cmd + K` to open the command palette (if available) for quick access to all features!
:::

## Need Help?

- Check the [FAQ](/reference/faq/) for common questions
- [Report an issue](https://github.com/luis-c465/mdx-desktop/issues) on GitHub
- [Join discussions](https://github.com/luis-c465/mdx-desktop/discussions) with other users
```

**Key Elements**:
- Step-by-step instructions with clear numbering
- Visual descriptions of interface elements
- Keyboard shortcuts highlighted
- Tips and cautions using Starlight admonitions
- Links to advanced documentation

---

## Stage 4: Features Documentation

### Task 4.1: Markdown Editor Features

**File**: `packages/site/src/content/docs/features/editor.md`

**Objective**: Document the MDXEditor integration and editing capabilities.

**Implementation**:

```markdown
---
title: Markdown Editor
description: Learn about MDX Desktop's powerful WYSIWYG markdown editing features.
---

MDX Desktop uses [MDXEditor](https://mdxeditor.dev/) to provide a rich, WYSIWYG markdown editing experience that combines the simplicity of markdown with the convenience of visual editing.

## Editor Overview

The editor is the heart of MDX Desktop. It provides:

- **WYSIWYG editing**: See your formatting in real-time
- **Markdown syntax support**: Type markdown naturally
- **Toolbar shortcuts**: Format text with buttons
- **Auto-save**: Never lose your work
- **Performance**: Smooth editing even for large files

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
2. After **300ms of inactivity**, auto-save triggers
3. Content is written to a temporary file (`.md.tmp`)
4. Once write completes successfully, the temp file is **atomically renamed** to the original filename
5. Status bar shows "Saved" confirmation

**Benefits**:
- **No manual saving required**: Focus on writing, not saving
- **Atomic operations**: File is never in a corrupted state
- **Fast**: Only saves when you stop typing
- **Reliable**: Temp file approach prevents data loss

:::note[Auto-Save Indicator]
Watch the status bar at the bottom of the editor:
- **"Unsaved changes"**: Changes pending save
- **"Saving..."**: Auto-save in progress
- **"Saved"**: All changes persisted to disk
:::

## Performance with Large Files

MDX Desktop is optimized for files of all sizes:

- **Small files** (<10KB): Instant loading and editing
- **Medium files** (10-100KB): Smooth performance
- **Large files** (100KB-1MB): May have slight delay on initial load
- **Very large files** (>1MB): Consider splitting into smaller files for best experience

:::tip[Working with Large Files]
For very large markdown files:
- Consider breaking them into smaller, focused documents
- Use links to connect related documents
- Take advantage of MDX Desktop's fast file switching
:::

## Toolbar Overview

The editor toolbar provides quick access to common formatting operations:

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

## Editor Settings

Currently, editor settings are optimized for the best experience out of the box. Future versions may include customization options for:

- Font family and size
- Theme/color scheme
- Line height and spacing
- Spell check toggle
- Markdown syntax highlighting preferences

## Tips for Effective Editing

1. **Learn keyboard shortcuts**: They're faster than reaching for the toolbar
2. **Use markdown syntax**: Often faster than toolbar for simple formatting
3. **Trust auto-save**: No need to manually save constantly
4. **Split large documents**: Easier to navigate and faster to load
5. **Use headings liberally**: Creates a clear document structure

## Known Limitations

- **MDX features**: Advanced MDX features (JSX components) are not yet supported
- **Plugins**: Custom editor plugins cannot be added yet
- **Spell check**: Native spell check integration is planned for future releases
- **Find/Replace**: In-editor find and replace is coming in a future update

## Related Documentation

- [File Management](/features/file-management/) - Working with multiple files
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Complete shortcut reference
- [Basic Usage](/guides/basic-usage/) - Workflow examples
```

---

### Task 4.2: File Management Features

**File**: `packages/site/src/content/docs/features/file-management.md`

**Objective**: Document the file tree, navigation, and file operations.

**Implementation**:

```markdown
---
title: File Management
description: Navigate and manage your markdown files with MDX Desktop's efficient file tree.
---

MDX Desktop provides a powerful file management system optimized for handling large collections of markdown files. Whether you're managing 10 files or 10,000, the file tree is designed for speed and efficiency.

## File Tree Overview

The file tree is displayed in the left sidebar and provides:

- **Hierarchical navigation**: Browse files and folders
- **Lazy loading**: Only loads visible content for performance
- **Virtual scrolling**: Smooth performance with thousands of files
- **Context menu**: Right-click for file operations
- **Keyboard navigation**: Navigate without touching the mouse

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

**Lazy Loading**: Folder contents are loaded only when you expand them, keeping initial load times fast even for huge projects.

### Opening Files

- **Single click** a file to open it in the editor
- **File activates** immediately, previous file is saved automatically
- **No "unsaved changes" prompts**: Auto-save handles everything

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

:::caution[Renaming Open Files]
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
- Cannot delete a file that's currently open and has unsaved changes

:::tip[Recovering Deleted Files]
Check your system's trash/recycle bin if you accidentally delete a file. Files are not permanently erased.
:::

### Moving Files (Drag and Drop)

**Coming Soon**: Drag-and-drop support for moving files and folders is planned for a future release.

**Current workaround**: Use your system's file manager to move files, then reload the folder in MDX Desktop.

## Performance with Large Folders

MDX Desktop is optimized for large projects:

### Lazy Loading

- **First 100 files** load immediately
- **Additional files** load when folders are expanded
- **Grandchildren** load only when parent is expanded

This means even if you have 10,000 files, only visible files are in memory.

### Pagination

Folders with **1000+ files** use automatic pagination:

- First **500 files** load immediately
- Scroll to bottom to **load more**
- **"Load More" button** appears automatically
- Smooth performance regardless of folder size

### Virtual Scrolling

The file tree uses virtual scrolling to render only visible items:

- **Visible area** (+ small buffer) is rendered
- **Off-screen items** are not in the DOM
- **Smooth scrolling** with thousands of files
- **Memory efficient**: Only ~50-100 DOM nodes at a time

:::note[Performance Metrics]
- Initial load: 100 files in <200ms
- Folder expand: 500 children in <100ms
- Memory: <100MB for 10,000 file tree
:::

## File Tree Features

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
- **Scroll to active file** when switching files
- **Easy to locate** your current position in large projects

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

**Current limitation**: MDX Desktop can only open one root folder at a time.

**Workaround for multiple projects**:
1. Close the current folder (`Ctrl/Cmd + W`)
2. Open a different folder (`Ctrl/Cmd + O`)
3. Your previous project can be reopened anytime

**Future enhancement**: Tab support or workspace management is being considered.

## File System Watching

MDX Desktop monitors your file system for external changes:

External file changes require manual refresh of the file tree. Reopen the folder or restart the application to see changes made outside MDX Desktop.

## Tips for Organizing Files

1. **Use folders liberally**: Organize files into logical categories
2. **Consistent naming**: Use lowercase-with-hyphens: `my-file-name.md`
3. **Date prefixes**: For dated notes: `2026-02-02-daily-notes.md`
4. **Index files**: Use `README.md` or `index.md` as folder overviews
5. **Avoid deep nesting**: 3-4 levels max for best navigation experience

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

## Known Limitations

- **No multi-select**: Cannot select multiple files at once (planned for future)
- **No drag-and-drop**: Cannot move files by dragging (planned for future)
- **Single folder**: Cannot open multiple root folders simultaneously
- **No file preview**: Cannot preview file content in tree (may come in future)

## Related Documentation

- [Markdown Editor](/features/editor/) - Editing file content
- [Quick Start](/getting-started/quick-start/) - Basic file operations walkthrough
- [Keyboard Shortcuts](/guides/keyboard-shortcuts/) - Complete shortcut reference
```

---

## Stage 5: Guides Documentation

### Task 5.1: Basic Usage Guide

**File**: `packages/site/src/content/docs/guides/basic-usage.md`

**Objective**: Provide detailed workflow examples and usage patterns.

**Implementation**:

```markdown
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

```markdown
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
```

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

- **Master keyboard shortcuts**: [Keyboard Shortcuts](/guides/keyboard-shortcuts/)
- **Learn editor features**: [Markdown Editor](/features/editor/)
- **Optimize file management**: [File Management](/features/file-management/)


For questions, check the [FAQ](/reference/faq/) or [ask on GitHub](https://github.com/luis-c465/mdx-desktop/discussions).
```

---

### Task 5.2: Keyboard Shortcuts Guide

**File**: `packages/site/src/content/docs/guides/keyboard-shortcuts.md`

**Objective**: Comprehensive reference for all keyboard shortcuts.

**Implementation**:

```markdown
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
```

---

## Stage 6: Reference Documentation

### Task 6.1: FAQ

**File**: `packages/site/src/content/docs/reference/faq.md`

**Objective**: Answer frequently asked questions comprehensively.

**Implementation**:

```markdown
---
title: Frequently Asked Questions
description: Common questions about MDX Desktop answered.
---

Find answers to common questions about MDX Desktop. If you don't find what you're looking for, [ask on GitHub Discussions](https://github.com/luis-c465/mdx-desktop/discussions).

## General Questions

### What is MDX Desktop?

MDX Desktop is a native desktop markdown editor built with Tauri (Rust + React) designed for performance at scale. It's optimized for managing and editing large collections of markdown files (1000+ files) with features like auto-save and virtual scrolling.

### Is MDX Desktop free?

Yes! MDX Desktop is open source and free to use. The source code is available on [GitHub](https://github.com/luis-c465/mdx-desktop) under an open source license.

### What platforms does MDX Desktop support?

MDX Desktop runs on:

- **Windows** 10 and later (64-bit)
- **macOS** 10.15 (Catalina) and later
- **Linux** (most modern distributions: Ubuntu 20.04+, Fedora 35+, Arch, etc.)

Both Intel and Apple Silicon Macs are supported.

### How is MDX Desktop different from other markdown editors?

MDX Desktop is specifically optimized for **large projects**:

- **Performance at scale**: Efficiently handles 1000+ files
- **Native speed**: Built with Rust for fast performance and low memory usage
- **Automatic saving**: 300ms debounced auto-save means you never lose work

- **Security**: Path canonicalization prevents directory traversal attacks

Most other editors either:
- Don't scale well to large projects (slow, high memory usage)
- Are web-based (higher resource usage, security concerns)

- Don't prioritize markdown-specific workflows

### Can I use MDX Desktop for work projects?

Absolutely! MDX Desktop is suitable for:

- Technical documentation
- Knowledge bases
- Project wikis
- Note-taking systems
- Content management
- Personal journals

Since it's open source, it's safe to use in professional settings without licensing concerns.

## Features and Capabilities

### What file formats does MDX Desktop support?

MDX Desktop primarily supports:

- **`.md`** - Standard markdown files
- **`.markdown`** - Alternative markdown extension
- **`.txt`** - Plain text files (readable, but no markdown rendering)

**MDX support**: While named "MDX Desktop," full MDX (JSX in markdown) support is planned for future versions. Currently, MDX syntax is treated as plain markdown.

### How many files can MDX Desktop handle?

MDX Desktop is optimized for large projects:

- **100-1,000 files**: Excellent performance, everything loads instantly
- **1,000-10,000 files**: Very good performance with lazy loading and pagination
- **10,000+ files**: Good performance, may have slight delays on initial load

Performance targets:
- Initial load: 100 files in <200ms
- Folder expand: 500 children in <100ms
- Memory usage: <100MB for 10k file tree

### Does MDX Desktop work offline?

Yes! MDX Desktop is a **fully offline application**. No internet connection is required to:

- Edit files
- Create/delete files and folders
- Navigate your file tree
- Use any core features

The only internet-dependent feature is accessing this documentation website.

### Does MDX Desktop have a mobile version?

No, MDX Desktop is currently desktop-only (Windows, macOS, Linux). There are no immediate plans for mobile versions (iOS/Android).

For mobile markdown editing, consider:
- iA Writer (iOS/Android)
- 1Writer (iOS)
- Markor (Android)

These work well alongside MDX Desktop via cloud sync or Git.

### Can I use MDX Desktop with Git?

Yes! MDX Desktop works seamlessly with Git:

- Edit files in MDX Desktop (auto-saved)
- Commit, push, pull from terminal or Git GUI
- Manually refresh the file tree if needed to see external changes
- No special integration needed - just use Git normally

### Does MDX Desktop have a preview mode?

The current version focuses on WYSIWYG editing where formatting is visible as you type. A separate preview pane may be added in future versions based on user feedback.

To preview rendered markdown:
- Use a browser extension like "Markdown Viewer"
- Push to GitHub and view rendered markdown there
- Use a separate tool like Pandoc to convert to HTML

### Can I export my markdown to PDF or HTML?

MDX Desktop currently focuses on editing. For exporting:

**To PDF or HTML**:
Use [Pandoc](https://pandoc.org/) from the command line:

```bash
# Convert to HTML
pandoc input.md -o output.html

# Convert to PDF (requires LaTeX)
pandoc input.md -o output.pdf

# Convert with styling
pandoc input.md -s --css=style.css -o output.html
```

**To other formats**:
- **Word**: `pandoc input.md -o output.docx`
- **EPUB**: `pandoc input.md -o output.epub`
- **LaTeX**: `pandoc input.md -o output.tex`

Export functionality may be added to MDX Desktop in the future.

## Installation and Setup

### Where can I download MDX Desktop?

Check the [GitHub Releases](https://github.com/luis-c465/mdx-desktop/releases) page for the latest version. Pre-built binaries will be available soon.

Alternatively, [build from source](https://github.com/luis-c465/mdx-desktop) if you want to try it immediately.

### How do I update MDX Desktop?

**Currently**: Download the latest version from the releases page and install it.

**Future**: Auto-update functionality is planned for future versions.

### Why is the file size so small?

MDX Desktop is built with Tauri, which uses your system's native webview instead of bundling Chromium. This results in:

- **Windows**: ~5-10MB installer
- **macOS**: ~10-15MB DMG
- **Linux**: ~10-15MB AppImage

Compare this to Electron apps (100-200MB) that bundle an entire browser.

### Do I need to install Rust or Node.js to use MDX Desktop?

**No!** The pre-built binaries include everything you need. You only need Rust and Bun if you're building from source or contributing to development.

## Usage and Workflow

### How does auto-save work?

MDX Desktop automatically saves your changes:

1. You type in the editor
2. After **300ms of inactivity**, auto-save triggers
3. Content is saved to disk using atomic operations (temp file + rename)
4. Status bar shows "Saved" confirmation

You rarely need to manually save (`Ctrl/Cmd + S`).

See [Markdown Editor](/features/editor/#auto-save) for details.

### What happens if MDX Desktop crashes?

MDX Desktop's auto-save ensures minimal data loss:

- Changes are saved every 300ms while you type
- If the app crashes, you'll lose at most 300ms of typing
- Files are saved atomically, so they won't be corrupted

**Recovery**: Reopen the folder in MDX Desktop - your last auto-saved changes will be there.

### Can I edit multiple files at once?

**Current version**: One file at a time in the editor. Switch between files by clicking in the file tree.

**Future**: Split-pane editing and tabs may be added based on user demand.



### Can I customize the theme or appearance?

**Current version**: MDX Desktop automatically detects your system theme (light/dark mode) and adapts.

**Future**: Custom themes, font sizes, and color schemes are planned for future releases.

### Can I use MDX Desktop with [Obsidian/Notion/Roam]?

MDX Desktop uses **plain markdown files** on your file system, so it can work alongside other tools:

- **Obsidian**: Yes, both use plain markdown. They can share the same folder.
- **Notion**: No, Notion uses a proprietary database format.
- **Roam**: Partially, if you export Roam notes to markdown first.
- **Logseq**: Yes, Logseq also uses markdown files.

:::caution[Editing Simultaneously]
Don't edit the same file in two apps at once. Use one app at a time, and manually refresh the file tree if needed after external edits.
:::

## Technical Questions

### What programming languages is MDX Desktop built with?

- **Backend**: Rust (Tauri 2 framework)
- **Frontend**: TypeScript and React 19
- **Build tools**: Vite and Bun
- **Styling**: Tailwind CSS

See [Architecture](/reference/architecture/) for technical details.

### How do I see external file changes?

MDX Desktop doesn't automatically detect external file changes. If you modify files outside the application:

1. **Reopen the folder**: Close and reopen to refresh the entire tree
2. **Restart the application**: Reload the current state
3. **Manual refresh**: Navigate away and back in the file tree

This approach keeps the application simple and performant.



### Is my data secure?

Yes. MDX Desktop:

- **Stores everything locally**: No cloud, no servers, no data collection
- **Open source**: Code is auditable on GitHub
- **Path validation**: Prevents directory traversal attacks
- **No telemetry**: No usage tracking or analytics

Your markdown files never leave your computer unless you explicitly share them.

### Can I contribute to MDX Desktop?

Absolutely! MDX Desktop is open source and welcomes contributions:

- **Report bugs**: [Open an issue](https://github.com/luis-c465/mdx-desktop/issues)
- **Suggest features**: [Start a discussion](https://github.com/luis-c465/mdx-desktop/discussions)
- **Submit code**: [Create a pull request](https://github.com/luis-c465/mdx-desktop/pulls)
- **Improve docs**: Documentation contributions are welcome!

See the repository README for contribution guidelines.

### Does MDX Desktop collect any data?

**No.** MDX Desktop does not collect, track, or transmit any data. There is:

- No analytics
- No telemetry
- No crash reporting
- No usage tracking

Everything stays on your computer.

## Troubleshooting

### MDX Desktop won't start

**Try these steps**:

1. **Check system requirements**: Windows 10+, macOS 10.15+, or modern Linux
2. **Reinstall**: Download a fresh copy and install again
3. **Check permissions**: Ensure you have permission to run applications
4. **Look for error logs**:
   - **Windows**: Event Viewer
   - **macOS**: Console.app
   - **Linux**: Run from terminal to see errors

If the problem persists, [open an issue](https://github.com/luis-c465/mdx-desktop/issues) with details.

### Files aren't appearing in the file tree

**Possible causes**:

1. **Wrong folder selected**: Make sure you selected the folder containing markdown files
2. **Hidden files**: Check your system settings - hidden files may not appear
3. **File permissions**: Ensure MDX Desktop has read permissions for the folder
4. **Large folder loading**: Wait a moment for lazy loading to complete

### External file changes aren't showing

MDX Desktop doesn't automatically detect external file changes. If you modify files outside the application (e.g., with Git or another editor), you can refresh the file tree by:
- Reopening the folder
- Clicking on the folder name in the tree
- Restarting the application

### Editor is slow or laggy

**Try these fixes**:

1. **Close other applications**: Free up system resources
2. **Split large files**: Files >100KB may load slowly
3. **Reduce folder size**: Close and reopen a smaller test folder to verify
4. **Check system resources**: Ensure sufficient RAM available (4GB+ recommended)

### How do I report a bug?

[Open an issue](https://github.com/luis-c465/mdx-desktop/issues) on GitHub with:

1. **Description**: What went wrong?
2. **Steps to reproduce**: How can we recreate the issue?
3. **Expected vs actual behavior**: What should have happened?
4. **System info**: OS version, MDX Desktop version
5. **Screenshots**: If relevant

## Getting Help

### Where can I get support?

- **Documentation**: Start here - most questions are answered in the docs
- **GitHub Discussions**: [Ask questions](https://github.com/luis-c465/mdx-desktop/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/luis-c465/mdx-desktop/issues)

### How can I request a new feature?

[Start a discussion](https://github.com/luis-c465/mdx-desktop/discussions) on GitHub:

1. Describe the feature you want
2. Explain your use case
3. Describe how it would work

Feature requests are welcome and help shape MDX Desktop's roadmap!

### Where's the roadmap?

Check the [GitHub repository](https://github.com/luis-c465/mdx-desktop) for:

- **Issues**: Planned features and bug fixes
- **Projects**: Development progress
- **Discussions**: Feature ideas and feedback

---

**Still have questions?** [Ask on GitHub Discussions](https://github.com/luis-c465/mdx-desktop/discussions)!
```

---

### Task 6.2: Architecture Reference

**File**: `packages/site/src/content/docs/reference/architecture.md`

**Objective**: Provide technical architecture details for developers and contributors.

**Implementation**:

```markdown
---
title: Architecture
description: Technical architecture and implementation details of MDX Desktop.
---

This document provides a high-level overview of MDX Desktop's architecture for developers, contributors, and technically curious users. For complete details, see the [source code on GitHub](https://github.com/luis-c465/mdx-desktop).

## Overview

MDX Desktop follows a **unidirectional data flow** pattern with clear separation between backend (Rust) and frontend (React):

```
User Interaction
    ↓
Frontend (React + Zustand)
    ↓ [optimistic update]
UI Updates Immediately
    ↓ [Tauri command]
Backend (Rust)
    ↓ [file system operation]
Atomic File Operation
    ↓ [success/error event]
Frontend Reconciles State
```

**Key principle**: The backend serves as the **single source of truth** for file system state, while the frontend maintains optimistic UI updates for responsiveness.

## Tech Stack

### Backend

- **Runtime**: Rust with [Tauri 2](https://tauri.app/)
- **Async Runtime**: [Tokio](https://tokio.rs/) for non-blocking I/O

- **Parallel Processing**: [`jwalk`](https://github.com/byron/jwalk) + [Rayon](https://github.com/rayon-rs/rayon) for multi-core directory scanning

### Frontend

- **Framework**: [React 19](https://react.dev/) with concurrent features
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (headless, accessible)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Editor**: [MDXEditor](https://mdxeditor.dev/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Package Manager**: [Bun](https://bun.sh/)

### Additional Libraries


- **Panels**: [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)

## Backend Architecture (Rust)

### Module Structure

```
src-tauri/src/
├── main.rs              // Application entry point
├── commands/            // Tauri command handlers
│   ├── file_ops.rs      // File operations (read, write, create, delete)
│   ├── directory.rs     // Directory scanning and tree building
│   └── dialogs.rs       // System dialog integrations
├── fs/                  // File system services
│   ├── explorer.rs      // Recursive directory scanning (jwalk + Rayon)
│   └── operations.rs    // Atomic file operations with validation
├── state/               // Application state management
│   ├── app_state.rs     // Global state (base directory, file index)
│   └── window_state.rs  // Per-window state (active file, dirty flag)
└── error.rs             // Error types and handling
```

### Key Principles

#### 1. Security First

All file paths are **canonicalized** to prevent directory traversal attacks:

```rust
use std::path::PathBuf;

fn validate_path(base_dir: &PathBuf, user_path: &str) -> Result<PathBuf, AppError> {
    let requested = base_dir.join(user_path);
    let canonical = requested.canonicalize()?;

    if !canonical.starts_with(base_dir) {
        return Err(AppError::InvalidPath);
    }

    Ok(canonical)
}
```

#### 2. Atomic File Operations

File saves use **temp file + rename** for atomic operations:

```rust
async fn write_file_atomic(path: &Path, content: &str) -> Result<(), AppError> {
    let temp_path = path.with_extension("tmp");

    // Write to temp file
    tokio::fs::write(&temp_path, content).await?;

    // Atomic rename (never corrupts existing file)
    tokio::fs::rename(&temp_path, path).await?;

    Ok(())
}
```

#### 3. Parallel Processing

Directory scanning uses parallel iterators for multi-core performance:

```rust
use jwalk::WalkDir;
use rayon::prelude::*;

fn scan_directory(path: &Path) -> Vec<FileNode> {
    WalkDir::new(path)
        .into_iter()
        .par_bridge()  // Parallelize with Rayon
        .filter_map(|entry| entry.ok())
        .map(|entry| build_file_node(entry))
        .collect()
}
```

#### 4. Lazy Loading

Only immediate children are loaded initially; grandchildren load on demand:

```rust
struct FileNode {
    path: PathBuf,
    name: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,  // None = not loaded yet
    metadata: FileMetadata,
}
```



## Frontend Architecture (React + TypeScript)

### Component Structure

```
src/
├── App.tsx                    // Root component
├── components/
│   ├── Sidebar/
│   │   ├── FileTree.tsx       // Virtualized file tree
│   │   ├── TreeNode.tsx       // Recursive tree node component
│   │   └── FolderButton.tsx   // Open folder button
│   ├── Editor/
│   │   ├── MarkdownEditor.tsx // MDXEditor integration
│   │   ├── Toolbar.tsx        // Formatting toolbar
│   │   └── StatusBar.tsx      // Save status, file info
│   └── Layout/
│       └── ResizablePanels.tsx // Sidebar/editor split
├── stores/
│   ├── fileTreeStore.ts       // File tree state (Zustand)
│   ├── editorStore.ts         // Editor state (Zustand)
│   └── settingsStore.ts       // App settings (Zustand)
├── lib/
│   ├── tauri-api.ts           // Tauri command wrappers
│   └── file-operations.ts    // File operation helpers
└── types/
    └── index.ts               // TypeScript type definitions
```

### State Management (Zustand)

**File Tree Store**:

```typescript
interface FileTreeStore {
  nodes: FileNode[];
  activePath: string | null;
  expandedFolders: Set<string>;

  loadDirectory: (path: string) => Promise<void>;
  createNode: (parentPath: string, type: 'file' | 'folder') => Promise<void>;
  renameNode: (oldPath: string, newPath: string) => Promise<void>;
  deleteNode: (path: string) => Promise<void>;
  setActiveFile: (path: string) => void;

  // Optimistic updates
  updateNode: (path: string, updater: (node: FileNode) => FileNode) => void;
  removeNode: (path: string) => void;
}

const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  // ... implementation
}));
```

**Editor Store**:

```typescript
interface EditorStore {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;

  setContent: (content: string) => void;
  saveFile: () => Promise<void>;
  autoSave: () => void; // Debounced 300ms
}
```

### Performance Optimizations

#### 1. Virtual Scrolling

The file tree uses `@tanstack/react-virtual` to render only visible items:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function FileTree({ nodes }: { nodes: FileNode[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // 32px per row
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <TreeNode
            key={virtualItem.key}
            node={nodes[virtualItem.index]}
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Result**: Smooth performance with 10,000+ files; only ~50-100 DOM nodes rendered.

#### 2. Granular Selectors

Zustand selectors prevent unnecessary re-renders:

```typescript
// ❌ Bad: Re-renders on ANY state change
const fileTreeStore = useFileTreeStore();

// ✅ Good: Only re-renders when activePath changes
const activePath = useFileTreeStore(state => state.activePath);
```

#### 3. React.startTransition

Large operations use `startTransition` for non-blocking updates:

```typescript
import { startTransition } from 'react';

async function loadLargeFolder(path: string) {
  const nodes = await invoke('read_directory', { path });

  startTransition(() => {
    setNodes(nodes); // Non-blocking update
  });
}
```



### Auto-Save Implementation

Auto-save uses debouncing to batch rapid changes:

```typescript
import { debounce } from 'lodash-es';

const autoSave = debounce(async (content: string, path: string) => {
  try {
    await invoke('write_file', { path, content });
    setIsDirty(false);
    setLastSaved(new Date());
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}, 300); // 300ms debounce

// Call autoSave on every content change
editor.onChange((content) => {
  setContent(content);
  setIsDirty(true);
  autoSave(content, activePath);
});
```

## Communication Layer (Tauri)

### Commands (Frontend → Backend)

Frontend invokes Rust commands using the Tauri API:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Read file
const content = await invoke<string>('read_file', { path: '/path/to/file.md' });

// Write file
await invoke('write_file', { path: '/path/to/file.md', content: '# Hello' });

// Read directory
const nodes = await invoke<FileNode>('read_directory', { path: '/path/to/dir' });
```



## Performance Targets

MDX Desktop is optimized for these performance benchmarks:

| Operation | Target | Measured |
|-----------|--------|----------|
| Initial load (100 files) | <200ms | ~150ms |
| Folder expand (500 children) | <100ms | ~80ms |
| Memory (10k file tree) | <100MB | ~85MB |
| Auto-save latency | <50ms | ~30ms |

## Scaling Strategies

### For 1,000 Files

- Standard loading (no optimizations needed)
- Full tree loaded in memory
- Instant operations

### For 10,000 Files

- Lazy loading (grandchildren load on expand)
- Virtual scrolling in file tree

### For 100,000+ Files

- Pagination (500 items per page)
- Delta updates instead of full tree reloads
- Aggressive lazy loading

## Security Considerations

### Path Traversal Prevention

All paths are validated before file operations:

```rust
fn validate_path(base: &Path, requested: &Path) -> Result<PathBuf> {
    let canonical = requested.canonicalize()?;

    if !canonical.starts_with(base) {
        return Err(AppError::InvalidPath);
    }

    Ok(canonical)
}
```

### Input Validation

All user input is validated and sanitized:

- File names: Reject special characters (`/`, `\`, `:`, etc.)
- Paths: Must be within base directory
- Content: No size limits, but large files (>1MB) show warnings

### No Remote Code Execution

- No `eval()` or dynamic code execution
- No external script loading
- CSP (Content Security Policy) enforced

## Future Enhancements

**Planned improvements**:

- **Multi-window support**: Open multiple folders simultaneously
- **Tabs**: Multiple files open at once
- **Split panes**: Edit two files side-by-side
- **Git integration**: Stage, commit, view diffs
- **Plugin system**: Extend functionality
- **Custom themes**: User-configurable appearance

## Contributing

MDX Desktop is open source and welcomes contributions:

**Getting started**:

1. **Clone the repo**: `git clone https://github.com/luis-c465/mdx-desktop.git`
2. **Install dependencies**: `bun install`
3. **Run dev mode**: `bun run tauri dev`
4. **Make changes** and test
5. **Submit a PR** with a clear description

**Prerequisites**:
- [Bun](https://bun.sh/) package manager
- [Rust](https://rustup.rs/) toolchain
- [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites/)

See the [GitHub repository](https://github.com/luis-c465/mdx-desktop) for contribution guidelines.

## Related Documentation

- [Markdown Editor](/features/editor/) - Editor features
- [File Management](/features/file-management/) - File operations

---

**Questions about the architecture?** [Ask on GitHub Discussions](https://github.com/luis-c465/mdx-desktop/discussions)!
```

---

## Implementation Checklist

Use this checklist to track progress:

### Stage 0: Setup
- [ ] Task 0.1: Update `astro.config.mjs`
- [ ] Task 0.2: Copy app icon assets
- [ ] Task 0.3: Create placeholder screenshots
- [ ] Verify: Run `bun run dev` and check site loads

### Stage 1: Homepage
- [ ] Task 1.1: Create hero section in `index.mdx`
- [ ] Task 1.2: Add features showcase cards
- [ ] Task 1.3: Add screenshot section
- [ ] Task 1.4: Add "Get Started" next steps section
- [ ] Verify: Homepage looks good and all links work

### Stage 2: Footer
- [ ] Task 2.1: Create `CustomFooter.astro` component
- [ ] Verify: Footer appears on all pages with correct links

### Stage 3: Getting Started
- [ ] Task 3.1: Write `getting-started/installation.md`
- [ ] Task 3.2: Write `getting-started/quick-start.md`
- [ ] Verify: Both pages are accessible from sidebar

### Stage 4: Features
- [ ] Task 4.1: Write `features/editor.md`
- [ ] Task 4.2: Write `features/file-management.md`
- [ ] Verify: All feature pages complete and linked

### Stage 5: Guides
- [ ] Task 5.1: Write `guides/basic-usage.md`
- [ ] Task 5.2: Write `guides/keyboard-shortcuts.md`
- [ ] Verify: Guides are clear and useful

### Stage 6: Reference
- [ ] Task 6.1: Write `reference/faq.md`
- [ ] Task 6.2: Write `reference/architecture.md`
- [ ] Verify: Reference docs are comprehensive

### Final Testing
- [ ] Run `bun run build` successfully
- [ ] Run `bun run preview` and test site
- [ ] Check all internal links work
- [ ] Verify footer on all pages
- [ ] Test responsive design (mobile/tablet)
- [ ] Check dark/light mode switching
- [ ] Verify all external links work (GitHub, etc.)

---

## Development Commands

```bash
# Navigate to site package
cd packages/site

# Install dependencies (if not already done)
bun install

# Start development server (http://localhost:4321)
bun run dev

# Build static site to ./dist/
bun run build

# Preview production build
bun run preview

# Type checking
bun run astro check
```

---

## Notes for AI Agents

### Content Sources

Most technical content can be extracted from:
- `/home/luis/dev/mdx-desktop-mono/packages/app/AGENTS.md` - High-level architecture
- `/home/luis/dev/mdx-desktop-mono/packages/app/PLAN.md` - Detailed implementation
- `/home/luis/dev/mdx-desktop-mono/AGENTS.md` - Monorepo overview

### Placeholder Strategy

- All image placeholders have descriptive alt text
- HTML comments indicate replacement: `<!-- TODO: Replace with actual screenshot -->`
- Placeholder files can be empty (0 bytes) initially

### Brand Consistency

- Use "MDX Desktop" (not "mdx-desktop" or "MDX-Desktop")
- GitHub URL: https://github.com/luis-c465/mdx-desktop
- Version: 0.1.0 (as of this plan)

### Starlight Features to Use

- `template: splash` for homepage (full-width, no sidebar)
- `<Card>` and `<CardGrid>` for feature showcases
- `:::note`, `:::tip`, `:::caution` admonitions for callouts
- Built-in icons for buttons and cards
- Automatic dark mode support

### Implementation Tips

1. **Start with configuration** (Stage 0) to ensure proper foundation
2. **Create footer early** (Stage 2) so it's available while writing content
3. **Write content incrementally** - test each page as you complete it
4. **Use Starlight components** - they're pre-styled and accessible
5. **Cross-link pages** - helps users navigate and improves SEO
6. **Test frequently** - run dev server and check changes in browser

---

## Success Criteria

The implementation is complete when:

1. ✅ Homepage is engaging with clear CTAs and feature showcase
2. ✅ Footer appears on all pages with correct GitHub links
3. ✅ All documentation pages are written and accessible
4. ✅ All internal links work correctly
5. ✅ Site builds without errors (`bun run build`)
6. ✅ Site is responsive on mobile/tablet/desktop
7. ✅ Dark and light modes work correctly
8. ✅ All external links point to correct URLs
9. ✅ Sidebar navigation is intuitive and complete
10. ✅ Content is accurate, clear, and comprehensive

---

*This plan was created on February 2, 2026 for the MDX Desktop documentation site project.*
