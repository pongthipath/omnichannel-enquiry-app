import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogService, ProductInput } from '../../services/catalog.service';
import { CustomerProfile, customerService, UpdateCustomerInput } from '../../services/customer.service';
import { DashboardPeriod, dashboardService } from '../../services/dashboard.service';
import { TagInput, tagService } from '../../services/tag.service';
import { qk } from './keys';

// ---------- tags ----------

export function useTags() {
  return useQuery({ queryKey: qk.tags, queryFn: tagService.list, staleTime: 60_000 });
}

export function useTagMutations() {
  const qc = useQueryClient();
  const done = () => {
    void qc.invalidateQueries({ queryKey: qk.tags });
    void qc.invalidateQueries({ queryKey: qk.enquiries });
  };
  return {
    create: useMutation({ mutationFn: (input: TagInput) => tagService.create(input), onSuccess: done }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<TagInput> }) => tagService.update(id, input),
      onSuccess: done,
    }),
    remove: useMutation({ mutationFn: (id: string) => tagService.remove(id), onSuccess: done }),
  };
}

// ---------- dashboard ----------

export function useDashboard(days?: DashboardPeriod, enabled = true) {
  return useQuery({ queryKey: qk.dashboard(days), queryFn: () => dashboardService.summary(days), enabled });
}

// ---------- customers ----------

export function useCustomers(q: string, enabled = true) {
  return useQuery({
    queryKey: qk.customerList(q),
    queryFn: () => customerService.list(q),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined | null) {
  return useQuery({ queryKey: qk.customer(id ?? ''), queryFn: () => customerService.get(id!), enabled: Boolean(id) });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => customerService.update(id, input),
    onSuccess: (profile: CustomerProfile) => {
      qc.setQueryData(qk.customer(id), profile);
      void qc.invalidateQueries({ queryKey: qk.customers });
      void qc.invalidateQueries({ queryKey: qk.enquiries }); // company name on list rows
    },
  });
}

// ---------- products ----------

export function useProducts(q: string) {
  return useQuery({
    queryKey: qk.products(q),
    queryFn: () => catalogService.search(q),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useProduct(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.product(id ?? ''),
    queryFn: () => catalogService.get(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

/** Settings › Products — the management list, inactive products included. */
export function useProductsSettings(enabled = true) {
  return useQuery({ queryKey: qk.productsSettings, queryFn: catalogService.listForSettings, enabled });
}

export function useProductMutations() {
  const qc = useQueryClient();
  // the pickers read a different key, so refresh both after a write
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: qk.productsSettings });
    void qc.invalidateQueries({ queryKey: ['products'] });
  };
  return {
    create: useMutation({ mutationFn: (input: ProductInput) => catalogService.create(input), onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> & { isActive?: boolean } }) =>
        catalogService.update(id, input),
      onSuccess: refresh,
    }),
  };
}
