import { useState } from 'react';
import { X, Download, ExternalLink, FileText, Image, FileSpreadsheet, FileType, File, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type === 'jpg' || type === 'jpeg' || type === 'png') return <Image className="w-16 h-16 text-gold" />;
  if (type === 'pdf') return <FileText className="w-16 h-16 text-red-500" />;
  if (type === 'xls' || type === 'xlsx' || type === 'csv') return <FileSpreadsheet className="w-16 h-16 text-green-500" />;
  if (type === 'doc' || type === 'docx') return <FileType className="w-16 h-16 text-blue-500" />;
  if (type === 'ppt' || type === 'pptx') return <Presentation className="w-16 h-16 text-orange-500" />;
  if (type === 'txt') return <FileText className="w-16 h-16 text-muted-foreground" />;
  return <File className="w-16 h-16 text-muted-foreground" />;
};

const canPreviewInBrowser = (fileType: string) => {
  const type = fileType.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'txt'].includes(type);
};

const FileViewer = ({ isOpen, onClose, fileUrl, fileName, fileType }: FileViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const canPreview = canPreviewInBrowser(fileType);
  const isImage = ['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase());
  const isPdf = fileType.toLowerCase() === 'pdf';
  const isTxt = fileType.toLowerCase() === 'txt';

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg truncate pr-4">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Descarcă
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Deschide
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {canPreview ? (
            <div className="h-full">
              {isImage && (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              )}
              
              {isPdf && (
                <iframe
                  src={fileUrl}
                  className="w-full h-[60vh] rounded-lg border border-border"
                  title={fileName}
                  onLoad={() => setIsLoading(false)}
                />
              )}
              
              {isTxt && (
                <iframe
                  src={fileUrl}
                  className="w-full h-[60vh] rounded-lg border border-border bg-background"
                  title={fileName}
                  onLoad={() => setIsLoading(false)}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              {getFileIcon(fileType)}
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{fileName}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Acest tip de fișier nu poate fi previzualizat în browser.
              </p>
              <div className="flex gap-3">
                <Button variant="gold" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă fișierul
                </Button>
                <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Deschide în fereastră nouă
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Poți deschide fișierul cu aplicația corespunzătoare (Word, Excel, PowerPoint, etc.)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;
