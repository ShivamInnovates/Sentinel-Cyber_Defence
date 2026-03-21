export const SEVERITY = {
  CRITICAL: {
    label: 'Critical', color: 'var(--critical)', bg: 'var(--critical-bg)',
    border: 'var(--critical-border)', icon: '⚠', plainText: 'Immediate action required',
  },
  HIGH: {
    label: 'High', color: 'var(--high)', bg: 'var(--high-bg)',
    border: 'var(--high-border)', icon: '▲', plainText: 'Investigate soon',
  },
  MEDIUM: {
    label: 'Medium', color: 'var(--medium)', bg: 'var(--medium-bg)',
    border: 'var(--medium-border)', icon: '●', plainText: 'Monitor closely',
  },
  LOW: {
    label: 'Low', color: 'var(--low)', bg: 'var(--low-bg)',
    border: 'var(--low-border)', icon: '◎', plainText: 'Low priority',
  },
  INFO: {
    label: 'Info', color: 'var(--info)', bg: 'var(--info-bg)',
    border: 'rgba(232,177,193,0.25)', icon: '◆', plainText: 'For your information',
  },
};

export const MODULES = {
  drishti: { id: 'drishti', name: 'DRISHTI', subtitle: 'External Threat Detection', icon: '◈', color: 'var(--accent-primary)' },
  kavach:  { id: 'kavach',  name: 'KAVACH',  subtitle: 'Internal Network Defense',  icon: '◉', color: 'var(--success)' },
  bridge:  { id: 'bridge',  name: 'THE BRIDGE', subtitle: 'Attack Correlation Engine', icon: '⬢', color: 'var(--accent-secondary)' },
};

export const ZONES = [
  { id: 'CEN', name: 'Central',     x: 50, y: 50 },
  { id: 'NOR', name: 'North',       x: 50, y: 15 },
  { id: 'SOU', name: 'South',       x: 50, y: 85 },
  { id: 'EAS', name: 'East',        x: 80, y: 50 },
  { id: 'WES', name: 'West',        x: 20, y: 50 },
  { id: 'NEZ', name: 'North-East',  x: 75, y: 22 },
  { id: 'NWZ', name: 'North-West',  x: 25, y: 22 },
  { id: 'SEZ', name: 'South-East',  x: 75, y: 78 },
  { id: 'SWZ', name: 'South-West',  x: 25, y: 78 },
  { id: 'SHA', name: 'Shahdara',    x: 88, y: 36 },
  { id: 'CIV', name: 'Civil Lines', x: 60, y: 10 },
  { id: 'CSP', name: 'City SP',     x: 40, y: 90 },
];

export const TOOLTIPS = {
  zscore:          'Z-score measures how unusual an event is. A score above 3 means activity is extremely abnormal compared to typical patterns.',
  levenshtein:     'A mathematical way to measure how similar two website names are. 94% means the fake site name looks almost identical to the real one.',
  similarity:      'How closely a fake website resembles the real MCD website. Higher % = more dangerous.',
  certstream:      'A live feed of all new website security certificates created worldwide — we use this to catch fake MCD sites the moment they are created.',
  canary:          'Fake login details we intentionally put into phishing sites. If anyone uses them on the real MCD portal, it proves the site stole credentials.',
  bridgeConfidence:'How certain the system is that an external fake site and an internal breach are part of the same coordinated attack.',
};
