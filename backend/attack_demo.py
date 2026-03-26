import time
import json
import os
import atexit
import subprocess
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

backend_process = None

def start_backend():
    global backend_process
    print("[*] Starting backend FastAPI server (app.py) in the background...")
    # Hide the subprocess window on Windows
    startupinfo = None
    if os.name == 'nt':
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        
    # Use sys.executable to ensure we use the same Python interpreter
    import sys
    
    # We must run the backend with CWD set to the backend folder 
    # BUT we need PYTHONPATH to include the parent directory so 'Models' resolves
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(backend_dir)
    
    env = os.environ.copy()
    env["PYTHONPATH"] = parent_dir
    
    backend_process = subprocess.Popen(
        [sys.executable, "app.py"], 
        startupinfo=startupinfo,
        cwd=backend_dir,
        env=env
    )
    time.sleep(3) # Give server time to bind port 8000

def cleanup():
    if backend_process:
        print("[*] Shutting down background backend server...")
        backend_process.terminate()

atexit.register(cleanup)

def run_attack():
    start_backend()
    print("[*] Activating Stealth Attack Chrome Driver...")
    options = webdriver.ChromeOptions()
    options.page_load_strategy = 'none' # Don't wait for all assets to load
    driver = webdriver.Chrome(options=options)
    
    url = "file:///C:/Users/anura/Downloads/clone_site1/clone_site1/mcdonline.nic.in/portal.html"
    print(f"[*] Navigating to {url}")
    driver.get(url)
    
    print("[*] Searching for popup cross icon (waiting 3 seconds for it to appear)...")
    time.sleep(3) # Wait for animations to finish so the user can see it
    
    # --- STEP 1: CLOSE POPUP ---
    try:
        # Try to find the exact 'x' icon using common text/classes
        close_btn = WebDriverWait(driver, 3).until(
            EC.presence_of_element_located((By.XPATH, "//*[@class='close' or @data-dismiss='modal'] | //*[text()='×'] | //*[text()='X'] | //button[contains(@class, 'close')]"))
        )
        # Force click via JS incase an invisible div is blocking the native click
        driver.execute_script("arguments[0].click();", close_btn)
        print("    [+] Successfully clicked the 'X' cross icon.")
    except Exception as e:
        print("    [!] Cross icon not found. Forcing overlay removal via Javascript...")
        # Fallback: forcefully remove anything that looks like an overlay or modal
        driver.execute_script("""
            var elements = document.querySelectorAll('.modal, .fancybox-overlay, .fancybox-wrap, .modal-backdrop, [style*="z-index"]');
            for(var i=0; i<elements.length; i++) {
                var z = parseInt(window.getComputedStyle(elements[i]).zIndex);
                if(z > 100 || elements[i].className.includes('modal')) { 
                    elements[i].style.display = 'none'; 
                }
            }
        """)
        time.sleep(1)

    # --- STEP 2: CLICK 'PAY PROPERTY TAX' ---
    print("[*] Waiting 2 seconds then searching for 'PAY PROPERTY TAX' button...")
    time.sleep(2)
    try:
        # Search for elements containing the text
        pay_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(), 'pay property tax', 'PAY PROPERTY TAX'), 'PAY PROPERTY TAX')]")
        # Use javascript click to bypass any invisible overlay shields
        driver.execute_script("arguments[0].click();", pay_btn)
        print("    [+] 'PAY PROPERTY TAX' button clicked via Javascript injection!")
    except Exception as e:
        try:
            pay_btn = driver.find_element(By.PARTIAL_LINK_TEXT, "PAY PROPERTY TAX")
            driver.execute_script("arguments[0].click();", pay_btn)
            print("    [+] 'PAY PROPERTY TAX' button clicked via Javascript link text search!")
        except Exception as e2:
            print("    [-] Failed to find the property tax button. It might be an image or hidden.")

    print(f"[*] Current page loaded: {driver.current_url}")
    
    # --- STEP 3: HANDLE NEW PAGE & LOGIN SUBMISSION ---
    print("\n[*] --- PHASE 2: LOGIN PORTAL ATTACK ---")
    time.sleep(3) # Wait for page transiton
    
    # Check if a new tab was opened by the property tax button
    if len(driver.window_handles) > 1:
        print("[*] Detected new tab. Switching focus to the new window...")
        driver.switch_to.window(driver.window_handles[-1])
        time.sleep(2)
        print(f"[*] Switched to: {driver.title}")

    print("[*] Searching for 'Email ID/Login-ID & Password' radio button...")
    time.sleep(2)
    try:
        # Use Javascript to thoroughly trigger the second radio button (Email ID)
        driver.execute_script("""
            var radios = document.querySelectorAll('input[type="radio"]');
            if(radios.length > 1) { 
                var emailRadio = radios[1];
                
                // Click the radio button itself
                emailRadio.click();
                emailRadio.checked = true;
                emailRadio.dispatchEvent(new Event('change', {bubbles: true}));
                emailRadio.dispatchEvent(new Event('input', {bubbles: true}));
                
                // Click its parent (often a label or wrapper that holds the onClick handler)
                if (emailRadio.parentElement) {
                    emailRadio.parentElement.click();
                }
                
                // Click the explicit label if it exists
                if (emailRadio.id) {
                    var label = document.querySelector('label[for="' + emailRadio.id + '"]');
                    if (label) label.click();
                }
            } else {
                throw new Error("Could not find enough radio buttons on page.");
            }
        """)
        print("    [+] Successfully triggered the Email/Password radio target via deep JS events.")
    except Exception as e:
        print(f"    [-] Failed to locate the Email radio button: {e}")

    print("[*] Waiting for the login form DOM to switch...")
    time.sleep(2) # Give the framework time to swap the inputs

    print("[*] Injecting fake credentials natively...")
    try:
        # Target the visible input fields
        inputs = driver.find_elements(By.XPATH, "//input[@type='text' or @type='email' or @type='password']")
        user_input_found = False
        pwd_found = False
        
        for inp in inputs:
            if inp.is_displayed() and inp.is_enabled():
                # Scroll into view to avoid ElementClickInterceptedException if send_keys implicitly focuses
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", inp)
                time.sleep(0.2)
                
                inp_type = inp.get_attribute("type")
                
                # Assume password field is the password
                if inp_type == "password" and not pwd_found:
                    inp.clear()
                    inp.send_keys("MCD@delhi2024")
                    print("    [+] Injected Fake Password.")
                    pwd_found = True
                    continue
                
                # Assume first text/email field is username
                if (inp_type == "text" or inp_type == "email") and not user_input_found:
                    inp.clear()
                    inp.send_keys("suresh.kumar.2287")
                    print("    [+] Injected Fake Username: suresh.kumar.2287")
                    user_input_found = True
                    continue
                
                # Assume subsequent text field is captcha
                if inp_type == "text" and user_input_found:
                    inp.clear()
                    inp.send_keys("XYZ99")
                    print("    [+] Injected Fake Captcha/Other field: XYZ99")
                    break # Stop after finding all 3 fields

    except Exception as e:
        print(f"    [-] Error injecting credentials natively: {e}")

    # --- POST CREDENTIALS TO BACKEND (backend stores them in JSON) ---
    fake_username = "suresh.kumar.2287"
    fake_password = "MCD@delhi2024"
    captured_url = driver.current_url
    
    print("    [*] Sending captured credentials to Trinetra backend...")
    try:
        import requests
        response = requests.post(
            "http://localhost:8000/api/capture_credentials",
            json={
                "username": fake_username,
                "password": fake_password,
                "url": captured_url
            },
            timeout=5
        )
        if response.status_code == 200:
            print("    [+] Backend confirmed: Credentials stored in stolen_credentials.json!")
        else:
            print(f"    [-] Backend returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"    [-] Could not reach backend to store credentials: {e}")

    time.sleep(2)
    print("[*] Firing Login / Submit button...")
    try:
        # Find submit, button, or any element that looks like Login
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(text(), 'login', 'LOGIN'), 'LOGIN')] | //input[@type='submit' or contains(translate(@value, 'login', 'LOGIN'), 'LOGIN')] | //a[contains(translate(text(), 'login', 'LOGIN'), 'LOGIN')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", login_btn)
        time.sleep(0.2)
        driver.execute_script("arguments[0].click();", login_btn)
        print("    [+] PUSHED LOGIN SUBMIT BUTTON!")
    except Exception as e:
        print("    [-] Could not find a recognizable 'Login' button. Submitting form...")
        try:
            driver.find_element(By.TAG_NAME, "form").submit()
        except:
             pass

    print("[*] Automation sequence completed.")
    time.sleep(2)
    driver.quit()

    # =========================================================
    # PHASE 3: CREDENTIAL STUFFING — ATTACKER REPLAYS CREDENTIALS
    # =========================================================
    print("\n" + "="*60)
    print("[*] --- PHASE 3: ATTACKER REPLAYS STOLEN CREDENTIALS ---")
    print("="*60)
    run_credential_stuffing()


