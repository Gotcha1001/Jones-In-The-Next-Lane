"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { ChevronRight } from "lucide-react";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Shared variants ─────────────────────────────────────────────────────────
const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const riseChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const tbodyVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } },
};
const rowVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

const VIEW = { once: true, amount: 0.12 } as const;

// ── Page shell + scroll progress bar ────────────────────────────────────────
export function RulesShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.3,
  });
  return (
    <div className="relative mx-auto max-w-3xl space-y-8 pb-20 sm:space-y-10">
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ scaleX }}
          className="accent-gradient-bg pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 origin-left shadow-[0_0_10px_var(--accent-400)]"
        />
      )}
      {children}
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
export function Hero({
  eyebrow,
  title,
  subtitle,
  nav,
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  nav: { id: string; label: string }[];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.header
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerParent}
      className="space-y-4 pt-2"
    >
      <motion.p
        variants={riseChild}
        className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-400/80"
      >
        {"// "}
        {eyebrow}
      </motion.p>
      <motion.h1
        variants={riseChild}
        className="accent-gradient-text text-4xl font-extrabold tracking-tight sm:text-5xl"
        style={GLOW_TEXT}
      >
        {title}
      </motion.h1>
      <motion.p
        variants={riseChild}
        className="max-w-xl text-sm leading-relaxed text-slate-300 [&_strong]:font-semibold [&_strong]:text-cyan-300"
      >
        {subtitle}
      </motion.p>
      <motion.nav
        variants={riseChild}
        aria-label="Rules sections"
        className="flex flex-wrap gap-2 pt-1"
      >
        {nav.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className="rounded-full border border-cyan-400/25 bg-cyan-400/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-400/15 hover:shadow-[0_0_14px_-2px_var(--accent-400)]"
          >
            {n.label}
          </a>
        ))}
      </motion.nav>
    </motion.header>
  );
}

// ── Count-up number (server-renders the final value, then animates in) ──────
function CountUp({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(to);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.3,
      ease: EASE,
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {val.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

// ── Tiles ───────────────────────────────────────────────────────────────────
export function TileGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEW}
      variants={staggerParent}
      className={`grid gap-3 ${
        cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"
      }`}
    >
      {children}
    </motion.div>
  );
}

export function Tile({
  icon,
  label,
  value,
  countTo,
  prefix,
  suffix,
  hint,
}: {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
  countTo?: number;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
}) {
  return (
    <motion.div
      variants={riseChild}
      whileHover={{ y: -3 }}
      className="accent-card group rounded-xl bg-cyan-400/5 p-4 transition-shadow hover:shadow-[0_0_22px_-4px_var(--accent-400)]"
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition group-hover:shadow-[0_0_12px_var(--accent-400)]">
            {icon}
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
          {label}
        </span>
      </div>
      <p
        className="mt-3 text-2xl font-bold leading-none text-white"
        style={GLOW_TEXT}
      >
        {countTo !== undefined ? (
          <CountUp to={countTo} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  );
}

// ── Section card ────────────────────────────────────────────────────────────
export function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.06 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="accent-card relative scroll-mt-24 overflow-hidden rounded-2xl bg-black/45 p-5 backdrop-blur sm:p-7"
    >
      {/* neon hairline that draws itself across the top edge */}
      <motion.span
        aria-hidden
        initial={reduce ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
      />
      {/* cyber corner brackets */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 size-3 border-l-2 border-t-2 border-cyan-300/70"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-2 size-3 border-b-2 border-r-2 border-cyan-300/70"
      />

      <header className="mb-6 space-y-2">
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-400/80">
          {"// "}
          {String(index).padStart(2, "0")}
        </p>
        <h2
          className="accent-gradient-text text-2xl font-bold tracking-tight"
          style={GLOW_TEXT}
        >
          {title}
        </h2>
        <motion.div
          aria-hidden
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
          className="h-px origin-left bg-gradient-to-r from-cyan-400/60 via-cyan-400/20 to-transparent"
        />
      </header>

      <div className="space-y-6">{children}</div>
    </motion.section>
  );
}

// ── Text building blocks ────────────────────────────────────────────────────
export function Body({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300 [&_em]:text-cyan-200 [&_strong]:font-semibold [&_strong]:text-cyan-300">
      {children}
    </div>
  );
}

export function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
      {children}
    </h3>
  );
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="space-y-3">{children}</ul>;
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-slate-300 [&_em]:text-cyan-200 [&_strong]:font-semibold [&_strong]:text-cyan-300">
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-cyan-400 drop-shadow-[0_0_4px_var(--accent-400)]" />
      <span>{children}</span>
    </li>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-r-xl border-l-2 border-cyan-400 bg-cyan-400/[0.07] px-4 py-3 text-sm leading-relaxed text-slate-300 [&_em]:text-cyan-200 [&_strong]:font-semibold [&_strong]:text-cyan-300">
      {children}
    </div>
  );
}

