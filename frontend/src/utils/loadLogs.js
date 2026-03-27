/**
 * SENTINEL Log Loader
 * Reads from /logs/*.jsonl (served as static JSON or imported at build time)
 * and normalises records into the shape AnalyticsPage + OverviewPage expect.
 */

// ── severity mapping ────────────────────────────────────────────────────────
const SEVERITY_MAP = {
    CRITICAL: 'CRITICAL',
    HIGH: 'ERROR',
    HIGH_CROSS_ZONE: 'ERROR',
    MEDIUM: 'WARN',
    LOW: 'INFO',
    INFO: 'INFO',
    // KAVACH z-score native severities
    ERROR: 'ERROR',
    WARN: 'WARN',
    DEBUG: 'DEBUG',
};

// ── source mapping ──────────────────────────────────────────────────────────
const SOURCE_MAP = {
    CERTSTREAM_EVENT: 'DRISHTI',
    DNSTWIST_SCAN: 'DRISHTI',
    SCREENSHOT_ANALYSIS: 'DRISHTI',
    DOMAIN_THREAT: 'DRISHTI',
    CANARY_PLANTED: 'BRIDGE',
    WINDOWS_EVENT_RAW: 'KAVACH',
    ZSCORE_ANOMALY: 'KAVACH',
    PATTERN_DETECTION: 'KAVACH',
    CROSS_ZONE_ANOMALY: 'KAVACH',
    CANARY_TRIGGERED: 'BRIDGE',
    CAMPAIGN_CORRELATION: 'BRIDGE',
    ALERT_DISPATCHED: 'ALERT',
    TAKEDOWN_REQUEST: 'ALERT',
    WEEKLY_REPORT: 'SYSTEM',
    API_REQUEST: 'SYSTEM',
    SCHEDULER_RUN: 'SYSTEM',
    WEBSOCKET_PUSH: 'SYSTEM',
    SYNTHETIC_RUN: 'SYSTEM',
};

// ── level from log record ───────────────────────────────────────────────────
function inferLevel(rec) {
    // Explicit severity field
    if (rec.severity) return SEVERITY_MAP[rec.severity] ?? 'INFO';
    if (rec.escalated_severity) return SEVERITY_MAP[rec.escalated_severity] ?? 'CRITICAL';

    // WINDOWS_EVENT_RAW: failures vs success
    if (rec.log_type === 'WINDOWS_EVENT_RAW') {
        if (rec.canary_event) return 'CRITICAL';
        if (rec.attack_marker) return 'ERROR';
        if (rec.event_id === 4625) return 'WARN';
        if (rec.event_id === 4740) return 'ERROR';
        return 'INFO';
    }
    if (rec.log_type === 'SCHEDULER_RUN') return rec.status === 'ERROR' ? 'ERROR' : 'DEBUG';
    if (rec.log_type === 'API_REQUEST') return rec.status_code >= 500 ? 'ERROR' : rec.status_code === 401 ? 'WARN' : 'INFO';
    if (rec.log_type === 'WEEKLY_REPORT') return 'INFO';
    if (rec.log_type === 'WEBSOCKET_PUSH') return 'DEBUG';
    if (rec.log_type === 'CERTSTREAM_EVENT') return rec.flagged ? 'WARN' : 'DEBUG';
    if (rec.log_type === 'DNSTWIST_SCAN') return 'WARN';
    if (rec.log_type === 'SCREENSHOT_ANALYSIS') {
        return rec.verdict === 'CONFIRMED_PHISHING' ? 'CRITICAL' : 'WARN';
    }
    if (rec.log_type === 'DOMAIN_THREAT') return 'CRITICAL';
    if (rec.log_type === 'CANARY_PLANTED') return 'INFO';
    if (rec.log_type === 'CANARY_TRIGGERED') return 'CRITICAL';
    if (rec.log_type === 'CAMPAIGN_CORRELATION') return 'CRITICAL';
    if (rec.log_type === 'ALERT_DISPATCHED') return rec.severity === 'CRITICAL' ? 'CRITICAL' : 'WARN';
    if (rec.log_type === 'TAKEDOWN_REQUEST') return 'WARN';
    return 'INFO';
}

