import { useState, useEffect } from 'react';
import { X, FileText, Save, Pencil, Clock, Calendar, Plus, Trash2, Calculator, Code, Atom, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import TVCAnswerKeyInput from '@/components/TVCAnswerKeyInput';
import FileUpload from '@/components/FileUpload';
import { Material } from '@/hooks/useMaterials';

interface SubjectFileInfo {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface SubjectConfig {
  questionCount: number;
  answerKey: string[];
  oficiu: number;
  files: SubjectFileInfo[];
}

interface EditTVCCompletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    year?: number;
    answerKey?: string[];
    timerMinutes?: number;
    publishAt?: string | null;
    subjectConfig?: Record<string, SubjectConfig>;
  }) => void;
  material: Material | null;
}

const subjectOptions = [
  { value: 'matematica', label: 'Matematică', icon: Calculator, color: 'text-emerald-500' },
  { value: 'informatica', label: 'Informatică', icon: Code, color: 'text-blue-500' },
  { value: 'fizica', label: 'Fizică', icon: Atom, color: 'text-violet-500' },
];

const getFileTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
    jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
  };
  return labels[type.toLowerCase()] || type.toUpperCase();
};

const EditTVCCompletModal = ({ isOpen, onClose, onSave, material }: EditTVCCompletModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [timerMinutes, setTimerMinutes] = useState<number>(180);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [publishTime, setPublishTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Multi-subject state
  const [subjectConfig, setSubjectConfig] = useState<Record<string, SubjectConfig>>({
    matematica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0, files: [] },
    informatica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0, files: [] },
    fizica: { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0, files: [] },
  });
  const [activeSubjectTab, setActiveSubjectTab] = useState('matematica');

  // Legacy single-subject state (fallback for non-multi-subject materials)
  const [questionCount, setQuestionCount] = useState<number>(9);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(9).fill(''));

  const isMultiSubject = !!(material?.subject_config && Object.keys(material.subject_config).length > 0);

  // Populate form when material changes
  useEffect(() => {
    if (material) {
      setTitle(material.title || '');
      setDescription(material.description || '');
      setYear(material.year || new Date().getFullYear());
      setTimerMinutes(material.timer_minutes || 180);

      if (material.publish_at) {
        const parsed = parseISO(material.publish_at);
        setPublishDate(parsed);
        setPublishTime(format(parsed, 'HH:mm'));
      } else {
        setPublishDate(undefined);
        setPublishTime('');
      }

      // Populate subject_config or legacy answer_key
      if (material.subject_config && Object.keys(material.subject_config).length > 0) {
        const config: Record<string, SubjectConfig> = {};
        for (const [subj, cfg] of Object.entries(material.subject_config)) {
          const files: SubjectFileInfo[] = cfg.files && cfg.files.length > 0
            ? cfg.files
            : (cfg as any).fileUrl
              ? [{ url: (cfg as any).fileUrl, name: (cfg as any).fileName || '', type: (cfg as any).fileType || '', size: (cfg as any).fileSize || 0 }]
              : [];
          config[subj] = {
            questionCount: cfg.questionCount || 9,
            answerKey: Array.isArray(cfg.answerKey) ? [...cfg.answerKey] : Array(cfg.questionCount || 9).fill(''),
            oficiu: cfg.oficiu || 0,
            files,
          };
        }
        // Ensure all 3 subjects exist
        for (const opt of subjectOptions) {
          if (!config[opt.value]) {
            config[opt.value] = { questionCount: 9, answerKey: Array(9).fill(''), oficiu: 0, files: [] };
          }
        }
        setSubjectConfig(config);
        setActiveSubjectTab('matematica');
      } else {
        // Legacy single-subject
        const existingAnswerKey = Array.isArray(material.answer_key) && material.answer_key.length > 0
          ? material.answer_key
          : Array(9).fill('');
        setQuestionCount(existingAnswerKey.length);
        setAnswerKey(existingAnswerKey);
      }
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleClose = () => {
    onClose();
  };

  const updateSubjectCfg = (subject: string, updates: Partial<SubjectConfig>) => {
    setSubjectConfig(prev => ({
      ...prev,
      [subject]: { ...prev[subject], ...updates },
    }));
  };

  const handleSubjectQuestionCountChange = (subject: string, value: string) => {
    const count = parseInt(value, 10);
    const current = subjectConfig[subject];
    const newAnswerKey = Array(count).fill('');
    for (let i = 0; i < Math.min(current.answerKey.length, count); i++) {
      newAnswerKey[i] = current.answerKey[i];
    }
    updateSubjectCfg(subject, { questionCount: count, answerKey: newAnswerKey });
  };

  const handleUploadComplete = (subject: string, url: string, name: string, type: string, size: number) => {
    setSubjectConfig(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        files: [...prev[subject].files, { url, name, type, size }],
      },
    }));
  };

  const removeFile = (subject: string, index: number) => {
    setSubjectConfig(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        files: prev[subject].files.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      let publishAt: string | null = null;
      if (publishDate) {
        const dateStr = format(publishDate, 'yyyy-MM-dd');
        const timeStr = publishTime || '00:00';
        publishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }

      if (isMultiSubject) {
        onSave({
          title: title.trim(),
          description: description.trim(),
          year,
          timerMinutes,
          publishAt,
          subjectConfig,
        });
      } else {
        onSave({
          title: title.trim(),
          description: description.trim(),
          year,
          answerKey,
          timerMinutes,
          publishAt,
        });
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const currentSubject = subjectConfig[activeSubjectTab];
  const SubjectIcon = subjectOptions.find(s => s.value === activeSubjectTab)?.icon || Calculator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-2xl mx-4 animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <Pencil className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Editează TVC Complet</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isMultiSubject ? 'Modifică testul multi-disciplinar' : 'Modifică testul'}
              </p>
            </div>
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
              <Label htmlFor="edit-title">Titlu *</Label>
              <Input
                id="edit-title"
                placeholder="ex: TVC Complet 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Anul</Label>
              <Input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descriere (opțional)</Label>
            <textarea
              id="edit-description"
              placeholder="Descriere scurtă..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none text-sm"
            />
          </div>

          {/* Timer */}
          <div className="space-y-2">
            <Label htmlFor="edit-timerMinutes" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Durată Timer (minute)
            </Label>
            <Input
              id="edit-timerMinutes"
              type="number"
              min={1}
              max={600}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 180))}
              placeholder="180"
              className="bg-background"
            />
          </div>

          {/* Multi-subject editing */}
          {isMultiSubject ? (
            <div className="space-y-4 pt-2 border-t border-border">
              <Label className="text-base font-semibold flex items-center gap-2">
                Fișiere și Barem per Materie
              </Label>

              {/* Subject Tabs */}
              <div className="flex items-center gap-2">
                {subjectOptions.map((opt) => {
                  const cfg = subjectConfig[opt.value];
                  const hasFiles = cfg?.files.length > 0;
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
                      {hasFiles && hasAnswers && <span className="w-2 h-2 rounded-full bg-green-500" />}
                      {hasFiles && !hasAnswers && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
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

                {/* Uploaded files */}
                {currentSubject.files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {currentSubject.files.length} {currentSubject.files.length === 1 ? 'fișier' : 'fișiere'}
                    </Label>
                    {currentSubject.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gold" />
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[250px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getFileTypeLabel(file.type)} • {file.size >= 1024 * 1024
                                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${(file.size / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(activeSubjectTab, idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4 text-gold" />
                    Adaugă fișiere pentru {subjectOptions.find(s => s.value === activeSubjectTab)?.label}
                  </Label>
                  <FileUpload
                    key={`edit-upload-${activeSubjectTab}`}
                    onUploadComplete={(url, name, type, size) => handleUploadComplete(activeSubjectTab, url, name, type, size)}
                    category="tvc_complet"
                    subject={activeSubjectTab}
                    multiple={true}
                  />
                </div>

                {/* Answer key config */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Număr de întrebări</Label>
                    <Select
                      value={currentSubject.questionCount.toString()}
                      onValueChange={(value) => handleSubjectQuestionCountChange(activeSubjectTab, value)}
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
                      onChange={(e) => updateSubjectCfg(activeSubjectTab, { oficiu: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                </div>

                <TVCAnswerKeyInput
                  value={currentSubject.answerKey}
                  onChange={(newKey) => updateSubjectCfg(activeSubjectTab, { answerKey: newKey })}
                  questionCount={currentSubject.questionCount}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Rezumat configurare:</p>
                {subjectOptions.map((opt) => {
                  const cfg = subjectConfig[opt.value];
                  const filled = cfg.answerKey.filter(a => a !== '').length;
                  return (
                    <div key={opt.value} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <opt.icon className={`w-3 h-3 ${opt.color}`} />
                        {opt.label}
                      </span>
                      <span className="text-muted-foreground">
                        {cfg.files.length > 0 ? `✓ ${cfg.files.length} fișiere` : '✗ Fișier'} • {filled}/{cfg.questionCount} răspunsuri • Oficiu: {cfg.oficiu}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Legacy single-subject answer key */
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <Label>Fișier Curent</Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[250px]">{material.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {material.file_type?.toUpperCase()}
                      {material.file_size && ` • ${(material.file_size / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Număr de întrebări</Label>
                <Select
                  value={questionCount.toString()}
                  onValueChange={(value) => {
                    const newCount = parseInt(value, 10);
                    const newKey = Array(newCount).fill('');
                    for (let i = 0; i < Math.min(answerKey.length, newCount); i++) {
                      newKey[i] = answerKey[i];
                    }
                    setQuestionCount(newCount);
                    setAnswerKey(newKey);
                  }}
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

              <TVCAnswerKeyInput
                value={answerKey}
                onChange={setAnswerKey}
                questionCount={questionCount}
              />
            </div>
          )}

          {/* Scheduled Publish */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              Programează Publicarea (opțional)
            </Label>
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

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Anulează
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1 gap-2"
              disabled={!title.trim() || isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTVCCompletModal;
