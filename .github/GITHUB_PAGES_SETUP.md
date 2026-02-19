# GitHub Pages Deployment Setup

This workflow automatically deploys the documentation site to GitHub Pages when a new version tag is pushed.

## Initial Setup (One-Time Configuration)

To enable GitHub Pages deployment, you need to configure your repository settings:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"
   - This allows the workflow to deploy directly

### 2. Configure Site URL (if different)

The current configuration assumes:
- **Site URL**: `https://luis-c465.github.io`
- **Base path**: `/mdx-desktop`

If your repository has a different owner or name, update `packages/site/astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://YOUR-USERNAME.github.io',
  base: '/YOUR-REPO-NAME',
  // ... rest of config
});
```

## How It Works

### Automatic Deployment

The workflow triggers automatically when you push a version tag:

```bash
# Tag a new version
git tag v1.0.0

# Push the tag to trigger both release and site deployment
git push origin v1.0.0
```

This will:
1. Build the Tauri app for all platforms (via `release.yml`)
2. Build and deploy the Astro site to GitHub Pages (via `deploy-site.yml`)
3. Create a GitHub release with the app installers

### Manual Deployment

You can also trigger the site deployment manually:

1. Go to **Actions** tab in your repository
2. Select "Deploy Site to GitHub Pages"
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Workflow Details

### File: `.github/workflows/deploy-site.yml`

**Triggers**:
- Tag push matching `v*.*.*` pattern
- Manual workflow dispatch

**Steps**:
1. **Build Job**:
   - Checks out repository
   - Extracts version from tag (if available)
   - Installs Bun and dependencies
   - Builds Astro site with proper base path
   - Uploads build artifacts

2. **Deploy Job**:
   - Deploys to GitHub Pages
   - Sets environment URL for easy access

**Permissions**:
- `contents: read` - Read repository files
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Required for GitHub Pages deployment

## Verifying Deployment

After the workflow completes:

1. Check the **Actions** tab for workflow status
2. Visit the deployed site at: `https://luis-c465.github.io/mdx-desktop`
3. The site URL is also shown in the workflow summary

## Troubleshooting

### Deployment fails with permission error

Ensure GitHub Actions has permissions:
1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

### Site loads but CSS/JS fails to load

The base path might be incorrect. Check:
1. Repository name matches the `base` in `astro.config.mjs`
2. The workflow is using the correct base path
3. Clear browser cache and try again

### Manual workflow doesn't appear

Ensure:
1. The workflow file is in `.github/workflows/` directory
2. The file is pushed to the `main` or `master` branch
3. GitHub Actions is enabled for the repository

## Local Testing

To test the production build locally with the correct base path:

```bash
cd packages/site

# Build with production settings
bun run build

# Preview the production build
bun run preview
```

The preview server will serve the site with the configured base path.

## Related Files

- `.github/workflows/deploy-site.yml` - Deployment workflow
- `.github/workflows/release.yml` - App release workflow (triggers site deployment)
- `packages/site/astro.config.mjs` - Site configuration with URL/base path
- `packages/site/package.json` - Build scripts
