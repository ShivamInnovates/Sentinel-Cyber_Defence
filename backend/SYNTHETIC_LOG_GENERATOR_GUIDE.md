# SENTINEL Synthetic Log Generator Guide

## Overview

The synthetic log generator creates 100+ realistic, cross-linked logs covering all SENTINEL subsystems:
- **DRISHTI**: Phishing domain detection (certstream, DNS twist, screenshots)
- **KAVACH**: Internal Windows login security (events, anomalies, patterns)
- **BRIDGE**: Attack correlation engine (canary triggers, campaign correlations)
- **ALERT**: Alert dispatch system (notifications, takedown requests, reports)
- **SYSTEM**: Infrastructure logs (API, scheduler, WebSocket, metadata)

All records are **cross-linked** by threat_id, campaign_id, and canary_id for complete forensic traceability.

---

## Quick Start

### 1. Run the Generator
```bash
cd backend
python synthetic_log_generator.py
```

Expected output:
```
============================================================
  SENTINEL Synthetic Log Generator
  Output: /path/to/backend/logs
============================================================
  ✓  certstream_events.jsonl          25 records
  ✓  dnstwist_scans.jsonl             10 records
  ✓  screenshot_analysis.jsonl        10 records
  ✓  domain_threats.jsonl             10 records
  ✓  canary_planted.jsonl             10 records
  ✓  windows_events_raw.jsonl        280 records
  ✓  zscore_anomalies.jsonl            5 records
  ✓  pattern_detections.jsonl          5 records
  ✓  cross_zone_anomalies.jsonl        2 records
  ✓  canary_triggered.jsonl            5 records
  ✓  campaign_correlations.jsonl       5 records
  ✓  alerts_dispatched.jsonl          10 records
  ✓  takedown_requests.jsonl          10 records
  ✓  weekly_reports.jsonl              3 records
  ✓  api_requests.jsonl               30 records
  ✓  scheduler_runs.jsonl             20 records
  ✓  websocket_events.jsonl           16 records
  ✓  synthetic_meta.jsonl              5 records

  ══ Total records generated : 451
  ══ Campaigns simulated     : 10
  ══ Merged file             : logs/ALL_SENTINEL_LOGS.jsonl
  ══ Summary                 : logs/SUMMARY.json

  Cross-linked ID chains:
    CERT-20240315-0042800 → THR-2024-0300 → CAN-e3f4c... → CAM-2024-0080
    CERT-20240315-0042801 → THR-2024-0301 → CAN-9d2a7... → CAM-2024-0081
    CERT-20240315-0042802 → THR-2024-0302 → CAN-5c1b3... → CAM-2024-0082
============================================================
```

### 2. Check Generated Files
```bash
ls -lah logs/
```

Output:
```
total 256K
drwxr-xr-x  logs
-rw-r--r--  12K  ALL_SENTINEL_LOGS.jsonl    (all records, merged & sorted)
-rw-r--r--   4K  SUMMARY.json               (statistics)
-rw-r--r--   2K  certstream_events.jsonl
-rw-r--r--   1K  dnstwist_scans.jsonl
-rw-r--r--   1K  screenshot_analysis.jsonl
... (18 files total)
```

### 3. Preview Logs
```bash
# See first log entry
head -1 logs/ALL_SENTINEL_LOGS.jsonl | python -m json.tool

# See summary statistics
cat logs/SUMMARY.json | python -m json.tool

# Count records by type
python -c "
import json
with open('logs/SUMMARY.json') as f:
    for t, c in json.load(f)['log_type_breakdown'].items():
        print(f'{t:<30} {c:>5}')
"
```

---

## Output Files

### Main Files

1. **ALL_SENTINEL_LOGS.jsonl** (450+ records)
   - All logs merged chronologically
   - Complete timeline of attack campaign
   - Ready for frontend or analytics

2. **SUMMARY.json** (statistics)
   ```json
   {
     "generator": "SENTINEL Synthetic Log Generator",
     "seed": 42,
     "base_time": "2024-03-15T08:00:00+00:00",
     "total_records": 451,
     "total_campaigns_simulated": 10,
     "log_type_breakdown": {
       "CERTSTREAM_EVENT": 25,
       "WINDOWS_EVENT_RAW": 280,
       ...
     },
     "files_written": [...]
   }
   ```

### Individual Type Files (18 types)

Each log type has its own JSONL file for easy filtering:

