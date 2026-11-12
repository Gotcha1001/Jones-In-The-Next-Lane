// // components/game/CityMap.tsx
// "use client";
// /* eslint-disable @next/next/no-img-element */

// import {
//   useEffect,
//   useMemo,
//   useState,
//   useSyncExternalStore,
//   type CSSProperties,
// } from "react";
// import { motion } from "framer-motion";
// import { MapPin } from "lucide-react";
// import {
//   PLACE_BY_ID,
//   PLACES,
//   SOUNDS,
//   type LocationId,
// } from "@/lib/game/places";
// import { buildRoute, generateStones, type Point } from "@/lib/game/mapPaths";
// import { playLoop, playOnce, stopLoop } from "@/lib/game/audio";

// import SoundToggle from "./SoundToggle";
// import { useWalkAnimation } from "@/hooks/useWalkAnimation";

// export interface MapPlayer {
//   readonly name: string;
//   readonly avatarUrl: string;
// }

// export interface MapOtherPlayer extends MapPlayer {
//   readonly id: string;
//   readonly locationId: LocationId;
// }

// interface CityMapProps {
//   /** Where the local player currently is (from Convex / your game state). */
//   currentLocationId: LocationId;
//   player: MapPlayer;
//   /** Player clicked a different place: start the move in your game state. */
//   onTravel: (id: LocationId) => void;
//   /** Player clicked the place they're standing on: open it. */
//   onEnter: (id: LocationId) => void;
//   /** Walk animation finished at this place: open it. */
//   onArrive?: (id: LocationId) => void;
//   /** Block clicks (not your turn, out of time, ...). */
//   disabled?: boolean;
//   /** Shown in the status pill while disabled. */
//   disabledReason?: string;
//   otherPlayers?: readonly MapOtherPlayer[];
//   travelDurationMs?: number;
//   className?: string;
// }

// const MARKER_SIZE = "clamp(64px, 8.5vw, 124px)";

// const MOBILE_QUERY = "(max-width: 767px)";
// function subscribeMobile(callback: () => void): () => void {
//   const mql = window.matchMedia(MOBILE_QUERY);
//   mql.addEventListener("change", callback);
//   return () => mql.removeEventListener("change", callback);
// }
// function useIsMobile(): boolean {
//   return useSyncExternalStore(
//     subscribeMobile,
//     () => window.matchMedia(MOBILE_QUERY).matches,
//     () => false,
//   );
// }

// interface Walk {
//   readonly from: LocationId;
//   readonly to: LocationId;
// }

// function pos(id: LocationId): Point {
//   const place = PLACE_BY_ID[id];
//   return { x: place.mapX, y: place.mapY };
// }

// export default function CityMap({
//   currentLocationId,
//   player,
//   onTravel,
//   onEnter,
//   onArrive,
//   disabled = false,
//   disabledReason,
//   otherPlayers = [],
//   travelDurationMs = 5000,
//   className = "",
// }: CityMapProps) {
//   const isMobile = useIsMobile();
//   const [walk, setWalk] = useState<Walk | null>(null);
//   const [pending, setPending] = useState<LocationId | null>(null);
//   const [previousId, setPreviousId] = useState<LocationId>(currentLocationId);

//   // The player's location changed (their own click, a Convex update, a new
//   // turn...). Animate from where they were to where they are now.
//   if (previousId !== currentLocationId) {
//     setPreviousId(currentLocationId);
//     setPending(null);
//     setWalk({ from: previousId, to: currentLocationId });
//   }

//   const walking = walk !== null;
//   const route = useMemo(
//     () => (walk ? buildRoute(pos(walk.from), pos(walk.to)) : null),
//     [walk],
//   );

//   const frame = useWalkAnimation(route, travelDurationMs, () => {
//     if (!walk) return;
//     const arrivedAt = walk.to;
//     setWalk(null);
//     onArrive?.(arrivedAt);
//   });

//   // Footsteps while walking.
//   useEffect(() => {
//     if (walking) playLoop("walk", SOUNDS.walk);
//     else stopLoop("walk");
//     return () => stopLoop("walk");
//   }, [walking]);

//   // If a travel request never results in movement, stop highlighting the target.
//   useEffect(() => {
//     if (!pending) return;
//     const id = window.setTimeout(() => setPending(null), 4000);
//     return () => window.clearTimeout(id);
//   }, [pending]);

