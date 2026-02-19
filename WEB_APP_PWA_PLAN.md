# MDX Desktop Web App & PWA Plan

## Goal

Create a new package `packages/web-app` that delivers the native app's functionality as a website + installable PWA, replacing Rust/Tauri backend capabilities with modern Chrome Web APIs.

Assumptions and decisions:

- Code sharing strategy: **standalone copy** (no shared package)
- Offline scope: **app shell caching only**
- Permission model: **PWA-first with browser fallback**
- Browser target: **modern Chrome/Chromium**

---

## Architecture Summary

- Keep React/Zustand UI architecture from `packages/app`
- Replace `@tauri-apps/api` command bridge with a browser FS layer built on:
  - `showDirectoryPicker`
  - `FileSystemDirectoryHandle` / `FileSystemFileHandle`
  - `createWritable`, `getFile`, `entries`, `removeEntry`
- Persist workspace handle in IndexedDB for session restore
- Add PWA support with `vite-plugin-pwa` (manifest + service worker)

---

## Rust Backend to Web API Mapping

| Native command/capability | Web replacement |
|---|---|
| Open workspace dialog | `window.showDirectoryPicker({ mode: 'readwrite' })` |
| Read file | `fileHandle.getFile().text()` |
| Write file | `fileHandle.createWritable().write(...).close()` |
| Create file | `dirHandle.getFileHandle(name, { create: true })` |
| Create folder | `dirHandle.getDirectoryHandle(name, { create: true })` |
| Delete file/folder | `dirHandle.removeEntry(name, { recursive: true })` |
| Rename/move | copy+delete fallback (optionally `move()` if supported) |
| Read directory (lazy) | iterate `for await (const [name, handle] of dirHandle.entries())` |
| Directory pagination | read entries then slice (`offset`, `limit`) |
| Workspace persistence | IndexedDB stored `FileSystemDirectoryHandle` |
| Path security | browser handle sandbox + reject `..` segments |
| Image upload | save binary to workspace `assets/YYYY-MM/...` |

Notes:

- Native atomic temp-file-rename writes are not directly equivalent on Web APIs; use `createWritable()`.
- Installed PWA on Chrome 122+ can improve permission persistence.

---

## Step-by-Step Execution Plan

### 1) Scaffold `packages/web-app`

Create a new Vite React TypeScript package mirroring `packages/app` tooling, without Tauri:

- Create `packages/web-app/package.json`
- Copy config baseline from `packages/app`:
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `tailwind.config.js`
  - `components.json`
  - `.gitignore`
- Create `vite.config.ts`:
  - keep React + Tailwind plugin
  - remove Tauri-specific server/HMR settings
  - add `VitePWA()` plugin (initial minimal config)
- Create `index.html` with title `MDX Web`
- Install deps with `bun install`

Deliverable: `packages/web-app` boots with `bun run dev`.

---

### 2) Copy Frontend Source as Standalone

Copy `packages/app/src` to `packages/web-app/src`, then decouple from Tauri:

- Replace `src/lib/api.ts` internals with temporary stubs (same signatures)
- Remove direct `@tauri-apps/api` imports
- Keep component/store structure intact
- Copy `packages/app/public` into `packages/web-app/public`

Deliverable: project compiles with placeholders and no Tauri dependency usage.

---

### 3) Build Browser Filesystem Service Layer

Implement a dedicated browser FS layer to back `api.ts`.

Create `src/lib/handle-store.ts`:

- Save/load/clear `FileSystemDirectoryHandle` in IndexedDB

Create `src/lib/fs-service.ts`:

- `openWorkspace()`
- `restoreWorkspace()`
- `clearWorkspace()`
- `readFile(path)`
- `writeFile(path, content)`
- `createFile(path)`
- `createFolder(path)`
- `deletePath(path)`
- `renamePath(oldPath, newPath)` (copy+delete fallback)
- `readDirectory(path, includeHidden)`
- `getDirectoryPage(path, offset, limit, includeHidden)`
- path resolver utilities (workspace-relative path traversal)

Then rewrite `src/lib/api.ts` to call this service.

Deliverable: all API methods used by stores are implemented using Web APIs.

---

