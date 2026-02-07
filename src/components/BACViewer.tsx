import { X, FileText, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/downloadFile';

interface BACViewerProps {
  title: string;
  onClose: () => void;
  pdfUrl?: string;
}

const BACViewer = ({ title, onClose, pdfUrl }: BACViewerProps) => {
  const handleDownload = () => {
    if (pdfUrl) {
      downloadFile(pdfUrl, `${title}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-background rounded-2xl border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="font-display text-lg text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <Button 
                variant="gold" 
                size="sm"
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                Descarcă PDF
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* PDF Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-muted/30">
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full rounded-lg border border-border bg-white"
              title="BAC Subject PDF"
            />
          ) : (
            <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">
                PDF-ul nu a fost încărcat
              </h3>
              <p className="text-muted-foreground text-sm">
                Profesorul va încărca modelul BAC în format PDF. 
                Acesta va apărea aici când va fi disponibil.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">
            {pdfUrl ? 'PDF disponibil pentru vizualizare și descărcare' : 'PDF în așteptare'}
          </p>
          <Button variant="outline" onClick={onClose}>
            Închide
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BACViewer;
