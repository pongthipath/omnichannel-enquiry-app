import { http } from './http-client';

export type TagColor = 'yellow' | 'blue' | 'red' | 'green' | 'cyan' | 'gray' | 'purple';
export type TagAppliesTo = 'ENQUIRY' | 'CUSTOMER' | 'BOTH';
export const TAG_COLORS: TagColor[] = ['yellow', 'blue', 'red', 'green', 'cyan', 'gray', 'purple'];

export interface TagSummary {
  id: string;
  name: string;
  color: TagColor;
}

export interface Tag extends TagSummary {
  appliesTo: TagAppliesTo;
  description: string | null;
  usageCount: number;
}

export interface TagInput {
  name: string;
  color?: TagColor;
  appliesTo?: TagAppliesTo;
  description?: string;
}

export const tagService = {
  list: () => http.get<Tag[]>('/tags'),
  create: (input: TagInput) => http.post<Tag>('/tags', input),
  update: (id: string, input: Partial<TagInput>) => http.patch<Tag>(`/tags/${id}`, input),
  remove: (id: string) => http.delete<void>(`/tags/${id}`),
};
