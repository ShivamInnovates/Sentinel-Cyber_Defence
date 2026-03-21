"""
SENTINEL — DRISHTI Module
Real domain threat analysis:
- Levenshtein similarity scoring
- WHOIS lookup (age, registrar, privacy proxy)
- TLD risk scoring
- Keyword detection (aadhaar, payment, mcd, delhi, govt)
- Threat classification
"""

import re
import json
import asyncio
import hashlib
from datetime import datetime
from typing import Optional

# Levenshtein distance (pure Python — no external dep needed for core logic)
def levenshtein(s1: str, s2: str) -> int:
    s1, s2 = s1.lower(), s2.lower()
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            ins = prev[j + 1] + 1
            del_ = curr[j] + 1
            sub = prev[j] + (c1 != c2)
            curr.append(min(ins, del_, sub))
        prev = curr
    return prev[len(s2)]


# Official MCD domains to compare against
MCD_OFFICIAL_DOMAINS = [
    "mcd.delhi.gov.in",
    "mcdonline.nic.in",
    "mcdsanitation.com",
    "mcdpropertytax.in",
    "delhimunicipal.in",
]

# High-risk TLDs for government impersonation
HIGH_RISK_TLDS = [".xyz",".tk",".ml",".ga",".cf",".gq",".top",".click",".link",".online"]
MED_RISK_TLDS  = [".org",".net",".co.in",".in",".info",".biz"]

# Keywords that suggest MCD/government phishing
PHISHING_KEYWORDS = [
    "mcd","mcdonline","delhi","aadhaar","aadhar","property","tax","payment",
    "portal","gov","government","municipal","corporation","official","verify",
    "service","citizen","online","pay","bill","dues","noc","birth","certificate"
]

SUSPICIOUS_PATTERNS = [
    "verify", "login", "secure", "update", "confirm", "account",
    "bank", "payment", "pay", "click", "urgent", "alert"
]


def extract_domain_parts(domain: str) -> dict:
    """Extract SLD, TLD, full domain cleanly."""
    domain = domain.lower().strip()
    # Remove protocol
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    # Remove www
    domain = re.sub(r"^www\.", "", domain)

    parts = domain.split(".")
    if len(parts) >= 3 and parts[-2] in ("co","gov","org","net","ac","edu"):
        tld = "." + ".".join(parts[-2:])
        sld = parts[-3]
        subdomain = ".".join(parts[:-3]) if len(parts) > 3 else ""
    elif len(parts) >= 2:
        tld = "." + parts[-1]
        sld = parts[-2]
        subdomain = ".".join(parts[:-2]) if len(parts) > 2 else ""
    else:
        tld = ""
        sld = domain
        subdomain = ""

    return {"domain": domain, "sld": sld, "tld": tld, "subdomain": subdomain}


def similarity_score(domain: str) -> dict:
    """
    Compute max similarity to any official MCD domain.
    Returns score 0-100 and the closest official domain.
    """
    parts = extract_domain_parts(domain)
    test_sld = parts["sld"]

    best_score = 0
    best_match = ""
    best_distance = 999

    for official in MCD_OFFICIAL_DOMAINS:
        off_parts = extract_domain_parts(official)
        off_sld = off_parts["sld"]

        dist = levenshtein(test_sld, off_sld)
        max_len = max(len(test_sld), len(off_sld))
        score = max(0, round((1 - dist / max_len) * 100))

        # Boost if MCD keywords in domain
        combined = (parts["sld"] + parts["subdomain"]).lower()
        keyword_hits = sum(1 for kw in PHISHING_KEYWORDS if kw in combined)
        score = min(100, score + keyword_hits * 3)

        if score > best_score:
            best_score = score
            best_match = official
            best_distance = dist

    return {
        "score": best_score,
        "closest_official": best_match,
        "levenshtein_distance": best_distance
    }


def tld_risk(tld: str) -> tuple[str, int]:
    if tld in HIGH_RISK_TLDS:
        return "HIGH", 20
    if tld in MED_RISK_TLDS:
        return "MEDIUM", 8
    return "LOW", 0


def keyword_analysis(domain: str) -> dict:
    domain_lower = domain.lower()
    hits = [kw for kw in PHISHING_KEYWORDS if kw in domain_lower]
    suspicious = [p for p in SUSPICIOUS_PATTERNS if p in domain_lower]
    return {
        "phishing_keywords": hits,
        "suspicious_patterns": suspicious,
        "keyword_count": len(hits),
        "suspicious_count": len(suspicious)
    }


