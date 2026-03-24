import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { fetchLogFile, createStreamer } from '../../utils/loadLogs';

/* ── constants ── */
const LEVELS = ['ALL', 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
const SOURCES = ['ALL', 'DRISHTI', 'KAVACH', 'BRIDGE', 'SYSTEM', 'ALERT'];

const LEVEL_COLOR = {
  CRITICAL: '#ef4444',
  ERROR: '#f87171',
  WARN: '#f59e0b',
  INFO: '#3b82f6',
  DEBUG: '#6b7280',
};
const LEVEL_BG = {
  CRITICAL: 'rgba(239,68,68,0.12)',
  ERROR: 'rgba(248,113,113,0.1)',
  WARN: 'rgba(245,158,11,0.1)',
  INFO: 'rgba(59,130,246,0.1)',
  DEBUG: 'rgba(107,114,128,0.08)',
};

const LOG_FILE_URL = '/logs/ALL_SENTINEL_LOGS.jsonl'; // served from /public/logs/

/* ── sub-components ── */
function LevelBadge({ level }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 6px', borderRadius: 4,
      background: LEVEL_BG[level] ?? LEVEL_BG.DEBUG,
      color: LEVEL_COLOR[level] ?? LEVEL_COLOR.DEBUG,
      fontFamily: 'var(--font-mono)',
      flexShrink: 0,
      minWidth: 62, textAlign: 'center',
    }}>
      {level}
    </span>
  );
}

