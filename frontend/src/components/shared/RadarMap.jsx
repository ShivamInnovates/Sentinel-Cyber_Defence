import { useState, useEffect } from 'react';
import { ZONES } from '../../utils/constants';

export default function RadarMap({ events = [] }) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAngle(a => (a + 1.5) % 360), 25);
    return () => clearInterval(id);
  }, []);

  const zoneCounts = {};
  ZONES.forEach(z => (zoneCounts[z.id] = 0));
  events.filter(e => !e.resolved).forEach(e => {
    const z = ZONES.find(z => z.name === e.zone);
    if (z) zoneCounts[z.id]++;
  });

  const rad = (angle * Math.PI) / 180;
  const S = 220, C = S / 2, R = 88;

  return (
    <div style={{ width: '100%', aspectRatio: '1/1' }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', height: '100%' }}>
        {[0.3,0.5,0.7,1].map(r => (
          <circle key={r} cx={C} cy={C} r={R*r} fill="none" stroke="rgba(99,132,190,0.12)" strokeWidth={0.8}/>
        ))}
        <line x1={C} y1={C-R} x2={C} y2={C+R} stroke="rgba(99,132,190,0.1)" strokeWidth={0.8}/>
        <line x1={C-R} y1={C} x2={C+R} y2={C} stroke="rgba(99,132,190,0.1)" strokeWidth={0.8}/>

        {/* Sweep trail */}
        {[-40,-30,-20,-10].map((off,i) => {
          const r2 = ((angle+off)*Math.PI)/180;
          return <line key={off} x1={C} y1={C} x2={C+R*Math.cos(r2)} y2={C+R*Math.sin(r2)} stroke="#6384BE" strokeWidth={0.6} opacity={(i+1)*0.07}/>;
        })}

        {/* Sweep arm */}
        <line x1={C} y1={C} x2={C+R*Math.cos(rad)} y2={C+R*Math.sin(rad)} stroke="#6384BE" strokeWidth={1.2} opacity={0.8}/>

        {/* Zones */}
        {ZONES.map(z => {
          const cx = (z.x/100)*(S-40)+20;
          const cy = (z.y/100)*(S-40)+20;
          const count = zoneCounts[z.id]||0;
          const color = count===0?'#2e4d7a':count===1?'#6384BE':count===2?'#F59E0B':'#EF4444';
          return (
            <g key={z.id}>
              {count>0 && <circle cx={cx} cy={cy} r={count*4+8} fill={color} opacity={0.1}/>}
              <circle cx={cx} cy={cy} r={4} fill={color} opacity={0.9}/>
              <text x={cx} y={cy-7} textAnchor="middle" fontSize="5.5" fill={color} fontFamily="Montserrat,sans-serif" fontWeight="600">{z.id}</text>
              {count>0 && <text x={cx+6} y={cy+2} fontSize="6" fill={color} fontFamily="Montserrat,sans-serif" fontWeight="700">{count}</text>}
            </g>
          );
        })}
        <circle cx={C} cy={C} r={3} fill="#6384BE"/>
        <text x={C+5} y={C-4} fontSize="5" fill="#6384BE" fontFamily="Montserrat,sans-serif" fontWeight="600">HQ</text>
      </svg>
    </div>
  );
}
