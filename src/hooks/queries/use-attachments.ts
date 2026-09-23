import { useCallback, useState } from 'react';
import { ApiError } from '../../services/http-client';
import {
  Attachment,
  attachmentService,
  MAX_UPLOAD_BYTES,
  PickedFile,
} from '../../services/attachment.service';

/** A file that finished uploading, plus the local uri so the preview shows without a round trip. */
export interface StagedAttachment extends Attachment {
  previewUri: string;
}

const MAX_FILES = 5;

/**
 * Files waiting to be sent with the next message (design §17). Uploading happens as soon as the file
 * is picked, so pressing send is instant; the message then just carries the ids.
 */
export function useUploadAttachments() {
  const [files, setFiles] = useState<StagedAttachment[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const add = useCallback(async (picked: PickedFile[]) => {
    if (!picked.length) return;
    setError(null);
    const room = MAX_FILES - files.length;
    if (room <= 0) {
      setError(new ApiError(400, 'attachment.tooMany', 'attachment.tooMany'));
      return;
    }
    const tooBig = picked.find((f) => (f.sizeBytes ?? 0) > MAX_UPLOAD_BYTES);
    if (tooBig) {
      setError(new ApiError(400, 'attachment.tooLarge', 'attachment.tooLarge'));
      return;
    }
    setUploading(true);
    try {
      for (const file of picked.slice(0, room)) {
        const uploaded = await attachmentService.upload(file);
        setFiles((current) => [...current, { ...uploaded, previewUri: file.uri }]);
      }
    } catch (e) {
      setError(e);
    } finally {
      setUploading(false);
    }
  }, [files.length]);

  const remove = useCallback((id: string) => setFiles((c) => c.filter((f) => f.id !== id)), []);
  const clear = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return { files, isUploading, error, add, remove, clear };
}
