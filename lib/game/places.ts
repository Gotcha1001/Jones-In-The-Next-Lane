// lib/game/places.ts
// Single source of truth for every place on the map: position, artwork,
// header video, background music and the NPC who greets the player.
// Everything points at files that already exist in /public (from the old repo).
//
// IMPORTANT: if your new project already uses different location ids,
// change the LocationId union below to match them – nothing else needs to move.

export type LocationId =
  | "rentoffice"
  | "apartment"
  | "university"
  | "employmentOffice"
  | "workplace"
  | "mall"
  | "leisureCenter"
  | "bank"
  | "fastFood"
  | "datingOffice"
  | "healingCentre";

export interface PlaceMedia {
  /** Header video. Local file where one exists; remote clips fall back to the image if they fail. */
  readonly video: string | null;
  /** Looping background music while the modal is open. null = silence. */
  readonly music: string | null;
  /** NPC / hero portrait shown overlapping the header. */
  readonly portrait: string;
  readonly portraitAlt: string;
  /** Tailwind gradient used to tint the header (full static class strings). */
  readonly accent: string;
  /** Line the NPC says when you arrive. */
  readonly greeting: string;
}

export interface Place {
  readonly id: LocationId;
  readonly name: string;
  readonly description: string;
  /** Marker image on the map + poster for the header. */
  readonly image: string;
  /** Position on the map in percent (0-100). */
  readonly mapX: number;
  readonly mapY: number;
  readonly media: PlaceMedia;
}

export const SOUNDS = {
  click: "/sounds/click.mp3",
  walk: "/sounds/walk.mp3",
} as const;

