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
    const picked = file.file as Blob | undefined;
    if (picked) {
      form.append('file', picked, file.name); // web: a real File from the picker
    } else {
      form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
    }

    // XHR rather than fetch: React Native streams a { uri } part straight from disk, while Expo's
    // fetch accepts only a Blob and rejects the part outright ("Unsupported FormDataPart").
    const token = getAccessToken();
    const { status, statusText, body } = await new Promise<{
      status: number;
      statusText: string;
      body: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/attachments`);
      xhr.withCredentials = true; // web: the httpOnly refresh cookie
      xhr.setRequestHeader('X-Requested-With', 'omni-app');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.onload = () =>
        resolve({ status: xhr.status, statusText: xhr.statusText, body: xhr.responseText });
      // a TypeError so the UI shows the "no connection" message, like a failed fetch does
      xhr.onerror = () => reject(new TypeError('upload failed'));
      xhr.onabort = () => reject(new TypeError('upload aborted'));
      xhr.send(form);
    });

    let data: Partial<Attachment> & { code?: string; message?: string } = {};
    try {
      data = JSON.parse(body) as typeof data;
    } catch {
      // a proxy or gateway answered with something that is not our JSON
    }
    if (status < 200 || status >= 300) {
      throw new ApiError(status, data.code ?? 'common.unknown', data.message ?? statusText);
    }
    return data as Attachment;
  },
};
