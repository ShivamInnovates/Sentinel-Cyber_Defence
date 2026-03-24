import { useState } from 'react';

const SECTIONS = [
  {
    title: 'How DRISHTI Works',
    color: '#3ecf8e',
    body: 'DRISHTI monitors CertStream — a live feed of every new SSL certificate issued globally. When a new domain appears that looks like mcd.delhi.gov.in (80%+ similarity), it is immediately flagged, screenshotted, and scored. Takedown requests are auto-generated and sent to CERT-In.',
  },
  {
    title: 'How KAVACH Works',
    color: '#6384BE',
    body: 'KAVACH watches login activity across 2,400 MCD computers in 12 Delhi zones. It uses Z-score analysis — if failed logins spike far above the normal baseline, an alert fires instantly. Foreign IPs, off-hours admin access, and large data transfers are also flagged.',
  },
  {
    title: 'How Bridge Correlation Works',
    color: '#a78bfa',
    body: 'The Bridge compares every external fake site with every internal event. It looks at timing, credential type, and IP overlap. When a match is found, it calculates a confidence score and generates a plain-English attack narrative. Canary credentials provide forensic proof.',
  },
  {
    title: 'What are Canary Credentials?',
    color: '#f59e0b',
    body: 'Canary credentials are fake usernames and passwords we plant inside phishing sites. If those credentials are ever used on the real MCD portal, it proves the phishing site stole real citizen data — and creates legal evidence for prosecution.',
  },
];

export default function SupportPage() {
  const [feedback, setFeedback] = useState({ type: 'feedback', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!feedback.message.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setFeedback(f => ({ ...f, message: '' }));
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Support</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>How the system works, plus feedback and bug reporting.</p>
      </div>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 40 }}>
        {SECTIONS.map(s => (
          <div key={s.title} className="card" style={{ padding: 20 }}>
            <div style={{ width: 3, height: 20, background: s.color, borderRadius: 2, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>

      {/* Feedback form */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Send Feedback</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Report a bug or share a suggestion.</div>

        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['feedback', 'bug'].map(t => (
              <button key={t} type="button" onClick={() => setFeedback(f => ({ ...f, type: t }))}
                style={{
                  padding: '6px 16px', borderRadius: 6, border: '1px solid',
                  borderColor: feedback.type === t ? 'var(--accent)' : 'var(--border-dim)',
                  background: feedback.type === t ? 'var(--accent-light)' : 'transparent',
                  color: feedback.type === t ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                  textTransform: 'capitalize',
                }}>
                {t === 'bug' ? '🐛 Bug Report' : '💬 Feedback'}
              </button>
            ))}
          </div>

          <textarea
            value={feedback.message}
            onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))}
            placeholder={feedback.type === 'bug' ? 'Describe the bug — what happened and what you expected...' : 'Share your thoughts or suggestions...'}
            rows={5}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
              resize: 'vertical', outline: 'none', transition: 'border-color 0.15s',
              marginBottom: 14,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
          />

          <button type="submit" style={{
            padding: '9px 20px', borderRadius: 8,
            background: sent ? 'var(--success-bg)' : 'var(--accent)',
            border: sent ? '1px solid var(--success-border)' : 'none',
            color: sent ? 'var(--success)' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {sent ? '✓ Sent' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
