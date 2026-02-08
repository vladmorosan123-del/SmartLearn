import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

const getOptionsUpTo = (letter: string) => {
  const idx = ALL_OPTIONS.indexOf(letter as any);
  return ALL_OPTIONS.slice(0, idx + 1);
};

interface TVCAnswerKeyInputProps {
  value: string[];
  onChange: (answers: string[]) => void;
  questionCount?: number;
  itemPoints?: number[];
  onItemPointsChange?: (points: number[]) => void;
  showItemPoints?: boolean;
}

const TVCAnswerKeyInput = ({ 
  value, 
  onChange, 
  questionCount = 9,
  itemPoints,
  onItemPointsChange,
  showItemPoints = false,
}: TVCAnswerKeyInputProps) => {
  const [globalMax, setGlobalMax] = useState<string>('D');
  const [perQuestionMax, setPerQuestionMax] = useState<Record<number, string>>({});

  const getMaxForQuestion = (index: number) => perQuestionMax[index] ?? globalMax;

  const handleGlobalMaxChange = (newMax: string) => {
    setGlobalMax(newMax);
    const newAnswers = [...value];
    const allowed = getOptionsUpTo(newMax);
    for (let i = 0; i < questionCount; i++) {
      if (!perQuestionMax[i] && newAnswers[i] && !allowed.includes(newAnswers[i] as any)) {
        newAnswers[i] = '';
      }
    }
    onChange(newAnswers);
  };

  const handlePerQuestionMaxChange = (index: number, newMax: string) => {
    setPerQuestionMax(prev => ({ ...prev, [index]: newMax }));
    const allowed = getOptionsUpTo(newMax);
    if (value[index] && !allowed.includes(value[index] as any)) {
      const newAnswers = [...value];
      newAnswers[index] = '';
      onChange(newAnswers);
    }
  };

  const handleResetPerQuestion = (index: number) => {
    setPerQuestionMax(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    const allowed = getOptionsUpTo(globalMax);
    if (value[index] && !allowed.includes(value[index] as any)) {
      const newAnswers = [...value];
      newAnswers[index] = '';
      onChange(newAnswers);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...value];
    newAnswers[questionIndex] = answer;
    onChange(newAnswers);
  };

  const handlePointsChange = (questionIndex: number, points: string) => {
    if (!onItemPointsChange || !itemPoints) return;
    const newPoints = [...itemPoints];
    const val = parseFloat(points);
    newPoints[questionIndex] = isNaN(val) ? 0 : Math.max(0, val);
    onItemPointsChange(newPoints);
  };

  const handleClearOne = (questionIndex: number) => {
    const newAnswers = [...value];
    newAnswers[questionIndex] = '';
    onChange(newAnswers);
    if (onItemPointsChange && itemPoints) {
      const newPoints = [...itemPoints];
      newPoints[questionIndex] = 0;
      onItemPointsChange(newPoints);
    }
  };

  const handleClearAll = () => {
    onChange(Array(questionCount).fill(''));
    if (onItemPointsChange) {
      onItemPointsChange(Array(questionCount).fill(0));
    }
  };

  const totalPoints = itemPoints?.reduce((sum, p) => sum + p, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-foreground font-medium">Barem - Răspunsuri Corecte (Grilă)</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Variante:</span>
            <Select value={globalMax} onValueChange={handleGlobalMaxChange}>
              <SelectTrigger className="h-7 w-[90px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_OPTIONS.slice(1).map((letter) => (
                  <SelectItem key={letter} value={letter} className="text-xs">
                    A – {letter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showItemPoints && itemPoints && (
            <span className="text-xs text-muted-foreground">
              Total: <strong className={totalPoints > 0 ? 'text-foreground' : ''}>{totalPoints.toFixed(2)}</strong> pct
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Șterge tot
          </Button>
        </div>
      </div>
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        {Array.from({ length: questionCount }).map((_, index) => {
          const maxLetter = getMaxForQuestion(index);
          const options = getOptionsUpTo(maxLetter);
          const hasOverride = perQuestionMax[index] !== undefined;

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium text-muted-foreground shrink-0">
                {index + 1}.
              </span>
              <RadioGroup
                value={value[index] || ''}
                onValueChange={(answer) => handleAnswerChange(index, answer)}
                className="flex gap-2 sm:gap-3 flex-1 flex-wrap"
              >
                {options.map((option) => (
                  <div key={option} className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={option}
                      id={`q${index}-${option}`}
                      className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                    />
                    <Label
                      htmlFor={`q${index}-${option}`}
                      className="text-sm cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Select
                value={maxLetter}
                onValueChange={(val) => handlePerQuestionMaxChange(index, val)}
              >
                <SelectTrigger className={`h-7 w-[62px] text-xs shrink-0 ${hasOverride ? 'border-gold/50' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_OPTIONS.slice(1).map((letter) => (
                    <SelectItem key={letter} value={letter} className="text-xs">
                      A-{letter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasOverride && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleResetPerQuestion(index)}
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Resetează la global"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {showItemPoints && itemPoints && (
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={itemPoints[index] ?? ''}
                    onChange={(e) => handlePointsChange(index, e.target.value)}
                    className="w-16 h-8 text-xs text-center bg-background px-1"
                    placeholder="pct"
                  />
                  <span className="text-xs text-muted-foreground">pct</span>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleClearOne(index)}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Selectează intervalul de variante global sau individual per întrebare. Completează răspunsurile corecte{showItemPoints ? ' și punctajul' : ''}.
      </p>
    </div>
  );
};

export default TVCAnswerKeyInput;