function LogTypeBadge({ type }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
      padding: '1px 5px', borderRadius: 3,
      background: 'var(--bg-raised)',
      color: 'var(--text-dim)',
      fontFamily: 'var(--font-mono)',
      flexShrink: 0,
      maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function LogRow({ log, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '188px 66px 74px 110px 1fr',
        gap: 10,
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
      onMouseLeave={e => {
        if (!selected)
          e.currentTarget.style.background = log.level === 'CRITICAL' ? 'rgba(239,68,68,0.04)' : 'transparent';
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
        {log.ts}
      </span>
      <LevelBadge level={log.level} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {log.source}
      </span>
      <LogTypeBadge type={log.logType} />
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
    ['Level', log.level],
    ['Source', log.source],
    ['Log Type', log.logType],
    ['Host / IP', log.host],
    ['Log ID', String(log.id).slice(0, 40)],
    ['Message', log.msg],
  ];

  // extra raw fields from the original record
  const raw = log.raw ?? {};
  const extraKeys = Object.keys(raw).filter(k =>
    !['log_type', 'timestamp'].includes(k) && raw[k] !== null && raw[k] !== undefined
  );

  return (
    <div style={{
      width: 360, flexShrink: 0,
      borderLeft: '1px solid var(--border-dim)',
      background: 'var(--bg-surface)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* header */}
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
        {/* raw log line */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          background: 'var(--bg-raised)', borderRadius: 8,
          padding: '10px 12px', marginBottom: 16,
          color: LEVEL_COLOR[log.level] ?? '#6b7280',
          wordBreak: 'break-all', lineHeight: 1.7,
          border: `1px solid ${(LEVEL_COLOR[log.level] ?? '#6b7280')}30`,
        }}>
          {`[${log.ts}] [${log.level}] [${log.source}/${log.logType}] ${log.msg}`}
        </div>

        {/* structured fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {fields.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{
                fontFamily: k === 'Message' ? 'var(--font-body)' : 'var(--font-mono)',
                fontSize: k === 'Message' ? 13 : 12,
                color: k === 'Level' ? (LEVEL_COLOR[v] ?? 'var(--text-primary)') : 'var(--text-primary)',
                wordBreak: 'break-word',
              }}>{v}</div>
            </div>
          ))}
        </div>

        {/* raw JSON accordion */}
        <details>
          <summary style={{ fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', marginBottom: 8, userSelect: 'none' }}>
            Raw record ({extraKeys.length} fields)
          </summary>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--bg-raised)', borderRadius: 6,
            padding: 10, overflowX: 'auto',
            color: 'var(--text-muted)', lineHeight: 1.6,
            maxHeight: 300,
          }}>
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/* ── stats bar ── */
function StatsBar({ logs, filtered }) {
  const counts = LEVELS.slice(1).reduce((acc, lv) => {
    acc[lv] = logs.filter(l => l.level === lv).length;
    return acc;
  }, {});
  return { counts };
}

/* ── main page ── */
export default function AnalyticsPage() {
  const { events, kpis } = useStore();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [streamer, setStreamer] = useState(null);

  const [levelFilter, setLevel] = useState('ALL');
  const [sourceFilter, setSource] = useState('ALL');
  const [logTypeFilter, setLogType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [streaming, setStreaming] = useState(false); // off until logs loaded
  const [autoScroll, setAutoScroll] = useState(true);

  const listRef = useRef(null);
  const intervalRef = useRef(null);

  // ── load real logs ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchLogFile(LOG_FILE_URL)
      .then(loaded => {
        // Newest-first
        const sorted = [...loaded].reverse();
        setLogs(sorted);
        setStreamer(() => createStreamer(sorted));
        setLoading(false);
        setStreaming(true);
      })
      .catch(err => {
        console.warn('Could not load SENTINEL logs from', LOG_FILE_URL, ':', err.message);
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  // ── live streaming (replay real log pool) ──────────────────────────────
  useEffect(() => {
    if (!streaming || !streamer) { clearInterval(intervalRef.current); return; }
    const delay = () => 600 + Math.random() * 1600;
    const tick = () => {
      setLogs(prev => [streamer(), ...prev].slice(0, 3000));
      intervalRef.current = setTimeout(tick, delay());
    };
    intervalRef.current = setTimeout(tick, delay());
    return () => clearTimeout(intervalRef.current);
  }, [streaming, streamer]);

  // ── auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll && listRef.current) listRef.current.scrollTop = 0;
  }, [logs, autoScroll]);

  // ── derived ───────────────────────────────────────────────────────────
  const logTypes = ['ALL', ...Array.from(new Set(logs.map(l => l.logType))).sort()];

  const filtered = logs.filter(l => {
    if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
    if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
    if (logTypeFilter !== 'ALL' && l.logType !== logTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.msg.toLowerCase().includes(q)
        || l.source.toLowerCase().includes(q)
        || l.logType.toLowerCase().includes(q)
        || (l.host ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = LEVELS.slice(1).reduce((acc, lv) => {
    acc[lv] = logs.filter(l => l.level === lv).length;
    return acc;
  }, {});

  const clearLogs = () => { setLogs([]); setSelected(null); };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Log Stream
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {loading
              ? 'Loading SENTINEL logs…'
              : loadError
                ? `⚠ Could not load ${LOG_FILE_URL} — place your generated JSONL in /public/logs/`
                : `Real-time SENTINEL security event logs — ${logs.length.toLocaleString()} records`}
          </p>
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
            {streaming ? 'LIVE' : loading ? 'LOADING' : 'PAUSED'}
          </span>
          <button
            onClick={() => setStreaming(v => !v)}
            disabled={loading || !streamer}
            style={btnStyle(streaming ? '#f59e0b' : 'var(--accent)')}
          >
            {streaming ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button onClick={clearLogs} style={btnStyle('var(--critical)')}>Clear</button>
        </div>
      </div>

      {/* ── Level counters ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {LEVELS.slice(1).map(lv => (
          <button
            key={lv}
            onClick={() => setLevel(prev => prev === lv ? 'ALL' : lv)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: levelFilter === lv ? LEVEL_BG[lv] : 'var(--bg-card)',
              color: levelFilter === lv ? LEVEL_COLOR[lv] : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600,
              outline: levelFilter === lv ? `1px solid ${LEVEL_COLOR[lv]}50` : '1px solid var(--border-dim)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: LEVEL_COLOR[lv], flexShrink: 0 }} />
            {lv}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
              {counts[lv] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs — message, source, type, host…"
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-dim)'; }}
          />
        </div>

        {/* Source filter */}
        <select value={sourceFilter} onChange={e => setSource(e.target.value)} style={selectStyle}>
          {SOURCES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Sources' : s}</option>)}
        </select>

        {/* Log type filter */}
        <select value={logTypeFilter} onChange={e => setLogType(e.target.value)} style={selectStyle}>
          <option value="ALL">All Types</option>
          {logTypes.filter(t => t !== 'ALL').map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Auto-scroll */}
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

      {/* ── Log viewer ── */}
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '188px 66px 74px 110px 1fr',
          gap: 10, padding: '8px 16px',
          borderBottom: '1px solid var(--border-dim)',
          background: 'var(--bg-raised)',
        }}>
          {['TIMESTAMP', 'LEVEL', 'SOURCE', 'LOG TYPE', 'MESSAGE'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows + detail panel */}
        <div style={{ display: 'flex', minHeight: 0 }}>
          <div
            ref={listRef}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 560, minWidth: 0 }}
            onScroll={() => {
              if (listRef.current && listRef.current.scrollTop > 20) setAutoScroll(false);
            }}
          >
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                Loading SENTINEL logs…
              </div>
            ) : loadError ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13 }}>
                <div style={{ color: '#f59e0b', marginBottom: 8 }}>⚠ Log file not found</div>
                <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  Run: <code>python log_generator.py</code><br />
                  Then copy <code>logs/ALL_SENTINEL_LOGS.jsonl</code> → <code>public/logs/</code>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                No logs match the current filters
              </div>
            ) : (
              filtered.map(log => (
                <LogRow
                  key={`${log.id}-${log.ts}`}
                  log={log}
                  selected={selected?.id === log.id && selected?.ts === log.ts}
                  onClick={() => setSelected(prev =>
                    prev?.id === log.id && prev?.ts === log.ts ? null : log
                  )}
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

const btnStyle = color => ({
  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: `${color}18`, color,
  fontSize: 12, fontWeight: 600,
  outline: `1px solid ${color}40`,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
});

const selectStyle = {
  padding: '8px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-dim)',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  cursor: 'pointer',
  outline: 'none',
};