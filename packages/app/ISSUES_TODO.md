# Issues to Fix - Quick Reference

**Status**: Ready for implementation  
**Total Time**: ~90 minutes  
**Full Details**: See PLAN.md lines 273-788

---

## Quick Summary

| # | Issue | Priority | Time | Files |
|---|-------|----------|------|-------|
| 1 | File Watcher Toast Spam | 🔴 P0 | 45min | 6 files |
| 2 | MDX Icons Dark Mode | ⚠️ P2 | 5min | 1 file |
| 3 | Inline Creation Indent | ⚠️ P2 | 10min | 1 file |
| 4 | Delete Undo Content | ⚠️ P1 | 30min | 2 files |

---

## Recommended Implementation Order

### 1. Issue #2: MDX Icons (5 min) ✅ QUICK WIN
- **File**: `src/index.css`
- **Action**: Add 6 lines of CSS after line 137
- **Risk**: LOW

### 2. Issue #3: Inline Indent (10 min) ✅ QUICK WIN
- **File**: `src/components/FileTree/FileTreeVirtualized.tsx`
- **Action**: Fix depth calculation in lines 72-78
- **Risk**: LOW

### 3. Issue #1: Remove File Watcher (45 min) ⚠️ MAJOR REFACTOR
- **Files**: 
  - DELETE: `src/hooks/useFileWatcher.ts`
  - MODIFY: `src/App.tsx`, `src/stores/fileTreeStore.ts`, `src/stores/editorStore.ts`, `src/components/FileTree/FileTreeToolbar.tsx`
- **Action**: Remove watcher, add manual reload button + Ctrl+R
- **Risk**: MODERATE (large change, but simplifies codebase)

### 4. Issue #4: Delete Undo Content (30 min)
- **Files**: `src/stores/undoStore.ts`, `src/stores/fileTreeStore.ts`
- **Action**: Store file content before delete, restore on undo
- **Risk**: MODERATE (async read operation)

---

## Testing Checklist

After all fixes:
- [ ] Dark mode toolbar icons visible
- [ ] Inline creation indents correctly
- [ ] Auto-save shows no toast
- [ ] Opening files shows no toast
- [ ] Ctrl+R reloads tree
- [ ] Reload button works
- [ ] Delete + undo restores content
- [ ] Build succeeds: `bun run build`

---

**For detailed implementation plans, code examples, and architecture diagrams:**  
→ See PLAN.md "Known Issues & Fix Plan" section (lines 273-788)

