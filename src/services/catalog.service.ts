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
  /** Settings › Products — inactive ones included, with how many enquiries mention each. */
  listForSettings: () => http.get<ProductSettings[]>('/settings/products'),
  create: (input: ProductInput) => http.post<ProductSettings>('/products', input),
  update: (id: string, input: Partial<ProductInput> & { isActive?: boolean }) =>
    http.patch<ProductSettings>(`/products/${id}`, input),
};

export interface ProductSettings extends Product {
  /** off = hidden from the pickers; enquiries that already reference it keep it */
  isActive: boolean;
  enquiries: number;
}

export interface ProductInput {
  code: string;
  name: string;
  category?: string;
  brand?: string;
  packSize?: string;
  unit?: string;
}
