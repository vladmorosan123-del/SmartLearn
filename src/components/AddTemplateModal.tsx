import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
  slotNumber: number;
}

const AddTemplateModal = ({ isOpen, onClose, onSave, slotNumber }: AddTemplateModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title, description });
    setTitle('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-md mx-4 p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-foreground">
            Încarcă Șablon #{slotNumber}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
            <input
              type="text"
              placeholder="ex: Șablon Comentariu Literar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descriere (opțional)</label>
            <textarea
              placeholder="Descriere scurtă a șablonului..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Anulează
            </Button>
            <Button 
              variant="gold" 
              className="flex-1"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Salvează
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTemplateModal;
