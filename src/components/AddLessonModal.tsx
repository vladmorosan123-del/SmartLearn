import { useState, useEffect } from 'react';
import { X, FileText, Video, Presentation, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';

// Data for an existing lesson when editing
export interface LessonEditData {
  materialId: string;
  title: string;
  duration: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

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
  // Optional: if provided, we're editing an existing lesson
  editData?: LessonEditData | null;
}

const AddLessonModal = ({ isOpen, onClose, onSave, lessonNumber, subject, editData }: AddLessonModalProps) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('document');

  const isEditing = !!editData;

  // Populate form with existing data when editing
  useEffect(() => {
    if (editData && isOpen) {
      setTitle(editData.title);
      setDuration(editData.duration);
      setDescription(editData.description);
      setUploadedFile({
        url: editData.fileUrl,
        name: editData.fileName,
        type: editData.fileType,
        size: editData.fileSize,
      });
    } else if (!isOpen) {
      // Reset when modal closes
      resetForm();
    }
  }, [editData, isOpen]);

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
    setActiveTab('document');
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

  const getFileTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(t)) {
      return <Video className="w-5 h-5 text-red-500" />;
    }
    if (['ppt', 'pptx'].includes(t)) {
      return <Presentation className="w-5 h-5 text-orange-500" />;
    }
    return <FileText className="w-5 h-5 text-gold" />;
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
            <h2 className="font-display text-xl text-foreground">
              {isEditing ? `Editează Lecția ${lessonNumber}` : `Adaugă Lecția ${lessonNumber}`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Modifică detaliile lecției' : 'Completează detaliile lecției'}
            </p>
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

          {/* File Upload Section with Tabs */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              Materiale pentru lecție {!isEditing && '(opțional)'}
            </Label>
            
            {uploadedFile ? (
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(uploadedFile.type.toLowerCase())
                    ? 'bg-red-500/5 border-red-500/30'
                    : ['ppt', 'pptx'].includes(uploadedFile.type.toLowerCase())
                    ? 'bg-orange-500/5 border-orange-500/30'
                    : 'bg-gold/5 border-gold/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(uploadedFile.type)}
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFileTypeLabel(uploadedFile.type)} • {uploadedFile.size >= 1024 * 1024 
                          ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(uploadedFile.size / 1024).toFixed(1)} KB`
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    title="Înlocuiește fișierul"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Apasă X pentru a înlocui fișierul cu unul nou.
                  </p>
                )}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-3">
                  <TabsTrigger value="document" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Document
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="powerpoint" className="flex items-center gap-2">
                    <Presentation className="w-4 h-4" />
                    PowerPoint
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="document" className="mt-0">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-3">
                      Încarcă PDF, Word, Excel, Text sau imagini (max 10MB)
                    </p>
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      category="lesson"
                      subject={subject}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="video" className="mt-0">
                  <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <p className="text-xs text-red-400 mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Încarcă video MP4, WebM, MOV, AVI sau MKV (max 100MB)
                    </p>
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      category="lesson"
                      subject={subject}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="powerpoint" className="mt-0">
                  <div className="p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                    <p className="text-xs text-orange-400 mb-3 flex items-center gap-2">
                      <Presentation className="w-4 h-4" />
                      Încarcă prezentări PowerPoint .ppt sau .pptx (max 10MB)
                    </p>
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      category="lesson"
                      subject={subject}
                    />
                  </div>
                </TabsContent>
              </Tabs>
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
              className="flex-1 gap-2"
              disabled={!title.trim() || !duration.trim()}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  Salvează modificările
                </>
              ) : (
                'Salvează lecția'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal;
