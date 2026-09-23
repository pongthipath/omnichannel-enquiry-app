import { Channel, EnquiryType, Priority } from './enquiry.service';
import { http } from './http-client';

/** Mirrors the API's SlaPolicyDto. null type / priority = the catch-all rule. */
export interface SlaPolicy {
  id: string;
  enquiryType: EnquiryType | null;
  priority: Priority | null;
  targetMinutes: number;
  isPauseWhenWaiting: boolean;
  isActive: boolean;
}

export interface SlaPolicyInput {
  enquiryType?: EnquiryType | null;
  priority?: Priority | null;
  targetMinutes: number;
  isPauseWhenWaiting?: boolean;
}

export const slaService = {
  list: () => http.get<SlaPolicy[]>('/sla-policies'),
  create: (input: SlaPolicyInput) => http.post<SlaPolicy>('/sla-policies', input),
  update: (id: string, input: Partial<SlaPolicyInput> & { isActive?: boolean }) =>
    http.patch<SlaPolicy>(`/sla-policies/${id}`, input),
};

export interface SimulateInput {
  channel: Channel;
  externalUserId: string;
  displayName?: string;
  text?: string;
  imageUrl?: string;
}

export interface SimulateResult {
  accepted: number;
  duplicates: number;
  chatIds: string[];
}

/** Channel simulator (design A5): the same path a real webhook takes, minus the signature. */
export const simulatorService = {
  send: (input: SimulateInput) => http.post<SimulateResult>('/webhooks/simulate', input),
};
