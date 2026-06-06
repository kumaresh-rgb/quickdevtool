"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

const SNIPPETS = [
  { lang: "dax", top: "12%", left: "6%", delay: 0, depth: 10, code: `EVALUATE\nTOPN(10, Sales, [Total])` },
  { lang: "json", top: "20%", left: "78%", delay: 1.2, depth: 14, code: `{\n  "id": 42,\n  "ok": true\n}` },
  { lang: "csharp", top: "64%", left: "9%", delay: 0.6, depth: 12, code: `var x = await db\n  .Notes.ToListAsync();` },
  { lang: "sql", top: "68%", left: "76%", delay: 1.8, depth: 9, code: `SELECT *\nFROM dbo.Notes` },
];

const COLORS: Record<string, string> = {
  dax: "var(--accent)",
  json: "var(--warning)",
  csharp: "var(--success)",
  sql: "var(--danger)",
};

// Spring tuned for a smooth, premium follow — no jitter.
const SPRING = { stiffness: 120, damping: 22, mass: 0.6 } as const;

function Snippet({
  s,
  mx,
  my,
}: {
  s: (typeof SNIPPETS)[number];
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  // Parallax target is the normalised cursor offset (-1..1) scaled by a small
  // depth, then smoothed by a spring. Movement is clamped to ±depth px.
  const x = useSpring(useTransform(mx, (v) => -v * s.depth), SPRING);
  const y = useSpring(useTransform(my, (v) => -v * s.depth), SPRING);

  return (
    <motion.div className="absolute will-change-transform" style={{ top: s.top, left: s.left, x, y }}>
      {/* Float animation lives on a separate element so it never fights the
          parallax transform above (which would cause the shaking). */}
      <div className="animate-float" style={{ animationDelay: `${s.delay}s` }}>
        <div className="glass card overflow-hidden font-mono text-xs shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-border-soft px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[s.lang] }} />
            <span className="text-fg-subtle">{s.lang}</span>
          </div>
          <pre className="whitespace-pre px-3 py-2 text-fg-muted">{s.code}</pre>
        </div>
      </div>
    </motion.div>
  );
}

/** Floating code/DAX/JSON blocks with smooth spring-based cursor parallax. */
export function FloatingSnippets() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mx, my]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {SNIPPETS.map((s, i) => (
        <Snippet key={i} s={s} mx={mx} my={my} />
      ))}
    </div>
  );
}
