import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { CheckCircle, XCircle, Send, Loader2, Calculator, Code, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubjectConfig {
  questionCount: number;
  answerKey: string[];
  oficiu: number;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface QuizResult {
  questionIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface SubjectResult {
  subject: string;
  score: number;
  totalQuestions: number;
  oficiu: number;
  baseGrade: number;
  finalGrade: number;
  results: QuizResult[];
}

export interface TVCQuizMultiSubjectRef {
  forceSubmit: () => void;
}

interface TVCQuizMultiSubjectProps {
  materialId: string;
  subjectConfig: Record<string, SubjectConfig>;
  isTimeUp: boolean;
  elapsedSeconds: number;
  onComplete?: (weightedAverage: number) => void;
  onActiveSubjectChange?: (subject: string) => void;
}

const subjectMeta: Record<string, { label: string; icon: typeof Calculator; color: string; weight: number }> = {
  matematica: { label: 'Matematică', icon: Calculator, color: 'text-emerald-500', weight: 0.5 },
  informatica: { label: 'Informatică', icon: Code, color: 'text-blue-500', weight: 0.3 },
  fizica: { label: 'Fizică', icon: Atom, color: 'text-violet-500', weight: 0.2 },
};

const options = ['A', 'B', 'C', 'D'];

const TVCQuizMultiSubject = forwardRef<TVCQuizMultiSubjectRef, TVCQuizMultiSubjectProps>(
  ({ materialId, subjectConfig, isTimeUp, elapsedSeconds, onComplete, onActiveSubjectChange }, ref) => {
    const subjects = Object.keys(subjectConfig);
    const [answersPerSubject, setAnswersPerSubject] = useState<Record<string, string[]>>(() => {
      const init: Record<string, string[]> = {};
      for (const s of subjects) {
        init[s] = Array(subjectConfig[s].questionCount).fill('');
      }
      return init;
    });
    const [activeSubject, setActiveSubject] = useState(subjects[0] || 'matematica');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
    const [weightedAverage, setWeightedAverage] = useState(0);
    const { toast } = useToast();

    const handleSubjectChange = (subject: string) => {
      setActiveSubject(subject);
      onActiveSubjectChange?.(subject);
    };

    const handleAnswerChange = (subject: string, questionIndex: number, answer: string) => {
      if (isSubmitted) return;
      setAnswersPerSubject(prev => ({
        ...prev,
        [subject]: prev[subject].map((a, i) => i === questionIndex ? answer : a),
      }));
    };

    const submitQuiz = async (isAutoSubmit = false) => {
      if (isSubmitting || isSubmitted) return;
      
      setIsSubmitting(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('verify-quiz-answers', {
          body: {
            materialId,
            multiSubjectAnswers: answersPerSubject,
            timeSpentSeconds: elapsedSeconds,
            isMultiSubject: true,
          },
        });

        if (error) throw new Error(error.message || 'Eroare la verificarea răspunsurilor');
        if (data.error) throw new Error(data.error);

        setSubjectResults(data.subjectResults || []);
        setWeightedAverage(data.weightedAverage || 0);
        setIsSubmitted(true);
        onComplete?.(data.weightedAverage);
        
        toast({
          title: isAutoSubmit ? "Timp expirat - Test trimis automat!" : "Răspunsuri verificate!",
          description: `Media ponderată: ${data.weightedAverage?.toFixed(1)} puncte`,
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

    useImperativeHandle(ref, () => ({
      forceSubmit: () => {
        if (!isSubmitted && !isSubmitting) {
          submitQuiz(true);
        }
      }
    }));

    useEffect(() => {
      if (isTimeUp && !isSubmitted && !isSubmitting) {
        submitQuiz(true);
      }
    }, [isTimeUp]);

    const currentAnswers = answersPerSubject[activeSubject] || [];
    const currentConfig = subjectConfig[activeSubject];
    const currentResult = subjectResults.find(r => r.subject === activeSubject);

    const totalAnswered = Object.values(answersPerSubject).reduce(
      (acc, answers) => acc + answers.filter(a => a !== '').length, 0
    );
    const totalQuestions = Object.values(subjectConfig).reduce(
      (acc, cfg) => acc + cfg.questionCount, 0
    );

    return (
      <div className="space-y-4">
        {/* Subject Tabs */}
        <div className="flex gap-1.5">
          {subjects.map((subject) => {
            const meta = subjectMeta[subject];
            if (!meta) return null;
            const Icon = meta.icon;
            const answered = answersPerSubject[subject]?.filter(a => a !== '').length || 0;
            const total = subjectConfig[subject]?.questionCount || 0;
            const result = subjectResults.find(r => r.subject === subject);
            
            return (
              <button
                key={subject}
                type="button"
                onClick={() => handleSubjectChange(subject)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors text-xs ${
                  activeSubject === subject 
                    ? 'bg-gold text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{meta.label}</span>
                {isSubmitted && result ? (
                  <span className="text-[10px]">{result.finalGrade} pct</span>
                ) : (
                  <span className="text-[10px] opacity-70">{answered}/{total}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-end p-2 bg-muted/50 rounded-lg">
          <span className="text-xs text-muted-foreground">
            Total: {totalAnswered}/{totalQuestions} completate
          </span>
        </div>

        {/* Weighted Average Result */}
        {isSubmitted && (
          <div className="space-y-3">
            <div className="space-y-2">
              {subjectResults.map((result) => {
                const meta = subjectMeta[result.subject];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div key={result.subject} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="flex items-center gap-2 text-sm">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      {meta.label}
                      <span className="text-xs text-muted-foreground">({(meta.weight * 100).toFixed(0)}%)</span>
                    </span>
                    <span className="text-sm font-medium">
                      {result.finalGrade} pct
                      {result.oficiu > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({result.baseGrade}+{result.oficiu})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={`p-4 rounded-lg text-center ${
              weightedAverage >= 7 
                ? 'bg-green-500/20 border border-green-500/50' 
                : weightedAverage >= 5 
                ? 'bg-yellow-500/20 border border-yellow-500/50' 
                : 'bg-destructive/20 border border-destructive/50'
            }`}>
              <p className="text-xl font-bold text-foreground">
                Media Ponderată: {weightedAverage.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                50% Mate + 30% Info + 20% Fizică
              </p>
            </div>
          </div>
        )}

        {/* Active Subject Questions */}
        {currentConfig && (
          <div className="space-y-3">
            <h5 className="font-medium text-sm text-foreground flex items-center gap-2">
              {subjectMeta[activeSubject]?.label} - Grilă ({currentConfig.questionCount} întrebări)
            </h5>
            
            {Array.from({ length: currentConfig.questionCount }, (_, index) => {
              const result = currentResult?.results.find(r => r.questionIndex === index);
              const userAnswer = currentAnswers[index] || '';
              const isCorrect = result?.isCorrect;
              const isWrong = result && !result.isCorrect && userAnswer !== '';
              const correctAnswer = result?.correctAnswer;

              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCorrect 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : isWrong 
                      ? 'bg-destructive/10 border border-destructive/30' 
                      : 'bg-muted/30'
                  }`}
                >
                  <span className="w-6 text-xs font-bold text-foreground">{index + 1}.</span>
                  
                  <RadioGroup
                    value={userAnswer}
                    onValueChange={(answer) => handleAnswerChange(activeSubject, index, answer)}
                    className="flex gap-3 flex-1"
                    disabled={isSubmitted || isTimeUp}
                  >
                    {options.map((option) => {
                      const isUserChoice = userAnswer === option;
                      const isCorrectChoice = correctAnswer === option;
                      
                      return (
                        <div key={option} className={`flex items-center space-x-1 px-1.5 py-0.5 rounded ${
                          isSubmitted && isCorrectChoice ? 'bg-green-500/20' 
                          : isSubmitted && isUserChoice && !isCorrectChoice ? 'bg-destructive/20' : ''
                        }`}>
                          <RadioGroupItem
                            value={option}
                            id={`ms-${activeSubject}-q${index}-${option}`}
                            className={`
                              ${isSubmitted && isCorrectChoice ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
                              ${isSubmitted && isUserChoice && !isCorrectChoice ? 'border-destructive data-[state=checked]:bg-destructive' : ''}
                              ${!isSubmitted ? 'border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold' : ''}
                            `}
                            disabled={isSubmitted || isTimeUp}
                          />
                          <Label
                            htmlFor={`ms-${activeSubject}-q${index}-${option}`}
                            className={`text-xs cursor-pointer ${
                              isSubmitted && isCorrectChoice ? 'text-green-500 font-bold' : ''
                            } ${isSubmitted && isUserChoice && !isCorrectChoice ? 'text-destructive line-through' : ''}`}
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {isSubmitted && result && (
                    <div className="w-5">
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit button */}
        {!isSubmitted && !isTimeUp && (
          <Button variant="gold" onClick={() => submitQuiz(false)} disabled={isSubmitting} className="gap-2 w-full">
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Se verifică...</>
            ) : (
              <><Send className="w-4 h-4" /> Trimite Răspunsurile</>
            )}
          </Button>
        )}

        {!isSubmitted && !isTimeUp && (
          <p className="text-xs text-muted-foreground text-center">
            Poți comuta între materii fără să pierzi răspunsurile.
          </p>
        )}
      </div>
    );
  }
);

TVCQuizMultiSubject.displayName = 'TVCQuizMultiSubject';

export default TVCQuizMultiSubject;
