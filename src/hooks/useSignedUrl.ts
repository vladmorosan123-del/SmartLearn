import { useState, useEffect } from 'react';
import { getSignedFileUrl } from '@/lib/storage';

/**
 * Hook that resolves a stored file URL to a signed URL.
 * Returns { signedUrl, isLoading }.
 */
export const useSignedUrl = (fileUrl: string | null | undefined) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fileUrl) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getSignedFileUrl(fileUrl).then((url) => {
      if (!cancelled) {
        setSignedUrl(url);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return { signedUrl, isLoading };
};
