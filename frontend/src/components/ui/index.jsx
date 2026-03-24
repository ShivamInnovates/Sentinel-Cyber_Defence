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
  const cfg = SEVERITY[severity] || SEVERITY.INFO;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: small ? '2px 8px' : '3px 10px',
      borderRadius: 20,
      background: cfg.bg, border:`1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: small ? 11 : 12, fontWeight: 600,
      letterSpacing: '0.02em', whiteSpace:'nowrap',
    }}>
      <span style={{ fontSize: small?7:8 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function Button({ children, variant='primary', size='md', onClick, disabled, fullWidth, icon }) {
  const [hov, setHov] = useState(false);
  const V = {
    primary: { bg:'var(--navy)',          hbg:'#162d5a',            color:'#fff',                   border:'none',                          shadow:'0 1px 3px rgba(11,30,64,0.2)' },
    accent:  { bg:'var(--accent)',         hbg:'var(--accent-dark)', color:'#fff',                   border:'none',                          shadow:'0 1px 3px rgba(99,132,190,0.3)' },
    danger:  { bg:'transparent',           hbg:'var(--critical-bg)', color:'var(--critical)',         border:'1px solid var(--critical-border)', shadow:'none' },
    ghost:   { bg:'transparent',           hbg:'var(--bg-raised)',   color:'var(--text-secondary)',  border:'1px solid var(--border-light)',  shadow:'none' },
    warning: { bg:'transparent',           hbg:'var(--high-bg)',     color:'var(--high)',             border:'1px solid var(--high-border)',   shadow:'none' },
  };
  const s = V[variant] || V.primary;
  const pad = {sm:'5px 12px', md:'8px 16px', lg:'11px 22px'}[size];
  const fs  = {sm:12, md:13, lg:14}[size];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:pad, borderRadius:8, background:hov?s.hbg:s.bg, color:s.color, border:s.border, boxShadow:hov?'none':s.shadow, fontSize:fs, fontWeight:600, fontFamily:'var(--font-body)', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, transition:'all 0.15s ease', whiteSpace:'nowrap', width:fullWidth?'100%':'auto', justifyContent:fullWidth?'center':'flex-start' }}>
      {icon&&<span style={{fontSize:fs}}>{icon}</span>}{children}
    </button>
  );
}

export function Tooltip({ children, content, placement='top' }) {
  const [v, setV] = useState(false);
  const rEl = useRef(null), pEl = useRef(null);
  const { styles:ps, attributes } = usePopper(rEl.current, pEl.current, { placement, modifiers:[{name:'offset',options:{offset:[0,8]}}] });
  return (
    <span style={{ position:'relative', display:'inline-flex' }}>
      <span ref={rEl} onMouseEnter={()=>setV(true)} onMouseLeave={()=>setV(false)} style={{cursor:'help'}}>{children}</span>
      <div ref={pEl} style={{ ...ps.popper, visibility:v?'visible':'hidden', opacity:v?1:0, transition:'opacity 0.15s', background:'var(--navy)', border:'none', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#E8F0FA', maxWidth:240, lineHeight:1.5, zIndex:9999, fontFamily:'var(--font-body)', boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }} {...attributes.popper}>{content}</div>
    </span>
  );
}

export function HelpIcon({ tooltip }) {
  return (
    <Tooltip content={tooltip}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:15, height:15, borderRadius:'50%', background:'var(--bg-raised)', border:'1px solid var(--border-light)', color:'var(--text-muted)', fontSize:9, fontWeight:700, cursor:'help', marginLeft:3 }}>?</span>
    </Tooltip>
  );
}

export function KPICard({ label, value, sub, color, delta, icon, tooltip, aos }) {
  return (
    <div data-aos={aos||'fade-up'} className="card" style={{ padding:'24px', borderTop:`3px solid ${color}`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:color, opacity:0.05, borderRadius:'0 0 0 60px' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.08em', fontWeight:600, textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
          {label}{tooltip&&<HelpIcon tooltip={tooltip}/>}
        </span>
        {icon&&<span style={{fontSize:20,opacity:0.2}}>{icon}</span>}
      </div>
      <div style={{ fontSize:40, fontWeight:800, color, lineHeight:1, animation:'countUp 0.5s ease both', letterSpacing:'-0.02em' }}>{value}</div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, alignItems:'center' }}>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{sub}</span>
        {delta!=null&&<span style={{ fontSize:12, color:delta>0?'var(--critical)':'var(--success)', fontWeight:600 }}>{delta>0?'↑':'↓'}{Math.abs(delta)}%</span>}
      </div>
    </div>
  );
}

export function SeverityBar({ value, max=100, severity }) {
  const cfg = SEVERITY[severity]||SEVERITY.LOW;
  return (
    <div style={{ height:4, background:'var(--bg-raised)', borderRadius:4, overflow:'hidden', width:'100%' }}>
      <div style={{ height:'100%', width:`${Math.min(100,(value/max)*100)}%`, background:cfg.color, borderRadius:4, transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
    </div>
  );
}

export function ModuleHeader({ icon, name, subtitle, color, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{name}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>{children}</div>
    </div>
  );
}

export function Panel({ title, accent, children, style={}, action, aos }) {
  return (
    <div data-aos={aos} className="card" style={{ padding:24, ...style }}>
      {title&&(
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border-light)' }}>
          <span style={{ fontSize:11, color:accent||'var(--text-muted)', letterSpacing:'0.08em', fontWeight:700, textTransform:'uppercase' }}>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function InfoBox({ icon, title, body, color }) {
  return (
    <div style={{ padding:'16px 20px', borderRadius:12, background: color ? `${color}08` : 'var(--bg-raised)', border:`1px solid ${color ? color+'20' : 'var(--border-light)'}`, display:'flex', gap:14, alignItems:'flex-start' }}>
      {icon && <span style={{ fontSize:22, flexShrink:0, lineHeight:1, marginTop:1 }}>{icon}</span>}
      <div>
        {title && <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{title}</div>}
        <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{body}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:10, color:'var(--text-muted)' }}>
      <span style={{ fontSize:36, opacity:0.3 }}>{icon||'◎'}</span>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--text-secondary)' }}>{title}</div>
      {subtitle&&<div style={{ fontSize:13, textAlign:'center', maxWidth:280, color:'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  );
}
