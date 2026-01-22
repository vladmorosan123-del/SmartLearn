import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, FileText, Eye, Plus, Upload, 
  Search, Filter, Calendar, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import BACViewer from '@/components/BACViewer';

const subjectNames: Record<Subject, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

interface BacModel {
  id: number;
  title: string | null;
  year?: number;
  description?: string;
  status: 'uploaded' | 'not-uploaded';
}

// 10 slots for each subject
const createEmptySlots = (): BacModel[] => 
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: null,
    status: 'not-uploaded',
  }));

const initialBacData: Record<Subject, BacModel[]> = {
  informatica: [
    { id: 1, title: 'Model BAC Informatică 2024 - Sesiunea Iunie', year: 2024, status: 'uploaded' },
    { id: 2, title: 'Model BAC Informatică 2023', year: 2023, status: 'uploaded' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      status: 'not-uploaded' as const,
    })),
  ],
  romana: [
    { id: 1, title: 'Model BAC Română 2024 - Real', year: 2024, status: 'uploaded' },
    { id: 2, title: 'Model BAC Română 2024 - Uman', year: 2024, status: 'uploaded' },
    { id: 3, title: 'Simulare Națională Februarie 2024', year: 2024, status: 'uploaded' },
    ...Array.from({ length: 7 }, (_, i) => ({
      id: i + 4,
      title: null,
      status: 'not-uploaded' as const,
    })),
  ],
  matematica: [
    { id: 1, title: 'Model BAC Matematică M1 2024', year: 2024, status: 'uploaded' },
    { id: 2, title: 'Model BAC Matematică M2 2024', year: 2024, status: 'uploaded' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      status: 'not-uploaded' as const,
    })),
  ],
  fizica: [
    { id: 1, title: 'Model BAC Fizică 2024', year: 2024, status: 'uploaded' },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 2,
      title: null,
      status: 'not-uploaded' as const,
    })),
  ],
};

const ModeleBac = () => {
  const { role, subject } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subject || 'informatica');
  const [bacData, setBacData] = useState(initialBacData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [newModel, setNewModel] = useState({ title: '', year: new Date().getFullYear(), description: '' });
  const [viewingModel, setViewingModel] = useState<string | null>(null);

  const isProfessor = role === 'profesor';
  const currentModels = bacData[selectedSubject];

  const handleAddModel = (slotId: number) => {
    setSelectedSlotId(slotId);
    setIsAddModalOpen(true);
  };

  const handleSaveModel = () => {
    if (!newModel.title.trim() || selectedSlotId === null) return;

    setBacData(prev => ({
      ...prev,
      [selectedSubject]: prev[selectedSubject].map(item =>
        item.id === selectedSlotId
          ? { ...item, title: newModel.title, year: newModel.year, description: newModel.description, status: 'uploaded' as const }
          : item
      ),
    }));
    setIsAddModalOpen(false);
    setNewModel({ title: '', year: new Date().getFullYear(), description: '' });
    setSelectedSlotId(null);
  };

  const handleDeleteModel = (slotId: number) => {
    setBacData(prev => ({
      ...prev,
      [selectedSubject]: prev[selectedSubject].map(item =>
        item.id === slotId
          ? { ...item, title: null, year: undefined, description: undefined, status: 'not-uploaded' as const }
          : item
      ),
    }));
  };

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
              <h1 className="font-display text-3xl md:text-4xl">Modele BAC</h1>
            </div>
            <p className="text-primary-foreground/70">
              Pregătire pentru examenul de bacalaureat cu modele oficiale și simulări
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subject Selector */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up delay-100">
          {(Object.keys(subjectNames) as Subject[]).map((subj) => (
            <Button
              key={subj}
              variant={selectedSubject === subj ? 'gold' : 'outline'}
              onClick={() => setSelectedSubject(subj)}
            >
              {subjectNames[subj]}
            </Button>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-up delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Caută modele BAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrează
          </Button>
        </div>

        {/* Models List - 10 Slots */}
        <div className="space-y-4 animate-fade-up delay-300">
          <h2 className="font-display text-2xl text-foreground mb-4">
            Modele BAC - {subjectNames[selectedSubject]} (10 sloturi)
          </h2>
          
          {currentModels.map((model, index) => (
            <div 
              key={model.id}
              className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${model.status === 'not-uploaded' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    model.status === 'uploaded' ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div>
                    {model.status === 'not-uploaded' ? (
                      <h3 className="font-medium text-muted-foreground italic">Modelul nu a fost încărcat</h3>
                    ) : (
                      <>
                        <h3 className="font-medium text-foreground">{model.title}</h3>
                        {model.year && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {model.year}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProfessor ? (
                    model.status === 'not-uploaded' ? (
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleAddModel(model.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Încarcă Model
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                          Vezi
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )
                  ) : (
                    model.status === 'uploaded' && (
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => model.title && setViewingModel(model.title)}
                      >
                        <Eye className="w-4 h-4" />
                        Deschide
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-md mx-4 p-6 animate-scale-in">
              <h2 className="font-display text-xl text-foreground mb-4">Încarcă Model BAC</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
                  <input
                    type="text"
                    placeholder="ex: Model BAC 2024 - Sesiunea Iunie"
                    value={newModel.title}
                    onChange={(e) => setNewModel(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Anul</label>
                  <input
                    type="number"
                    value={newModel.year}
                    onChange={(e) => setNewModel(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Descriere (opțional)</label>
                  <textarea
                    placeholder="Descriere scurtă..."
                    value={newModel.description}
                    onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
                    Anulează
                  </Button>
                  <Button 
                    variant="gold" 
                    className="flex-1"
                    onClick={handleSaveModel}
                    disabled={!newModel.title.trim()}
                  >
                    Salvează
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BAC Viewer Modal */}
        {viewingModel && (
          <BACViewer 
            subjectTitle={viewingModel} 
            onClose={() => setViewingModel(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default ModeleBac;
