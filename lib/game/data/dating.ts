export interface DatingOption {
  readonly id: number;
  readonly name: string;
  readonly gender: "Male" | "Female";
  readonly personality: string;
  readonly interests: string;
  readonly compatibility: number;
  readonly image: string;
  readonly datePrice: number;
  readonly happinessBoost: number;
  readonly healthBoost: number;
}

export const datingOptions: readonly DatingOption[] = [
  // Girls
  {
    id: 1,
    name: "Alex",
    gender: "Female",
    personality: "Outgoing & Adventurous",
    interests: "Hiking, Photography, Travel",
    compatibility: 85,
    image:
      "https://img.freepik.com/free-photo/full-shot-woman-bdsm-aesthetics_23-2151117243.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 30,
    happinessBoost: 15,
    healthBoost: 5,
  },
  {
    id: 2,
    name: "Sophia",
    gender: "Female",
    personality: "Intellectual & Artistic",
    interests: "Reading, Museums, Film",
    compatibility: 75,
    image:
      "https://img.freepik.com/free-photo/high-fashion-look-glamor-stylish-beautiful-young-brunette-woman-model-summer-bright-hipster-cloth-sunglasses_158538-14149.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 25,
    happinessBoost: 12,
    healthBoost: 8,
  },
  {
    id: 3,
    name: "Emma",
    gender: "Female",
    personality: "Creative & Spontaneous",
    interests: "Music, Dancing, Cooking",
    compatibility: 90,
    image:
      "https://img.freepik.com/premium-photo/feeling-free-express-her-sensuality-beautiful-young-woman-sports-uniform-touching-her-cap_425904-8025.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 35,
    happinessBoost: 18,
    healthBoost: 7,
  },
  {
    id: 4,
    name: "Olivia",
    gender: "Female",
    personality: "Athletic & Competitive",
    interests: "Sports, Fitness, Outdoors",
    compatibility: 70,
    image:
      "https://img.freepik.com/free-photo/lifestyle-fashion-portrait-young-woman-with-perfect-fit-body-wearing-stylish-bright-summer-clothes-have-long-hairs-bright-makeup-having-fun-alone_291049-548.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 20,
    happinessBoost: 10,
    healthBoost: 10,
  },
  {
    id: 5,
    name: "Mia",
    gender: "Female",
    personality: "Calm & Thoughtful",
    interests: "Yoga, Meditation, Nature",
    compatibility: 88,
    image:
      "https://img.freepik.com/premium-photo/young-beautiful-sexy-woman-with-beautiful-slim-legs-black-denim-jacket-with-stylish-jeans-shorts-with-black-cap-leather-shoes-posing-city-urban-women-s-style-look_338491-10565.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 32,
    happinessBoost: 16,
    healthBoost: 12,
  },
  {
    id: 6,
    name: "Isabella",
    gender: "Female",
    personality: "Ambitious & Driven",
    interests: "Business, Politics, Technology",
    compatibility: 82,
    image:
      "https://img.freepik.com/free-photo/young-beautiful-woman-wearing-red-lingerie-bed-morning_158538-10345.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 40,
    happinessBoost: 14,
    healthBoost: 6,
  },
  {
    id: 7,
    name: "Charlotte",
    gender: "Female",
    personality: "Elegant & Sophisticated",
    interests: "Fashion, Fine Dining, Travel",
    compatibility: 78,
    image:
      "https://img.freepik.com/free-photo/blonde-girl-posing-white-with-closed-eyes_158538-8401.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 45,
    happinessBoost: 17,
    healthBoost: 4,
  },
  {
    id: 8,
    name: "Amelia",
    gender: "Female",
    personality: "Cheerful & Optimistic",
    interests: "Volunteering, Animals, Outdoor Activities",
    compatibility: 92,
    image:
      "https://img.freepik.com/premium-photo/young-lady-sitting-recliner-posing-stylish-outfit-warm-sunny-mood_273443-4826.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 28,
    happinessBoost: 19,
    healthBoost: 9,
  },
  {
    id: 9,
    name: "Harper",
    gender: "Female",
    personality: "Quirky & Alternative",
    interests: "Indie Music, Art Festivals, Vintage Shopping",
    compatibility: 86,
    image:
      "https://img.freepik.com/free-photo/fashion-portrait-smiling-brunette-blond-models-summer-casual-clothes-colorful-pink-wall_158538-14863.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 27,
    happinessBoost: 13,
    healthBoost: 7,
  },
  {
    id: 10,
    name: "Evelyn",
    gender: "Female",
    personality: "Kind & Nurturing",
    interests: "Cooking, Gardening, Children",
    compatibility: 89,
    image:
      "https://img.freepik.com/free-photo/indoor-bright-fashion-summer-portrait-stylish-happy-hipster-woman-smoking-having-fun-have-long-brunette-hairs-perfect-tanned-fit-slim-body-wearing-crop-top-round-sunglasses_291049-481.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 22,
    happinessBoost: 16,
    healthBoost: 11,
  }, // Boys
  {
    id: 11,
    name: "Liam",
    gender: "Male",
    personality: "Charming & Confident",
    interests: "Guitar, Rock Climbing, Travel",
    compatibility: 83,
    image:
      "https://img.freepik.com/premium-photo/portrait-body-wake-up-with-sexy-man-lying-shirtless-bedroom-his-home-morning-relax-arm-muscle-with-handsome-young-male-model-resting-topless-bed-sensuality_590464-173033.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 35,
    happinessBoost: 16,
    healthBoost: 6,
  },
  {
    id: 12,
    name: "Noah",
    gender: "Male",
    personality: "Intellectual & Reserved",
    interests: "Books, Chess, Classical Music",
    compatibility: 79,
    image:
      "https://img.freepik.com/premium-photo/shirtless-sexy-man-have-rest-alone-his-bedroom-morning-time_146671-28571.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 30,
    happinessBoost: 13,
    healthBoost: 7,
  },
  {
    id: 13,
    name: "Oliver",
    gender: "Male",
    personality: "Artistic & Sensitive",
    interests: "Painting, Poetry, Theater",
    compatibility: 87,
    image:
      "https://img.freepik.com/free-photo/young-handsome-muscled-fit-male-model-man-posing-studio-showing-his-abdominal-muscles-leather-jacket_158538-2234.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 28,
    happinessBoost: 15,
    healthBoost: 8,
  },
  {
    id: 14,
    name: "Ethan",
    gender: "Male",
    personality: "Athletic & Competitive",
    interests: "Basketball, Football, Fitness",
    compatibility: 76,
    image:
      "https://img.freepik.com/premium-photo/man-face-relax-shirtless-bed-bedroom-his-home-confident-serious-topless-male-model-laying-with-hot-guy-look-morning-skincare-body-wellness-after-wake-up_590464-180105.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 25,
    happinessBoost: 11,
    healthBoost: 14,
  },
  {
    id: 15,
    name: "Lucas",
    gender: "Male",
    personality: "Adventurous & Spontaneous",
    interests: "Surfing, Hiking, Photography",
    compatibility: 91,
    image:
      "https://img.freepik.com/free-photo/young-man-with-six-packs-posing-pink-wall_23-2148289260.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 38,
    happinessBoost: 18,
    healthBoost: 9,
  },
  {
    id: 16,
    name: "Mason",
    gender: "Male",
    personality: "Ambitious & Driven",
    interests: "Tech Startups, Finance, Networking",
    compatibility: 81,
    image:
      "https://img.freepik.com/free-photo/young-sportive-african-man-posing-black-wall_176420-2515.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 42,
    happinessBoost: 14,
    healthBoost: 5,
  },
  {
    id: 17,
    name: "Logan",
    gender: "Male",
    personality: "Laid-back & Humorous",
    interests: "Stand-up Comedy, Video Games, Craft Beer",
    compatibility: 84,
    image:
      "https://img.freepik.com/free-photo/man-bed-working-laptop-checking-mail-watching-movie-listening-music_1321-1007.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 26,
    happinessBoost: 17,
    healthBoost: 6,
  },
  {
    id: 18,
    name: "Elijah",
    gender: "Male",
    personality: "Kind & Thoughtful",
    interests: "Volunteering, Environmental Activism, Cooking",
    compatibility: 93,
    image:
      "https://img.freepik.com/free-photo/portrait-handsome-sunbathed-fashion-man-model-posing-summer-beach-with-white-sand-blue-sky_158538-1791.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 29,
    happinessBoost: 16,
    healthBoost: 12,
  },
  {
    id: 19,
    name: "Benjamin",
    gender: "Male",
    personality: "Sophisticated & Cultured",
    interests: "Wine Tasting, Jazz, International Cuisine",
    compatibility: 88,
    image:
      "https://img.freepik.com/premium-photo/young-healthy-good-looking-macho-man-model-athlete-hotel-indoor-pool_530697-44102.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 48,
    happinessBoost: 19,
    healthBoost: 7,
  },
  {
    id: 20,
    name: "Henry",
    gender: "Male",
    personality: "Creative & Passionate",
    interests: "Filmmaking, Music Production, Art",
    compatibility: 85,
    image:
      "https://img.freepik.com/premium-photo/handsome-man-standing-looking-camera-wearing-jean-vest-naked-torso_505281-105.jpg?uid=R194451028&ga=GA1.1.1480099583.1741975489&semt=ais_hybrid&w=740",
    datePrice: 32,
    happinessBoost: 15,
    healthBoost: 8,
  },
];
export function findDatingOption(id: number): DatingOption | undefined {
  return datingOptions.find((p) => p.id === id);
}
