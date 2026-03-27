# ============================================================
# step4_models.py
# ============================================================
# All 5 AI/ML models in one file.
# Each model is a function (or small group of functions).
#
# Model 1 — score_domain()        → is this domain fake?
# Model 2 — analyze_site()        → does this site look fake?
# Model 3 — classify_report()     → which campaign is this report?
# Model 4 — process_event()       → is this login/network activity abnormal?
# Model 5 — run_bridge()          → are external + internal attacks connected?
#
# ============================================================

import json
import os
import redis
import numpy as np
import imagehash

from PIL import Image
from datetime import datetime, timedelta
from rapidfuzz import fuzz
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import vstack

from backend.config import (
    REAL_DOMAINS, MCD_KEYWORDS, LEVENSHTEIN_THRESHOLD, KEYWORD_MIN_COUNT, COMPOSITE_CONFIRMED,
    COMPOSITE_PROBABLE, ZSCORE_RED, ZSCORE_YELLOW, ADMIN_OFFHOURS_START, ADMIN_OFFHOURS_END,
    BRIDGE_AUTO_HOURS, BRIDGE_REVIEW_DAYS, CORPUS_FILE, FAKE_SITES_FILE, KAVACH_ALERTS_FILE, CANARY_FILE,
    REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, DATA_DIR
)

try:
    from backend.notifications import notify_canary_trigger
except ImportError:
    notify_canary_trigger = lambda *args: None  # Fallback if not available

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)

import sqlite3

DB_FILE = os.path.join(DATA_DIR, "sentinel.db")


