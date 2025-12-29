import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fisher-Yates shuffle for unbiased random selection
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format currency to ETB
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
  }).format(amount);
}

/**
 * Simple email validation
 */
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Ethiopian phone number validation
 * Supports: +251..., 09..., 07...
 */
export function isValidEthiopianPhone(phone: string) {
  // Supports: +251..., 09..., 07..., 9..., 7...
  return /^(\+251|0)?([79]\d{8})$/.test(phone);
}

/**
 * Mask phone number for public display
 * Format: +251 9********09
 */
export function maskPhoneNumber(phone: string | null) {
  if (!phone) return "N/A";
  const clean = phone.replace(/\D/g, "");
  
  if (clean.length === 10 && clean.startsWith("0")) {
    return `+251 ${clean.substring(1, 2)}********${clean.substring(8)}`;
  }
  
  if (clean.length === 12 && clean.startsWith("251")) {
    return `+251 ${clean.substring(3, 4)}********${clean.substring(10)}`;
  }

  if (clean.length === 9) {
    return `+251 ${clean.substring(0, 1)}********${clean.substring(7)}`;
  }

  return "********" + clean.slice(-2);
}
