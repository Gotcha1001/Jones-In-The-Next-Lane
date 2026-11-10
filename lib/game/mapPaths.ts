// lib/game/mapPaths.ts
// Pure helpers for the map: the ring road around the city, the route between
// two places, interpolation along a route, and the decorative stones.
// This is the old Map.jsx / PathSystem.jsx path maths, cleaned up and typed.

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The ring road (percent coordinates). The last point is NOT repeated. */
export const RING: readonly Point[] = [
  { x: 15, y: 15 }, // top left
  { x: 50, y: 10 }, // top middle
  { x: 85, y: 15 }, // top right
  { x: 90, y: 50 }, // right middle
  { x: 85, y: 85 }, // bottom right
  { x: 50, y: 90 }, // bottom middle
  { x: 15, y: 85 }, // bottom left
  { x: 10, y: 50 }, // left middle
];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestRingIndex(point: Point): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  RING.forEach((ringPoint, index) => {
    const d = distance(point, ringPoint);
    if (d < bestDistance) {
      bestDistance = d;
      best = index;
    }
  });
  return best;
}

/** Walk from `from` to the ring, round the ring the short way, then off to `to`. */
export function buildRoute(from: Point, to: Point): Point[] {
  const n = RING.length;
  const start = nearestRingIndex(from);
  const end = nearestRingIndex(to);

  const forwardSteps = (end - start + n) % n;
  const goForward = forwardSteps <= n / 2;

  const route: Point[] = [from, RING[start]];
  let index = start;
  while (index !== end) {
    index = goForward ? (index + 1) % n : (index - 1 + n) % n;
    route.push(RING[index]);
  }
  route.push(to);

  // Drop consecutive duplicates so segment lengths are never zero.
  return route.filter((p, i) => i === 0 || distance(p, route[i - 1]) > 0.0001);
}

export function routeLength(route: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i += 1)
    total += distance(route[i - 1], route[i]);
  return total;
}

/** Position at progress t (0..1) along a route, constant speed. */
export function pointAlongRoute(route: readonly Point[], t: number): Point {
  if (route.length === 0) return { x: 50, y: 50 };
  if (route.length === 1 || t <= 0) return route[0];
  if (t >= 1) return route[route.length - 1];

  const target = routeLength(route) * t;
  let travelled = 0;
  for (let i = 1; i < route.length; i += 1) {
    const segment = distance(route[i - 1], route[i]);
    if (travelled + segment >= target) {
      const local = segment === 0 ? 0 : (target - travelled) / segment;
      return {
        x: route[i - 1].x + (route[i].x - route[i - 1].x) * local,
        y: route[i - 1].y + (route[i].y - route[i - 1].y) * local,
      };
    }
    travelled += segment;
  }
  return route[route.length - 1];
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* -------------------------------- stones -------------------------------- */

export interface Stone {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rotation: number;
  readonly opacity: number;
}

/** Small seeded PRNG so stones look the same on server and client (no hydration mismatch). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stones for the ring road plus a spoke from every place to its nearest ring point.
 * `density` is stones per percent-unit of path (lower on mobile).
 */
export function generateStones(
  places: readonly Point[],
  density: number,
): Stone[] {
  const random = mulberry32(1990);
  const stones: Stone[] = [];
  const seen = new Set<string>();

  const lay = (a: Point, b: Point): void => {
    const steps = Math.max(1, Math.floor(distance(a, b) * density));
    for (let step = 0; step <= steps; step += 1) {
      const p = step / steps;
      const x = a.x + (b.x - a.x) * p + (random() - 0.5) * 1.5;
      const y = a.y + (b.y - a.y) * p + (random() - 0.5) * 1.5;
      const key = `${Math.round(x * 4)},${Math.round(y * 4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      stones.push({
        key,
        x,
        y,
        size: 4 + random() * 2,
        rotation: random() * 360,
        opacity: 0.7 + random() * 0.3,
      });
    }
  };

  RING.forEach((point, i) => lay(point, RING[(i + 1) % RING.length]));
  places.forEach((place) => lay(place, RING[nearestRingIndex(place)]));
  return stones;
}