def _get_db_connection():
    os.makedirs(os.path.dirname(CORPUS_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _get_db_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS fake_sites (
        id INTEGER PRIMARY KEY,
        domain TEXT,
        portal_type TEXT,
        classification TEXT,
        explanation TEXT,
        canary_username TEXT,
        detected_at TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS kavach_alerts (
        id INTEGER PRIMARY KEY,
        portal_type TEXT,
        zone TEXT,
        rule TEXT,
        severity TEXT,
        z_score REAL,
        source_ips TEXT,
        message TEXT,
        detected_at TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS canaries (
        username TEXT PRIMARY KEY,
        portal_type TEXT,
        site_id INTEGER,
        deployed_at TEXT,
        triggered INTEGER,
        triggered_at TEXT
    )
    """)
    conn.commit()
    conn.close()


_init_db()


def score_domain(full_domain:str) -> dict:
    """
    Checks if a domain name looks like a fake mcd site.
    Uses 2 independenr methods so neither can be evaded.

    Method A : Levenshtein similarity:
        Counts how many single char edits separate the suspicious domain from real mcd website.
        "mcd-online" vs "mcdonline" = 1 edit = 90% similar.
        Anything above LEVENSHTEIN_THRESHOLD (65%) gets flagged.
 
    Method B — Keyword co-occurrence:
        If 2+ MCD keywords appear together in the domain name,
        flag it regardless of similarity score.
        Catches long evasion domains like "delhi-municipal-tax-portal.in"
        which would score low on similarity but is clearly targeting MCD.
    """

    label_clean = full_domain.split(".")[0].replace("-","").replace("_","")
    label_raw = full_domain.split(".")[0].lower() #for kwyword search 

    scores = [(real, fuzz.ratio(label_clean, real)) for real in REAL_DOMAINS]
    best_match, best_score = max(scores, key = lambda x : x[1])
    lev_flag = best_score >= LEVENSHTEIN_THRESHOLD

    # Simple tokenization without regex: split on common separators
    tokens = []
    current = ""
    for ch in label_raw:
        if ch.isalnum():
            current += ch
        else:
            if current:
                tokens.append(current)
                current = ""
    if current:
        tokens.append(current)

    found_keywords = []
    for kw in MCD_KEYWORDS:
        for token in tokens:
            # exact token match or keyword matched in a token (e.g. 'propertytax' contains 'tax')
            if kw == token or kw in token:
                found_keywords.append(kw)
                break

    # Deduplicate while keeping order
    seen = set()
    found_keywords = [x for x in found_keywords if not (x in seen or seen.add(x))]

    kw_flag = len(found_keywords) >= KEYWORD_MIN_COUNT

    #Explanation in english
    reasons =[]
    if lev_flag:
        reasons.append(f"{best_score : 0f}% similar to '{best_match}.gov.in'")
    if kw_flag:
        reasons.append(f"MCD keywords found together : {','.join(found_keywords)}")

    return {
        "domain" : full_domain,
        "investigate" : lev_flag or kw_flag,
        "lev_score" : round(best_score, 1),
        "best_match" : best_match,
        "keywords" : found_keywords,
        "reason" : ". ".join(reasons) if reasons else "No suspicious signals"
    }


def analyze_site(screenshot_path:str, html:str, domain:str, portal_type:str) ->dict:
    """
    Checks if a website visually copies a real MCD portal.
    If the attacker defeats 1 signal (eg: changes header color to avoid dHash match),
    the other 2 signals help
    Uses 3 independent signals:
    Signal 1: dHash visual fingerprint (from ss):
        converts ss to 64-bit number. Compares to stored fingerprint of real MCD portal.
        <5 bits different = visual copy
    
    Signal 2: Aadhaar input field:
        Searches HTML for input elements with "aadhaar" in the placeholder.
        A site that asks for aadhaar numbers is almost certainly targeting citizens and pretending to be a govt portal. 

    Signal 3: Govt impersonation (from HTML):
        Sites uses words like "Official Government Portal" or "Municipal Corporation" 
        but is NOT a .gov.in domain. Clearest possible of impersonation. 
    """
    signals = []
    html_score = 0

    vis_score = 0
    if screenshot_path and os.path.exists(screenshot_path):
        try:
            suspect_hash = imagehash.dhash(Image.open(screenshot_path))
            ref_hash_str = r.get(f"ref_hash:{portal_type}")
            if ref_hash_str:
                ref_hash = imagehash.hex_to_hash(ref_hash_str)
                #Hamming dist = no of bits that differ
                #0 bits = identical, 64 bits = completely different
                hamming = suspect_hash - ref_hash
                vis_score = round((1 - hamming/64)*100, 1)
                if vis_score >= 80:
                    signals.append(f"Visual similarity {vis_score}% - {hamming} bits different out of 64")
        except Exception as e:
            pass

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text().lower()

    aadhaar_inputs = soup.find_all(
        "input",
        attrs={"placeholder": lambda x: x and "aadhaar" in x.lower()}
    )
    aadhaar_labels = soup.find_all(
        "label",
        string=lambda x: x and "aadhaar" in x.lower()
    )

    if aadhaar_inputs or aadhaar_labels:
        html_score += 40
        signals.append("Aadhaar input field detected on page")

    payment_phrases = ["pay now", "proceed to payment", "make payment", 
                       "transaction id", "pay online", "online payment"]
    found = [p for p in payment_phrases if p in text]
    if found:
        html_score += 25
        signals.append(f"Payment language: '{found[0]}'")

    govt_phrases = [
        "official government portal",
        "municipal corporation",
        "government of nct",
        "government of india",
        "official portal",
    ]
    claims_govt = any(phrase in text for phrase in govt_phrases)
    not_gov_domain = ".gov.in" not in domain.lower()
 
    if claims_govt and not_gov_domain:
        html_score += 30
        signals.append(f"Claims to be govt portal but '{domain}' is not a .gov.in domain")

    composite = round(min(vis_score * 0.4 + html_score, 100), 1)
    if composite >= COMPOSITE_CONFIRMED:
        classification = "CONFIRMED"
    elif composite >= COMPOSITE_PROBABLE:
        classification = "PROBABLE"
    else:
        classification = "MONITOR"

    return {
        "classification" : classification,
        "composite_score" : composite,
        "visual_score" : vis_score,
        "html_score" : html_score,
        "signals" : signals,
        "explanation" : ", ".join(signals) if signals else "No strong signals found"
    }
    
_vectorizer = None
_matrix = None
_meta = []

def fit_model():
    """
    Fits TF-IDF on all phishing reports in the corpus files.
    Should run: att startup, and daily at 3am

    TF-IDF = Term Frequency X Inverse Document Frequency
    Term Frequency: how often a word appears in this doc
    Inverse Document Frequency: how rare the word is across all documents

    Result: distinctive words get high weights, common words get low insights.
    "mcd-propertytax-pay.in" appears in 5 of 10 reports ->high weight
    "received" appears in all 10 reports -> near-zero weight.
    """
    global _vectorizer, _matrix, _meta

    def _bootstrap_corpus():
        bootstrap = [
            {"id": 1, "text": "Received WhatsApp message pay property tax at mcd-propertytax-pay.in urgently", "campaign_id": 1},
            {"id": 2, "text": "mcd-propertytax-pay.in is a scam link received in WhatsApp", "campaign_id": 1},
            {"id": 3, "text": "Message about MCD mosquito spraying schedule link received", "campaign_id": 2},
            {"id": 4, "text": "Report: phishing SMS for online property tax payment", "campaign_id": 1},
        ]
        os.makedirs(os.path.dirname(CORPUS_FILE), exist_ok=True)
        json.dump(bootstrap, open(CORPUS_FILE, "w"), indent=2)
        return bootstrap

    if not os.path.exists(CORPUS_FILE):
        print(" No corpus file found - creating bootstrap corpus")
        data = _bootstrap_corpus()
    else:
        data = json.load(open(CORPUS_FILE))

    if len(data) < 4:
        print(f" Only {len(data)} reports in existing corpus. Replacing with bootstrap corpus")
        data = _bootstrap_corpus()

    texts = [d['text'] for d in data]
    if len(texts) < 4:
        print(f" Only {len(texts)} reports - need atleast 4 to fit model")
        return False

    vec = TfidfVectorizer(
        max_features=500, #only 500 imp words
        stop_words="english", #ignore the,a,is,etc
        ngram_range= (1,2) #consider 2-word phrases like property-tax
    )
    _vectorizer = vec
    _matrix = vec.fit_transform(texts)
    _meta = [{"id":d["id"], "campaign_id":d["campaign_id"]} for d in data]

    return True

def classify_report(text:str, report_id: int) ->dict:
    """
    Takes a new phishing report text and assigns it to campaign.
    Cmp the new report against all existing reports using cosine similarity.
    If similarity > 0.75 with any existing report, they are in same campaign or else new campaign.

    Cosine similarity imagines each report as an arrow in space.
    2 reports about the same campaign point in similar directions.
    Similarity = cos(angle between them). 1.0 = same dir, 0.0 = perpendicular
    """
    global _matrix, _meta

    if _vectorizer is None:
        fit_model()
    if _vectorizer is None:
        # Fallback mode for bootstrapping with small corpus
        fallback_campaign = max((m["campaign_id"] for m in _meta), default=0) + 1
        _add_to_corpus(text, report_id, fallback_campaign)
        return {
            "campaign_id": fallback_campaign,
            "is_new": True,
            "confidence": None,
            "note": "Model not ready; using bootstrap clustering" 
        }
    
    new_vec = _vectorizer.transform([text])
    sims = cosine_similarity(new_vec, _matrix)[0]

    matches  = [
        (_meta[i]["campaign_id"], float(sims[i]))
        for i in range(len(sims))
        if sims[i] >= 0.75
    ]
 
    if matches:
        # Join the campaign with the highest similarity
        best_campaign_id = max(matches, key=lambda x: x[1])[0]
        confidence       = round(max(s for _, s in matches) * 100, 1)
 
        # Add to corpus so future reports can compare against this one
        _add_to_corpus(text, report_id, best_campaign_id)
 
        return {
            "campaign_id": best_campaign_id,
            "is_new":      False,
            "confidence":  confidence,
        }
    else:
        # No match — this is a new campaign
        new_campaign_id = max(m["campaign_id"] for m in _meta) + 1 if _meta else 1
        _add_to_corpus(text, report_id, new_campaign_id)
 
        return {
            "campaign_id": new_campaign_id,
            "is_new":      True,
            "confidence":  None,
        }
    
    
def _add_to_corpus(text:str, report_id:int, campaign_id:int):
    """Adds a new report to file and updates the in-memory matrix."""
    global _matrix, _meta
 
    # Update file
    data = json.load(open(CORPUS_FILE)) if os.path.exists(CORPUS_FILE) else []
    if not any(d["id"] == report_id for d in data):
        data.append({"id": report_id, "text": text, "campaign_id": campaign_id})
        json.dump(data, open(CORPUS_FILE, "w"), indent=2)
 
    # Update in-memory matrix — no full refit needed for one new document
    if _vectorizer is not None and _matrix is not None:
        new_vec = _vectorizer.transform([text])
        _matrix = vstack([_matrix, new_vec])
    _meta.append({"id": report_id, "campaign_id": campaign_id})
 
 
# Timestamp store for velocity checking
_campaign_timestamps: dict = {}

def check_velocity(campaign_id: int, ts: datetime = None) -> dict:
    """
    Checks if too many reports about the same campaign arrived recently.
    50+ reports in 2 hours = WhatsApp broadcast in progress.
    """
    if ts is None:
        ts = datetime.now()
 
    _campaign_timestamps.setdefault(campaign_id, []).append(ts)
 
    cutoff = ts - timedelta(hours=2)
    recent = [t for t in _campaign_timestamps[campaign_id] if t >= cutoff]
    count  = len(recent)
 
    if count >= 50:
        return {"alert": "BROADCAST", "count": count, "severity": "HIGH",
                "message": f"{count} reports about campaign {campaign_id} in 2 hours — WhatsApp broadcast in progress"}
    elif count >= 10:
        return {"alert": "GROWING",   "count": count, "severity": "MEDIUM"}
    return     {"alert": None,         "count": count, "severity": "LOW"}


def process_event(event_type: str, data:dict):
    """
    Single entry pt for all kavach events
    Routes to correct detection rule internally

    Event types:
    "login"        → Z-score analysis on 5-minute login count
    "admin_login"  → Binary off-hours check
    "port_probe"   → Sequential port scanning detection
    "network_flow" → Outbound data volume check
    """
    ts = datetime.fromisoformat(data.get("timestamp", datetime.now().isoformat()))
 
    if event_type == "login":
        return _check_login_spike(data["portal"], data["count"], ts, data.get("source_ips", []))
 
    elif event_type == "admin_login":
        return _check_offhours_admin(data["username"], ts)
 
    elif event_type == "port_probe":
        return _check_port_scan(data["source_ip"], data["target_ip"],
                                data["ports"], data["window_seconds"])
 
    elif event_type == "network_flow":
        return _check_data_exfil(data["source_ip"], data["dest_ip"],
                                 data["bytes_sent"], ts)
    return None
 
 
def _check_login_spike(portal: str, count: int, ts: datetime, source_ips: list):
    """
    Rule 1 — Login spike detection.
 
    Retrieves the historical baseline for this exact time slot
    (day of week + hour of day) and computes Z-score.
 
    Z-score = (current_count - historical_mean) / historical_stddev
 
    Z > 3.0: happens < 0.13% of the time naturally → RED alert
    Z > 2.5: slightly unusual → YELLOW alert
    Z ≤ 2.5: normal → update baseline with this reading, return None
    """
    day, hour = ts.weekday(), ts.hour
    key       = f"baseline:{portal}:{day}:{hour}"
    b         = r.hgetall(key)

    if not b:
        # No historical baseline yet. Apply thresholds so attacks are still caught early.
        if count >= 100:
            z = None
            return {
                "rule": "LOGIN_SPIKE",
                "severity": "RED",
                "portal": portal,
                "z_score": None,
                "login_count": count,
                "expected": 0,
                "source_ips": source_ips,
                "message": (
                    f"{count} login attempts on '{portal}' portal with no baseline. "
                    "High volume indicates potential attack; initial default red threshold."
                ),
                "warning": "No baseline data available; using static detection fallback.",
                "timestamp": ts.isoformat(),
            }
        elif count >= 60:
            return {
                "rule": "LOGIN_ELEVATED",
                "severity": "YELLOW",
                "portal": portal,
                "z_score": None,
                "login_count": count,
                "expected": 0,
                
                "message": (
                    f"{count} login attempts on '{portal}' portal with no baseline. "
                    "Elevated volume; monitor closely."
                ),
                "warning": "No baseline data available; using static detection fallback.",
                "timestamp": ts.isoformat(),
            }
        else:
            # Initialize baseline with first normal observation.
            r.hset(f"baseline:{portal}:{day}:{hour}", mapping={
                "mean": str(count),
                "std": "1.0",
                "days_real": "1",
            })
            return None

    mean     = float(b["mean"])
    std      = float(b["std"])
    days_real = int(b.get("days_real", "0"))
    z        = (count - mean) / std

    # Reliability warning — tell user if baseline is still synthetic
    warning = None
    if days_real < 7:
        warning = f"Warning: baseline is synthetic — only {days_real} days of real data"
    elif days_real < 30:
        warning = f"Note: baseline improving — {days_real} days of real data collected"

    day_name = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day]

    if z > ZSCORE_RED:
        return {
            "rule":        "LOGIN_SPIKE",
            "severity":    "RED",
            "portal":      portal,
            "z_score":     round(z, 2),
            "login_count": count,
            "expected":    round(mean, 1),
            "source_ips":  source_ips,
            "message":     (
                f"{count} login attempts on '{portal}' portal. "
                f"Normal for {day_name} {hour:02d}:00 is {mean:.0f} "
                f"(±{std:.0f}). Z-score: {z:.1f}. "
                f"This is statistically near-impossible without an attack."
            ),
            "warning":     warning,
            "timestamp":   ts.isoformat(),
        }
    elif z > ZSCORE_YELLOW:
        return {
            "rule":        "LOGIN_ELEVATED",
            "severity":    "YELLOW",
            "portal":      portal,
            "z_score":     round(z, 2),
            "message":     f"Slightly elevated login activity on '{portal}'. Z-score {z:.1f}.",
            "warning":     warning,
            "timestamp":   ts.isoformat(),
        }
    else:
        # Normal traffic — update baseline with real data
        _update_baseline(portal, day, hour, count, days_real)
        return None


def _update_baseline(portal, day, hour, count, days_real):
    """
    Updates the baseline with one new real reading using
    exponential moving average. Recent data matters more than old data.
    alpha=0.05 means new reading contributes 5% to new mean.
    """
    b    = r.hgetall(f"baseline:{portal}:{day}:{hour}")
    mean = float(b["mean"])
    std  = float(b["std"])

    alpha    = 0.05  # smoothing factor
    new_mean = mean * (1 - alpha) + count * alpha
    new_std  = max(np.sqrt((1 - alpha) * std**2 + alpha * (count - new_mean)**2), 1.0)

    r.hset(f"baseline:{portal}:{day}:{hour}", mapping={
        "mean":      str(round(new_mean, 2)),
        "std":       str(round(new_std,  2)),
        "days_real": str(days_real + 1),
    })


def _check_offhours_admin(username: str, ts: datetime):
    """
    Rule 2 — Off-hours admin login.
    Binary rule — no calculation needed, no baseline required.
    Admin logins between 10pm and 6am fire RED immediately.
    """
    h          = ts.hour
    is_offhours = h >= ADMIN_OFFHOURS_START or h < ADMIN_OFFHOURS_END

    if not is_offhours:
        return None

    return {
        "rule":      "OFFHOURS_ADMIN",
        "severity":  "RED",
        "username":  username,
        "timestamp": ts.isoformat(),
        "message":   (
            f"Admin account '{username}' logged in at {ts.strftime('%I:%M %p')}. "
            f"Admin activity between 10PM–6AM has no legitimate business reason. "
            f"Contact '{username}' immediately to verify — if not them, credentials are compromised."
        ),
        "warning":   None,
    }


def _check_port_scan(source_ip, target_ip, ports, window_secs):
    """
    Rule 3 — Port scanning detection.
    Sequential probing of 15+ ports in under 60 seconds = reconnaissance.
    Attacker is mapping which services are running before an attack.
    """
    if len(ports) < 15 or window_secs > 60:
        return None

    sp            = sorted(ports)
    is_sequential = all(sp[i+1] - sp[i] <= 3 for i in range(len(sp) - 1))
    # allow gaps of up to 3 — some scanners skip certain ports

    if not is_sequential:
        return None

    return {
        "rule":       "PORT_SCAN",
        "severity":   "RED",
        "source_ip":  source_ip,
        "target_ip":  target_ip,
        "port_count": len(ports),
        "message":    (
            f"IP {source_ip} probed {len(ports)} sequential ports on "
            f"{target_ip} in {window_secs} seconds. "
            f"Classic reconnaissance pattern — attacker mapping services before attack."
        ),
        "warning":    None,
        "timestamp":  datetime.now().isoformat(),
    }


def _check_data_exfil(src_ip, dst_ip, bytes_sent, ts):
    """
    Rule 4 — Data exfiltration detection.
    Internal MCD machine sending large volume to external IP = possible theft.
    """
    def is_internal(ip):
        return ip.startswith(("10.", "192.168.", "172.16.", "172.17.",
                              "172.18.", "172.19.", "172.20.", "172.21.",
                              "172.22.", "172.23.", "172.24.", "172.25.",
                              "172.26.", "172.27.", "172.28.", "172.29.",
                              "172.30.", "172.31."))

    if not is_internal(src_ip) or is_internal(dst_ip):
        return None  # Only care about internal → external transfers

    mb = round(bytes_sent / (1024 * 1024), 1)

    if bytes_sent > 50 * 1024 * 1024:  # 50MB threshold
        return {
            "rule":      "DATA_EXFIL",
            "severity":  "RED",
            "source_ip": src_ip,
            "dest_ip":   dst_ip,
            "bytes_mb":  mb,
            "message":   (
                f"{mb}MB sent from internal {src_ip} to external {dst_ip}. "
                f"Possible data theft in progress."
            ),
            "warning":   None,
            "timestamp": ts.isoformat(),
        }
    return None


# ============================================================
# MODEL 5 — THE BRIDGE
# Input:  (runs automatically using stored fake_sites and kavach_alerts)
# Output: list of coordinated attack alert dicts
# ============================================================

def deploy_canary(site_id: int, portal_type: str) -> str:
    """
    Creates a honeypot account tied to a specific fake site.

    When the fake site is confirmed, we pre-seed this username
    into MCD's login monitoring. If the attacker steals credentials
    and tries to use them on the real portal, this exact username
    will appear in the login attempt logs.

    That username appearing = forensic proof of credential theft.

    It is called PASSIVE canary because:
    - We do NOT submit anything to the criminal's website
    - We only watch our OWN systems for this username
    - 100% legally safe under the IT Act
    """
    ts_code  = str(int(datetime.now().timestamp()))[-4:]
    username = f"sentinel.canary.{ts_code}@mcd.gov.in"

    # Store in file for compatibility
    os.makedirs("data", exist_ok=True)
    canaries = json.load(open(CANARY_FILE)) if os.path.exists(CANARY_FILE) else []
    canaries.append({
        "username":    username,
        "portal_type": portal_type,
        "site_id":     site_id,
        "deployed_at": datetime.now().isoformat(),
        "triggered":   False,
    })
    json.dump(canaries, open(CANARY_FILE, "w"), indent=2)

    # Store in DB for structured persistence
    conn = _get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO canaries (username, portal_type, site_id, deployed_at, triggered, triggered_at) VALUES (?,?,?,?,?,?)",
        (username, portal_type, site_id, datetime.now().isoformat(), 0, None)
    )
    conn.commit()
    conn.close()

    # Store in Redis for sub-millisecond lookup on every login attempt
    r.sadd("active_canaries", username)

    return username


def check_canary(attempted_username: str) -> bool:
    """
    Returns True if this username is one of our honeypot accounts.
    Called on every single login attempt — Redis makes this <1ms.
    """
    if not r.sismember("active_canaries", attempted_username):
        return False

    # Mark as triggered in file
    if os.path.exists(CANARY_FILE):
        canaries = json.load(open(CANARY_FILE))
        for c in canaries:
            if c["username"] == attempted_username and not c["triggered"]:
                c["triggered"]    = True
                c["triggered_at"] = datetime.now().isoformat()
        json.dump(canaries, open(CANARY_FILE, "w"), indent=2)

    # Mark triggered in DB
    conn = _get_db_connection()
    c = conn.cursor()
    c.execute(
        "UPDATE canaries SET triggered = 1, triggered_at = ? WHERE username = ?",
        (datetime.now().isoformat(), attempted_username)
    )
    conn.commit()
    conn.close()

    # Notify about canary trigger
    site_id = None
    if os.path.exists(CANARY_FILE):
        canaries = json.load(open(CANARY_FILE))
        for c in canaries:
            if c["username"] == attempted_username:
                site_id = c.get("site_id")
                break
    notify_canary_trigger(attempted_username, site_id or 0)

    r.srem("active_canaries", attempted_username)
    return True


def record_fake_site(site_id, domain, portal_type, classification,
                     explanation, canary_username=None, detected_at=None):
    """Stores a confirmed/probable fake site so Bridge can reference it."""
    os.makedirs("data", exist_ok=True)
    sites = json.load(open(FAKE_SITES_FILE)) if os.path.exists(FAKE_SITES_FILE) else []
    entry = {
        "id":              site_id,
        "domain":          domain,
        "portal_type":     portal_type,
        "classification":  classification,
        "explanation":     explanation,
        "canary_username": canary_username,
        "detected_at":     detected_at or datetime.now().isoformat(),
    }
    sites.append(entry)
    json.dump(sites, open(FAKE_SITES_FILE, "w"), indent=2)

    # DB insert
    conn = _get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO fake_sites (id, domain, portal_type, classification, explanation, canary_username, detected_at) VALUES (?,?,?,?,?,?,?)",
        (site_id, domain, portal_type, classification, explanation, canary_username, entry["detected_at"])
    )
    conn.commit()
    conn.close()


def record_kavach_alert(alert_id, portal_type, zone, rule, severity,
                        z_score, source_ips, message, detected_at=None):
    """Stores a KAVACH alert so Bridge can reference it."""
    os.makedirs("data", exist_ok=True)
    alerts = json.load(open(KAVACH_ALERTS_FILE)) if os.path.exists(KAVACH_ALERTS_FILE) else []
    entry = {
        "id":          alert_id,
        "portal_type": portal_type,
        "zone":        zone,
        "rule":        rule,
        "severity":    severity,
        "z_score":     z_score,
        "source_ips":  source_ips,
        "message":     message,
        "detected_at": detected_at or datetime.now().isoformat(),
    }
    alerts.append(entry)
    json.dump(alerts, open(KAVACH_ALERTS_FILE, "w"), indent=2)

    # DB insert
    conn = _get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO kavach_alerts (id, portal_type, zone, rule, severity, z_score, source_ips, message, detected_at) VALUES (?,?,?,?,?,?,?,?,?)",
        (alert_id, portal_type, zone, rule, severity, z_score, json.dumps(source_ips), message, entry["detected_at"])
    )
    conn.commit()
    conn.close()


def query_fake_sites():
    conn = _get_db_connection()
    rows = conn.execute("SELECT * FROM fake_sites ORDER BY detected_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def query_kavach_alerts():
    conn = _get_db_connection()
    rows = conn.execute("SELECT * FROM kavach_alerts ORDER BY detected_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def query_canaries():
    conn = _get_db_connection()
    rows = conn.execute("SELECT * FROM canaries ORDER BY deployed_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def run_bridge() -> list:
    """
    The Bridge — runs every 15 minutes in real deployment.
    Connects external fake sites to internal attacks.

    Three rules must all match for LIKELY/CONFIRMED:
    1. Portal type match  — same service targeted externally and internally
    2. Time window match  — fake site appeared before the attack, within 4 hours
    3. Attack pattern     — Z-score > 3.0 AND multiple source IPs (credential stuffing)

    Confidence tiers:
    CONFIRMED = all 3 rules + canary triggered  → forensic certainty
    LIKELY    = all 3 rules, no canary          → high confidence
    PROBABLE  = rules 1+2 only                  → medium confidence
    POSSIBLE  = rules 1+2 but >4hrs, <7days     → analyst review only
    """
    results  = []
    now      = datetime.now()
    auto_cut = now - timedelta(hours=BRIDGE_AUTO_HOURS)
    rev_cut  = now - timedelta(days=BRIDGE_REVIEW_DAYS)

    conn = _get_db_connection()
    c = conn.cursor()
    sites = [dict(row) for row in c.execute("SELECT * FROM fake_sites").fetchall()]
    alerts = [dict(row) for row in c.execute("SELECT * FROM kavach_alerts").fetchall()]
    canaries = [dict(row) for row in c.execute("SELECT * FROM canaries").fetchall()]
    conn.close()

    if not sites and os.path.exists(FAKE_SITES_FILE):
        sites = json.load(open(FAKE_SITES_FILE))
    if not alerts and os.path.exists(KAVACH_ALERTS_FILE):
        alerts = json.load(open(KAVACH_ALERTS_FILE))
    if not canaries and os.path.exists(CANARY_FILE):
        canaries = json.load(open(CANARY_FILE))

    # Only consider confirmed/probable fake sites within review window
    active_sites  = [
        s for s in sites
        if s["classification"] in ("CONFIRMED", "PROBABLE")
        and datetime.fromisoformat(s["detected_at"]) >= rev_cut
    ]

    # Only consider RED KAVACH alerts within review window
    red_alerts = [
        a for a in alerts
        if a["severity"] == "RED"
        and datetime.fromisoformat(a["detected_at"]) >= rev_cut
    ]

    for alert in red_alerts:
        alert_time = datetime.fromisoformat(alert["detected_at"])

        for site in active_sites:
            site_time = datetime.fromisoformat(site["detected_at"])

            # Fake site MUST appear before the internal attack
            if site_time >= alert_time:
                continue

            gap_min = int((alert_time - site_time).total_seconds() / 60)

            # ── Three rules ───────────────────────────────────
            rule1 = alert["portal_type"] == site["portal_type"]
            rule2_auto   = gap_min <= BRIDGE_AUTO_HOURS * 60
            rule2_review = gap_min <= BRIDGE_REVIEW_DAYS * 24 * 60
            rule3 = (
                alert.get("z_score", 0) >= 3.0 and
                len(alert.get("source_ips", [])) >= 3
            )

            if not (rule1 and rule2_review):
                continue  # Not even worth considering

            # ── Canary check ──────────────────────────────────
            canary_triggered = any(
                c["triggered"] and c["site_id"] == site["id"]
                for c in canaries
            )

            # ── Confidence tier ───────────────────────────────
            if   canary_triggered and rule1 and rule2_auto and rule3: conf = "CONFIRMED"
            elif rule1 and rule2_auto and rule3:                       conf = "LIKELY"
            elif rule1 and rule2_auto:                                 conf = "PROBABLE"
            elif rule1 and rule2_review:                               conf = "POSSIBLE"
            else:
                continue

            gap_str = f"{gap_min} minutes" if gap_min < 60 else f"{gap_min//60}h {gap_min%60}m"

            results.append({
                "type":          "COORDINATED_ATTACK",
                "confidence":    conf,
                "fake_site":     site["domain"],
                "portal_type":   site["portal_type"],
                "gap_minutes":   gap_min,
                "canary_proof":  canary_triggered,
                "actions": [
                    "Block all source IPs across all 12 zones immediately",
                    "Send takedown request for fake domain to registrar",
                    "Notify CERT-In with attached evidence PDF",
                    "Force password reset for all property_tax portal users",
                ],
                "message": (
                    f"COORDINATED ATTACK ({conf}) — "
                    f"Fake '{site['portal_type']}' site ({site['domain']}) appeared "
                    f"{gap_str} before internal attack on same portal "
                    f"(Z-score {alert.get('z_score','N/A')}). "
                    + ("Canary credential confirmed credential theft. " if canary_triggered else "")
                    + "Same attacker, same campaign, two phases."
                ),
            })

    return results


# ============================================================
# TEST ALL MODELS — run this file directly to verify
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Testing all 5 models")
    print("=" * 60)

    errors = []

    # ── Test Model 1 ──────────────────────────────────────────
    print("\n[Model 1 — Domain Scoring]")
    cases = [
        ("mcd-online.in",                         True,  "typosquat"),
        ("mcdpropertytax-pay.in",                 True,  "keyword combo"),
        ("delhi-municipal-taxpayment-portal.in",  True,  "evasion domain"),
        ("bookmyshow.com",                        False, "unrelated site"),
        ("irctc.co.in",                           False, "other govt site"),
    ]
    for domain, expected, desc in cases:
        result = score_domain(domain)
        ok     = result["investigate"] == expected
        print(f"  {'PASS' if ok else 'FAIL'} | {desc} | {result['reason'][:60]}")
        if not ok:
            errors.append(f"Model 1 failed: {desc}")

    # ── Test Model 2 ──────────────────────────────────────────
    print("\n[Model 2 — Visual Analysis]")
    if os.path.exists("tests/fake_mcd_screenshot.png"):
        with open("tests/fake_mcd_portal.html", "r") as f:
            html = f.read()
        result = analyze_site(
            screenshot_path="tests/fake_mcd_screenshot.png",
            html=html,
            domain="mcd-propertytax-delhi-pay.in",
            portal_type="property_tax",
        )
        print(f"  Classification: {result['classification']}")
        print(f"  Score: {result['composite_score']}")
        print(f"  Signals: {result['explanation'][:80]}")
        if result["classification"] not in ("CONFIRMED", "PROBABLE"):
            errors.append("Model 2: fake page not detected")
    else:
        print("  SKIP — run step2_fake_page.py first")

    # ── Test Model 3 ──────────────────────────────────────────
    print("\n[Model 3 — Campaign Clustering]")
    fit_model()
    r1 = classify_report(
        "Received WhatsApp message pay property tax at mcd-propertytax-pay.in urgently",
        report_id=201
    )
    r2 = classify_report(
        "Message about MCD mosquito spraying schedule link received",
        report_id=202
    )
    print(f"  Property tax report → campaign {r1['campaign_id']} (new={r1['is_new']})")
    print(f"  Unrelated report    → campaign {r2['campaign_id']} (new={r2['is_new']})")
    if r1["is_new"]:
        errors.append("Model 3: property tax report should join existing campaign")

    # ── Test Model 4 ──────────────────────────────────────────
    print("\n[Model 4 — Anomaly Detection]")

    attack = process_event("login", {
        "portal": "property_tax",
        "count": 580,
        "source_ips": ["45.1.1.1","91.2.2.2","12.3.3.3","185.4.4.4"],
        "timestamp": "2024-01-15T00:47:00",   # Monday midnight
    })
    normal = process_event("login", {
        "portal": "property_tax",
        "count": 50,
        "source_ips": ["10.0.1.1"],
        "timestamp": "2024-01-15T10:00:00",   # Monday 10am
    })
    admin_night = process_event("admin_login", {
        "username": "zone_admin_east@mcd.gov.in",
        "timestamp": "2024-01-15T23:47:00",
        "is_admin": True,
    })
    admin_day = process_event("admin_login", {
        "username": "zone_admin_east@mcd.gov.in",
        "timestamp": "2024-01-15T09:30:00",
        "is_admin": True,
    })

    print(f"  Attack traffic  → {'RED alert' if attack and attack['severity']=='RED' else 'FAIL'}")
    print(f"  Normal traffic  → {'No alert (correct)' if normal is None else 'FAIL — should not alert'}")
    print(f"  Admin at 11pm   → {'RED alert' if admin_night and admin_night['severity']=='RED' else 'FAIL'}")
    print(f"  Admin at 9:30am → {'No alert (correct)' if admin_day is None else 'FAIL — should not alert'}")

    if not attack or attack.get("severity") != "RED":
        errors.append("Model 4: attack not detected")
    if normal is not None:
        errors.append("Model 4: normal traffic incorrectly flagged")

    # ── Test Model 5 ──────────────────────────────────────────
    print("\n[Model 5 — The Bridge]")

    # Simulate the full chain
    canary = deploy_canary(site_id=99, portal_type="property_tax")
    check_canary(canary)   # simulate attacker triggering the canary
    record_fake_site(
        site_id=99, domain="mcd-propertytax-test.in",
        portal_type="property_tax", classification="CONFIRMED",
        explanation="Test run", canary_username=canary,
        detected_at=(datetime.now() - timedelta(hours=2)).isoformat()
    )
    record_kavach_alert(
        alert_id=99, portal_type="property_tax", zone="East",
        rule="LOGIN_SPIKE", severity="RED", z_score=44.3,
        source_ips=["1.1.1.1","2.2.2.2","3.3.3.3","4.4.4.4"],
        message="580 logins vs expected 3",
        detected_at=datetime.now().isoformat()
    )

    bridge_results = run_bridge()
    if bridge_results:
        b = bridge_results[0]
        print(f"  Confidence: {b['confidence']}")
        print(f"  Message: {b['message'][:80]}...")
        if b["confidence"] not in ("CONFIRMED", "LIKELY"):
            errors.append("Model 5: Bridge did not fire with correct confidence")
    else:
        print("  FAIL — Bridge did not fire")
        errors.append("Model 5: Bridge did not fire at all")

    # ── Summary ───────────────────────────────────────────────
    print("\n" + "=" * 60)
    if not errors:
        print("All models PASSED. Run next: python step5_demo.py")
    else:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
    print("=" * 60)

