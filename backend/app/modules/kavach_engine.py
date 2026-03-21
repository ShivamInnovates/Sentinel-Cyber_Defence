"""
SENTINEL — KAVACH Module
Internal threat detection:
- Z-score anomaly detection on login events
- Off-hours access detection
- Port scan detection  
- Foreign IP detection
- Cross-zone coordinated attack detection
"""

import json
import math
import re
from datetime import datetime, time as dtime
from typing import Optional

# Known Indian IP ranges (simplified — real impl uses MaxMind GeoIP)
INDIAN_IP_PREFIXES = [
    "1.6.","1.7.","1.186.","1.187.","1.188.","1.189.","1.190.","1.191.",
    "14.96.","14.97.","14.98.","14.99.","14.100.","14.101.",
    "27.0.","27.4.","27.56.","27.57.","27.58.","27.59.",
    "43.224.","43.225.","43.226.","43.227.","43.228.",
    "49.32.","49.33.","49.34.","49.35.",
    "59.88.","59.89.","59.90.","59.91.",
    "103.","106.","111.","115.","116.","117.","119.","120.",
    "122.","125.","136.","150.","152.","157.","163.","164.",
    "172.","180.","182.","183.","192.168.","10.","172.16.",
]

KNOWN_MALICIOUS_IPS = [
    "185.220.101.", "45.142.212.", "91.108.4.", "194.165.16.",
    "185.234.218.", "192.42.116.", "198.98.56.",
]

WORKING_HOURS = (dtime(9, 0), dtime(19, 0))

MCD_ZONES = [
    "Central","North","South","East","West",
    "NE","NW","SE","SW","Shahdara","Civil Lines","City SP"
]


# ── Z-Score Anomaly Detection ──────────────────────────────────────────────

