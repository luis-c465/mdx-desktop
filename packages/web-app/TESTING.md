# Web App Validation Checklist

Step 11 focuses on functional validation, large-tree performance checks, and UX polish.

## Automated checks

- `bun run build`
- `bun run benchmark:tree`

## Manual functional checklist

- Workspace open and restore after refresh
- Re-grant permission flow for remembered workspace
- Create, rename, and delete files/folders
- Autosave and manual save while switching files
- Undo delete within 5 seconds
- Search and virtualized tree scrolling
- Image upload and markdown path insertion
- Keyboard shortcuts (`Ctrl/Cmd+S`, `Ctrl/Cmd+F`, `Ctrl/Cmd+H`, `Ctrl/Cmd+R`)
- PWA install prompt and offline app shell startup

## Edge cases covered in this step

- Stale active paths are cleared after workspace switches/deletes
- Folder selection no longer renders stale editor content
- API error messages are normalized for clearer toasts
- Tree flattening path updated to iterative traversal for large-tree performance
