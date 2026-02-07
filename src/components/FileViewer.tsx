import { useMemo, useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Image, FileSpreadsheet, FileType, File, Presentation, Video, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { downloadFile } from '@/lib/downloadFile';
import ImageZoomViewer from '@/components/ImageZoomViewer';
import ZoomableWrapper from '@/components/ZoomableWrapper';

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
  return ['pdf', 'jpg', 'jpeg', 'png', 'txt', 'mp4', 'webm', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(type);
};

const FileViewer = ({ isOpen, onClose, fileUrl, fileName, fileType }: FileViewerProps) => {
  const [imageError, setImageError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  
  // Resolve signed URL for private bucket
  const { signedUrl, isLoading: isUrlLoading } = useSignedUrl(isOpen ? fileUrl : null);
  const safeFileUrl = useMemo(() => (signedUrl || '').trim(), [signedUrl]);

  // Reset states when URL changes or modal opens
  useEffect(() => {
    if (isOpen && safeFileUrl) {
      setImageError(false);
      setIframeLoading(true);
      setIframeError(false);
      setLoadTimeout(false);
      
      const timer = setTimeout(() => {
        setLoadTimeout(true);
        setIframeLoading(false);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, safeFileUrl]);

  if (!isOpen) return null;

  // Show loading while resolving signed URL
  if (isUrlLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col items-center justify-center p-8">
          <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
          <p className="text-white">Se pregătește fișierul...</p>
        </div>
      </div>
    );
  }

  const hasValidUrl = safeFileUrl && safeFileUrl.length > 0 && safeFileUrl.startsWith('http');

  if (!hasValidUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md m-4 flex flex-col bg-background rounded-2xl border border-border overflow-hidden animate-scale-in p-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-xl font-display text-foreground mb-2">Fișier indisponibil</h3>
            <p className="text-muted-foreground mb-6">
              Nu s-a putut încărca fișierul. URL-ul este invalid sau lipsește.
            </p>
            <Button variant="outline" onClick={onClose}>
              Închide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const type = fileType.toLowerCase();
  const canPreview = canPreviewInBrowser(fileType);
  const isImage = ['jpg', 'jpeg', 'png'].includes(type);
  const isPdf = type === 'pdf';
  const isTxt = type === 'txt';
  const isVideo = ['mp4', 'webm'].includes(type);
  const isOfficeDoc = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(type);

  const handleDownload = () => {
    downloadFile(safeFileUrl, fileName);
  };

  const getGoogleViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const getVideoMimeType = (ext: string) => {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
    };
    return mimeTypes[ext] || 'video/mp4';
  };

  const handleIframeLoad = () => setIframeLoading(false);
  const handleIframeError = () => { setIframeError(true); setIframeLoading(false); };

  const renderFallbackOptions = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-xl border border-dashed border-border max-w-md">
      {loadTimeout ? (
        <AlertCircle className="w-16 h-16 text-amber-500" />
      ) : (
        getFileIcon(fileType)
      )}
      <h3 className="text-lg font-medium text-foreground mt-4 mb-2">
        {loadTimeout ? 'Încărcarea durează prea mult' : 'Nu s-a putut previzualiza'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {loadTimeout 
          ? 'Încearcă să descarci fișierul sau să-l deschizi într-un tab nou.'
          : 'Descarcă fișierul sau deschide-l într-un tab nou.'}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="gold" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Descarcă
        </Button>
        <Button variant="outline" onClick={() => window.open(safeFileUrl, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Tab nou
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-background rounded-2xl border border-border overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-gold flex-shrink-0" />
            <h2 className="font-display text-lg text-foreground truncate">{fileName}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descarcă</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(safeFileUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Tab nou</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-muted/30">
          {canPreview ? (
            <div className="w-full h-full flex items-center justify-center relative">
              {iframeLoading && (isPdf || isOfficeDoc || isTxt) && !loadTimeout && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
                  <p className="text-muted-foreground">Se încarcă documentul...</p>
                </div>
              )}

              {(loadTimeout || iframeError) && (isPdf || isOfficeDoc) ? (
                renderFallbackOptions()
              ) : (
                <>
                  {isImage && (
                    imageError ? renderFallbackOptions() : (
                      <ImageZoomViewer
                        src={safeFileUrl}
                        alt={fileName}
                        onError={() => setImageError(true)}
                      />
                    )
                  )}
                  
                  {isPdf && !loadTimeout && !iframeError && (
                    <ZoomableWrapper>
                      <iframe
                        src={getGoogleViewerUrl(safeFileUrl)}
                        className="w-full h-full rounded-lg border border-border bg-white"
                        title={fileName}
                        allow="autoplay"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    </ZoomableWrapper>
                  )}
                  
                  {isTxt && (
                    <ZoomableWrapper>
                      <iframe
                        src={safeFileUrl}
                        className="w-full h-full rounded-lg border border-border bg-white"
                        title={fileName}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    </ZoomableWrapper>
                  )}

                  {isVideo && (
                    <ZoomableWrapper>
                      <video
                        src={safeFileUrl}
                        controls
                        className="max-w-full max-h-full rounded-lg shadow-lg"
                        controlsList="nodownload"
                      >
                        <source src={safeFileUrl} type={getVideoMimeType(type)} />
                        Browser-ul tău nu suportă redarea video.
                      </video>
                    </ZoomableWrapper>
                  )}

                  {isOfficeDoc && !loadTimeout && !iframeError && (
                    <ZoomableWrapper>
                      <iframe
                        src={getGoogleViewerUrl(safeFileUrl)}
                        className="w-full h-full rounded-lg border border-border bg-white"
                        title={fileName}
                        allow="autoplay"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    </ZoomableWrapper>
                  )}
                </>
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
                <Button variant="outline" onClick={() => window.open(safeFileUrl, '_blank')}>
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
