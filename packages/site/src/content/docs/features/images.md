---
title: Working with Images
description: Learn how to add, manage, and troubleshoot images in your markdown files.
---

MDX Desktop makes it easy to add images to your markdown documents with drag-and-drop, copy-paste, and file browser support. The image plugin automatically organizes your images, validates file sizes, and handles duplicate filenames—but there are some important caveats to understand about how images are stored and referenced.

## Adding Images

### Paste from Clipboard

The fastest way to add an image:

1. **Copy an image** to your clipboard (screenshot, image from browser, etc.)
2. **Click** in the editor where you want the image
3. **Paste** with `Ctrl/Cmd + V`
4. The image is automatically uploaded and inserted

### Drag and Drop

Add images from your file manager:

1. **Open your file manager** (Explorer, Finder, Nautilus)
2. **Drag an image file** from your file manager
3. **Drop it into the editor** where you want it to appear
4. The image is automatically uploaded and inserted

## How Image Storage Works

When you add an image, MDX Desktop performs several steps automatically:

1. **Validates** the file size (must be under 10MB) and format
2. **Organizes** by saving to an `assets/YYYY-MM/` folder based on the current month
3. **Renames** if a duplicate filename exists (adds timestamp suffix)
4. **Inserts** the markdown reference into your document

:::note[Month-Based Organization]
Images are automatically organized into folders like `assets/2026-02/`, `assets/2026-03/`, etc. This keeps your workspace tidy and makes it easy to find recent images.
:::

### Example Folder Structure

After adding several images over time, your workspace might look like this:

```
my-notes/
├── README.md
├── project-notes.md
├── meeting-minutes.md
└── assets/
    ├── 2026-01/
    │   ├── diagram.png
    │   └── screenshot.png
    ├── 2026-02/
    │   ├── profile-pic.jpg
    │   ├── chart.png
    │   └── logo.svg
    └── 2026-03/
        └── new-feature.png
```

Each month gets its own folder, preventing any single folder from becoming cluttered with hundreds of images.

## Supported Image Formats

MDX Desktop supports the most common image formats:

| Format | Extensions | Best For | Notes |
|--------|------------|----------|-------|
| **PNG** | `.png` | Screenshots, UI elements, graphics with transparency | Lossless compression, larger file sizes |
| **JPEG** | `.jpg`, `.jpeg` | Photos, images with many colors | Lossy compression, smaller file sizes |
| **WebP** | `.webp` | Modern web images | Best compression, smaller than JPEG/PNG |
| **GIF** | `.gif` | Simple animations, small graphics | Limited colors, animation support |
| **SVG** | `.svg` | Logos, icons, vector graphics | Scalable, text-based format |

:::tip[Choosing a Format]
- Use **PNG** for screenshots and graphics where quality matters
- Use **JPEG** for photos and large images where smaller file size is important
- Use **WebP** for the best balance of quality and file size
- Use **SVG** for logos and icons that need to scale without losing quality
:::

## Image Size Limits

**Maximum file size: 10MB**

Images larger than 10MB will be rejected with an error message. This limit prevents:
- Slow uploads and editing performance
- Excessive disk space usage
- Git repository bloat if you use version control

:::caution[Large Images Warning]
If you have images over 10MB, compress them before uploading. Most image editing tools (Photoshop, GIMP, online compressors) can reduce file sizes without noticeable quality loss.
:::

## Important Caveats

Before using images extensively in MDX Desktop, understand these important limitations and behaviors:

### 1. Asset Protocol - Portability Issue ⚠️

**The most critical caveat**: When you insert an image, the markdown contains a special `asset://` URL:

```markdown
![My Screenshot](asset://localhost/home/user/workspace/assets/2026-02/screenshot.png)
```

**Problem**: This `asset://` protocol is **MDX Desktop specific** and only works within the app. This means:

❌ **Won't work in**:
- Other markdown editors (VS Code, Typora, Obsidian)
- GitHub/GitLab markdown preview
- Static site generators (unless configured)
- Browser markdown viewers
- Exported HTML (without processing)

✅ **Only works in**:
- MDX Desktop application

**Why this happens**: The `asset://` protocol is a Tauri security feature that allows the app to safely load local files. It prevents web-based security exploits while giving you access to your local images.

#### Workaround for Portable Markdown

If you need your markdown files to work in other editors or on GitHub:

1. **Insert the image** normally in MDX Desktop
2. **Switch to Source Mode** (click the code icon in toolbar)
3. **Manually edit** the image reference to use a relative path:

```markdown
<!-- Change this: -->
![My Screenshot](asset://localhost/.../assets/2026-02/screenshot.png)

<!-- To this: -->
![My Screenshot](./assets/2026-02/screenshot.png)
```

4. The relative path will work in most markdown tools

:::tip[Future Export Feature]
A future version of MDX Desktop may include an "Export" feature that automatically converts `asset://` URLs to relative paths. For now, manual editing is required.
:::

### 2. External Images (URLs)

You can manually add external image URLs in source mode:

```markdown
![Example Image](https://example.com/image.png)
```

**Important behaviors**:
- External images are **not downloaded** or stored locally
- They will only display when you **have internet access**
- If the external URL breaks or changes, your image will disappear
- No size validation or format checking

:::note[When to Use External URLs]
External URLs are useful for:
- Linking to images you don't control (documentation, references)
- Keeping file sizes small (images stay on the web)
- Temporary images that don't need to be archived
:::

### 3. Duplicate Filename Handling

If you upload an image with a filename that already exists in the same month's folder:

**First upload**:
```
assets/2026-02/screenshot.png
```

**Second upload** (same name):
```
assets/2026-02/screenshot-1708123456.png
```

The second file gets a **timestamp suffix** (Unix timestamp) to prevent overwriting.

