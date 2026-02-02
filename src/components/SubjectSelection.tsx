import { useNavigate } from 'react-router-dom';
import { Code, BookText, Calculator, Atom, ArrowLeft, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const subjects = [
  {
    id: 'informatica' as Subject,
    name: 'Informatică',
    icon: Code,
    description: 'Algoritmi, programare, structuri de date',
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: 'romana' as Subject,
    name: 'Limba Română',
    icon: BookText,
    description: 'Literatură, gramatică, comunicare',
    color: 'from-rose-500 to-rose-700',
  },
  {
    id: 'matematica' as Subject,
    name: 'Matematică',
    icon: Calculator,
    description: 'Algebră, geometrie, analiză',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'fizica' as Subject,
    name: 'Fizică',
    icon: Atom,
    description: 'Mecanică, termodinamică, optică',
    color: 'from-violet-500 to-violet-700',
  },
];

const SubjectSelection = () => {
  const { role, setSubject, setRole, clearSession } = useApp();
  const { signOut, isAuthenticated, profile, role: authRole } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubjectSelect = (subject: Subject) => {
    setSubject(subject);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    clearSession();
    toast({
      title: "Deconectat",
      description: "Ai fost deconectat cu succes.",
    });
    navigate('/');
  };

  const handleBack = () => {
    // If authenticated as student, do full logout
    if (isAuthenticated && role === 'student') {
      handleLogout();
    } else {
      // For professor or admin (authenticated), do full logout too
      handleLogout();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
        <div className="absolute top-40 left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Înapoi
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-gold" />
            <span className="font-display text-lg text-foreground">CNM Ștefan cel Mare</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && profile && (
              <span className="text-sm text-muted-foreground">
                {profile.full_name || profile.username}
              </span>
            )}
            <div className="px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm font-medium text-primary capitalize">{role}</span>
            </div>
            {isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
                Ieși
              </Button>
            )}
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-16 animate-fade-up">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            Alege materia
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Selectează disciplina pentru care dorești să accesezi materialele educaționale
          </p>
        </header>

        {/* Subject Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {subjects.map((subject, index) => (
            <div
              key={subject.id}
              className="group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
              onClick={() => handleSubjectSelect(subject.id)}
            >
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-500 h-full flex flex-col">
                <div className={`w-16 h-16 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <subject.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">{subject.name}</h3>
                <p className="text-muted-foreground text-sm flex-grow">{subject.description}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm font-medium text-gold group-hover:text-gold-light transition-colors">
                    Accesează →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Access Section */}
        <div className="mt-16 text-center animate-fade-up delay-500">
          <p className="text-sm text-muted-foreground mb-4">Acces rapid</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/modele-bac')}>
              Modele BAC
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/teste-academii')}>
              Teste Academii Militare
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSelection;
