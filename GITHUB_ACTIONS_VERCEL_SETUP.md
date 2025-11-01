# Setting Up Vercel Deployment via GitHub Actions

## ✅ What Was Added

A new `deploy-vercel` job was added to `.github/workflows/ci.yml` that automatically deploys to Vercel after a successful build when you push to the `main` branch.

## 🔑 Required Secret: VERCEL_TOKEN

You need to add your Vercel token as a GitHub secret for the workflow to work.

### Step 1: Generate Vercel Token

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Give it a name: `GitHub Actions Deployment`
4. Copy the token (you won't see it again!)

### Step 2: Add Token to GitHub

1. Go to your GitHub repository: https://github.com/stellar-nexus-experience/demo-suite
2. Click **Settings** (repository settings)
3. Go to **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Name: `VERCEL_TOKEN`
6. Value: paste the token you copied
7. Click **"Add secret"**

### Step 3: Verify Setup

1. Push a commit to `main` branch (or make any change)
2. Go to **Actions** tab in GitHub
3. You should see the CI workflow running
4. Once it completes, check Vercel dashboard for the new deployment

## 🎯 How It Works

```yaml
deploy-vercel:
  runs-on: ubuntu-latest
  needs: build                    # Only runs after build succeeds
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'  # Only on main branch pushes
  
  steps:
    - Checkout code
    - Setup Node.js
    - Install dependencies
    - Deploy on Vercel using your token
```

## ✅ Expected Behavior

- ✅ On push to `main`: Build → Deploy to Vercel production
- ✅ On pull requests: Build only (no deployment)
- ✅ On other branches: Nothing (workflow doesn't run)
- ✅ Failed builds: No deployment (prevents broken deployments)

## 🚨 Troubleshooting

### "Secret VERCEL_TOKEN not found"
- Make sure you added the secret in the GitHub repository settings
- Secret name must be exactly: `VERCEL_TOKEN`
- Check you're adding it to the correct repository

### "Deployment failed"
- Check Vercel token is valid and not expired
- Verify the token has deployment permissions
- Check GitHub Actions logs for specific errors

### "Action runs but nothing deploys"
- Verify the `if` condition: `github.ref == 'refs/heads/main'`
- Check you're pushing to `main` branch, not another branch
- Make sure `github.event_name == 'push'` (not pull_request)

### Still having issues?
1. Check GitHub Actions logs: Repository → Actions → Select workflow run
2. Check Vercel dashboard for any errors
3. Verify Vercel token hasn't expired

## 📝 Important Notes

- **Token Security**: Never commit your Vercel token to git! Use GitHub secrets.
- **Token Expiry**: Vercel tokens don't expire, but you can revoke them anytime
- **Build First**: Deployment only happens after a successful build
- **Production Only**: This deploys to Vercel production environment (`--prod`)

## 🎉 Success Criteria

✅ Workflow appears in GitHub Actions tab
✅ Build job completes successfully
✅ Deploy job runs after build
✅ New deployment appears in Vercel dashboard
✅ Website updates automatically on each push

## 🔄 Alternative: Manual Vercel Setup

If you prefer to use Vercel's built-in GitHub integration instead:
1. Follow instructions in `VERCEL_ORG_SETUP.md`
2. Vercel will auto-deploy on pushes
3. You can remove the GitHub Actions deploy job

Having both won't hurt, but Vercel's native integration is usually easier!

