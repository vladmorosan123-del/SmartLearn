import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TVCAnswerKeyInputProps {
  value: string[];
  onChange: (answers: string[]) => void;
  questionCount?: number;
}

const TVCAnswerKeyInput = ({ value, onChange, questionCount = 9 }: TVCAnswerKeyInputProps) => {
  const options = ['A', 'B', 'C', 'D'];

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...value];
    newAnswers[questionIndex] = answer;
    onChange(newAnswers);
  };

  return (
    <div className="space-y-4">
      <Label className="text-foreground font-medium">Barem - Răspunsuri Corecte (Grilă)</Label>
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        {Array.from({ length: questionCount }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="w-8 text-sm font-medium text-muted-foreground">
              {index + 1}.
            </span>
            <RadioGroup
              value={value[index] || ''}
              onValueChange={(answer) => handleAnswerChange(index, answer)}
              className="flex gap-4"
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
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Completează răspunsurile corecte pentru fiecare întrebare din grilă.
      </p>
    </div>
  );
};

export default TVCAnswerKeyInput;