**Implications**:
- ✅ Prevents accidental overwrites
- ❌ Can create many similar filenames over time
- ❌ Makes it harder to find specific images later

:::tip[Best Practice]
Give your images **descriptive names** before uploading:
- ✅ `user-profile-page.png`
- ✅ `login-flow-diagram.png`
- ❌ `screenshot.png`
- ❌ `IMG_1234.png`
:::

### 4. Moving or Renaming Workspace

The image system uses **absolute paths internally**. If you:

- Move your workspace folder to a different location
- Rename your workspace folder
- Move it to a different drive

**Result**: Image references may break because the absolute paths no longer match.

:::caution[Keep Workspace Stable]
Choose a permanent location for your workspace before adding many images. Moving it later may require manually fixing image references.
:::

**If you must move a workspace**:
1. Close MDX Desktop
2. Move the workspace folder
3. Open the workspace in MDX Desktop at its new location
4. Check a few files with images to see if they display
5. If broken, you'll need to manually fix paths in source mode

### 5. No Automatic Image Cleanup

MDX Desktop does **not automatically delete** image files when you:

- Delete an image from markdown
- Delete an entire markdown file that referenced images
- Remove image references during editing

**Result**: "Orphaned" images accumulate in the `assets/` folder, taking up disk space.

:::caution[Manual Cleanup Needed]
Periodically review your `assets/` folder and manually delete unused images to free up disk space.
:::

**Finding orphaned images** (manual process):
1. Open your workspace folder in file manager
2. Browse the `assets/` folders
3. Check if images are referenced in any markdown files
4. Delete images that are no longer needed

### 6. Version Control Considerations

If you use Git or another version control system:

**Image files**:
- Are binary files (not text-diffable)
- Can make your repository size grow quickly
- Should be committed when referenced in markdown

**Best practices**:
- Add `assets/` to your Git repository so images are versioned
- Consider using **Git LFS** (Large File Storage) for large images
- Don't commit orphaned images—clean them up first
- Use `.gitignore` for temporary image folders if needed

## Best Practices

Follow these recommendations for the best image management experience:

### 1. Name Images Descriptively

**Before uploading**, rename generic filenames to descriptive ones:

| ❌ Avoid | ✅ Better |
|---------|-----------|
| `IMG_1234.png` | `dashboard-wireframe.png` |
| `screenshot.png` | `error-message-modal.png` |
| `image001.jpg` | `team-photo-2026.jpg` |
| `Untitled.png` | `login-button-hover-state.png` |

### 2. Compress Large Images

Before uploading images close to the 10MB limit:

- **Online tools**: TinyPNG, Squoosh, Compressor.io
- **Desktop tools**: ImageOptim (Mac), GIMP, Photoshop
- **Command line**: `imagemagick`, `pngquant`, `jpegoptim`

A good target is keeping images under 1-2MB unless they're high-resolution photos.

### 3. Choose the Right Format

| Use Case | Recommended Format |
|----------|-------------------|
| Screenshot of UI | PNG |
| Photo of people/places | JPEG or WebP |
| Logo or icon | SVG (if available) or PNG |
| Diagram with transparency | PNG |
| Animated graphic | GIF or WebP |

### 4. Periodically Clean Up

Set a reminder to review your `assets/` folder every few months:

- Delete images that are no longer referenced
- Compress large images if needed
- Consolidate duplicate images with different names

### 5. If Portability Matters

If you plan to use your markdown files outside MDX Desktop:

- Manually convert `asset://` URLs to relative paths
- Or wait for a future export feature
- Test your files in other editors to ensure images display

### 6. Backup Your Assets Folder

The `assets/` folder contains your images. Make sure:

- It's included in your backups
- It's committed to version control (if using Git)
- You have copies before moving/reorganizing your workspace

## Troubleshooting

### Image Won't Upload

**Error**: "File too large" or upload fails

**Possible solutions**:
- ✅ Check file size—must be under 10MB. Compress the image if needed.
- ✅ Verify format—only PNG, JPEG, WebP, GIF, and SVG are supported.
- ✅ Ensure workspace is open—you can't upload images without an open workspace.
- ✅ Check folder permissions—workspace folder must be writable.

### Image Not Displaying

**Error**: Broken image icon or blank space

**Possible causes and solutions**:

| Issue | Solution |
|-------|----------|
| Image file was moved/deleted | Check if file exists in `assets/YYYY-MM/` folder |
| Markdown syntax error | Switch to source mode and verify image syntax |
| Opening file outside MDX Desktop | `asset://` URLs only work in MDX Desktop—use relative paths |
| Workspace was moved | Reopen workspace in new location; may need to fix paths |

### Image Quality Looks Bad

**Issue**: Compressed or blurry image

**Solutions**:
- Upload a higher resolution version
- Use PNG instead of JPEG for screenshots
- Check original image quality before uploading

### Can't Find Uploaded Images

**Issue**: Not sure where image files are stored

**Solution**:
- Images are in `workspace/assets/YYYY-MM/` folders
- Check the month folders based on when you uploaded them
- Search your workspace folder for the filename

### Wrong Image Uploaded

**Issue**: Uploaded the wrong file

**Solution**:
1. Delete the image from markdown (select and press Delete)
2. The file remains in `assets/` folder (see caveat #5)
3. Upload the correct image
4. Manually delete the wrong file from `assets/` folder if desired

## Related Documentation

- [Editor Plugins](/features/plugins/) - Overview of all editor plugins including the image plugin
- [Markdown Editor](/features/editor/) - General editor features and interface
- [File Management](/features/file-management/) - Managing your workspace and files
- [Basic Usage](/guides/basic-usage/) - Getting started with MDX Desktop
