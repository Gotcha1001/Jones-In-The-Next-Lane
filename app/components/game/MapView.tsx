// "use client";

// import { motion } from "framer-motion";
// import { locationIds, locations, TRAVEL_TIME } from "@/lib/game/data/locations";
// import { PlayerAvatar } from "../PlayerAvatar";
// import { useGame } from "./GameContext";

// const HUB = { x: 50, y: 50 };

// export function MapView() {
//   const { core, player, canAct, pending, run } = useGame();
//   const canTravel = canAct && !pending && player.timeLeft >= TRAVEL_TIME;

//   return (
//     <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-900/60 via-emerald-800/40 to-teal-900/60">
//       <svg
//         className="absolute inset-0 h-full w-full"
//         viewBox="0 0 100 100"
//         preserveAspectRatio="none"
//         aria-hidden
//       >
//         {locationIds.map((id) => (
//           <line
//             key={id}
//             x1={HUB.x}
//             y1={HUB.y}
//             x2={locations[id].mapX}
//             y2={locations[id].mapY}
//             stroke="rgba(255,255,255,0.25)"
//             strokeWidth="0.6"
//             strokeDasharray="1.5 1.5"
//           />
//         ))}
//         <circle cx={HUB.x} cy={HUB.y} r="2" fill="rgba(255,255,255,0.4)" />
//       </svg>

//       {locationIds.map((id) => {
//         const loc = locations[id];
//         const here = core.players.filter((p) => p.location === id);
//         const isCurrent = player.location === id;
//         return (
//           <button
//             key={id}
//             type="button"
//             disabled={!canTravel || isCurrent}
//             onClick={() => void run({ type: "moveTo", locationId: id })}
//             className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border px-1 py-1.5 text-center text-[10px] font-semibold leading-tight shadow transition sm:w-28 sm:text-xs ${
//               isCurrent
//                 ? "border-indigo-400 bg-indigo-600 text-white"
//                 : "border-white/20 bg-black/50 text-white hover:bg-black/70 disabled:opacity-60"
//             }`}
//             style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
//             title={isCurrent ? "You are here" : `Travel (${TRAVEL_TIME}⏱)`}
//           >
//             <span className="text-xl sm:text-2xl">{loc.emoji}</span>
//             <span>{loc.name}</span>
//             {here.length > 0 && (
//               <span className="mt-1 flex -space-x-2">
//                 {here.map((p) => (
//                   <motion.span
//                     key={p.seat}
//                     layoutId={`token-${p.seat}`}
//                     className={`rounded-full ring-2 ${p.seat === core.currentSeat ? "ring-amber-400" : "ring-white/40"}`}
//                   >
//                     <PlayerAvatar src={p.avatar} name={p.name} size={22} />
//                   </motion.span>
//                 ))}
//               </span>
//             )}
//           </button>
//         );
//       })}
//     </div>
//   );
// }
"use client";

import { motion } from "framer-motion";
import { locationIds, locations, TRAVEL_TIME } from "@/lib/game/data/locations";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";

const HUB = { x: 50, y: 50 };

export function MapView() {
  const { core, player, canAct, pending, run } = useGame();
  const canTravel = canAct && !pending && player.timeLeft >= TRAVEL_TIME;

  return (
    <div className="accent-card relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950 shadow-[0_0_24px_var(--accent-400)]">
      {/* Soft accent wash behind the hub */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-400),transparent_60%)] opacity-15" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {locationIds.map((id) => (
          <line
            key={id}
            x1={HUB.x}
            y1={HUB.y}
            x2={locations[id].mapX}
            y2={locations[id].mapY}
            stroke="var(--accent-400)"
            strokeOpacity="0.45"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
          />
        ))}
        <circle
          cx={HUB.x}
          cy={HUB.y}
          r="2"
          fill="var(--accent-400)"
          fillOpacity="0.8"
        />
      </svg>

      {locationIds.map((id) => {
        const loc = locations[id];
        const here = core.players.filter((p) => p.location === id);
        const isCurrent = player.location === id;
        return (
          <button
            key={id}
            type="button"
            disabled={!canTravel || isCurrent}
            onClick={() => void run({ type: "moveTo", locationId: id })}
            className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border px-1 py-1.5 text-center text-[10px] font-semibold leading-tight transition sm:w-28 sm:text-xs ${
              isCurrent
                ? "border-cyan-400 bg-cyan-600 text-white shadow-[0_0_18px_var(--accent-400)]"
                : "border-cyan-400/30 bg-black/50 text-white hover:border-cyan-400 hover:bg-black/70 hover:shadow-[0_0_14px_var(--accent-400)] disabled:opacity-60 disabled:hover:shadow-none"
            }`}
            style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
            title={isCurrent ? "You are here" : `Travel (${TRAVEL_TIME}⏱)`}
          >
            <span className="text-xl sm:text-2xl">{loc.emoji}</span>
            <span>{loc.name}</span>
            {here.length > 0 && (
              <span className="mt-1 flex -space-x-2">
                {here.map((p) => (
                  <motion.span
                    key={p.seat}
                    layoutId={`token-${p.seat}`}
                    className={`rounded-full ring-2 ${
                      p.seat === core.currentSeat
                        ? "ring-cyan-300 shadow-[0_0_10px_var(--accent-400)]"
                        : "ring-white/40"
                    }`}
                  >
                    <PlayerAvatar src={p.avatar} name={p.name} size={22} />
                  </motion.span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
