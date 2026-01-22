import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, BookOpen, ClipboardList, Settings, LogOut, 
  ChevronRight, Plus, Users, Award,
  Code, BookText, Calculator, Atom, Menu, X, BookMarked, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import AddLessonModal from '@/components/AddLessonModal';
import Subject2Section from '@/components/Subject2Section';
import AddTemplateModal from '@/components/AddTemplateModal';
import PDFViewer from '@/components/PDFViewer';
import FormulaPortfolio from '@/components/FormulaPortfolio';
import LessonCard, { Lesson } from '@/components/LessonCard';
import StatsCard from '@/components/StatsCard';
import SearchInput from '@/components/SearchInput';
import EmptyState from '@/components/EmptyState';

const subjectIcons = {
  informatica: Code,
  romana: BookText,
  matematica: Calculator,
  fizica: Atom,
};

const subjectNames: Record<Subject, string> = {
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

// Subject 2 Template type
interface Subject2Template {
  id: number;
  title: string | null;
  description?: string;
  status: 'uploaded' | 'not-uploaded';
}

// Initial empty lessons template - 10 slots each
const createEmptyLessons = (): Lesson[] => 
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: null,
    duration: null,
    status: 'not-uploaded' as const,
  }));

// Initial mock data per subject
const initialLessonsData: Record<Subject, Lesson[]> = {
  informatica: [
    { id: 1, title: 'Introducere în algoritmi', duration: '45 min', status: 'completed' },
    { id: 2, title: 'Structuri de date fundamentale', duration: '60 min', status: 'in-progress' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      duration: null,
      status: 'not-uploaded' as const,
    })),
  ],
  romana: [
    { id: 1, title: 'Introducere în literatura română', duration: '50 min', status: 'completed' },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 2,
      title: null,
      duration: null,
      status: 'not-uploaded' as const,
    })),
  ],
  matematica: createEmptyLessons(),
  fizica: [
    { id: 1, title: 'Mecanica - Introducere', duration: '55 min', status: 'completed' },
    { id: 2, title: 'Cinematica', duration: '60 min', status: 'in-progress' },
    { id: 3, title: 'Dinamica', duration: '65 min', status: 'locked' },
    ...Array.from({ length: 7 }, (_, i) => ({
      id: i + 4,
      title: null,
      duration: null,
      status: 'not-uploaded' as const,
    })),
  ],
};

