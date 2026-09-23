import { API_ORIGIN, ApiError, getAccessToken } from './http-client';

export type AttachmentKind = 'IMAGE' | 'FILE';
export type AttachmentStatus = 'PENDING' | 'STORED' | 'FAILED';

/** Mirrors the API's AttachmentDto. */
export interface Attachment {
  id: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** relative to the API, e.g. /attachments/1f…/file — use `fileUrl()` to open it */
  url: string;
  status: AttachmentStatus;
  chatMessageId: string | null;
}

/** What a picker gives us, in the shape fetch's FormData wants on both web and native. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  /** web only: the real File, which uploads faster than re-reading the blob URL */
  file?: unknown;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `${API_ORIGIN}/api/v1`;

/** Absolute URL of a stored attachment — the bucket is private, so everything goes through the API. */
export const fileUrl = (a: Attachment): string => `${BASE_URL}${a.url}`;

export const attachmentService = {
  /**
   * Uploads one file. FormData sets its own multipart boundary, so this cannot go through
   * `http-client` (which always sends JSON) — the auth header is added by hand instead.
   */
  async upload(file: PickedFile): Promise<Attachment> {
    const form = new FormData();
    form.append(
      'file',
      (file.file as Blob | undefined) ??
        ({ uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob),
      file.name,
    );
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/attachments`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'omni-app',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, data.code ?? 'common.unknown', data.message ?? res.statusText);
    }
    return data as Attachment;
  },
};