// ── Inline pieces used inside tables ────────────────────────────────────────
export function Badge({
  tone,
  children,
}: {
  tone: "win" | "spec" | "goal";
  children: ReactNode;
}) {
  const styles = {
    win: "border-amber-300/50 bg-amber-300/15 text-amber-200",
    spec: "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-200",
    goal: "border-emerald-300/50 bg-emerald-400/15 text-emerald-200",
  }[tone];
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles}`}
    >
      {children}
    </span>
  );
}

export function Pay({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono font-semibold tabular-nums text-emerald-300">
      {children}
    </span>
  );
}

export function Num({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono tabular-nums text-cyan-100">{children}</span>
  );
}

export function Needs({ parts }: { parts: { name: string; level: number }[] }) {
  if (!parts.length)
    return <span className="text-xs italic text-slate-500">None</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {parts.map((p, i) => (
        <span key={p.name} className="flex items-center gap-1.5">
          <span className="whitespace-nowrap rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-xs text-slate-200">
            {p.name}{" "}
            <b className="font-mono font-semibold text-cyan-200">{p.level}</b>
          </span>
          {i < parts.length - 1 && <span className="text-cyan-400/60">+</span>}
        </span>
      ))}
    </span>
  );
}

// ── Bordered, animated data table ───────────────────────────────────────────
export type Col = {
  label: string;
  align?: "left" | "right" | "center";
  /** Column width (e.g. "38%"). Give every column one to get a fixed layout. */
  width?: string;
};
export type TableRow = {
  key: string;
  cells: ReactNode[];
  highlight?: boolean;
};

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable({
  caption,
  columns,
  rows,
  minWidth = "40rem",
}: {
  caption: string;
  columns: Col[];
  rows: TableRow[];
  minWidth?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-x-auto rounded-xl border border-cyan-400/30 bg-black/30 shadow-[inset_0_0_32px_-18px_var(--accent-400)]">
      <table
        className={`w-full border-separate border-spacing-0 text-sm ${
          columns.every((c) => c.width) ? "table-fixed" : ""
        }`}
        style={{ minWidth }}
      >
        <caption className="sr-only">{caption}</caption>
        {columns.every((c) => c.width) && (
          <colgroup>
            {columns.map((c) => (
              <col key={c.label} style={{ width: c.width }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                className={`whitespace-nowrap border-b border-r border-cyan-400/30 bg-cyan-400/10 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200 sm:text-[11px] last:border-r-0 ${ALIGN[c.align ?? "left"]}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={VIEW}
          variants={tbodyVariants}
          className="[&>tr:last-child>td]:border-b-0"
        >
          {rows.map((r) => (
            <motion.tr
              key={r.key}
              variants={rowVariants}
              className={`transition-colors hover:bg-cyan-400/[0.12] ${
                r.highlight ? "bg-cyan-400/[0.07]" : ""
              }`}
            >
              {r.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`border-b border-r border-cyan-400/15 px-4 py-3 align-middle last:border-r-0 ${
                    ALIGN[columns[i]?.align ?? "left"]
                  } ${
                    i === 0 && r.highlight
                      ? "shadow-[inset_3px_0_0_var(--accent-400)]"
                      : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── A titled block (one subject's career ladder) ────────────────────────────
export function Block({
  title,
  description,
  tag,
  children,
}: {
  title: string;
  description?: string;
  tag?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.5, ease: EASE }}
      className="space-y-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.03] p-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {tag}
        {description && (
          <span className="w-full text-xs text-slate-400 sm:ml-auto sm:w-auto">
            {description}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ── Chip list (starter jobs) ────────────────────────────────────────────────
export function ChipList({
  items,
}: {
  items: { label: string; sub: string }[];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.ul
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEW}
      variants={staggerParent}
      className="flex flex-wrap gap-2"
    >
      {items.map((it) => (
        <motion.li
          key={it.label}
          variants={riseChild}
          whileHover={{ y: -2 }}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-slate-200 transition-shadow hover:shadow-[0_0_14px_-2px_var(--accent-400)]"
        >
          {it.label}
          <span className="font-mono font-semibold text-emerald-300">
            {it.sub}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
