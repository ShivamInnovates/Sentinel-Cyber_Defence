import subprocess
import sys
import os


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0, result.stdout, result.stderr

print("="*60)
print("SENTINEL - Setup Check")
print("="*60)


# ── Step 1: Install Python libraries ─────────────────────────
# Each library does one specific job:
#   rapidfuzz   → fast string similarity (Model 1)
#   imagehash   → image fingerprinting (Model 2)
#   Pillow      → image file reading (Model 2)
#   playwright  → headless browser for screenshots (Model 2)
#   beautifulsoup4 → HTML parsing (Model 2)
#   scikit-learn → TF-IDF vectorizer (Model 3)
#   scipy       → sparse matrix operations (Model 3)
#   numpy       → numerical calculations (Model 4)
#   redis       → fast in-memory cache for baselines and canaries
#   requests    → HTTP calls (for CertStream and portal probing)
#   certstream  → connects to the global SSL certificate feed (DRISHTI)

print("\n[1/4]Installing Python libraries...")

libraries = [
    'rapidfuzz',
    'imagehash',
    'Pillow',
    'playwright',
    'beautifulSoup4',
    'scikit-learn',
    'scipy',
    'requests',
    'numpy',
    'redis',
    'certstream',
    'python-whois'
]

ok,_,err = run(f"pip install {' '.join(libraries)} --quiet")

if ok:
    print("All libraries installed")
else:
    print(f"Installation failed: {err}")
    print("Try running : pip install " + " ".join(libraries))
    sys.exit(1)


# Playwright controls a real Chrome browser to take screenshots. 
# # This downloads the actual browser binary (~180MB). 
# # Only needed once.
print("\n[2/4] Installing Chromium browser for Playwright...")
ok, _, err = run("playwright install chromium")
if ok:
    print("Chromium installed")
else:
    print("Chromium install failed") 
    print("Try running: playwright install chromium") 
    sys.exit(1)


# Redis is an in-memory database we use for: 
# # - Storing image fingerprints (loaded once, retrieved in <1ms) 
# # - Storing baseline statistics for Z-score (168 values per portal) 
# # - Storing active canary usernames (checked on every login attempt) 
# # It needs to be running as a background service.
print("\n[3/4] Checking Redis...")
ok, out, _ = run(r"redis-cli ping")
if "PONG" in out:
    print("Redis is running")
else:
    print("Redis not running — attempting to start...")
    run("sudo apt-get install -y redis-server 2>/dev/null || brew install redis 2>/dev/null")
    run("sudo systemctl start redis 2>/dev/null || redis-server --daemonize yes 2>dev/null")
    ok,out,_ = run("redis-cli ping")
    if "PONG" in out: 
        print(" ✓ Redis started successfully") 
    else: 
        print(" ✗ Could not start Redis") 
        print(" On Ubuntu: sudo apt install redis-server && sudo systemctl start redis") 
        print(" On Mac: brew install redis && brew services start redis") 
        sys.exit(1)

print("[4/4] Creating folders")
folders = [
    'models', 'data', 'reference_screenshots', 'screenshots', 'tests'
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)
print(" ✓ Folders ready") 
print("\n" + "=" * 60) 
print("Setup complete. Run next: python step1_references.py") 
print("=" * 60)    