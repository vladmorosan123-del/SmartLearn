import { useState, useEffect } from 'react';
import { X, FileText, Save, Pencil, Clock, Calendar, Upload } from 'lucide-react';
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

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    year?: number;
    answerKey?: string[];
    oficiu?: number;
    timerMinutes?: number;
    publishAt?: string | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) => void;
  material: Material | null;
  showYear?: boolean;
  showAnswerKey?: boolean;
  showTimer?: boolean;
}

const EditMaterialModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  material,
  showYear = false,
  showAnswerKey = false,
  showTimer = false
}: EditMaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [questionCount, setQuestionCount] = useState<number>(9);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(9).fill(''));
  const [oficiu, setOficiu] = useState<number>(0);
  const [timerMinutes, setTimerMinutes] = useState<number>(180);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [publishTime, setPublishTime] = useState<string>('');
  
  // File replacement state
  const [replacementFile, setReplacementFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null);

  // Populate form when material changes
  useEffect(() => {
    if (material) {
      setTitle(material.title || '');
      setDescription(material.description || '');
      setYear(material.year || new Date().getFullYear());
      setOficiu(material.oficiu || 0);
      setTimerMinutes(material.timer_minutes || 180);
      setReplacementFile(null);
      
      // Properly restore answer key with correct question count
      const rawKey = material.answer_key;
      const existingKey = Array.isArray(rawKey) && rawKey.length > 0
        ? rawKey.map(v => String(v ?? ''))
        : Array(9).fill('');
      setQuestionCount(existingKey.length);
      setAnswerKey([...existingKey]);
      
      // Parse existing publish_at
      if (material.publish_at) {
        const parsed = parseISO(material.publish_at);
        setPublishDate(parsed);
        setPublishTime(format(parsed, 'HH:mm'));
      } else {
        setPublishDate(undefined);
        setPublishTime('');
      }
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleClose = () => {
    onClose();
  };

  const handleQuestionCountChange = (value: string) => {
    const newCount = parseInt(value, 10);
    const newKey = Array(newCount).fill('');
    for (let i = 0; i < Math.min(answerKey.length, newCount); i++) {
      newKey[i] = answerKey[i];
    }
    setQuestionCount(newCount);
    setAnswerKey(newKey);
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setReplacementFile({ url: fileUrl, name: fileName, type: fileType, size: fileSize });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build publish_at timestamp if date is set
    let publishAt: string | null = null;
    if (publishDate) {
      const dateStr = format(publishDate, 'yyyy-MM-dd');
      const timeStr = publishTime || '00:00';
      publishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      year: showYear ? year : undefined,
      answerKey: showAnswerKey ? answerKey : undefined,
      oficiu: showAnswerKey ? oficiu : undefined,
      timerMinutes: showTimer ? timerMinutes : undefined,
      publishAt,
      // Include file replacement data if a new file was uploaded
      ...(replacementFile ? {
        fileUrl: replacementFile.url,
        fileName: replacementFile.name,
        fileType: replacementFile.type,
        fileSize: replacementFile.size,
      } : {}),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <Pencil className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Editează Material</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Modifică detaliile materialului</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titlu *</Label>
            <Input
              id="edit-title"
              placeholder="ex: Model BAC 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          {showYear && (
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
          )}

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

          {/* Current File Info + Replace */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              Fișier {replacementFile ? 'Nou' : 'Curent'}
            </Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                  {replacementFile ? replacementFile.name : material.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(replacementFile ? replacementFile.type : material.file_type)?.toUpperCase()} 
                  {(() => {
                    const size = replacementFile ? replacementFile.size : material.file_size;
                    if (!size) return '';
                    return size >= 1024 * 1024
                      ? ` • ${(size / (1024 * 1024)).toFixed(1)} MB`
                      : ` • ${(size / 1024).toFixed(1)} KB`;
                  })()}
                </p>
              </div>
              {replacementFile && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setReplacementFile(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* File upload for replacement */}
            {!replacementFile && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Încarcă un fișier nou pentru a înlocui cel existent:
                </p>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  category={material.category}
                  subject={material.subject}
                  multiple={false}
                />
              </div>
            )}
          </div>

          {/* Answer Key Section with question count selector */}
          {showAnswerKey && (
            <div className="pt-2 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Număr de întrebări</Label>
                  <Select
                    value={questionCount.toString()}
                    onValueChange={handleQuestionCountChange}
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
                    value={oficiu}
                    onChange={(e) => setOficiu(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="bg-background"
                  />
                </div>
              </div>

              <TVCAnswerKeyInput
                value={answerKey}
                onChange={setAnswerKey}
                questionCount={questionCount}
              />
            </div>
          )}

          {/* Custom Timer */}
          {showTimer && (
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
              <p className="text-xs text-muted-foreground">
                Setează durata testului în minute (ex: 180 = 3 ore).
              </p>
            </div>
          )}

          {/* Scheduled Publish Date/Time */}
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Anulează
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              className="flex-1 gap-2"
              disabled={!title.trim()}
            >
              <Save className="w-4 h-4" />
              Salvează Modificările
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialModal;