def run_credential_stuffing():
    """Phase 3: Attacker uses stolen credentials to log into the real (target) site."""

    # --- Load the last stolen credentials ---
    creds_file = os.path.join(os.path.dirname(__file__), "data", "stolen_credentials.json")
    if not os.path.exists(creds_file):
        print("    [-] No stolen_credentials.json found. Run the attack first!")
        return

    with open(creds_file, "r") as f:
        all_creds = json.load(f)

    if not all_creds:
        print("    [-] stolen_credentials.json is empty. No credentials to replay.")
        return

    # Use the LAST (most recently captured) credentials
    latest = all_creds[-1]
    stolen_user = latest.get("username", "")
    stolen_pwd  = latest.get("password", "")
    print(f"    [+] Loaded stolen credentials: {stolen_user} / {stolen_pwd}")
    print(f"    [+] Captured at: {latest.get('timestamp', 'unknown')}")

    # --- Boot a new Chrome instance for the attacker ---
    print("\n[*] Launching attacker browser...")
    options = webdriver.ChromeOptions()
    options.page_load_strategy = 'none'
    driver = webdriver.Chrome(options=options)

    TARGET_PORTAL = "file:///C:/Users/anura/Downloads/clone_site1/clone_site1/mcdonline.nic.in/portal.html"
    print(f"[*] Navigating to target site: {TARGET_PORTAL}")
    driver.get(TARGET_PORTAL)
    time.sleep(3)

    # --- Bypass popup ---
    print("[*] Bypassing popup...")
    try:
        driver.execute_script("""
            var crosses = document.querySelectorAll('[class*="close"], [id*="close"], [aria-label*="close"], button.btn-close, .modal-header button, .carousel-close');
            for(var i=0; i<crosses.length; i++) { crosses[i].click(); }
            var modals = document.querySelectorAll('.modal, .modal-backdrop, .popup, .overlay');
            for(var i=0; i<modals.length; i++) { modals[i].style.display='none'; }
        """)
        print("    [+] Popup dismissed.")
    except:
        pass
    time.sleep(2)

    # --- Click Pay Property Tax ---
    print("[*] Clicking 'PAY PROPERTY TAX'...")
    time.sleep(2)
    try:
        pay_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(), 'pay property tax', 'PAY PROPERTY TAX'), 'PAY PROPERTY TAX')]")
        driver.execute_script("arguments[0].click();", pay_btn)
        print("    [+] 'PAY PROPERTY TAX' clicked!")
    except Exception:
        try:
            pay_btn = driver.find_element(By.PARTIAL_LINK_TEXT, "PAY PROPERTY TAX")
            driver.execute_script("arguments[0].click();", pay_btn)
            print("    [+] 'PAY PROPERTY TAX' clicked via partial link text!")
        except Exception as e2:
            print(f"    [-] Could not find Pay Property Tax: {e2}")
    time.sleep(3)

    # --- Switch to new tab if opened ---
    if len(driver.window_handles) > 1:
        driver.switch_to.window(driver.window_handles[-1])
        print(f"[*] Switched to: {driver.title}")
    time.sleep(2)

    # --- Select 'Email ID/Login-ID & Password' radio ---
    print("[*] Selecting Email/Password login mode...")
    try:
        driver.execute_script("""
            var radios = document.querySelectorAll('input[type="radio"]');
            if(radios.length > 1) {
                var emailRadio = radios[1];
                emailRadio.click();
                emailRadio.checked = true;
                emailRadio.dispatchEvent(new Event('change', {bubbles: true}));
                if (emailRadio.parentElement) emailRadio.parentElement.click();
            }
        """)
        print("    [+] Email login mode activated.")
    except Exception as e:
        print(f"    [-] Could not select radio: {e}")
    time.sleep(2)

    # --- Inject STOLEN credentials ---
    print(f"[*] Injecting STOLEN credentials: {stolen_user}")
    try:
        inputs = driver.find_elements(By.XPATH, "//input[@type='text' or @type='email' or @type='password']")
        user_done = False
        pwd_done  = False
        for inp in inputs:
            if inp.is_displayed() and inp.is_enabled():
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", inp)
                time.sleep(0.2)
                t = inp.get_attribute("type")
                if t == "password" and not pwd_done:
                    inp.clear(); inp.send_keys(stolen_pwd)
                    print(f"    [+] Injected Stolen Password: {stolen_pwd}")
                    pwd_done = True
                elif t in ("text", "email") and not user_done:
                    inp.clear(); inp.send_keys(stolen_user)
                    print(f"    [+] Injected Stolen Username: {stolen_user}")
                    user_done = True
                elif t == "text" and user_done:
                    inp.clear(); inp.send_keys("XYZ99")  # dummy captcha
                    print("    [+] Injected dummy captcha.")
                    break
    except Exception as e:
        print(f"    [-] Error injecting stolen credentials: {e}")

    # --- Click Login ---
    time.sleep(1)
    print("[*] Firing Login button with stolen credentials...")
    try:
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(text(),'login','LOGIN'),'LOGIN')] | //input[@type='submit']")
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", login_btn)
        time.sleep(0.2)
        driver.execute_script("arguments[0].click();", login_btn)
        print("    [+] CREDENTIAL STUFFING ATTACK FIRED!")
    except:
        try:
            driver.find_element(By.TAG_NAME, "form").submit()
        except:
            pass

    # Auto-dismiss any browser alert popups (e.g. "Email is required", "Invalid credentials")
    time.sleep(1)
    try:
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.common.exceptions import NoAlertPresentException
        WebDriverWait(driver, 3).until(EC.alert_is_present())
        alert = driver.switch_to.alert
        alert_text = alert.text
        alert.accept()
        print(f"    [*] Auto-dismissed browser alert: '{alert_text}'")
    except Exception:
        pass  # No alert appeared — that's fine too

    # --- SAVE ATTACKER'S REPLAY ATTEMPT TO A SEPARATE JSON FILE ---
    attempts_file = os.path.join(os.path.dirname(__file__), "data", "attacker_attempts.json")
    if os.path.exists(attempts_file):
        try:
            with open(attempts_file, "r") as f:
                attempts_data = json.load(f)
        except Exception:
            attempts_data = []
    else:
        attempts_data = []

    attempts_data.append({
        "timestamp": datetime.now().isoformat(),
        "username": stolen_user,
        "password": stolen_pwd,
        "attempted_on": driver.current_url
    })
    with open(attempts_file, "w") as f:
        json.dump(attempts_data, f, indent=4)
    print(f"    [+] Attacker's replay attempt saved to: attacker_attempts.json")

    # --- CROSS-COMPARE: stolen_credentials.json vs attacker_attempts.json ---
    print("\n[*] Running phishing attack verification...")
    stolen_file = os.path.join(os.path.dirname(__file__), "data", "stolen_credentials.json")
    try:
        with open(stolen_file, "r") as f:
            stolen_list = json.load(f)
        with open(attempts_file, "r") as f:
            attempts_list = json.load(f)

        last_stolen  = stolen_list[-1]   # Last captured credential
        last_attempt = attempts_list[-1]  # Last attacker replay

        if (last_stolen["username"] == last_attempt["username"] and
                last_stolen["password"] == last_attempt["password"]):
            print("\n" + "🚨" * 30)
            print("🚨  PHISHING ATTACK CONFIRMED!")
            print(f"🚨  Victim Credential:  {last_stolen['username']} / {last_stolen['password']}")
            print(f"🚨  Attacker Replayed:  {last_attempt['username']} / {last_attempt['password']}")
            print(f"🚨  Captured At:  {last_stolen.get('captured_from', 'unknown')}")
            print(f"🚨  Replayed At:  {last_attempt.get('attempted_on', 'unknown')}")
            print("🚨" * 30 + "\n")
        else:
            print("    [~] Credentials do NOT match — no phishing attack confirmed.")
    except Exception as e:
        print(f"    [-] Could not verify phishing attack: {e}")

    print("[*] Phase 3 complete. Attacker login attempt sent.")
    time.sleep(3)
    driver.quit()


if __name__ == "__main__":
    run_attack()
