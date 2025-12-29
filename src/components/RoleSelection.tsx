import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, UserRole } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
    navigate('/materii');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary mb-6">
            <span className="w-2 h-2 bg-gold rounded-full" />
            <span className="text-sm font-medium">Platformă Educațională</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            Selectează profilul tău
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Alege tipul de cont pentru a accesa resursele educaționale corespunzătoare
          </p>
        </header>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Card */}
          <div 
            className="group cursor-pointer animate-fade-up delay-200"
            onClick={() => handleRoleSelect('student')}
          >
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-500 military-border">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl text-foreground mb-3">Elev</h2>
                <p className="text-muted-foreground mb-6">
                  Accesează lecții, teste și materiale de pregătire pentru BAC și academiile militare
                </p>
                <ul className="text-left space-y-2 mb-8 w-full">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Vizualizare lecții și materiale
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Rezolvare teste și modele BAC
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Urmărire progres personal
                  </li>
                </ul>
                <Button variant="gold" className="w-full group-hover:animate-glow">
                  Continuă ca Elev
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Professor Card */}
          <div 
            className="group cursor-pointer animate-fade-up delay-300"
            onClick={() => handleRoleSelect('profesor')}
          >
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-500 military-border">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-10 h-10 text-navy-dark" />
                </div>
                <h2 className="font-display text-2xl text-foreground mb-3">Profesor</h2>
                <p className="text-muted-foreground mb-6">
                  Gestionează conținutul educațional, creează teste și monitorizează performanța
                </p>
                <ul className="text-left space-y-2 mb-8 w-full">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Creare și editare lecții
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Gestionare teste și evaluări
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    Încărcare modele BAC
                  </li>
                </ul>
                <Button variant="navy" className="w-full">
                  Continuă ca Profesor
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center animate-fade-up delay-500">
          <p className="text-sm text-muted-foreground">
            Liceul Militar „Ștefan cel Mare" • Platformă Educațională Oficială
          </p>
        </footer>
      </div>
    </div>
  );
};

export default RoleSelection;
