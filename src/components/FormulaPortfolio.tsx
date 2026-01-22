import { useState } from 'react';
import { Plus, Trash2, Edit, Calculator, Atom, FileText, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Formula {
  id: number;
  title: string | null;
  formula: string | null;
  description?: string;
  category?: string;
  status: 'uploaded' | 'not-uploaded';
}

interface FormulaPortfolioProps {
  subject: 'matematica' | 'fizica';
  isProfessor: boolean;
}

const categoryOptions = {
  matematica: [
    'Algebră',
    'Geometrie',
    'Analiză matematică',
    'Trigonometrie',
    'Probabilități',
    'Alte formule',
  ],
  fizica: [
    'Mecanică',
    'Termodinamică',
    'Electricitate',
    'Optică',
    'Fizică nucleară',
    'Alte formule',
  ],
};

const createEmptyFormulas = (): Formula[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: null,
    formula: null,
    status: 'not-uploaded' as const,
  }));

const initialFormulasData: Record<'matematica' | 'fizica', Formula[]> = {
  matematica: [
    { id: 1, title: 'Formula rezolvării ecuației de gradul II', formula: 'x = (-b ± √(b²-4ac)) / 2a', category: 'Algebră', description: 'Pentru ecuația ax² + bx + c = 0', status: 'uploaded' },
    { id: 2, title: 'Teorema lui Pitagora', formula: 'a² + b² = c²', category: 'Geometrie', description: 'În triunghiul dreptunghic, suma pătratelor catetelor este egală cu pătratul ipotenuzei', status: 'uploaded' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      formula: null,
      status: 'not-uploaded' as const,
    })),
  ],
  fizica: [
    { id: 1, title: 'Legea a II-a a lui Newton', formula: 'F = m × a', category: 'Mecanică', description: 'Forța este egală cu masa înmulțită cu accelerația', status: 'uploaded' },
    { id: 2, title: 'Energia cinetică', formula: 'Ec = ½mv²', category: 'Mecanică', description: 'Energia unui corp în mișcare', status: 'uploaded' },
    { id: 3, title: 'Legea lui Ohm', formula: 'U = I × R', category: 'Electricitate', description: 'Tensiunea este egală cu intensitatea înmulțită cu rezistența', status: 'uploaded' },
    ...Array.from({ length: 7 }, (_, i) => ({
      id: i + 4,
      title: null,
      formula: null,
      status: 'not-uploaded' as const,
    })),
  ],
};

