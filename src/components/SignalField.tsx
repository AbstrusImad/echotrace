import { useEffect, useRef } from "react";

type SignalFieldProps = {
  // Accent colors [core, mid, edge] drive the palette; changes tint the field.
  colors?: string[];
  // Energy scales node speed and pulse frequency (idle vs analyzing vs result).
  energy?: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type Pulse = {
  a: number; // node index
  b: number; // node index
  t: number; // 0..1 progress along the edge
  speed: number;
};

// A living signal-network canvas: drifting nodes connected by proximity lines,
// with light pulses that travel along the strongest connections. Pure
// decoration (no data), but it reacts to the accent colors and energy so the
// whole app feels alive and responds to the analysis phase.
export function SignalField({
  colors = ["#38e1c8", "#2f80ff", "#8b5cf6"],
  energy = 1,
}: SignalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorsRef = useRef(colors);
  const energyRef = useRef(energy);

  colorsRef.current = colors;
  energyRef.current = energy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el: HTMLCanvasElement = canvas;
    const context = el.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let last = performance.now();

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function resize() {
      const rect = el.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.floor(width * dpr);
      el.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.max(28, Math.min(64, Math.floor((width * height) / 26000)));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.8 + Math.random() * 1.8,
      }));
      pulses = [];
    }

    function hexToRgb(hex: string) {
      const h = hex.replace("#", "");
      const n = parseInt(
        h.length === 3
          ? h.split("").map((c) => c + c).join("")
          : h,
        16,
      );
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    const LINK = 132;

    function frame(now: number) {
      const dt = Math.min(50, now - last) / 16.666;
      last = now;
      const e = energyRef.current;
      const [c0, c1, c2] = colorsRef.current;
      const rgb0 = hexToRgb(c0);
      const rgb1 = hexToRgb(c1);
      const rgb2 = hexToRgb(c2);

      ctx.clearRect(0, 0, width, height);

      // move nodes
      for (const n of nodes) {
        n.x += n.vx * dt * e;
        n.y += n.vy * dt * e;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }

      // links
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.5;
            ctx.strokeStyle = `rgba(${rgb1.r},${rgb1.g},${rgb1.b},${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            // occasionally spawn a pulse along a close, strong link
            if (
              !prefersReduced &&
              dist < LINK * 0.62 &&
              pulses.length < 26 &&
              Math.random() < 0.0016 * e
            ) {
              pulses.push({ a: i, b: j, t: 0, speed: 0.012 + Math.random() * 0.02 });
            }
          }
        }
      }

      // pulses
      for (let k = pulses.length - 1; k >= 0; k -= 1) {
        const p = pulses[k];
        p.t += p.speed * dt * e;
        if (p.t >= 1) {
          pulses.splice(k, 1);
          continue;
        }
        const a = nodes[p.a];
        const b = nodes[p.b];
        if (!a || !b) {
          pulses.splice(k, 1);
          continue;
        }
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        const glow = Math.sin(p.t * Math.PI);
        ctx.fillStyle = `rgba(${rgb0.r},${rgb0.g},${rgb0.b},${glow})`;
        ctx.shadowColor = c0;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.72)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    if (prefersReduced) {
      // draw one static frame
      last = performance.now();
      frame(last);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}
