import { useState } from 'react';
import { CheckCircle, XCircle, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface TVCQuizInterfaceProps {
  answerKey: string[];
  onComplete?: (score: number, total: number) => void;
}

const TVCQuizInterface = ({ answerKey, onComplete }: TVCQuizInterfaceProps) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(answerKey.length).fill(''));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const options = ['A', 'B', 'C', 'D'];

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (isSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newResults = userAnswers.map((answer, index) => answer === answerKey[index]);
    setResults(newResults);
    setIsSubmitted(true);
    
    const score = newResults.filter(Boolean).length;
    onComplete?.(score, answerKey.length);
  };

  const handleReset = () => {
    setUserAnswers(Array(answerKey.length).fill(''));
    setIsSubmitted(false);
    setResults([]);
  };

  const score = results.filter(Boolean).length;
  const allAnswered = userAnswers.every(answer => answer !== '');

  return (
    <div className="space-y-6">
      {/* Score Display */}
      {isSubmitted && (
        <div className={`p-4 rounded-lg text-center ${
          score >= answerKey.length * 0.7 
            ? 'bg-green-500/20 border border-green-500/50' 
            : score >= answerKey.length * 0.5 
            ? 'bg-yellow-500/20 border border-yellow-500/50' 
            : 'bg-destructive/20 border border-destructive/50'
        }`}>
          <p className="text-lg font-bold">
            Scor: {score} / {answerKey.length} puncte
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {score === answerKey.length 
              ? '🎉 Excelent! Toate răspunsurile sunt corecte!' 
              : score >= answerKey.length * 0.7 
              ? '👍 Foarte bine! Mai poți îmbunătăți câteva.' 
              : score >= answerKey.length * 0.5 
              ? '📚 Continuă să exersezi!' 
              : '💪 Nu renunța! Revizuiește materialul și încearcă din nou.'}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h4 className="font-display text-lg text-foreground">Grilă de Răspunsuri</h4>
        
        {answerKey.map((correctAnswer, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = isSubmitted && userAnswer === correctAnswer;
          const isWrong = isSubmitted && userAnswer !== correctAnswer && userAnswer !== '';
          const showCorrect = isSubmitted && !isCorrect;

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
                className="flex gap-4 flex-1"
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
              {isSubmitted && (
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

      {/* Actions */}
      <div className="flex gap-3">
        {!isSubmitted ? (
          <Button 
            variant="gold" 
            onClick={handleSubmit} 
            disabled={!allAnswered}
            className="gap-2 flex-1"
          >
            <Send className="w-4 h-4" />
            Verifică Răspunsurile
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="gap-2 flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            Încearcă Din Nou
          </Button>
        )}
      </div>

      {!isSubmitted && !allAnswered && (
        <p className="text-xs text-muted-foreground text-center">
          Răspunde la toate întrebările pentru a putea verifica.
        </p>
      )}
    </div>
  );
};

export default TVCQuizInterface;
