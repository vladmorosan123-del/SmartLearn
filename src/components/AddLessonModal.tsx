import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FileUpload from '@/components/FileUpload';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: { 
    title: string; 
    duration: string; 
    description: string; 
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) => void;
  lessonNumber: number;
  subject: string;
}

const AddLessonModal = ({ isOpen, onClose, onSave, lessonNumber, subject }: AddLessonModalProps) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && duration.trim()) {
      onSave({ 
        title: title.trim(), 
        duration: duration.trim(), 
        description: description.trim(),
        fileUrl: uploadedFile?.url,
        fileName: uploadedFile?.name,
        fileType: uploadedFile?.type,
        fileSize: uploadedFile?.size,
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDuration('');
    setDescription('');
    setUploadedFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFile({ url: fileUrl, name: fileName, type: fileType, size: fileSize });
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF',
      doc: 'Word',
      docx: 'Word',
      xls: 'Excel',
      xlsx: 'Excel',
      ppt: 'PowerPoint',
      pptx: 'PowerPoint',
      txt: 'Text',
      csv: 'CSV',
      jpg: 'Imagine',
      jpeg: 'Imagine',
      png: 'Imagine',
      mp4: 'Video',
      webm: 'Video',
      mov: 'Video',
      avi: 'Video',
      mkv: 'Video',
    };
    return labels[type.toLowerCase()] || type.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display text-xl text-foreground">Adaugă Lecția {lessonNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">Completează detaliile lecției</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlul lecției *</Label>
            <Input
              id="title"
              placeholder="ex: Introducere în algoritmi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durata *</Label>
            <Input
              id="duration"
              placeholder="ex: 45 min"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              placeholder="Descrierea lecției..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background resize-none"
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              Încarcă fișier (opțional)
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
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload
                onUploadComplete={handleUploadComplete}
                category="lesson"
                subject={subject}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Anulează
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              className="flex-1"
              disabled={!title.trim() || !duration.trim()}
            >
              Salvează lecția
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal;
