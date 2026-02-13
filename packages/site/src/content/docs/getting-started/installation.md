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

If you want to try MDX Desktop now or contribute to development, visit the [GitHub repository](https://github.com/luis-c465/mdx-desktop) for complete build instructions.

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
- [FAQ](/reference/faq/) - Common questions answered
