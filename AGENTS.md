# Agent Context - MDX Desktop Monorepo

## Project Overview

A monorepo containing a native desktop markdown editor and its companion documentation website. The project enables users to efficiently edit and manage large collections of markdown files (1000+ files) with a native desktop experience, while providing comprehensive documentation and easy distribution through a static website.

**Monorepo Structure**: Bun-based workspace with two packages
- **app**: Production-ready Tauri desktop application (Rust + React)
- **site**: Astro-based documentation and distribution website

## Quick Start

```bash
# Install all dependencies
bun install

# Run the desktop app in development
cd packages/app
bun run dev

# Run the documentation site
cd packages/site
bun run dev
```

## Monorepo Architecture

```
mdx-desktop-mono/
├── packages/
│   ├── app/           # Tauri desktop markdown editor
│   │   ├── src/       # React frontend (TypeScript)
│   │   ├── src-tauri/ # Rust backend
│   │   ├── AGENTS.md  # Detailed app architecture
│   │   └── PLAN.md    # Complete implementation plan
│   │
│   └── site/          # Astro documentation site
│       ├── src/
│       │   ├── content/docs/  # Documentation content
│       │   └── assets/        # Images and static assets
│       └── public/    # Static files (downloads, etc.)
│
├── CLAUDE.md          # Development guidelines (Bun preferences)
└── package.json       # Workspace configuration
```

## Packages

### packages/app - Desktop Markdown Editor

**Status**: ✅ Production-ready, feature-complete

A high-performance native desktop application for editing and managing markdown files at scale. Built with Tauri for native performance and small bundle size.

**Key Features**:
- **Performance at Scale**: Handles 1000+ files efficiently with lazy loading and virtualization
- **Auto-save**: Debounced saves (300ms) with atomic file operations (temp file + rename)
- **Real-time File Watching**: Detects external changes with 100ms debounced notifications
- **Security**: Path canonicalization prevents directory traversal attacks
- **Native Experience**: System file dialogs, native context menus, OS theme detection

**Tech Stack**:
- **Backend**: Rust (Tauri 2), Tokio async runtime, `jwalk` + Rayon for parallel file operations
- **Frontend**: React 19, TypeScript, Zustand (state management)
- **Editor**: MDXEditor (markdown-specific WYSIWYG)
- **UI**: shadcn/ui components, Tailwind CSS
- **Virtualization**: @tanstack/react-virtual for tree view, react-resizable-panels

**Architecture Pattern**: Unidirectional data flow with backend as single source of truth. Frontend maintains optimistic UI updates for responsiveness while backend handles all file system operations.

**Performance Targets**:
- Initial load: First 100 files in <200ms
- Folder expand: 500 children in <100ms
- Search: 10k files in <50ms
- Memory: <100MB for 10k file tree

**For Complete Details**: See [`packages/app/AGENTS.md`](./packages/app/AGENTS.md) for comprehensive architecture documentation and [`packages/app/PLAN.md`](./packages/app/PLAN.md) for implementation details.

---

### packages/site - Documentation & Distribution Site

**Status**: 🚧 In Development (Starlight template configured)

A static documentation website built with Astro and Starlight, serving as the primary entry point for users to discover, learn about, and download the MDX Desktop application.

**Current State**:
- Astro 5 with Starlight integration configured
- Basic template structure with guides and reference sections
- TypeScript support enabled
- Ready for content development

**Intended Purpose**:
1. **Download Hub**: Provide direct download links for platform-specific builds (Windows, macOS, Linux)
2. **Feature Showcase**: Explain and demonstrate key features of the desktop app with screenshots and videos
3. **Documentation**: Comprehensive guides covering installation, usage, keyboard shortcuts, and advanced features
4. **Community**: Link to GitHub repository, contribution guidelines, issue tracker, and creator information

**Planned Sections**:
- **Home**: Hero section with download buttons and feature highlights
- **Getting Started**: Installation guide, first steps, basic workflow
- **Features**: In-depth feature explanations with examples
- **Guides**: Tutorials for common workflows and advanced usage
- **Reference**: Keyboard shortcuts, configuration options, CLI commands
- **Download**: Platform-specific installers with version notes
- **Contributing**: How to report issues, contribute code, and support the project

**Tech Stack**:
- **Framework**: Astro 5 (static site generation)
- **Theme**: Starlight (documentation-focused)
- **Language**: TypeScript
- **Build**: Static HTML/CSS/JS (no runtime required)

**Development**:
```bash
cd packages/site
bun run dev      # Start dev server at localhost:4321
bun run build    # Build static site to ./dist/
bun run preview  # Preview production build
```

---

## Development Guidelines

### Package Manager: Bun (Required)

This project uses **Bun** as the package manager and runtime. Do not use npm, yarn, or pnpm.

