"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  GraduationCap,
  Heart,
  Landmark,
  Gamepad2,
  Globe,
  ShoppingBag,
  Trophy,
  Users,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  PHOTOS + VIDEOS                                                           */
/*  Everything below already exists in /public from the old version of the   */
/*  game. A slide with a `video` plays it muted + looping while it is the    */
/*  active hero slide; the photo is the poster / fallback. If a file is       */
/*  missing, a neon placeholder is shown automatically.                       */
/* -------------------------------------------------------------------------- */
interface Slide {
  src: string;
  video?: string;
  tag: string;
  title: string;
  line: string;
  icon: LucideIcon;
  tint: string;
}

const HERO_SLIDES: Slide[] = [
  {
    src: "/universityimage.jpg",
    video: "/videos/universityvideo.mp4",
    tag: "MODULE 01",
    title: "UNIVERSITY",
    line: "Study hard, earn your degrees and unlock better careers.",
    icon: GraduationCap,
    tint: "#a78bfa",
  },
  {
    src: "/employment.jpg",
    video: "/videos/workplacevideo.mp4",
    tag: "MODULE 02",
    title: "CAREER",
    line: "Land the job, impress the boss and climb the ladder.",
    icon: Briefcase,
    tint: "#00e5ff",
  },
  {
    src: "/rent.jpg",
    video: "/videos/apartment.mp4",
    tag: "MODULE 03",
    title: "LUXURY LIVING",
    line: "Move out of the dump and into the penthouse.",
    icon: Building2,
    tint: "#ff2e97",
  },
  {
    src: "/banklady.jpg",
    video: "/videos/bank.mp4",
    tag: "MODULE 04",
    title: "MONEY",
    line: "Save, invest in shares and outgrow your friends.",
    icon: Landmark,
    tint: "#facc15",
  },
];

const GALLERY: Slide[] = [
  {
    src: "/universityimage.jpg",
    tag: "UNIVERSITY",
    title: "Hit the books",
    line: "Degrees that open the best jobs in town.",
    icon: GraduationCap,
    tint: "#a78bfa",
  },
  {
    src: "/employment.jpg",
    tag: "EMPLOYMENT",
    title: "Get hired",
    line: "Browse the job board and start your career.",
    icon: Briefcase,
    tint: "#00e5ff",
  },
  {
    src: "/mall.jpg",
    tag: "MALL",
    title: "Shop till you drop",
    line: "Furniture, gadgets and gear for your life.",
    icon: ShoppingBag,
    tint: "#ff2e97",
  },
  {
    src: "/fastfood.jpg",
    tag: "FAST FOOD",
    title: "Grab a bite",
    line: "Quick meals to restore your energy.",
    icon: Utensils,
    tint: "#facc15",
  },
  {
    src: "/datingoffice.jpg",
    tag: "DATING",
    title: "Find romance",
    line: "Happiness counts. Go on a date.",
    icon: Heart,
    tint: "#f43f5e",
  },
  {
    src: "/meditate.jpg",
    tag: "WELLNESS",
    title: "Stay healthy",
    line: "Rest, relax and keep your mind sharp.",
    icon: Trophy,
    tint: "#34d399",
  },
];

const SHOWCASE: Slide[] = [
  {
    src: "/home.jpg",
    tag: "HOME",
    title: "Your apartment",
    line: "Rest up, study and recharge at home.",
    icon: Building2,
    tint: "#34d399",
  },
  {
    src: "/leisure.jpg",
    tag: "LEISURE",
    title: "Time to play",
    line: "Unwind, boost your happiness and have fun.",
    icon: Gamepad2,
    tint: "#00e5ff",
  },
  {
    src: "/boss.jpg",
    tag: "WORKPLACE",
    title: "Meet the boss",
    line: "Work your shift and earn that promotion.",
    icon: Briefcase,
    tint: "#ff2e97",
  },
  {
    src: "/professor.jpg",
    tag: "CAMPUS",
    title: "The professor",
    line: "Learn new skills and graduate faster.",
    icon: GraduationCap,
    tint: "#a78bfa",
  },
  {
    src: "/gaming.jpg",
    tag: "ARCADE",
    title: "Level up",
    line: "Blow off steam between work and study.",
    icon: Gamepad2,
    tint: "#facc15",
  },
];

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  code: string;
}

