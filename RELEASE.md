# Release Process

This document describes how to create a new release of MDX Desktop using the automated GitHub Actions workflow.

## Overview

The release process is fully automated via GitHub Actions. When you push a version tag (e.g., `v1.0.0`), the workflow will:

1. Build platform-specific installers for macOS, Windows, and Linux
2. Automatically stamp the version from the tag into the application
3. Create a GitHub Release with all installers attached

## Supported Platforms & Formats

| Platform | Format | File Extension | Description |
|----------|--------|----------------|-------------|
| **macOS** | DMG | `.dmg` | Disk image installer for macOS |
| **Windows** | MSI | `.msi` | Windows Installer package |
| **Linux** | DEB | `.deb` | Debian/Ubuntu package |
| **Linux** | RPM | `.rpm` | Fedora/RHEL/CentOS package |
| **Linux** | AppImage | `.AppImage` | Universal Linux executable |

> **Note**: Flatpak distribution requires separate Flathub submission and is not part of the automated workflow.

## Creating a Release

### Prerequisites

- All changes committed and pushed to `main` branch
- Tests passing locally
- Application tested on at least one platform

### Steps

1. **Choose a version number** following [Semantic Versioning](https://semver.org/):
   - `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
   - Increment MAJOR for breaking changes
   - Increment MINOR for new features
   - Increment PATCH for bug fixes

2. **Create and push a git tag**:

   ```bash
   # Create a tag (note the 'v' prefix is required)
   git tag v1.0.0
   
   # Push the tag to GitHub
   git push origin v1.0.0
   ```

3. **Monitor the workflow**:
   - Go to the [Actions tab](https://github.com/luis-c465/mdx-desktop/actions) in your GitHub repository
   - Find the "Release Build" workflow run for your tag
   - Monitor the three parallel build jobs (macOS, Windows, Linux)

4. **Verify the release**:
   - Once the workflow completes, check the [Releases page](https://github.com/luis-c465/mdx-desktop/releases)
   - Download and test at least one installer to verify it works
   - Edit the release notes if needed (the workflow auto-generates them from commits)

## Version Stamping

The workflow automatically updates version numbers in these files at build time:

- `packages/app/src-tauri/tauri.conf.json` - Tauri configuration version
- `packages/app/src-tauri/Cargo.toml` - Rust package version

**You do NOT need to manually update these files before tagging.** The version from the git tag is the single source of truth.

> **Important**: The version stamping only happens in the CI build. Your local files remain unchanged at `0.1.0` (or whatever version they were at). This is intentional to avoid unnecessary commits.

## Workflow Architecture

The release workflow consists of 4 jobs:

### 1. `build-macos` (runs on `macos-latest`)
- Extracts version from tag
- Stamps version into config files
- Installs Rust toolchain and Bun
- Builds frontend with Vite
- Runs Tauri build to create DMG
- Uploads DMG as artifact

### 2. `build-windows` (runs on `windows-latest`)
- Same steps as macOS
- Creates MSI installer instead of DMG
- Uses Git Bash for cross-platform shell commands

### 3. `build-linux` (runs on `ubuntu-latest`)
- Installs system dependencies (webkit2gtk, librsvg, etc.)
- Same build process as other platforms
- Creates DEB, RPM, and AppImage installers
- Uploads all three formats

### 4. `create-release` (runs on `ubuntu-latest`)
- Depends on all three build jobs completing
- Downloads all artifacts
- Creates GitHub Release with auto-generated release notes
- Attaches all installers to the release

## Troubleshooting

### Build Fails on One Platform

If only one platform fails:
1. Check the workflow logs for that specific job
2. Common issues:
   - **macOS**: Code signing issues (currently unsigned)
   - **Windows**: MSI creation errors (check WiX configuration)
   - **Linux**: Missing system dependencies

You can re-run just the failed job from the GitHub Actions UI.

### Version Mismatch

If the built app shows the wrong version:
1. Verify the tag follows the `v[0-9]+.[0-9]+.[0-9]+` format exactly
2. Check the "Extract version from tag" step in the workflow logs
3. Ensure `jq` and `sed` commands ran successfully

### Artifacts Missing

If installers are not attached to the release:
1. Check that all three build jobs completed successfully
2. Verify the artifact upload steps succeeded
3. Check that file paths match the Tauri 2 bundle output structure

### Tag Already Exists

If you need to re-release the same version:
```bash
# Delete the tag locally
git tag -d v1.0.0

# Delete the tag remotely
git push origin :refs/tags/v1.0.0

# Delete the GitHub Release manually
# (Go to Releases page → Edit → Delete)

# Then create the tag again
git tag v1.0.0
git push origin v1.0.0
```

## Security Considerations

### Code Signing

**Currently, the builds are unsigned.** For production releases, you should:

- **macOS**: Add Apple Developer certificate and notarization
- **Windows**: Add Authenticode signing certificate
- **Linux**: Consider signing AppImages (optional)

See the [Tauri code signing documentation](https://tauri.app/v2/guides/distribution/sign/) for details.

### Permissions

The workflow requires:
- `contents: write` permission to create releases (already configured)
- `GITHUB_TOKEN` secret (automatically provided by GitHub)

No additional secrets are needed for basic unsigned builds.

## Manual Release (Emergency)

If the automated workflow fails completely, you can build manually:

```bash
# On each platform (macOS, Windows, Linux):
cd packages/app

# Manually update versions
# Edit src-tauri/tauri.conf.json → "version": "1.0.0"
# Edit src-tauri/Cargo.toml → version = "1.0.0"

# Install dependencies
bun install

# Build
bunx tauri build

# Find installers in:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/{deb,rpm,appimage}/
```

Then manually create the GitHub Release and upload the files.

## Future Enhancements

Planned improvements to the release process:

- [ ] Add code signing for macOS and Windows
- [ ] Implement automatic update checking (Tauri updater)
- [ ] Add release changelog generation from conventional commits
- [ ] Set up Flathub submission workflow
- [ ] Create beta/prerelease channel (tags like `v1.0.0-beta.1`)
- [ ] Add smoke tests before release creation
- [ ] Upload installers to alternative distribution channels (Homebrew, Chocolatey, etc.)

## Related Documentation

- [Tauri Build Documentation](https://tauri.app/v2/guides/building/)
- [Tauri Distribution Guide](https://tauri.app/v2/guides/distribution/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Semantic Versioning](https://semver.org/)

## Support

If you encounter issues with the release process:

1. Check the [GitHub Actions logs](https://github.com/luis-c465/mdx-desktop/actions)
2. Review this documentation
3. Open an issue on the repository

---

*Last updated: 2026-02-05*