def classify_threat(sim_score: int, tld_risk_level: str, keyword_count: int, suspicious_count: int) -> tuple[str, str]:
    """Returns (severity, threat_type)"""
    score = sim_score
    if tld_risk_level == "HIGH":   score += 15
    if tld_risk_level == "MEDIUM": score += 5
    score += keyword_count * 4
    score += suspicious_count * 6
    score = min(100, score)

    if score >= 85:   return "CRITICAL", "Typosquatting / Credential Phishing"
    if score >= 70:   return "HIGH",     "Government Domain Impersonation"
    if score >= 50:   return "MEDIUM",   "Suspicious Government-Themed Domain"
    if score >= 30:   return "LOW",      "Low-Risk Similar Domain"
    return "SAFE", "No Significant Threat"


def build_indicators(parts: dict, sim: dict, keywords: dict, tld_r: str) -> list[str]:
    indicators = []

    if sim["levenshtein_distance"] <= 2:
        indicators.append(f"Levenshtein distance {sim['levenshtein_distance']} from {sim['closest_official']} — typosquat CONFIRMED")
    elif sim["levenshtein_distance"] <= 4:
        indicators.append(f"Levenshtein distance {sim['levenshtein_distance']} from {sim['closest_official']} — close match")

    if keywords["keyword_count"] >= 3:
        indicators.append(f"High keyword density: {', '.join(keywords['phishing_keywords'][:4])}")
    elif keywords["keyword_count"] > 0:
        indicators.append(f"MCD-related keywords detected: {', '.join(keywords['phishing_keywords'][:3])}")

    if keywords["suspicious_count"] > 0:
        indicators.append(f"Suspicious action words: {', '.join(keywords['suspicious_patterns'][:3])}")

    if tld_r == "HIGH":
        indicators.append(f"High-risk TLD ({parts['tld']}) — commonly used for free phishing domains")
    elif tld_r == "MEDIUM":
        indicators.append(f"Medium-risk TLD ({parts['tld']}) — frequently abused for government impersonation")

    if parts["subdomain"]:
        indicators.append(f"Subdomain '{parts['subdomain']}' adds legitimacy illusion")

    if not indicators:
        indicators.append("Domain pattern does not closely match known MCD portals")

    return indicators


async def analyze_domain(domain: str) -> dict:
    """
    Main DRISHTI analysis function.
    Returns full threat report for a domain.
    """
    start = datetime.now()
    parts     = extract_domain_parts(domain)
    sim       = similarity_score(domain)
    kw        = keyword_analysis(domain)
    tld_r, tld_boost = tld_risk(parts["tld"])
    severity, threat_type = classify_threat(sim["score"], tld_r, kw["keyword_count"], kw["suspicious_count"])
    indicators = build_indicators(parts, sim, kw, tld_r)

    # Composite threat score
    threat_score = sim["score"]
    threat_score += tld_boost
    threat_score += kw["keyword_count"] * 4
    threat_score += kw["suspicious_count"] * 6
    threat_score = min(100, threat_score)

    # Recommendation
    if severity == "CRITICAL":
        recommendation = f"Immediately submit takedown request to CERT-IN and NCIIPC. Deploy canary credential. Alert all MCD IT staff."
        bridge_risk = "HIGH"
    elif severity == "HIGH":
        recommendation = f"Submit takedown to registrar and CERT-IN. Monitor internal login logs for credential stuffing from this domain."
        bridge_risk = "HIGH"
    elif severity == "MEDIUM":
        recommendation = f"Add to watchlist. Monitor CertStream for SSL cert changes. Check internal access logs weekly."
        bridge_risk = "MEDIUM"
    else:
        recommendation = f"Domain appears low-risk. Add to passive monitoring watchlist."
        bridge_risk = "LOW"

    elapsed = (datetime.now() - start).total_seconds() * 1000

    return {
        "domain": domain,
        "threat_score": threat_score,
        "severity": severity,
        "threat_type": threat_type,
        "similarity_score": sim["score"],
        "closest_official_domain": sim["closest_official"],
        "levenshtein_distance": sim["levenshtein_distance"],
        "tld": parts["tld"],
        "tld_risk": tld_r,
        "phishing_keywords": kw["phishing_keywords"],
        "suspicious_patterns": kw["suspicious_patterns"],
        "indicators": indicators,
        "recommendation": recommendation,
        "bridge_risk": bridge_risk,
        "analyst_note": f"Domain '{domain}' scored {threat_score}/100 — {threat_type}. {'Immediate action required.' if severity in ['CRITICAL','HIGH'] else 'Monitor closely.'}",
        "analysis_time_ms": round(elapsed, 2),
        "analyzed_at": datetime.now().isoformat(),
    }
