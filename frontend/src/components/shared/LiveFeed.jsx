import { useEffect } from 'react';
import { useStore } from '../../store';
import { FEED_POOL } from '../../services/mockApi';

const ACTOR_C = { DRISHTI:'#6384BE', KAVACH:'#16A34A', BRIDGE:'#7C3AED', CANARY:'#D97706', SYSTEM:'#9CA3AF' };
const SEV_C   = { CRITICAL:'#DC2626', HIGH:'#D97706', MEDIUM:'#6384BE', LOW:'#9CA3AF', INFO:'#9CA3AF' };

export default function LiveFeed({ maxHeight=280 }) {
  const { liveFeed, addFeedItem } = useStore();
  useEffect(() => {
    let i = 0; addFeedItem(FEED_POOL[0]);
    const id = setInterval(()=>{ i++; addFeedItem(FEED_POOL[i%FEED_POOL.length]); }, 3800);
    return ()=>clearInterval(id);
  }, []);

  return (
    <div style={{ height:maxHeight, overflowY:'auto' }}>
      {liveFeed.map(item => (
        <div key={item.id} className="fade-in" style={{ padding:'9px 10px', marginBottom:5, borderRadius:8, background:'var(--bg-raised)', borderLeft:`2px solid ${ACTOR_C[item.actor]||'var(--border-mid)'}` }}>
          <div style={{ display:'flex', gap:8, marginBottom:3, alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:ACTOR_C[item.actor], textTransform:'uppercase' }}>{item.actor}</span>
            <span style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{item.ts}</span>
            <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:SEV_C[item.severity], flexShrink:0 }}/>
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{item.msg}</div>
        </div>
      ))}
    </div>
  );
}
