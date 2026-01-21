import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: { title: string; duration: string; description: string }) => void;
  lessonNumber: number;
}

const AddLessonModal = ({ isOpen, onClose, onSave, lessonNumber }: AddLessonModalProps) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && duration.trim()) {
      onSave({ title: title.trim(), duration: duration.trim(), description: description.trim() });
      setTitle('');
      setDuration('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDuration('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display text-xl text-foreground">Adaugă Lecția {lessonNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">Completează detaliile lecției</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlul lecției *</Label>
            <Input
              id="title"
              placeholder="ex: Introducere în algoritmi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durata *</Label>
            <Input
              id="duration"
              placeholder="ex: 45 min"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              placeholder="Descrierea lecției..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Anulează
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              className="flex-1"
              disabled={!title.trim() || !duration.trim()}
            >
              Salvează lecția
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal;