export const PLACES: readonly Place[] = [
  {
    id: "rentoffice",
    name: "Rental Office",
    description: "Manage your apartment rental and pay your rent here.",
    image: "/rent.jpg",
    mapX: 90,
    mapY: 13,
    media: {
      video: "/videos/rentals.mp4",
      music: null,
      portrait: "/rent.jpg",
      portraitAlt: "Rental agent",
      accent: "from-sky-500/70 to-indigo-900/70",
      greeting:
        "Keys, leases and late fees – let's keep a roof over your head.",
    },
  },
  {
    id: "apartment",
    name: "Apartment",
    description: "Your humble abode.",
    image:
      "https://img.freepik.com/free-photo/3d-electric-car-building_23-2148972401.jpg",
    mapX: 45,
    mapY: 14,
    media: {
      video: "/videos/apartment.mp4",
      music: "/sounds/apartment.mp3",
      portrait: "/home.jpg",
      portraitAlt: "Your apartment",
      accent: "from-amber-500/70 to-rose-900/70",
      greeting: "Home sweet home. Rest up, you've earned it.",
    },
  },
  {
    id: "university",
    name: "University",
    description: "Increase your education.",
    image:
      "https://img.freepik.com/free-photo/hercules-hall-surrounded-by-greenery-sunlight-daytime-munich-germany_181624-17876.jpg",
    mapX: 15,
    mapY: 15,
    media: {
      video: "/videos/universityvideo.mp4",
      music: "/sounds/universitymusic.mp3",
      portrait: "/professor.jpg",
      portraitAlt: "The Professor",
      accent: "from-emerald-500/70 to-teal-900/70",
      greeting:
        "Knowledge is the best investment you can make. Shall we begin?",
    },
  },
  {
    id: "employmentOffice",
    name: "Employment Office",
    description: "Find a job.",
    image: "https://img.freepik.com/premium-photo/office-building_16442-13.jpg",
    mapX: 88,
    mapY: 65,
    media: {
      video:
        "https://cdn.pixabay.com/video/2023/11/25/190661-888327729_tiny.mp4",
      music: "/sounds/employment.mp3",
      portrait:
        "https://img.freepik.com/premium-photo/office-building_16442-13.jpg",
      portraitAlt: "Employment Office",
      accent: "from-blue-500/70 to-slate-900/70",
      greeting:
        "Looking for work? We've got openings – if you've got the credentials.",
    },
  },
  {
    id: "workplace",
    name: "Workplace",
    description: "Earn money at your job.",
    image:
      "https://img.freepik.com/premium-photo/midsection-businessman-using-laptop-table_1048944-3345650.jpg",
    mapX: 88,
    mapY: 40,
    media: {
      video: "/videos/workplacevideo.mp4",
      music: "/sounds/workmusic.mp3",
      portrait: "/boss.jpg",
      portraitAlt: "Your boss",
      accent: "from-zinc-500/70 to-slate-900/70",
      greeting: "Good, you're here. Let's see some results today.",
    },
  },
  {
    id: "mall",
    name: "Shopping Mall",
    description: "Buy items to improve your life.",
    image:
      "https://img.freepik.com/free-photo/cinematic-style-mall_23-2151551178.jpg",
    mapX: 15,
    mapY: 65,
    media: {
      video:
        "https://videos.pexels.com/video-files/2845487/2845487-uhd_2560_1440_30fps.mp4",
      music: "/sounds/mallmusic.mp3",
      portrait:
        "https://img.freepik.com/free-photo/cinematic-style-mall_23-2151551178.jpg",
      portraitAlt: "Shopping mall",
      accent: "from-fuchsia-500/70 to-purple-900/70",
      greeting: "Everything you need – and a few things you don't.",
    },
  },
  {
    id: "leisureCenter",
    name: "Leisure Center",
    description: "Have fun and relax.",
    image:
      "https://img.freepik.com/free-photo/view-backyard-garden-digital-art-style_23-2151488199.jpg",
    mapX: 20,
    mapY: 88,
    media: {
      video: "/videos/leisure.mp4",
      music: "/sounds/leisuresound.mp3",
      portrait: "/gaming.jpg",
      portraitAlt: "Leisure Center",
      accent: "from-cyan-500/70 to-blue-900/70",
      greeting: "Kick back. Happiness doesn't boost itself.",
    },
  },
  {
    id: "bank",
    name: "Python Bank",
    description: "Manage your finances and save for the future.",
    image:
      "https://img.freepik.com/free-photo/view-3d-building-architecture-lawyer-s-day-celebration_23-2151023422.jpg",
    mapX: 88,
    mapY: 88,
    media: {
      video: "/videos/bank.mp4",
      music: "/sounds/bankmusic.mp3",
      portrait: "/banklady.jpg",
      portraitAlt: "Bank teller",
      accent: "from-indigo-500/70 to-purple-900/70",
      greeting:
        "Welcome to Python National Bank! Remember, saving is the first step toward your goals.",
    },
  },
  {
    id: "fastFood",
    name: "Python Burgers",
    description: "Grab a quick bite to eat.",
    image:
      "https://img.freepik.com/free-photo/delicious-burger-outdoors_23-2150902260.jpg",
    mapX: 15,
    mapY: 40,
    media: {
      video:
        "https://cdn.pixabay.com/video/2021/04/24/72025-543403489_tiny.mp4",
      music: "/sounds/fastfood.mp3",
      portrait:
        "https://img.freepik.com/free-photo/delicious-burger-outdoors_23-2150902260.jpg",
      portraitAlt: "Python Burgers",
      accent: "from-orange-500/70 to-red-900/70",
      greeting: "Hot, fast and slightly questionable. What'll it be?",
    },
  },
  {
    id: "datingOffice",
    name: "Dating Office",
    description: "Find your special someone.",
    image:
      "https://img.freepik.com/free-photo/3d-heart-shape-city_23-2150965369.jpg",
    mapX: 69,
    mapY: 15,
    media: {
      video:
        "https://cdn.pixabay.com/video/2023/02/05/149481-796105914_tiny.mp4",
      music: "/sounds/datingmusic.mp3",
      portrait: "/datingoffice.jpg",
      portraitAlt: "Dating Office host",
      accent: "from-pink-500/70 to-rose-900/70",
      greeting: "Love is just a good match away. Let's find yours.",
    },
  },
  {
    id: "healingCentre",
    name: "Zen Healing Centre",
    description: "Boost your health and happiness.",
    image:
      "https://img.freepik.com/free-photo/adult-holding-ball-light_23-2149711538.jpg",
    mapX: 57,
    mapY: 88,
    media: {
      video:
        "https://cdn.pixabay.com/video/2023/11/24/190522-888122666_large.mp4",
      music: "/sounds/healing.mp3",
      portrait: "/meditate.jpg",
      portraitAlt: "Healing centre guide",
      accent: "from-violet-500/70 to-indigo-900/70",
      greeting: "Breathe in. Breathe out. Your body will thank you.",
    },
  },
];

export const PLACE_BY_ID: Readonly<Record<LocationId, Place>> = PLACES.reduce(
  (acc, place) => ({ ...acc, [place.id]: place }),
  {} as Record<LocationId, Place>,
);
