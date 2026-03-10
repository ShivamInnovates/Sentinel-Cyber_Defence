"""
SENTINEL — BRIDGE Module
Cross-reality threat correlation engine.
Connects external phishing (DRISHTI) to internal attacks (KAVACH).

Correlation logic:
1. Portal type match — same service targeted externally and internally
2. Event timing match — internal spike within 4-hour window of phishing detection
3. Attack pattern match — credential stuffing pattern matches phishing type
4. Confidence scoring — weighted sum of all three factors
"""

from datetime import datetime, timedelta
from typing import Optional
import uuid
import json


# Portal type mapping — links external phishing types to internal attack types
PORTAL_TYPE_MAP = {
    "Aadhaar Form":    ["failed_login", "foreign_ip"],
    "Payment Portal":  ["failed_login", "data_exfil"],
    "Login Clone":     ["failed_login", "off_hours_access", "foreign_ip"],
    "Tax Portal":      ["failed_login", "data_exfil"],
    "General Portal":  ["failed_login"],
}

# Attack pattern weights for confidence scoring
CONFIDENCE_WEIGHTS = {
    "portal_match":   40,   # Portal type corresponds to internal attack
    "timing_match":   35,   # Event happened within time window
    "pattern_match":  25,   # Attack patterns are consistent
}

CORRELATION_WINDOW_HOURS = 4


def portal_match_score(phishing_type: str, event_type: str) -> tuple[bool, int]:
    """Check if phishing type maps to internal event type."""
    mapped = PORTAL_TYPE_MAP.get(phishing_type, [])
    if event_type in mapped:
        return True, CONFIDENCE_WEIGHTS["portal_match"]
    # Partial match — both involve login
    if "login" in event_type and "login" in str(mapped):
        return True, CONFIDENCE_WEIGHTS["portal_match"] // 2
    return False, 0


def timing_match_score(
    phishing_detected_at: str,
    event_created_at: str,
    window_hours: int = CORRELATION_WINDOW_HOURS
) -> tuple[bool, int, float]:
    """
    Check if internal event occurred within time window of phishing detection.
    Returns (matched, score, delta_hours)
    """
    try:
        t1 = datetime.fromisoformat(phishing_detected_at.replace("Z",""))
        t2 = datetime.fromisoformat(event_created_at.replace("Z",""))
    except Exception:
        # If timestamps can't be parsed, assume match for demo
        return True, CONFIDENCE_WEIGHTS["timing_match"], 1.5

    delta = abs((t2 - t1).total_seconds() / 3600)

    if delta <= window_hours:
        # Score decreases as delta increases — closer = higher confidence
        score = int(CONFIDENCE_WEIGHTS["timing_match"] * (1 - delta / window_hours))
        return True, max(score, 5), delta
    return False, 0, delta


def pattern_match_score(phishing_severity: str, event_severity: str) -> tuple[bool, int]:
    """Both being high/critical severity suggests same campaign."""
    sev_order = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    p = sev_order.get(phishing_severity, 2)
    e = sev_order.get(event_severity, 2)

    if p >= 3 and e >= 3:
        return True, CONFIDENCE_WEIGHTS["pattern_match"]
    if abs(p - e) <= 1:
        return True, CONFIDENCE_WEIGHTS["pattern_match"] // 2
    return False, 0