| File | Records | Purpose |
|------|---------|---------|
| certstream_events.jsonl | 25 | Certificate issuance monitoring |
| dnstwist_scans.jsonl | 10 | DNS variant scanning results |
| screenshot_analysis.jsonl | 10 | Visual similarity detection |
| domain_threats.jsonl | 10 | Master threat records |
| canary_planted.jsonl | 10 | Honeypot credential setup |
| windows_events_raw.jsonl | 280 | Windows security event logs |
| zscore_anomalies.jsonl | 5 | Statistical login spikes |
| pattern_detections.jsonl | 5 | Attack pattern recognition |
| cross_zone_anomalies.jsonl | 2 | Multi-zone correlations |
| canary_triggered.jsonl | 5 | Honeypot credential use |
| campaign_correlations.jsonl | 5 | Master campaign records |
| alerts_dispatched.jsonl | 10 | Alert notifications |
| takedown_requests.jsonl | 10 | Domain takedown filings |
| weekly_reports.jsonl | 3 | Executive summaries |
| api_requests.jsonl | 30 | API access logs |
| scheduler_runs.jsonl | 20 | Background job logs |
| websocket_events.jsonl | 16 | Real-time push events |
| synthetic_meta.jsonl | 5 | Generator metadata |

---

## Cross-Linking Example

### Complete Attack Campaign Flow
```
1. CERTSTREAM_EVENT (CERT-20240315-0042800)
   ↓
2. DNSTWIST_SCAN (DNS-20240315-0042800)
   ↓
3. SCREENSHOT_ANALYSIS (SCRN-20240315-0042800)
   ↓
4. DOMAIN_THREAT (THR-2024-0300) ← Master threat record
   ├─ canary_id: CAN-e3f4c...
   └─ attacker_ip: 185.220.101.47
   ↓
5. CANARY_PLANTED (planted at canary_id)
   ↓
6. WINDOWS_EVENT_RAW (attack markers)
   ├─ Failed login attempts from attacker_ip
   └─ Linked to threat_id: THR-2024-0300
   ↓
7. ZSCORE_ANOMALY (login spike detected)
   ├─ Linked to threat_id: THR-2024-0300
   └─ Forwarded to BRIDGE
   ↓
8. PATTERN_DETECTION (attack pattern matched)
   ├─ Pattern type: CREDENTIAL_STUFFING
   └─ Source IP: 185.220.101.47
   ↓
9. CANARY_TRIGGERED (canary credential replayed)
   ├─ Username: sntl_trap_e3f4c...
   └─ Time since phishing: 37 minutes
   ↓
10. CAMPAIGN_CORRELATION (master record)
    ├─ Links external threat to internal pattern
    ├─ Links canary trigger to real portal use
    └─ Graph visualization ready
    ↓
11. ALERT_DISPATCHED (notifications sent)
    ├─ Recipients: CISO, IT directors
    ├─ Subject: "[SENTINEL CRITICAL] Phishing-to-credential attack confirmed"
    └─ WebSocket broadcast to dashboards
    ↓
12. TAKEDOWN_REQUEST (domain takedown filed)
    ├─ Registrar: GoDaddy LLC
    ├─ Evidence: screenshot, similarity score, canary log
    └─ Status: PENDING_REGISTRAR_RESPONSE
```

---

## Log Record Examples

### 1. CERTSTREAM_EVENT
```json
{
  "log_type": "CERTSTREAM_EVENT",
  "event_id": "CERT-20240315-0042800",
  "timestamp": "2024-03-15T08:00:15.123Z",
  "domain": "mcd-online-payment.in",
  "san_domains": ["mcd-online-payment.in", "www.mcd-online-payment.in"],
  "issuer": "Let's Encrypt R3",
  "levenshtein_score": 4,
  "matched_keyword": "mcd",
  "target_domain": "mcdonline.gov.in",
  "flagged": true,
  "trigger": "KEYWORD_MATCH + LEVENSHTEIN_THRESHOLD",
  "queued_for_dnstwist": true
}
```

### 2. WINDOWS_EVENT_RAW (Canary Trigger)
```json
{
  "log_type": "WINDOWS_EVENT_RAW",
  "ingest_id": "EVT-20240315-0290000",
  "timestamp": "2024-03-15T09:37:42.000Z",
  "event_id": 4625,
  "event_name": "LOGON_FAILURE",
  "computer_name": "CENTRAL-WS05",
  "zone": "CENTRAL",
  "ip_address": "185.220.101.47",
  "username": "sntl_trap_e3f4c0d1",
  "domain": "MCD-CORP",
  "failure_code": "0xC000006A",
  "canary_event": true,
  "canary_id": "CAN-e3f4c0d1-5d2a-4b1c-...",
  "baseline_period": false
}
```

