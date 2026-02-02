# Agent Context - Tauri Markdown Editor

## Project Overview

A native desktop markdown editor built with Tauri, designed for performance at scale (1000+ files). Features a React-based frontend with MDXEditor integration and a Rust backend handling all file system operations.

**Architecture**: Unidirectional data flow with centralized state management. Backend serves as the single source of truth for file operations; frontend maintains optimistic UI updates for responsiveness.

## Tech Stack

### Backend
- **Runtime**: Rust with Tauri
- **File System Watching**: `notify` + `notify-debouncer-mini` (100ms debounce)
- **Parallel Processing**: `jwalk` + Rayon for multi-core directory scanning
- **Async Runtime**: Tokio for non-blocking I/O operations

### Frontend
- **Framework**: React 19 (with concurrent features)
- **Language**: TypeScript
- **State Management**: Zustand
- **UI Components**: shadcn/ui (headless components)
- **Styling**: Tailwind CSS
- **Markdown Editor**: MDXEditor
- **Virtualization**: react-window for tree view performance
- **Build Tool**: Vite
- **Package Manager**: Bun

### Key Libraries
- **Search**: Fuse.js (fuzzy search in web worker)
- **Panels**: react-resizable-panels
- **Virtual Scrolling**: @tanstack/react-virtual

## Key Features

- **Security**: Path canonicalization prevents directory traversal attacks
- **Auto-save**: 300ms debounced saves with temp file + atomic rename
- **Scalability**: Lazy loading, pagination (500 items/page), delta updates
- **Performance**: Virtual scrolling, granular state selectors, web worker search
- **File Watching**: Real-time file system change detection with debouncing

## Performance Targets

- Initial load: First 100 files in <200ms
- Folder expand: 500 children in <100ms
- Search: 10k files in <50ms
- Memory: <100MB for 10k file tree

## For More Information

See [PLAN.md](./PLAN.md) for complete architecture details, implementation plan, design decisions, and scaling strategies.
