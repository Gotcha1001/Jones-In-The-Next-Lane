// lib/game/audio.ts
// One small audio manager that replaces the ~12 copy-pasted load/play/stop
// functions from the old audioManager.js. Two looping channels (music + walk)
// and one-shot click sounds. Framework-free; only call it from client code.

export type LoopChannel = "music" | "walk";

const DEFAULT_VOLUME: Readonly<Record<LoopChannel, number>> = {
  music: 0.45,
  walk: 0.6,
};

interface ActiveLoop {
  readonly src: string;
  readonly audio: HTMLAudioElement;
}

const active = new Map<LoopChannel, ActiveLoop>();
const fadeTimers = new WeakMap<HTMLAudioElement, number>();
const muteListeners = new Set<() => void>();
let muted = false;

/* ------------------------------ mute state ------------------------------ */

export function isMuted(): boolean {
  return muted;
}

export function subscribeMuted(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}

export function setMuted(next: boolean): void {
  muted = next;
  active.forEach(({ audio }) => {
    audio.muted = next;
  });
  muteListeners.forEach((listener) => listener());
}

/* -------------------------------- helpers -------------------------------- */

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function fade(
  audio: HTMLAudioElement,
  target: number,
  ms: number,
  onDone?: () => void,
): void {
  const previous = fadeTimers.get(audio);
  if (previous !== undefined) window.clearInterval(previous);

  const stepMs = 40;
  const steps = Math.max(1, Math.round(ms / stepMs));
  const delta = (target - audio.volume) / steps;
  let count = 0;

  const id = window.setInterval(() => {
    count += 1;
    audio.volume = clamp01(audio.volume + delta);
    if (count >= steps) {
      audio.volume = clamp01(target);
      window.clearInterval(id);
      fadeTimers.delete(audio);
      onDone?.();
    }
  }, stepMs);
  fadeTimers.set(audio, id);
}

/* --------------------------------- loops --------------------------------- */

/** Start (or keep playing) a looping sound on a channel. Passing null stops it. */
export function playLoop(
  channel: LoopChannel,
  src: string | null,
  volume: number = DEFAULT_VOLUME[channel],
): void {
  const current = active.get(channel);
  if (current && current.src === src) return;
  if (current) stopLoop(channel);
  if (!src) return;

  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0;
  audio.muted = muted;
  active.set(channel, { src, audio });

  audio
    .play()
    .then(() => fade(audio, volume, 600))
    .catch(() => {
      // Autoplay blocked until the player interacts – harmless, the next
      // click/travel starts it.
      if (active.get(channel)?.audio === audio) active.delete(channel);
    });
}

export function stopLoop(channel: LoopChannel, fadeMs = 350): void {
  const current = active.get(channel);
  if (!current) return;
  active.delete(channel);
  fade(current.audio, 0, fadeMs, () => current.audio.pause());
}

/* --------------------------------- clicks -------------------------------- */

export function playOnce(src: string, volume = 0.6): void {
  if (muted) return;
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}
