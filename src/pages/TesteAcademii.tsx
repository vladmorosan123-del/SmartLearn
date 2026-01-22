import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Award, Upload, Search, Filter, 
  Calendar, Clock, FileText, Plus, Trash2, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import TVCTimer from '@/components/TVCTimer';

// Subjects that have TVC tests (excluding romana)
const tvcSubjects: Subject[] = ['informatica', 'matematica', 'fizica'];

const subjectNames: Record<Subject, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

interface TVCMaterial {
  id: number;
  title: string | null;
  type: 'subiect' | 'material' | 'pdf';
  year?: number;
  description?: string;
  status: 'uploaded' | 'not-uploaded';
}

// 10 slots for each subject
const createEmptySlots = (): TVCMaterial[] => 
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: null,
    type: 'subiect',
    status: 'not-uploaded',
  }));

const initialTVCData: Record<Subject, TVCMaterial[]> = {
  informatica: [
    { id: 1, title: 'Subiect TVC 2024 - Sesiunea I', type: 'subiect', year: 2024, status: 'uploaded' },
    { id: 2, title: 'Culegere probleme TVC', type: 'pdf', status: 'uploaded' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      type: 'subiect' as const,
      status: 'not-uploaded' as const,
    })),
  ],
  romana: createEmptySlots(), // Not used, but kept for type consistency
  matematica: [
    { id: 1, title: 'Subiect TVC Matematică 2024', type: 'subiect', year: 2024, status: 'uploaded' },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 2,
      title: null,
      type: 'subiect' as const,
      status: 'not-uploaded' as const,
    })),
  ],
  fizica: createEmptySlots(),
};

const TesteAcademii = () => {
  const { role, subject } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    subject && tvcSubjects.includes(subject) ? subject : 'informatica'
  );
  const [tvcData, setTvcData] = useState(initialTVCData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState<{ title: string; type: 'subiect' | 'material' | 'pdf'; description: string }>({ title: '', type: 'subiect', description: '' });
  const [timerSubject, setTimerSubject] = useState<string | null>(null);

  const isProfessor = role === 'profesor';
  const currentMaterials = tvcData[selectedSubject];

  const handleAddMaterial = (slotId: number) => {
    setSelectedSlotId(slotId);
    setIsAddModalOpen(true);
  };

  const handleSaveMaterial = () => {
    if (!newMaterial.title.trim() || selectedSlotId === null) return;

    setTvcData(prev => ({
      ...prev,
      [selectedSubject]: prev[selectedSubject].map(item =>
        item.id === selectedSlotId
          ? { ...item, title: newMaterial.title, type: newMaterial.type, description: newMaterial.description, status: 'uploaded' as const }
          : item
      ),
    }));
    setIsAddModalOpen(false);
    setNewMaterial({ title: '', type: 'subiect', description: '' });
    setSelectedSlotId(null);
  };

  const handleDeleteMaterial = (slotId: number) => {
    setTvcData(prev => ({
      ...prev,
      [selectedSubject]: prev[selectedSubject].map(item =>
        item.id === slotId
          ? { ...item, title: null, type: 'subiect', description: undefined, status: 'not-uploaded' as const }
          : item
      ),
    }));
  };

  // Check if current subject has TVC
  if (subject === 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">TVC nu este disponibil pentru Limba Română</h1>
          <p className="text-muted-foreground mb-6">Testele de Verificare a Cunoștințelor sunt disponibile doar pentru Informatică, Matematică și Fizică.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
              <Award className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">TVC - Teste de Verificare a Cunoștințelor</h1>
            </div>
            <p className="text-primary-foreground/70">
              Pregătire pentru admiterea la academiile militare din România
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subject Selector */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up delay-100">
          {tvcSubjects.map((subj) => (
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
              placeholder="Caută subiecte și materiale TVC..."
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

        {/* Info Box */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up delay-300">
          <h3 className="font-display text-lg text-foreground mb-2">Ce este TVC?</h3>
          <p className="text-muted-foreground">
            Testul de Verificare a Cunoștințelor (TVC) este examenul unitar de admitere pentru toate academiile militare din România. 
            Aici găsești subiecte, materiale de pregătire și PDF-uri din cărți pentru {subjectNames[selectedSubject]}.
          </p>
        </div>

        {/* Materials List - 10 Slots */}
        <div className="space-y-4 animate-fade-up delay-400">
          <h2 className="font-display text-2xl text-foreground mb-4">
            Materiale TVC - {subjectNames[selectedSubject]} (10 sloturi)
          </h2>
          
          {currentMaterials.map((material, index) => (
            <div 
              key={material.id}
              className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${material.status === 'not-uploaded' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    material.status === 'uploaded' ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <div>
                    {material.status === 'not-uploaded' ? (
                      <h3 className="font-medium text-muted-foreground italic">Materialul nu a fost încărcat</h3>
                    ) : (
                      <>
                        <h3 className="font-medium text-foreground">{material.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            material.type === 'subiect' ? 'bg-primary/10 text-primary' :
                            material.type === 'pdf' ? 'bg-rose-500/10 text-rose-600' :
                            'bg-gold/10 text-gold'
                          }`}>
                            {material.type === 'subiect' ? 'Subiect' : material.type === 'pdf' ? 'PDF Carte' : 'Material'}
                          </span>
                          {material.year && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {material.year}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProfessor ? (
                    material.status === 'not-uploaded' ? (
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleAddMaterial(material.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Încarcă
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )
                  ) : (
                    material.status === 'uploaded' && (
                      <Button 
                        variant="gold" 
                        size="sm"
                        onClick={() => material.type === 'subiect' && material.title ? setTimerSubject(material.title) : null}
                      >
                        {material.type === 'subiect' ? 'Începe cu Timer' : 'Deschide'}
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
              <h2 className="font-display text-xl text-foreground mb-4">Încarcă Material TVC</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titlu *</label>
                  <input
                    type="text"
                    placeholder="ex: Subiect TVC 2024"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tip material</label>
                  <select
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value as 'subiect' | 'material' | 'pdf' }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="subiect">Subiect TVC</option>
                    <option value="material">Material de pregătire</option>
                    <option value="pdf">PDF din carte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Descriere (opțional)</label>
                  <textarea
                    placeholder="Descriere scurtă..."
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
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
                    onClick={handleSaveMaterial}
                    disabled={!newMaterial.title.trim()}
                  >
                    Salvează
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timer Modal */}
        {timerSubject && (
          <TVCTimer 
            subjectTitle={timerSubject} 
            onClose={() => setTimerSubject(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default TesteAcademii;
