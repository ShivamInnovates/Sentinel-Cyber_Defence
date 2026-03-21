import sqlite3
import os

DB_PATH = "sentinel.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS phishing_domains (
            id TEXT PRIMARY KEY,
            domain TEXT,
            similarity INTEGER,
            threat_type TEXT,
            status TEXT,
            severity TEXT,
            indicators TEXT,
            age_minutes INTEGER
        );
        CREATE TABLE IF NOT EXISTS security_events (
            id TEXT PRIMARY KEY,
            event_type TEXT,
            zone TEXT,
            severity TEXT,
            details TEXT,
            source_ip TEXT
        );
        CREATE TABLE IF NOT EXISTS zone_stats (
            zone TEXT PRIMARY KEY,
            threat_level TEXT,
            event_count INTEGER
        );
        CREATE TABLE IF NOT EXISTS correlations (
            id TEXT PRIMARY KEY,
            domain_id TEXT,
            event_id TEXT,
            confidence INTEGER,
            correlation_type TEXT,
            portal_match INTEGER,
            timing_match INTEGER,
            pattern_match INTEGER,
            confirmed INTEGER,
            narrative TEXT
        );
        CREATE TABLE IF NOT EXISTS canary_tokens (
            id TEXT PRIMARY KEY,
            domain_id TEXT,
            token TEXT,
            deployed_at TEXT,
            triggered INTEGER
        );
    ''')
    conn.commit()
    conn.close()

def seed_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM phishing_domains")
    if cur.fetchone()[0] == 0:
        conn.executescript('''
            INSERT INTO phishing_domains (id, domain, similarity, threat_type, age_minutes, severity, status, indicators) VALUES
            ("D001", "mcd-services-delhi.com", 94, "Aadhaar Form", 2, "CRITICAL", "LIVE", \'["High Similarity", "Aadhaar Form", "New Domain"]\'),
            ("D002", "mcdonline-payment.in", 87, "Payment Portal", 14, "HIGH", "LIVE", \'["Payment Portal", "Recent Reg"]\'),
            ("D003", "delhi-mcd-portal.net", 81, "Login Clone", 60, "HIGH", "TAKEDOWN", \'["Login Page"]\'),
            ("D004", "mcd-tax-pay.org", 76, "Tax Portal", 180, "MEDIUM", "WATCH", \'["Tax Info"]\'),
            ("D005", "mcdelhi-official.co.in", 68, "General Portal", 360, "LOW", "WATCH", \'["Suspicious keywords"]\');

            INSERT INTO security_events (id, event_type, zone, severity, details, source_ip) VALUES
            ("KV001", "Failed Login Spike", "Central", "CRITICAL", "47 failed logins", "185.220.101.47"),
            ("KV002", "Foreign IP Connection", "NE", "HIGH", "Connection from outside India", "unknown"),
            ("KV003", "Off-Hours Privileged Access", "East", "HIGH", "Login at 3AM", "10.0.0.5"),
            ("KV004", "Port Scan Detected", "North", "MEDIUM", "100 ports scanned in 60s", "192.168.1.5"),
            ("KV005", "Large Data Transfer", "South", "MEDIUM", "500MB transferred", "10.0.0.10"),
            ("KV006", "Failed Login Spike", "Shahdara", "CRITICAL", "Spike detected", "8.8.8.8");

            INSERT INTO correlations (id, domain_id, event_id, confidence, correlation_type, confirmed, narrative) VALUES
            ("BR001", "D001", "KV001", 97, "Credential Stuffing", 1, "Phishing -> Intrusion"),
            ("BR002", "D002", "KV003", 84, "Phishing -> Intrusion", 0, "Phishing -> Intrusion"),
            ("BR003", "D003", "KV002", 72, "Credential Stuffing", 1, "Credential Stuffing");

            INSERT INTO zone_stats (zone, threat_level, event_count) VALUES
            ("Central", "CRITICAL", 5),
            ("North", "MEDIUM", 1),
            ("South", "MEDIUM", 2),
            ("East", "HIGH", 3),
            ("West", "LOW", 0),
            ("NE", "HIGH", 4),
            ("NW", "LOW", 0),
            ("SE", "LOW", 0),
            ("SW", "LOW", 0),
            ("Shahdara", "CRITICAL", 6),
            ("Civil Lines", "LOW", 0),
            ("City SP", "LOW", 0);
        ''')
    conn.commit()
    conn.close()
