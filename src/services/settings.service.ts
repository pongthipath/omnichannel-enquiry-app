import { http } from './http-client';

export interface Department {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  staffCount?: number;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  /** permission bitmask as a decimal string */
  permissions: string;
  isSystem: boolean;
  staffCount: number;
}

export interface StaffSummary {
  id: string;
  name: string;
  departmentId: string;
}

export interface StaffDetail extends StaffSummary {
  email: string;
  roleId: string;
  roleName: string;
  departmentName: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface DepartmentInput {
  code?: string;
  nameTh?: string;
  nameEn?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface StaffInput {
  email?: string;
  name?: string;
  departmentId?: string;
  roleId?: string;
  password?: string;
  isActive?: boolean;
}

/** Departments, roles and staff — pickers and the settings pages. */
export const settingsService = {
  departments: () => http.get<Department[]>('/departments'),
  departmentsForSettings: () => http.get<Department[]>('/settings/departments'),
  createDepartment: (input: DepartmentInput) => http.post<Department>('/departments', input),
  updateDepartment: (id: string, input: DepartmentInput) => http.patch<Department>(`/departments/${id}`, input),

  roles: () => http.get<Role[]>('/roles'),
  createRole: (input: { name: string; permissions: string }) => http.post<Role>('/roles', input),
  updateRole: (id: string, input: { name?: string; permissions?: string }) => http.patch<Role>(`/roles/${id}`, input),

  staff: (departmentId?: string) =>
    http.get<StaffSummary[]>(`/staff${departmentId ? `?departmentId=${departmentId}` : ''}`),
  staffForSettings: () => http.get<StaffDetail[]>('/settings/staff'),
  createStaff: (input: StaffInput) => http.post<StaffDetail>('/staff', input),
  updateStaff: (id: string, input: StaffInput) => http.patch<StaffDetail>(`/staff/${id}`, input),
};
