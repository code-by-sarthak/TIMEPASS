import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POPULAR_INTERESTS = [
  "Gaming",
  "Technology",
  "Music",
  "Movies",
  "Travel",
  "Friendship",
  "Anime",
  "Fitness",
  "Art & Design",
  "Coding",
  "Books",
  "Cooking",
  "Photography",
  "Philosophy",
  "Languages",
  "Sports",
  "Startups",
  "Crypto & Web3"
];

export const POPULAR_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Japanese",
  "Chinese",
  "Portuguese",
  "Arabic",
  "Russian",
  "Korean",
  "Italian"
];

export const POPULAR_COUNTRIES = [
  "Global (Any)",
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "Spain",
  "Italy",
  "Netherlands",
  "Singapore"
];

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getRandomAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
}
