import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,BarElement,ArcElement,Tooltip,Legend,Filler);

const TT = { backgroundColor:'#1a1a1a', borderColor:'#333', borderWidth:1, titleColor:'#ededed', bodyColor:'#a1a1a1', padding:10, cornerRadius:8, titleFont:{family:'Inter',size:11,weight:'600'}, bodyFont:{family:'Inter',size:12} };
const TICK = { color:'#6b7280', font:{family:'Inter',size:10,weight:'500'} };
const GRID = { color:'rgba(255,255,255,0.05)', drawBorder:false };

export function ThreatTrendChart({ data }) {
  if (!data) return null;
  return (
    <Line data={{ labels:data.labels, datasets:[
      { label:'Threats Detected', data:data.threats, borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,0.06)', fill:true, tension:0.4, borderWidth:2, pointRadius:3, pointBackgroundColor:'#DC2626', pointBorderColor:'#fff', pointBorderWidth:2 },
      { label:'Login Anomalies',  data:data.anomalies, borderColor:'#6384BE', backgroundColor:'rgba(99,132,190,0.05)', fill:true, tension:0.4, borderWidth:2, pointRadius:2, pointBackgroundColor:'#6384BE', pointBorderColor:'#fff', pointBorderWidth:2 },
    ]}}
    options={{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      plugins:{ tooltip:TT, legend:{ display:true, position:'top', align:'end', labels:{ color:'#6B7280', font:{family:'Inter',size:11}, boxWidth:8, boxHeight:8, borderRadius:4, useBorderRadius:true, padding:14 } } },
      scales:{ x:{ grid:GRID, ticks:TICK, border:{display:false} }, y:{ grid:GRID, ticks:TICK, border:{display:false}, beginAtZero:true } },
    }}/>
  );
}

export function ZoneActivityChart({ data }) {
  if (!data) return null;
  const C = { CRITICAL:'#DC2626', HIGH:'#D97706', MEDIUM:'#6384BE', LOW:'#9CA3AF' };
  return (
    <Bar data={{ labels:data.map(d=>d.zone), datasets:[{ label:'Events', data:data.map(d=>d.events), backgroundColor:data.map(d=>C[d.severity]+'88'), borderColor:data.map(d=>C[d.severity]), borderWidth:1.5, borderRadius:6, borderSkipped:false }] }}
    options={{ responsive:true, maintainAspectRatio:false,
      plugins:{ tooltip:TT, legend:{display:false} },
      scales:{ x:{ grid:GRID, ticks:{...TICK,maxRotation:30}, border:{display:false} }, y:{ grid:GRID, ticks:TICK, border:{display:false}, beginAtZero:true } },
    }}/>
  );
}

export function SeverityDonut({ events }) {
  const c = {CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};
  events?.filter(e=>!e.resolved).forEach(e=>{ if(c[e.severity]!==undefined) c[e.severity]++; });
  const total = Object.values(c).reduce((a,b)=>a+b,0);
  return (
    <div style={{ position:'relative', height:'100%' }}>
      <Doughnut data={{ labels:['Critical','High','Medium','Low'], datasets:[{ data:[c.CRITICAL,c.HIGH,c.MEDIUM,c.LOW], backgroundColor:['#DC2626','#D97706','#6384BE','#9CA3AF'], borderColor:'transparent', borderWidth:0, hoverOffset:3 }] }}
      options={{ responsive:true, maintainAspectRatio:false, cutout:'68%',
        plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{family:'Inter',size:11}, boxWidth:8, boxHeight:8, borderRadius:4, useBorderRadius:true, padding:10 } }, tooltip:TT },
      }}/>
      <div style={{ position:'absolute', top:'50%', left:'30%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
      </div>
    </div>
  );
}
