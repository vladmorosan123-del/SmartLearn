import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizResult {
  questionIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface TVCQuizInterfaceRef {
  submitQuiz: () => Promise<void>;
}

interface TVCQuizInterfaceSecureProps {
  materialId: string;
  questionCount: number;
  onComplete?: (score: number, total: number) => void;
  autoSubmit?: boolean;
  onReset?: () => void;
}

const TVCQuizInterfaceSecure = forwardRef<TVCQuizInterfaceRef, TVCQuizInterfaceSecureProps>(
  ({ materialId, questionCount, onComplete, autoSubmit, onReset }, ref) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(questionCount).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [oficiu, setOficiu] = useState(0);
  const [baseGrade, setBaseGrade] = useState(0);
  const [finalGrade, setFinalGrade] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<Date>(new Date());
  const hasAutoSubmitted = useRef(false);
  const { toast } = useToast();

  const options = ['A', 'B', 'C', 'D'];

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (isSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async (forceSubmit = false) => {
    if (isSubmitted || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-quiz-answers', {
        body: {
          materialId,
          answers: userAnswers,
          timeSpentSeconds: elapsedSeconds,
        },
      });

      if (error) {
        throw new Error(error.message || 'Eroare la verificarea răspunsurilor');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data.results);
      setScore(data.score);
      setOficiu(data.oficiu || 0);
      setBaseGrade(data.baseGrade || 0);
      setFinalGrade(data.finalGrade || 0);
      setIsSubmitted(true);
      onComplete?.(data.score, data.totalQuestions);
      
      const gradeMessage = data.oficiu > 0 
        ? `Nota: ${data.finalGrade} (${data.baseGrade} + ${data.oficiu} oficiu) • ${data.pointsPerItem || '-'} pct/item`
        : `Nota: ${data.finalGrade}`;
      
      toast({
        title: forceSubmit ? "Timp expirat - Test trimis automat!" : "Răspunsuri verificate!",
        description: `${gradeMessage} - Timp: ${formatTime(data.timeSpentSeconds)}`,
      });
    } catch (error: any) {
      console.error('Error verifying quiz:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut verifica răspunsurile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submitQuiz: () => handleSubmit(true),
  }));

  // Auto-submit when autoSubmit becomes true
  useEffect(() => {
    if (autoSubmit && !isSubmitted && !isSubmitting && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit(true);
    }
  }, [autoSubmit, isSubmitted, isSubmitting]);

  const handleReset = () => {
    setUserAnswers(Array(questionCount).fill(''));
    setIsSubmitted(false);
    setResults([]);
    setScore(0);
    setOficiu(0);
    setBaseGrade(0);
    setFinalGrade(0);
    setElapsedSeconds(0);
    startTimeRef.current = new Date();
    hasAutoSubmitted.current = false;
    // Notify parent to reset the timer
    onReset?.();
  };

  const answeredCount = userAnswers.filter(answer => answer !== '').length;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Clock className="w-5 h-5 text-gold" />
        <span className="font-mono text-lg font-bold text-foreground">
          {formatTime(elapsedSeconds)}
        </span>
        {!isSubmitted && (
          <span className="text-sm text-muted-foreground">- Timp scurs</span>
        )}
      </div>

      {/* Score Display */}
      {isSubmitted && (
        <div className={`p-4 rounded-lg text-center ${
          finalGrade >= 70 
            ? 'bg-green-500/20 border border-green-500/50' 
            : finalGrade >= 50 
            ? 'bg-yellow-500/20 border border-yellow-500/50' 
            : 'bg-destructive/20 border border-destructive/50'
        }`}>
          {/* Main Grade Display */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-foreground">
              Nota: {finalGrade}
            </p>
            {oficiu > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                ({baseGrade} puncte + {oficiu} din oficiu)
              </p>
            )}
          </div>
          
          {/* Raw Score */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Răspunsuri corecte: {score} / {questionCount}
              {oficiu > 0 && questionCount > 0 && (
                <span className="ml-2">
                  • {((10 - oficiu) / questionCount).toFixed(2)} pct/item
                </span>
              )}
            </p>
          </div>
          
          {/* Motivational Message */}
          <p className="text-sm mt-3">
            {finalGrade >= 90 
              ? '🎉 Excelent! Rezultat remarcabil!' 
              : finalGrade >= 70 
              ? '👍 Foarte bine! Continuă tot așa!' 
              : finalGrade >= 50 
              ? '📚 Continuă să exersezi!' 
              : '💪 Nu renunța! Revizuiește materialul și încearcă din nou.'}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h4 className="font-display text-lg text-foreground">Grilă de Răspunsuri</h4>
        
        {Array.from({ length: questionCount }, (_, index) => {
          const result = results.find(r => r.questionIndex === index);
          const userAnswer = userAnswers[index];
          const isCorrect = result?.isCorrect;
          const isWrong = result && !result.isCorrect && userAnswer !== '';
          const correctAnswer = result?.correctAnswer;

          return (
            <div 
              key={index} 
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isCorrect 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : isWrong 
                  ? 'bg-destructive/10 border border-destructive/30' 
                  : 'bg-muted/30'
              }`}
            >
              <span className="w-8 text-sm font-bold text-foreground">
                {index + 1}.
              </span>
              
              <RadioGroup
                value={userAnswer}
                onValueChange={(answer) => handleAnswerChange(index, answer)}
                className="grid grid-cols-4 gap-2 sm:flex sm:gap-4 flex-1"
                disabled={isSubmitted}
              >
                {options.map((option) => {
                  const isUserChoice = userAnswer === option;
                  const isCorrectChoice = correctAnswer === option;
                  
                  return (
                    <div 
                      key={option} 
                      className={`flex items-center space-x-1 px-2 py-1 rounded ${
                        isSubmitted && isCorrectChoice 
                          ? 'bg-green-500/20' 
                          : isSubmitted && isUserChoice && !isCorrectChoice 
                          ? 'bg-destructive/20' 
                          : ''
                      }`}
                    >
                      <RadioGroupItem
                        value={option}
                        id={`quiz-q${index}-${option}`}
                        className={`
                          ${isSubmitted && isCorrectChoice ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
                          ${isSubmitted && isUserChoice && !isCorrectChoice ? 'border-destructive data-[state=checked]:bg-destructive' : ''}
                          ${!isSubmitted ? 'border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold' : ''}
                        `}
                        disabled={isSubmitted}
                      />
                      <Label
                        htmlFor={`quiz-q${index}-${option}`}
                        className={`text-sm cursor-pointer ${
                          isSubmitted && isCorrectChoice ? 'text-green-500 font-bold' : ''
                        } ${isSubmitted && isUserChoice && !isCorrectChoice ? 'text-destructive line-through' : ''}`}
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {/* Result Icon */}
              {isSubmitted && result && (
                <div className="w-6">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions - only show reset after submission */}
      {isSubmitted && (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="gap-2 flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            Încearcă Din Nou
          </Button>
        </div>
      )}

      {/* Progress indicator */}
      {!isSubmitted && (
        <p className="text-xs text-muted-foreground text-center">
          {answeredCount}/{questionCount} răspunsuri completate
        </p>
      )}
    </div>
  );
});

TVCQuizInterfaceSecure.displayName = 'TVCQuizInterfaceSecure';

export default TVCQuizInterfaceSecure;
