import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { PickedFile } from '../services/attachment.service';

/**
 * Picking a photo or a file, in the one shape the upload needs (design §17).
 * Each function returns [] when the user backs out, so callers never special-case cancellation.
 */

const guessMime = (name: string, fallback: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const known: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic',
    pdf: 'application/pdf', csv: 'text/csv', txt: 'text/plain',
  };
  return known[ext] ?? fallback;
};

/** Photo library. `camera` opens the camera instead — it asks for permission the first time. */
export async function pickImages(camera = false): Promise<PickedFile[]> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return [];
  }
  const result = camera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
  if (result.canceled) return [];
  return result.assets.map((a, i) => ({
    uri: a.uri,
    name: a.fileName ?? `photo-${Date.now()}-${i}.jpg`,
    mimeType: a.mimeType ?? guessMime(a.fileName ?? '', 'image/jpeg'),
    sizeBytes: a.fileSize,
    file: (a as { file?: unknown }).file, // web: the real File object
  }));
}

/** Any document (quotation PDF, delivery note photo already saved to Files, …). */
export async function pickFiles(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
  if (result.canceled) return [];
  return result.assets.map((a) => ({
    uri: a.uri,
    name: a.name,
    mimeType: a.mimeType ?? guessMime(a.name, 'application/octet-stream'),
    sizeBytes: a.size ?? undefined,
    file: (a as { file?: unknown }).file,
  }));
}
