import { Channel, ChatStatus, Enquiry } from './enquiry.service';
import { http } from './http-client';

export interface DashboardSummary {
  totals: {
    notClosed: number;
    unassigned: number;
    slaBreached: number;
    reopened: number;
    waitingForCustomer: number;
    avgFirstResponseMinutes: number | null;
  };
  byStatus: { status: ChatStatus; count: number }[];
  byDepartment: { departmentId: string; name: string; count: number }[];
  byChannel: { channel: Channel; count: number }[];
  team: { staffId: string | null; name: string; departmentName: string | null; active: number; waiting: number }[];
  urgent: Enquiry[];
}

export type DashboardPeriod = 1 | 7 | 30 | undefined;

export const dashboardService = {
  summary: (days?: DashboardPeriod) =>
    http.get<DashboardSummary>(`/dashboard/summary${days ? `?days=${days}` : ''}`),
};
