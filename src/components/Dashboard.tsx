import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, BookOpen, FileText, ClipboardList, Settings, LogOut, 
  ChevronRight, Plus, Edit, Trash2, Clock, Users, Award,
  Code, BookText, Calculator, Atom, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';

const subjectIcons = {
  informatica: Code,
  romana: BookText,
  matematica: Calculator,
  fizica: Atom,
};

const subjectNames = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

const subjectColors = {
  informatica: 'from-blue-500 to-blue-700',
  romana: 'from-rose-500 to-rose-700',
  matematica: 'from-emerald-500 to-emerald-700',
  fizica: 'from-violet-500 to-violet-700',
};

// Lesson type definition
interface Lesson {
  id: number;
  title: string | null;
  duration: string | null;
  status: 'completed' | 'in-progress' | 'locked' | 'not-uploaded';
}

// Mock data per subject - 10 slots each
const lessonsPerSubject: Record<Subject, Lesson[]> = {
  informatica: [
    { id: 1, title: 'Introducere în algoritmi', duration: '45 min', status: 'completed' },
    { id: 2, title: 'Structuri de date fundamentale', duration: '60 min', status: 'in-progress' },
    { id: 3, title: null, duration: null, status: 'not-uploaded' },
    { id: 4, title: null, duration: null, status: 'not-uploaded' },
    { id: 5, title: null, duration: null, status: 'not-uploaded' },
    { id: 6, title: null, duration: null, status: 'not-uploaded' },
    { id: 7, title: null, duration: null, status: 'not-uploaded' },
    { id: 8, title: null, duration: null, status: 'not-uploaded' },
    { id: 9, title: null, duration: null, status: 'not-uploaded' },
    { id: 10, title: null, duration: null, status: 'not-uploaded' },
  ],
  romana: [
    { id: 1, title: 'Introducere în literatura română', duration: '50 min', status: 'completed' },
    { id: 2, title: null, duration: null, status: 'not-uploaded' },
    { id: 3, title: null, duration: null, status: 'not-uploaded' },
    { id: 4, title: null, duration: null, status: 'not-uploaded' },
    { id: 5, title: null, duration: null, status: 'not-uploaded' },
    { id: 6, title: null, duration: null, status: 'not-uploaded' },
    { id: 7, title: null, duration: null, status: 'not-uploaded' },
    { id: 8, title: null, duration: null, status: 'not-uploaded' },
    { id: 9, title: null, duration: null, status: 'not-uploaded' },
    { id: 10, title: null, duration: null, status: 'not-uploaded' },
  ],
  matematica: [
    { id: 1, title: null, duration: null, status: 'not-uploaded' },
    { id: 2, title: null, duration: null, status: 'not-uploaded' },
    { id: 3, title: null, duration: null, status: 'not-uploaded' },
    { id: 4, title: null, duration: null, status: 'not-uploaded' },
    { id: 5, title: null, duration: null, status: 'not-uploaded' },
    { id: 6, title: null, duration: null, status: 'not-uploaded' },
    { id: 7, title: null, duration: null, status: 'not-uploaded' },
    { id: 8, title: null, duration: null, status: 'not-uploaded' },
    { id: 9, title: null, duration: null, status: 'not-uploaded' },
    { id: 10, title: null, duration: null, status: 'not-uploaded' },
  ],
  fizica: [
    { id: 1, title: 'Mecanica - Introducere', duration: '55 min', status: 'completed' },
    { id: 2, title: 'Cinematica', duration: '60 min', status: 'in-progress' },
    { id: 3, title: 'Dinamica', duration: '65 min', status: 'locked' },
    { id: 4, title: null, duration: null, status: 'not-uploaded' },
    { id: 5, title: null, duration: null, status: 'not-uploaded' },
    { id: 6, title: null, duration: null, status: 'not-uploaded' },
    { id: 7, title: null, duration: null, status: 'not-uploaded' },
    { id: 8, title: null, duration: null, status: 'not-uploaded' },
    { id: 9, title: null, duration: null, status: 'not-uploaded' },
    { id: 10, title: null, duration: null, status: 'not-uploaded' },
  ],
};

