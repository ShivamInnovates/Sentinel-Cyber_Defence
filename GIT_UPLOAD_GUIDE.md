# 📤 Git Upload Guide - SENTINEL Cyber Defense

## Quick Start

```bash
# 1. Initialize Git (if not already initialized)
cd /mnt/windows/trinetra_delhi
git init

# 2. Add all files (respecting .gitignore)
git add .

# 3. Check what will be uploaded
git status

# 4. Commit
git commit -m "Initial commit: SENTINEL Cyber Defense System with chat system fix"

# 5. Add remote repository (replace with your repo URL)
git remote add origin https://github.com/yourusername/sentinel-cyber-defense.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

---

## What Gets Uploaded vs Ignored

### ✅ UPLOADED (Important Files)
```
✓ Source code (.py, .jsx, .js)
✓ Configuration files (.json, .yaml, .toml)
✓ Documentation (.md files)
✓ Requirements files (requirements.txt, package.json)
✓ Scripts (start_server.sh, start_server.bat)
✓ Data files (small JSON data)
✓ Gitignore files (.gitignore)
```

### ❌ IGNORED (Unnecessary Files)
```
✗ node_modules/ (can be reinstalled via npm install)
✗ delhihack/ (virtual environment, can be recreated)
✗ __pycache__/ (Python cache)
✗ .vscode/, .idea/ (IDE settings)
✗ *.log (log files)
✗ .env (sensitive data)
✗ dist/, build/ (build artifacts)
✗ .DS_Store (OS files)
✗ sentinel_vectorstore/ (can be regenerated)
✗ Large model files (if present)
```

---

## Repository Size Estimation

### Before .gitignore ❌
```
delhihack/          ~500 MB  (Virtual environment)
node_modules/       ~1.2 GB  (npm dependencies)
__pycache__/        ~50 MB   (Python cache)
.vscode/            ~10 MB   (IDE settings)
Total: ~1.8 GB (TOO LARGE)
```

### After .gitignore ✅
```
Source code         ~10 MB   (All .py, .jsx files)
Documentation      ~2 MB   (All .md guides)
Config files       ~1 MB   (JSON, YAML)
Data files         ~5 MB   (Smaller JSON data)
Total: ~18 MB (CLEAN & SMALL)
```

**Reduction: ~100x smaller!** 🎉

---

## Step-by-Step Git Setup

### Step 1: Check Current Git Status

```bash
cd /mnt/windows/trinetra_delhi
git status

# If not initialized yet:
git init
```

### Step 2: Configure Git (First time only)

```bash
# Set your user info
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Or globally (for all projects)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Add Files

```bash
# Add all files (respecting .gitignore)
git add .

# Verify what will be added
git status

# View size of staged files
du -sh .git/

# If too large, check for unwanted files
git ls-files --cached | head -20
```

### Step 4: Create First Commit

```bash
git commit -m "Initial commit: SENTINEL Cyber Defense System

- Complete cyber intelligence platform
- Multi-module threat detection (Drishti, Kavach, Bridge)
- Real-time chat system with RAG and fallback responses
- Comprehensive documentation and deployment guides"
```

### Step 5: Add Remote Repository

```bash
# Add your GitHub repository
git remote add origin https://github.com/yourusername/repo-name.git

# Or if using SSH
git remote add origin git@github.com:yourusername/repo-name.git

# Verify remote was added
git remote -v
```

### Step 6: Push to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main

# All subsequent pushes (just use)
git push
```

---

## Common Commands

### Check What Will Be Uploaded

```bash
# See staged files
git status

# See size of repository
du -sh .git

# List all tracked files
git ls-files

# Check if specific file is ignored
git check-ignore -v path/to/file
```

### Before Pushing

```bash
# Remove files if they were already added
git rm -r --cached delhihack/
git rm -r --cached node_modules/

# Commit the removal
git commit -m "Remove virtual environments and node_modules from tracking"

# Now push
git push
```

### After Pushing

```bash
# Verify push was successful
git log --oneline

# See remote status
git remote -v

# Check branch
git branch -a
```

---

## What to Include in First Commit

✅ **Include These**:
- All source code files
- All documentation (guides, READMEs)
- Configuration files (requirements.txt, package.json, eslint config)
- Startup scripts (start_server.sh, start_server.bat)
- .gitignore file itself
- Sample data files (small JSON)

❌ **Don't Include These**:
- node_modules/ → Add to .gitignore ✓
- delhihack/ → Add to .gitignore ✓
- __pycache__/ → Add to .gitignore ✓
- .vscode/ → Add to .gitignore ✓
- *.log files → Add to .gitignore ✓
- .env files → Add to .gitignore ✓

---

## Helpful .gitignore Addition: Template Files

For sensitive data like API keys, create template files:

```bash
# Create .env.example (for documentation)
cp .env .env.example

