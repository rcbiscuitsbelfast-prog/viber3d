# GitHub Pages Setup Guide

This document explains how to configure GitHub Pages for the Quests4Friends template deployment.

## Overview

The production branch is configured with a GitHub Actions workflow that automatically builds and deploys the Quests4Friends template to GitHub Pages when changes are pushed to the `production` branch.

## Prerequisites

- Repository: `rcbiscuitsbelfast-prog/viber3d`
- Branch: `production`
- Workflow: `.github/workflows/deploy-quests4friends.yml`

## Deployment Workflow

The deployment workflow automatically:

1. **Triggers on push** to the `production` branch
2. **Checks out** the repository code
3. **Installs dependencies** for the Quests4Friends template
4. **Builds** the production bundle using Vite
5. **Deploys** the built files to the `gh-pages` branch via GitHub Pages

### Build Configuration

The Quests4Friends template is configured with:
- **Base path**: `/viber3d/` (repository name)
- **Output directory**: `templates/quests4friends/dist`
- **Source maps**: Enabled for debugging

## Manual Deployment

To trigger a deployment manually:

1. Go to the **Actions** tab in your GitHub repository
2. Select **Deploy Quests4Friends to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the `production` branch
5. Click **Run workflow**

## Setting Up GitHub Pages

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Build and deployment** → **Source**, select **GitHub Actions**
4. Save changes

### Step 2: Configure Permissions

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Save changes

### Step 3: Enable Workflows

1. Go to **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select **Allow all actions and reusable workflows**
3. Save changes

## Accessing Your Site

After deployment completes, your site will be available at:

```
https://rcbiscuitsbelfast-prog.github.io/viber3d/
```

## Updating the Base Path

If you deploy to a custom domain or different repository name:

1. Edit `templates/quests4friends/vite.config.ts`
2. Change the `base` value:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // or '/' for custom domain
     // ... rest of config
   })
   ```
3. Commit and push to `production` branch

## Troubleshooting

### Build Fails

- Check the **Actions** tab for detailed error logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally

### Deployment Fails

- Verify GitHub Actions permissions are configured correctly
- Ensure GitHub Pages is enabled in repository settings
- Check that `gh-pages` branch exists or can be created by the workflow

### 404 Errors After Deployment

- Verify the `base` path in `vite.config.ts` matches your repository name
- Check that the `gh-pages` branch contains the expected files
- Clear browser cache and reload

### Stale Content

- GitHub Pages may take 1-2 minutes to update after deployment
- Check the Actions tab to verify the latest workflow completed successfully

## Development vs Production

- **Development**: Run `npm run dev` in `templates/quests4friends` for local development
- **Production**: Build and deploy via GitHub Actions workflow
- **Preview**: Use `npm run build && npm run preview` to test production builds locally

## Security Notes

- The workflow uses `id-token: write` permission for OIDC authentication
- No secrets are required for deployment
- Dependency caching is enabled for faster builds

## Related Files

- **Workflow**: `.github/workflows/deploy-quests4friends.yml`
- **Config**: `templates/quests4friends/vite.config.ts`
- **Build script**: `templates/quests4friends/package.json`

## Support

For issues or questions:
1. Check the Actions tab for workflow logs
2. Review GitHub Pages documentation
3. Verify all repository settings are correct
