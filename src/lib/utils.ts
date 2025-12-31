import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function normalizeEthiopianPhone(phone: string): string | null {
  let cleaned = phone.replace(/[\s-]/g, "");

  // +2519XXXXXXXX
  if (cleaned.startsWith("+251") && cleaned.length === 13) {
    return cleaned;
  }

  // 09XXXXXXXX
  if (cleaned.startsWith("09") && cleaned.length === 10) {
    return `+251${cleaned.slice(1)}`;
  }

  // 9XXXXXXXX
  if (cleaned.startsWith("9") && cleaned.length === 9) {
    return `+251${cleaned}`;
  }

  return null;
}

export function maskPhoneNumber(phone: string) {
  if (!phone) return "****";
  // Assuming format like 251911223344 or 0911223344
  const visible = phone.slice(-4);
  return `****${visible}`;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidEthiopianPhone(phone: string) {
  const phoneRegex = /^(\+251|0)?9\d{8}$/;
  return phoneRegex.test(phone);
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