const Dashboard = () => {
  const { role, subject, setSubject, setRole } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const isProfessor = role === 'profesor';
  const SubjectIcon = subject ? subjectIcons[subject] : BookOpen;
  const subjectName = subject ? subjectNames[subject] : 'Materie';
  const subjectColor = subject ? subjectColors[subject] : 'from-gray-500 to-gray-700';

  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    setShowSubjectDropdown(false);
  };

  const handleLogout = () => {
    setRole(null);
    setSubject(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-hero transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 p-2">
            <Shield className="w-10 h-10 text-gold" />
            <div>
              <span className="font-display text-lg text-primary-foreground block">LM Ștefan cel Mare</span>
              <span className="text-xs text-primary-foreground/60">Platformă Educațională</span>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="mb-6 relative">
            <button 
              onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${subjectColor} rounded-lg flex items-center justify-center`}>
                <SubjectIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm text-primary-foreground/60">Materie curentă</span>
                <p className="text-primary-foreground font-medium">{subjectName}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-primary-foreground/60 transition-transform ${showSubjectDropdown ? 'rotate-90' : ''}`} />
            </button>

            {showSubjectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-elegant border border-border overflow-hidden z-10">
                {Object.entries(subjectNames).map(([key, name]) => {
                  const Icon = subjectIcons[key as Subject];
                  return (
                    <button
                      key={key}
                      onClick={() => handleSubjectChange(key as Subject)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors ${subject === key ? 'bg-muted' : ''}`}
                    >
                      <Icon className="w-5 h-5 text-foreground" />
                      <span className="text-foreground">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent text-primary-foreground">
              <BookOpen className="w-5 h-5" />
              <span>Lecții</span>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors">
              <FileText className="w-5 h-5" />
              <span>Teste</span>
            </a>
            <a 
              onClick={() => navigate('/modele-bac')}
              className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <ClipboardList className="w-5 h-5" />
              <span>Modele BAC</span>
            </a>
            <a 
              onClick={() => navigate('/teste-academii')}
              className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <Award className="w-5 h-5" />
              <span>Teste Academii</span>
            </a>
            {isProfessor && (
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors">
                <Settings className="w-5 h-5" />
                <span>Administrare</span>
              </a>
            )}
          </nav>

          {/* User & Logout */}
          <div className="pt-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-2 mb-2">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <span className="text-navy-dark font-semibold">
                  {isProfessor ? 'P' : 'E'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-primary-foreground text-sm font-medium capitalize">{role}</p>
                <p className="text-primary-foreground/60 text-xs">Online</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Deconectare
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                {subjectName}
              </h1>
              <p className="text-muted-foreground">
                {isProfessor ? 'Gestionează conținutul educațional' : 'Explorează lecțiile și materialele'}
              </p>
            </div>
            {isProfessor && (
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Adaugă lecție nouă
              </Button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-fade-up delay-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Lecții disponibile</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-fade-up delay-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8h 30m</p>
                <p className="text-sm text-muted-foreground">Timp total studiu</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-fade-up delay-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">156</p>
                <p className="text-sm text-muted-foreground">Elevi înscriși</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <section className="animate-fade-up delay-400">
          <h2 className="font-display text-2xl text-foreground mb-6">Lecții</h2>
          <div className="space-y-4">
            {(subject ? lessonsPerSubject[subject] : []).map((lesson, index) => (
              <div 
                key={lesson.id}
                className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${lesson.status === 'locked' || lesson.status === 'not-uploaded' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      lesson.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                      lesson.status === 'in-progress' ? 'bg-gold/20 text-gold' :
                      lesson.status === 'not-uploaded' ? 'bg-muted text-muted-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div>
                      {lesson.status === 'not-uploaded' ? (
                        <h3 className="font-medium text-muted-foreground italic">Lecția nu a fost încărcată</h3>
                      ) : (
                        <>
                          <h3 className="font-medium text-foreground">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {lesson.duration}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isProfessor ? (
                      lesson.status === 'not-uploaded' ? (
                        <Button variant="gold" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Adaugă lecție
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )
                    ) : (
                      lesson.status !== 'not-uploaded' && (
                        <Button 
                          variant={lesson.status === 'locked' ? 'outline' : 'gold'} 
                          size="sm"
                          disabled={lesson.status === 'locked'}
                        >
                          {lesson.status === 'completed' ? 'Revizuiește' : 
                           lesson.status === 'in-progress' ? 'Continuă' : 'Blocat'}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
