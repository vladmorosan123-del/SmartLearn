import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chapter } from '@/hooks/useChapters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type ChapterFilter = 'all' | 'uncategorized' | string;

interface ChapterBarProps {
  chapters: Chapter[];
  selected: ChapterFilter;
  onSelect: (filter: ChapterFilter) => void;
  isProfessor: boolean;
  onAdd: (name: string) => Promise<any> | void;
  onRename: (id: string, name: string) => Promise<any> | void;
  onDelete: (id: string) => Promise<any> | void;
  countMap?: Record<string, number>; // key = chapter id or 'uncategorized'
}

const ChapterBar = ({
  chapters,
  selected,
  onSelect,
  isProfessor,
  onAdd,
  onRename,
  onDelete,
  countMap = {},
}: ChapterBarProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAdd(newName.trim());
    setNewName('');
    setIsAdding(false);
  };

  const startEdit = (c: Chapter) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const saveEdit = async () => {
    if (editingId && editName.trim()) {
      await onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0);
  const uncategorizedCount = countMap['uncategorized'] || 0;

  return (
    <div className="mb-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-5 h-5 text-gold" />
        <h3 className="font-display text-lg text-foreground">Capitole</h3>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => onSelect('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            selected === 'all'
              ? 'bg-gold text-navy-dark border-gold'
              : 'bg-card text-foreground border-border hover:border-gold/50'
          }`}
        >
          Toate {totalCount > 0 && <span className="opacity-70">({totalCount})</span>}
        </button>

        {chapters.map((c) => {
          const count = countMap[c.id] || 0;
          const isEditing = editingId === c.id;
          return (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg border transition-colors ${
                selected === c.id
                  ? 'bg-gold text-navy-dark border-gold'
                  : 'bg-card text-foreground border-border hover:border-gold/50'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditName('');
                      }
                    }}
                    autoFocus
                    className="h-7 text-sm w-40 bg-background"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={saveEdit}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(null);
                      setEditName('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(c.id)}
                    className="px-3 py-1.5 text-sm font-medium"
                  >
                    {c.name} {count > 0 && <span className="opacity-70">({count})</span>}
                  </button>
                  {isProfessor && (
                    <div className="flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="p-1 hover:bg-black/10 rounded"
                        title="Redenumește"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="p-1 hover:bg-black/10 rounded text-destructive"
                            title="Șterge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergi capitolul "{c.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Lecțiile din acest capitol nu vor fi șterse — vor rămâne în
                              grupul „Necategorisit".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(c.id)}>
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        <button
          onClick={() => onSelect('uncategorized')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            selected === 'uncategorized'
              ? 'bg-gold text-navy-dark border-gold'
              : 'bg-card text-muted-foreground border-border hover:border-gold/50'
          }`}
        >
          Necategorisit {uncategorizedCount > 0 && <span className="opacity-70">({uncategorizedCount})</span>}
        </button>

        {isProfessor && (
          isAdding ? (
            <div className="flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nume capitol"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewName('');
                  }
                }}
                className="h-9 w-44 bg-background"
              />
              <Button type="button" size="sm" variant="gold" onClick={handleAdd}>
                <Check className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4" />
              Capitol nou
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default ChapterBar;