# Edit .env.example to remove actual values
# Example:
# SENTINEL_API_KEY=your-key-here
# DATABASE_URL=your-db-url
```

Add this to allow the template:
```
.env.example
```

(Already included in the .gitignore)

---

## After Initial Setup: Daily Workflow

### Making Changes

```bash
# Check what changed
git status

# See detailed changes
git diff

# Stage specific files
git add path/to/file.py

# Or stage all changes
git add .

# Commit with message
git commit -m "Fix chat system error handling"

# Push to GitHub
git push
```

### Syncing with Team

```bash
# Pull latest changes from team
git pull origin main

# If there are conflicts, resolve them
# Then continue

# Make your changes and push
git add .
git commit -m "Your changes"
git push
```

---

## Verification Checklist

Before pushing, verify:

- [ ] .gitignore exists in root AND in Sentinel-Cyber_Defence/
- [ ] `git status` shows reasonable number of files
- [ ] `du -sh .git/` is under 100 MB
- [ ] node_modules/ NOT in staging area
- [ ] delhihack/ NOT in staging area
- [ ] __pycache__/ NOT in staging area
- [ ] *.log files NOT in staging area
- [ ] All important .py files ARE in staging area
- [ ] All important .jsx files ARE in staging area
- [ ] All .md documentation files ARE in staging area
- [ ] requirements.txt IS in staging area
- [ ] package.json IS in staging area

---

## Troubleshooting

### Issue: "Repository is too large"

**Solution**: Remove large files from tracking
```bash
# Find large files
find . -type f -size +10M -not -path '*/node_modules/*' -not -path '*/.git/*'

# Remove from Git tracking
git rm -r --cached large_file
git commit -m "Remove large file"
git push
```

### Issue: "Files still showing that should be ignored"

**Solution**: Clear Git cache and re-add
```bash
# Remove all files from Git tracking
git rm -r --cached .

# Re-add respecting .gitignore
git add .

# Commit
git commit -m "Update .gitignore and remove tracked files"
git push
```

### Issue: "Want to verify what .gitignore is ignoring"

**Solution**: Use git check-ignore
```bash
# Check if a file is ignored
git check-ignore -v delhihack/bin/python

# List all ignored files
git ls-files --others --ignored --exclude-standard
```

---

## Example .env.example (For Documentation)

Create this file to show developers what environment variables are needed:

```
# Backend Configuration
SENTINEL_API_KEY=your-demo-key-here
SENTINEL_BACKEND_PORT=8000
SENTINEL_BACKEND_HOST=0.0.0.0

# Database Configuration (if needed)
DATABASE_URL=sqlite:///sentinel.db

# Model Configuration
HUGGINGFACE_MODEL=gpt2
MODEL_CACHE_DIR=./models_cache

# Logging
LOG_LEVEL=INFO
LOG_FILE=sentinel.log

# Frontend Configuration
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
REACT_APP_API_KEY=sentinel-demo-key
```

---

## Best Practices

### Commit Messages
```bash
# ✅ Good
git commit -m "Fix chat endpoint error handling for missing PDF"

# ✅ Good (with details)
git commit -m "Add intelligent fallback responses

- Implement keyword-based responses when AI unavailable
- Add timeout protection (10 seconds)
- Improve error messages in frontend
- Add comprehensive documentation"

# ❌ Bad
git commit -m "fix stuff"
git commit -m "update"
```

### Branching (For Teams)
```bash
# Create feature branch
git checkout -b feature/chat-system-improvement

# Make changes, test, commit
git add .
git commit -m "Implement chat improvements"

# Push feature branch
git push -u origin feature/chat-system-improvement

# Create pull request on GitHub
# After review/approval, merge to main
```

---

## What Developers Will See When They Clone

```bash
git clone https://github.com/yourusername/repo-name.git
cd repo-name

# They'll get (~18 MB):
✓ All source code
✓ All documentation
✓ All configuration
✓ No node_modules (they run: npm install)
✓ No virtual environment (they run: python -m venv venv)
✓ No cache or logs
```

---

## Reference: Your .gitignore Files

### Root .gitignore
- Ignores Python virtual environments (delhihack/, venv/, env/)
- Ignores Node modules
- Ignores IDE configurations
- Ignores OS files
- Ignores temporary files
- Ignores environment files

### Sentinel-Cyber_Defence/.gitignore
- Backend-specific ignores
- Frontend-specific ignores
- Model files
- Vector store (regenerable)
- Test caches
- Jupyter notebooks
- Generated files

---

**✅ Your .gitignore is now properly configured!**

Use the commands above to upload your project to GitHub. The repository will be small, clean, and easily shareable! 🚀
