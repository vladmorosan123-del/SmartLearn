import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Template {
  id: number;
  title: string | null;
  description?: string;
  pdfUrl?: string;
  status: 'uploaded' | 'not-uploaded';
}

const initialTemplates: Template[] = [
  { id: 1, title: 'Șablon Comentariu Literar - Poezie', description: 'Structura comentariului pentru poezie modernistă', pdfUrl: 'https://example.com/pdf', status: 'uploaded' },
  { id: 2, title: 'Șablon Comentariu Literar - Proză', description: 'Structura comentariului pentru proză', status: 'uploaded' },
  { id: 3, title: 'Șablon Caracterizare Personaj', description: 'Model pentru caracterizarea personajelor', status: 'uploaded' },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: i + 4,
    title: null,
    status: 'not-uploaded' as const,
  })),
];

const Subiect2BAC = () => {
  const { role, subject } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProfessor = role === 'profesor';
  
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', pdfUrl: '' });

  // Only for Romanian
  if (subject !== 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Subiectul II indisponibil</h1>
          <p className="text-muted-foreground mb-6">Această secțiune este disponibilă doar pentru Limba Română.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAddTemplate = (id: number) => {
    const existing = templates.find(t => t.id === id);
    setFormData({
      title: existing?.title || '',
      description: existing?.description || '',
      pdfUrl: existing?.pdfUrl || '',
    });
    setSelectedTemplateId(id);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || selectedTemplateId === null) return;
    
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplateId 
        ? { ...t, title: formData.title, description: formData.description, pdfUrl: formData.pdfUrl, status: 'uploaded' as const }
        : t
    ));
    setIsModalOpen(false);
    setFormData({ title: '', description: '', pdfUrl: '' });
    toast({ title: 'Șablon salvat', description: 'Șablonul a fost salvat cu succes.' });
  };

  const handleDelete = (id: number) => {
    setTemplates(prev => prev.map(t => 
      t.id === id 
        ? { ...t, title: null, description: undefined, pdfUrl: undefined, status: 'not-uploaded' as const }
        : t
    ));
    toast({ title: 'Șablon șters', description: 'Șablonul a fost șters.' });
  };

  const uploadedCount = templates.filter(t => t.status === 'uploaded').length;

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
              <FileText className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Subiectul II BAC - Șabloane</h1>
            </div>
            <p className="text-primary-foreground/70">
              Modele și structuri pentru comentariul literar și caracterizări
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-up">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-gold">{uploadedCount}</p>
            <p className="text-xs text-muted-foreground">Șabloane încărcate</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{templates.length}</p>
            <p className="text-xs text-muted-foreground">Total sloturi</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up delay-100">
          <h3 className="font-display text-lg text-foreground mb-2">Ce este Subiectul II?</h3>
          <p className="text-muted-foreground">
            Subiectul II la Bacalaureat - Limba Română testează capacitatea de a scrie un text argumentativ pe o temă dată, 
            pornind de la un fragment literar. Aici găsești șabloane și modele pentru diferite tipuri de opere.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 animate-fade-up delay-200">
          {templates.map((template, index) => (
            <div 
              key={template.id}
              className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 transition-all ${
                template.status === 'not-uploaded' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    template.status === 'uploaded' ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div>
                    {template.status === 'not-uploaded' ? (
                      <h3 className="font-medium text-muted-foreground italic">Șablon neîncărcat</h3>
                    ) : (
                      <>
                        <h3 className="font-medium text-foreground">{template.title}</h3>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                        {template.pdfUrl && (
                          <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded mt-2 inline-flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            PDF atașat
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProfessor ? (
                    template.status === 'not-uploaded' ? (
                      <Button variant="gold" size="sm" className="gap-2" onClick={() => handleAddTemplate(template.id)}>
                        <Plus className="w-4 h-4" />
                        Adaugă
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleAddTemplate(template.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )
                  ) : (
                    template.status === 'uploaded' && (
                      <Button variant="gold" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Vizualizează
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
            <DialogTitle className="font-display">Adaugă Șablon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
              <input
                type="text"
                placeholder="ex: Șablon Comentariu - Poezie"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descriere</label>
              <textarea
                placeholder="Descriere scurtă..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL PDF (opțional)</label>
              <input
                type="url"
                placeholder="https://example.com/sablon.pdf"
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

export default Subiect2BAC;
