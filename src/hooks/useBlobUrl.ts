import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractStoragePath } from '@/lib/storage';

/**
 * Downloads a file from Supabase storage as a blob and returns an object URL.
 * This bypasses X-Frame-Options restrictions for iframe rendering.
 * Falls back to fetch for non-Supabase URLs.
 */
export const useBlobUrl = (sourceUrl: string | null) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sourceUrl) {
      setBlobUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoading(true);
    setError(false);

    const loadBlob = async () => {
      try {
        let blob: Blob;

        // Try Supabase storage download first (handles auth automatically)
        const storagePath = extractStoragePath(sourceUrl);
        if (storagePath) {
          const { data, error: dlError } = await supabase.storage
            .from('materials')
            .download(storagePath);
          if (dlError || !data) throw new Error(dlError?.message || 'Download failed');
          blob = data;
        } else {
          // Fallback: direct fetch for non-Supabase URLs
          const res = await fetch(sourceUrl);
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

    loadBlob();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceUrl]);

  return { blobUrl, isLoading, error };
};
