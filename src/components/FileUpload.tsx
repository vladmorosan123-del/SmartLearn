import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, FileSpreadsheet, FileType, File, Video, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

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

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string, fileType: string, fileSize: number) => void;
  category: string;
  subject: string;
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

const FileUpload = ({ onUploadComplete, category, subject }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, role } = useAuthContext();

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
        description: `Dimensiunea maximă permisă este ${maxSizeLabel}.`,
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    // Storage upload requires an authenticated session (and for this app: profesor/admin)
    if (!isAuthenticated) {
      toast({
        title: 'Trebuie să fii autentificat',
        description: 'Te rog să te autentifici înainte să încarci fișiere.',
        variant: 'destructive',
      });
      return;
    }

    const canUpload = role === 'profesor' || role === 'admin';
    if (!canUpload) {
      toast({
        title: 'Fără permisiuni',
        description: 'Doar profesorii și administratorii pot încărca fișiere.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${category}/${subject}/${Date.now()}_${selectedFile.name}`;
      
      const { data, error } = await supabase.storage
        .from('materials')
        .upload(fileName, selectedFile, {
          contentType: MIME_TYPES[fileExt] || 'application/octet-stream',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(data.path);

      onUploadComplete(publicUrl, selectedFile.name, fileExt, selectedFile.size);
      setSelectedFile(null);
      
      toast({
        title: 'Fișier încărcat',
        description: 'Fișierul a fost încărcat cu succes.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Eroare la încărcare',
        description: error.message || 'A apărut o eroare la încărcarea fișierului.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

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
        />
        
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            {getFileIcon(MIME_TYPES[selectedFile.name.split('.').pop()?.toLowerCase() || ''] || '')}
            <span className="text-foreground font-medium">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground mb-1">Trage și plasează fișierul aici</p>
            <p className="text-sm text-muted-foreground mb-3">sau</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selectează fișier
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">Formate acceptate:</p>
        <p>PDF, Word, Excel, PowerPoint, Text, CSV, JPG, PNG</p>
        <p>Video: MP4, WebM, MOV, AVI, MKV</p>
        <p className="mt-1">Dimensiune maximă: 10MB (documente) / 100MB (video)</p>
      </div>

      {selectedFile && (
        <Button
          variant="gold"
          className="w-full"
          onClick={uploadFile}
          disabled={isUploading}
        >
          {isUploading ? 'Se încarcă...' : 'Încarcă fișierul'}
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