**Common Commands**:
```bash
# Instead of npm install
bun install

# Instead of npm run <script>
bun run <script>

# Instead of npx <package>
bunx <package>

# Run TypeScript files directly
bun <file.ts>
```

### Workspace Development

**Working Across Packages**:
```bash
# Install dependencies for all packages
bun install

# Run commands in specific packages
cd packages/app && bun run dev
cd packages/site && bun run dev

# Add dependencies to specific packages
cd packages/app && bun add <package>
```

**Key Development Practices**:
- Use `bun` commands consistently (see CLAUDE.md for comprehensive list)
- App uses Vite for frontend bundling
- Site uses Astro's built-in build system
- Both packages use TypeScript with strict mode
- Bun automatically loads `.env` files (no dotenv package needed)

### Testing

**App Package**:
```bash
cd packages/app
bun test  # Run frontend tests with Bun's test runner
```

**Site Package**:
```bash
cd packages/site
bun run astro check  # Type checking
```

---

## Architecture Overview

### App: Native Desktop Architecture

**Pattern**: Backend-driven with optimistic UI updates

```
User Interaction
    ↓
Frontend (React/Zustand)
    ↓ [optimistic update]
UI Updates Immediately
    ↓ [tauri command]
Backend (Rust)
    ↓ [file system operation]
Atomic File Operation
    ↓ [success/error event]
Frontend Reconciles State
```

**Key Principles**:
- **Security First**: All paths canonicalized, input validation on every command
- **Performance**: Async operations, parallel processing, lazy loading
- **Reliability**: Atomic file operations, conflict detection, graceful error handling
- **Scalability**: Delta updates, virtualization, pagination for large datasets

### Site: Static Generation

**Pattern**: Build-time content generation with Starlight

```
Markdown Content (.md/.mdx)
    ↓
Astro Build Process
    ↓
Static HTML/CSS/JS
    ↓
Deploy to CDN/Static Host
```

**Key Principles**:
- **Performance**: Pre-rendered pages, optimized assets, minimal JavaScript
- **SEO**: Server-side rendered HTML with proper meta tags
- **Accessibility**: Starlight's built-in a11y features
- **Maintainability**: Markdown-based content, simple deployment

---

## File Structure Conventions

### App Package
- `src/components/` - React components (organized by feature)
- `src/stores/` - Zustand state stores
- `src/lib/` - Utility functions and API clients
- `src/types/` - TypeScript type definitions
- `src-tauri/src/` - Rust backend code
- `src-tauri/Cargo.toml` - Rust dependencies

### Site Package
- `src/content/docs/` - Documentation markdown files
- `src/assets/` - Images and media (processed by Astro)
- `public/` - Static files (downloads, favicons, robots.txt)
- `astro.config.mjs` - Astro and Starlight configuration

---

## Contributing & Community

**Repository**: *(Not yet configured - GitHub URL to be added)*

**How to Contribute**:
1. Report bugs and request features via GitHub Issues
2. Submit pull requests for bug fixes or new features
3. Improve documentation by editing content in `packages/site/src/content/docs/`
4. Share feedback and suggestions with the community

**Development Setup**:
1. Clone the repository
2. Run `bun install` in the root directory
3. Follow package-specific development instructions above
4. Make changes and test locally
5. Submit a pull request with a clear description

---

## For More Information

### Package-Specific Documentation
- **App Architecture**: [`packages/app/AGENTS.md`](./packages/app/AGENTS.md) - Comprehensive technical details
- **App Implementation**: [`packages/app/PLAN.md`](./packages/app/PLAN.md) - Complete implementation plan
- **Bun Guidelines**: [`CLAUDE.md`](./CLAUDE.md) - Development preferences and patterns

### External Resources
- [Tauri Documentation](https://tauri.app/v2/)
- [Astro Documentation](https://docs.astro.build/)
- [Starlight Documentation](https://starlight.astro.build/)
- [Bun Documentation](https://bun.sh/docs)

---

## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| App - Core Features | ✅ Complete | File operations, editing, auto-save working |
| App - Performance | ✅ Complete | Virtualization, lazy loading, search optimized |
| App - UI/UX | ✅ Complete | Theme support, keyboard shortcuts, native feel |
| Site - Setup | ✅ Complete | Astro + Starlight configured |
| Site - Content | 🚧 In Progress | Documentation pages to be written |
| Site - Download Hub | 📋 Planned | App builds and distribution setup needed |
| Monorepo - CI/CD | 📋 Planned | Build and release automation |

**Legend**: ✅ Complete | 🚧 In Progress | 📋 Planned

---

*This document serves as the entry point for AI agents and developers working on the MDX Desktop monorepo. For package-specific details, refer to the linked documentation within each package directory.*
