import { useBlobUrl } from '@/hooks/useBlobUrl';
import { Loader2 } from 'lucide-react';
import { FileText } from 'lucide-react';

interface BlobPdfIframeProps {
  fileUrl: string;
  title?: string;
}

/**
 * Renders a PDF in an iframe using a blob URL to bypass CORS/X-Frame-Options.
 */
const BlobPdfIframe = ({ fileUrl, title }: BlobPdfIframeProps) => {
  const { blobUrl, isLoading, error } = useBlobUrl(fileUrl);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
        <p className="text-muted-foreground">Se încarcă documentul...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground mb-2">Nu s-a putut încărca PDF-ul</h3>
        <p className="text-muted-foreground text-sm">Încearcă să descarci fișierul.</p>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      className="w-full h-full rounded-lg border border-border bg-white"
      title={title || 'PDF Viewer'}
    />
  );
};

export default BlobPdfIframe;
