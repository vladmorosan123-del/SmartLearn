import { useState, useEffect } from 'react';

/**
 * Fetches a URL as a blob and returns an object URL.
 * This bypasses X-Frame-Options restrictions for iframe rendering.
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

    fetch(sourceUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('useBlobUrl error:', e);
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceUrl]);

  return { blobUrl, isLoading, error };
};