const FEATURES: Feature[] = [
  {
    code: "01",
    icon: Globe,
    title: "Online lobbies",
    description:
      "Create or join a room, pick an avatar, ready up and race friends to the top, live and synced.",
  },
  {
    code: "02",
    icon: Video,
    title: "Video & voice",
    description:
      "Trash-talk face to face. Every room has built-in video chat and text chat.",
  },
  {
    code: "03",
    icon: Cloud,
    title: "Cloud saves",
    description:
      "Games persist automatically. Save snapshots from the sidebar and pick up on any device.",
  },
  {
    code: "04",
    icon: Users,
    title: "Solo or hot-seat",
    description:
      "No friends online? Play solo against bots or pass the screen around the table.",
  },
];

const STEPS: { n: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    n: "01",
    icon: Users,
    title: "Join the race",
    text: "Pick an avatar and set your goals in the lobby, solo or with friends.",
  },
  {
    n: "02",
    icon: Briefcase,
    title: "Walk the map",
    text: "Travel to the university, workplace, bank, mall and more. Each stop opens its own scene.",
  },
  {
    n: "03",
    icon: Trophy,
    title: "Beat the Joneses",
    text: "Hit your goals for wealth, career, happiness and health before anyone else.",
  },
];

const STATS = [
  { value: "4", label: "Life goals" },
  { value: "12+", label: "Locations" },
  { value: "LIVE", label: "Multiplayer" },
  { value: "SOLO", label: "Or hot-seat" },
];

const TICKER = [
  "CAREER",
  "UNIVERSITY",
  "LUXURY APARTMENT",
  "HAPPINESS",
  "HEALTH",
  "WEALTH",
  "ONLINE LOBBIES",
  "VIDEO CHAT",
  "BEAT THE JONESES",
];

