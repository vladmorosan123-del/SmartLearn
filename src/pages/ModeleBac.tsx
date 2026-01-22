import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, FileText, Eye, Plus, Upload, 
  Search, Filter, Calendar, Trash2, Edit
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
  pdfUrl?: string;
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
  const [newModel, setNewModel] = useState({ title: '', year: new Date().getFullYear(), description: '', pdfUrl: '' });
  const [viewingModel, setViewingModel] = useState<{ title: string; pdfUrl?: string } | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const isProfessor = role === 'profesor';
  const currentModels = bacData[selectedSubject];

  // Get unique years from uploaded models
  const availableYears = [...new Set(
    currentModels
      .filter(m => m.status === 'uploaded' && m.year)
      .map(m => m.year!)
  )].sort((a, b) => b - a);

  // Filter models based on search and year filter
  const filteredModels = currentModels.filter(model => {
    // Always show not-uploaded slots for professors
    if (model.status === 'not-uploaded' && isProfessor) {
      // Hide if searching or filtering by year
      if (searchQuery.trim() || selectedYear) return false;
      return true;
    }
    
    // For uploaded models, apply filters
    if (model.status === 'uploaded') {
      const matchesSearch = !searchQuery.trim() || 
        model.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.year?.toString().includes(searchQuery);
      
      const matchesYear = !selectedYear || model.year === selectedYear;
      
      return matchesSearch && matchesYear;
    }
    
    return false;
  });

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
          ? { ...item, title: newModel.title, year: newModel.year, description: newModel.description, pdfUrl: newModel.pdfUrl || undefined, status: 'uploaded' as const }
          : item
      ),
    }));
    setIsAddModalOpen(false);
    setNewModel({ title: '', year: new Date().getFullYear(), description: '', pdfUrl: '' });
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
          <div className="relative">
            <Button 
              variant={selectedYear ? 'gold' : 'outline'} 
              className="gap-2"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="w-4 h-4" />
              {selectedYear ? `Anul ${selectedYear}` : 'Filtrează'}
            </Button>
            
            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-card rounded-lg shadow-elegant border border-border overflow-hidden z-50 min-w-[180px]">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Selectează anul</p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedYear(null);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-muted transition-colors ${!selectedYear ? 'bg-muted text-foreground font-medium' : 'text-foreground'}`}
                  >
                    Toți anii
                  </button>
                  {Array.from({ length: 10 }, (_, i) => 2025 - i).map(year => {
                    const hasModels = availableYears.includes(year);
                    return (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between ${selectedYear === year ? 'bg-muted font-medium' : ''}`}
                      >
                        <span className={hasModels ? 'text-foreground' : 'text-muted-foreground'}>
                          {year}
                        </span>
                        {hasModels ? (
                          <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                            {currentModels.filter(m => m.year === year && m.status === 'uploaded').length} modele
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">neîncărcat</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Models List - 10 Slots */}
        <div className="space-y-4 animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-foreground">
              Modele BAC - {subjectNames[selectedSubject]}
            </h2>
            {(searchQuery || selectedYear) && (
              <p className="text-sm text-muted-foreground">
                {filteredModels.filter(m => m.status === 'uploaded').length} rezultate găsite
              </p>
            )}
          </div>
          
          {filteredModels.length === 0 ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">Niciun rezultat găsit</h3>
              <p className="text-muted-foreground text-sm">
                Încearcă să modifici criteriile de căutare sau filtrare
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedYear(null);
                }}
              >
                Resetează filtrele
              </Button>
            </div>
          ) : (
            filteredModels.map((model, index) => (
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
                    <>
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleAddModel(model.id)}
                      >
                        {model.status === 'not-uploaded' ? (
                          <>
                            <Plus className="w-4 h-4" />
                            Încarcă Model
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4" />
                            Editează
                          </>
                        )}
                      </Button>
                      {model.status === 'uploaded' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => model.title && setViewingModel({ title: model.title, pdfUrl: model.pdfUrl })}
                          >
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
                      )}
                    </>
                  ) : (
                    model.status === 'uploaded' && (
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => model.title && setViewingModel({ title: model.title, pdfUrl: model.pdfUrl })}
                      >
                        <Eye className="w-4 h-4" />
                        Deschide
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
          )}
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
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Link PDF (opțional)</label>
                  <input
                    type="url"
                    placeholder="https://exemplu.com/subiect.pdf"
                    value={newModel.pdfUrl}
                    onChange={(e) => setNewModel(prev => ({ ...prev, pdfUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Introdu linkul către fișierul PDF (Google Drive, Dropbox, etc.)
                  </p>
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
            title={viewingModel.title} 
            pdfUrl={viewingModel.pdfUrl}
            onClose={() => setViewingModel(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default ModeleBac;
