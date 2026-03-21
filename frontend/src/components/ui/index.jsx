import { useState, useRef } from 'react';
import { usePopper } from 'react-popper';
import { SEVERITY } from '../../utils/constants';

export function StatusDot({ color, pulse=false, size=8 }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:size, height:size, flexShrink:0 }}>
      {pulse && <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:color, animation:'ping 1.4s ease-out infinite', opacity:0.5 }}/>}
      <span style={{ width:size, height:size, borderRadius:'50%', background:color, display:'block' }}/>
    </span>
  );
}

export function SeverityBadge({ severity, small=false }) {
  const cfg = SEVERITY[severity]||SEVERITY.INFO;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:small?'2px 8px':'4px 10px', borderRadius:6, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, fontSize:small?10:11, fontWeight:700, fontFamily:'var(--font-display)', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
      <span style={{ fontSize:small?8:9 }}>{cfg.icon}</span>
      {cfg.label.toUpperCase()}
    </span>
  );
}

export function Button({ children, variant='primary', size='md', onClick, disabled, fullWidth, icon }) {
  const [hov, setHov] = useState(false);
  const S = {
    primary: { bg:'var(--accent-primary)',   hbg:'#4a6fa5',                  color:'#fff',                    border:'none' },
    danger:  { bg:'transparent',             hbg:'var(--critical-bg)',        color:'var(--critical)',          border:'1px solid var(--critical-border)' },
    ghost:   { bg:'transparent',             hbg:'var(--bg-raised)',          color:'var(--text-secondary)',    border:'1px solid var(--border-dim)' },
    warning: { bg:'transparent',             hbg:'var(--high-bg)',            color:'var(--high)',              border:'1px solid var(--high-border)' },
    success: { bg:'var(--success)',           hbg:'#16a34a',                  color:'#fff',                    border:'none' },
  };
  const s = S[variant]||S.primary;
  const pad = {sm:'5px 12px',md:'8px 16px',lg:'10px 22px'}[size];
  const fs  = {sm:11,md:13,lg:14}[size];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:pad, borderRadius:8, background:hov?s.hbg:s.bg, color:s.color, border:s.border, fontSize:fs, fontWeight:600, fontFamily:'var(--font-display)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, transition:'all 0.15s ease', whiteSpace:'nowrap', width:fullWidth?'100%':'auto', justifyContent:fullWidth?'center':'flex-start', letterSpacing:'0.03em' }}>
      {icon&&<span style={{fontSize:fs-1}}>{icon}</span>}{children}
    </button>
  );
}

export function Tooltip({ children, content, placement='top' }) {
  const [visible, setVisible] = useState(false);
  const refEl = useRef(null), popEl = useRef(null);
  const { styles:ps, attributes } = usePopper(refEl.current, popEl.current, { placement, modifiers:[{name:'offset',options:{offset:[0,8]}}] });
  return (
    <span style={{ position:'relative', display:'inline-flex' }}>
      <span ref={refEl} onMouseEnter={()=>setVisible(true)} onMouseLeave={()=>setVisible(false)} style={{cursor:'help'}}>{children}</span>
      <div ref={popEl} style={{ ...ps.popper, visibility:visible?'visible':'hidden', opacity:visible?1:0, transition:'opacity 0.15s ease', background:'var(--bg-raised)', border:'1px solid var(--border-mid)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--text-secondary)', maxWidth:260, lineHeight:1.5, zIndex:9999, fontFamily:'var(--font-body)', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }} {...attributes.popper}>{content}</div>
    </span>
  );
}

export function HelpIcon({ tooltip }) {
  return (
    <Tooltip content={tooltip}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:'var(--border-dim)', color:'var(--text-muted)', fontSize:9, fontWeight:700, cursor:'help', fontFamily:'var(--font-display)', marginLeft:3 }}>?</span>
    </Tooltip>
  );
}

export function KPICard({ label, value, sub, color, delta, icon, tooltip, aos }) {
  return (
    <div data-aos={aos||'fade-up'} className="card" style={{ padding:'20px 22px', borderTop:`2px solid ${color}`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:70, height:70, background:color, opacity:0.05, borderRadius:'0 0 0 70px' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.12em', fontFamily:'var(--font-display)', fontWeight:600, textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
          {label}{tooltip&&<HelpIcon tooltip={tooltip}/>}
        </span>
        {icon&&<span style={{fontSize:18,opacity:0.35,color}}>{icon}</span>}
      </div>
      <div style={{ fontSize:36, fontWeight:800, color, fontFamily:'var(--font-display)', lineHeight:1, animation:'countUp 0.6s ease both' }}>{value}</div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>{sub}</span>
        {delta!=null&&<span style={{ fontSize:11, color:delta>0?'var(--critical)':'var(--success)', fontWeight:700, fontFamily:'var(--font-display)' }}>{delta>0?'↑':'↓'}{Math.abs(delta)}%</span>}
      </div>
    </div>
  );
}

export function SeverityBar({ value, max=100, severity }) {
  const cfg = SEVERITY[severity]||SEVERITY.LOW;
  const pct = Math.min(100,(value/max)*100);
  return (
    <div style={{ height:4, background:'var(--bg-raised)', borderRadius:4, overflow:'hidden', width:'100%' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:cfg.color, borderRadius:4, transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow:`0 0 8px ${cfg.color}40` }}/>
    </div>
  );
}

export function ModuleHeader({ icon, name, subtitle, color, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:16, borderBottom:'1px solid var(--border-dim)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:20, width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}18`, borderRadius:10, color, border:`1px solid ${color}30` }}>{icon}</span>
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--text-primary)', letterSpacing:'0.06em' }}>{name}</h2>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'var(--font-body)' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>{children}</div>
    </div>
  );
}

export function Panel({ title, accent, children, style={}, action, aos }) {
  return (
    <div data-aos={aos} className="card" style={{ padding:20, ...style }}>
      {title&&(
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--border-dim)' }}>
          <span style={{ fontSize:10, color:accent||'var(--accent-primary)', letterSpacing:'0.18em', fontFamily:'var(--font-display)', textTransform:'uppercase', fontWeight:700 }}>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:12, color:'var(--text-muted)' }}>
      <span style={{ fontSize:40, opacity:0.3 }}>{icon||'◎'}</span>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--text-secondary)', fontFamily:'var(--font-display)' }}>{title}</div>
      {subtitle&&<div style={{ fontSize:12, textAlign:'center', maxWidth:280, fontFamily:'var(--font-body)' }}>{subtitle}</div>}
    </div>
  );
}

export function Spinner({ size=24, color }) {
  return <span style={{ width:size, height:size, borderRadius:'50%', border:`2px solid var(--border-dim)`, borderTopColor:color||'var(--accent-primary)', display:'inline-block', animation:'spin 0.8s linear infinite' }}/>;
}
