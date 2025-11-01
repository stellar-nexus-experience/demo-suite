#!/bin/bash

echo "🔍 Verifying Vercel Deployment Setup..."
echo ""

# Check if user is in the right directory
if [ ! -f ".github/workflows/ci.yml" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "✅ Found CI workflow file"

# Check if deploy job exists in workflow
if grep -q "deploy-vercel:" .github/workflows/ci.yml; then
    echo "✅ Vercel deployment job found in workflow"
else
    echo "❌ Vercel deployment job not found"
fi

# Check if UnlyEd action is used
if grep -q "UnlyEd/github-action-deploy-on-vercel" .github/workflows/ci.yml; then
    echo "✅ Using UnlyEd/github-action-deploy-on-vercel@v1.2.7"
else
    echo "❌ Action not found in workflow"
fi

echo ""
echo "📋 Manual Verification Steps:"
echo "1. Go to: https://github.com/stellar-nexus-experience/demo-suite/settings/secrets/actions"
echo "2. Check if 'VERCEL_TOKEN' secret exists"
echo "3. If not, add it following instructions in GITHUB_ACTIONS_VERCEL_SETUP.md"
echo ""
echo "🧪 Test Deployment:"
echo "1. Make a small change to any file"
echo "2. Commit and push to main branch"
echo "3. Watch GitHub Actions: https://github.com/stellar-nexus-experience/demo-suite/actions"
echo "4. Verify deployment appears in Vercel dashboard"
echo ""
echo "📚 Documentation:"
echo "- GITHUB_ACTIONS_VERCEL_SETUP.md - Setup instructions"
echo "- VERCEL_ORG_SETUP.md - Organization setup"
echo "- DEPLOYMENT_STATUS.md - Deployment status tracking"
echo ""

