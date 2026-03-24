import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';

/* ── helpers ── */
const pad = (n) => String(n).padStart(2, '0');
const ts = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}`;

const LEVELS = ['ALL', 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
const SOURCES = ['ALL', 'DRISHTI', 'KAVACH', 'BRIDGE', 'SYSTEM', 'AUTH', 'NETWORK'];

const LEVEL_COLOR = {
  CRITICAL: '#ef4444',
  ERROR:    '#f87171',
  WARN:     '#f59e0b',
  INFO:     '#3b82f6',
  DEBUG:    '#6b7280',
};

const LEVEL_BG = {
  CRITICAL: 'rgba(239,68,68,0.12)',
  ERROR:    'rgba(248,113,113,0.1)',
  WARN:     'rgba(245,158,11,0.1)',
  INFO:     'rgba(59,130,246,0.1)',
  DEBUG:    'rgba(107,114,128,0.08)',
};

/* ── seed log pool ── */
const LOG_TEMPLATES = [
  { level: 'CRITICAL', source: 'DRISHTI',  msg: 'Phishing domain {domain} confirmed live — takedown initiated' },
  { level: 'CRITICAL', source: 'KAVACH',   msg: 'Brute-force threshold exceeded on zone {zone} — IP {ip} blocked' },
  { level: 'CRITICAL', source: 'BRIDGE',   msg: 'Multi-vector attack chain detected — correlation ID {cid}' },
  { level: 'ERROR',    source: 'AUTH',     msg: 'Failed login attempt for user {user} from {ip} — attempt {n}/5' },
  { level: 'ERROR',    source: 'NETWORK',  msg: 'Anomalous outbound traffic spike on interface eth{n} — {bytes} KB/s' },
  { level: 'ERROR',    source: 'KAVACH',   msg: 'Signature match: CVE-2024-{n} exploit pattern in payload' },
  { level: 'WARN',     source: 'DRISHTI',  msg: 'Suspicious domain {domain} registered — similarity {pct}%' },
  { level: 'WARN',     source: 'AUTH',     msg: 'Unusual login time for {user} — last seen {zone}' },
  { level: 'WARN',     source: 'NETWORK',  msg: 'Port scan detected from {ip} — {n} ports probed' },
  { level: 'WARN',     source: 'SYSTEM',   msg: 'Canary credential {cred} accessed from {ip}' },
  { level: 'INFO',     source: 'DRISHTI',  msg: 'Domain scan completed — {n} new domains flagged' },
  { level: 'INFO',     source: 'KAVACH',   msg: 'Detection rule {rule} updated — version {n}' },
  { level: 'INFO',     source: 'BRIDGE',   msg: 'Correlation engine processed {n} events in last cycle' },
  { level: 'INFO',     source: 'SYSTEM',   msg: 'Threat feed sync complete — {n} IOCs ingested' },
  { level: 'INFO',     source: 'AUTH',     msg: 'User {user} authenticated successfully from {ip}' },
  { level: 'INFO',     source: 'NETWORK',  msg: 'Firewall rule applied — {n} packets dropped' },
  { level: 'DEBUG',    source: 'SYSTEM',   msg: 'Heartbeat OK — uptime {n}h, memory {pct}% used' },
  { level: 'DEBUG',    source: 'BRIDGE',   msg: 'Graph traversal: {n} nodes, {pct}ms elapsed' },
  { level: 'DEBUG',    source: 'NETWORK',  msg: 'DNS query resolved: {domain} → {ip}' },
  { level: 'DEBUG',    source: 'DRISHTI',  msg: 'Screenshot captured for {domain} — hash {cid}' },
];

const DOMAINS_POOL = ['mcd-delhi.in','mcdonline.net','mcd-portal.xyz','delhimcd.co','mcd-pay.info'];
const ZONES_POOL   = ['North Delhi','South Delhi','East Delhi','West Delhi','Central Delhi'];
const USERS_POOL   = ['admin','operator_1','analyst_02','sysadmin','guest_user'];
const RULES_POOL   = ['R-1042','R-2091','R-3317','R-4450','R-5001'];
const CREDS_POOL   = ['honey_admin','trap_root','decoy_svc'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randIp = () => `${randInt(1,254)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`;
const randHex = (len) => [...Array(len)].map(() => Math.floor(Math.random()*16).toString(16)).join('');

function renderMsg(tpl) {
  return tpl.msg
    .replace('{domain}', rand(DOMAINS_POOL))
    .replace('{zone}',   rand(ZONES_POOL))
    .replace('{ip}',     randIp())
    .replace('{user}',   rand(USERS_POOL))
    .replace('{rule}',   rand(RULES_POOL))
    .replace('{cred}',   rand(CREDS_POOL))
    .replace('{cid}',    `CID-${randHex(6).toUpperCase()}`)
    .replace('{n}',      String(randInt(1, 999)))
    .replace('{pct}',    String(randInt(1, 99)))
    .replace('{bytes}',  String(randInt(100, 9999)));
}

let _idCounter = 1;
function makeLog(overrides = {}) {
  const tpl = rand(LOG_TEMPLATES);
  return {
    id:     _idCounter++,
    ts:     ts(new Date()),
    level:  tpl.level,
    source: tpl.source,
    msg:    renderMsg(tpl),
    host:   `node-${randInt(1,8).toString().padStart(2,'0')}`,
    pid:    randInt(1000, 9999),
    ...overrides,
  };
}

/* seed initial logs */
function seedLogs(count = 120) {
  const logs = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const d = new Date(now - i * randInt(800, 4000));
    const tpl = rand(LOG_TEMPLATES);
    logs.push({
      id:     _idCounter++,
      ts:     ts(d),
      level:  tpl.level,
      source: tpl.source,
      msg:    renderMsg(tpl),
      host:   `node-${randInt(1,8).toString().padStart(2,'0')}`,
      pid:    randInt(1000, 9999),
    });
  }
  return logs;
}

/* ── sub-components ── */
function LevelBadge({ level }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 6px', borderRadius: 4,
      background: LEVEL_BG[level],
      color: LEVEL_COLOR[level],
      fontFamily: 'var(--font-mono)',
      flexShrink: 0,
      minWidth: 58, textAlign: 'center',
    }}>
      {level}
    </span>
  );
}

function LogRow({ log, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '190px 58px 80px 80px 1fr',
        gap: 12,
        alignItems: 'center',
        padding: '5px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-dim)',
        background: selected
          ? 'rgba(59,130,246,0.08)'
          : log.level === 'CRITICAL' ? 'rgba(239,68,68,0.04)' : 'transparent',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-raised)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = log.level === 'CRITICAL' ? 'rgba(239,68,68,0.04)' : 'transparent'; }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
        {log.ts}
      </span>
      <LevelBadge level={log.level} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {log.source}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
        {log.host}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {log.msg}
      </span>
    </div>
  );
}

function DetailPanel({ log, onClose }) {
  if (!log) return null;
  const fields = [
    ['Timestamp', log.ts],
    ['Level',     log.level],
    ['Source',    log.source],
    ['Host',      log.host],
    ['PID',       log.pid],
    ['Log ID',    `LOG-${String(log.id).padStart(6,'0')}`],
    ['Message',   log.msg],
  ];
  return (
    <div style={{
      width: 340, flexShrink: 0,
      borderLeft: '1px solid var(--border-dim)',
      background: 'var(--bg-surface)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Log Detail
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Raw log line */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          background: 'var(--bg-raised)', borderRadius: 8,
          padding: '10px 12px', marginBottom: 16,
          color: LEVEL_COLOR[log.level],
          wordBreak: 'break-all', lineHeight: 1.7,
          border: `1px solid ${LEVEL_COLOR[log.level]}30`,
        }}>
          {`[${log.ts}] [${log.level}] [${log.source}] [${log.host}:${log.pid}] ${log.msg}`}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{
                fontFamily: k === 'Message' ? 'var(--font-body)' : 'var(--font-mono)',
                fontSize: k === 'Message' ? 13 : 12,
                color: k === 'Level' ? LEVEL_COLOR[v] : 'var(--text-primary)',
                wordBreak: 'break-word',
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── main page ── */
export default function AnalyticsPage() {
  const { events, kpis } = useStore();
  const [logs, setLogs]           = useState(() => seedLogs(120));
  const [levelFilter, setLevel]   = useState('ALL');
  const [sourceFilter, setSource] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [streaming, setStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef(null);
  const intervalRef = useRef(null);

  /* live streaming */
  useEffect(() => {
    if (!streaming) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setLogs(prev => [makeLog(), ...prev].slice(0, 2000));
    }, randInt(600, 2200));
    return () => clearInterval(intervalRef.current);
  }, [streaming]);

  /* auto-scroll to top (newest) */
  useEffect(() => {
    if (autoScroll && listRef.current) listRef.current.scrollTop = 0;
  }, [logs, autoScroll]);

  const filtered = logs.filter(l => {
    if (levelFilter  !== 'ALL' && l.level  !== levelFilter)  return false;
    if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
    if (search && !l.msg.toLowerCase().includes(search.toLowerCase()) &&
        !l.source.toLowerCase().includes(search.toLowerCase()) &&
        !l.host.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = LEVELS.slice(1).reduce((acc, lv) => {
    acc[lv] = logs.filter(l => l.level === lv).length;
    return acc;
  }, {});

  const clearLogs = () => { setLogs([]); setSelected(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Log Stream</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time system and security event logs</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: streaming ? 'var(--success)' : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: streaming ? 'var(--success)' : 'var(--text-dim)',
              animation: streaming ? 'pulse-dot 1.4s infinite' : 'none',
            }} />
            {streaming ? 'LIVE' : 'PAUSED'}
          </span>
          <button onClick={() => setStreaming(v => !v)} style={btnStyle(streaming ? '#f59e0b' : 'var(--accent)')}>
            {streaming ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button onClick={clearLogs} style={btnStyle('var(--critical)')}>
            Clear
          </button>
        </div>
      </div>

      {/* Level counters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {LEVELS.slice(1).map(lv => (
          <button
            key={lv}
            onClick={() => setLevel(prev => prev === lv ? 'ALL' : lv)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: levelFilter === lv ? LEVEL_BG[lv] : 'var(--bg-card)',
              color: levelFilter === lv ? LEVEL_COLOR[lv] : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600,
              outline: levelFilter === lv ? `1px solid ${LEVEL_COLOR[lv]}50` : '1px solid var(--border-dim)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: LEVEL_COLOR[lv], flexShrink: 0 }} />
            {lv}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{counts[lv] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs…"
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              fontFamily: 'var(--font-mono)', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-dim)'; }}
          />
        </div>

        {/* Source filter */}
        <select
          value={sourceFilter}
          onChange={e => setSource(e.target.value)}
          style={{
            padding: '8px 12px', background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)', borderRadius: 8,
            color: 'var(--text-secondary)', fontSize: 12,
            fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none',
          }}
        >
          {SOURCES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sources' : s}</option>)}
        </select>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(v => !v)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: autoScroll ? 'var(--accent-light)' : 'var(--bg-card)',
            color: autoScroll ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600,
            outline: autoScroll ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border-dim)',
          }}
        >
          ↑ Auto-scroll
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          {filtered.length.toLocaleString()} / {logs.length.toLocaleString()} entries
        </span>
      </div>

      {/* Log viewer */}
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '190px 58px 80px 80px 1fr',
          gap: 12, padding: '8px 16px',
          borderBottom: '1px solid var(--border-dim)',
          background: 'var(--bg-raised)',
        }}>
          {['TIMESTAMP', 'LEVEL', 'SOURCE', 'HOST', 'MESSAGE'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{h}</span>
          ))}
        </div>

        {/* Log rows + detail panel */}
        <div style={{ display: 'flex', minHeight: 0 }}>
          <div
            ref={listRef}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 560, minWidth: 0 }}
            onScroll={() => {
              if (listRef.current && listRef.current.scrollTop > 10) setAutoScroll(false);
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                No logs match the current filters
              </div>
            ) : (
              filtered.map(log => (
                <LogRow
                  key={log.id}
                  log={log}
                  selected={selected?.id === log.id}
                  onClick={() => setSelected(prev => prev?.id === log.id ? null : log)}
                />
              ))
            )}
          </div>

          <DetailPanel log={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: `${color}18`, color: color,
    fontSize: 12, fontWeight: 600,
    outline: `1px solid ${color}40`,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };
}
