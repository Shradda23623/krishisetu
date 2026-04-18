import catVegetables from "@/assets/cat-vegetables.png";
import catFruits from "@/assets/cat-fruits.png";
import catDairy from "@/assets/cat-dairy.png";
import catGrains from "@/assets/cat-grains.png";
import catDryfruits from "@/assets/cat-dryfruits.png";
import catSpices from "@/assets/cat-spices.png";
import catPickles from "@/assets/cat-pickles.png";
import catJaggery from "@/assets/cat-jaggery.png";
import catOils from "@/assets/cat-oils.png";

export type Category = "fruits" | "vegetables" | "dairy" | "grains" | "dryfruits" | "spices" | "pickles" | "jaggery" | "oils";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  quantity: number;
  description: string;
  images: string[];
  farmerId: string;
  farmerName: string;
  location: string;
  state: string;
  rating: number;
  reviews: number;
  organic: boolean;
}

export const categories: { id: Category; name: string; emoji: string; image: string }[] = [
  { id: "vegetables", name: "Vegetables", emoji: "🥬", image: catVegetables },
  { id: "fruits", name: "Fruits", emoji: "🍎", image: catFruits },
  { id: "dairy", name: "Dairy", emoji: "🥛", image: catDairy },
  { id: "grains", name: "Grains", emoji: "🌾", image: catGrains },
  { id: "dryfruits", name: "Dry Fruits", emoji: "🥜", image: catDryfruits },
  { id: "spices", name: "Spices", emoji: "🌶️", image: catSpices },
  { id: "pickles", name: "Pickles", emoji: "🫙", image: catPickles },
  { id: "jaggery", name: "Jaggery", emoji: "🍯", image: catJaggery },
  { id: "oils", name: "Cold-Pressed Oils", emoji: "🫒", image: catOils },
];
