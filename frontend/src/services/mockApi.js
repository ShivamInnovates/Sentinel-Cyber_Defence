import { DateTime } from 'luxon';

const now = () => DateTime.now().setZone('Asia/Kolkata');
const fmt = (dt) => dt.toFormat('HH:mm:ss');
const fmtDate = (dt) => dt.toFormat('dd MMM yyyy');

// ── MOCK DOMAINS (DRISHTI) ──
export const getMockDomains = () => [
  { id: 'D001', domain: 'mcd-services-delhi.com',   similarity: 94, type: 'Aadhaar Form Clone',   age: '2 min ago',  severity: 'CRITICAL', status: 'LIVE',     ip: '185.220.101.47', country: 'RU' },
  { id: 'D002', domain: 'mcdonline-payment.in',      similarity: 87, type: 'Payment Portal Clone', age: '14 min ago', severity: 'HIGH',     status: 'LIVE',     ip: '103.42.58.22',   country: 'CN' },
  { id: 'D003', domain: 'delhi-mcd-portal.net',      similarity: 81, type: 'Login Page Clone',     age: '1h ago',     severity: 'HIGH',     status: 'TAKEDOWN', ip: '91.108.4.33',    country: 'NL' },
  { id: 'D004', domain: 'mcd-tax-pay.org',           similarity: 76, type: 'Tax Portal Clone',     age: '3h ago',     severity: 'MEDIUM',   status: 'WATCH',    ip: '172.66.40.2',    country: 'US' },
  { id: 'D005', domain: 'mcdelhi-official.co.in',    similarity: 68, type: 'General Portal Clone', age: '6h ago',     severity: 'LOW',      status: 'WATCH',    ip: '104.21.14.88',   country: 'US' },
];

// ── MOCK EVENTS (KAVACH) ──
export const getMockEvents = () => [
  { id: 'KV001', label: 'Failed Login Spike',         zone: 'Central',    severity: 'CRITICAL', timestamp: fmt(now().minus({ minutes: 78 })),  resolved: false, count: 47, detail: '47 failed logins in 90 seconds. Normal is fewer than 5.' },
  { id: 'KV002', label: 'Foreign IP Connection',      zone: 'North-East', severity: 'HIGH',     timestamp: fmt(now().minus({ minutes: 49 })),  resolved: false, count: 1,  detail: 'A computer in Russia tried to access MCD internal systems.' },
  { id: 'KV003', label: 'Off-Hours Privileged Access',zone: 'East',       severity: 'HIGH',     timestamp: fmt(now().minus({ minutes: 25 })),  resolved: false, count: 3,  detail: 'An admin account logged in at 3:15 AM — outside working hours.' },
  { id: 'KV004', label: 'Port Scan Detected',         zone: 'North',      severity: 'MEDIUM',   timestamp: fmt(now().minus({ minutes: 18 })),  resolved: false, count: 134, detail: '134 network ports scanned in 45 seconds. This is how attackers map a network.' },
  { id: 'KV005', label: 'Large Data Transfer',        zone: 'South',      severity: 'MEDIUM',   timestamp: fmt(now().minus({ minutes: 7 })),   resolved: false, count: 1,  detail: '780MB transferred out in a single session. Normal transfers are under 50MB.' },
  { id: 'KV006', label: 'Failed Login Spike',         zone: 'Shahdara',   severity: 'CRITICAL', timestamp: fmt(now().minus({ minutes: 2 })),   resolved: false, count: 31, detail: '31 failed logins in 60 seconds — second occurrence today.' },
];

// ── MOCK CORRELATIONS (BRIDGE) ──
export const getMockCorrelations = () => [
  {
    id: 'BR001',
    externalThreat: 'mcd-services-delhi.com',
    internalEvent: 'Failed Login Spike — Central Zone',
    confidence: 97,
    type: 'Phishing → Credential Stuffing',
    timestamp: fmt(now().minus({ minutes: 76 })),
    confirmed: true,
    story: 'A fake MCD website (mcd-services-delhi.com) stole login credentials. Those stolen credentials were then used to try logging into the real MCD system, causing the spike in failed logins.',
  },
  {
    id: 'BR002',
    externalThreat: 'mcdonline-payment.in',
    internalEvent: 'Off-Hours Privileged Access — East Zone',
    confidence: 84,
    type: 'Phishing → Intrusion Attempt',
    timestamp: fmt(now().minus({ minutes: 23 })),
    confirmed: false,
    story: 'A fake payment site may have captured admin credentials. An off-hours admin login in East Zone shortly after is likely connected.',
  },
  {
    id: 'BR003',
    externalThreat: 'delhi-mcd-portal.net',
    internalEvent: 'Foreign IP Connection — North-East Zone',
    confidence: 72,
    type: 'Credential Stuffing',
    timestamp: fmt(now().minus({ hours: 2, minutes: 4 })),
    confirmed: true,
    story: 'A site impersonating MCD portal (now taken down) collected credentials. A foreign IP later used those credentials to probe the real system.',
  },
];

// ── MOCK KPIs ──
export const getMockKPIs = () => ({
  activeThreats:    6,
  criticalCount:    2,
  livePhishingSites: 2,
  loginAnomalies:   247,
  bridgeCorrelations: 2,
  domainsMonitored: 18447,
  computersCovered: 2400,
  avgDetectionMins: 3.8,
  zonesProtected:   12,
  takedownsSent:    2,
});

