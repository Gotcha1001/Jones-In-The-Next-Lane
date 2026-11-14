export interface ShopItem {
  readonly name: string;
  readonly price: number;
  readonly energy?: number;
  readonly happiness?: number;
  readonly eduBonus?: number;
  readonly timeBonus?: number;
  /** Path under /public, e.g. "/items/car.jpg". */
  readonly image: string;
  /** Food is consumed: it is not shown as a belonging in the apartment. */
  readonly food?: boolean;
}

export const shopItems: readonly ShopItem[] = [
  {
    name: "Fast Food",
    price: 10,
    energy: 20,
    happiness: 5,
    image: "/items/fast-food.jpg",
    food: true,
  },
  {
    name: "Restaurant Meal",
    price: 30,
    energy: 40,
    happiness: 15,
    image: "/items/restaurant-meal.jpg",
    food: true,
  },
  {
    name: "Basic Clothes",
    price: 50,
    happiness: 10,
    image: "/items/basic-clothes.jpg",
  },
  {
    name: "Nice Outfit",
    price: 120,
    happiness: 25,
    image: "/items/nice-outfit.jpg",
  },
  {
    name: "Smartphone",
    price: 200,
    happiness: 20,
    image: "/items/smartphone.jpg",
  },
  {
    name: "Computer",
    price: 800,
    happiness: 30,
    eduBonus: 5,
    image: "/items/computer.jpg",
  },
  {
    name: "Car",
    price: 2000,
    happiness: 40,
    timeBonus: 20,
    image: "/items/car.jpg",
  },
  {
    name: "Coffee",
    price: 5,
    energy: 10,
    happiness: 3,
    image: "/items/coffee.jpg",
    food: true,
  },
  {
    name: "Movie Ticket",
    price: 15,
    happiness: 15,
    image: "/items/movie-ticket.jpg",
  },
  {
    name: "Gym Membership",
    price: 100,
    energy: 30,
    happiness: 20,
    image: "/items/gym-membership.jpg",
  },
  {
    name: "Bike",
    price: 300,
    energy: 10,
    happiness: 25,
    timeBonus: 5,
    image: "/items/bike.jpg",
  },
  {
    name: "Books",
    price: 60,
    eduBonus: 10,
    happiness: 5,
    image: "/items/books.jpg",
  },
  {
    name: "Vacation Trip",
    price: 1000,
    happiness: 60,
    energy: 40,
    image: "/items/vacation-trip.jpg",
  },
  { name: "TV", price: 400, happiness: 20, image: "/items/tv.jpg" },
  { name: "Pet", price: 250, happiness: 35, image: "/items/pet.jpg" },
  {
    name: "Luxury Watch",
    price: 1500,
    happiness: 50,
    image: "/items/luxury-watch.jpg",
  },
  {
    name: "Gaming Console",
    price: 500,
    happiness: 40,
    image: "/items/gaming-console.jpg",
  },
];

export function findItem(name: string): ShopItem | undefined {
  return shopItems.find((i) => i.name === name);
}
