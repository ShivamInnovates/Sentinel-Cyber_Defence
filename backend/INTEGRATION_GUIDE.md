# Integration Guide: Synthetic Logs → Frontend

## Overview
Connect the generated synthetic logs to the frontend dashboard for realistic threat visualization and testing.

---

## Step 1: Generate Logs

```bash
cd backend
python synthetic_log_generator.py
```

This creates:
- `backend/logs/ALL_SENTINEL_LOGS.jsonl` (451 records, 12KB)
- `backend/logs/SUMMARY.json` (statistics)
- 18 type-specific JSONL files

---

## Step 2: Copy to Frontend

```bash
# Copy merged log file
cp backend/logs/ALL_SENTINEL_LOGS.jsonl frontend/public/logs/

# Verify it copied
ls -lah frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
```

Result:
```
-rw-r--r-- 12K ALL_SENTINEL_LOGS.jsonl
```

---

## Step 3: Start Frontend

```bash
cd frontend
npm install  # (if needed)
npm run dev
```

Visit: http://localhost:5173

---

## Step 4: View Logs in Dashboard

### Overview Page
- **URL**: http://localhost:5173/overview
- **Shows**: 
  - Threat Trend Chart (CRITICAL vs HIGH severity)
  - Severity Donut Chart (distribution)
  - Live Feed (newest 8 logs)
- **Expected**:
  - 451 total log entries
  - 25 CRITICAL events (high phishing threats)
  - 10+ HIGH events (login anomalies)

### Analytics Page
- **URL**: http://localhost:5173/analytics
- **Shows**:
  - Complete log table (all 451 records)
  - Real-time streaming simulation
  - Level, source, type filters
  - Search across all fields
  - Detail panel on selection
- **Expected**:
  - Instant load of all logs
  - Smooth scrolling through 451 entries
  - Filters work correctly
  - Real-time updates every 0.6-2.2 seconds

---

## File Structure

```
frontend/
└── public/
    └── logs/
        ├── ALL_SENTINEL_LOGS.jsonl      ← This file
        └── SUMMARY.json (optional reference)

backend/
└── logs/
    ├── ALL_SENTINEL_LOGS.jsonl          ← Source file
    ├── SUMMARY.json                     ← Statistics
    ├── certstream_events.jsonl          ← Individual types
    ├── windows_events_raw.jsonl
    └── ... (16 more)
```

---

## Testing Scenarios

### Scenario 1: Fresh Load
```
1. Start frontend: npm run dev
2. Navigate to: http://localhost:5173/overview
3. Expected: Logs load instantly, charts display
4. Check: Console (F12) should show no errors
```

### Scenario 2: Filter by Severity
```
1. Go to: http://localhost:5173/analytics
2. Filter Level: Select "CRITICAL"
3. Expected: Shows ~25 critical logs
4. Search: Type "phishing"
5. Expected: Shows domain threat records
```

### Scenario 3: Real-time Streaming
```
1. Go to: http://localhost:5173/analytics
2. Toggle: "Stream New Events" ON
3. Expected: New logs appear every 1-2 seconds
4. Verify: Auto-scroll to top shows newest entries
```

### Scenario 4: Campaign Traceability
```
1. Search: "CAN-" (canary ID prefix)
2. Find: Canary trigger event
3. Note: timestamp and linked threat_id
4. Search: That threat_id
5. Expected: See entire attack timeline
   - Phishing domain detection
   - Canary planted
   - Attack pattern
   - Canary trigger
   - Campaign correlation
   - Alert dispatch
```

---

## Verification

### Log Content Check
```bash
# First log should be CERTSTREAM_EVENT
head -1 frontend/public/logs/ALL_SENTINEL_LOGS.jsonl

# Should output:
# {"log_type":"CERTSTREAM_EVENT",...,"timestamp":"2024-03-15T08:00:15.123Z",...}

# Count records
wc -l frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
# Expected: 451 (or close to it)
```

### Frontend Load Check
```bash
# In browser console (F12):
fetch('/logs/ALL_SENTINEL_LOGS.jsonl')
  .then(r => r.text())
  .then(text => {
    const lines = text.trim().split('\n');
    console.log(`Loaded ${lines.length} log entries`);
  });

# Expected output: "Loaded 451 log entries"
```