/* -------------------------------------------------------------------------- */
/*  Styles (keyframes + clipped-corner frames). Colors follow the accent      */
/*  chosen on the Appearance page via --accent-400 if you have one.           */
/* -------------------------------------------------------------------------- */
const CSS = `
.cp{--c1:var(--accent-600,#0d9488);--c2:#0891b2;--c3:#db2777;
  --cp-bg:#f4f7fb;--cp-surface:#ffffff;--cp-fg:#0f172a;--cp-muted:#475569;--cp-faint:#64748b;
  --cp-line:rgba(15,23,42,.16);--cp-tint:rgba(15,23,42,.04);--cp-btn-fg:#ffffff;--cp-blend:multiply;color-scheme:light}
.dark .cp{--c1:var(--accent-400,#2dd4bf);--c2:#00e5ff;--c3:#ff2e97;
  --cp-bg:#05060a;--cp-surface:#070a11;--cp-fg:#f5f5f4;--cp-muted:#d6d3d1;--cp-faint:#a8a29e;
  --cp-line:rgba(255,255,255,.14);--cp-tint:rgba(255,255,255,.04);--cp-btn-fg:#021014;--cp-blend:screen;color-scheme:dark}
.cp-cut{clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-frame{background:linear-gradient(135deg,var(--c1),var(--cp-tint) 45%,var(--c2));padding:1px;
  clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-inner{background:var(--cp-surface);
  clip-path:polygon(0 0,calc(100% - 15px) 0,100% 15px,100% 100%,15px 100%,0 calc(100% - 15px))}
.cp-glow{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c1) 55%,transparent))}
.cp-glow-c{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c2) 55%,transparent))}
.cp-btn{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:linear-gradient(90deg,var(--c1),var(--c2));color:var(--cp-btn-fg);font-weight:900;letter-spacing:.12em;
  text-transform:uppercase;transition:filter .2s,transform .2s}
.cp-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.cp-btn-ghost{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:var(--cp-tint);box-shadow:inset 0 0 0 1px var(--c2);color:var(--c2);font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;transition:background .2s}
.cp-btn-ghost:hover{background:color-mix(in oklab,var(--c2) 12%,transparent)}
.cp-scan{background:repeating-linear-gradient(0deg,color-mix(in oklab,var(--cp-fg) 4%,transparent) 0,color-mix(in oklab,var(--cp-fg) 4%,transparent) 1px,transparent 1px,transparent 3px)}
.cp-floor{background-image:linear-gradient(var(--c1) 1px,transparent 1px),linear-gradient(90deg,var(--c1) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:center top;
  animation:cp-grid 2.2s linear infinite;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%,#000);mask-image:linear-gradient(to bottom,transparent,#000 35%,#000)}
.cp-glitch{position:relative;display:inline-block;text-shadow:0 0 22px color-mix(in oklab,var(--c1) 55%,transparent)}
.cp-glitch::before,.cp-glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none}
.cp-glitch::before{color:var(--c2);animation:cp-glitch-a 5s infinite steps(1);mix-blend-mode:var(--cp-blend)}
.cp-glitch::after{color:var(--c3);animation:cp-glitch-b 5s infinite steps(1);mix-blend-mode:var(--cp-blend)}
.cp-noscroll{scrollbar-width:none}
.cp-noscroll::-webkit-scrollbar{display:none}
@keyframes cp-grid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes cp-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes cp-kenburns{from{transform:scale(1.03)}to{transform:scale(1.14)}}
@keyframes cp-fill{from{width:0}to{width:100%}}
@keyframes cp-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes cp-glitch-a{0%,90%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  91%{transform:translate(-5px,1px);clip-path:inset(8% 0 58% 0)}93%{transform:translate(4px,-1px);clip-path:inset(62% 0 6% 0)}
  96%{transform:translate(-3px,0);clip-path:inset(30% 0 42% 0)}}
@keyframes cp-glitch-b{0%,88%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  89%{transform:translate(5px,-1px);clip-path:inset(50% 0 20% 0)}92%{transform:translate(-4px,1px);clip-path:inset(12% 0 64% 0)}
  95%{transform:translate(3px,0);clip-path:inset(72% 0 4% 0)}}
@media (prefers-reduced-motion:reduce){.cp *,.cp *::before,.cp *::after{animation:none!important}}
`;

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

/** Video (hero only, while active) or photo if /public has it, else a neon placeholder. */
function SlideArt({
  slide,
  active,
  kenBurns,
  playVideo = false,
}: {
  slide: Slide;
  active: boolean;
  kenBurns: boolean;
  playVideo?: boolean;
}): React.JSX.Element {
  const [loaded, setLoaded] = useState<boolean>(false);
  const Icon = slide.icon;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);
    img.src = slide.src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [slide.src]);

  if (loaded) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
          style={{
            animation:
              active && kenBurns
                ? "cp-kenburns 9s ease-out forwards"
                : undefined,
            filter: "saturate(1.15) contrast(1.05)",
          }}
        />
        {playVideo && slide.video && active && (
          <video
            key={slide.video}
            src={slide.video}
            poster={slide.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "saturate(1.15) contrast(1.05)" }}
          />
        )}
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at 30% 18%, ${slide.tint}55, transparent 55%), radial-gradient(circle at 80% 85%, ${slide.tint}33, transparent 50%), linear-gradient(145deg,#0b1220,#05060a)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(${slide.tint}33 1px,transparent 1px),linear-gradient(90deg,${slide.tint}33 1px,transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className="h-1/3 w-1/3 max-h-40 max-w-40"
          strokeWidth={1.2}
          style={{
            color: slide.tint,
            filter: `drop-shadow(0 0 18px ${slide.tint})`,
          }}
        />
      </div>
    </div>
  );
}

function HudLabel({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--c2)]">
      {children}
    </p>
  );
}

