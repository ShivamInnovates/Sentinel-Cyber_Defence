import { useEffect, useRef } from 'react';
import { useStore } from '../../store';

const NODE_COUNT = 38;
const CONNECTION_DIST = 160;
const MOUSE_REPEL = 120;

export default function CyberBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const nodes = useRef([]);
  const raf = useRef(null);
  const { darkMode } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* seed nodes */
    nodes.current = Array.from({ length: NODE_COUNT }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.8 + 0.8,
    }));

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';

      ctx.clearRect(0, 0, W, H);

      /* ── dot grid watermark ── */
      const dotColor = dark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.06)';
      const spacing = 36;
      ctx.fillStyle = dotColor;
      for (let x = spacing; x < W; x += spacing) {
        for (let y = spacing; y < H; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── update + draw nodes ── */
      const ns = nodes.current;
      ns.forEach(n => {
        /* mouse repel */
        const dx = n.x - mouse.current.x;
        const dy = n.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL && dist > 0) {
          const force = (MOUSE_REPEL - dist) / MOUSE_REPEL * 0.6;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        /* dampen + move */
        n.vx *= 0.98;
        n.vy *= 0.98;
        n.x += n.vx;
        n.y += n.vy;

        /* bounce */
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.x = Math.max(0, Math.min(W, n.x));
        n.y = Math.max(0, Math.min(H, n.y));
      });

      /* ── connections ── */
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[i].x - ns[j].x;
          const dy = ns[i].y - ns[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * (dark ? 0.18 : 0.12);
            ctx.beginPath();
            ctx.strokeStyle = dark
              ? `rgba(59,130,246,${alpha})`
              : `rgba(59,130,246,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(ns[i].x, ns[i].y);
            ctx.lineTo(ns[j].x, ns[j].y);
            ctx.stroke();
          }
        }
      }

      /* ── node dots ── */
      ns.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.22)';
        ctx.fill();
      });

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
