// Centralized API base URL helper
// Prefer environment configuration; fallback to relative '/api' to avoid hardcoded hosts
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${normalizedPath}`;
}