function SectionHead({
  code,
  title,
}: {
  code: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="mb-8 text-left">
      <HudLabel>{`// ${code}`}</HudLabel>
      <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-[color:var(--cp-fg)] sm:text-4xl">
        {title}
      </h2>
      <div
        className="mt-3 h-px w-24"
        style={{ background: "linear-gradient(90deg,var(--c1),transparent)" }}
      />
    </div>
  );
}

function Frame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`cp-frame ${className}`}>
      <div className="cp-inner h-full">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero carousel                                                             */
/* -------------------------------------------------------------------------- */
const HERO_MS = 5500;

function HeroCarousel(): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const count = HERO_SLIDES.length;
  const autoplay = !reduceMotion && !paused;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );

  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(next, HERO_MS);
    return () => clearTimeout(id);
  }, [index, autoplay, next]);

  function onPanEnd(_: unknown, info: PanInfo): void {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  }

  const slide = HERO_SLIDES[index];

  return (
    <div
      className="cp-glow-c relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Frame>
        <motion.div
          onPanEnd={onPanEnd}
          style={{ touchAction: "pan-y" }}
          className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]"
          role="group"
          aria-roledescription="carousel"
          aria-label="Places on the map"
        >
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.src}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <SlideArt
                slide={s}
                active={i === index}
                kenBurns={!reduceMotion}
                playVideo={!reduceMotion}
              />
            </div>
          ))}

          {/* readability + HUD overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/30 to-transparent" />
          <div className="cp-scan pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/80">
            <span
              className="h-2 w-2 rounded-full bg-red-500"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            CAM_0{index + 1} · LIVE
          </div>
          <div className="pointer-events-none absolute right-4 top-4 font-mono text-[10px] tracking-widest text-white/80">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </div>

          {/* caption */}
          <div className="absolute inset-x-0 bottom-0 p-5 pb-12 text-left sm:p-6 sm:pb-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  className="font-mono text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: slide.tint }}
                >
                  {slide.tag}
                </p>
                <p className="mt-1 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  {slide.title}
                </p>
                <p className="mt-1 max-w-xs text-sm text-stone-300">
                  {slide.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* controls */}
          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  aria-label={`Go to slide ${i + 1}: ${s.title}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className="relative h-1.5 flex-1 overflow-hidden bg-white/15"
                >
                  {i === index && (
                    <span
                      key={`${index}-${autoplay}`}
                      className="absolute inset-y-0 left-0 block"
                      style={{
                        background: "var(--c1)",
                        width: autoplay ? undefined : "100%",
                        animation: autoplay
                          ? `cp-fill ${HERO_MS}ms linear forwards`
                          : undefined,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={next}
              className="flex h-8 w-8 items-center justify-center border border-white/20 text-white transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </Frame>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable image carousel (scroll-snap)                                     */
/* -------------------------------------------------------------------------- */
function ImageCarousel({
  slides,
  label,
  itemClass,
  aspectClass,
  intervalMs = 4000,
}: {
  slides: Slide[];
  label: string;
  itemClass: string;
  aspectClass: string;
  intervalMs?: number;
}): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState<boolean>(false);
  const autoplay = !reduceMotion && !paused;

  /** Scroll one card forward/back; wraps around at either end. */
  const step = useCallback((dir: 1 | -1): void => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    const atStart = el.scrollLeft <= 8;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => step(1), intervalMs);
    return () => clearInterval(id);
  }, [autoplay, intervalMs, step]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}
    >
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center border border-[color:var(--cp-line)] text-[color:var(--cp-fg)] transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center border border-[color:var(--cp-line)] text-[color:var(--cp-fg)] transition-colors hover:border-[color:var(--c1)] hover:text-[color:var(--c1)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={trackRef}
        className="cp-noscroll -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4"
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
      >
        {slides.map((g, i) => (
          <motion.article
            key={g.src}
            className={`group shrink-0 snap-start ${itemClass}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.08 }}
          >
            <Frame className="transition-transform duration-300 group-hover:-translate-y-1.5">
              <div
                className={`relative overflow-hidden text-left ${aspectClass}`}
              >
                <SlideArt slide={g} active={false} kenBurns={false} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/20 to-transparent" />
                <div className="cp-scan pointer-events-none absolute inset-0" />
                <span
                  className="absolute left-3 top-3 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm"
                  style={{ borderColor: g.tint, color: g.tint }}
                >
                  {g.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xl font-black uppercase leading-tight tracking-tight text-white">
                    {g.title}
                  </p>
                  <p className="mt-1 text-xs text-stone-300">{g.line}</p>
                </div>
              </div>
            </Frame>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function Home(): React.JSX.Element {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.prefetch("/lobby");
      router.prefetch("/local/new");
    }
  }, [isSignedIn, router]);

  const ticker = [...TICKER, ...TICKER];

  return (
    <main className="cp relative -m-4 min-h-screen overflow-hidden bg-[var(--cp-bg)] text-[color:var(--cp-fg)] lg:-m-6">
      <style>{CSS}</style>

      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full opacity-10 dark:opacity-25 blur-[120px]"
          style={{ background: "var(--c1)" }}
        />
        <div
          className="absolute -right-48 top-1/4 h-[520px] w-[520px] rounded-full opacity-10 dark:opacity-20 blur-[120px]"
          style={{ background: "var(--c3)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-[0.07] dark:opacity-15 blur-[120px]"
          style={{ background: "var(--c2)" }}
        />
        <div className="absolute inset-x-0 top-[38rem] h-[26rem] overflow-hidden opacity-[0.08] dark:opacity-[0.22]">
          <div className="cp-floor h-[160%] w-full" />
        </div>
        <div className="cp-scan absolute inset-0" />
      </div>

      {/* ------------------------------- HERO -------------------------------- */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c2)]"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            SYS//ONLINE · MULTIPLAYER
          </motion.div>

          <motion.h1
            className="text-6xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span
              className="cp-glitch text-[color:var(--c1)]"
              data-text="JONES"
            >
              JONES
            </span>
            <br />
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="FAST LANE"
            >
              FAST LANE
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base text-[color:var(--cp-muted)] sm:text-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Land the career, move into the luxury apartment, stay healthy and
            happy, and do it before your friends do. Walk the map, visit every
            location and race to the top.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {isSignedIn ? (
              <>
                <span className="cp-glow">
                  <button
                    type="button"
                    onClick={() => router.push("/lobby")}
                    className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
                  >
                    Online lobby <ArrowRight className="h-4 w-4" />
                  </button>
                </span>
                <Link
                  href="/local/new"
                  className="cp-btn-ghost inline-flex items-center px-8 py-4 text-sm"
                >
                  Solo / hot-seat
                </Link>
              </>
            ) : (
              <>
                <span className="cp-glow">
                  <SignInButton mode="modal" forceRedirectUrl="/lobby">
                    <button
                      type="button"
                      className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
                    >
                      Sign in to play <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                </span>
                <Link
                  href="/sign-up"
                  className="cp-btn-ghost inline-flex items-center px-8 py-4 text-sm"
                >
                  Create free account
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            className="mt-10 grid max-w-md grid-cols-4 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.6 },
              },
            }}
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                className="border-l-2 border-[color:var(--c1)] pl-3"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <p className="font-mono text-xl font-bold text-[color:var(--cp-fg)]">
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[color:var(--cp-muted)]">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <HeroCarousel />
        </motion.div>
      </section>

      {/* ------------------------------ TICKER ------------------------------- */}
      <div
        className="relative z-10 overflow-hidden border-y py-3"
        style={{
          borderColor: "color-mix(in oklab,var(--c1) 40%,transparent)",
          background: "color-mix(in oklab,var(--c1) 8%,var(--cp-bg))",
        }}
        aria-hidden="true"
      >
        <div
          className="flex w-max gap-10 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.3em]"
          style={{ animation: "cp-marquee 28s linear infinite" }}
        >
          {ticker.map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              <span
                className={
                  i % 2 === 0
                    ? "text-[color:var(--c1)]"
                    : "text-[color:var(--cp-muted)]"
                }
              >
                {t}
              </span>
              <span className="text-[color:var(--c3)]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ----------------------------- FEATURES ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="01 · FEATURES" title="Built to play together" />
        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="group text-left"
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6 }}
              >
                <Frame className="h-full transition-transform duration-300 group-hover:-translate-y-1.5">
                  <div className="flex h-full flex-col p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center border"
                        style={{
                          borderColor: "var(--c1)",
                          boxShadow:
                            "0 0 18px -4px var(--c1), inset 0 0 12px -6px var(--c1)",
                        }}
                      >
                        <Icon className="h-5 w-5 text-[color:var(--c1)]" />
                      </span>
                      <span className="font-mono text-xs tracking-widest text-[color:var(--cp-faint)]">
                        {f.code}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug text-[color:var(--cp-fg)]">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--cp-muted)]">
                      {f.description}
                    </p>
                  </div>
                </Frame>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ------------------------------ GALLERY ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="02 · LOCATIONS" title="Visit every stop" />
        <ImageCarousel
          slides={GALLERY}
          label="Game locations"
          itemClass="w-[72%] sm:w-[44%] lg:w-[28%]"
          aspectClass="aspect-[3/4]"
        />
      </section>

      {/* ----------------------------- HOW IT WORKS -------------------------- */}
      <section className="relative z-10 mx-auto mt-24 max-w-5xl px-6">
        <SectionHead code="03 · PROTOCOL" title="How it works" />
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg,transparent,var(--c1),var(--c2),transparent)",
              opacity: 0.5,
            }}
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                className="relative text-left"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <Frame className="h-full">
                  <div className="p-6 pt-12">
                    <Icon className="mb-3 h-5 w-5 text-[color:var(--c2)]" />
                    <h3 className="font-bold text-[color:var(--cp-fg)]">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--cp-muted)]">
                      {s.text}
                    </p>
                  </div>
                </Frame>
                {/* badge lives OUTSIDE the clipped Frame so it isn't cut off */}
                <div
                  className="absolute left-6 top-0 z-10 flex h-[72px] w-[72px] -translate-y-1/2 items-center justify-center border bg-[var(--cp-bg)] font-mono text-2xl font-black text-[color:var(--c1)]"
                  style={{
                    borderColor: "var(--c1)",
                    boxShadow: "0 0 24px -6px var(--c1)",
                  }}
                >
                  {s.n}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------- SHOWCASE ------------------------------ */}
      <section className="relative z-10 mx-auto mt-24 max-w-6xl px-6">
        <SectionHead code="04 · IN THE FIELD" title="Life in the fast lane" />
        <ImageCarousel
          slides={SHOWCASE}
          label="Life in the fast lane"
          itemClass="w-[88%] sm:w-[60%] lg:w-[46%]"
          aspectClass="aspect-[16/10]"
          intervalMs={4800}
        />
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="relative z-10 mx-auto mt-28 max-w-4xl px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Frame className="cp-glow">
            <div className="relative overflow-hidden px-6 py-14 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, color-mix(in oklab,var(--c1) 35%,transparent), transparent 60%)",
                }}
              />
              <HudLabel>{"// READY TO RACE"}</HudLabel>
              <h2 className="relative mt-3 text-3xl font-black uppercase tracking-tight text-[color:var(--cp-fg)] sm:text-5xl">
                Ready to beat the Joneses?
              </h2>
              <div className="relative mt-8">
                <span className="cp-glow inline-block">
                  <Link
                    href={isSignedIn ? "/lobby" : "/sign-up"}
                    className="cp-btn inline-flex items-center gap-2 px-10 py-4 text-sm"
                  >
                    Start playing <ArrowRight className="h-4 w-4" />
                  </Link>
                </span>
              </div>
            </div>
          </Frame>
        </motion.div>
      </section>
    </main>
  );
}