### 3. CAMPAIGN_CORRELATION (Master)
```json
{
  "log_type": "CAMPAIGN_CORRELATION",
  "campaign_id": "CAM-2024-0080",
  "timestamp": "2024-03-15T09:37:48.000Z",
  "correlation_method": "CANARY_FORENSIC",
  "external_threat_id": "THR-2024-0300",
  "phishing_domain": "mcd-online-payment.in",
  "attacker_ip": "185.220.101.47",
  "phishing_start": "2024-03-15T08:00:15.123Z",
  "credential_use_start": "2024-03-15T09:37:42.000Z",
  "campaign_window_hours": 1.63,
  "severity": "CRITICAL",
  "confidence": "FORENSIC_CONFIRMED",
  "graph_nodes": [
    {"id": "fake_site", "label": "mcd-online-payment.in", "type": "PHISHING_DOMAIN"},
    {"id": "canary", "label": "CAN-e3f4c0d1", "type": "HONEYPOT_CREDENTIAL"},
    {"id": "real_portal", "label": "mcdonline.gov.in", "type": "REAL_PORTAL"},
    {"id": "attacker", "label": "185.220.101.47", "type": "THREAT_ACTOR_IP"}
  ],
  "graph_edges": [
    {"from": "fake_site", "to": "canary", "relation": "HARVESTED"},
    {"from": "canary", "to": "real_portal", "relation": "REPLAYED_AT"},
    {"from": "attacker", "to": "fake_site", "relation": "OPERATED"}
  ]
}
```

---

## Customization

### Change Random Seed
```bash
# Edit synthetic_log_generator.py, line 31:
SEED = 42  # Change to any number for different logs
```

### Adjust Campaign Scale
```python
# In gen_certstream_events(), line ~180:
if flagged and lev <= 5 and len(campaigns) < 10:  # Change 10 to desired count
```

### Modify Time Range
```python
# Change BASE_TIME (line 130):
BASE_TIME = datetime(2024, 3, 15, 8, 0, 0, tzinfo=timezone.utc)

# Logs will span from BASE_TIME to BASE_TIME + 260 minutes
```

### Add New Zones
```python
# Add to MCD_ZONES (line 40):
MCD_ZONES = ["SOUTH", "EAST", ..., "YOUR_ZONE"]
```

---

## Integration

### Use with Frontend
```bash
# Copy merged log file to frontend
cp backend/logs/ALL_SENTINEL_LOGS.jsonl frontend/public/logs/

# Frontend fetches from: GET /logs/ALL_SENTINEL_LOGS.jsonl
```

### Use with Analytics
```bash
# Load into analytics pipeline
python -c "
import json
with open('logs/ALL_SENTINEL_LOGS.jsonl') as f:
    for line in f:
        log = json.loads(line)
        # Process log record
"
```

### Use with Backend API
```bash
# Ingest into backend
curl -X POST http://localhost:8000/api/v1/ingest-bulk \
  -H "Content-Type: application/x-jsonl" \
  --data-binary @logs/ALL_SENTINEL_LOGS.jsonl
```

---

## Statistics

### Record Distribution
```
Windows Events:      280 records (62%)  ← Bulk login/auth logs
Alerts:               10 records (2%)   ← Email notifications
API Requests:         30 records (7%)   ← REST API calls
Scheduler Runs:       20 records (4%)   ← Background jobs
WebSocket Events:     16 records (4%)   ← Real-time broadcasts
Takedowns:            10 records (2%)   ← Domain takedown filings
Other:               85 records (19%)   ← DRISHTI, BRIDGE, SYSTEM
─────────────────────────────────────
Total:              451 records (100%)
```

### Campaign Statistics
```
Campaigns Simulated: 10
Threats Created:     10
Canaries Planted:    10
Canaries Triggered:  5
Takedowns Filed:     10
Zones Affected:      5-6 (varies)
Duration:            260 minutes (~4 hours)
```

---

## Reproducibility

All logs are **deterministic** with SEED=42:
- Same output every time (unless you change SEED)
- Useful for consistent testing
- Different output with different SEED values

```bash
# Generate with different seed
python -c "
import synthetic_log_generator
synthetic_log_generator.SEED = 100
synthetic_log_generator.random.seed(100)
synthetic_log_generator.main()
"
```

---

## Troubleshooting

### Logs directory doesn't exist
```bash
mkdir -p backend/logs
python synthetic_log_generator.py
```

### Permission denied
```bash
chmod +x backend/synthetic_log_generator.py
python backend/synthetic_log_generator.py
```

### Python version issues
```bash
# Requires Python 3.7+
python --version

# Should be 3.7 or higher
```

---

## Next Steps

1. **Run generator**: `python synthetic_log_generator.py`
2. **Verify output**: `ls logs/` and `cat logs/SUMMARY.json`
3. **Copy to frontend**: `cp logs/ALL_SENTINEL_LOGS.jsonl ../frontend/public/logs/`
4. **Test analytics**: Open browser and view logs in dashboard
5. **Customize**: Modify SEED or campaign parameters as needed

---

**Status: Ready to generate realistic cyber threat logs** ✅
