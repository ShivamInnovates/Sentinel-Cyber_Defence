# step1_references.py — capture reference screenshots of real MCD portals
# FIX: corrected PIL import, variable name `img`, Redis key spacing, added fallback

import asyncio
import os
import sys

import redis
import imagehash
from PIL import Image                          # FIX: was `PIL from Image`
from playwright.async_api import async_playwright
from config import REAL_PORTAL_URLS

r = redis.Redis(host="localhost", port=6379, decode_responses=True)  # FIX: was decode_response

os.makedirs("reference_screenshots", exist_ok=True)


async def capture_one_portal(browser, name: str, url: str) -> bool:
    page = await browser.new_page(
        viewport={"width": 1280, "height": 800}   # FIX: was "widh"
    )
    try:
        print(f"  → Visiting {url} ...")
        # Give pages more time to render and avoid frequent 15s timeouts
        await page.goto(url, timeout=60000)
        await page.wait_for_load_state("networkidle", timeout=45000)

        # Additional robustness: wait for the body or a relevant selector
        await page.wait_for_selector('body', timeout=15000)

        save_path = f"reference_screenshots/{name}.png"
        await page.screenshot(path=save_path, full_page=True, timeout=45000)

        img = Image.open(save_path)             # FIX: was `image` (undefined)
        fingerprint = imagehash.dhash(img)

        r.set(f"ref_hash:{name}", str(fingerprint))   # FIX: removed spaces from key
        print(f"  ✓ {name}: fingerprint = {fingerprint}")
        await page.close()
        return True

    except Exception as e:
        print(f"  ✗ {name}: failed — {e}")
        # Create a blank fallback fingerprint so the rest of the pipeline works
        fallback_img = Image.new("L", (9, 8), color=128)
        fingerprint  = imagehash.dhash(fallback_img)
        r.set(f"ref_hash:{name}", str(fingerprint))
        print(f"  ⚠  {name}: stored fallback hash (portal unreachable)")
        await page.close()
        return False


async def capture_all():
    print("=" * 60)
    print("Capturing reference screenshots of real MCD Portals")
    print("(Fallback hashes stored if portal is unreachable)")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        success = 0
        for name, url in REAL_PORTAL_URLS.items():
            ok = await capture_one_portal(browser, name, url)
            if ok:
                success += 1
        await browser.close()

    print(f"\nCaptured {success}/{len(REAL_PORTAL_URLS)} portals successfully")

    print("\nRedis verification:")
    for name in REAL_PORTAL_URLS:
        stored = r.get(f"ref_hash:{name}")
        status = "✓" if stored else "✗"
        print(f"  {status} ref_hash:{name} = {stored}")


if __name__ == "__main__":
    asyncio.run(capture_all())
    print("\nDone. Run next: python step2_fake_page.py")