const FormulaPortfolio = ({ subject, isProfessor }: FormulaPortfolioProps) => {
  const [formulas, setFormulas] = useState<Formula[]>(initialFormulasData[subject]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(null);
  const [newFormula, setNewFormula] = useState({
    title: '',
    formula: '',
    description: '',
    category: categoryOptions[subject][0],
  });

  const SubjectIcon = subject === 'matematica' ? Calculator : Atom;
  const subjectName = subject === 'matematica' ? 'Matematică' : 'Fizică';

  const handleAddFormula = (formulaId: number) => {
    const existingFormula = formulas.find(f => f.id === formulaId);
    if (existingFormula && existingFormula.status === 'uploaded') {
      setNewFormula({
        title: existingFormula.title || '',
        formula: existingFormula.formula || '',
        description: existingFormula.description || '',
        category: existingFormula.category || categoryOptions[subject][0],
      });
    } else {
      setNewFormula({
        title: '',
        formula: '',
        description: '',
        category: categoryOptions[subject][0],
      });
    }
    setSelectedFormulaId(formulaId);
    setIsModalOpen(true);
  };

  const handleSaveFormula = () => {
    if (!newFormula.title.trim() || !newFormula.formula.trim() || selectedFormulaId === null) return;

    setFormulas(prev =>
      prev.map(formula =>
        formula.id === selectedFormulaId
          ? {
              ...formula,
              title: newFormula.title,
              formula: newFormula.formula,
              description: newFormula.description,
              category: newFormula.category,
              status: 'uploaded' as const,
            }
          : formula
      )
    );
    setIsModalOpen(false);
    setNewFormula({ title: '', formula: '', description: '', category: categoryOptions[subject][0] });
    setSelectedFormulaId(null);
  };

  const handleDeleteFormula = (formulaId: number) => {
    setFormulas(prev =>
      prev.map(formula =>
        formula.id === formulaId
          ? { ...formula, title: null, formula: null, description: undefined, category: undefined, status: 'not-uploaded' as const }
          : formula
      )
    );
  };

  const handleAddNewSlot = () => {
    const newId = formulas.length + 1;
    setFormulas(prev => [
      ...prev,
      { id: newId, title: null, formula: null, status: 'not-uploaded' as const },
    ]);
  };

  const uploadedFormulas = formulas.filter(f => f.status === 'uploaded');
  const groupedByCategory = uploadedFormulas.reduce((acc, formula) => {
    const cat = formula.category || 'Alte formule';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(formula);
    return acc;
  }, {} as Record<string, Formula[]>);

  return (
    <section className="mt-12 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/70 rounded-lg flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-navy-dark" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Portofoliu Formule</h2>
            <p className="text-sm text-muted-foreground">Formule esențiale pentru {subjectName}</p>
          </div>
        </div>
        {isProfessor && (
          <Button variant="gold" size="sm" className="gap-2" onClick={handleAddNewSlot}>
            <Plus className="w-4 h-4" />
            Slot nou
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-gold">{uploadedFormulas.length}</p>
          <p className="text-xs text-muted-foreground">Formule încărcate</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{Object.keys(groupedByCategory).length}</p>
          <p className="text-xs text-muted-foreground">Categorii</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{formulas.length}</p>
          <p className="text-xs text-muted-foreground">Total sloturi</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-emerald-500">{Math.round((uploadedFormulas.length / formulas.length) * 100)}%</p>
          <p className="text-xs text-muted-foreground">Completat</p>
        </div>
      </div>

      {/* Formulas by Category for Students */}
      {!isProfessor && Object.keys(groupedByCategory).length > 0 && (
        <div className="space-y-6 mb-8">
          {Object.entries(groupedByCategory).map(([category, categoryFormulas]) => (
            <div key={category} className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                <SubjectIcon className="w-5 h-5 text-gold" />
                {category}
              </h3>
              <div className="grid gap-4">
                {categoryFormulas.map(formula => (
                  <div
                    key={formula.id}
                    className="bg-background rounded-lg p-4 border border-border hover:border-gold/50 transition-colors"
                  >
                    <h4 className="font-medium text-foreground mb-2">{formula.title}</h4>
                    <div className="bg-muted rounded-lg p-3 mb-2 font-mono text-lg text-center text-gold">
                      {formula.formula}
                    </div>
                    {formula.description && (
                      <p className="text-sm text-muted-foreground">{formula.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formula Slots for Professors */}
      {isProfessor && (
        <div className="space-y-4">
          {formulas.map((formula, index) => (
            <div
              key={formula.id}
              className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 transition-all duration-300 ${formula.status === 'not-uploaded' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formula.status === 'uploaded' ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    {formula.status === 'not-uploaded' ? (
                      <h3 className="font-medium text-muted-foreground italic">Formula nu a fost adăugată</h3>
                    ) : (
                      <>
                        <h3 className="font-medium text-foreground">{formula.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <code className="text-sm bg-muted px-2 py-0.5 rounded text-gold font-mono">
                            {formula.formula}
                          </code>
                          {formula.category && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {formula.category}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {formula.status === 'not-uploaded' ? (
                    <Button variant="gold" size="sm" className="gap-2" onClick={() => handleAddFormula(formula.id)}>
                      <Plus className="w-4 h-4" />
                      Adaugă
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleAddFormula(formula.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteFormula(formula.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State for Students */}
      {!isProfessor && uploadedFormulas.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg text-foreground mb-2">Nicio formulă încă</h3>
          <p className="text-muted-foreground">Profesorii nu au încărcat formule pentru {subjectName} deocamdată.</p>
        </div>
      )}

      {/* Add/Edit Formula Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {formulas.find(f => f.id === selectedFormulaId)?.status === 'uploaded' ? 'Editează Formula' : 'Adaugă Formulă'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
              <input
                type="text"
                placeholder="ex: Legea lui Ohm"
                value={newFormula.title}
                onChange={e => setNewFormula(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Formula *</label>
              <input
                type="text"
                placeholder="ex: U = I × R"
                value={newFormula.formula}
                onChange={e => setNewFormula(prev => ({ ...prev, formula: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Categorie</label>
              <select
                value={newFormula.category}
                onChange={e => setNewFormula(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {categoryOptions[subject].map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descriere (opțional)</label>
              <textarea
                placeholder="Explicație scurtă a formulei..."
                value={newFormula.description}
                onChange={e => setNewFormula(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Anulează
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleSaveFormula}
                disabled={!newFormula.title.trim() || !newFormula.formula.trim()}
              >
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FormulaPortfolio;
