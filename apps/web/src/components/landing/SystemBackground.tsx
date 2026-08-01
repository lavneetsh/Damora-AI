'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SystemBackgroundProps {
  heroQuery?: string;
  querySubmitted?: boolean;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
}

interface Edge {
  from: number;
  to: number;
  dist: number;
}

export default function SystemBackground({ heroQuery, querySubmitted }: SystemBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const querySubmittedRef = useRef<boolean>(!!querySubmitted);

  useEffect(() => {
    querySubmittedRef.current = !!querySubmitted;
  }, [querySubmitted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Generate Neural Nodes (~85 nodes)
    const nodeCount = Math.min(Math.floor((width * height) / 14000), 90);
    const colors = ['#818CF8', '#6366F1', '#60A5FA', '#A855F7', '#38BDF8'];

    const nodes: Node[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: 1.5 + Math.random() * 1.5,
      baseAlpha: 0.3 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Single Signal Pulse State (Layer 4 — Every 7-9 seconds, exactly ONE pulse travels)
    let pulseActive = false;
    let pulseEdge: Edge | null = null;
    let pulseProgress = 0;
    let lastPulseTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const isQueryActive = querySubmittedRef.current;
      const now = Date.now();

      // Trigger Single Signal Pulse every 7.5s
      if (!pulseActive && now - lastPulseTime > 7500) {
        lastPulseTime = now;
        // Find valid edges
        const possibleEdges: Edge[] = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              possibleEdges.push({ from: i, to: j, dist });
            }
          }
        }
        if (possibleEdges.length > 0) {
          pulseEdge = possibleEdges[Math.floor(Math.random() * possibleEdges.length)];
          pulseActive = true;
          pulseProgress = 0;
        }
      }

      // Update & Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Cursor attraction force
        if (mouse.active) {
          const mdx = mouse.x - n.x;
          const mdy = mouse.y - n.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 180 && mdist > 0) {
            const force = (1 - mdist / 180) * 0.08;
            n.vx += (mdx / mdist) * force;
            n.vy += (mdy / mdist) * force;
          }
        }

        // Dampen velocity to keep motion calm
        n.vx *= 0.98;
        n.vy *= 0.98;

        // Min velocity drift
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.05;

        n.x += n.vx;
        n.y += n.vy;

        // Wrap around screen edges
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Node render
        const mouseDist = mouse.active ? Math.sqrt((mouse.x - n.x) ** 2 + (mouse.y - n.y) ** 2) : 999;
        const isHovered = mouseDist < 120;
        const alpha = isHovered ? Math.min(n.baseAlpha * 1.8, 1) : n.baseAlpha;
        const radius = isHovered ? n.radius * 1.5 : isQueryActive ? n.radius * 1.2 : n.radius;

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#FFFFFF' : n.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.shadowColor = n.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Neural Connections (Edges)
      const maxConnectDist = 135;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const edgeAlpha = (1 - dist / maxConnectDist) * 0.18;
            const mouseNear = mouse.active && (
              Math.sqrt((mouse.x - n1.x) ** 2 + (mouse.y - n1.y) ** 2) < 130 ||
              Math.sqrt((mouse.x - n2.x) ** 2 + (mouse.y - n2.y) ** 2) < 130
            );

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = mouseNear ? '#A5B4FC' : isQueryActive ? '#818CF8' : '#475569';
            ctx.globalAlpha = mouseNear ? Math.min(edgeAlpha * 2.5, 0.6) : isQueryActive ? edgeAlpha * 1.5 : edgeAlpha;
            ctx.lineWidth = mouseNear ? 1.2 : 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw Single Travelling Signal Pulse (Layer 4)
      if (pulseActive && pulseEdge) {
        const n1 = nodes[pulseEdge.from];
        const n2 = nodes[pulseEdge.to];
        if (n1 && n2) {
          pulseProgress += 0.02;
          if (pulseProgress >= 1) {
            pulseActive = false;
            pulseEdge = null;
          } else {
            const px = n1.x + (n2.x - n1.x) * pulseProgress;
            const py = n1.y + (n2.y - n1.y) * pulseProgress;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = Math.sin(pulseProgress * Math.PI);
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#6366F1';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else {
          pulseActive = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Layer 1: Dark Gradient Base (#09090F -> #0B1020 -> #09090F) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090F] via-[#0B1020] to-[#09090F]" />

      {/* Layer 2: Massive Blurred Radial Lights (Indigo, Blue, Purple - matching login/dashboard) */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1300px] h-[750px] bg-gradient-to-b from-indigo-600/18 via-purple-600/12 to-transparent rounded-full blur-[180px]" />
      <div className="absolute top-[30%] -left-40 w-[950px] h-[850px] bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[200px]" />
      <div className="absolute top-[60%] -right-40 w-[1050px] h-[850px] bg-gradient-to-l from-purple-600/16 via-indigo-600/12 to-transparent rounded-full blur-[200px]" />

      {/* Layer 3 & 4: Living Neural Network Canvas + Single Signal Pulse */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />

      {/* Layer 5: Very Soft Animated Noise Overlay for Depth */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
        <filter id="darkNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#darkNoiseFilter)" />
      </svg>
    </div>
  );
}
