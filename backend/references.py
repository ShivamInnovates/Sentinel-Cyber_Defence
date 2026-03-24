# ============================================================
# step1_references.py
# ============================================================
# This script visits each real MCD portal, takes a screenshot,
# converts it into a 64-bit fingerprint using dHash, and stores
# that fingerprint in Redis.
#
# WHY we do this:
#   When a fake site appears, Model 2 compares its screenshot
#   against these stored fingerprints. If the fake site looks
#   visually identical to a real MCD portal, the fingerprints
#   will differ by only a few bits — proof of a visual copy.
#
# WHEN to run:
#   Once at deployment. Then again every Sunday at 2am (via scheduler)
#   in case MCD redesigns any portal.
#
# How to run:
#   python step1_references.py
# ============================================================

import asyncio
import os
import redis
import imagehash
import PIL from Image
from playwright.async_api import async_playwright
from config import REAL_PORTAL_URLS if hasattr(__import__('config'), 'REAL_PORTAL_URLS')
else None
    
REAL_MCD_PORTALS = {
    "property_tax" : "https://mcdonline.nic.in/propertytax",
    "water_tax" : "https://mcdonline.nic.in/watertax",
    "birth_death" : "https://mcdonline.nic.in/birthdeath",
    "trade_licence" : "https://mcdonline.nic.in/tradelicence"
}

r = redis.Redis(host="localhost", port=6379, decode_responses = True)

async def capture_one_portal(browser, name:str, url: str) -> bool:
    """
    Visits one real mcd portal, take a ss, computes its 64-bit dhash fingerprint,
    saves both to disk n Redis. 
    Returns true if success or else false
    """
    page = await browser.new_page(
        viewport={"widh":1200, "height":800}
    )
    # If reference is 1920x1080 and suspect is 1280x800,
    # the rendered layouts will differ and dHash will see them as different
    # even if the designs are identical.
    try:
        print(f"Visiting {url}...")
        await page.goto(url, timeout=25000) #wait for 25ms to load pg
        await page.wait_for_load_state("networkidle")
        # networkidle is wait until no network requests
        # have been made for 500ms, this ensures js has finished loading dynamic content
        save_path = f"reference_screenshots/{name}.png"
        await page.screenshot(path=save_path, full_page = True)


        #dHash: 1. Covt img to grayscale
        #2. resize to 9x8 pixels
        #3. for each row of 9 pixels, cmp adj pairs:
        #    left brighter than right -> 1 or 0
        #4. res: 8 rows * 8 cmp = 64-bit
        img = Image.open(save_path)
        fingerprint = imagehash.dhash(image)
        # fingerprint looks like: "a3c4f2e1b8d7a6c5" (hex string)
 
        # ── Store fingerprint in Redis ────────────────────────
        # Key format: "ref_hash:property_tax"
        # Value: the 16-character hex string of the 64-bit hash
        r.set(f"ref_hash : {name}", str(fingerprint))
        print(f"{name} : fingerprint = {fingerprint}")
        await page.close()
        return True
    
    except Exception as e:
        print(f"{name}: failed - {e}")
        await page.close()
        return False
    
async def capture_all():
    """Captures ss of all real MCD portals"""
    print("="*60)
    print("Capturing reference ss of real MCD Portals")
    print("="*60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args = [
                "--no-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        success_count=0
        for name, url in REAL_MCD_PORTALS.items():
            ok = await capture_one_portal(browser, name, url)
            if ok:
                success_count +=1
        await browser.close()

    print(f"\nCaptured {success_count}/{len(REAL_MCD_PORTALS)} portals")
    print("\nRedis verification:")
    for name in REAL_MCD_PORTALS:
        stored = r.get(f"ref_hash:{name}")
        if stored:
            print(f"  ✓ ref_hash:{name} = {stored}")
        else:
            print(f"  ✗ ref_hash:{name} — NOT STORED (capture likely failed)")


    print("\nSaved Files")
    for f in os.listdir("reference_screenshots"):
        size_kb = os.path.getsize(f"reference_screenshots/{f}")//1024
        print(f"  reference_screenshots/{f} ({size_kb} KB)")
 
    print("\nDone. Run next: python step2_fake_page.py")
 
 
if __name__ == "__main__":
    asyncio.run(capture_all())
    


