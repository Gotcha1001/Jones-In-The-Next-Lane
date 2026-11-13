"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

export interface WeekendInfo {
  playerName: string;
  /** Avatar of the player whose week just ended (shown in the header). */
  playerAvatar?: string;
  /** True when the computer (Mr Jones) played this week → recap auto-closes. */
  isBot?: boolean;
  week: number;
  /** Whose turn is next; null in a one-player game. */
  nextPlayerName: string | null;
  /** Present when the player forgot to eat this week. */
  doctor?: { cost: number; timeLost: number };
  title: string;
  description: string;
}

interface Props {
  /** null = closed. */
  info: WeekendInfo | null;
  onClose: () => void;
  /** How long Mr Jones' recap stays up before it closes by itself. */
  botAutoCloseMs?: number;
}

const DEFAULT_BOT_AUTO_CLOSE_MS = 3500;

/* Same cyberpunk look as the home page (clipped corners, gradient frame,
   glitch title, scanlines, grid floor). Self-contained and prefixed `wk-` so
   it never clashes with the home page's own `.cp-*` styles. Colours follow the
   accent picked on the Appearance page and the light/dark mode. */
export const CSS = `
.wk{--c1:var(--accent-600,#0d9488);--c2:#0891b2;--c3:#db2777;
  --wk-surface:#ffffff;--wk-fg:#0f172a;--wk-muted:#475569;--wk-faint:#64748b;
  --wk-line:rgba(15,23,42,.16);--wk-tint:rgba(15,23,42,.05);--wk-btn-fg:#ffffff;--wk-blend:multiply}
.dark .wk{--c1:var(--accent-400,#2dd4bf);--c2:#00e5ff;--c3:#ff2e97;
  --wk-surface:#070a11;--wk-fg:#f5f5f4;--wk-muted:#d6d3d1;--wk-faint:#a8a29e;
  --wk-line:rgba(255,255,255,.14);--wk-tint:rgba(255,255,255,.05);--wk-btn-fg:#021014;--wk-blend:screen}
.wk-frame{background:linear-gradient(135deg,var(--c1),var(--wk-tint) 45%,var(--c2));padding:1px;
  clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))}
.wk-inner{background:var(--wk-surface);
  clip-path:polygon(0 0,calc(100% - 17px) 0,100% 17px,100% 100%,17px 100%,0 calc(100% - 17px))}
.wk-glow{filter:drop-shadow(0 0 22px color-mix(in oklab,var(--c1) 55%,transparent))}
.wk-scan{background:repeating-linear-gradient(0deg,color-mix(in oklab,var(--wk-fg) 4%,transparent) 0,color-mix(in oklab,var(--wk-fg) 4%,transparent) 1px,transparent 1px,transparent 3px)}
.wk-floor{background-image:linear-gradient(var(--c1) 1px,transparent 1px),linear-gradient(90deg,var(--c1) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:center top;
  animation:wk-grid 2.2s linear infinite;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%,#000);mask-image:linear-gradient(to bottom,transparent,#000 35%,#000)}
.wk-btn{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:linear-gradient(90deg,var(--c1),var(--c2));color:var(--wk-btn-fg);font-weight:900;letter-spacing:.12em;
  text-transform:uppercase;transition:filter .2s,transform .2s}
.wk-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.wk-btn:focus-visible{outline:2px solid var(--c2);outline-offset:3px}
.wk-glitch{position:relative;display:inline-block;text-shadow:0 0 22px color-mix(in oklab,var(--c1) 55%,transparent)}
.wk-glitch::before,.wk-glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none}
.wk-glitch::before{color:var(--c2);animation:wk-glitch-a 5s infinite steps(1);mix-blend-mode:var(--wk-blend)}
.wk-glitch::after{color:var(--c3);animation:wk-glitch-b 5s infinite steps(1);mix-blend-mode:var(--wk-blend)}
@keyframes wk-grid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes wk-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes wk-glitch-a{0%,90%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  91%{transform:translate(-5px,1px);clip-path:inset(8% 0 58% 0)}93%{transform:translate(4px,-1px);clip-path:inset(62% 0 6% 0)}
  96%{transform:translate(-3px,0);clip-path:inset(30% 0 42% 0)}}
@keyframes wk-glitch-b{0%,88%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  89%{transform:translate(5px,-1px);clip-path:inset(50% 0 20% 0)}92%{transform:translate(-4px,1px);clip-path:inset(12% 0 64% 0)}
  95%{transform:translate(3px,0);clip-path:inset(72% 0 4% 0)}}
@media (prefers-reduced-motion:reduce){.wk *,.wk *::before,.wk *::after{animation:none!important}}
`;