//   const stones = useMemo(
//     () =>
//       generateStones(
//         PLACES.map((p) => ({ x: p.mapX, y: p.mapY })),
//         isMobile ? 0.25 : 0.5,
//       ),
//     [isMobile],
//   );

//   const handleMarker = (id: LocationId): void => {
//     if (disabled || walking) return;
//     playOnce(SOUNDS.click);
//     if (id === currentLocationId) {
//       onEnter(id);
//     } else {
//       setPending(id);
//       onTravel(id);
//     }
//   };

//   const pulseId: LocationId | null = walk?.to ?? pending;

//   const status = walking
//     ? `Walking to ${PLACE_BY_ID[walk.to].name}…`
//     : disabled && disabledReason
//       ? disabledReason
//       : `You are at ${PLACE_BY_ID[currentLocationId].name} – tap it to go inside, or tap another place to walk there`;

//   return (
//     <section
//       aria-label="City map"
//       className={`relative mx-auto h-[72vh] min-h-[480px] w-full max-w-[1500px] overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10 lg:h-[calc(100vh-8rem)] ${className}`}
//       style={{
//         backgroundImage: "url('/logo1.jpg')",
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       {/* Stone overlay + road */}
//       <img
//         src="/stone2.png"
//         alt=""
//         aria-hidden
//         className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-90"
//       />
//       <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
//         {stones.map((stone) => (
//           <img
//             key={stone.key}
//             src="/stone.png"
//             alt=""
//             className="absolute object-contain"
//             style={{
//               left: `${stone.x}%`,
//               top: `${stone.y}%`,
//               width: `${stone.size}%`,
//               aspectRatio: "1",
//               opacity: stone.opacity,
//               transform: `translate(-50%, -50%) rotate(${stone.rotation}deg)`,
//             }}
//           />
//         ))}
//       </div>
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0 z-[6] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"
//       />

//       {/* HUD */}
//       <div className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-3">
//         <p
//           aria-live="polite"
//           className="flex max-w-[80%] items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur sm:text-sm"
//         >
//           <MapPin className="h-4 w-4 shrink-0 text-yellow-400" aria-hidden />
//           <span>{status}</span>
//         </p>
//         <SoundToggle />
//       </div>

//       {/* Big hero avatar in the middle */}
//       <motion.div
//         className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
//         animate={{ opacity: walking ? 0.25 : 1, scale: walking ? 0.9 : 1 }}
//         transition={{ duration: 0.6 }}
//       >
//         <img
//           src={player.avatarUrl}
//           alt={player.name}
//           className="h-52 w-36 rounded-xl border-4 border-yellow-400 object-cover shadow-[0_0_60px_rgba(250,204,21,0.35)] md:h-72 md:w-48 lg:h-[44vh] lg:w-64"
//         />
//         <div className="mt-2 rounded bg-gradient-to-r from-indigo-500 via-purple-900 to-black px-3 py-1 text-center font-semibold text-white">
//           {player.name}
//         </div>
//       </motion.div>

//       {/* Destination pulse */}
//       {pulseId && <DestinationPulse id={pulseId} />}

//       {/* Walking avatar */}
//       {walking && frame && (
//         <div
//           className="absolute z-30"
//           style={{
//             left: `${frame.position.x}%`,
//             top: `${frame.position.y}%`,
//             transform: "translate(-50%, -50%)",
//           }}
//         >
//           <motion.div
//             animate={{ y: [0, -8, 0] }}
//             transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
//             className="relative h-14 w-14 rounded-full border-2 border-yellow-400 bg-blue-600 shadow-lg shadow-yellow-400/40 md:h-16 md:w-16"
//           >
//             <img
//               src={player.avatarUrl}
//               alt={player.name}
//               className="h-full w-full rounded-full object-cover"
//             />
//           </motion.div>
//           <div className="mt-1 rounded bg-black/80 px-2 py-0.5 text-center text-xs text-white">
//             {player.name}
//           </div>
//         </div>
//       )}

//       {/* Place markers */}
//       {PLACES.map((place) => {
//         const isCurrent = !walking && place.id === currentLocationId;
//         const isTarget = walk?.to === place.id || pending === place.id;
//         const labelAbove = place.mapY > 75;
//         const here = otherPlayers.filter((o) => o.locationId === place.id);

//         const wrapperStyle: CSSProperties = {
//           left: `${place.mapX}%`,
//           top: `${place.mapY}%`,
//           transform: "translate(-50%, -50%)",
//           zIndex: isCurrent || isTarget ? 15 : 10,
//         };

