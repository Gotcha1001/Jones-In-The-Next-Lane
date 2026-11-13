// lib/preload.ts
// One place that lists what to warm up when the app opens.

/** Must be ready before the app is shown (small, above-the-fold). */
export const CRITICAL_IMAGES: string[] = [
  "/universityimage.jpg",
  "/employment.jpg",
  "/rent.jpg",
  "/banklady.jpg",
  "/logo1.jpg",
  "/stone.png",
  "/stone2.png",
  "/avatars/avatar30.jpg", // DEFAULT_AVATAR
];

/** Loaded quietly AFTER the app is visible, so they're instant later. */
export const BACKGROUND_IMAGES: string[] = [
  "/mall.jpg",
  "/fastfood.jpg",
  "/datingoffice.jpg",
  "/meditate.jpg",
  "/home.jpg",
  "/leisure.jpg",
  "/boss.jpg",
  "/professor.jpg",
  "/gaming.jpg",
  "/tv.jpg",
  "/home2.jpg",
  "/home3.jpg",
  "/home4.jpg",
  "/grass.jpg",
];

/** Videos: hero ones first (landing page), the rest when idle. */
export const HERO_VIDEOS: string[] = [
  "/videos/universityvideo.mp4",
  "/videos/workplacevideo.mp4",
  "/videos/apartment.mp4",
  "/videos/bank.mp4",
];
export const BACKGROUND_VIDEOS: string[] = [
  "/videos/rentals.mp4",
  "/videos/leisure.mp4",
  "/videos/gaming.mp4",
  "/videos/tv.mp4",
];

// Keep references so the browser doesn't garbage-collect in-flight loads.
const keepAlive = new Set<unknown>();

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    keepAlive.add(img);
    const done = () => {
      keepAlive.delete(img);
      resolve(); // never reject: one missing file must not block the app
    };
    img.onload = () => {
      // decode() moves the expensive decode off the first paint
      img.decode?.().then(done, done) ?? done();
    };
    img.onerror = done;
    img.src = src;
  });
}

export function preloadVideo(src: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    keepAlive.add(v);
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    const done = () => {
      clearTimeout(t);
      v.oncanplaythrough = null;
      v.onerror = null;
      resolve(); // keep `v` referenced so the buffered data stays warm
    };
    const t = setTimeout(done, timeoutMs);
    v.oncanplaythrough = done;
    v.onerror = done;
    v.src = src;
    v.load();
  });
}

/** Runs tasks with limited parallelism so we don't choke the network. */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  onEach?: () => void,
): Promise<void> {
  let i = 0;
  const lane = async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
      onEach?.();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, lane),
  );
}