/** Shown when a week ends: what randomly happened over the weekend. */
export default function WeekendModal({
  info,
  onClose,
  botAutoCloseMs = DEFAULT_BOT_AUTO_CLOSE_MS,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isOpen = info !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" || e.key === "Enter") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    buttonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Mr Jones' recap closes by itself so nobody has to click it away.
  // Depends on `info` (not just isOpen) so back-to-back recaps restart the timer.
  const autoClose = info?.isBot === true;
  useEffect(() => {
    if (!info || !autoClose) return;
    const id = window.setTimeout(() => onCloseRef.current(), botAutoCloseMs);
    return () => window.clearTimeout(id);
  }, [info, autoClose, botAutoCloseMs]);

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="wk fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <style>{CSS}</style>

          {/* Atmosphere: scanlines + moving neon grid floor */}
          <div className="wk-scan pointer-events-none absolute inset-0" />
          <div
            className="wk-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-[0.14]"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Weekend recap"
            className="wk-glow relative w-full max-w-lg"
            initial={reduceMotion ? false : { scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.96, y: 16, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
          >
            <div className="wk-frame">
              <div className="wk-inner relative text-left text-[color:var(--wk-fg)]">
                <div className="wk-scan pointer-events-none absolute inset-0" />

                {/* Whose recap is this? */}
                <div
                  className="relative flex items-center gap-3 border-b border-[color:var(--wk-line)] px-5 py-3"
                  style={{
                    background:
                      "linear-gradient(90deg,color-mix(in oklab,var(--c1) 18%,transparent),transparent)",
                  }}
                >
                  {info.playerAvatar && (
                    <PlayerAvatar
                      src={info.playerAvatar}
                      name={info.playerName}
                      size={44}
                      className="shrink-0 ring-2 ring-[color:var(--c1)]"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                      {info.isBot ? "🤖 Computer player" : "Player"}
                    </p>
                    <p className="truncate text-xl font-black uppercase leading-tight tracking-tight text-[color:var(--c1)]">
                      {info.playerName}
                    </p>
                  </div>
                </div>

                {/* HUD bar */}
                <div className="relative flex items-center justify-between border-b border-[color:var(--wk-line)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full bg-red-500"
                      style={{ animation: "wk-blink 1.4s infinite" }}
                    />
                    Week {info.week} complete
                  </span>
                  <span className="text-[color:var(--c2)]">SYS.WEEKEND</span>
                </div>

                <div className="relative space-y-5 p-6 sm:p-7">
                  {/* Title */}
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--c2)]"></p>
                    <h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
                      <span
                        className="wk-glitch text-[color:var(--c1)]"
                        data-text="OVER THE"
                      >
                        OVER THE
                      </span>{" "}
                      <span
                        className="wk-glitch text-[color:var(--wk-fg)]"
                        data-text="WEEKEND"
                      >
                        WEEKEND
                      </span>
                    </h2>
                    <div
                      className="mt-3 h-px w-24"
                      style={{
                        background:
                          "linear-gradient(90deg,var(--c1),transparent)",
                      }}
                    />
                  </div>

                  {/* Event card */}
                  <div className="relative border border-[color:var(--wk-line)] bg-[color:var(--wk-tint)] p-4 pl-5">
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{
                        background:
                          "linear-gradient(180deg,var(--c1),var(--c2))",
                      }}
                    />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                      🎲 Random event
                    </p>
                    <p className="mt-1 text-xl font-black uppercase tracking-tight">
                      {info.title}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--wk-muted)]">
                      {info.description}
                    </p>
                  </div>

                  {/* Forgot to eat: doctor's bill */}
                  {info.doctor && (
                    <div className="relative border border-red-500/50 bg-red-500/10 p-4 pl-5">
                      <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-400">
                        🏥 Forgot to eat
                      </p>
                      <p className="mt-1 text-xl font-black uppercase tracking-tight">
                        Doctor&apos;s bill
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--wk-muted)]">
                        {info.isBot ? info.playerName : "You"} didn&apos;t eat
                        all week.{" "}
                        <span className="font-bold text-red-400">
                          −${info.doctor.cost}
                        </span>{" "}
                        and{" "}
                        <span className="font-bold text-red-400">
                          −{info.doctor.timeLost}⏱
                        </span>{" "}
                        off {info.isBot ? "the" : "your"} new week.
                      </p>
                    </div>
                  )}

                  {/* Status line */}
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--wk-faint)]">
                    <span className="text-[color:var(--c2)]">
                      {info.playerName}
                    </span>{" "}
                    → home
                    {info.nextPlayerName ? (
                      <>
                        {" "}
                        · next up{" "}
                        <span className="text-[color:var(--c1)]">
                          {info.nextPlayerName}
                        </span>
                      </>
                    ) : (
                      <> · new week begins</>
                    )}
                  </p>

                  {autoClose && (
                    <div
                      className="h-1 w-full overflow-hidden bg-[color:var(--wk-tint)]"
                      aria-hidden
                    >
                      <motion.div
                        key={`${info.playerName}-${info.week}`}
                        className="h-full"
                        style={{
                          background:
                            "linear-gradient(90deg,var(--c1),var(--c2))",
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: botAutoCloseMs / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  )}

                  <button
                    ref={buttonRef}
                    type="button"
                    onClick={onClose}
                    className="wk-btn w-full px-6 py-3 text-sm"
                  >
                    {info.nextPlayerName
                      ? `Continue — ${info.nextPlayerName}'s turn`
                      : `Start week ${info.week + 1}`}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
