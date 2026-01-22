import { useState } from 'react';
import { Plus, Trash2, Edit, Calculator, Atom, BookMarked, Image, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FormulaCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  status: 'uploaded' | 'not-uploaded';
}

interface FormulaPortfolioProps {
  subject: 'matematica' | 'fizica';
  isProfessor: boolean;
}

const categoryDefinitions: Record<'matematica' | 'fizica', { id: string; name: string }[]> = {
  matematica: [
    { id: 'algebra', name: 'Algebră' },
    { id: 'geometrie', name: 'Geometrie' },
    { id: 'analiza', name: 'Analiză Matematică' },
    { id: 'trigonometrie', name: 'Trigonometrie' },
    { id: 'probabilitati', name: 'Probabilități și Statistică' },
    { id: 'combinatorica', name: 'Combinatorică' },
  ],
  fizica: [
    { id: 'mecanica', name: 'Mecanică' },
    { id: 'termodinamica', name: 'Termodinamică' },
    { id: 'electricitate', name: 'Electricitate și Magnetism' },
    { id: 'optica', name: 'Optică' },
    { id: 'nucleara', name: 'Fizică Nucleară' },
    { id: 'unde', name: 'Unde și Oscilații' },
  ],
};

const createInitialCategories = (subject: 'matematica' | 'fizica'): FormulaCategory[] =>
  categoryDefinitions[subject].map(cat => ({
    id: cat.id,
    name: cat.name,
    imageUrl: null,
    status: 'not-uploaded' as const,
  }));

const FormulaPortfolio = ({ subject, isProfessor }: FormulaPortfolioProps) => {
  const [categories, setCategories] = useState<FormulaCategory[]>(createInitialCategories(subject));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [viewingImage, setViewingImage] = useState<{ name: string; url: string } | null>(null);

  const SubjectIcon = subject === 'matematica' ? Calculator : Atom;
  const subjectName = subject === 'matematica' ? 'Matematică' : 'Fizică';

  const handleUploadImage = (categoryId: string) => {
    const existingCategory = categories.find(c => c.id === categoryId);
    setImageUrl(existingCategory?.imageUrl || '');
    setSelectedCategoryId(categoryId);
    setIsModalOpen(true);
  };

  const handleSaveImage = () => {
    if (!imageUrl.trim() || selectedCategoryId === null) return;

    setCategories(prev =>
      prev.map(category =>
        category.id === selectedCategoryId
          ? { ...category, imageUrl: imageUrl.trim(), status: 'uploaded' as const }
          : category
      )
    );
    setIsModalOpen(false);
    setImageUrl('');
    setSelectedCategoryId(null);
  };

  const handleDeleteImage = (categoryId: string) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? { ...category, imageUrl: null, status: 'not-uploaded' as const }
          : category
      )
    );
  };

  const uploadedCategories = categories.filter(c => c.status === 'uploaded');

  return (
    <section className="mt-12 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/70 rounded-lg flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-navy-dark" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Portofoliu Formule</h2>
            <p className="text-sm text-muted-foreground">Formule esențiale pentru {subjectName} - organizate pe categorii</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-gold">{uploadedCategories.length}</p>
          <p className="text-xs text-muted-foreground">Categorii încărcate</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
          <p className="text-xs text-muted-foreground">Total categorii</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div
            key={category.id}
            className={`bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-gold ${
              category.status === 'not-uploaded' ? 'opacity-70' : ''
            }`}
          >
            {/* Category Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SubjectIcon className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-lg text-foreground">{category.name}</h3>
                </div>
                {isProfessor && category.status === 'uploaded' && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUploadImage(category.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteImage(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Area */}
            <div className="aspect-[4/3] relative">
              {category.status === 'uploaded' && category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={`Formule ${category.name}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewingImage({ name: category.name, url: category.imageUrl! })}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                  <Image className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Nicio imagine încărcată</p>
                </div>
              )}
            </div>

            {/* Upload Button for Professors */}
            {isProfessor && category.status === 'not-uploaded' && (
              <div className="p-4 border-t border-border">
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  onClick={() => handleUploadImage(category.id)}
                >
                  <Upload className="w-4 h-4" />
                  Încarcă imagine
                </Button>
              </div>
            )}

            {/* View Button for Students */}
            {!isProfessor && category.status === 'uploaded' && (
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setViewingImage({ name: category.name, url: category.imageUrl! })}
                >
                  <Image className="w-4 h-4" />
                  Vezi formule
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Încarcă imagine pentru {categories.find(c => c.id === selectedCategoryId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL Imagine *</label>
              <input
                type="url"
                placeholder="https://example.com/formule.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Introduceți URL-ul imaginii cu formulele pentru această categorie
              </p>
            </div>

            {imageUrl && (
              <div className="border border-border rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Anulează
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleSaveImage}
                disabled={!imageUrl.trim()}
              >
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingImage(null)} />
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setViewingImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="bg-card rounded-xl overflow-hidden shadow-elegant">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-display text-xl text-foreground flex items-center gap-2">
                  <SubjectIcon className="w-5 h-5 text-gold" />
                  Formule - {viewingImage.name}
                </h3>
              </div>
              <div className="max-h-[70vh] overflow-auto">
                <img
                  src={viewingImage.url}
                  alt={`Formule ${viewingImage.name}`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FormulaPortfolio;
