import { useStore, API_BASE, API_KEY } from '../../store';
import { useState, useCallback } from 'react';

function fmt(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-IN', { hour12: false, dateStyle: 'short', timeStyle: 'medium' }); } catch { return iso; }
}

export default function CanaryCredentials() {
  const { canaries, simActive, simLog } = useStore();
  const [downloading, setDownloading] = useState(false);

  const downloadReport = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/sim-report`, {
        headers: { 'X-API-KEY': API_KEY },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `TRINETRA-SimReport-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not download report: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }, []);

  // Backend canary shape: { username, portal_type, site_id, deployed_at, triggered, triggered_at }
  const stolen = canaries.filter(c => c.triggered);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Canary Credentials</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fake login details planted in phishing sites to catch credential theft in action.</p>
        </div>

        {/* Download Report — visible if simulation was run */}
        {!simActive && simLog.length > 0 && (
          <button
            onClick={downloadReport}
            disabled={downloading}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: downloading ? '#3ecf8e18' : 'transparent',
              border: '1px solid #3ecf8e66',
              color: '#3ecf8e',
              fontSize: 12, fontWeight: 700,
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (!downloading) e.currentTarget.style.background = '#3ecf8e18'; }}
            onMouseOut={e => { if (!downloading) e.currentTarget.style.background = 'transparent'; }}
          >
            {downloading ? '⏳ Generating…' : '📥 Download Report'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Canaries Planted',  value: canaries.length, color: 'var(--medium)' },
          { label: 'Confirmed Stolen',  value: stolen.length,   color: 'var(--critical)' },
          { label: 'Cases Opened',      value: stolen.length,   color: 'var(--info)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {canaries.length === 0 ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>
          ✓ No canaries deployed yet. Run the Attack Simulation to plant honeypot credentials.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {canaries.map((c, i) => {
            const isStolen = c.triggered;
            return (
              <div key={i} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${isStolen ? 'var(--critical)' : 'var(--high)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isStolen ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--high)', fontWeight: 600, marginBottom: 3 }}>{c.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Portal: <span style={{ color: 'var(--critical)' }}>{c.portal_type}</span> · Deployed: {fmt(c.deployed_at)}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: isStolen ? 'var(--critical-bg)' : 'var(--high-bg)', color: isStolen ? 'var(--critical)' : 'var(--high)', border: `1px solid ${isStolen ? 'var(--critical-border)' : 'var(--high-border)'}`, fontWeight: 700 }}>
                    {isStolen ? '⚠ Stolen' : '◎ Monitoring'}
                  </span>
                </div>
                {isStolen && (
                  <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--critical-border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Credential used on real MCD portal at <strong style={{ color: 'var(--text-primary)' }}>{fmt(c.triggered_at)}</strong> — forensic proof of credential theft.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

