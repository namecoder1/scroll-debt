import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (minutesInput: number, format: 'short' | 'long' = 'short') => {
  const hours = Math.floor(minutesInput / 60);
  const minutes = Math.floor(minutesInput % 60);

  if (format === 'long') {
    if (minutesInput === 0) return '0';

    const hourLabel = hours === 1 ? 'h' : 'h';

    if (hours > 0 && minutes > 0) return `${hours} ${hourLabel} ${minutes} min`;
    if (hours > 0) return `${hours} ${hourLabel}`;
    return `${minutes} min`;
  }

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
  return `0:${minutes < 10 ? '0' : ''}${minutes}`;
}