### 4) Adapt Workspace Store to Web Permission Model

Update `src/stores/workspaceStore.ts`:

- `selectWorkspace()` -> browser picker + persist handle
- `loadWorkspace()` -> restore handle from IndexedDB + permission check
- add explicit re-grant flow when `queryPermission()` is not granted

UX behavior:

- Browser mode: may require per-session permission re-request
- Installed PWA: should usually restore with fewer prompts

Deliverable: workspace restore flow works on reload.

---

### 5) Adapt File Tree Store

Update `src/stores/fileTreeStore.ts` for web path semantics:

- keep paths workspace-relative
- remove/adjust assumptions about absolute native paths
- keep lazy loading + optimistic operations
- keep markdown-only file filtering

Deliverable: tree loads, expands, and mutates correctly using browser FS.

---

### 6) Adapt Editor Store

Update `src/stores/editorStore.ts` integration:

- `loadFile` and `saveFile` use rewritten API
- preserve 300ms autosave behavior
- preserve dirty-state/unload protection behavior

Deliverable: open/edit/autosave/manual-save all function correctly.

---

### 7) Validate Undo Store Behavior

Verify `src/stores/undoStore.ts` against new API implementation:

- delete + undo within 5 seconds
- restore file content when available
- refresh parent node after undo

Deliverable: undo behavior parity with native UX.

---

### 8) Web-Specific UX Updates

Add web-first affordances:

- Permission banner when stored handle requires re-grant
- Chromium support warning when FS Access API unavailable
- Optional install CTA for PWA in header
- remove references that imply native-only path visibility

Deliverable: clear permission/install experience for browser users.

---

### 9) Rebuild Image Upload on Web FS

Re-implement `uploadImage(file)` behavior from Rust in TypeScript:

- validate extension + max size
- sanitize filename
- write into `assets/YYYY-MM/` under workspace
- handle collisions via timestamp suffix
- return markdown-usable relative path

Ensure editor preview flow resolves those image paths correctly.

Deliverable: paste/drag image upload works in editor.

---

### 10) Configure PWA Properly

Finalize PWA with `vite-plugin-pwa`:

- manifest (name, icons, standalone display, theme colors)
- service worker generation
- app-shell caching only (HTML/CSS/JS/assets)
- installability checks

Deliverable: installable PWA with offline app shell startup.

---

### 11) Test, Benchmark, Polish

Run full functional validation:

- workspace open/restore
- CRUD operations
- autosave and file switching
- undo flow
- search and virtualization
- image upload
- keyboard shortcuts
- PWA install/offline shell

Performance checks on larger trees (1k+ files), then polish messaging and edge-case handling.

Deliverable: production-ready `packages/web-app` feature set.

---

## Risks and Mitigations

1. Permission prompts may recur in browser mode
   - Mitigation: optimize for installed PWA, clear re-grant UX

2. Rename/move API support is uneven
   - Mitigation: implement reliable copy+delete fallback

3. Web write path is not identical to native atomic rename pattern
   - Mitigation: preserve debounce + robust error/retry UX

4. Large directory scans may be slower than Rust parallel scanner
   - Mitigation: retain lazy loading, pagination, virtualization

---

## Suggested Implementation Order (Critical Path)

1 -> 2 -> 3 -> 4 -> 5/6/7 -> 8/9/10 -> 11

Parallelizable:

- Steps 5, 6, 7 can run in parallel after step 4 starts stabilizing
- Step 10 can run in parallel with late 5-9 work

---

## Primary Files Expected to Change/Add

- `packages/web-app/package.json`
- `packages/web-app/vite.config.ts`
- `packages/web-app/index.html`
- `packages/web-app/src/lib/api.ts`
- `packages/web-app/src/lib/fs-service.ts` (new)
- `packages/web-app/src/lib/handle-store.ts` (new)
- `packages/web-app/src/stores/workspaceStore.ts`
- `packages/web-app/src/stores/fileTreeStore.ts`
- `packages/web-app/src/stores/editorStore.ts` (minimal)
- `packages/web-app/src/stores/undoStore.ts` (verify/minimal)
- `packages/web-app/public/*` (PWA icons/manifest assets)
