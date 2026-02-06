import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Award, Search, Plus, Trash2, Eye, X,
  File, Image, FileSpreadsheet, Presentation, FileType as FileTypeIcon, 
  FileText, ClipboardCheck, Pencil, Timer, Calendar, Calculator, Code, Atom
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import { useHasSubmissions } from '@/hooks/useHasSubmission';
import TVCCompletUploadModal from '@/components/TVCCompletUploadModal';
import EditTVCCompletModal from '@/components/EditTVCCompletModal';
import FileViewer from '@/components/FileViewer';
import TVCTimerComplet from '@/components/TVCTimerComplet';

const subjectNames: Record<string, string> = {
  informatica: 'Informatică',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="w-3 h-3" />;
  const type = fileType.toLowerCase();
  if (type === 'jpg' || type === 'jpeg' || type === 'png') return <Image className="w-3 h-3" />;
  if (type === 'pdf') return <FileText className="w-3 h-3" />;
  if (type === 'xls' || type === 'xlsx' || type === 'csv') return <FileSpreadsheet className="w-3 h-3" />;
  if (type === 'doc' || type === 'docx') return <FileTypeIcon className="w-3 h-3" />;
  if (type === 'ppt' || type === 'pptx') return <Presentation className="w-3 h-3" />;
  return <File className="w-3 h-3" />;
};

const getFileTypeLabel = (type?: string) => {
  if (!type) return 'Fișier';
  const labels: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    ppt: 'PowerPoint', pptx: 'PowerPoint', txt: 'Text', csv: 'CSV',
    jpg: 'Imagine', jpeg: 'Imagine', png: 'Imagine',
  };
  return labels[type.toLowerCase()] || type.toUpperCase();
};

const subjectIcons: Record<string, typeof Calculator> = { matematica: Calculator, informatica: Code, fizica: Atom };