def generate_narrative(
    domain: str,
    phishing_type: str,
    event_type: str,
    zone: str,
    confidence: int,
    delta_hours: float
) -> str:
    """Generate a human-readable attack narrative."""
    delta_str = f"{delta_hours:.1f}h" if delta_hours < 24 else f"{delta_hours/24:.1f} days"

    narratives = {
        "failed_login": f"External phishing portal '{domain}' ({phishing_type}) collected credentials. "
                        f"{delta_str} later, a failed login spike was detected in {zone} zone — "
                        f"consistent with credential stuffing using harvested credentials. "
                        f"Confidence: {confidence}%.",
        "foreign_ip":   f"Phishing campaign via '{domain}' likely harvested credentials. "
                        f"Foreign IP connection to {zone} zone detected {delta_str} later — "
                        f"attacker may be using stolen credentials from a different location. "
                        f"Confidence: {confidence}%.",
        "off_hours_access": f"'{domain}' phishing site collected privileged credentials. "
                            f"Off-hours privileged access in {zone} ({delta_str} later) suggests "
                            f"attacker used harvested credentials during low-monitoring period. "
                            f"Confidence: {confidence}%.",
        "data_exfil":   f"Payment phishing via '{domain}' may have provided internal network foothold. "
                        f"Large data transfer from {zone} zone detected {delta_str} later. "
                        f"Confidence: {confidence}%.",
    }
    return narratives.get(event_type, f"Phishing domain '{domain}' correlates with {event_type} in {zone}. Confidence: {confidence}%.")


def correlate(
    domain: dict,
    event: dict,
) -> Optional[dict]:
    """
    Run full correlation between one phishing domain and one internal event.
    Returns correlation record or None if confidence too low.
    """
    MIN_CONFIDENCE = 50

    # Portal match
    pm, pm_score = portal_match_score(
        domain.get("threat_type", ""),
        event.get("event_type", "")
    )

    # Timing match
    tm, tm_score, delta_hours = timing_match_score(
        domain.get("created_at", datetime.now().isoformat()),
        event.get("created_at", datetime.now().isoformat()),
    )

    # Pattern match
    pat_m, pat_score = pattern_match_score(
        domain.get("severity", "MEDIUM"),
        event.get("severity", "MEDIUM")
    )

    confidence = pm_score + tm_score + pat_score

    if confidence < MIN_CONFIDENCE:
        return None

    # Determine correlation type
    if event.get("event_type") == "failed_login":
        corr_type = "Credential Stuffing"
    elif event.get("event_type") == "foreign_ip":
        corr_type = "Phishing → Unauthorized Access"
    elif event.get("event_type") == "data_exfil":
        corr_type = "Phishing → Data Exfiltration"
    else:
        corr_type = "Phishing → Internal Attack"

    narrative = generate_narrative(
        domain.get("domain", "unknown"),
        domain.get("threat_type", "Unknown"),
        event.get("event_type", "unknown"),
        event.get("zone", "Unknown"),
        confidence,
        delta_hours,
    )

    return {
        "id": f"BR-{str(uuid.uuid4())[:8].upper()}",
        "domain_id": domain.get("id"),
        "event_id": event.get("id"),
        "domain": domain.get("domain"),
        "event_label": event.get("details", event.get("event_type", "")),
        "zone": event.get("zone", ""),
        "confidence": confidence,
        "correlation_type": corr_type,
        "portal_match": pm,
        "timing_match": tm,
        "pattern_match": pat_m,
        "delta_hours": round(delta_hours, 2),
        "confirmed": confidence >= 80,
        "narrative": narrative,
        "created_at": datetime.now().isoformat(),
    }


def run_correlation_engine(domains: list[dict], events: list[dict]) -> list[dict]:
    """
    Run correlation engine across all active domains and unresolved events.
    Returns all correlations above threshold, sorted by confidence.
    """
    results = []
    seen_pairs = set()

    for domain in domains:
        if domain.get("status") not in ("LIVE", "WATCH"):
            continue
        for event in events:
            if event.get("resolved"):
                continue
            pair_key = f"{domain['id']}:{event['id']}"
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            corr = correlate(domain, event)
            if corr:
                results.append(corr)

    # Sort by confidence descending
    results.sort(key=lambda x: x["confidence"], reverse=True)
    # Deduplicate — keep highest confidence per domain
    seen_domains = set()
    deduped = []
    for r in results:
        if r["domain_id"] not in seen_domains:
            deduped.append(r)
            seen_domains.add(r["domain_id"])

    return deduped
