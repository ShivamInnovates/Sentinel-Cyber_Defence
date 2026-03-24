# notifications.py — Alerting and notification system for SENTINEL

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import json

# Configuration
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
NOTIFICATION_EMAILS = os.environ.get("NOTIFICATION_EMAILS", "admin@mcd.gov.in").split(",")
CERT_IN_EMAIL = os.environ.get("CERT_IN_EMAIL", "cert-in@nic.in")

# Throttling and dedup cache (in-memory for demo; use Redis in prod)
_alert_cache = {}

def _is_throttled(alert_key: str, throttle_minutes: int = 30) -> bool:
    """Check if alert was sent recently to avoid spam."""
    now = datetime.now()
    if alert_key in _alert_cache:
        last_sent = _alert_cache[alert_key]
        if now - last_sent < timedelta(minutes=throttle_minutes):
            return True
    _alert_cache[alert_key] = now
    return False

def _send_email(to_emails: list, subject: str, body: str):
    """Send email notification."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[NOTIFICATION] Email disabled: {subject} -> {body}")
        return

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = ", ".join(to_emails)
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_emails, text)
        server.quit()
        print(f"[NOTIFICATION] Email sent: {subject}")
    except Exception as e:
        print(f"[NOTIFICATION] Email failed: {e}")

def notify_alert(alert: dict, portal_type: str, severity: str):
    """Send notifications for a new alert."""
    alert_key = f"{portal_type}:{alert.get('rule')}:{severity}"
    if _is_throttled(alert_key):
        print(f"[NOTIFICATION] Throttled: {alert_key}")
        return

    subject = f"SENTINEL Alert: {severity} - {alert.get('rule')} on {portal_type}"
    body = f"""
SENTINEL Cyber Defense Alert

Severity: {severity}
Rule: {alert.get('rule')}
Portal: {portal_type}
Zone: {alert.get('zone', 'Unknown')}
Message: {alert.get('message')}
Z-Score: {alert.get('z_score', 'N/A')}
Source IPs: {', '.join(alert.get('source_ips', []))}
Timestamp: {alert.get('timestamp', datetime.now().isoformat())}

Please investigate immediately.
"""

    # Send to internal team
    _send_email(NOTIFICATION_EMAILS, subject, body)

    # If critical, notify CERT-In
    if severity == "RED":
        cert_subject = f"CRITICAL: {subject}"
        cert_body = body + "\n\nThis is a critical alert requiring immediate CERT-In coordination."
        _send_email([CERT_IN_EMAIL], cert_subject, cert_body)

def notify_correlation(correlation: dict):
    """Send notifications for coordinated attack correlations."""
    alert_key = f"correlation:{correlation.get('fake_site')}:{correlation.get('confidence')}"
    if _is_throttled(alert_key, throttle_minutes=60):  # Less frequent for correlations
        print(f"[NOTIFICATION] Throttled correlation: {alert_key}")
        return

    subject = f"SENTINEL Correlation: {correlation.get('confidence')} Coordinated Attack"
    body = f"""
SENTINEL Coordinated Attack Detected

Confidence: {correlation.get('confidence')}
Fake Site: {correlation.get('fake_site')}
Portal: {correlation.get('portal_type')}
Gap: {correlation.get('gap_minutes')} minutes
Canary Proof: {correlation.get('canary_proof')}
Message: {correlation.get('message')}

Actions Required:
{chr(10).join('- ' + action for action in correlation.get('actions', []))}

Timestamp: {datetime.now().isoformat()}
"""

    # Send to internal team and CERT-In
    _send_email(NOTIFICATION_EMAILS + [CERT_IN_EMAIL], subject, body)

def notify_canary_trigger(canary_username: str, site_id: int):
    """Send notification when a canary is triggered."""
    alert_key = f"canary:{canary_username}"
    if _is_throttled(alert_key, throttle_minutes=10):
        print(f"[NOTIFICATION] Throttled canary: {alert_key}")
        return

    subject = f"SENTINEL Canary Triggered: {canary_username}"
    body = f"""
SENTINEL Canary Credential Stolen

Username: {canary_username}
Site ID: {site_id}

This indicates potential credential theft from the fake site.
Monitor real portal for this username.

Timestamp: {datetime.now().isoformat()}
"""

    _send_email(NOTIFICATION_EMAILS, subject, body)