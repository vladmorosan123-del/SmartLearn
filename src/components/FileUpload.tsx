import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, FileSpreadsheet, FileType, File, Video, Presentation, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
  '.txt', '.csv', '.jpg', '.jpeg', '.png',
  // Video formats
  '.mp4', '.webm', '.mov', '.avi', '.mkv'
];

const MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  // Video formats
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  'mkv': 'video/x-matroska',
};

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string, fileType: string, fileSize: number) => void;
  category: string;
  subject: string;
  multiple?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) return <Image className="w-5 h-5" />;
  if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
    return <FileSpreadsheet className="w-5 h-5" />;
  }
  if (fileType.includes('word') || fileType.includes('document')) return <FileType className="w-5 h-5" />;
  if (fileType.includes('video')) return <Video className="w-5 h-5" />;
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

// Sanitize filename to remove special characters (diacritics, spaces, etc.)
const sanitizeFileName = (fileName: string): string => {
  // Get file extension
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';
  
  // Replace diacritics and special chars with ASCII equivalents
  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace other special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  return sanitized + ext.toLowerCase();
};

const FileUpload = ({ onUploadComplete, category, subject, multiple = true }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, role: authRole } = useAuthContext();
  const { role: appRole } = useApp();
  const effectiveRole = authRole || appRole;

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast({
        title: 'Format nepermis',
        description: `Fișierele ${extension} nu sunt permise. Formate acceptate: PDF, Word, Excel, PowerPoint, Text, CSV, JPG, PNG, MP4, WebM, MOV`,
        variant: 'destructive',
      });
      return false;
    }
    
    // Check file size - 100MB for videos, 10MB for other files
    const isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(extension);
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeLabel = isVideo ? '100MB' : '10MB';
    
    if (file.size > maxSize) {
      toast({
        title: 'Fișier prea mare',
        description: `${file.name}: Dimensiunea maximă permisă este ${maxSizeLabel}.`,
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(validateFile);
      
      if (validFiles.length > 0) {
        const newFiles: UploadedFile[] = validFiles.map(file => ({
          file,
          status: 'pending' as const,
        }));
        
        if (multiple) {
          setSelectedFiles(prev => [...prev, ...newFiles]);
        } else {
          setSelectedFiles(newFiles.slice(0, 1));
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(validateFile);
      
      if (validFiles.length > 0) {
        const newFiles: UploadedFile[] = validFiles.map(file => ({
          file,
          status: 'pending' as const,
        }));
        
        if (multiple) {
          setSelectedFiles(prev => [...prev, ...newFiles]);
        } else {
          setSelectedFiles(newFiles.slice(0, 1));
        }
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    // Storage upload requires an authenticated session (and for this app: profesor/admin)
    if (!isAuthenticated) {
      toast({
        title: 'Trebuie să fii autentificat',
        description: 'Te rog să te autentifici înainte să încarci fișiere.',
        variant: 'destructive',
      });
      return;
    }

    const canUpload = effectiveRole === 'profesor' || effectiveRole === 'admin';
    if (!canUpload) {
      toast({
        title: 'Fără permisiuni',
        description: 'Doar profesorii și administratorii pot încărca fișiere.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const uploadedFile = selectedFiles[i];
      if (uploadedFile.status === 'success') continue;
      
      // Update status to uploading
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));

      try {
        const fileExt = uploadedFile.file.name.split('.').pop()?.toLowerCase() || '';
        const sanitizedName = sanitizeFileName(uploadedFile.file.name);
        const fileName = `${category}/${subject}/${Date.now()}_${sanitizedName}`;
        
        const { data, error } = await supabase.storage
          .from('materials')
          .upload(fileName, uploadedFile.file, {
            contentType: MIME_TYPES[fileExt] || 'application/octet-stream',
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
          .getPublicUrl(data.path);

        onUploadComplete(publicUrl, uploadedFile.file.name, fileExt, uploadedFile.file.size);
        
        // Update status to success
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' as const } : f
        ));
        
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        
        // Update status to error
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, error: error.message } : f
        ));
        
        errorCount++;
      }
    }

    setIsUploading(false);

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: 'Fișiere încărcate',
        description: `${successCount} ${successCount === 1 ? 'fișier încărcat' : 'fișiere încărcate'} cu succes.${errorCount > 0 ? ` ${errorCount} erori.` : ''}`,
      });
    } else if (errorCount > 0) {
      toast({
        title: 'Eroare la încărcare',
        description: 'Nu s-au putut încărca fișierele.',
        variant: 'destructive',
      });
    }

    // Clear successful uploads after a short delay
    setTimeout(() => {
      setSelectedFiles(prev => prev.filter(f => f.status !== 'success'));
    }, 1500);
  };

  const pendingCount = selectedFiles.filter(f => f.status === 'pending' || f.status === 'error').length;

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-gold bg-gold/10' : 'border-border hover:border-gold/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          multiple={multiple}
        />
        
        <div>
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground mb-1">
            Trage și plasează {multiple ? 'fișierele' : 'fișierul'} aici
          </p>
          <p className="text-sm text-muted-foreground mb-3">sau</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Selectează {multiple ? 'fișiere' : 'fișier'}
          </Button>
          {multiple && (
            <p className="text-xs text-muted-foreground mt-2">
              Poți selecta mai multe fișiere simultan
            </p>
          )}
        </div>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {selectedFiles.map((uploadedFile, index) => {
            const fileExt = uploadedFile.file.name.split('.').pop()?.toLowerCase() || '';
            const mimeType = MIME_TYPES[fileExt] || '';
            
            return (
              <div 
                key={`${uploadedFile.file.name}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  uploadedFile.status === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : uploadedFile.status === 'error'
                    ? 'bg-destructive/10 border-destructive/30'
                    : uploadedFile.status === 'uploading'
                    ? 'bg-gold/10 border-gold/30'
                    : 'bg-muted/50 border-border'
                }`}
              >
                {getFileIcon(mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / 1024).toFixed(1)} KB
                    {uploadedFile.status === 'error' && uploadedFile.error && (
                      <span className="text-destructive ml-2">• {uploadedFile.error}</span>
                    )}
                  </p>
                </div>
                {uploadedFile.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                ) : uploadedFile.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">Formate acceptate:</p>
        <p>PDF, Word, Excel, PowerPoint, Text, CSV, JPG, PNG</p>
        <p>Video: MP4, WebM, MOV, AVI, MKV</p>
        <p className="mt-1">Dimensiune maximă: 10MB (documente) / 100MB (video)</p>
      </div>

      {pendingCount > 0 && (
        <Button
          type="button"
          variant="gold"
          className="w-full"
          onClick={uploadFiles}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Se încarcă...
            </>
          ) : (
            `Încarcă ${pendingCount} ${pendingCount === 1 ? 'fișier' : 'fișiere'}`
          )}
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
