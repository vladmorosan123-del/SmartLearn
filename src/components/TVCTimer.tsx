import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Clock, FileText, Upload, Download, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TVCQuizInterface from '@/components/TVCQuizInterface';

interface TVCTimerProps {
  subjectTitle: string;
  onClose: () => void;
  pdfUrl?: string;
  answerKey?: string[] | null;
}

const INITIAL_TIME = 3 * 60 * 60; // 3 hours in seconds

// Helper function to get PDF viewer URL using Google Docs Viewer
const getPdfViewerUrl = (url: string) => {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};

const TVCTimer = ({ subjectTitle, onClose, pdfUrl, answerKey }: TVCTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'quiz'>('timer');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
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

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setTimeLeft(INITIAL_TIME);
    setIsRunning(false);
    setHasStarted(false);
    setActiveTab('timer');
  };

  const hasAnswerKey = answerKey && Array.isArray(answerKey) && answerKey.length > 0;

  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;
  const isTimeUp = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" />
      
      {/* Content Container */}
      <div className="relative flex w-full h-full">
        {/* Left Side - PDF Viewer */}
        <div className="flex-1 flex flex-col bg-background/95 border-r border-border">
          {/* PDF Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gold" />
              <h2 className="font-display text-lg text-foreground">{subjectTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* PDF Content Area */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {pdfUrl ? (
              <iframe 
                src={getPdfViewerUrl(pdfUrl)} 
                className="w-full h-full rounded-lg border border-border bg-white"
                title="TVC Subject PDF"
                allow="autoplay"
              />
            ) : (
              <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  PDF-ul nu a fost încărcat
                </h3>
                <p className="text-muted-foreground text-sm">
                  Profesorul va încărca subiectul TVC în format PDF. 
                  Acesta va apărea aici când va fi disponibil.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Timer & Quiz */}
        <div className="w-80 lg:w-[480px] flex flex-col bg-card border-l border-border overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'timer' 
                  ? 'bg-gold/10 text-gold border-b-2 border-gold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Timer
            </button>
            {hasAnswerKey && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'quiz' 
                    ? 'bg-gold/10 text-gold border-b-2 border-gold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Grilă ({answerKey?.length})
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'timer' ? (
              /* Timer Content */
              <div className="flex flex-col items-center justify-center p-6 h-full">
                {/* Timer Display */}
                <div className="relative mb-8">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 relative">
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
                        strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
                        className={`transition-all duration-1000 ${isTimeUp ? 'text-destructive' : 'text-gold'}`}
                        strokeLinecap="round"
                        style={{ strokeDasharray: `${2 * Math.PI * 72} ${2 * Math.PI * 72}`, strokeDashoffset: 2 * Math.PI * 72 * (1 - progress / 100) }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`font-mono text-2xl lg:text-3xl font-bold ${isTimeUp ? 'text-destructive' : 'text-foreground'}`}>
                        {formatTime(timeLeft)}
                      </span>
                      {isRunning && (
                        <span className="text-xs text-gold mt-2 animate-pulse">În desfășurare</span>
                      )}
                      {!isRunning && hasStarted && !isTimeUp && (
                        <span className="text-xs text-muted-foreground mt-2">Pauză</span>
                      )}
                      {isTimeUp && (
                        <span className="text-xs text-destructive mt-2 font-medium">Timp expirat!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  {!hasStarted ? (
                    <Button variant="gold" size="lg" onClick={handleStart} className="gap-2 w-full">
                      <Play className="w-5 h-5" />
                      Start Timer
                    </Button>
                  ) : (
                    <>
                      {isRunning ? (
                        <Button variant="outline" size="lg" onClick={handlePause} className="gap-2 w-full">
                          <Pause className="w-5 h-5" />
                          Pauză
                        </Button>
                      ) : (
                        <Button variant="gold" size="lg" onClick={handleResume} className="gap-2 w-full" disabled={isTimeUp}>
                          <Play className="w-5 h-5" />
                          Continuă
                        </Button>
                      )}
                      <Button variant="outline" size="lg" onClick={handleReset} className="gap-2 w-full">
                        <RotateCcw className="w-5 h-5" />
                        Reset
                      </Button>
                    </>
                  )}
                </div>

                {/* Info */}
                <p className="text-center text-muted-foreground text-xs mt-6">
                  Ai la dispoziție 3 ore pentru a rezolva subiectul TVC.
                </p>

                {/* Quiz CTA */}
                {hasAnswerKey && (
                  <Button 
                    variant="gold" 
                    onClick={() => setActiveTab('quiz')} 
                    className="mt-4 gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Completează Grila
                  </Button>
                )}
              </div>
            ) : (
              /* Quiz Content */
              <div className="p-6">
                {hasAnswerKey && (
                  <TVCQuizInterface answerKey={answerKey!} />
                )}
              </div>
            )}
          </div>

          {/* Exit Button */}
          <div className="p-4 border-t border-border">
            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
              <X className="w-4 h-4 mr-2" />
              Închide subiectul
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVCTimer;
