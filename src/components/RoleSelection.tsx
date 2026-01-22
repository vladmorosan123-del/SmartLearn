import { useState } from 'react';
import { GraduationCap, BookOpen, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp, UserRole } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'profesor') {
      setShowPasswordDialog(true);
      setPassword('');
      setPasswordError(false);
    } else {
      setRole(role);
      navigate('/materii');
    }
  };

  const handlePasswordSubmit = () => {
    if (password === '12345') {
      setShowPasswordDialog(false);
      setRole('profesor');
      navigate('/materii');
    } else {
      setPasswordError(true);
      toast({
        title: "Parolă incorectă",
        description: "Parola introdusă nu este validă.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Password Dialog for Professor */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold" />
              Acces Profesor
            </DialogTitle>
            <DialogDescription>
              Introduceți parola pentru a accesa contul de profesor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Introduceți parola..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className={passwordError ? 'border-destructive' : ''}
            />
            {passwordError && (
              <p className="text-sm text-destructive">Parolă incorectă</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Anulează
              </Button>
              <Button variant="gold" onClick={handlePasswordSubmit}>
                Confirmă
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
    </>
  );
};

export default RoleSelection;
