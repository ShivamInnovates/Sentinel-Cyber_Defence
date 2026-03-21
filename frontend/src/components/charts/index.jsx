import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const TT = {
  backgroundColor: '#0f2450', borderColor: '#1e3a6e', borderWidth: 1,
  titleColor: '#F0F4FF', bodyColor: '#A8BEDD', padding: 10, cornerRadius: 8,
  titleFont: { family: 'Montserrat', size: 11, weight: '600' },
  bodyFont: { family: 'Poppins', size: 12 },
};
const TICK = { color: '#2e4d7a', font: { family: 'Montserrat', size: 10, weight: '500' } };
const GRID = { color: 'rgba(30,58,110,0.4)', drawBorder: false };

export function ThreatTrendChart({ data }) {
  if (!data) return null;
  return (
    <Line
      data={{
        labels: data.labels,
        datasets: [
          { label: 'Threats Detected', data: data.threats, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.07)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#EF4444', pointBorderColor: '#0B1E40', pointBorderWidth: 2 },
          { label: 'Login Anomalies',  data: data.anomalies, borderColor: '#6384BE', backgroundColor: 'rgba(99,132,190,0.06)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#6384BE', pointBorderColor: '#0B1E40', pointBorderWidth: 2 },
        ],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: TT,
          legend: { display: true, position: 'top', align: 'end', labels: { color: '#A8BEDD', font: { family: 'Poppins', size: 11 }, boxWidth: 8, boxHeight: 8, borderRadius: 4, useBorderRadius: true, padding: 14 } },
        },
        scales: { x: { grid: GRID, ticks: TICK }, y: { grid: GRID, ticks: TICK } },
      }}
    />
  );
}

export function ZoneActivityChart({ data }) {
  if (!data) return null;
  const COLORS = { CRITICAL: '#EF4444', HIGH: '#F59E0B', MEDIUM: '#6384BE', LOW: '#E8B1C1' };
  return (
    <Bar
      data={{
        labels: data.map(d => d.zone),
        datasets: [{ label: 'Events', data: data.map(d => d.events), backgroundColor: data.map(d => COLORS[d.severity]+'99'), borderColor: data.map(d => COLORS[d.severity]), borderWidth: 1.5, borderRadius: 6, borderSkipped: false }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: TT, legend: { display: false } },
        scales: { x: { grid: GRID, ticks: { ...TICK, maxRotation: 30 } }, y: { grid: GRID, ticks: TICK, beginAtZero: true } },
      }}
    />
  );
}

export function SeverityDonut({ events }) {
  const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  events?.filter(e => !e.resolved).forEach(e => { if (c[e.severity]!==undefined) c[e.severity]++; });
  const total = Object.values(c).reduce((a,b)=>a+b,0);
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Doughnut
        data={{
          labels: ['Critical','High','Medium','Low'],
          datasets: [{ data: [c.CRITICAL,c.HIGH,c.MEDIUM,c.LOW], backgroundColor: ['#EF4444','#F59E0B','#6384BE','#E8B1C1'], borderColor: '#0B1E40', borderWidth: 3, hoverOffset: 4 }],
        }}
        options={{
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { position: 'right', labels: { color: '#A8BEDD', font: { family: 'Poppins', size: 11 }, boxWidth: 8, boxHeight: 8, borderRadius: 4, useBorderRadius: true, padding: 10 } },
            tooltip: TT,
          },
        }}
      />
      <div style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{total}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.1em' }}>ACTIVE</div>
      </div>
    </div>
  );
}