const TVCComplet = () => {
  const { role } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [viewingAllFiles, setViewingAllFiles] = useState<Material | null>(null);
  const [timerMaterial, setTimerMaterial] = useState<Material | null>(null);

  const isProfessor = authRole === 'profesor' || authRole === 'admin' || role === 'profesor' || role === 'admin';

  // Fetch all materials for tvc_complet category (all subjects in one query)
  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    category: 'tvc_complet',
  });

  // Get material IDs for submission check
  const materialIds = useMemo(() => materials.map(m => m.id), [materials]);
  
  // Check which materials the student has submitted
  const { submissions: studentSubmissions } = useHasSubmissions(materialIds);

  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    return materials.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectNames[m.subject]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  const handleSaveMaterial = async (data: {
    title: string;
    description: string;
    year?: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    answerKey?: string[];
    oficiu?: number;
    timerMinutes?: number;
    subject?: string;
    publishAt?: string;
    subjectConfig?: Record<string, { questionCount: number; answerKey: string[]; oficiu: number; files?: Array<{ url: string; name: string; type: string; size: number }> }>;
  }) => {
    try {
      await addMaterial({
        title: data.title,
        description: data.description,
        file_name: data.fileName,
        file_type: data.fileType,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        subject: data.subject || 'matematica',
        category: 'tvc_complet',
        lesson_number: null,
        author: null,
        genre: null,
        year: data.year || null,
        answer_key: data.answerKey || null,
        oficiu: data.oficiu ?? 0,
        timer_minutes: data.timerMinutes ?? 180,
        publish_at: data.publishAt || null,
        subject_config: data.subjectConfig || null,
      });
      toast({ title: 'Material salvat', description: 'Testul TVC Complet a fost salvat cu succes.' });
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    await deleteMaterial(material.id, material.file_url);
  };

  const handleEditMaterial = async (data: {
    title: string;
    description: string;
    year?: number;
    answerKey?: string[];
    timerMinutes?: number;
    publishAt?: string | null;
    subjectConfig?: Record<string, any>;
  }) => {
    if (!editingMaterial) return;
    
    try {
      const updates: any = {
        title: data.title,
        description: data.description,
        year: data.year || null,
        timer_minutes: data.timerMinutes ?? 180,
        publish_at: data.publishAt,
      };

      if (data.subjectConfig) {
        updates.subject_config = data.subjectConfig;
        // Update main file_url from first available file
        const firstSubject = ['matematica', 'informatica', 'fizica'].find(
          s => data.subjectConfig![s]?.files?.length > 0
        );
        if (firstSubject) {
          const mainFile = data.subjectConfig[firstSubject].files[0];
          updates.file_url = mainFile.url;
          updates.file_name = mainFile.name;
          updates.file_type = mainFile.type;
          updates.file_size = mainFile.size;
        }
      } else {
        updates.answer_key = data.answerKey || null;
      }

      await updateMaterial(editingMaterial.id, updates);
      toast({ title: 'Material actualizat', description: 'Modificările au fost salvate cu succes.' });
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

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
              <span className="font-display text-lg hidden md:block">CNM Ștefan cel Mare</span>
            </div>
          </div>
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">TVC Complet</h1>
            </div>
            <p className="text-primary-foreground/70">
              Teste complete pentru Matematică, Informatică și Fizică cu timer personalizabil
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Caută teste TVC Complet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          {isProfessor && (
            <Button variant="gold" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Adaugă Test
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up delay-100">
          <h3 className="font-display text-lg text-foreground mb-2">Despre TVC Complet</h3>
          <p className="text-muted-foreground">
            Secțiunea TVC Complet conține teste pentru Matematică, Informatică și Fizică. 
            Fiecare test are un timer personalizat de către profesor. La expirarea timpului, testul se trimite automat 
            cu răspunsurile completate până în acel moment.
          </p>
        </div>

        {/* Materials List */}
        <div className="space-y-4 animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-foreground">
              Teste TVC Complet
            </h2>
            <p className="text-sm text-muted-foreground">
              {materials.length} teste încărcate
            </p>
          </div>
          
          {isLoading ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <p className="text-muted-foreground">Se încarcă...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Niciun test găsit</h3>
                  <p className="text-muted-foreground text-sm">Încearcă alte cuvinte cheie</p>
                </>
              ) : (
                <>
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Niciun test încărcat</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {isProfessor ? 'Adaugă primul test TVC Complet.' : 'Profesorul va încărca testele în curând.'}
                  </p>
                  {isProfessor && (
                    <Button variant="gold" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Adaugă Test
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            filteredMaterials.map((material, index) => {
              const hasSubjectConfig = material.subject_config && Object.keys(material.subject_config).length > 0;
              
              return (
                <div 
                  key={material.id}
                  className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold/20 text-gold">
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{material.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {hasSubjectConfig ? (
                            <>
                              {Object.keys(material.subject_config!).map((subj) => {
                                const Icon = subjectIcons[subj] || Award;
                                const cfg = material.subject_config![subj];
                                const fileCount = cfg.files?.length || (cfg.fileUrl ? 1 : 0);
                                return (
                                  <span key={subj} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                                    <Icon className="w-3 h-3" />
                                    {subjectNames[subj] || subj}
                                    {fileCount > 0 && <span className="opacity-70">({fileCount})</span>}
                                  </span>
                                );
                              })}
                            </>
                          ) : (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {subjectNames[material.subject] || material.subject}
                            </span>
                          )}
                          {material.year && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {material.year}
                            </span>
                          )}
                          <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-0.5 rounded flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {material.timer_minutes || 180} min
                          </span>
                          {(material.has_answer_key || (material.answer_key && Array.isArray(material.answer_key) && material.answer_key.length > 0)) && !hasSubjectConfig && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                              <ClipboardCheck className="w-3 h-3" />
                              Grilă ({material.answer_key?.length || '?'} întreb.)
                            </span>
                          )}
                          {hasSubjectConfig && (
                            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded flex items-center gap-1">
                              <ClipboardCheck className="w-3 h-3" />
                              Multi-disciplinar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isProfessor ? (
                        <>
                          <Button 
                            variant="outline" size="sm" className="gap-1"
                            onClick={() => {
                              if (hasSubjectConfig) {
                                setViewingAllFiles(material);
                              } else {
                                setViewingFile({ url: material.file_url, name: material.file_name, type: material.file_type });
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            Vezi
                          </Button>
                          <Button 
                            variant="outline" size="sm" className="gap-1"
                            onClick={() => setEditingMaterial(material)}
                          >
                            <Pencil className="w-4 h-4" />
                            Editează
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="text-destructive"
                            onClick={() => handleDeleteMaterial(material)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => {
                              if (hasSubjectConfig) {
                                setViewingAllFiles(material);
                              } else {
                                setViewingFile({ url: material.file_url, name: material.file_name, type: material.file_type });
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            Vezi PDF
                          </Button>
                          <Button 
                            variant="gold" size="sm" className="gap-1"
                            onClick={() => setTimerMaterial(material)}
                          >
                            <Timer className="w-4 h-4" />
                            Începe Testul
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Upload Modal with multiple file support */}
      <TVCCompletUploadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveMaterial}
      />

      {/* Edit Modal with custom timer support and additional test upload */}
      <EditTVCCompletModal
        isOpen={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        onSave={handleEditMaterial}
        material={editingMaterial}
      />

      {/* File Viewer - single file */}
      {viewingFile && (
        <FileViewer
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          fileUrl={viewingFile.url}
          fileName={viewingFile.name}
          fileType={viewingFile.type}
        />
      )}

      {/* Multi-file viewer for subject_config materials */}
      {viewingAllFiles && viewingAllFiles.subject_config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingAllFiles(null)} />
          <div className="relative bg-card rounded-2xl shadow-elegant border border-border w-full max-w-lg mx-4 animate-scale-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="font-display text-xl text-foreground">{viewingAllFiles.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">Toate documentele disponibile</p>
              </div>
              <button onClick={() => setViewingAllFiles(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(viewingAllFiles.subject_config!).map(([subj, cfg]) => {
                const Icon = subjectIcons[subj] || Award;
                const files = cfg.files && cfg.files.length > 0
                  ? cfg.files
                  : (cfg as any).fileUrl
                    ? [{ url: (cfg as any).fileUrl, name: (cfg as any).fileName || subj, type: (cfg as any).fileType || 'pdf', size: (cfg as any).fileSize || 0 }]
                    : [];
                if (files.length === 0) return null;
                return (
                  <div key={subj} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gold" />
                      <h3 className="font-medium text-foreground">{subjectNames[subj] || subj}</h3>
                    </div>
                    {files.map((file: any, idx: number) => (
                      <button
                        key={idx}
                        className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-gold/50 hover:bg-muted transition-all text-left"
                        onClick={() => {
                          setViewingAllFiles(null);
                          setViewingFile({ url: file.url, name: file.name, type: file.type });
                        }}
                      >
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getFileTypeLabel(file.type)}
                            {file.size > 0 && ` • ${file.size >= 1024 * 1024 
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                              : `${(file.size / 1024).toFixed(1)} KB`}`}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Timer Modal with auto-submit */}
      {timerMaterial && (
        <TVCTimerComplet 
          subjectTitle={timerMaterial.title}
          pdfUrl={timerMaterial.file_url}
          fileType={timerMaterial.file_type}
          fileName={timerMaterial.file_name}
          hasAnswerKey={timerMaterial.has_answer_key || (timerMaterial.answer_key && timerMaterial.answer_key.length > 0)}
          questionCount={timerMaterial.answer_key?.length || 0}
          materialId={timerMaterial.id}
          timerMinutes={timerMaterial.timer_minutes || 180}
          subjectConfig={timerMaterial.subject_config}
          onClose={() => setTimerMaterial(null)} 
        />
      )}
    </div>
  );
};

export default TVCComplet;
