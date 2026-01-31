import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Award, Search, Plus, Trash2, Eye, 
  File, Image, FileSpreadsheet, Presentation, FileType as FileTypeIcon, 
  FileText, ClipboardCheck, Pencil, Timer, Calculator, Code, Atom
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import UploadMaterialModal from '@/components/UploadMaterialModal';
import EditMaterialModal from '@/components/EditMaterialModal';
import FileViewer from '@/components/FileViewer';
import TVCTimerComplet from '@/components/TVCTimerComplet';

type TVCSubject = 'matematica' | 'informatica' | 'fizica';

const tvcSubjects: { key: TVCSubject; name: string; icon: typeof Calculator }[] = [
  { key: 'matematica', name: 'Matematică', icon: Calculator },
  { key: 'informatica', name: 'Informatică', icon: Code },
  { key: 'fizica', name: 'Fizică', icon: Atom },
];

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

const TVCComplet = () => {
  const { role } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<TVCSubject>('matematica');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingForSubject, setAddingForSubject] = useState<TVCSubject>('matematica');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [timerMaterial, setTimerMaterial] = useState<Material | null>(null);

  const isProfessor = role === 'profesor' || authRole === 'admin';

  // Fetch materials for all 3 subjects
  const mateMaterials = useMaterials({ subject: 'matematica', category: 'tvc_complet' });
  const infoMaterials = useMaterials({ subject: 'informatica', category: 'tvc_complet' });
  const fizicaMaterials = useMaterials({ subject: 'fizica', category: 'tvc_complet' });

  const getMaterialsForSubject = (subj: TVCSubject) => {
    switch (subj) {
      case 'matematica': return mateMaterials;
      case 'informatica': return infoMaterials;
      case 'fizica': return fizicaMaterials;
    }
  };

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
  }) => {
    const { addMaterial } = getMaterialsForSubject(addingForSubject);
    
    try {
      await addMaterial({
        title: data.title,
        description: data.description,
        file_name: data.fileName,
        file_type: data.fileType,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        subject: addingForSubject,
        category: 'tvc_complet',
        lesson_number: null,
        author: null,
        genre: null,
        year: data.year || null,
        answer_key: data.answerKey || null,
        oficiu: data.oficiu ?? 0,
        timer_minutes: data.timerMinutes ?? 180,
      });
      toast({ title: 'Material salvat', description: 'Testul TVC a fost salvat cu succes.' });
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleDeleteMaterial = async (material: Material, subj: TVCSubject) => {
    const { deleteMaterial } = getMaterialsForSubject(subj);
    await deleteMaterial(material.id, material.file_url);
  };

  const handleEditMaterial = async (data: {
    title: string;
    description: string;
    year?: number;
    answerKey?: string[];
    timerMinutes?: number;
  }) => {
    if (!editingMaterial) return;
    
    const subj = editingMaterial.subject as TVCSubject;
    const { updateMaterial } = getMaterialsForSubject(subj);
    
    try {
      await updateMaterial(editingMaterial.id, {
        title: data.title,
        description: data.description,
        year: data.year || null,
        answer_key: data.answerKey || null,
        timer_minutes: data.timerMinutes ?? 180,
      });
      toast({ title: 'Material actualizat', description: 'Modificările au fost salvate cu succes.' });
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleOpenAdd = (subj: TVCSubject) => {
    setAddingForSubject(subj);
    setIsAddModalOpen(true);
  };

  const renderSubjectCard = (subjectInfo: typeof tvcSubjects[0]) => {
    const { key, name, icon: Icon } = subjectInfo;
    const { materials, isLoading } = getMaterialsForSubject(key);
    const material = materials[0]; // Only first material (one per subject)

    return (
      <div key={key} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gold/10 to-transparent border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">Test TVC Complet</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Se încarcă...</p>
            </div>
          ) : material ? (
            <div className="space-y-4">
              {/* Material Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">{material.title}</h4>
                {material.description && (
                  <p className="text-sm text-muted-foreground">{material.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gold/10 text-gold px-2 py-1 rounded flex items-center gap-1">
                    {getFileIcon(material.file_type)}
                    {getFileTypeLabel(material.file_type)}
                  </span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {(material as any).timer_minutes || 180} min
                  </span>
                  {(material.has_answer_key || (material.answer_key && Array.isArray(material.answer_key) && material.answer_key.length > 0)) && (
                    <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded flex items-center gap-1">
                      <ClipboardCheck className="w-3 h-3" />
                      Grilă ({material.answer_key?.length || '?'} întreb.)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isProfessor ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => setViewingFile({ 
                        url: material.file_url, 
                        name: material.file_name, 
                        type: material.file_type 
                      })}
                    >
                      <Eye className="w-4 h-4" />
                      Vezi
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => setEditingMaterial(material)}
                    >
                      <Pencil className="w-4 h-4" />
                      Editează
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive gap-1"
                      onClick={() => handleDeleteMaterial(material, key)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Șterge
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => setViewingFile({ 
                        url: material.file_url, 
                        name: material.file_name, 
                        type: material.file_type 
                      })}
                    >
                      <Eye className="w-4 h-4" />
                      Vezi PDF
                    </Button>
                    <Button 
                      variant="gold" 
                      size="sm"
                      className="gap-1"
                      onClick={() => setTimerMaterial(material)}
                    >
                      <Timer className="w-4 h-4" />
                      Începe Testul
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              {isProfessor ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Niciun test încărcat</p>
                  <Button 
                    variant="gold" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleOpenAdd(key)}
                  >
                    <Plus className="w-4 h-4" />
                    Încarcă Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Testul nu a fost încărcat încă</p>
                  <p className="text-xs text-muted-foreground">Profesorul va încărca subiectul în curând.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
              <span className="font-display text-lg hidden md:block">LM Ștefan cel Mare</span>
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
        {/* Info Box */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up">
          <h3 className="font-display text-lg text-foreground mb-2">Despre TVC Complet</h3>
          <p className="text-muted-foreground">
            Secțiunea TVC Complet conține câte un test pentru fiecare materie: Matematică, Informatică și Fizică. 
            Fiecare test are un timer personalizat de către profesor. La expirarea timpului, testul se trimite automat 
            cu răspunsurile completate până în acel moment.
          </p>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-100">
          {tvcSubjects.map(renderSubjectCard)}
        </div>
      </main>

      {/* Upload Modal with custom timer support */}
      <UploadMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveMaterial}
        title={`Încarcă Test TVC - ${tvcSubjects.find(s => s.key === addingForSubject)?.name}`}
        category="tvc_complet"
        subject={addingForSubject}
        showYear={true}
        showAnswerKey={true}
        showTimer={true}
      />

      {/* Edit Modal with custom timer support */}
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

      {/* Timer Modal with auto-submit */}
      {timerMaterial && (
        <TVCTimerComplet 
          subjectTitle={timerMaterial.title}
          pdfUrl={timerMaterial.file_url}
          hasAnswerKey={timerMaterial.has_answer_key || (timerMaterial.answer_key && timerMaterial.answer_key.length > 0)}
          questionCount={timerMaterial.answer_key?.length || 0}
          materialId={timerMaterial.id}
          timerMinutes={(timerMaterial as any).timer_minutes || 180}
          onClose={() => setTimerMaterial(null)} 
        />
      )}
    </div>
  );
};

export default TVCComplet;