//         return (
//           <div key={place.id} className="absolute" style={wrapperStyle}>
//             <button
//               type="button"
//               onClick={() => handleMarker(place.id)}
//               disabled={disabled || walking}
//               aria-label={`${isCurrent ? "Enter" : "Walk to"} ${place.name}`}
//               className={`group flex items-center gap-1.5 focus:outline-none disabled:cursor-not-allowed ${
//                 labelAbove ? "flex-col-reverse" : "flex-col"
//               }`}
//             >
//               <motion.span
//                 className={`relative block rounded-full shadow-xl ${
//                   isCurrent
//                     ? "bg-green-500"
//                     : isTarget
//                       ? "bg-amber-500"
//                       : "bg-indigo-500"
//                 }`}
//                 style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
//                 whileHover={disabled || walking ? undefined : { scale: 1.1 }}
//                 whileTap={disabled || walking ? undefined : { scale: 0.95 }}
//               >
//                 <img
//                   src={place.image}
//                   alt=""
//                   className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-full object-cover"
//                 />
//                 <span
//                   className={`absolute inset-0 rounded-full group-focus-visible:ring-4 group-focus-visible:ring-white ${
//                     isCurrent
//                       ? "animate-pulse border-4 border-yellow-400"
//                       : isTarget
//                         ? "border-4 border-amber-300"
//                         : "border-2 border-white"
//                   }`}
//                 />
//                 {isCurrent && (
//                   <img
//                     src={player.avatarUrl}
//                     alt=""
//                     className="absolute -right-2 -top-2 h-9 w-9 rounded-full border-2 border-yellow-400 object-cover shadow-lg md:h-11 md:w-11"
//                   />
//                 )}
//                 {here.length > 0 && (
//                   <span className="absolute -bottom-2 -left-2 flex -space-x-2">
//                     {here.slice(0, 3).map((other) => (
//                       <img
//                         key={other.id}
//                         src={other.avatarUrl}
//                         alt={other.name}
//                         title={other.name}
//                         className="h-7 w-7 rounded-full border-2 border-white object-cover shadow"
//                       />
//                     ))}
//                   </span>
//                 )}
//               </motion.span>
//               <span className="gradient-background2 rounded px-2 py-1 text-center text-xs font-semibold text-white shadow-md sm:text-sm">
//                 {isCurrent ? `Enter ${place.name} ▸` : place.name}
//               </span>
//             </button>
//           </div>
//         );
//       })}
//     </section>
//   );
// }

// function DestinationPulse({ id }: { id: LocationId }) {
//   const place = PLACE_BY_ID[id];
//   return (
//     <div
//       aria-hidden
//       className="pointer-events-none absolute z-[9]"
//       style={{
//         left: `${place.mapX}%`,
//         top: `${place.mapY}%`,
//         transform: "translate(-50%, -50%)",
//       }}
//     >
//       <span className="absolute -inset-6 animate-ping rounded-full bg-yellow-400/30" />
//       <span className="absolute -inset-3 animate-ping rounded-full bg-yellow-400/50" />
//     </div>
//   );
// }

// components/game/CityMap.tsx
"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import {
  PLACE_BY_ID,
  PLACES,
  SOUNDS,
  type LocationId,
} from "@/lib/game/places";
import { buildRoute, generateStones, type Point } from "@/lib/game/mapPaths";
import { playLoop, playOnce, stopLoop } from "@/lib/game/audio";

import SoundToggle from "./SoundToggle";
import { useWalkAnimation } from "@/hooks/useWalkAnimation";

export interface MapPlayer {
  readonly name: string;
  readonly avatarUrl: string;
}

export interface MapOtherPlayer extends MapPlayer {
  readonly id: string;
  readonly locationId: LocationId;
}

interface CityMapProps {
  /** Where the local player currently is (from Convex / your game state). */
  currentLocationId: LocationId;
  player: MapPlayer;
  /** Player clicked a different place: start the move in your game state. */
  onTravel: (id: LocationId) => void;
  /** Player clicked the place they're standing on: open it. */
  onEnter: (id: LocationId) => void;
  /** Walk animation finished at this place: open it. */
  onArrive?: (id: LocationId) => void;
  /** Block clicks (not your turn, out of time, ...). */
  disabled?: boolean;
  /** Shown in the status pill while disabled. */
  disabledReason?: string;
  otherPlayers?: readonly MapOtherPlayer[];
  travelDurationMs?: number;
  className?: string;
}

