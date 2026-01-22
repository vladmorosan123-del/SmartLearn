import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import FormulaPortfolio from '@/components/FormulaPortfolio';

const PortofoliuFormule = () => {
  const { role, subject } = useApp();
  const navigate = useNavigate();
  const isProfessor = role === 'profesor';

  // Only allow math and physics
  if (subject !== 'matematica' && subject !== 'fizica') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <BookMarked className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Portofoliu indisponibil</h1>
          <p className="text-muted-foreground mb-6">Portofoliul de formule este disponibil doar pentru Matematică și Fizică.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const subjectName = subject === 'matematica' ? 'Matematică' : 'Fizică';

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
              <BookMarked className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Portofoliu Formule - {subjectName}</h1>
            </div>
            <p className="text-primary-foreground/70">
              Colecție de formule esențiale pentru pregătirea BAC și TVC
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <FormulaPortfolio subject={subject} isProfessor={isProfessor} />
      </main>
    </div>
  );
};

export default PortofoliuFormule;
