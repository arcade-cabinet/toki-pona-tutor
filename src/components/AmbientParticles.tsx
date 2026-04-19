import { useEffect, useRef } from 'react';

/**
 * Drifting ambient particles over the overworld — petals/pollen/leaves.
 * Purely decorative HTML canvas layer above the Phaser game.
 * Pointer-events none so it never blocks input.
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  hue: number;
  alpha: number;
}

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    // Opt-out on reduce-motion / low-power — some mobile browsers render the
    // first clear-rect frame as solid white before the clear propagates.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let running = true;
    const particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    // Ensure the first paint is a fully transparent clear — prevents a one-
    // frame white flash on some mobile GPUs that fill a newly-resized canvas
    // with opaque white before the first draw.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (x?: number): Particle => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: x ?? Math.random() * rect.width,
        y: -20 + Math.random() * -40,
        vx: -0.15 + Math.random() * 0.6,
        vy: 0.25 + Math.random() * 0.5,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: -0.02 + Math.random() * 0.04,
        hue: 20 + Math.random() * 50, // warm golden/peach range
        alpha: 0.5 + Math.random() * 0.35,
      };
    };

    // Start with a sprinkling
    const rect0 = canvas.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      particles.push({ ...spawn(Math.random() * rect0.width), y: Math.random() * rect0.height });
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue}, 80%, 72%)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const step = () => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      // Occasionally spawn new
      if (particles.length < 22 && Math.random() < 0.04) {
        particles.push(spawn());
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        // Gentle drift — swaying
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vx = Math.max(-0.5, Math.min(0.8, p.vx));
        if (p.y > rect.height + 20 || p.x < -30 || p.x > rect.width + 30) {
          particles.splice(i, 1);
          continue;
        }
        drawPetal(p);
      }
      raf = requestAnimationFrame(step);
    };
    step();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      aria-hidden="true"
      style={{ background: 'transparent' }}
    />
  );
}
