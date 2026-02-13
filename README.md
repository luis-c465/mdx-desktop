# MDX Desktop

![AI Coded](https://img.shields.io/badge/AI_Coded-Claude_Sonnet_4.5-8A2BE2?style=for-the-badge&logo=anthropic)
![OpenCode](https://img.shields.io/badge/Built_with-OpenCode-blue?style=for-the-badge)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-Latest-000000?style=for-the-badge&logo=bun&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-Latest-CE412B?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)

> **🤖 An AI Coding Experiment**: This entire project was coded by Claude Sonnet 4.5 using [OpenCode](https://opencode.ai). Extensive use of plan mode was employed to reduce AI drift and maintain architectural consistency throughout development.

---

## 📚 [Try the App - View Documentation](https://luis-c465.github.io/mdx-desktop/)

**[→ Download MDX Desktop](https://luis-c465.github.io/mdx-desktop/getting-started/installation)**

---

## What This Project Is

MDX Desktop is a **native desktop markdown editor** designed to handle large collections of markdown files (1000+ files) with exceptional performance. But more importantly, this project serves as a real-world demonstration of AI-assisted software development at scale.

### What Was Accomplished

This AI coding experiment successfully delivered:

- ✅ **Full-stack native application**: Tauri-based desktop app with Rust backend and React frontend
- ✅ **Production-ready features**: Auto-save, file watching, search, virtualization, theme support
- ✅ **Complex architecture**: Async operations, parallel processing, atomic file operations
- ✅ **Performance optimization**: Handles 10,000+ files efficiently with lazy loading
- ✅ **Complete monorepo**: Two integrated packages with proper workspace configuration
- ✅ **Documentation site**: Astro-based static site with Starlight integration
- ✅ **Comprehensive documentation**: Architecture docs, implementation plans, and agent guidelines

### The AI Development Approach

- **Tool**: Claude Sonnet 4.5 via [OpenCode](https://opencode.ai) agent
- **Methodology**: Heavy use of **plan mode** to maintain architectural vision and reduce drift
- **Scope**: Full project from initial concept to production-ready application
- **Complexity**: Multi-language (Rust + TypeScript), multi-framework (Tauri, React, Astro)

---

## About MDX Desktop

A high-performance native desktop application for editing and managing markdown files at scale. Built for developers, writers, and anyone who works with large markdown repositories.

### Key Features

- 🚀 **Performance at Scale**: Efficiently handles 1000+ markdown files
- 💾 **Smart Auto-save**: Debounced saves with atomic file operations
- 🔍 **Fast Search**: Search across thousands of files in milliseconds
- 👁️ **Real-time File Watching**: Detects external changes automatically
- 🎨 **Modern UI**: Clean interface with dark/light theme support
- ⚡ **Native Performance**: Built with Tauri for minimal resource usage
- 🔒 **Security First**: Path validation and protection against traversal attacks

---

## Project Structure

This is a **Bun-based monorepo** containing two integrated packages:

```
mdx-desktop-mono/
├── packages/
│   ├── app/              # 🖥️ Tauri Desktop Application
│   │   ├── src/          # React frontend (TypeScript)
│   │   ├── src-tauri/    # Rust backend
│   │   ├── AGENTS.md     # Detailed architecture documentation
│   │   └── PLAN.md       # Complete implementation plan
│   │
│   └── site/             # 📚 Documentation Website
│       ├── src/          # Astro + Starlight
│       └── public/       # Static assets and downloads
│
├── AGENTS.md             # Monorepo architecture guide
├── CLAUDE.md             # Development guidelines
└── package.json          # Workspace configuration
```

### Packages

#### `packages/app` - Desktop Application

**Status**: ✅ Production-ready, feature-complete

Native desktop markdown editor built with:
- **Backend**: Rust (Tauri 2), Tokio async runtime
- **Frontend**: React 19, TypeScript, Zustand state management
- **Editor**: MDXEditor (markdown WYSIWYG)
- **UI**: shadcn/ui components, Tailwind CSS

**[→ Read detailed architecture](./packages/app/AGENTS.md)**

#### `packages/site` - Documentation Site

**Status**: 🚧 Content in development

Static documentation and download hub built with:
- **Framework**: Astro 5 with Starlight theme
- **Language**: TypeScript
- **Deployment**: GitHub Pages

**[→ View live site](https://luis-c465.github.io/mdx-desktop/)**

---

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- [Rust](https://rustup.rs/) (for Tauri development)
- [Node.js](https://nodejs.org/) 18+ (for some Tauri build tools)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/luis-c465/mdx-desktop.git
cd mdx-desktop-mono

# Install all dependencies
bun install

# Run the desktop app in development mode
cd packages/app
bun run dev

# Or run the documentation site
cd packages/site
bun run dev
```

### Package-Specific Commands

#### Desktop App (`packages/app`)

```bash
cd packages/app

# Development mode (hot reload)
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

#### Documentation Site (`packages/site`)

```bash
cd packages/site

# Development server
bun run dev

# Build static site
bun run build

# Preview production build
bun run preview

# Type checking
bun run astro check
```

---

## Technology Stack

### Desktop Application

| Layer | Technology |
|-------|------------|
| **Backend** | Rust, Tauri 2, Tokio |
| **Frontend** | React 19, TypeScript |
| **State Management** | Zustand |
| **Editor** | MDXEditor |
| **UI Components** | shadcn/ui, Tailwind CSS |
| **Virtualization** | @tanstack/react-virtual |
| **File Operations** | jwalk, Rayon |

### Documentation Site

| Layer | Technology |
|-------|------------|
| **Framework** | Astro 5 |
| **Theme** | Starlight |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |

### Build Tools

- **Package Manager**: Bun
- **Workspace**: Bun workspaces
- **Bundler**: Vite (app), Astro (site)

---

## Project Status

| Component | Status | Description |
|-----------|--------|-------------|
| 🖥️ **App - Core Features** | ✅ Complete | File operations, editing, auto-save |
| ⚡ **App - Performance** | ✅ Complete | Virtualization, search, lazy loading |
| 🎨 **App - UI/UX** | ✅ Complete | Themes, shortcuts, native feel |
| 📚 **Site - Setup** | ✅ Complete | Astro + Starlight configured |
| 📝 **Site - Content** | 🚧 In Progress | Documentation being written |
| 📦 **App - Builds** | 📋 Planned | Platform-specific releases |
| 🔄 **CI/CD** | 📋 Planned | Automated build and deploy |

**Legend**: ✅ Complete | 🚧 In Progress | 📋 Planned

---

## Links & Resources

- 📚 **[Documentation Site](https://luis-c465.github.io/mdx-desktop/)** - Complete guides and reference
- 📥 **[Download App](https://luis-c465.github.io/mdx-desktop/getting-started/installation)** - Get the latest release
- 🏗️ **[Architecture Guide](./packages/app/AGENTS.md)** - Detailed technical documentation
- 🗺️ **[Implementation Plan](./packages/app/PLAN.md)** - Complete development roadmap
- 🤖 **[AI Development Guidelines](./AGENTS.md)** - Monorepo context for AI agents
- 💻 **[OpenCode](https://opencode.ai)** - The AI agent used to build this project

---

## Contributing

This project was built as an AI coding experiment, but contributions are welcome! Whether you want to:

- Report bugs or request features via [GitHub Issues](https://github.com/luis-c465/mdx-desktop/issues)
- Submit pull requests for improvements
- Improve documentation
- Share your experience using the app

All contributions help demonstrate what AI-human collaboration can achieve.

---

## License

[License information to be added]

---

## Acknowledgments

- **Claude Sonnet 4.5** by Anthropic - The AI that coded this project
- **[OpenCode](https://opencode.ai)** - The agent framework that made this possible
- **Plan Mode** - For keeping the AI focused and reducing architectural drift
- The open-source community for the amazing tools that made this project possible

---

**Built with 🤖 by Claude Sonnet 4.5 • Powered by [OpenCode](https://opencode.ai)**
