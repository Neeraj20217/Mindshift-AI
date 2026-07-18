import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: [number, number, number]; // RGB
  ringRadius: number;
  ringAlpha: number;
  ringExpanding: boolean;
}

// Premium AI SaaS palette — only cyan, emerald, purple
const PALETTES: [number, number, number][] = [
  [34, 197, 94],   // emerald-500
  [56, 189, 248],  // sky-400
  [139, 92, 246],  // violet-500
  [52, 211, 153],  // emerald-400
  [99, 102, 241],  // indigo-500
  [14, 165, 233],  // sky-500
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn nodes
    const COUNT = Math.max(20, Math.min(Math.floor(window.innerWidth / 28), 48));
    nodesRef.current = Array.from({ length: COUNT }, (): Node => {
      const color = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: Math.random() * 1.5 + 0.8,
        baseRadius: Math.random() * 1.5 + 0.8,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        color,
        ringRadius: 0,
        ringAlpha: 0,
        ringExpanding: Math.random() > 0.7,
      };
    });

    const CONNECT_DIST = 150;
    const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;

    const draw = (timestamp: number) => {
      timeRef.current = timestamp * 0.001;
      const t = timeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;

      // ─── Update positions ───────────────────────────────
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = canvas.width + 20;
        if (n.x > canvas.width + 20) n.x = -20;
        if (n.y < -20) n.y = canvas.height + 20;
        if (n.y > canvas.height + 20) n.y = -20;

        // Pulsing radius
        n.pulsePhase += n.pulseSpeed;
        n.radius = n.baseRadius + Math.sin(n.pulsePhase) * 0.6;

        // Ring pulse propagation
        if (n.ringExpanding) {
          n.ringRadius += 0.9;
          n.ringAlpha = Math.max(0, 0.35 - n.ringRadius / 120);
          if (n.ringRadius > 90) {
            n.ringRadius = 0;
            n.ringAlpha = 0.35;
            n.ringExpanding = Math.random() > 0.4;
          }
        } else {
          if (Math.random() < 0.0012) n.ringExpanding = true;
        }
      });

      // ─── Draw connections ────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < CONNECT_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / CONNECT_DIST) * 0.18;

            // Blend the two node colours
            const [r1, g1, b1] = nodes[i].color;
            const [r2, g2, b2] = nodes[j].color;
            const r = Math.round(lerp(r1, r2, 0.5));
            const g = Math.round(lerp(g1, g2, 0.5));
            const b = Math.round(lerp(b1, b2, 0.5));

            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(${r1},${g1},${b1},${alpha})`);
            grad.addColorStop(1, `rgba(${r2},${g2},${b2},${alpha})`);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // Travelling data packet (small bright dot)
            const prog = (Math.sin(t * 0.6 + i * 0.7 + j * 0.4) + 1) / 2;
            const px = nodes[i].x + (nodes[j].x - nodes[i].x) * prog;
            const py = nodes[i].y + (nodes[j].y - nodes[i].y) * prog;
            const packetAlpha = alpha * 3;

            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${packetAlpha})`;
            ctx.fill();
          }
        }
      }

      // ─── Draw node rings ─────────────────────────────────
      nodes.forEach((n) => {
        if (n.ringAlpha > 0) {
          const [r, g, b] = n.color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${n.ringAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });

      // ─── Draw nodes ──────────────────────────────────────
      nodes.forEach((n) => {
        const [r, g, b] = n.color;
        const alpha = 0.55 + Math.sin(n.pulsePhase) * 0.15;

        // Outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 5);
        grd.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      });

      // ─── Very subtle horizontal scan line ────────────────
      const scanY = ((t * 35) % (canvas.height + 80)) - 40;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0,   'rgba(56,189,248,0)');
      scanGrad.addColorStop(0.5, 'rgba(56,189,248,0.018)');
      scanGrad.addColorStop(1,   'rgba(56,189,248,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, canvas.width, 60);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.75 }}
      aria-hidden="true"
    />
  );
};
