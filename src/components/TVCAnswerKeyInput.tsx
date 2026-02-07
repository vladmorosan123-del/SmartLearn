import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

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
  const options = ['A', 'B', 'C', 'D'];

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

  const totalPoints = itemPoints?.reduce((sum, p) => sum + p, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-medium">Barem - Răspunsuri Corecte (Grilă)</Label>
        {showItemPoints && itemPoints && (
          <span className="text-xs text-muted-foreground">
            Total puncte: <strong className={totalPoints > 0 ? 'text-foreground' : ''}>{totalPoints.toFixed(2)}</strong>
          </span>
        )}
      </div>
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        {Array.from({ length: questionCount }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-6 text-sm font-medium text-muted-foreground shrink-0">
              {index + 1}.
            </span>
            <RadioGroup
              value={value[index] || ''}
              onValueChange={(answer) => handleAnswerChange(index, answer)}
              className="grid grid-cols-4 gap-2 sm:flex sm:gap-4 flex-1"
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
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Completează răspunsurile corecte{showItemPoints ? ' și punctajul' : ''} pentru fiecare întrebare din grilă.
      </p>
    </div>
  );
};

export default TVCAnswerKeyInput;
