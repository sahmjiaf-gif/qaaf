/**
 * Returns the base URL for all API calls.
 * In dev mode (same Express server), this is empty string → relative URL.
 * In production on Netlify, set VITE_API_URL to your backend URL (e.g. https://qaaf-api.onrender.com)
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
