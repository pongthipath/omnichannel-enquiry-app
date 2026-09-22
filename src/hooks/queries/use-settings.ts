import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DepartmentInput, settingsService, StaffInput } from '../../services/settings.service';
import { qk } from './keys';

export function useDepartments() {
  return useQuery({ queryKey: qk.departments, queryFn: settingsService.departments, staleTime: 5 * 60_000 });
}

export function useDepartmentsSettings() {
  return useQuery({ queryKey: qk.departmentsSettings, queryFn: settingsService.departmentsForSettings });
}

export function useRoles() {
  return useQuery({ queryKey: qk.roles, queryFn: settingsService.roles });
}

export function useStaffList(departmentId?: string) {
  return useQuery({
    queryKey: qk.staff(departmentId),
    queryFn: () => settingsService.staff(departmentId),
    staleTime: 60_000,
  });
}

export function useStaffSettings() {
  return useQuery({ queryKey: qk.staffSettings, queryFn: settingsService.staffForSettings });
}

export function useSettingsMutations() {
  const qc = useQueryClient();
  const refresh = (...keys: readonly (readonly unknown[])[]) => () =>
    keys.forEach((queryKey) => void qc.invalidateQueries({ queryKey }));
  return {
    createDepartment: useMutation({
      mutationFn: (input: DepartmentInput) => settingsService.createDepartment(input),
      onSuccess: refresh(qk.departments),
    }),
    updateDepartment: useMutation({
      mutationFn: ({ id, input }: { id: string; input: DepartmentInput }) => settingsService.updateDepartment(id, input),
      onSuccess: refresh(qk.departments),
    }),
    createRole: useMutation({
      mutationFn: (input: { name: string; permissions: string }) => settingsService.createRole(input),
      onSuccess: refresh(qk.roles),
    }),
    updateRole: useMutation({
      mutationFn: ({ id, input }: { id: string; input: { name?: string; permissions?: string } }) =>
        settingsService.updateRole(id, input),
      onSuccess: refresh(qk.roles, qk.me),
    }),
    createStaff: useMutation({
      mutationFn: (input: StaffInput) => settingsService.createStaff(input),
      onSuccess: refresh(['staff'], qk.departments, qk.roles),
    }),
    updateStaff: useMutation({
      mutationFn: ({ id, input }: { id: string; input: StaffInput }) => settingsService.updateStaff(id, input),
      onSuccess: refresh(['staff'], qk.departments, qk.roles),
    }),
  };
}
