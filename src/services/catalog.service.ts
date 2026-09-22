import { http } from './http-client';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  packSize: string | null;
  unit: string | null;
}

export const catalogService = {
  /** Typo-tolerant (trigram) search on code, name, brand and category. Empty q = first page. */
  search: (q?: string) => http.get<Product[]>(`/products${q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`),
  get: (id: string) => http.get<Product>(`/products/${id}`),
};
