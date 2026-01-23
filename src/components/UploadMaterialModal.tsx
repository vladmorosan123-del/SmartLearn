import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/FileUpload';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    year?: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => void;
  title: string;
  category: string;
  subject: string;
  showYear?: boolean;
}

const UploadMaterialModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title: modalTitle,
  category,
  subject,
  showYear = false 
}: UploadMaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setYear(new Date().getFullYear());
    setUploadedFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !uploadedFile) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      year: showYear ? year : undefined,
      fileUrl: uploadedFile.url,
      fileName: uploadedFile.name,
      fileType: uploadedFile.type,
      fileSize: uploadedFile.size,
    });
    resetForm();
    onClose();
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFile({ url: fileUrl, name: fileName, type: fileType, size: fileSize });
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
      ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
      jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
    };
    return labels[type.toLowerCase()] || type.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display text-xl text-foreground">{modalTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">Completează detaliile și încarcă fișierul</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu *</Label>
            <Input
              id="title"
              placeholder="ex: Model BAC 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          {showYear && (
            <div className="space-y-2">
              <Label htmlFor="year">Anul</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-background"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descriere (opțional)</Label>
            <textarea
              id="description"
              placeholder="Descriere scurtă..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              Încarcă fișier *
            </Label>
            
            {uploadedFile ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeLabel(uploadedFile.type)} • {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload
                onUploadComplete={handleUploadComplete}
                category={category}
                subject={subject}
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Anulează
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              className="flex-1"
              disabled={!title.trim() || !uploadedFile}
            >
              Salvează
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialModal;
