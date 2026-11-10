export interface ShopItem {
  readonly name: string;
  readonly price: number;
  readonly energy?: number;
  readonly happiness?: number;
  readonly eduBonus?: number;
  readonly timeBonus?: number;
  readonly image: string;
}

export const shopItems: readonly ShopItem[] = [
  { name: "Fast Food", price: 10, energy: 20, happiness: 5, image: "🍔" },
  {
    name: "Restaurant Meal",
    price: 30,
    energy: 40,
    happiness: 15,
    image: "🍝",
  },
  { name: "Basic Clothes", price: 50, happiness: 10, image: "👕" },
  { name: "Nice Outfit", price: 120, happiness: 25, image: "👔" },
  { name: "Smartphone", price: 200, happiness: 20, image: "📱" },
  { name: "Computer", price: 800, happiness: 30, eduBonus: 5, image: "💻" },
  { name: "Car", price: 2000, happiness: 40, timeBonus: 20, image: "🚗" },
  { name: "Coffee", price: 5, energy: 10, happiness: 3, image: "☕" },
  { name: "Movie Ticket", price: 15, happiness: 15, image: "🎬" },
  {
    name: "Gym Membership",
    price: 100,
    energy: 30,
    happiness: 20,
    image: "🏋️",
  },
  {
    name: "Bike",
    price: 300,
    energy: 10,
    happiness: 25,
    timeBonus: 5,
    image: "🚴",
  },
  { name: "Books", price: 60, eduBonus: 10, happiness: 5, image: "📚" },
  {
    name: "Vacation Trip",
    price: 1000,
    happiness: 60,
    energy: 40,
    image: "🏖️",
  },
  { name: "TV", price: 400, happiness: 20, image: "📺" },
  { name: "Pet", price: 250, happiness: 35, image: "🐶" },
  { name: "Luxury Watch", price: 1500, happiness: 50, image: "⌚" },
  { name: "Gaming Console", price: 500, happiness: 40, image: "🎮" },
];

export function findItem(name: string): ShopItem | undefined {
  return shopItems.find((i) => i.name === name);
}
