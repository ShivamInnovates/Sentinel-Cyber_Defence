import { useState } from 'react';
import { useStore } from '../../store';

const SOURCE_STYLE = {
  DRISHTI: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'DRISHTI', sub: 'External Threat' },
  KAVACH:  { color: '#6384BE', bg: 'rgba(99,132,190,0.1)', border: 'rgba(99,132,190,0.3)', label: 'KAVACH',  sub: 'Internal Event' },
  BRIDGE:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', label: 'BRIDGE', sub: 'Correlation' },
};

function SourceBadge({ source }) {
  const s = SOURCE_STYLE[source];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.06em', fontFamily: 'var(--font-mono)',
    }}>
      {s.label}
    </span>
  );
}

function ChainNode({ source, title, detail, isFirst, isLast }) {
  const s = SOURCE_STYLE[source];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: s.color, border: `2px solid ${s.bg}`,
          boxShadow: `0 0 8px ${s.color}60`,
          marginTop: 3,
        }} />
        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 28, background: 'var(--border-dim)', marginTop: 4 }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <SourceBadge source={source} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{SOURCE_STYLE[source].sub}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
        {detail && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{detail}</div>}
      </div>
    </div>
  );
}

function AttackCard({ c, expanded, onToggle }) {
  const steps = [
    {
      source: 'DRISHTI',
      title: c.externalThreat,
      detail: `Fake site detected — ${c.type.split('→')[0].trim()}`,
    },
    {
      source: 'BRIDGE',
      title: `Correlation matched — ${c.confidence}% confidence`,
      detail: `Attack type: ${c.type}`,
    },
    {
      source: 'KAVACH',
      title: c.internalEvent,
      detail: `Internal breach signal — ${c.type.split('→')[1]?.trim() ?? 'Intrusion attempt'}`,
    },
  ];

  return (
    <div
      className="card"
      style={{
        overflow: 'hidden',
        borderLeft: `3px solid ${c.confirmed ? 'var(--critical)' : 'var(--high)'}`,
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, padding: '2px 9px', borderRadius: 20, fontWeight: 700,
            background: c.confirmed ? 'var(--critical-bg)' : 'var(--high-bg)',
            color: c.confirmed ? 'var(--critical)' : 'var(--high)',
            border: `1px solid ${c.confirmed ? 'var(--critical-border)' : 'var(--high-border)'}`,
          }}>
            {c.confirmed ? '✓ Confirmed' : '⟳ Investigating'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.type}</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{c.id}</span>

          {/* Source pills */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
            <SourceBadge source="DRISHTI" />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>→</span>
            <SourceBadge source="KAVACH" />
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 1 }}>Confidence</div>
          <div style={{
            fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em',
            color: c.confidence > 90 ? 'var(--critical)' : 'var(--high)',
          }}>{c.confidence}%</div>
        </div>

        <span style={{
          color: 'var(--text-dim)', fontSize: 12, flexShrink: 0,
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s',
        }}>▶</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-dim)' }}>
          {/* Attack flow */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'center', margin: '16px 0' }}>
            {/* Drishti node */}
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: SOURCE_STYLE.DRISHTI.bg,
              border: `1px solid ${SOURCE_STYLE.DRISHTI.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <SourceBadge source="DRISHTI" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>Fake site detected</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: SOURCE_STYLE.DRISHTI.color, fontWeight: 600, wordBreak: 'break-all' }}>
                {c.externalThreat}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: 'var(--border-mid)' }}>→</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>BRIDGE</div>
            </div>

            {/* Kavach node */}
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: SOURCE_STYLE.KAVACH.bg,
              border: `1px solid ${SOURCE_STYLE.KAVACH.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <SourceBadge source="KAVACH" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>Internal breach signal</div>
              <div style={{ fontSize: 12, color: SOURCE_STYLE.KAVACH.color, fontWeight: 600 }}>
                {c.internalEvent}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{
            padding: '14px 16px', borderRadius: 8,
            background: 'var(--bg-raised)', marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              Attack Timeline
            </div>
            {steps.map((step, i) => (
              <ChainNode
                key={i}
                source={step.source}
                title={step.title}
                detail={step.detail}
                isFirst={i === 0}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>

          {/* Narrative */}
          <div style={{
            padding: '12px 14px', borderRadius: 8,
            background: 'var(--bg-raised)',
            borderLeft: '2px solid var(--border-light)',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              What happened
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.story}</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              fontSize: 11, padding: '5px 14px', borderRadius: 6,
              border: '1px solid var(--border-dim)', background: 'var(--bg-raised)',
              color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
            }}>
              Generate Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttackChains() {
  const { correlations } = useStore();
  const [expandedId, setExpandedId] = useState(correlations[0]?.id ?? null);

  const confirmed   = correlations.filter(c => c.confirmed);
  const unconfirmed = correlations.filter(c => !c.confirmed);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Attack Chains</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connections between external threats (Drishti) and internal breaches (Kavach), correlated by Bridge.</p>
      </div>

      {/* Source legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(SOURCE_STYLE).map(([key, s]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: 12,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.label}</span>
            <span style={{ color: 'var(--text-dim)' }}>—</span>
            <span style={{ color: 'var(--text-muted)' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Chains',    value: correlations.length, color: 'var(--accent)' },
          { label: 'Confirmed',       value: confirmed.length,    color: 'var(--critical)' },
          { label: 'Investigating',   value: unconfirmed.length,  color: 'var(--high)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chain cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {correlations.map(c => (
          <AttackCard
            key={c.id}
            c={c}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(prev => prev === c.id ? null : c.id)}
          />
        ))}
      </div>
    </div>
  );
}
