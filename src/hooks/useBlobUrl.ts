import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractStoragePath } from '@/lib/storage';

/**
 * Downloads a file as a blob and returns an object URL.
 * Uses Supabase SDK for storage files (bypasses CORS & X-Frame-Options).
 * Falls back to fetch for external URLs.
 */
export const useBlobUrl = (originalUrl: string | null) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setBlobUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoading(true);
    setError(false);

    const load = async () => {
      try {
        let blob: Blob;
        const storagePath = extractStoragePath(originalUrl);

        if (storagePath) {
          // Use Supabase SDK — handles auth & bypasses CORS
          const { data, error: dlErr } = await supabase.storage
            .from('materials')
            .download(storagePath);
          if (dlErr || !data) throw dlErr || new Error('Download failed');
          blob = data;
        } else {
          // External URL — plain fetch
          const res = await fetch(originalUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          blob = await res.blob();
        }

        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('useBlobUrl error:', e);
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [originalUrl]);

  return { blobUrl, isLoading, error };
};
