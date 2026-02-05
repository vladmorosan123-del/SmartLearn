import { useState } from 'react';
import { X, FileText, Clock, Calculator, Code, Atom, Calendar, Link as LinkIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import FileUpload from '@/components/FileUpload';
import TVCAnswerKeyInput from '@/components/TVCAnswerKeyInput';

interface SubjectConfig {
  questionCount: number;
  answerKey: string[];
  oficiu: number;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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
    publishAt?: string;
    subjectConfig?: Record<string, SubjectConfig>;
  }) => Promise<void>;
}

const subjectOptions = [
  { value: 'matematica', label: 'Matematică', icon: Calculator, color: 'text-emerald-500' },
  { value: 'informatica', label: 'Informatică', icon: Code, color: 'text-blue-500' },
  { value: 'fizica', label: 'Fizică', icon: Atom, color: 'text-violet-500' },
];

const defaultSubjectConfig = (): Record<string, SubjectConfig> => ({
  matematica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0 },
  informatica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0 },
  fizica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0 },
});

const TVCCompletUploadModal = ({ isOpen, onClose, onSave }: TVCCompletUploadModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [timerMinutes, setTimerMinutes] = useState(180);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [publishTime, setPublishTime] = useState('');
  const [subjectConfig, setSubjectConfig] = useState<Record<string, SubjectConfig>>(defaultSubjectConfig());
  const [activeSubjectTab, setActiveSubjectTab] = useState('matematica');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const updateSubjectConfig = (subject: string, updates: Partial<SubjectConfig>) => {
    setSubjectConfig(prev => ({
      ...prev,
      [subject]: { ...prev[subject], ...updates },
    }));
  };

  const handleQuestionCountChange = (subject: string, value: string) => {
    const count = parseInt(value, 10);
    const current = subjectConfig[subject];
    const newAnswerKey = Array(count).fill('');
    for (let i = 0; i < Math.min(current.answerKey.length, count); i++) {
      newAnswerKey[i] = current.answerKey[i];
    }
    updateSubjectConfig(subject, { questionCount: count, answerKey: newAnswerKey });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setYear(new Date().getFullYear());
    setTimerMinutes(180);
    setPublishDate(undefined);
    setPublishTime('');
    setSubjectConfig(defaultSubjectConfig());
    setActiveSubjectTab('matematica');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Need at least one subject with a file
    const hasAnyFile = Object.values(subjectConfig).some(cfg => cfg.fileUrl);
    if (!hasAnyFile) return;

    setIsSaving(true);
    try {
      let publishAt: string | undefined;
      if (publishDate) {
        const dateStr = format(publishDate, 'yyyy-MM-dd');
        const timeStr = publishTime || '00:00';
        publishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }

      // Use the first available file as main file_url
      const firstSubjectWithFile = subjectOptions.find(s => subjectConfig[s.value]?.fileUrl);
      const mainFile = firstSubjectWithFile ? subjectConfig[firstSubjectWithFile.value] : null;

      await onSave({
        title: title.trim(),
        description: description.trim(),
        year,
        fileUrl: mainFile?.fileUrl || '',
        fileName: mainFile?.fileName || '',
        fileType: mainFile?.fileType || '',
        fileSize: mainFile?.fileSize || 0,
        timerMinutes,
        subject: 'tvc_complet',
        publishAt,
        subjectConfig,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
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

  const hasAnyFile = Object.values(subjectConfig).some(cfg => cfg.fileUrl);
  const isValid = title.trim() && hasAnyFile;

  const currentSubject = subjectConfig[activeSubjectTab];
  const SubjectIcon = subjectOptions.find(s => s.value === activeSubjectTab)?.icon || Calculator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-2xl mx-4 animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-xl text-foreground">Încarcă Test TVC Complet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Un singur test cu fișier și grilă separată pentru fiecare materie
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titlu *</Label>
              <Input
                id="title"
                placeholder="ex: TVC Complet 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background"
              />
            </div>
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
          </div>

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
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="180"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Minim 1 minut. La expirare, testul se trimite automat.
            </p>
          </div>

          {/* Per-Subject Section: File + Barem */}
          <div className="space-y-4 pt-2 border-t border-border">
            <Label className="text-base font-semibold flex items-center gap-2">
              Fișiere și Barem per Materie
            </Label>
            <p className="text-xs text-muted-foreground -mt-2">
              Încarcă un fișier separat și configurează grila pentru fiecare materie.
            </p>

            {/* Subject Tabs */}
            <div className="flex items-center gap-2">
              {subjectOptions.map((opt) => {
                const cfg = subjectConfig[opt.value];
                const hasFile = !!cfg?.fileUrl;
                const hasAnswers = cfg?.answerKey.some(a => a !== '');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActiveSubjectTab(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeSubjectTab === opt.value 
                        ? 'bg-gold text-primary-foreground' 
                        : 'bg-background hover:bg-muted border border-border'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{opt.label}</span>
                    {hasFile && hasAnswers && (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                    {hasFile && !hasAnswers && (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active subject config */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <SubjectIcon className={`w-5 h-5 ${subjectOptions.find(s => s.value === activeSubjectTab)?.color}`} />
                <h4 className="font-medium text-foreground">
                  {subjectOptions.find(s => s.value === activeSubjectTab)?.label}
                </h4>
              </div>

              {/* Per-subject file upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4 text-gold" />
                  Fișier pentru {subjectOptions.find(s => s.value === activeSubjectTab)?.label}
                </Label>
                
                {currentSubject.fileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                          {currentSubject.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileTypeLabel(currentSubject.fileType || '')} • {((currentSubject.fileSize || 0) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" variant="ghost" size="sm" 
                      onClick={() => updateSubjectConfig(activeSubjectTab, { fileUrl: undefined, fileName: undefined, fileType: undefined, fileSize: undefined })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <FileUpload
                    key={`upload-${activeSubjectTab}`}
                    onUploadComplete={(url, name, type, size) => updateSubjectConfig(activeSubjectTab, { fileUrl: url, fileName: name, fileType: type, fileSize: size })}
                    category="tvc_complet"
                    subject={activeSubjectTab}
                    multiple={false}
                  />
                )}
              </div>

              {/* Answer key config */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Număr de întrebări</Label>
                  <Select 
                    value={currentSubject.questionCount.toString()} 
                    onValueChange={(value) => handleQuestionCountChange(activeSubjectTab, value)}
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
                  <Label>Oficiu (puncte bonus)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={currentSubject.oficiu}
                    onChange={(e) => updateSubjectConfig(activeSubjectTab, { oficiu: Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="0"
                    className="bg-background"
                  />
                </div>
              </div>
              
              <TVCAnswerKeyInput
                value={currentSubject.answerKey}
                onChange={(newKey) => updateSubjectConfig(activeSubjectTab, { answerKey: newKey })}
                questionCount={currentSubject.questionCount}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/20 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Rezumat configurare:</p>
              {subjectOptions.map((opt) => {
                const cfg = subjectConfig[opt.value];
                const filled = cfg.answerKey.filter(a => a !== '').length;
                const hasFile = !!cfg.fileUrl;
                return (
                  <div key={opt.value} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <opt.icon className={`w-3 h-3 ${opt.color}`} />
                      {opt.label}
                    </span>
                    <span className="text-muted-foreground">
                      {hasFile ? '✓ Fișier' : '✗ Fișier'} • {filled}/{cfg.questionCount} răspunsuri • Oficiu: {cfg.oficiu}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
                Media ponderată: 50% Mate + 30% Info + 20% Fizică
              </div>
            </div>
          </div>

          {/* Scheduled Publish */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              Programează Publicarea (opțional)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Dacă setezi o dată, materialul va fi vizibil pentru elevi doar după acea dată și oră.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !publishDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {publishDate ? format(publishDate, "d MMM yyyy", { locale: ro }) : "Selectează data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={publishDate}
                    onSelect={setPublishDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                type="time"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
                placeholder="Ora"
                className="bg-background"
                disabled={!publishDate}
              />
            </div>
            {publishDate && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gold">
                  Va fi publicat: {format(publishDate, "d MMMM yyyy", { locale: ro })} la ora {publishTime || '00:00'}
                </p>
                <Button 
                  type="button" variant="ghost" size="sm"
                  onClick={() => { setPublishDate(undefined); setPublishTime(''); }}
                  className="text-xs h-6"
                >
                  Șterge programarea
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button type="button" variant="outline" onClick={handleClose}>
            Anulează
          </Button>
          <Button 
            variant="gold"
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
          >
            {isSaving ? 'Se salvează...' : 'Salvează Testul'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TVCCompletUploadModal;