---

## Performance

### Expected Metrics
- **File size**: ~12 KB (compresses well)
- **Load time**: <100ms
- **Parse time**: <50ms
- **Rendering**: Smooth at 60fps

### Monitoring
```bash
# Check file size
du -h frontend/public/logs/ALL_SENTINEL_LOGS.jsonl

# Check for encoding issues
file frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
# Should show: UTF-8 Unicode text
```

---

## Troubleshooting

### Logs don't appear in frontend
```
1. Check file was copied:
   ls frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
   
2. Check file has content:
   wc -l frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
   # Should show 451+
   
3. Hard refresh browser:
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   
4. Check browser console for errors:
   F12 → Console tab
   Look for red errors
```

### Charts are empty
```
1. Verify logs loaded by checking console:
   F12 → Network tab
   Look for: /logs/ALL_SENTINEL_LOGS.jsonl
   Status should be: 200
   
2. If 404 error:
   - File not in right location
   - Check path is exactly: frontend/public/logs/ALL_SENTINEL_LOGS.jsonl
   
3. If 200 but no data:
   - Check file isn't empty: wc -l logs/ALL_SENTINEL_LOGS.jsonl
   - Check JSON is valid: head -1 logs/ALL_SENTINEL_LOGS.jsonl | python -m json.tool
```

### Streaming is too slow/fast
```
Frontend: src/utils/loadLogs.js, line ~158:
const delay = () => 600 + Math.random() * 1600;
           Change: ───────────────────────────
           600ms = minimum delay between logs
           1600ms = maximum delay between logs
           Adjust to desired speed
```

---

## Update Cycle

To regenerate logs with new data:

```bash
# 1. Generate fresh logs
cd backend
python synthetic_log_generator.py

# 2. Copy to frontend
cp logs/ALL_SENTINEL_LOGS.jsonl ../frontend/public/logs/

# 3. Refresh browser
# Frontend will automatically load new file
```

---

## Integration with Backend API

If backend is running:

```bash
# 1. Start backend
cd backend
python -m uvicorn app:app --reload

# 2. Ingest logs (optional)
curl -X POST http://localhost:8000/api/v1/ingest-bulk \
  -H "Content-Type: application/x-jsonl" \
  --data-binary @logs/ALL_SENTINEL_LOGS.jsonl

# 3. Query via API
curl http://localhost:8000/api/v1/threats \
  -H "X-API-KEY: sentinel-demo-key"
```

---

## What's Displayed

### Overview Page
- **KPI Cards**: Threat counts from logs
- **Threat Trend**: CRITICAL vs HIGH over time
- **Severity Distribution**: Pie chart of severity breakdown
- **Live Feed**: Newest 8 logs streaming in real-time

### Analytics Page
- **Full Log Table**: All 451 records with:
  - Timestamp (ISO 8601)
  - Severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  - Source module (DRISHTI, KAVACH, BRIDGE, SYSTEM, ALERT)
  - Log type (19 different types)
  - Message preview (first 100 chars)
- **Filters**:
  - By level (CRITICAL, HIGH, etc.)
  - By source (DRISHTI, KAVACH, etc.)
  - By log type (CERTSTREAM_EVENT, WINDOWS_EVENT_RAW, etc.)
  - By search text (full-text across all fields)
- **Real-time Streaming**: New logs appear every 0.6-2.2 seconds (simulated)
- **Detail Panel**: Full record display on click

---

## Summary

| Step | Command | Result |
|------|---------|--------|
| 1 | `python synthetic_log_generator.py` | Creates 451 logs in backend/logs/ |
| 2 | `cp logs/ALL_SENTINEL_LOGS.jsonl ../frontend/public/logs/` | Copies file to public directory |
| 3 | `npm run dev` in frontend | Starts dev server on port 5173 |
| 4 | Visit http://localhost:5173 | See logs in dashboard |

**Total time**: < 2 minutes ✅

---

**Status: Ready to visualize synthetic threat campaigns** ✅
