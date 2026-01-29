import { X, Download, ExternalLink, FileText, Image, FileSpreadsheet, FileType, File, Presentation, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  if (type === 'mp4' || type === 'webm' || type === 'mov' || type === 'avi' || type === 'mkv') return <Video className="w-16 h-16 text-purple-500" />;
  return <File className="w-16 h-16 text-muted-foreground" />;
};

const canPreviewInBrowser = (fileType: string) => {
  const type = fileType.toLowerCase();
  // PDF, images, text, videos (mp4/webm), and office docs via Google Viewer
  return ['pdf', 'jpg', 'jpeg', 'png', 'txt', 'mp4', 'webm', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(type);
};

const FileViewer = ({ isOpen, onClose, fileUrl, fileName, fileType }: FileViewerProps) => {
  if (!isOpen) return null;

  const type = fileType.toLowerCase();
  const canPreview = canPreviewInBrowser(fileType);
  const isImage = ['jpg', 'jpeg', 'png'].includes(type);
  const isPdf = type === 'pdf';
  const isTxt = type === 'txt';
  const isVideo = ['mp4', 'webm'].includes(type);
  const isOfficeDoc = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(type);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Use Google Docs Viewer for PDFs and Office documents
  const getGoogleViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  // Get video MIME type for proper playback
  const getVideoMimeType = (ext: string) => {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
    };
    return mimeTypes[ext] || 'video/mp4';
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
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-gold flex-shrink-0" />
            <h2 className="font-display text-lg text-foreground truncate">{fileName}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descarcă</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Tab nou</span>
            </Button>
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
        
        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-muted/30">
          {canPreview ? (
            <div className="w-full h-full flex items-center justify-center">
              {isImage && (
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
              
              {isPdf && (
                <iframe
                  src={getGoogleViewerUrl(fileUrl)}
                  className="w-full h-full rounded-lg border border-border bg-white"
                  title={fileName}
                  allow="autoplay"
                />
              )}
              
              {isTxt && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full rounded-lg border border-border bg-white"
                  title={fileName}
                />
              )}

              {isVideo && (
                <video
                  src={fileUrl}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  controlsList="nodownload"
                >
                  <source src={fileUrl} type={getVideoMimeType(type)} />
                  Browser-ul tău nu suportă redarea video.
                </video>
              )}

              {isOfficeDoc && (
                <iframe
                  src={getGoogleViewerUrl(fileUrl)}
                  className="w-full h-full rounded-lg border border-border bg-white"
                  title={fileName}
                  allow="autoplay"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-xl border border-dashed border-border max-w-md">
              {getFileIcon(fileType)}
              <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{fileName}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Acest tip de fișier nu poate fi previzualizat în browser.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="gold" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă fișierul
                </Button>
                <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Deschide în tab nou
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Poți deschide fișierul cu aplicația corespunzătoare (Word, Excel, PowerPoint, etc.)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">
            {canPreview ? 'Fișier disponibil pentru vizualizare și descărcare' : 'Descarcă pentru a vizualiza'}
          </p>
          <Button variant="outline" onClick={onClose}>
            Închide
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
