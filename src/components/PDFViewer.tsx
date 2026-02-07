import { X, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { supabase } from '@/integrations/supabase/client';
import { extractStoragePath } from '@/lib/storage';

interface PDFViewerProps {
  title: string;
  onClose: () => void;
  pdfUrl?: string;
}

const PDFViewer = ({ title, onClose, pdfUrl }: PDFViewerProps) => {
  const { blobUrl, isLoading, error } = useBlobUrl(pdfUrl || null);

  const handleDownload = async () => {
    if (!pdfUrl) return;
    try {
      let blob: Blob;
      const storagePath = extractStoragePath(pdfUrl);
      if (storagePath) {
        const { data, error: dlErr } = await supabase.storage.from('materials').download(storagePath);
        if (dlErr || !data) throw dlErr || new Error('Download failed');
        blob = data;
      } else {
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      if (pdfUrl) window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-background rounded-2xl border border-border overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="font-display text-lg text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <Button variant="gold" size="sm" className="gap-2" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                Descarcă PDF
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-muted/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
              <p className="text-muted-foreground">Se încarcă documentul...</p>
            </div>
          ) : blobUrl ? (
            <iframe 
              src={blobUrl} 
              className="w-full h-full rounded-lg border border-border bg-white"
              title="PDF Viewer"
            />
          ) : error ? (
            <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg text-foreground mb-2">Nu s-a putut încărca</h3>
              <p className="text-muted-foreground text-sm mb-4">Încearcă să descarci fișierul.</p>
              <Button variant="gold" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Descarcă PDF
              </Button>
            </div>
          ) : (
            <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">PDF-ul nu a fost încărcat</h3>
              <p className="text-muted-foreground text-sm">
                Profesorul va încărca documentul în format PDF. Acesta va apărea aici când va fi disponibil.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-card">
          <Button variant="outline" onClick={onClose}>Închide</Button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
