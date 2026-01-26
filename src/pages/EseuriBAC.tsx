import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, PenTool, Plus, Trash2, Edit, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Essay {
  id: number;
  title: string | null;
  author?: string;
  genre?: string;
  description?: string;
  pdfUrl?: string;
  status: 'uploaded' | 'not-uploaded';
}

const genres = [
  'Poezie modernistă',
  'Poezie romantică',
  'Poezie simbolistă',
  'Proză realistă',
  'Proză psihologică',
  'Dramă',
  'Basm cult',
  'Nuvelă',
  'Roman',
];

const initialEssays: Essay[] = [
  { id: 1, title: 'Eseu - Luceafărul', author: 'Mihai Eminescu', genre: 'Poezie romantică', description: 'Analiza poemului romantic', status: 'uploaded' },
  { id: 2, title: 'Eseu - Plumb', author: 'George Bacovia', genre: 'Poezie simbolistă', description: 'Tema condiției poetului', status: 'uploaded' },
  { id: 3, title: 'Eseu - Enigma Otiliei', author: 'George Călinescu', genre: 'Roman', description: 'Caracterizarea Otiliei', status: 'uploaded' },
  { id: 4, title: 'Eseu - Ion', author: 'Liviu Rebreanu', genre: 'Roman', description: 'Tema pământului și a iubirii', status: 'uploaded' },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: i + 5,
    title: null,
    status: 'not-uploaded' as const,
  })),
];

const EseuriBAC = () => {
  const { role, subject } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProfessor = role === 'profesor' || authRole === 'admin';
  
  const [essays, setEssays] = useState<Essay[]>(initialEssays);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEssayId, setSelectedEssayId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', author: '', genre: genres[0], description: '', pdfUrl: '' });
  const [filterGenre, setFilterGenre] = useState<string>('');

  // Only for Romanian
  if (subject !== 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <PenTool className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Eseuri indisponibile</h1>
          <p className="text-muted-foreground mb-6">Această secțiune este disponibilă doar pentru Limba Română.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAddEssay = (id: number) => {
    const existing = essays.find(e => e.id === id);
    setFormData({
      title: existing?.title || '',
      author: existing?.author || '',
      genre: existing?.genre || genres[0],
      description: existing?.description || '',
      pdfUrl: existing?.pdfUrl || '',
    });
    setSelectedEssayId(id);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || selectedEssayId === null) return;
    
    setEssays(prev => prev.map(e => 
      e.id === selectedEssayId 
        ? { ...e, ...formData, status: 'uploaded' as const }
        : e
    ));
    setIsModalOpen(false);
    setFormData({ title: '', author: '', genre: genres[0], description: '', pdfUrl: '' });
    toast({ title: 'Eseu salvat', description: 'Eseul a fost salvat cu succes.' });
  };

  const handleDelete = (id: number) => {
    setEssays(prev => prev.map(e => 
      e.id === id 
        ? { ...e, title: null, author: undefined, genre: undefined, description: undefined, pdfUrl: undefined, status: 'not-uploaded' as const }
        : e
    ));
    toast({ title: 'Eseu șters', description: 'Eseul a fost șters.' });
  };

  const handleAddNewSlot = () => {
    const newId = essays.length + 1;
    setEssays(prev => [...prev, { id: newId, title: null, status: 'not-uploaded' as const }]);
  };

  const uploadedEssays = essays.filter(e => e.status === 'uploaded');
  const filteredEssays = filterGenre 
    ? essays.filter(e => e.genre === filterGenre || e.status === 'not-uploaded')
    : essays;
  
  const genreCounts = uploadedEssays.reduce((acc, e) => {
    if (e.genre) acc[e.genre] = (acc[e.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-sidebar-accent"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-gold" />
              <span className="font-display text-lg hidden md:block">LM Ștefan cel Mare</span>
            </div>
          </div>
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <PenTool className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Eseuri BAC - Subiectul III</h1>
            </div>
            <p className="text-primary-foreground/70">
              Colecție de eseuri model pentru pregătirea examenului de Bacalaureat
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-gold">{uploadedEssays.length}</p>
            <p className="text-xs text-muted-foreground">Eseuri încărcate</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{Object.keys(genreCounts).length}</p>
            <p className="text-xs text-muted-foreground">Genuri literare</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{essays.length}</p>
            <p className="text-xs text-muted-foreground">Total sloturi</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-emerald-500">{Math.round((uploadedEssays.length / essays.length) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Completat</p>
          </div>
        </div>

        {/* Filter by Genre */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-up delay-100">
          <Button 
            variant={!filterGenre ? 'gold' : 'outline'} 
            size="sm"
            onClick={() => setFilterGenre('')}
          >
            Toate
          </Button>
          {Object.entries(genreCounts).map(([genre, count]) => (
            <Button 
              key={genre}
              variant={filterGenre === genre ? 'gold' : 'outline'} 
              size="sm"
              onClick={() => setFilterGenre(genre)}
            >
              {genre} ({count})
            </Button>
          ))}
        </div>

        {/* Add New Button for Professors */}
        {isProfessor && (
          <div className="mb-6 animate-fade-up delay-200">
            <Button variant="gold" className="gap-2" onClick={handleAddNewSlot}>
              <Plus className="w-4 h-4" />
              Adaugă slot nou
            </Button>
          </div>
        )}

        {/* Essays Grid */}
        <div className="grid gap-4 animate-fade-up delay-300">
          {filteredEssays.map((essay, index) => (
            <div 
              key={essay.id}
              className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 transition-all ${
                essay.status === 'not-uploaded' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    essay.status === 'uploaded' ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    {essay.status === 'not-uploaded' ? (
                      <h3 className="font-medium text-muted-foreground italic">Eseu neîncărcat</h3>
                    ) : (
                      <>
                        <h3 className="font-medium text-foreground">{essay.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {essay.author && (
                            <span className="text-sm text-muted-foreground">{essay.author}</span>
                          )}
                          {essay.genre && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {essay.genre}
                            </span>
                          )}
                        </div>
                        {essay.description && (
                          <p className="text-sm text-muted-foreground mt-2">{essay.description}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProfessor ? (
                    essay.status === 'not-uploaded' ? (
                      <Button variant="gold" size="sm" className="gap-2" onClick={() => handleAddEssay(essay.id)}>
                        <Plus className="w-4 h-4" />
                        Adaugă
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleAddEssay(essay.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(essay.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )
                  ) : (
                    essay.status === 'uploaded' && (
                      <Button variant="gold" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Citește
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Adaugă Eseu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
              <input
                type="text"
                placeholder="ex: Eseu - Luceafărul"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Autor</label>
              <input
                type="text"
                placeholder="ex: Mihai Eminescu"
                value={formData.author}
                onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Gen literar</label>
              <select
                value={formData.genre}
                onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descriere</label>
              <textarea
                placeholder="Descriere scurtă..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL PDF (opțional)</label>
              <input
                type="url"
                placeholder="https://example.com/eseu.pdf"
                value={formData.pdfUrl}
                onChange={e => setFormData(prev => ({ ...prev, pdfUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Anulează
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSave} disabled={!formData.title.trim()}>
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EseuriBAC;