// ── MOCK CANARY CREDS ──
export const getMockCanaries = () => [
  { id: 'CN001', credential: 'suresh.kumar.2287', site: 'mcd-services-delhi.com',  injectedAt: '08:44:12', status: 'STOLEN',     usedAt: '08:51:33', usedIP: '185.220.101.47' },
  { id: 'CN002', credential: 'rajesh.sharma.4419', site: 'delhi-mcd-portal.net',   injectedAt: '06:31:05', status: 'STOLEN',     usedAt: '06:39:12', usedIP: '91.108.4.33' },
  { id: 'CN003', credential: 'priya.mehra.9901',   site: 'mcd-tax-pay.org',        injectedAt: '15:12:30', status: 'MONITORING', usedAt: null,       usedIP: null },
];

// ── MOCK TREND DATA (for charts) ──
export const getMockTrendData = () => {
  const labels = [];
  const threats = [];
  const anomalies = [];
  for (let i = 23; i >= 0; i--) {
    labels.push(now().minus({ hours: i }).toFormat('HH:00'));
    threats.push(Math.floor(Math.random() * 8) + 1);
    anomalies.push(Math.floor(Math.random() * 40) + 5);
  }
  return { labels, threats, anomalies };
};

// ── MOCK ZONE ACTIVITY ──
export const getMockZoneActivity = () => [
  { zone: 'Central',    events: 12, severity: 'CRITICAL' },
  { zone: 'North-East', events: 8,  severity: 'HIGH' },
  { zone: 'East',       events: 7,  severity: 'HIGH' },
  { zone: 'Shahdara',   events: 6,  severity: 'CRITICAL' },
  { zone: 'North',      events: 5,  severity: 'MEDIUM' },
  { zone: 'South',      events: 4,  severity: 'MEDIUM' },
];

// ── LIVE FEED MESSAGES ──
export const FEED_POOL = [
  { actor: 'DRISHTI', msg: 'CertStream monitoring active — 18,447 domains tracked in real-time', severity: 'INFO' },
  { actor: 'KAVACH',  msg: 'Login anomaly detected — South Zone (Z-score: 2.8 — unusual but watch-level)', severity: 'MEDIUM' },
  { actor: 'DRISHTI', msg: 'New SSL certificate: mcd-delhi-online.net — similarity analysis started', severity: 'MEDIUM' },
  { actor: 'KAVACH',  msg: 'Port scan blocked — North-West Zone — 134 ports probed in 45 seconds', severity: 'HIGH' },
  { actor: 'BRIDGE',  msg: 'Correlation engine matched 3 events in a 4-hour window — investigating', severity: 'HIGH' },
  { actor: 'KAVACH',  msg: 'Off-hours privileged access flagged — Civil Lines Zone — 3:15 AM login', severity: 'HIGH' },
  { actor: 'DRISHTI', msg: 'Takedown confirmed: delhi-mcd-portal.net is now offline', severity: 'INFO' },
  { actor: 'SYSTEM',  msg: 'Daily digest sent to 40 IT staff members — 6 new threats this session', severity: 'INFO' },
];

// ── SIM STEPS ──
export const SIM_STEPS = [
  { ms: 0,     actor: 'DRISHTI', msg: 'CertStream alert: new SSL certificate issued for mcd-verify-aadhaar.xyz', severity: 'MEDIUM', plain: 'A new fake website certificate was created — we caught it instantly.' },
  { ms: 1800,  actor: 'DRISHTI', msg: 'Domain similarity: 91% match to mcd.delhi.gov.in — TYPOSQUATTING CONFIRMED', severity: 'HIGH',   plain: 'The fake site name is 91% identical to the real MCD website.' },
  { ms: 3400,  actor: 'DRISHTI', msg: 'Visual analysis: Aadhaar form detected on clone portal (perceptual hash match)', severity: 'CRITICAL', plain: 'The fake site has a copy of the Aadhaar form to steal citizens\' ID data.' },
  { ms: 5000,  actor: 'DRISHTI', msg: 'Canary credential "priya.sharma.7731" injected into fake portal', severity: 'INFO', plain: 'We placed a fake login credential as bait to track if the site steals data.' },
  { ms: 7200,  actor: 'KAVACH',  msg: 'Login anomaly — Central Zone: 47 failed attempts in 90 seconds (Z-score: 4.1)', severity: 'HIGH',   plain: 'Stolen credentials are being tried on the real MCD portal — 47 times in 90 seconds.' },
  { ms: 9000,  actor: 'KAVACH',  msg: 'Foreign IP 185.220.101.x attempting privileged access — connection blocked', severity: 'CRITICAL', plain: 'A computer from Russia tried to break into MCD systems using stolen passwords. Blocked.' },
  { ms: 10800, actor: 'BRIDGE',  msg: 'Correlation: portal type MATCH + timing MATCH (Δt = 2h 14min) — linking events', severity: 'HIGH',   plain: 'The fake site and the real system attack are connected — same attack, two stages.' },
  { ms: 12500, actor: 'BRIDGE',  msg: '⚡ UNIFIED ATTACK NARRATIVE CONFIRMED — Confidence: 96% — Phishing → Credential Stuffing', severity: 'CRITICAL', plain: 'CONFIRMED: One coordinated attack. Fake site stole passwords, then used them on real MCD.' },
  { ms: 14000, actor: 'CANARY',  msg: 'Canary credential "priya.sharma.7731" used on real MCD portal — CREDENTIAL THEFT PROVEN', severity: 'CRITICAL', plain: 'Our bait credential was used — this is legal proof the site stole data from real citizens.' },
  { ms: 15500, actor: 'SYSTEM',  msg: 'CERT-IN takedown request auto-generated. Alert sent to 40 IT staff members.', severity: 'INFO', plain: 'Automatic removal request sent to India\'s cyber authority. IT team notified.' },
];
