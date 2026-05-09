#!/bin/bash
# LAID Command Center , GitHub Push Script
# Run this in Terminal (Mac) or Git Bash (Windows)
# Replace YOUR_USERNAME with your GitHub username

set -e

REPO_NAME="laid-command-center"
GITHUB_USER="YOUR_USERNAME"  # <-- CHANGE THIS

echo "========================================"
echo "LAID Command Center → GitHub"
echo "========================================"
echo ""

# Step 1: Create repo on GitHub (manual step they need to do first)
echo "STEP 1: Make sure you've created the repo on GitHub"
echo "  - Go to github.com/YOUR_USERNAME"
echo "  - Click 'New' → Name: $REPO_NAME"
echo "  - UNCHECK 'Add README' and 'Add .gitignore'"
echo "  - Click 'Create repository'"
echo ""
read -p "Press Enter when you've created the repo..."
echo ""

# Step 2: Navigate to project
echo "STEP 2: Setting up git remote..."
cd "$(dirname "$0")"

# Check if we're in the right place
if [ ! -f "package.json" ]; then
    echo "ERROR: Run this script from the laid-command-center folder"
    exit 1
fi

# Step 3: Add remote and push
echo "STEP 3: Pushing to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
git branch -M main

echo ""
echo "Pushing... (you may need to enter your GitHub token)"
git push -u origin main

echo ""
echo "========================================"
echo "DONE! Your repo is live at:"
echo "https://github.com/$GITHUB_USER/$REPO_NAME"
echo "========================================"
