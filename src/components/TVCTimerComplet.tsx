import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Send, Clock, FileText, Download, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TVCQuizAutoSubmit from '@/components/TVCQuizAutoSubmit';
import { supabase } from '@/integrations/supabase/client';

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
}

// Helper function to get PDF viewer URL using Google Docs Viewer
const getPdfViewerUrl = (url: string) => {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
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
  timerMinutes = 1 
}: TVCTimerCompletProps) => {
  const INITIAL_TIME = timerMinutes * 60; // Convert minutes to seconds
  
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount || 0);
  const [isLoadingQuestionCount, setIsLoadingQuestionCount] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showTimeUpWarning, setShowTimeUpWarning] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const quizRef = useRef<{ forceSubmit: () => void } | null>(null);

  // Fetch question count if not provided
  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (hasAnswerKey && materialId && !initialQuestionCount) {
        setIsLoadingQuestionCount(true);
        try {
          const { data, error } = await supabase.rpc('get_material_question_count', {
            _material_id: materialId
          });
          
          if (!error && typeof data === 'number') {
            setQuestionCount(data);
          }
        } catch (err) {
          console.error('Error fetching question count:', err);
        } finally {
          setIsLoadingQuestionCount(false);
        }
      } else if (initialQuestionCount) {
        setQuestionCount(initialQuestionCount);
      }
    };
    
    fetchQuestionCount();
  }, [hasAnswerKey, materialId, initialQuestionCount]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsTimeUp(true);
            // Trigger auto-submit when time is up
            if (quizRef.current) {
              quizRef.current.forceSubmit();
            }
            return 0;
          }
          // Show warning at 5 minutes remaining
          if (prev === 300) {
            setShowTimeUpWarning(true);
            setTimeout(() => setShowTimeUpWarning(false), 5000);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

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
    // Trigger auto-submit for quiz
    if (quizRef.current) {
      quizRef.current.forceSubmit();
    }
  };

  // Allow closing only after submission
  const handleClose = () => {
    if (hasSubmitted || isTimeUp) {
      onClose();
    }
  };

  const quizAvailable = hasAnswerKey && questionCount > 0 && materialId;
  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

  const ext = (fileType || pdfUrl?.split('?')[0]?.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

  // Time-based color
  const getTimerColor = () => {
    if (isTimeUp) return 'text-destructive';
    if (timeLeft <= 300) return 'text-orange-500'; // Less than 5 min
    if (timeLeft <= 600) return 'text-yellow-500'; // Less than 10 min
    return 'text-gold';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" />
      
      {/* Time-up Warning Toast */}
      {showTimeUpWarning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-up">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">⚠️ Atenție! Mai ai doar 5 minute!</span>
          </div>
        </div>
      )}
      
      {/* Content Container */}
      <div className="relative flex w-full h-full">
        {/* Left Side - PDF Viewer (only shown after timer starts) */}
        {hasStarted ? (
          <div className="flex-1 flex flex-col bg-background/95 border-r border-border">
            {/* PDF Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gold" />
                <h2 className="font-display text-lg text-foreground">{subjectTitle}</h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Always visible timer in header */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted ${getTimerColor()}`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
                {pdfUrl && (
                  <Button 
                    variant="gold" 
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = pdfUrl;
                      link.download = `${subjectTitle}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Descarcă PDF
                  </Button>
                )}
                {/* No X button here - can only submit to exit */}
              </div>
            </div>
            
            {/* PDF Content Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {pdfUrl ? (
                isImage ? (
                  <img
                    src={pdfUrl}
                    alt={fileName || subjectTitle}
                    className="max-w-full max-h-full object-contain rounded-lg border border-border bg-background"
                  />
                ) : isPdf ? (
                  <iframe 
                    src={getPdfViewerUrl(pdfUrl)} 
                    className="w-full h-full rounded-lg border border-border bg-white"
                    title="TVC Subject PDF"
                    allow="autoplay"
                  />
                ) : (
                  <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-display text-lg text-foreground mb-2">
                      Fișierul nu poate fi afișat aici
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Descarcă fișierul sau deschide-l într-un tab nou.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-2">
                    PDF-ul nu a fost încărcat
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Profesorul va încărca subiectul TVC în format PDF.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Before start - show start screen on left side */
          <div className="flex-1 flex flex-col bg-background/95 border-r border-border items-center justify-center">
            <div className="text-center p-12 max-w-md">
              <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gold" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-4">{subjectTitle}</h2>
              <p className="text-muted-foreground mb-6">
                Apasă butonul "Începe Testul" pentru a începe. <br />
                Ai la dispoziție <span className="text-gold font-bold">{timerMinutes} minute</span> pentru a rezolva subiectul.
              </p>
              <Button variant="gold" size="lg" onClick={handleStart} className="gap-2">
                <Play className="w-5 h-5" />
                Începe Testul
              </Button>
            </div>
          </div>
        )}

        {/* Right Side - Unified Timer & Quiz Panel */}
        <div className="w-80 lg:w-[480px] flex flex-col bg-card border-l border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border bg-gold/10">
            <Clock className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">
              {hasStarted ? 'Test în desfășurare' : 'Pregătit pentru test'}
            </span>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {!hasStarted ? (
              /* Before start - show waiting screen */
              <div className="flex flex-col items-center justify-center p-6 h-full">
                <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-12 h-12 text-gold" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2 text-center">
                  Pregătit pentru test?
                </h3>
                <p className="text-muted-foreground text-sm text-center mb-6">
                  Apasă "Începe Testul" pentru a vedea subiectul și a completa grila.
                </p>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-mono text-3xl font-bold text-gold">
                    {formatTime(INITIAL_TIME)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Timp disponibil
                  </p>
                </div>
              </div>
            ) : (
              /* After start - show timer + quiz in one unified view */
              <div className="p-6 space-y-6">
                {/* Compact Timer Display */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className={`transition-all duration-1000 ${getTimerColor()}`}
                          strokeLinecap="round"
                          style={{ 
                            strokeDasharray: `${2 * Math.PI * 72} ${2 * Math.PI * 72}`, 
                            strokeDashoffset: 2 * Math.PI * 72 * (1 - progress / 100) 
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-mono text-xl lg:text-2xl font-bold ${getTimerColor()}`}>
                          {formatTime(timeLeft)}
                        </span>
                        {isRunning && (
                          <span className="text-xs text-gold mt-1 animate-pulse">În desfășurare</span>
                        )}
                        {isTimeUp && (
                          <span className="text-xs text-destructive mt-1 font-medium">Timp expirat!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {!hasSubmitted && !isTimeUp && (
                  <Button 
                    variant="gold" 
                    size="lg" 
                    onClick={handleSubmitTest} 
                    className="gap-2 w-full"
                  >
                    <Send className="w-5 h-5" />
                    Predă Testul
                  </Button>
                )}

                {/* Time up warning */}
                {isTimeUp && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                    <p className="text-destructive text-sm font-medium">
                      ⏰ Timpul a expirat! Testul a fost trimis automat.
                    </p>
                  </div>
                )}

                {/* Quiz Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-5 h-5 text-gold" />
                    <h4 className="font-display text-lg text-foreground">
                      Grilă de Răspunsuri {quizAvailable ? `(${questionCount} întrebări)` : ''}
                    </h4>
                  </div>
                  
                  {quizAvailable ? (
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
                      <h3 className="font-display text-base text-foreground mb-2">
                        Grilă indisponibilă
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Profesorul nu a adăugat încă baremul pentru acest subiect.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Exit Button - only shown after submission */}
          {(hasSubmitted || isTimeUp) && (
            <div className="p-4 border-t border-border">
              <Button variant="outline" onClick={handleClose} className="w-full">
                Închide testul
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVCTimerComplet;
