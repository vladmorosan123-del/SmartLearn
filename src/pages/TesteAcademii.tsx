import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Award, Upload, Search, Filter, 
  Calendar, Star, Clock, Users, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

const academyTests = [
  { 
    id: 1, 
    title: 'Test Admitere Academia Tehnică Militară', 
    academy: 'ATM București',
    year: 2024, 
    duration: '180 min',
    questions: 100,
    difficulty: 'Avansat',
    participants: 234
  },
  { 
    id: 2, 
    title: 'Simulare Academia Forțelor Terestre', 
    academy: 'AFT Sibiu',
    year: 2024, 
    duration: '150 min',
    questions: 80,
    difficulty: 'Mediu',
    participants: 189
  },
  { 
    id: 3, 
    title: 'Test Academia Navală', 
    academy: 'AN Constanța',
    year: 2023, 
    duration: '120 min',
    questions: 60,
    difficulty: 'Mediu',
    participants: 156
  },
  { 
    id: 4, 
    title: 'Pregătire Academia Forțelor Aeriene', 
    academy: 'AFA Brașov',
    year: 2024, 
    duration: '180 min',
    questions: 90,
    difficulty: 'Avansat',
    participants: 201
  },
];

const TesteAcademii = () => {
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
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Teste Academii Militare</h1>
            </div>
            <p className="text-primary-foreground/70">
              Pregătire pentru admiterea la academiile militare din România
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
              placeholder="Caută teste pentru academii..."
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
              Încarcă Test Nou
            </Button>
          )}
        </div>

        {/* Academy Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up delay-200">
          {['ATM București', 'AFT Sibiu', 'AN Constanța', 'AFA Brașov'].map((academy, i) => (
            <button 
              key={academy}
              className="bg-card rounded-xl p-4 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 text-left"
            >
              <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-navy-dark" />
              </div>
              <p className="font-medium text-foreground">{academy}</p>
              <p className="text-sm text-muted-foreground">{3 + i} teste</p>
            </button>
          ))}
        </div>

        {/* Tests List */}
        <div className="space-y-4 animate-fade-up delay-300">
          <h2 className="font-display text-2xl text-foreground mb-4">Toate Testele</h2>
          
          {academyTests.map((test) => (
            <div 
              key={test.id}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground mb-1">{test.title}</h3>
                    <p className="text-sm text-gold font-medium mb-2">{test.academy}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {test.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {test.participants} participanți
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        test.difficulty === 'Mediu' ? 'bg-gold/10 text-gold' :
                        'bg-rose-500/10 text-rose-600'
                      }`}>
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm text-muted-foreground">{test.questions} întrebări</p>
                  </div>
                  <Button variant="gold" className="gap-2">
                    Începe Testul
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-hero rounded-2xl p-8 text-center animate-fade-up delay-400">
          <h3 className="font-display text-2xl text-primary-foreground mb-4">
            Pregătește-te pentru Academiile Militare
          </h3>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto mb-6">
            Testele noastre sunt create după modelul examenelor de admitere oficiale, 
            oferindu-ți cea mai bună pregătire posibilă pentru o carieră militară de succes.
          </p>
          <Button variant="gold" size="lg">
            Vezi Toate Resursele
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TesteAcademii;
