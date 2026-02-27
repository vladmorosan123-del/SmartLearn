import { getAccessibleFileUrl } from '@/lib/storageApi';

/**
 * Extract the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/materials/cat/subj/file.pdf"
 *   -> "cat/subj/file.pdf"
 */
export const extractStoragePath = (fileUrl: string): string | null => {
  if (!fileUrl) return null;
  const marker = '/materials/';
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(fileUrl.substring(idx + marker.length));
};

/**
 * Generate a signed / accessible URL for a file.
 * Delegates to the storage API abstraction which handles
 * both custom server and cloud storage.
 */
export const getSignedFileUrl = async (
  fileUrl: string,
  expiresIn = 3600
): Promise<string> => {
  return getAccessibleFileUrl(fileUrl, expiresIn);
};
