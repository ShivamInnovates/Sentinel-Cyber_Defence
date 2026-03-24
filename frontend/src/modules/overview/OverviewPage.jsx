import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { ThreatTrendChart, SeverityDonut } from '../../components/charts';
import LiveFeed from '../../components/shared/LiveFeed';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { fetchLogFile, createStreamer } from '../../utils/loadLogs';

const SEV_COLOR = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#6384BE', LOW: '#6b7280' };
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

const LOG_FILE_URL = '/logs/ALL_SENTINEL_LOGS.jsonl';

/* ── mini log row for overview feed ── */
function MiniLogRow({ log }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '7px 0',
      borderBottom: '1px solid var(--border-dim)',
      alignItems: 'flex-start',
    }}>
      {/* severity bar */}
      <div style={{
        width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0,
        background: LEVEL_COLOR[log.level] ?? '#6b7280',
        minHeight: 32,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            padding: '1px 5px', borderRadius: 3,
            background: LEVEL_BG[log.level] ?? LEVEL_BG.DEBUG,
            color: LEVEL_COLOR[log.level] ?? LEVEL_COLOR.DEBUG,
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>
            {log.level}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {log.source}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {log.msg}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {log.ts}
        </div>
      </div>
    </div>
  );
}

/* ── log type breakdown table ── */
function LogTypeTable({ logs }) {
  const byType = logs.reduce((acc, l) => {
    acc[l.logType] = (acc[l.logType] ?? 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const max = rows[0]?.[1] ?? 1;

  // source → color
  const sourceOf = t => {
    if (t.startsWith('CERTSTREAM') || t.startsWith('DNSTWIST') || t.startsWith('SCREENSHOT') || t.startsWith('DOMAIN')) return '#3b82f6';
    if (t.startsWith('WINDOWS') || t.startsWith('ZSCORE') || t.startsWith('PATTERN') || t.startsWith('CROSS')) return '#f59e0b';
    if (t.startsWith('CANARY') || t.startsWith('CAMPAIGN')) return '#a78bfa';
    if (t.startsWith('ALERT') || t.startsWith('TAKEDOWN')) return '#ef4444';
    return '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(([type, count]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', flexShrink: 0,
            width: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {type}
          </span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(count / max) * 100}%`, height: '100%',
              background: sourceOf(type), borderRadius: 3,
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, width: 36, textAlign: 'right' }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── main ── */
export default function OverviewPage() {
  const { kpis, events, correlations, trendData, setActiveModule } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  /* log state */
  const [sentinelLogs, setSentinelLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [streamer, setStreamer] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef(null);

  // load logs
  useEffect(() => {
    fetchLogFile(LOG_FILE_URL)
      .then(loaded => {
        const sorted = [...loaded].reverse();
        setSentinelLogs(sorted);
        setStreamer(() => createStreamer(sorted));
        setLogLoading(false);
        setStreaming(true);
      })
      .catch(() => {
        setLogLoading(false);
      });
  }, []);

  // live stream new entries
  useEffect(() => {
    if (!streaming || !streamer) { clearTimeout(intervalRef.current); return; }
    const delay = () => 1000 + Math.random() * 2000;
    const tick = () => {
      setSentinelLogs(prev => [streamer(), ...prev].slice(0, 1000));
      intervalRef.current = setTimeout(tick, delay());
    };
    intervalRef.current = setTimeout(tick, delay());
    return () => clearTimeout(intervalRef.current);
  }, [streaming, streamer]);

  // derive summary stats from real logs
  const criticalLogs = sentinelLogs.filter(l => l.level === 'CRITICAL');
  const errorLogs = sentinelLogs.filter(l => l.level === 'ERROR');
  const recentLogs = sentinelLogs.slice(0, 8); // newest 8 for mini feed

  const kpiCards = [
    { label: 'Active Threats', value: kpis.activeThreats, color: '#ef4444', sub: `${kpis.criticalCount} critical` },
    { label: 'Live Phishing Sites', value: kpis.livePhishingSites, color: '#f59e0b', sub: 'Fake MCD sites online' },
    { label: 'Login Anomalies', value: kpis.loginAnomalies, color: '#6384BE', sub: 'Last 60 minutes' },
    { label: 'Confirmed Attacks', value: correlations.filter(c => c.confirmed).length, color: '#a78bfa', sub: 'Traced attack chains' },
  ];

  return (
    <ErrorBoundary>
      <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Security Overview
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Real-time view of all threats across MCD Delhi's digital infrastructure.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {kpiCards.map((s, i) => (
          <div key={s.label} className="card card-interactive" data-aos="fade-up" data-aos-delay={i * 60}
            style={{ padding: '20px 24px', borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Log summary KPIs ── */}
      {!logLoading && sentinelLogs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Log Entries', value: sentinelLogs.length.toLocaleString(), color: '#6b7280' },
            { label: 'Critical Events', value: criticalLogs.length, color: '#ef4444' },
            { label: 'Errors', value: errorLogs.length, color: '#f87171' },
            { label: 'Log Types Detected', value: new Set(sentinelLogs.map(l => l.logType)).size, color: '#3b82f6' },
          ].map((s, i) => (
            <div key={s.label} className="card"
              style={{ padding: '16px 20px', borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart + Live Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Threat & Anomaly Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Last 24 hours</div>
          <div style={{ height: 200 }}><ThreatTrendChart data={trendData} /></div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Events</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
              LIVE
            </span>
          </div>
          <LiveFeed maxHeight={220} />
        </div>
      </div>

      {/* ── Recent Threats + Donut + Correlations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Threats</span>
            <button onClick={() => setActiveModule('kavach')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {unresolved.length === 0
            ? <div style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>✓ All clear</div>
            : unresolved.slice(0, 4).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-dim)', alignItems: 'flex-start' }}>
                <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, background: SEV_COLOR[e.severity] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.zone} · {e.timestamp}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: SEV_COLOR[e.severity] + '15', color: SEV_COLOR[e.severity], border: `1px solid ${SEV_COLOR[e.severity]}30`, fontWeight: 700, flexShrink: 0 }}>
                  {e.severity}
                </span>
              </div>
            ))
          }
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>By Severity</div>
          <div style={{ height: 160 }}><SeverityDonut events={unresolved} /></div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Attack Correlations</span>
            <button onClick={() => setActiveModule('bridge')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {correlations.slice(0, 3).map(c => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c.confirmed ? 'var(--critical-bg)' : 'var(--high-bg)', color: c.confirmed ? 'var(--critical)' : 'var(--high)', border: `1px solid ${c.confirmed ? 'var(--critical-border)' : 'var(--high-border)'}`, fontWeight: 700 }}>
                  {c.confirmed ? '✓ Confirmed' : '⟳ Investigating'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{c.confidence}%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.story.slice(0, 90)}…</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SENTINEL Log Feed + Log Type Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent SENTINEL log feed */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              SENTINEL Log Feed
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {streaming && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 1.4s infinite' }} />
                  LIVE
                </span>
              )}
              <button
                onClick={() => setActiveModule('analytics')}
                style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Full log stream →
              </button>
            </div>
          </div>

          {logLoading ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
              Loading SENTINEL logs…
            </div>
          ) : sentinelLogs.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '12px 0', fontFamily: 'var(--font-mono)' }}>
              No logs loaded. Run <code>python log_generator.py</code> and serve <code>logs/</code> from <code>public/logs/</code>.
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {recentLogs.map((log, i) => (
                <MiniLogRow key={`${log.id}-${i}`} log={log} />
              ))}
            </div>
          )}
        </div>

        {/* Log type breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Log Type Breakdown
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {sentinelLogs.length.toLocaleString()} total
            </span>
          </div>

          {logLoading ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
              Loading…
            </div>
          ) : sentinelLogs.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>No data</div>
          ) : (
            <>
              <LogTypeTable logs={sentinelLogs} />
              <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'DRISHTI', color: '#3b82f6' },
                  { label: 'KAVACH', color: '#f59e0b' },
                  { label: 'BRIDGE', color: '#a78bfa' },
                  { label: 'ALERT', color: '#ef4444' },
                  { label: 'SYSTEM', color: '#6b7280' },
                ].map(({ label, color }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}