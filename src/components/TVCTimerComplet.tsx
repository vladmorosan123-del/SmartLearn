import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Send, Clock, FileText, Download, AlertTriangle, ClipboardCheck, X, Calculator, Code, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/downloadFile';
import TVCQuizAutoSubmit from '@/components/TVCQuizAutoSubmit';
import TVCQuizMultiSubject from '@/components/TVCQuizMultiSubject';
import { supabase } from '@/integrations/supabase/client';
import ZoomableWrapper from '@/components/ZoomableWrapper';
import ImageZoomViewer from '@/components/ImageZoomViewer';

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
  files?: SubjectFileInfo[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

const getSubjectFiles = (cfg: SubjectConfig): SubjectFileInfo[] => {
  if (cfg.files && cfg.files.length > 0) return cfg.files;
  if (cfg.fileUrl) return [{ url: cfg.fileUrl, name: cfg.fileName || '', type: cfg.fileType || '', size: cfg.fileSize || 0 }];
  return [];
};

interface TVCTimerCompletProps {
  subjectTitle: string;
  onClose: () => void;
  pdfUrl?: string;
  fileType?: string;
  fileName?: string;
  hasAnswerKey?: boolean;
  questionCount?: number;
  materialId?: string;
  timerMinutes?: number;
  subjectConfig?: Record<string, SubjectConfig> | null;
}

const getPdfViewerUrl = (url: string) => {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};

const subjectMeta: Record<string, { label: string; icon: typeof Calculator; color: string }> = {
  matematica: { label: 'Matematică', icon: Calculator, color: 'text-emerald-500' },
  informatica: { label: 'Informatică', icon: Code, color: 'text-blue-500' },
  fizica: { label: 'Fizică', icon: Atom, color: 'text-violet-500' },
};

const TVCTimerComplet = ({ 
  subjectTitle, 
  onClose, 
  pdfUrl, 
  fileType,
  fileName,
  hasAnswerKey, 
  questionCount: initialQuestionCount, 
  materialId,
  timerMinutes = 1,
  subjectConfig,
}: TVCTimerCompletProps) => {
  const INITIAL_TIME = timerMinutes * 60;
  
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount || 0);
  const [isLoadingQuestionCount, setIsLoadingQuestionCount] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showTimeUpWarning, setShowTimeUpWarning] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Track active subject for file switching in multi-subject mode
  const [activeViewSubject, setActiveViewSubject] = useState<string>('matematica');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  
  const quizRef = useRef<{ forceSubmit: () => void } | null>(null);
  const multiSubjectQuizRef = useRef<{ forceSubmit: () => void } | null>(null);

  const isMultiSubject = !!subjectConfig && Object.keys(subjectConfig).length > 0;

  // Get current file URL based on active subject (for multi-subject) or fallback
  // Get all files for the active subject
  const getCurrentSubjectFiles = (): SubjectFileInfo[] => {
    if (isMultiSubject && subjectConfig) {
      const cfg = subjectConfig[activeViewSubject];
      if (cfg) return getSubjectFiles(cfg);
    }
    if (pdfUrl) return [{ url: pdfUrl, name: fileName || '', type: fileType || '', size: 0 }];
    return [];
  };

  const currentSubjectFiles = getCurrentSubjectFiles();
  const currentFile = currentSubjectFiles[activeFileIndex] || currentSubjectFiles[0] || { url: '', type: '', name: '' };

  // Reset file index when subject changes
  useEffect(() => {
    setActiveFileIndex(0);
  }, [activeViewSubject]);

  // Fetch question count if not provided (for legacy single-subject tests)
  useEffect(() => {
    if (!isMultiSubject && hasAnswerKey && materialId && !initialQuestionCount) {
      setIsLoadingQuestionCount(true);
      const fetchCount = async () => {
        try {
          const { data, error } = await supabase.rpc('get_material_question_count', { _material_id: materialId });
          if (!error && typeof data === 'number') setQuestionCount(data);
        } catch (err) {
          console.error('Error fetching question count:', err);
        }
        setIsLoadingQuestionCount(false);
      };
      fetchCount();
    } else if (initialQuestionCount) {
      setQuestionCount(initialQuestionCount);
    }
  }, [hasAnswerKey, materialId, initialQuestionCount, isMultiSubject]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsTimeUp(true);
            if (isMultiSubject && multiSubjectQuizRef.current) {
              multiSubjectQuizRef.current.forceSubmit();
            } else if (quizRef.current) {
              quizRef.current.forceSubmit();
            }
            return 0;
          }
          if (prev === 300) {
            setShowTimeUpWarning(true);
            setTimeout(() => setShowTimeUpWarning(false), 5000);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft, isMultiSubject]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    setHasStarted(true);
  };

  const handleSubmitTest = () => {
    setIsRunning(false);
    setIsTimeUp(true);
    setHasSubmitted(true);
    if (isMultiSubject && multiSubjectQuizRef.current) {
      multiSubjectQuizRef.current.forceSubmit();
    } else if (quizRef.current) {
      quizRef.current.forceSubmit();
    }
  };

  const handleClose = () => { onClose(); };

  const quizAvailable = isMultiSubject || (hasAnswerKey && questionCount > 0 && materialId);
  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

  const ext = (currentFile.type || currentFile.url?.split('?')[0]?.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

  const getTimerColor = () => {
    if (isTimeUp) return 'text-destructive';
    if (timeLeft <= 300) return 'text-orange-500';
    if (timeLeft <= 600) return 'text-yellow-500';
    return 'text-gold';
  };

  // Subject label for the file viewer header
  const activeSubjectLabel = isMultiSubject && subjectMeta[activeViewSubject] 
    ? `${subjectTitle} — ${subjectMeta[activeViewSubject].label}` 
    : subjectTitle;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/90" />
      
      {showTimeUpWarning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-up">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">⚠️ Atenție! Mai ai doar 5 minute!</span>
          </div>
        </div>
      )}
      
      <div className="relative flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden">
        {/* Left Side - PDF Viewer */}
        {hasStarted ? (
          <div className="min-h-[60vh] md:min-h-0 md:flex-1 flex flex-col bg-background/95 md:border-r border-b md:border-b-0 border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gold" />
                <h2 className="font-display text-lg text-foreground">{activeSubjectLabel}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted ${getTimerColor()}`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
                {/* Download removed for students */}
                <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Subject file tabs for multi-subject */}
            {isMultiSubject && subjectConfig && (
              <div className="flex flex-col border-b border-border bg-muted/30">
                <div className="flex items-center gap-1 px-4 py-2">
                  {Object.keys(subjectConfig).map((subject) => {
                    const meta = subjectMeta[subject];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const files = getSubjectFiles(subjectConfig[subject]);
                    const hasFiles = files.length > 0;
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setActiveViewSubject(subject)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          activeViewSubject === subject 
                            ? 'bg-gold text-primary-foreground' 
                            : hasFiles 
                            ? 'bg-background hover:bg-muted border border-border' 
                            : 'bg-background/50 text-muted-foreground border border-border/50'
                        }`}
                        disabled={!hasFiles}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-medium">{meta.label}</span>
                        {hasFiles && <span className="text-[10px] opacity-70">({files.length})</span>}
                      </button>
                    );
                  })}
                </div>
                {/* File switcher within subject */}
                {currentSubjectFiles.length > 1 && (
                  <div className="flex items-center gap-1 px-4 py-1.5 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground mr-1">Fișiere:</span>
                    {currentSubjectFiles.map((file, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveFileIndex(idx)}
                        className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                          activeFileIndex === idx
                            ? 'bg-gold/80 text-primary-foreground'
                            : 'bg-background hover:bg-muted border border-border'
                        }`}
                      >
                        {file.name || `Fișier ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {currentFile.url ? (
                isImage ? (
                  <ImageZoomViewer src={currentFile.url} alt={currentFile.name || subjectTitle} />
                ) : isPdf ? (
                  <ZoomableWrapper>
                    <iframe 
                      key={currentFile.url}
                      src={getPdfViewerUrl(currentFile.url)} 
                      className="w-full h-full rounded-lg border border-border bg-white" 
                      title="TVC Subject PDF" 
                      allow="autoplay" 
                    />
                  </ZoomableWrapper>
                ) : (
                  <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-lg text-foreground mb-2">Fișierul nu poate fi afișat aici</h3>
                    <p className="text-muted-foreground text-sm">Descarcă fișierul sau deschide-l într-un tab nou.</p>
                  </div>
                )
              ) : (
                <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-lg text-foreground mb-2">Nu există fișier pentru această materie</h3>
                  <p className="text-muted-foreground text-sm">Selectează o altă materie din tab-urile de sus.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-background/95 md:border-r border-border items-center justify-center">
            <div className="text-center p-12 max-w-md">
              <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gold" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-4">{subjectTitle}</h2>
              <p className="text-muted-foreground mb-6">
                Apasă butonul "Începe Testul" pentru a începe. <br />
                Ai la dispoziție <span className="text-gold font-bold">{timerMinutes} minute</span> pentru a rezolva subiectul.
              </p>
              {isMultiSubject && (
                <div className="mb-6 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Test multi-disciplinar:</p>
                  <div className="flex justify-center gap-4">
                    <span className="flex items-center gap-1"><Calculator className="w-3 h-3" /> Mate 50%</span>
                    <span className="flex items-center gap-1"><Code className="w-3 h-3" /> Info 30%</span>
                    <span className="flex items-center gap-1"><Atom className="w-3 h-3" /> Fizică 20%</span>
                  </div>
                </div>
              )}
              <Button variant="gold" size="lg" onClick={handleStart} className="gap-2">
                <Play className="w-5 h-5" />
                Începe Testul
              </Button>
            </div>
          </div>
        )}

        {/* Right Side - Quiz Panel */}
        <div className="w-full md:w-80 lg:w-[480px] flex flex-col bg-card md:border-l border-border overflow-hidden">
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border bg-gold/10">
            <Clock className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">
              {hasStarted ? 'Test în desfășurare' : 'Pregătit pentru test'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!hasStarted ? (
              <div className="flex flex-col items-center justify-center p-6 h-full">
                <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-12 h-12 text-gold" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2 text-center">Pregătit pentru test?</h3>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Apasă "Începe Testul" pentru a vedea subiectul și a completa grila.
                </p>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-mono text-3xl font-bold text-gold">{formatTime(INITIAL_TIME)}</span>
                  <p className="text-xs text-muted-foreground mt-2">Timp disponibil</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Timer Display */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted" />
                        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="none"
                          className={`transition-all duration-1000 ${getTimerColor()}`}
                          strokeLinecap="round"
                          style={{ strokeDasharray: `${2 * Math.PI * 72} ${2 * Math.PI * 72}`, strokeDashoffset: 2 * Math.PI * 72 * (1 - progress / 100) }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-mono text-xl lg:text-2xl font-bold ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
                        {isRunning && <span className="text-xs text-gold mt-1 animate-pulse">În desfășurare</span>}
                        {isTimeUp && <span className="text-xs text-destructive mt-1 font-medium">Timp expirat!</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {!hasSubmitted && !isTimeUp && (
                  <Button variant="gold" size="lg" onClick={handleSubmitTest} className="gap-2 w-full">
                    <Send className="w-5 h-5" />
                    Predă Testul
                  </Button>
                )}

                {isTimeUp && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                    <p className="text-destructive text-sm font-medium">⏰ Timpul a expirat! Testul a fost trimis automat.</p>
                  </div>
                )}

                {/* Quiz Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-5 h-5 text-gold" />
                    <h4 className="font-display text-lg text-foreground">Grilă de Răspunsuri</h4>
                  </div>
                  
                  {isMultiSubject && materialId ? (
                    <TVCQuizMultiSubject
                      ref={multiSubjectQuizRef}
                      materialId={materialId}
                      subjectConfig={subjectConfig!}
                      isTimeUp={isTimeUp}
                      elapsedSeconds={INITIAL_TIME - timeLeft}
                      onActiveSubjectChange={(subject) => setActiveViewSubject(subject)}
                    />
                  ) : quizAvailable && materialId ? (
                    <TVCQuizAutoSubmit 
                      ref={quizRef}
                      materialId={materialId} 
                      questionCount={questionCount}
                      isTimeUp={isTimeUp}
                      elapsedSeconds={INITIAL_TIME - timeLeft}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-display text-base text-foreground mb-2">Grilă indisponibilă</h3>
                      <p className="text-muted-foreground text-sm">Profesorul nu a adăugat încă baremul.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="w-full">Închide testul</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVCTimerComplet;
