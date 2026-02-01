import { useState } from 'react';
import { X, FileText, Clock, Plus, Trash2, Calculator, Code, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUpload from '@/components/FileUpload';
import TVCAnswerKeyInput from '@/components/TVCAnswerKeyInput';

interface FileEntry {
  id: string;
  title: string;
  description: string;
  year: number;
  subject: string;
  questionCount: number;
  answerKey: string[];
  oficiu: number;
  timerMinutes: number;
  uploadedFile: {
    url: string;
    name: string;
    type: string;
    size: number;
  } | null;
}

interface TVCCompletUploadModalProps {
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
    answerKey?: string[];
    oficiu?: number;
    timerMinutes?: number;
    subject?: string;
  }) => Promise<void>;
}

const subjectOptions = [
  { value: 'matematica', label: 'Matematică', icon: Calculator },
  { value: 'informatica', label: 'Informatică', icon: Code },
  { value: 'fizica', label: 'Fizică', icon: Atom },
];

const createEmptyEntry = (): FileEntry => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  year: new Date().getFullYear(),
  subject: 'matematica',
  questionCount: 9,
  answerKey: Array(9).fill(''),
  oficiu: 0,
  timerMinutes: 180,
  uploadedFile: null,
});

const TVCCompletUploadModal = ({ isOpen, onClose, onSave }: TVCCompletUploadModalProps) => {
  const [entries, setEntries] = useState<FileEntry[]>([createEmptyEntry()]);
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const updateEntry = (index: number, updates: Partial<FileEntry>) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, ...updates } : entry
    ));
  };

  const handleQuestionCountChange = (index: number, value: string) => {
    const count = parseInt(value, 10);
    const entry = entries[index];
    const newAnswerKey = Array(count).fill('');
    for (let i = 0; i < Math.min(entry.answerKey.length, count); i++) {
      newAnswerKey[i] = entry.answerKey[i];
    }
    updateEntry(index, { questionCount: count, answerKey: newAnswerKey });
  };

  const addEntry = () => {
    if (entries.length < 3) {
      setEntries(prev => [...prev, createEmptyEntry()]);
      setActiveTab(entries.length);
    }
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter((_, i) => i !== index));
      setActiveTab(Math.max(0, activeTab - 1));
    }
  };

  const handleUploadComplete = (index: number, fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    updateEntry(index, { 
      uploadedFile: { url: fileUrl, name: fileName, type: fileType, size: fileSize }
    });
  };

  const resetForm = () => {
    setEntries([createEmptyEntry()]);
    setActiveTab(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all entries
    const validEntries = entries.filter(entry => 
      entry.title.trim() && 
      entry.uploadedFile && 
      entry.answerKey.every(a => a !== '')
    );

    if (validEntries.length === 0) return;

    setIsSaving(true);
    try {
      // Save all valid entries
      for (const entry of validEntries) {
        await onSave({
          title: entry.title.trim(),
          description: entry.description.trim(),
          year: entry.year,
          fileUrl: entry.uploadedFile!.url,
          fileName: entry.uploadedFile!.name,
          fileType: entry.uploadedFile!.type,
          fileSize: entry.uploadedFile!.size,
          answerKey: entry.answerKey,
          oficiu: entry.oficiu,
          timerMinutes: entry.timerMinutes,
          subject: entry.subject,
        });
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving materials:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
      ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
      jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
    };
    return labels[type.toLowerCase()] || type.toUpperCase();
  };

  const currentEntry = entries[activeTab];
  const isCurrentEntryValid = currentEntry?.title.trim() && 
    currentEntry?.uploadedFile && 
    currentEntry?.answerKey.every(a => a !== '');

  const validEntriesCount = entries.filter(entry => 
    entry.title.trim() && 
    entry.uploadedFile && 
    entry.answerKey.every(a => a !== '')
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-2xl mx-4 animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-xl text-foreground">Încarcă Teste TVC Complet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Poți încărca până la 3 teste simultan (unul pentru fiecare materie)
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
          {entries.map((entry, index) => {
            const SubjectIcon = subjectOptions.find(s => s.value === entry.subject)?.icon || Calculator;
            const isValid = entry.title.trim() && entry.uploadedFile && entry.answerKey.every(a => a !== '');
            return (
              <button
                key={entry.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === index 
                    ? 'bg-gold text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <SubjectIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Test {index + 1}
                </span>
                {isValid && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
          {entries.length < 3 && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={addEntry}
            >
              <Plus className="w-4 h-4" />
              Adaugă
            </Button>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentEntry && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Test {activeTab + 1} de {entries.length}
                </h3>
                {entries.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive gap-1"
                    onClick={() => removeEntry(activeTab)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Șterge
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Materie *</Label>
                  <Select 
                    value={currentEntry.subject} 
                    onValueChange={(value) => updateEntry(activeTab, { subject: value })}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Selectează materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Anul</Label>
                  <Input
                    id="year"
                    type="number"
                    value={currentEntry.year}
                    onChange={(e) => updateEntry(activeTab, { year: parseInt(e.target.value) })}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input
                  id="title"
                  placeholder="ex: TVC Matematică 2024"
                  value={currentEntry.title}
                  onChange={(e) => updateEntry(activeTab, { title: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descriere (opțional)</Label>
                <textarea
                  id="description"
                  placeholder="Descriere scurtă..."
                  value={currentEntry.description}
                  onChange={(e) => updateEntry(activeTab, { description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none text-sm"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Încarcă fișier *
                </Label>
                
                {currentEntry.uploadedFile ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {currentEntry.uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileTypeLabel(currentEntry.uploadedFile.type)} • {(currentEntry.uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updateEntry(activeTab, { uploadedFile: null })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <FileUpload
                    key={currentEntry.id}
                    onUploadComplete={(url, name, type, size) => handleUploadComplete(activeTab, url, name, type, size)}
                    category="tvc_complet"
                    subject={currentEntry.subject}
                  />
                )}
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <Label htmlFor="timerMinutes" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  Durată Timer (minute)
                </Label>
                <Input
                  id="timerMinutes"
                  type="number"
                  min={1}
                  max={600}
                  value={currentEntry.timerMinutes}
                  onChange={(e) => updateEntry(activeTab, { timerMinutes: Math.max(1, parseInt(e.target.value) || 180) })}
                  placeholder="180"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  La expirare, testul se trimite automat.
                </p>
              </div>

              {/* Answer Key */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Număr de întrebări</Label>
                    <Select 
                      value={currentEntry.questionCount.toString()} 
                      onValueChange={(value) => handleQuestionCountChange(activeTab, value)}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'întrebare' : 'întrebări'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="oficiu">Oficiu (puncte bonus)</Label>
                    <Input
                      id="oficiu"
                      type="number"
                      min={0}
                      max={100}
                      value={currentEntry.oficiu}
                      onChange={(e) => updateEntry(activeTab, { oficiu: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                </div>
                
                <TVCAnswerKeyInput
                  value={currentEntry.answerKey}
                  onChange={(newKey) => updateEntry(activeTab, { answerKey: newKey })}
                  questionCount={currentEntry.questionCount}
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {validEntriesCount} din {entries.length} teste completate
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Anulează
            </Button>
            <Button 
              variant="gold"
              onClick={handleSubmit}
              disabled={validEntriesCount === 0 || isSaving}
            >
              {isSaving ? 'Se salvează...' : `Salvează ${validEntriesCount > 1 ? `(${validEntriesCount})` : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVCCompletUploadModal;
