import { useState } from 'react';
import { X, FileText, Clock, Calendar, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import FileUpload from '@/components/FileUpload';
import TVCAnswerKeyInput from '@/components/TVCAnswerKeyInput';

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
    answerKey?: string[];
    oficiu?: number;
    itemPoints?: number[];
    timerMinutes?: number;
    subject?: string;
    publishAt?: string;
  }) => void;
  title: string;
  category: string;
  subject: string;
  showYear?: boolean;
  showAnswerKey?: boolean;
  showTimer?: boolean;
  showSubjectSelector?: boolean;
}

const tvcSubjectOptions = [
  { value: 'matematica', label: 'Matematică' },
  { value: 'informatica', label: 'Informatică' },
  { value: 'fizica', label: 'Fizică' },
];

const UploadMaterialModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title: modalTitle,
  category,
  subject,
  showYear = false,
  showAnswerKey = false,
  showTimer = false,
  showSubjectSelector = false
}: UploadMaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedSubject, setSelectedSubject] = useState(subject);
  const [questionCount, setQuestionCount] = useState<number>(9);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(9).fill(''));
  const [itemPoints, setItemPoints] = useState<number[]>(Array(9).fill(1));
  const [oficiu, setOficiu] = useState<number>(0);
  const [timerMinutes, setTimerMinutes] = useState<number>(180);
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [publishTime, setPublishTime] = useState<string>('');
  const [uploadTab, setUploadTab] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  }[]>([]);

  if (!isOpen) return null;

  const handleQuestionCountChange = (value: string) => {
    const count = parseInt(value, 10);
    setQuestionCount(count);
    // Resize answer key array
    const newAnswerKey = Array(count).fill('');
    for (let i = 0; i < Math.min(answerKey.length, count); i++) {
      newAnswerKey[i] = answerKey[i];
    }
    setAnswerKey(newAnswerKey);
    // Resize item points array
    const newPoints = Array(count).fill(1);
    for (let i = 0; i < Math.min(itemPoints.length, count); i++) {
      newPoints[i] = itemPoints[i];
    }
    setItemPoints(newPoints);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setYear(new Date().getFullYear());
    setSelectedSubject(subject);
    setQuestionCount(9);
    setAnswerKey(Array(9).fill(''));
    setItemPoints(Array(9).fill(1));
    setOficiu(0);
    setTimerMinutes(180);
    setPublishDate(undefined);
    setPublishTime('');
    setUploadTab('file');
    setLinkUrl('');
    setUploadedFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasLink = uploadTab === 'link' && linkUrl.trim();
    
    if (!title.trim() || (uploadedFiles.length === 0 && !hasLink)) return;

    let publishAt: string | undefined;
    if (publishDate) {
      const dateStr = format(publishDate, 'yyyy-MM-dd');
      const timeStr = publishTime || '00:00';
      publishAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    }

    if (hasLink) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        year: showYear ? year : undefined,
        fileUrl: linkUrl.trim(),
        fileName: linkUrl.trim(),
        fileType: 'link',
        fileSize: 0,
        answerKey: showAnswerKey ? answerKey : undefined,
        oficiu: showAnswerKey ? oficiu : undefined,
        itemPoints: showAnswerKey ? itemPoints : undefined,
        timerMinutes: showTimer ? timerMinutes : undefined,
        subject: showSubjectSelector ? selectedSubject : undefined,
        publishAt,
      });
    } else {
      for (const file of uploadedFiles) {
        onSave({
          title: uploadedFiles.length > 1 ? `${title.trim()} - ${file.name}` : title.trim(),
          description: description.trim(),
          year: showYear ? year : undefined,
          fileUrl: file.url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          answerKey: showAnswerKey ? answerKey : undefined,
          oficiu: showAnswerKey ? oficiu : undefined,
          itemPoints: showAnswerKey ? itemPoints : undefined,
          timerMinutes: showTimer ? timerMinutes : undefined,
          subject: showSubjectSelector ? selectedSubject : undefined,
          publishAt,
        });
      }
    }
    resetForm();
    onClose();
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFiles(prev => [...prev, { url: fileUrl, name: fileName, type: fileType, size: fileSize }]);
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
      ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
      jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
      mp4: 'Video', webm: 'Video', mov: 'Video', avi: 'Video', mkv: 'Video',
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

          {showSubjectSelector && (
            <div className="space-y-2">
              <Label htmlFor="subject">Materie *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Selectează materia" />
                </SelectTrigger>
                <SelectContent>
                  {tvcSubjectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              Încarcă fișier sau link *
            </Label>
            
            <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'file' | 'link')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Fișier
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Link
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="mt-0">
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gold" />
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getFileTypeLabel(file.type)} • {file.size >= 1024 * 1024 
                                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${(file.size / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  category={category}
                  subject={showSubjectSelector ? selectedSubject : subject}
                />
              </TabsContent>
              
              <TabsContent value="link" className="mt-0">
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adaugă un link extern (YouTube, Google Drive, etc.)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Answer Key Input for TVC */}
          {showAnswerKey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionCount">Număr de întrebări</Label>
                  <Select value={questionCount.toString()} onValueChange={handleQuestionCountChange}>
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
                itemPoints={itemPoints}
                onItemPointsChange={setItemPoints}
                showItemPoints={true}
              />
            </div>
          )}

          {/* Custom Timer for TVC Complet */}
          {showTimer && (
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
                onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 180))}
                placeholder="180"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Setează durata testului în minute (ex: 180 = 3 ore). La expirare, testul se trimite automat.
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
              className="flex-1"
              disabled={!title.trim() || (uploadedFiles.length === 0 && !(uploadTab === 'link' && linkUrl.trim()))}
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