const Dashboard = () => {
  const { role, subject, setSubject, clearSession } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [lessonsData, setLessonsData] = useState<Record<Subject, Lesson[]>>(initialLessonsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Subject 2 state (for Romanian only)
  const [subject2Templates, setSubject2Templates] = useState<Subject2Template[]>([
    { id: 1, title: 'Șablon Comentariu Literar - Poezie', description: 'Structura comentariului pentru poezie', status: 'uploaded' },
    { id: 2, title: 'Șablon Eseu Argumentativ', description: 'Model pentru eseul argumentativ', status: 'uploaded' },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 3,
      title: null,
      status: 'not-uploaded' as const,
    })),
  ]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [viewingPDF, setViewingPDF] = useState<string | null>(null);
  
  const isProfessor = role === 'profesor';
  const SubjectIcon = subject ? subjectIcons[subject] : BookOpen;
  const subjectName = subject ? subjectNames[subject] : 'Materie';
  const subjectColor = subject ? subjectColors[subject] : 'from-gray-500 to-gray-700';
  
  const currentLessons = subject ? lessonsData[subject] : [];

  // Filtered lessons based on search
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return currentLessons;
    return currentLessons.filter(lesson => 
      lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentLessons, searchQuery]);

  // Stats calculations
  const uploadedLessons = currentLessons.filter(l => l.status !== 'not-uploaded').length;
  const completedLessons = currentLessons.filter(l => l.status === 'completed').length;
  const totalDuration = currentLessons
    .filter(l => l.duration)
    .reduce((acc, l) => {
      const minutes = parseInt(l.duration?.replace(/\D/g, '') || '0');
      return acc + minutes;
    }, 0);

  // Subject 2 handlers
  const handleAddTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (data: { title: string; description: string }) => {
    if (selectedTemplateId === null) return;
    
    setSubject2Templates(prev => prev.map(template => 
      template.id === selectedTemplateId 
        ? { ...template, title: data.title, description: data.description, status: 'uploaded' as const }
        : template
    ));
    setSelectedTemplateId(null);
    toast({ title: 'Șablon salvat', description: 'Șablonul a fost salvat cu succes.' });
  };

  const handleDeleteTemplate = (templateId: number) => {
    setSubject2Templates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, title: null, description: undefined, status: 'not-uploaded' as const }
        : template
    ));
    toast({ title: 'Șablon șters', description: 'Șablonul a fost șters.' });
  };

  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    setShowSubjectDropdown(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
    toast({ title: 'Deconectat', description: 'Te-ai deconectat cu succes.' });
  };

  const handleAddLesson = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setIsModalOpen(true);
  };

  const handleAddNewLesson = () => {
    if (!subject) return;
    
    const currentSubjectLessons = lessonsData[subject];
    const newLessonId = currentSubjectLessons.length + 1;
    
    setLessonsData(prev => ({
      ...prev,
      [subject]: [
        ...prev[subject],
        {
          id: newLessonId,
          title: null,
          duration: null,
          status: 'not-uploaded' as const,
        }
      ],
    }));
    
    setSelectedLessonId(newLessonId);
    setIsModalOpen(true);
  };

  const handleSaveLesson = (lessonData: { title: string; duration: string; description: string; pdfUrl?: string }) => {
    if (!subject || selectedLessonId === null) return;
    
    setLessonsData(prev => ({
      ...prev,
      [subject]: prev[subject].map(lesson => 
        lesson.id === selectedLessonId 
          ? { ...lesson, title: lessonData.title, duration: lessonData.duration, description: lessonData.description, pdfUrl: lessonData.pdfUrl, status: 'locked' as const }
          : lesson
      ),
    }));
    setSelectedLessonId(null);
    toast({ title: 'Lecție salvată', description: 'Lecția a fost salvată cu succes.' });
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (!subject) return;
    
    setLessonsData(prev => ({
      ...prev,
      [subject]: prev[subject].map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, title: null, duration: null, description: undefined, pdfUrl: undefined, status: 'not-uploaded' as const }
          : lesson
      ),
    }));
    toast({ title: 'Lecție ștearsă', description: 'Lecția a fost ștearsă.' });
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
            <a href="#lectii" className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent text-primary-foreground">
              <BookOpen className="w-5 h-5" />
              <span>Lecții</span>
            </a>
            <a 
              onClick={() => navigate('/modele-bac')}
              className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <ClipboardList className="w-5 h-5" />
              <span>Modele BAC</span>
            </a>
            {subject !== 'romana' && (
              <a 
                onClick={() => navigate('/teste-academii')}
                className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <Award className="w-5 h-5" />
                <span>TVC Academii</span>
              </a>
            )}
            {(subject === 'matematica' || subject === 'fizica') && (
              <a 
                href="#portofoliu-formule"
                className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <BookMarked className="w-5 h-5" />
                <span>Portofoliu Formule</span>
              </a>
            )}
            {isProfessor && (
              <a 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
              >
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
              <Button variant="gold" className="gap-2" onClick={handleAddNewLesson}>
                <Plus className="w-4 h-4" />
                Adaugă lecție nouă
              </Button>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={BookOpen}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            value={uploadedLessons}
            label="Lecții disponibile"
            delay="delay-100"
          />
          <StatsCard
            icon={Search}
            iconColor="text-gold"
            iconBg="bg-gold/10"
            value={`${totalDuration} min`}
            label="Timp total studiu"
            delay="delay-200"
          />
          <StatsCard
            icon={Users}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            value={completedLessons}
            label="Lecții completate"
            delay="delay-300"
          />
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-up delay-400">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Caută lecții după titlu..."
          />
        </div>

        {/* Lessons List */}
        <section id="lectii" className="animate-fade-up delay-400">
          <h2 className="font-display text-2xl text-foreground mb-6">Lecții</h2>
          
          {filteredLessons.length === 0 ? (
            searchQuery ? (
              <EmptyState
                icon={Search}
                title="Niciun rezultat"
                description={`Nu am găsit lecții care să conțină "${searchQuery}"`}
                actionLabel="Șterge căutarea"
                onAction={() => setSearchQuery('')}
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Nicio lecție încă"
                description="Nu există lecții încărcate pentru această materie."
                actionLabel={isProfessor ? "Adaugă prima lecție" : undefined}
                onAction={isProfessor ? handleAddNewLesson : undefined}
              />
            )
          ) : (
            <div className="space-y-4">
              {filteredLessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={currentLessons.findIndex(l => l.id === lesson.id)}
                  isProfessor={isProfessor}
                  onAdd={handleAddLesson}
                  onEdit={handleAddLesson}
                  onDelete={handleDeleteLesson}
                  onViewPDF={(title) => setViewingPDF(title)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Subject 2 Section - Only for Romanian */}
        {subject === 'romana' && (
          <Subject2Section
            templates={subject2Templates}
            isProfessor={isProfessor}
            onAdd={handleAddTemplate}
            onDelete={handleDeleteTemplate}
            onView={(title) => setViewingPDF(title)}
          />
        )}

        {/* Formula Portfolio - Only for Math and Physics */}
        {(subject === 'matematica' || subject === 'fizica') && (
          <div id="portofoliu-formule">
            <FormulaPortfolio subject={subject} isProfessor={isProfessor} />
          </div>
        )}

        {/* Add Lesson Modal */}
        <AddLessonModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLessonId(null);
          }}
          onSave={handleSaveLesson}
          lessonNumber={selectedLessonId || 1}
        />

        {/* Add Template Modal */}
        <AddTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setSelectedTemplateId(null);
          }}
          onSave={handleSaveTemplate}
          slotNumber={selectedTemplateId || 1}
        />

        {/* PDF Viewer */}
        {viewingPDF && (
          <PDFViewer
            title={viewingPDF}
            onClose={() => setViewingPDF(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
