# SENTINEL MCD — Frontend

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Open in browser: http://localhost:5173
```

## Step-by-Step Guide

### Step 1 — Install
```bash
npm install
```

### Step 2 — Run
```bash
npm run dev
```

### Step 3 — Navigate
- **Overview** → Full dashboard with KPIs, radar, charts
- **DRISHTI** → Phishing domain table with takedown actions
- **KAVACH** → Security events + zone radar + rules engine
- **The Bridge** → Attack correlation cards with plain-English stories
- **Attack Sim** → Click "Run Simulation" to watch an attack unfold

## Connecting to Real Backend

1. Open `src/services/mockApi.js`
2. All mock data functions are here — replace them with `axios` calls to your FastAPI
3. Open `src/store/index.js` — all state mutations are defined here
4. Example API call pattern:
```js
// In store/index.js, replace:
domains: getMockDomains(),
// With a fetch in a useEffect in each page component:
const res = await axios.get('http://localhost:8000/api/drishti/domains');
```

## Libraries Used

| Library | Purpose |
|---------|---------|
| Chart.js + react-chartjs-2 | Trend charts, bar charts, donut |
| AOS | Scroll animations on page load |
| Popper.js + react-popper | Tooltips explaining technical terms |
| Luxon | Timezone-correct IST timestamps |
| SweetAlert2 | Confirmation dialogs for destructive actions |
| Zustand | Global state management |
| Lucide React | Icons |

## Folder Structure

```
src/
├── styles/          CSS variables + globals
├── utils/           constants.js (severity config, zones, tooltips)
├── services/        mockApi.js (all mock data — swap for real API)
├── store/           Zustand global store
├── components/
│   ├── ui/          Reusable atoms (Badge, Button, KPICard, etc.)
│   ├── charts/      Chart.js wrappers
│   ├── layout/      Sidebar, Topbar
│   └── shared/      RadarMap, LiveFeed
└── modules/
    ├── overview/    Dashboard homepage
    ├── drishti/     Phishing detection
    ├── kavach/      Internal defense
    ├── bridge/      Correlation engine
    └── simulation/  Attack playback
```