def z_score(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return abs((value - mean) / std)


def baseline_stats(values: list[float]) -> tuple[float, float]:
    """Return mean and std of a list."""
    if not values:
        return 0.0, 1.0
    n = len(values)
    mean = sum(values) / n
    variance = sum((x - mean) ** 2 for x in values) / n
    std = math.sqrt(variance) if variance > 0 else 1.0
    return mean, std


# Simulated historical baselines per event type
BASELINES = {
    "failed_login":    {"mean": 3.2, "std": 1.8},   # avg failed logins per 5-min window
    "port_scan":       {"mean": 12.0, "std": 5.0},   # avg port probes per minute
    "data_exfil":      {"mean": 45.0, "std": 20.0},  # avg MB per session
    "off_hours_access":{"mean": 0.4,  "std": 0.3},   # avg off-hours events per night
}


def analyze_login_spike(failed_count: int, window_seconds: int = 300) -> dict:
    """Detect failed login anomalies using Z-score."""
    baseline = BASELINES["failed_login"]
    z = z_score(failed_count, baseline["mean"], baseline["std"])

    rate_per_min = failed_count / (window_seconds / 60)

    if z >= 4.0:
        severity = "CRITICAL"
        verdict  = "Confirmed credential stuffing attack"
    elif z >= 3.0:
        severity = "HIGH"
        verdict  = "Likely brute-force or credential stuffing"
    elif z >= 2.0:
        severity = "MEDIUM"
        verdict  = "Elevated login failure rate — investigate"
    else:
        severity = "LOW"
        verdict  = "Within normal range"

    return {
        "event_type": "failed_login",
        "failed_count": failed_count,
        "window_seconds": window_seconds,
        "rate_per_minute": round(rate_per_min, 2),
        "z_score": round(z, 2),
        "baseline_mean": baseline["mean"],
        "baseline_std": baseline["std"],
        "severity": severity,
        "verdict": verdict,
        "bridge_candidate": z >= 3.0,
    }


def analyze_port_scan(ports_probed: int, window_seconds: int = 60) -> dict:
    """Detect port scanning activity."""
    baseline = BASELINES["port_scan"]
    z = z_score(ports_probed, baseline["mean"], baseline["std"])

    if ports_probed > 1000:
        severity = "CRITICAL"
        verdict  = "Full port sweep — active reconnaissance"
    elif ports_probed > 500 or z >= 4.0:
        severity = "HIGH"
        verdict  = "Extensive port scan detected"
    elif ports_probed > 100 or z >= 2.5:
        severity = "MEDIUM"
        verdict  = "Port scan activity — monitor source IP"
    else:
        severity = "LOW"
        verdict  = "Minor port probe — possibly automated scan"

    return {
        "event_type": "port_scan",
        "ports_probed": ports_probed,
        "window_seconds": window_seconds,
        "z_score": round(z, 2),
        "severity": severity,
        "verdict": verdict,
        "bridge_candidate": z >= 3.0,
    }


def analyze_data_transfer(mb_transferred: float) -> dict:
    """Detect abnormal outbound data transfers."""
    baseline = BASELINES["data_exfil"]
    z = z_score(mb_transferred, baseline["mean"], baseline["std"])

    if mb_transferred > 1000 or z >= 5.0:
        severity = "CRITICAL"
        verdict  = "Massive data exfiltration likely"
    elif mb_transferred > 500 or z >= 3.5:
        severity = "HIGH"
        verdict  = "Large outbound transfer — possible exfiltration"
    elif mb_transferred > 200 or z >= 2.5:
        severity = "MEDIUM"
        verdict  = "Above-average outbound transfer"
    else:
        severity = "LOW"
        verdict  = "Transfer within acceptable range"

    return {
        "event_type": "data_exfil",
        "mb_transferred": mb_transferred,
        "z_score": round(z, 2),
        "severity": severity,
        "verdict": verdict,
        "bridge_candidate": z >= 3.5,
    }


def analyze_ip(ip: str) -> dict:
    """Check if IP is foreign or known malicious."""
    ip = ip.strip()
    is_indian = any(ip.startswith(prefix) for prefix in INDIAN_IP_PREFIXES)
    is_malicious = any(ip.startswith(prefix) for prefix in KNOWN_MALICIOUS_IPS)
    is_private = ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172.")

    if is_malicious:
        severity = "CRITICAL"
        verdict  = "Known malicious IP — Tor exit node or threat actor infrastructure"
    elif not is_indian and not is_private:
        severity = "HIGH"
        verdict  = "Foreign IP accessing MCD internal systems — likely unauthorized"
    elif is_private:
        severity = "LOW"
        verdict  = "Private/internal IP — normal internal traffic"
    else:
        severity = "LOW"
        verdict  = "Indian IP — verify user identity"

    return {
        "event_type": "foreign_ip",
        "ip": ip,
        "is_indian": is_indian,
        "is_private": is_private,
        "is_known_malicious": is_malicious,
        "severity": severity,
        "verdict": verdict,
        "bridge_candidate": is_malicious or (not is_indian and not is_private),
    }


def analyze_access_time(timestamp_str: str) -> dict:
    """Detect off-hours privileged access."""
    try:
        if "T" in timestamp_str:
            dt = datetime.fromisoformat(timestamp_str)
        else:
            dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        t = dt.time()
    except Exception:
        t = datetime.now().time()

    is_working_hours = WORKING_HOURS[0] <= t <= WORKING_HOURS[1]
    is_weekend = dt.weekday() >= 5 if 'dt' in dir() else False

    if not is_working_hours and (dtime(0,0) <= t <= dtime(5,0)):
        severity = "CRITICAL"
        verdict  = "Deep night access (00:00–05:00) — highly suspicious"
    elif not is_working_hours:
        severity = "HIGH"
        verdict  = "Off-hours privileged access outside 09:00–19:00"
    elif is_weekend:
        severity = "MEDIUM"
        verdict  = "Weekend access on government system"
    else:
        severity = "LOW"
        verdict  = "Access during normal working hours"

    return {
        "event_type": "off_hours_access",
        "timestamp": timestamp_str,
        "access_time": str(t),
        "is_working_hours": is_working_hours,
        "severity": severity,
        "verdict": verdict,
        "bridge_candidate": not is_working_hours,
    }


def detect_coordinated_attack(zone_events: dict) -> Optional[dict]:
    """
    Check if similar attack types are appearing across multiple zones simultaneously.
    zone_events: {zone_name: [event_types]}
    """
    type_zones = {}
    for zone, etypes in zone_events.items():
        for etype in etypes:
            type_zones.setdefault(etype, []).append(zone)

    coordinated = {}
    for etype, zones in type_zones.items():
        if len(zones) >= 3:
            coordinated[etype] = zones

    if coordinated:
        worst_type = max(coordinated, key=lambda x: len(coordinated[x]))
        return {
            "detected": True,
            "attack_type": worst_type,
            "affected_zones": coordinated[worst_type],
            "zone_count": len(coordinated[worst_type]),
            "severity": "CRITICAL",
            "verdict": f"Coordinated {worst_type} attack across {len(coordinated[worst_type])} zones — likely orchestrated campaign",
            "bridge_candidate": True,
        }
    return {"detected": False}


def parse_log_line(line: str) -> Optional[dict]:
    """
    Parse a generic log line and extract security-relevant info.
    Supports common formats: Apache, Windows Event, syslog-style.
    """
    line = line.strip()
    if not line:
        return None

    result = {"raw": line, "flags": []}

    # Extract IP addresses
    ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', line)
    if ips:
        result["ips"] = ips
        for ip in ips:
            ip_analysis = analyze_ip(ip)
            if ip_analysis["severity"] in ["CRITICAL", "HIGH"]:
                result["flags"].append(f"Suspicious IP: {ip} — {ip_analysis['verdict']}")

    # Detect failed login patterns
    if re.search(r'(failed|failure|invalid|incorrect|wrong).*(login|password|auth|credential)', line, re.I):
        result["flags"].append("Failed authentication attempt detected")
        result["event_type"] = "failed_login"

    # Detect port scan patterns
    if re.search(r'(port.scan|nmap|masscan|SYN.flood|connection.refused)', line, re.I):
        result["flags"].append("Port scanning activity detected")
        result["event_type"] = "port_scan"

    # Detect privilege escalation
    if re.search(r'(sudo|su -|runas|privilege|escalat|admin)', line, re.I):
        result["flags"].append("Privilege escalation or admin access")
        result["event_type"] = "privilege_escalation"

    # Detect large data transfers
    if re.search(r'(\d{3,})\s*(MB|GB|kb|bytes)', line, re.I):
        match = re.search(r'(\d+)\s*(MB|GB)', line, re.I)
        if match:
            size = int(match.group(1))
            if match.group(2).upper() == "GB":
                size *= 1024
            if size > 200:
                result["flags"].append(f"Large transfer: {size}MB")
                result["event_type"] = "data_exfil"

    # Off-hours timestamp check
    time_match = re.search(r'(\d{2}:\d{2}:\d{2})', line)
    if time_match:
        t_str = time_match.group(1)
        h, m, s = map(int, t_str.split(":"))
        if not (9 <= h <= 19):
            result["flags"].append(f"Off-hours access at {t_str}")

    result["has_threats"] = len(result["flags"]) > 0
    return result if result["has_threats"] else None
