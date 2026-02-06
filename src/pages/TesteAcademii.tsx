import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Award, Search, Filter, 
  Calendar, Plus, Trash2, Eye, Download, File, Image, FileSpreadsheet, Presentation, FileType as FileTypeIcon, FileText, ClipboardCheck, Pencil, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import { useHasSubmissions } from '@/hooks/useHasSubmission';
import UploadMaterialModal from '@/components/UploadMaterialModal';
import EditMaterialModal from '@/components/EditMaterialModal';
import FileViewer from '@/components/FileViewer';
import MultiFileViewer, { extractSubjectFiles } from '@/components/MultiFileViewer';
import TVCTimer from '@/components/TVCTimer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const tvcSubjects: Subject[] = ['informatica', 'matematica', 'fizica'];

const subjectNames: Record<Subject, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
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

const TesteAcademii = () => {
  const { role, subject } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(
    subject && tvcSubjects.includes(subject) ? subject : 'informatica'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [viewingMultiFiles, setViewingMultiFiles] = useState<{ title: string; subjectFiles: Record<string, any[]> } | null>(null);
  const [timerMaterial, setTimerMaterial] = useState<Material | null>(null);

  const isProfessor = role === 'profesor' || authRole === 'admin';

  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject: selectedSubject,
    category: 'tvc',
  });

  // Get material IDs for submission check
  const materialIds = useMemo(() => 
    materials.filter(m => !(m as any)._isEmpty).map(m => m.id), 
    [materials]
  );
  
  // Check which materials the student has submitted
  const { submissions: studentSubmissions } = useHasSubmissions(materialIds);

  // Filter models based on search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    return materials.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  // Add empty slots
  const displayMaterials = useMemo(() => {
    const mats = [...filteredMaterials];
    if (!searchQuery && isProfessor) {
      const emptySlots = Math.max(0, 10 - materials.length);
      for (let i = 0; i < emptySlots; i++) {
        mats.push({
          id: `empty-${i}`,
          title: '',
          description: null,
          file_name: '',
          file_type: '',
          file_url: '',
          file_size: null,
          subject: selectedSubject,
          category: 'tvc',
          lesson_number: null,
          author: null,
          genre: null,
          year: null,
          created_at: '',
          updated_at: '',
          _isEmpty: true,
        } as Material & { _isEmpty?: boolean });
      }
    }
    return mats;
  }, [filteredMaterials, searchQuery, isProfessor, materials.length, selectedSubject]);

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
    publishAt?: string;
  }) => {
    try {
      await addMaterial({
        title: data.title,
        description: data.description,
        file_name: data.fileName,
        file_type: data.fileType,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        subject: selectedSubject,
        category: 'tvc',
        lesson_number: null,
        author: null,
        genre: null,
        year: data.year || null,
        answer_key: data.answerKey || null,
        oficiu: data.oficiu ?? 0,
        timer_minutes: data.timerMinutes ?? 180,
        publish_at: data.publishAt || null,
      });
      toast({ title: 'Material salvat', description: 'Materialul TVC a fost salvat cu succes.' });
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
  }) => {
    if (!editingMaterial) return;
    
    try {
      await updateMaterial(editingMaterial.id, {
        title: data.title,
        description: data.description,
        year: data.year || null,
        answer_key: data.answerKey || null,
        timer_minutes: data.timerMinutes ?? 180,
        publish_at: data.publishAt,
      });
      toast({ title: 'Material actualizat', description: 'Modificările au fost salvate cu succes.' });
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  // Check if current subject has TVC
  if (subject === 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">TVC nu este disponibil pentru Limba Română</h1>
          <p className="text-muted-foreground mb-6">Testele de Verificare a Cunoștințelor sunt disponibile doar pentru Informatică, Matematică și Fizică.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="font-display text-3xl md:text-4xl">TVC - Teste de Verificare a Cunoștințelor</h1>
            </div>
            <p className="text-primary-foreground/70">
              Pregătire pentru admiterea la academiile militare din România
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subject Selector */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up delay-100">
          {tvcSubjects.map((subj) => (
            <Button
              key={subj}
              variant={selectedSubject === subj ? 'gold' : 'outline'}
              onClick={() => setSelectedSubject(subj)}
            >
              {subjectNames[subj]}
            </Button>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-up delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Caută subiecte și materiale TVC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          {isProfessor && (
            <Button variant="gold" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Adaugă Material
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up delay-300">
          <h3 className="font-display text-lg text-foreground mb-2">Ce este TVC?</h3>
          <p className="text-muted-foreground">
            Testul de Verificare a Cunoștințelor (TVC) este examenul unitar de admitere pentru toate academiile militare din România. 
            Aici găsești subiecte, materiale de pregătire și fișiere pentru {subjectNames[selectedSubject]}.
          </p>
        </div>

        {/* Materials List */}
        <div className="space-y-4 animate-fade-up delay-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-foreground">
              Materiale TVC - {subjectNames[selectedSubject]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {materials.length} materiale încărcate
            </p>
          </div>
          
          {isLoading ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <p className="text-muted-foreground">Se încarcă...</p>
            </div>
          ) : displayMaterials.length === 0 ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">Niciun material găsit</h3>
              <p className="text-muted-foreground text-sm">Nu există materiale TVC încărcate încă</p>
            </div>
          ) : (
            displayMaterials.map((material, index) => {
              const isEmpty = (material as any)._isEmpty;
              return (
                <div 
                  key={material.id}
                  className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${isEmpty ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${!isEmpty ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        {isEmpty ? (
                          <h3 className="font-medium text-muted-foreground italic">Materialul nu a fost încărcat</h3>
                        ) : (
                          <>
                            <h3 className="font-medium text-foreground">{material.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {material.year && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {material.year}
                                </span>
                              )}
                              <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded flex items-center gap-1">
                                {getFileIcon(material.file_type)}
                                {getFileTypeLabel(material.file_type)}
                              </span>
                              {(material.has_answer_key || (material.answer_key && Array.isArray(material.answer_key) && material.answer_key.length > 0)) && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                                  <ClipboardCheck className="w-3 h-3" />
                                  Grilă disponibilă
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isProfessor ? (
                        isEmpty ? (
                          <Button variant="gold" size="sm" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Încarcă
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" size="sm" className="gap-1"
                              onClick={() => {
                                if (material.subject_config && Object.keys(material.subject_config).length > 0) {
                                  setViewingMultiFiles({ title: material.title, subjectFiles: extractSubjectFiles(material.subject_config) });
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
                              variant="outline" size="sm" className="gap-1"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = material.file_url;
                                link.download = material.file_name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Descarcă
                            </Button>
                            <Button 
                              variant="ghost" size="icon" className="text-destructive"
                              onClick={() => handleDeleteMaterial(material)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )
                      ) : (
                        !isEmpty && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => setViewingFile({ url: material.file_url, name: material.file_name, type: material.file_type })}
                            >
                              <Eye className="w-4 h-4" />
                              Vezi
                            </Button>
                            <Button 
                              variant="gold" size="sm"
                              onClick={() => setTimerMaterial(material)}
                            >
                              Începe cu Timer
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Upload Modal */}
        <UploadMaterialModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveMaterial}
          title="Încarcă Material TVC"
          category="tvc"
          subject={selectedSubject}
          showYear={true}
          showAnswerKey={true}
          showTimer={true}
        />

        {/* Edit Modal */}
        <EditMaterialModal
          isOpen={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={handleEditMaterial}
          material={editingMaterial}
          showYear={true}
          showAnswerKey={true}
          showTimer={true}
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
        <MultiFileViewer
          isOpen={!!viewingMultiFiles}
          onClose={() => setViewingMultiFiles(null)}
          title={viewingMultiFiles?.title || ''}
          subjectFiles={viewingMultiFiles?.subjectFiles}
        />

        {/* Timer Modal */}
        {timerMaterial && (
          <TVCTimer 
            subjectTitle={timerMaterial.title}
            pdfUrl={timerMaterial.file_url}
            hasAnswerKey={timerMaterial.has_answer_key || (timerMaterial.answer_key && timerMaterial.answer_key.length > 0)}
            questionCount={timerMaterial.answer_key?.length || 0}
            materialId={timerMaterial.id}
            timerMinutes={timerMaterial.timer_minutes || 180}
            onClose={() => setTimerMaterial(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default TesteAcademii;
