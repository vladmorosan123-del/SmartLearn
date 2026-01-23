import { useState, useEffect } from 'react';
import { X, FileText, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TVCAnswerKeyInput from '@/components/TVCAnswerKeyInput';
import { Material } from '@/hooks/useMaterials';

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    year?: number;
    answerKey?: string[];
  }) => void;
  material: Material | null;
  showYear?: boolean;
  showAnswerKey?: boolean;
}

const EditMaterialModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  material,
  showYear = false,
  showAnswerKey = false
}: EditMaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [answerKey, setAnswerKey] = useState<string[]>(Array(9).fill(''));

  // Populate form when material changes
  useEffect(() => {
    if (material) {
      setTitle(material.title || '');
      setDescription(material.description || '');
      setYear(material.year || new Date().getFullYear());
      setAnswerKey(
        Array.isArray(material.answer_key) && material.answer_key.length > 0
          ? material.answer_key
          : Array(9).fill('')
      );
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      year: showYear ? year : undefined,
      answerKey: showAnswerKey ? answerKey : undefined,
    });
    onClose();
  };

  const hasValidAnswerKey = answerKey.every(a => a !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <Pencil className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Editează Material</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Modifică detaliile materialului</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titlu *</Label>
            <Input
              id="edit-title"
              placeholder="ex: Model BAC 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          {showYear && (
            <div className="space-y-2">
              <Label htmlFor="edit-year">Anul</Label>
              <Input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-background"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descriere (opțional)</Label>
            <textarea
              id="edit-description"
              placeholder="Descriere scurtă..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none text-sm"
            />
          </div>

          {/* Current File Info */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              Fișier Curent
            </Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                  {material.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {material.file_type?.toUpperCase()} 
                  {material.file_size && ` • ${(material.file_size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Pentru a schimba fișierul, șterge acest material și încarcă unul nou.
            </p>
          </div>

          {/* Answer Key Input for TVC */}
          {showAnswerKey && (
            <div className="pt-2">
              <TVCAnswerKeyInput
                value={answerKey}
                onChange={setAnswerKey}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Anulează
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              className="flex-1 gap-2"
              disabled={!title.trim()}
            >
              <Save className="w-4 h-4" />
              Salvează Modificările
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialModal;
