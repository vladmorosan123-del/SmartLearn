import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, BookOpen, ClipboardList, Settings, LogOut, 
  ChevronRight, Plus, Users, Award,
  Code, BookText, Calculator, Atom, Menu, X, BookMarked, Search, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddLessonModal, { LessonEditData } from '@/components/AddLessonModal';
import LessonCard, { Lesson } from '@/components/LessonCard';
import StatsCard from '@/components/StatsCard';
import SearchInput from '@/components/SearchInput';
import EmptyState from '@/components/EmptyState';
import FileViewer from '@/components/FileViewer';
import { useMaterials, Material } from '@/hooks/useMaterials';

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

const Dashboard = () => {
  const { role, subject, setSubject, clearSession } = useApp();
  const { role: authRole, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLessonNumber, setSelectedLessonNumber] = useState<number>(1);
  const [editingLesson, setEditingLesson] = useState<LessonEditData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  
  const isProfessor = role === 'profesor' || authRole === 'admin';
  const SubjectIcon = subject ? subjectIcons[subject] : BookOpen;
  const subjectName = subject ? subjectNames[subject] : 'Materie';
  const subjectColor = subject ? subjectColors[subject] : 'from-gray-500 to-gray-700';
  
  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject: subject || 'informatica',
    category: 'lesson',
  });

  // Convert materials to lessons for display
  const currentLessons: Lesson[] = useMemo(() => {
    const lessons: Lesson[] = materials.map((m, index) => ({
      id: index + 1,
      title: m.title,
      duration: m.description?.match(/\d+ min/)?.[0] || '45 min',
      description: m.description || undefined,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileType: m.file_type,
      fileSize: m.file_size || undefined,
      status: 'locked' as const,
      materialId: m.id,
    }));
    
    // Add empty slots up to 10 if less than 10 materials
    const emptySlots = Math.max(0, 10 - lessons.length);
    for (let i = 0; i < emptySlots; i++) {
      lessons.push({
        id: lessons.length + 1,
        title: null,
        duration: null,
        status: 'not-uploaded' as const,
      });
    }
    
    return lessons;
  }, [materials]);

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
  const totalDuration = currentLessons
    .filter(l => l.duration)
    .reduce((acc, l) => {
      const minutes = parseInt(l.duration?.replace(/\D/g, '') || '0');
      return acc + minutes;
    }, 0);

  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    setShowSubjectDropdown(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    await signOut(); // End Supabase session completely
    clearSession();
    navigate('/');
    toast({ title: 'Deconectat', description: 'Te-ai deconectat cu succes.' });
  };

  const handleAddLesson = (lessonNumber: number) => {
    setSelectedLessonNumber(lessonNumber);
    setEditingLesson(null);
    setIsModalOpen(true);
  };

  const handleEditLesson = (lessonId: number) => {
    const lesson = currentLessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.materialId) return;
    
    const material = materials.find(m => m.id === lesson.materialId);
    if (!material) return;
    
    // Parse duration from description (format: "45 min - description")
    const durationMatch = material.description?.match(/^(\d+\s*min)/);
    const duration = durationMatch ? durationMatch[1] : '45 min';
    const description = material.description?.replace(/^\d+\s*min\s*-\s*/, '') || '';
    
    setSelectedLessonNumber(lessonId);
    setEditingLesson({
      materialId: material.id,
      title: material.title,
      duration,
      description,
      fileUrl: material.file_url,
      fileName: material.file_name,
      fileType: material.file_type,
      fileSize: material.file_size || 0,
    });
    setIsModalOpen(true);
  };

  const handleAddNewLesson = () => {
    setSelectedLessonNumber(currentLessons.length + 1);
    setEditingLesson(null);
    setIsModalOpen(true);
  };

  const handleSaveLesson = async (lessonData: { 
    title: string; 
    duration: string; 
    description: string; 
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) => {
    if (!subject) {
      toast({ 
        title: 'Eroare', 
        description: 'Selectează o materie.', 
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      // If editing an existing lesson
      if (editingLesson) {
        const updates: any = {
          title: lessonData.title,
          description: `${lessonData.duration} - ${lessonData.description}`,
        };
        
        // Only update file info if a new file was uploaded
        if (lessonData.fileUrl && lessonData.fileUrl !== editingLesson.fileUrl) {
          updates.file_name = lessonData.fileName;
          updates.file_type = lessonData.fileType;
          updates.file_url = lessonData.fileUrl;
          updates.file_size = lessonData.fileSize;
        }
        
        await updateMaterial(editingLesson.materialId, updates);
        toast({ title: 'Lecție actualizată', description: 'Modificările au fost salvate cu succes.' });
      } else {
        // Adding new lesson - file is required
        if (!lessonData.fileUrl) {
          toast({ 
            title: 'Eroare', 
            description: 'Te rugăm să încarci un fișier.', 
            variant: 'destructive' 
          });
          return;
        }
        
        await addMaterial({
          title: lessonData.title,
          description: `${lessonData.duration} - ${lessonData.description}`,
          file_name: lessonData.fileName || 'unknown',
          file_type: lessonData.fileType || 'unknown',
          file_url: lessonData.fileUrl,
          file_size: lessonData.fileSize || 0,
          subject: subject,
          category: 'lesson',
          lesson_number: selectedLessonNumber,
          author: null,
          genre: null,
          year: null,
        });
        
        toast({ title: 'Lecție salvată', description: 'Lecția a fost salvată cu succes.' });
      }
      
      setEditingLesson(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    const lesson = currentLessons.find(l => l.id === lessonId);
    if (!lesson || !(lesson as any).materialId) return;
    
    const material = materials.find(m => m.id === (lesson as any).materialId);
    if (material) {
      await deleteMaterial(material.id, material.file_url);
    }
  };

  const handleViewFile = (lesson: Lesson) => {
    if (lesson.fileUrl && lesson.fileName && lesson.fileType) {
      setViewingFile({
        url: lesson.fileUrl,
        name: lesson.fileName,
        type: lesson.fileType,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-hero transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 p-2">
            <Shield className="w-10 h-10 text-gold" />
            <div>
              <span className="font-display text-lg text-primary-foreground block">CNM Ștefan cel Mare</span>
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
                onClick={() => navigate('/portofoliu-formule')}
                className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <BookMarked className="w-5 h-5" />
                <span>Portofoliu Formule</span>
              </a>
            )}
            {subject !== 'romana' && (
              <a 
                onClick={() => navigate('/tvc-complet')}
                className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <Timer className="w-5 h-5" />
                <span>TVC Complet</span>
              </a>
            )}
            {subject === 'romana' && (
              <>
                <a 
                  onClick={() => navigate('/subiect2-bac')}
                  className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Subiectul II BAC</span>
                </a>
                <a 
                  onClick={() => navigate('/eseuri-bac')}
                  className="flex items-center gap-3 p-3 rounded-lg text-primary-foreground/70 hover:bg-sidebar-accent hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <BookMarked className="w-5 h-5" />
                  <span>Eseuri BAC</span>
                </a>
              </>
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
      <main className="flex-1 lg:ml-64 p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8">
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
            value={materials.length}
            label="Fișiere încărcate"
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
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Se încarcă...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
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
                  onEdit={handleEditLesson}
                  onDelete={handleDeleteLesson}
                  onViewFile={handleViewFile}
                />
              ))}
            </div>
          )}
        </section>

        {/* Add Lesson Modal */}
        <AddLessonModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          onSave={handleSaveLesson}
          lessonNumber={selectedLessonNumber}
          subject={subject || 'informatica'}
          editData={editingLesson}
        />

        {/* File Viewer */}
        {viewingFile && (
          <FileViewer
            isOpen={!!viewingFile}
            onClose={() => setViewingFile(null)}
            fileUrl={viewingFile.url}
            fileName={viewingFile.name}
            fileType={viewingFile.type}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
