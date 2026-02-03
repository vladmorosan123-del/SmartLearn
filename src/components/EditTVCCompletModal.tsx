import { useState, useEffect } from 'react';
import { X, FileText, Save, Pencil, Clock, Calendar, Plus, Trash2, Calculator, Code, Atom } from 'lucide-react';
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

interface AdditionalTest {
  id: string;
  title: string;
  description: string;
  year: number;
  subject: string;
  questionCount: number;
  answerKey: string[];
  oficiu: number;
  timerMinutes: number;
  publishDate: Date | undefined;
  publishTime: string;
  uploadedFile: {
    url: string;
    name: string;
    type: string;
    size: number;
  } | null;
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
  }) => void;
  onAddTest: (data: {
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
  }) => Promise<void>;
  material: Material | null;
}

const subjectOptions = [
  { value: 'matematica', label: 'Matematică', icon: Calculator },
  { value: 'informatica', label: 'Informatică', icon: Code },
  { value: 'fizica', label: 'Fizică', icon: Atom },
];

const createEmptyAdditionalTest = (): AdditionalTest => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  year: new Date().getFullYear(),
  subject: 'matematica',
  questionCount: 9,
  answerKey: Array(9).fill(''),
  oficiu: 0,
  timerMinutes: 180,
  publishDate: undefined,
  publishTime: '',
  uploadedFile: null,
});

const EditTVCCompletModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  onAddTest,
  material
}: EditTVCCompletModalProps) => {
  // Main material state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [questionCount, setQuestionCount] = useState<number>(9);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(9).fill(''));
  const [timerMinutes, setTimerMinutes] = useState<number>(180);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [publishTime, setPublishTime] = useState<string>('');
  
  // Additional tests state
  const [additionalTests, setAdditionalTests] = useState<AdditionalTest[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | number>('main');
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when material changes
  useEffect(() => {
    if (material) {
      setTitle(material.title || '');
      setDescription(material.description || '');
      setYear(material.year || new Date().getFullYear());
      
      // Preserve existing answer key with correct question count
      const existingAnswerKey = Array.isArray(material.answer_key) && material.answer_key.length > 0
        ? material.answer_key
        : Array(9).fill('');
      const existingCount = existingAnswerKey.length;
      
      setQuestionCount(existingCount);
      setAnswerKey(existingAnswerKey);
      setTimerMinutes(material.timer_minutes || 180);
      
      if (material.publish_at) {
        const parsed = parseISO(material.publish_at);
        setPublishDate(parsed);
        setPublishTime(format(parsed, 'HH:mm'));
      } else {
        setPublishDate(undefined);
        setPublishTime('');
      }
      
      // Reset additional tests
      setAdditionalTests([]);
      setActiveTab('main');
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleClose = () => {
    setAdditionalTests([]);
    setActiveTab('main');
    onClose();
  };

  const addAdditionalTest = () => {
    if (additionalTests.length < 2) {
      setAdditionalTests(prev => [...prev, createEmptyAdditionalTest()]);
      setActiveTab(additionalTests.length);
    }
  };

  const removeAdditionalTest = (index: number) => {
    setAdditionalTests(prev => prev.filter((_, i) => i !== index));
    setActiveTab('main');
  };

  const updateAdditionalTest = (index: number, updates: Partial<AdditionalTest>) => {
    setAdditionalTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const handleQuestionCountChange = (index: number, value: string) => {
    const count = parseInt(value, 10);
    const test = additionalTests[index];
    const newAnswerKey = Array(count).fill('');
    for (let i = 0; i < Math.min(test.answerKey.length, count); i++) {
      newAnswerKey[i] = test.answerKey[i];
    }
    updateAdditionalTest(index, { questionCount: count, answerKey: newAnswerKey });
  };

  const handleUploadComplete = (index: number, fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    updateAdditionalTest(index, { 
      uploadedFile: { url: fileUrl, name: fileName, type: fileType, size: fileSize }
    });
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
      ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
      jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
    };
    return labels[type.toLowerCase()] || type.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      // Build publish_at timestamp if date is set
      let publishAt: string | null = null;
      if (publishDate) {
        const dateStr = format(publishDate, 'yyyy-MM-dd');
        const timeStr = publishTime || '00:00';
        publishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      }

      // Save main material changes
      onSave({
        title: title.trim(),
        description: description.trim(),
        year,
        answerKey,
        timerMinutes,
        publishAt,
      });

      // Save additional tests
      const validTests = additionalTests.filter(test => 
        test.title.trim() && 
        test.uploadedFile && 
        test.answerKey.every(a => a !== '')
      );

      for (const test of validTests) {
        let testPublishAt: string | undefined;
        if (test.publishDate) {
          const dateStr = format(test.publishDate, 'yyyy-MM-dd');
          const timeStr = test.publishTime || '00:00';
          testPublishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
        }

        await onAddTest({
          title: test.title.trim(),
          description: test.description.trim(),
          year: test.year,
          fileUrl: test.uploadedFile!.url,
          fileName: test.uploadedFile!.name,
          fileType: test.uploadedFile!.type,
          fileSize: test.uploadedFile!.size,
          answerKey: test.answerKey,
          oficiu: test.oficiu,
          timerMinutes: test.timerMinutes,
          subject: test.subject,
          publishAt: testPublishAt,
        });
      }

      setAdditionalTests([]);
      setActiveTab('main');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const currentAdditionalTest = typeof activeTab === 'number' ? additionalTests[activeTab] : null;

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
                Modifică testul sau adaugă teste suplimentare
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'main' 
                ? 'bg-gold text-primary-foreground' 
                : 'bg-background hover:bg-muted'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Test Principal</span>
          </button>
          
          {additionalTests.map((test, index) => {
            const SubjectIcon = subjectOptions.find(s => s.value === test.subject)?.icon || Calculator;
            const isValid = test.title.trim() && test.uploadedFile && test.answerKey.every(a => a !== '');
            return (
              <button
                key={test.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === index 
                    ? 'bg-gold text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                <SubjectIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Test Nou {index + 1}</span>
                {isValid && <span className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            );
          })}
          
          {additionalTests.length < 2 && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-1 whitespace-nowrap"
              onClick={addAdditionalTest}
            >
              <Plus className="w-4 h-4" />
              Adaugă Test Nou
            </Button>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'main' ? (
            <>
              {/* Main Material Edit Form */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titlu *</Label>
                <Input
                  id="edit-title"
                  placeholder="ex: TVC Matematică 2024"
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

              {/* Current File Info */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Fișier Curent
                </Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-5 h-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                      {material.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {material.file_type?.toUpperCase()} 
                      {material.file_size && ` • ${(material.file_size / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                </div>
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

              {/* Answer Key */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Număr de întrebări</Label>
                  <Select 
                    value={questionCount.toString()} 
                    onValueChange={(value) => {
                      const newCount = parseInt(value, 10);
                      const newAnswerKey = Array(newCount).fill('');
                      // Preserve existing answers
                      for (let i = 0; i < Math.min(answerKey.length, newCount); i++) {
                        newAnswerKey[i] = answerKey[i];
                      }
                      setQuestionCount(newCount);
                      setAnswerKey(newAnswerKey);
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
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => { setPublishDate(undefined); setPublishTime(''); }}
                      className="text-xs h-6"
                    >
                      Șterge programarea
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : currentAdditionalTest ? (
            <>
              {/* Additional Test Form */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Test Nou {activeTab + 1}</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive gap-1"
                  onClick={() => removeAdditionalTest(activeTab)}
                >
                  <Trash2 className="w-4 h-4" />
                  Șterge
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Materie *</Label>
                  <Select 
                    value={currentAdditionalTest.subject} 
                    onValueChange={(value) => updateAdditionalTest(activeTab, { subject: value })}
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
                  <Label>Anul</Label>
                  <Input
                    type="number"
                    value={currentAdditionalTest.year}
                    onChange={(e) => updateAdditionalTest(activeTab, { year: parseInt(e.target.value) })}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input
                  placeholder="ex: TVC Informatică 2024"
                  value={currentAdditionalTest.title}
                  onChange={(e) => updateAdditionalTest(activeTab, { title: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Descriere (opțional)</Label>
                <textarea
                  placeholder="Descriere scurtă..."
                  value={currentAdditionalTest.description}
                  onChange={(e) => updateAdditionalTest(activeTab, { description: e.target.value })}
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
                
                {currentAdditionalTest.uploadedFile ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {currentAdditionalTest.uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileTypeLabel(currentAdditionalTest.uploadedFile.type)} • {(currentAdditionalTest.uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updateAdditionalTest(activeTab, { uploadedFile: null })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <FileUpload
                    key={currentAdditionalTest.id}
                    onUploadComplete={(url, name, type, size) => handleUploadComplete(activeTab, url, name, type, size)}
                    category="tvc_complet"
                    subject={currentAdditionalTest.subject}
                  />
                )}
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  Durată Timer (minute)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={600}
                  value={currentAdditionalTest.timerMinutes}
                  onChange={(e) => updateAdditionalTest(activeTab, { timerMinutes: Math.max(1, parseInt(e.target.value) || 180) })}
                  placeholder="180"
                  className="bg-background"
                />
              </div>

              {/* Answer Key */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Număr de întrebări</Label>
                    <Select 
                      value={currentAdditionalTest.questionCount.toString()} 
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
                    <Label>Oficiu (puncte bonus)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={currentAdditionalTest.oficiu}
                      onChange={(e) => updateAdditionalTest(activeTab, { oficiu: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="0"
                      className="bg-background"
                    />
                  </div>
                </div>
                
                <TVCAnswerKeyInput
                  value={currentAdditionalTest.answerKey}
                  onChange={(newKey) => updateAdditionalTest(activeTab, { answerKey: newKey })}
                  questionCount={currentAdditionalTest.questionCount}
                />
              </div>

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
                          !currentAdditionalTest.publishDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {currentAdditionalTest.publishDate ? format(currentAdditionalTest.publishDate, "d MMM yyyy", { locale: ro }) : "Selectează data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={currentAdditionalTest.publishDate}
                        onSelect={(date) => updateAdditionalTest(activeTab, { publishDate: date })}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Input
                    type="time"
                    value={currentAdditionalTest.publishTime}
                    onChange={(e) => updateAdditionalTest(activeTab, { publishTime: e.target.value })}
                    placeholder="Ora"
                    className="bg-background"
                    disabled={!currentAdditionalTest.publishDate}
                  />
                </div>
              </div>
            </>
          ) : null}

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
