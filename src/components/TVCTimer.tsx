import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TVCTimerProps {
  subjectTitle: string;
  onClose: () => void;
}

const INITIAL_TIME = 3 * 60 * 60; // 3 hours in seconds

const TVCTimer = ({ subjectTitle, onClose }: TVCTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
  };

  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;
  const isTimeUp = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gold" />
            <h2 className="font-display text-xl text-foreground">Timer TVC</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Subject Title */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground text-sm mb-1">Subiect activ:</p>
          <h3 className="font-display text-lg text-foreground">{subjectTitle}</h3>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {/* Progress Ring Background */}
          <div className="w-48 h-48 mx-auto relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                className={`transition-all duration-1000 ${isTimeUp ? 'text-destructive' : 'text-gold'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-mono text-4xl font-bold ${isTimeUp ? 'text-destructive' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </span>
              {isRunning && (
                <span className="text-sm text-gold mt-2 animate-pulse">În desfășurare</span>
              )}
              {!isRunning && hasStarted && !isTimeUp && (
                <span className="text-sm text-muted-foreground mt-2">Pauză</span>
              )}
              {isTimeUp && (
                <span className="text-sm text-destructive mt-2 font-medium">Timp expirat!</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!hasStarted ? (
            <Button variant="gold" size="lg" onClick={handleStart} className="gap-2 px-8">
              <Play className="w-5 h-5" />
              Start Timer
            </Button>
          ) : (
            <>
              {isRunning ? (
                <Button variant="outline" size="lg" onClick={handlePause} className="gap-2">
                  <Pause className="w-5 h-5" />
                  Pauză
                </Button>
              ) : (
                <Button variant="gold" size="lg" onClick={handleResume} className="gap-2" disabled={isTimeUp}>
                  <Play className="w-5 h-5" />
                  Continuă
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Ai la dispoziție 3 ore pentru a rezolva subiectul TVC.
        </p>
      </div>
    </div>
  );
};

export default TVCTimer;
