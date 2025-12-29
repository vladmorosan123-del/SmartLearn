import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, FileText, Download, Eye, Plus, Upload, 
  Search, Filter, Calendar, CheckCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

const bacModels = [
  { id: 1, title: 'Model BAC Informatică 2024', year: 2024, subject: 'Informatică', status: 'completed', difficulty: 'Mediu' },
  { id: 2, title: 'Model BAC Informatică 2023', year: 2023, subject: 'Informatică', status: 'new', difficulty: 'Avansat' },
  { id: 3, title: 'Model Oficial MEN 2024', year: 2024, subject: 'Informatică', status: 'in-progress', difficulty: 'Mediu' },
  { id: 4, title: 'Simulare Națională Februarie 2024', year: 2024, subject: 'Informatică', status: 'new', difficulty: 'Ușor' },
  { id: 5, title: 'Model BAC Informatică 2022', year: 2022, subject: 'Informatică', status: 'completed', difficulty: 'Avansat' },
];

const ModeleBac = () => {
  const { role } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isProfessor = role === 'profesor';

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
            <h1 className="font-display text-3xl md:text-4xl mb-2">Modele BAC</h1>
            <p className="text-primary-foreground/70">
              Pregătire pentru examenul de bacalaureat cu modele oficiale și simulări
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-up delay-100">
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
          {isProfessor && (
            <Button variant="gold" className="gap-2">
              <Upload className="w-4 h-4" />
              Încarcă Model Nou
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up delay-200">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <p className="text-2xl font-bold text-foreground">24</p>
            <p className="text-sm text-muted-foreground">Modele disponibile</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <p className="text-2xl font-bold text-emerald-500">8</p>
            <p className="text-sm text-muted-foreground">Completate</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <p className="text-2xl font-bold text-gold">3</p>
            <p className="text-sm text-muted-foreground">În progres</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <p className="text-2xl font-bold text-foreground">85%</p>
            <p className="text-sm text-muted-foreground">Scor mediu</p>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-300">
          {bacModels.map((model) => (
            <div 
              key={model.id}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  model.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' :
                  model.status === 'in-progress' ? 'bg-gold/20 text-gold' :
                  'bg-primary/10 text-primary'
                }`}>
                  {model.status === 'completed' ? 'Completat' :
                   model.status === 'in-progress' ? 'În progres' : 'Nou'}
                </span>
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">{model.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {model.year}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  model.difficulty === 'Ușor' ? 'bg-emerald-500/10 text-emerald-600' :
                  model.difficulty === 'Mediu' ? 'bg-gold/10 text-gold' :
                  'bg-rose-500/10 text-rose-600'
                }`}>
                  {model.difficulty}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="w-4 h-4" />
                  Vizualizează
                </Button>
                <Button variant="gold" size="sm" className="flex-1 gap-1">
                  {model.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Revizuiește
                    </>
                  ) : model.status === 'in-progress' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Continuă
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Începe
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ModeleBac;