const MARKER_SIZE = "clamp(64px, 8.5vw, 124px)";

const MOBILE_QUERY = "(max-width: 767px)";
function subscribeMobile(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

interface Walk {
  readonly from: LocationId;
  readonly to: LocationId;
}

function pos(id: LocationId): Point {
  const place = PLACE_BY_ID[id];
  return { x: place.mapX, y: place.mapY };
}

export default function CityMap({
  currentLocationId,
  player,
  onTravel,
  onEnter,
  onArrive,
  disabled = false,
  disabledReason,
  otherPlayers = [],
  travelDurationMs = 5000,
  className = "",
}: CityMapProps) {
  const isMobile = useIsMobile();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [pending, setPending] = useState<LocationId | null>(null);
  const [previousId, setPreviousId] = useState<LocationId>(currentLocationId);

  // The player's location changed (their own click, a Convex update, a new
  // turn...). Animate from where they were to where they are now.
  if (previousId !== currentLocationId) {
    setPreviousId(currentLocationId);
    setPending(null);
    setWalk({ from: previousId, to: currentLocationId });
  }

  const walking = walk !== null;
  const route = useMemo(
    () => (walk ? buildRoute(pos(walk.from), pos(walk.to)) : null),
    [walk],
  );

  const frame = useWalkAnimation(route, travelDurationMs, () => {
    if (!walk) return;
    const arrivedAt = walk.to;
    setWalk(null);
    onArrive?.(arrivedAt);
  });

  // Footsteps while walking.
  useEffect(() => {
    if (walking) playLoop("walk", SOUNDS.walk);
    else stopLoop("walk");
    return () => stopLoop("walk");
  }, [walking]);

  // If a travel request never results in movement, stop highlighting the target.
  useEffect(() => {
    if (!pending) return;
    const id = window.setTimeout(() => setPending(null), 4000);
    return () => window.clearTimeout(id);
  }, [pending]);

  const stones = useMemo(
    () =>
      generateStones(
        PLACES.map((p) => ({ x: p.mapX, y: p.mapY })),
        isMobile ? 0.25 : 0.5,
      ),
    [isMobile],
  );

  const handleMarker = (id: LocationId): void => {
    if (disabled || walking) return;
    playOnce(SOUNDS.click);
    if (id === currentLocationId) {
      onEnter(id);
    } else {
      setPending(id);
      onTravel(id);
    }
  };

  const pulseId: LocationId | null = walk?.to ?? pending;

  const status = walking
    ? `Walking to ${PLACE_BY_ID[walk.to].name}…`
    : disabled && disabledReason
      ? disabledReason
      : `You are at ${PLACE_BY_ID[currentLocationId].name} – tap it to go inside, or tap another place to walk there`;

  return (
    <section
      aria-label="City map"
      className={`relative mx-auto h-[72vh] min-h-[480px] w-full max-w-[1500px] overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-cyan-400/40 shadow-[0_0_30px_var(--accent-400)] lg:h-[calc(100vh-8rem)] ${className}`}
      style={{
        backgroundImage: "url('/logo1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Stone overlay + road */}
      <img
        src="/stone2.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-90"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
        {stones.map((stone) => (
          <img
            key={stone.key}
            src="/stone.png"
            alt=""
            className="absolute object-contain"
            style={{
              left: `${stone.x}%`,
              top: `${stone.y}%`,
              width: `${stone.size}%`,
              aspectRatio: "1",
              opacity: stone.opacity,
              transform: `translate(-50%, -50%) rotate(${stone.rotation}deg)`,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"
      />

      {/* HUD */}
      <div className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-3">
        <p
          aria-live="polite"
          className="flex max-w-[80%] items-center gap-2 rounded-full border border-cyan-400/40 bg-black/60 px-4 py-2 text-xs font-medium text-cyan-50 shadow-[0_0_14px_var(--accent-400)] backdrop-blur sm:text-sm"
        >
          <MapPin className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          <span>{status}</span>
        </p>
        <SoundToggle />
      </div>

      {/* Big hero avatar in the middle */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        animate={{ opacity: walking ? 0.25 : 1, scale: walking ? 0.9 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <img
          src={player.avatarUrl}
          alt={player.name}
          className="h-52 w-36 rounded-xl border-4 border-cyan-400 object-cover shadow-[0_0_60px_var(--accent-400)] md:h-72 md:w-48 lg:h-[44vh] lg:w-64"
        />
        <div className="mt-2 rounded bg-gradient-to-r from-cyan-500 via-cyan-900 to-black px-3 py-1 text-center font-semibold text-white">
          {player.name}
        </div>
      </motion.div>

      {/* Destination pulse */}
      {pulseId && <DestinationPulse id={pulseId} />}

      {/* Walking avatar */}
      {walking && frame && (
        <div
          className="absolute z-30"
          style={{
            left: `${frame.position.x}%`,
            top: `${frame.position.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-14 w-14 rounded-full border-2 border-cyan-400 bg-cyan-700 shadow-[0_0_18px_var(--accent-400)] md:h-16 md:w-16"
          >
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="h-full w-full rounded-full object-cover"
            />
          </motion.div>
          <div className="mt-1 rounded border border-cyan-400/30 bg-black/80 px-2 py-0.5 text-center text-xs text-cyan-50">
            {player.name}
          </div>
        </div>
      )}

      {/* Place markers */}
      {PLACES.map((place) => {
        const isCurrent = !walking && place.id === currentLocationId;
        const isTarget = walk?.to === place.id || pending === place.id;
        const labelAbove = place.mapY > 75;
        const here = otherPlayers.filter((o) => o.locationId === place.id);

        const wrapperStyle: CSSProperties = {
          left: `${place.mapX}%`,
          top: `${place.mapY}%`,
          transform: "translate(-50%, -50%)",
          zIndex: isCurrent || isTarget ? 15 : 10,
        };

        return (
          <div key={place.id} className="absolute" style={wrapperStyle}>
            <button
              type="button"
              onClick={() => handleMarker(place.id)}
              disabled={disabled || walking}
              aria-label={`${isCurrent ? "Enter" : "Walk to"} ${place.name}`}
              className={`group flex items-center gap-1.5 focus:outline-none disabled:cursor-not-allowed ${
                labelAbove ? "flex-col-reverse" : "flex-col"
              }`}
            >
              <motion.span
                className={`relative block rounded-full ${
                  isCurrent
                    ? "bg-cyan-400 shadow-[0_0_28px_var(--accent-400)]"
                    : isTarget
                      ? "bg-cyan-200 shadow-[0_0_22px_var(--accent-400)]"
                      : "bg-cyan-800 shadow-[0_0_12px_var(--accent-400)]"
                }`}
                style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
                whileHover={disabled || walking ? undefined : { scale: 1.1 }}
                whileTap={disabled || walking ? undefined : { scale: 0.95 }}
              >
                <img
                  src={place.image}
                  alt=""
                  className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-full object-cover"
                />
                <span
                  className={`absolute inset-0 rounded-full group-focus-visible:ring-4 group-focus-visible:ring-cyan-200 ${
                    isCurrent
                      ? "animate-pulse border-4 border-cyan-300"
                      : isTarget
                        ? "border-4 border-cyan-200"
                        : "border-2 border-cyan-400/70"
                  }`}
                />
                {isCurrent && (
                  <img
                    src={player.avatarUrl}
                    alt=""
                    className="absolute -right-2 -top-2 h-9 w-9 rounded-full border-2 border-cyan-400 object-cover shadow-[0_0_12px_var(--accent-400)] md:h-11 md:w-11"
                  />
                )}
                {here.length > 0 && (
                  <span className="absolute -bottom-2 -left-2 flex -space-x-2">
                    {here.slice(0, 3).map((other) => (
                      <img
                        key={other.id}
                        src={other.avatarUrl}
                        alt={other.name}
                        title={other.name}
                        className="h-7 w-7 rounded-full border-2 border-white object-cover shadow"
                      />
                    ))}
                  </span>
                )}
              </motion.span>
              <span className="rounded border border-cyan-400/40 bg-black/70 px-2 py-1 text-center text-xs font-semibold text-cyan-50 shadow-[0_0_10px_var(--accent-400)] backdrop-blur-sm transition group-hover:border-cyan-400 sm:text-sm">
                {isCurrent ? `Enter ${place.name} ▸` : place.name}
              </span>
            </button>
          </div>
        );
      })}
    </section>
  );
}

function DestinationPulse({ id }: { id: LocationId }) {
  const place = PLACE_BY_ID[id];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[9]"
      style={{
        left: `${place.mapX}%`,
        top: `${place.mapY}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span className="absolute -inset-6 animate-ping rounded-full bg-cyan-400/30" />
      <span className="absolute -inset-3 animate-ping rounded-full bg-cyan-400/50" />
    </div>
  );
}