// ── human-readable message ──────────────────────────────────────────────────
function buildMsg(rec) {
    switch (rec.log_type) {
        case 'CERTSTREAM_EVENT':
            return `Cert issued for ${rec.domain} — Levenshtein ${rec.levenshtein_score} vs ${rec.target_domain}`;
        case 'DNSTWIST_SCAN':
            return `DNSTwist: ${rec.suspect_domain} resolved → ${rec.ip_address} (${rec.geo_country}, ${rec.asn})`;
        case 'SCREENSHOT_ANALYSIS':
            return `Screenshot ${rec.verdict} — ${rec.suspect_domain} vs ${rec.reference_portal} (${rec.visual_similarity_pct}% similar)`;
        case 'DOMAIN_THREAT':
            return `Threat ${rec.threat_id}: ${rec.suspect_domain} impersonating ${rec.target_portal}`;
        case 'CANARY_PLANTED':
            return `Canary planted on ${rec.fake_domain} — user ${rec.canary_username}`;
        case 'WINDOWS_EVENT_RAW':
            if (rec.canary_event) return `⚠ CANARY credential ${rec.username} used from ${rec.ip_address} on ${rec.computer_name}`;
            if (rec.attack_marker) return `Attack: ${rec.event_name} for ${rec.username} from ${rec.ip_address} on ${rec.computer_name}`;
            return `${rec.event_name} — user ${rec.username} on ${rec.computer_name} from ${rec.ip_address}`;
        case 'ZSCORE_ANOMALY':
            return `Z-Score ${rec.z_score} (threshold ${rec.threshold}) — ${rec.count_observed} events in ${rec.window_minutes}m on ${rec.zone}`;
        case 'PATTERN_DETECTION':
            return `${rec.pattern_type} detected in ${rec.zone} from ${rec.source_ip} — ${rec.indicators?.attempts_per_minute} attempts/min`;
        case 'CROSS_ZONE_ANOMALY':
            return `Cross-zone attack: ${rec.zones_involved?.join(', ')} — ${rec.total_failed_attempts} attempts from ${rec.shared_source_ip}`;
        case 'CANARY_TRIGGERED':
            return `Canary ${rec.canary_username} triggered on ${rec.seen_on_portal} from ${rec.attempt_ip}`;
        case 'CAMPAIGN_CORRELATION':
            return `Campaign ${rec.campaign_id} confirmed: ${rec.phishing_domain} → ${rec.attacker_ip} (${rec.campaign_window_hours}h window)`;
        case 'ALERT_DISPATCHED':
            return rec.subject ?? `Alert ${rec.alert_id} dispatched (${rec.alert_type})`;
        case 'TAKEDOWN_REQUEST':
            return `Takedown filed: ${rec.fake_domain} @ ${rec.registrar} — status ${rec.status}`;
        case 'WEEKLY_REPORT':
            return `Weekly report ${rec.report_id} — ${rec.summary?.campaigns_confirmed} campaigns, ${rec.summary?.new_fake_domains} new fake domains`;
        case 'API_REQUEST':
            return `${rec.method} ${rec.endpoint} → ${rec.status_code} (${rec.latency_ms}ms)`;
        case 'SCHEDULER_RUN':
            return `Scheduler ${rec.job_name}: ${rec.certs_checked} certs checked, ${rec.domains_flagged} flagged — ${rec.status}`;
        case 'WEBSOCKET_PUSH':
            return `WS push: ${rec.event_name} to ${rec.connected_clients} clients`;
        case 'SYNTHETIC_RUN':
            return `Synthetic run ${rec.scenario} — ${rec.event_logs_generated} events generated`;
        default:
            return JSON.stringify(rec).slice(0, 120);
    }
}

// ── pad helper ──────────────────────────────────────────────────────────────
let _id = 1;
function pad(n, len = 2) { return String(n).padStart(len, '0'); }
function fmtTs(isoStr) {
    try {
        const d = new Date(isoStr);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
            + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
    } catch { return isoStr ?? ''; }
}

// ── main normaliser ─────────────────────────────────────────────────────────
export function normaliseLog(rec) {
    return {
        id: rec.event_id ?? rec.ingest_id ?? rec.scan_id ?? rec.analysis_id
            ?? rec.threat_id ?? rec.canary_id ?? rec.anomaly_id ?? rec.pattern_id
            ?? rec.correlation_id ?? rec.trigger_id ?? rec.campaign_id
            ?? rec.alert_id ?? rec.request_id ?? rec.run_id ?? rec.ws_event_id
            ?? rec.report_id ?? `log-${_id++}`,
        ts: fmtTs(rec.timestamp),
        rawTs: rec.timestamp ?? '',
        level: inferLevel(rec),
        source: SOURCE_MAP[rec.log_type] ?? 'SYSTEM',
        host: rec.computer_name ?? rec.machine ?? rec.client_ip ?? 'sentinel-node',
        pid: rec.pid ?? 0,
        msg: buildMsg(rec),
        logType: rec.log_type ?? 'UNKNOWN',
        raw: rec,
    };
}

// ── fetch + parse JSONL file ────────────────────────────────────────────────
export async function fetchLogFile(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json') && !ct.includes('text/plain') && !ct.includes('application/x-ndjson')) {
        // Vite served an HTML 404 page — treat as empty
        throw new Error(`${url} returned non-JSON content-type: ${ct}`);
    }
    const text = await res.text();
    return text
        .split('\n')
        .filter(Boolean)
        .map(line => { try { return JSON.parse(line); } catch { return null; } })
        .filter(Boolean)
        .map(normaliseLog);
}

// ── in-memory streaming simulator using real log pool ──────────────────────
/**
 * Given an array of normalised logs, returns a function that when called
 * pops the next log (cycling) to simulate real-time streaming.
 */
export function createStreamer(logPool) {
    if (!logPool || logPool.length === 0) {
        // Return a no-op streamer if pool is empty
        return function nextLog() { return null; };
    }
    let idx = 0;
    return function nextLog() {
        const base = logPool[idx % logPool.length];
        idx++;
        const now = new Date();
        const pad2 = n => String(n).padStart(2, '0');
        return {
            ...base,
            id: `${base.id}-rt-${idx}`,
            ts: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} `
                + `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`,
        };
    };
}