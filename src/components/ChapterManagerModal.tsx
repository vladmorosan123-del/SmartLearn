import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChapters } from '@/hooks/useChapters';

interface ChapterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  subjectName: string;
}

const ChapterManagerModal = ({ isOpen, onClose, subject, subjectName }: ChapterManagerModalProps) => {
  const { chapters, isLoading, addChapter, updateChapter, deleteChapter } = useChapters(subject);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const result = await addChapter(newName);
    if (result) setNewName('');
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingValue(name);
  };

  const saveEdit = async () => {
    if (editingId && editingValue.trim()) {
      await updateChapter(editingId, editingValue);
      setEditingId(null);
      setEditingValue('');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Ștergi capitolul „${name}"? Lecțiile asociate vor rămâne dar fără capitol.`)) {
      await deleteChapter(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-md mx-4 animate-scale-in max-h-[85vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Gestionează Capitolele</h2>
              <p className="text-sm text-muted-foreground">{subjectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add new chapter */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Numele capitolului nou..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-background"
            />
            <Button type="submit" variant="gold" disabled={!newName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* Chapter list */}
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Se încarcă...</p>
            ) : chapters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 italic">
                Niciun capitol creat încă pentru această materie.
              </p>
            ) : (
              chapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border"
                >
                  <span className="text-sm font-bold text-gold w-6">{idx + 1}.</span>
                  {editingId === chapter.id ? (
                    <>
                      <Input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                        className="bg-background h-8"
                      />
                      <Button size="sm" variant="gold" onClick={saveEdit} className="h-8 px-2">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 px-2">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-foreground text-sm truncate">{chapter.name}</span>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => startEdit(chapter.id, chapter.name)}
                        className="h-8 px-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleDelete(chapter.id, chapter.name)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Button variant="outline" onClick={onClose} className="w-full">
              Închide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterManagerModal;
