import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, FileText, Eye, Plus, 
  Search, Filter, Calendar, Trash2, Pencil, File, Image, FileSpreadsheet, Presentation, FileType as FileTypeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import UploadMaterialModal from '@/components/UploadMaterialModal';
import EditMaterialModal from '@/components/EditMaterialModal';
import FileViewer from '@/components/FileViewer';

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

const ModeleBac = () => {
  const { role, subject } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subject || 'informatica');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const isProfessor = role === 'profesor' || authRole === 'admin';

  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject: selectedSubject,
    category: 'bac_model',
  });

  // Get unique years from uploaded models
  const availableYears = useMemo(() => 
    [...new Set(materials.filter(m => m.year).map(m => m.year!))]
      .sort((a, b) => b - a),
    [materials]
  );

  const years = Array.from({ length: 10 }, (_, i) => 2025 - i);
  const getYearCount = (year: number) => materials.filter(m => m.year === year).length;

  // Filter models based on search and year filter
  const filteredModels = useMemo(() => {
    return materials.filter(model => {
      const matchesSearch = !searchQuery.trim() || 
        model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.year?.toString().includes(searchQuery);
      
      const matchesYear = !selectedYear || model.year === selectedYear;
      
      return matchesSearch && matchesYear;
    });
  }, [materials, searchQuery, selectedYear]);

  // Add empty slots to show
  const displayModels = useMemo(() => {
    const models = [...filteredModels];
    if (!searchQuery && !selectedYear && isProfessor) {
      const emptySlots = Math.max(0, 10 - materials.length);
      for (let i = 0; i < emptySlots; i++) {
        models.push({
          id: `empty-${i}`,
          title: '',
          description: null,
          file_name: '',
          file_type: '',
          file_url: '',
          file_size: null,
          subject: selectedSubject,
          category: 'bac_model',
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
    return models;
  }, [filteredModels, searchQuery, selectedYear, isProfessor, materials.length, selectedSubject]);

  const handleSaveMaterial = async (data: {
    title: string;
    description: string;
    year?: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
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
        category: 'bac_model',
        lesson_number: null,
        author: null,
        genre: null,
        year: data.year || null,
        publish_at: data.publishAt || null,
      });
      toast({ title: 'Model salvat', description: 'Modelul BAC a fost salvat cu succes.' });
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    await deleteMaterial(material.id, material.file_url);
  };

  const handleEditMaterial = async (data: {
    title: string;
    description: string;
    year?: number;
    publishAt?: string | null;
  }) => {
    if (!editingMaterial) return;
    
    try {
      await updateMaterial(editingMaterial.id, {
        title: data.title,
        description: data.description,
        year: data.year || null,
        publish_at: data.publishAt,
      });
      toast({ title: 'Model actualizat', description: 'Modificările au fost salvate cu succes.' });
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
              <span className="font-display text-lg hidden md:block">LM Ștefan cel Mare</span>
            </div>
          </div>
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Modele BAC</h1>
            </div>
            <p className="text-primary-foreground/70">
              Pregătire pentru examenul de bacalaureat cu modele oficiale și simulări
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subject Selector */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up delay-100">
          {(Object.keys(subjectNames) as Subject[]).map((subj) => (
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
              placeholder="Caută modele BAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <Popover open={isYearPickerOpen} onOpenChange={setIsYearPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={selectedYear ? 'gold' : 'outline'}
                className="w-full md:w-[220px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {selectedYear ? `Anul ${selectedYear}` : 'Alege anul'}
                </span>
                <span className="text-muted-foreground text-xs">▼</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="z-[9999] w-[260px] p-0 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase">Selectează anul</p>
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                <button
                  onClick={() => { setSelectedYear(null); setIsYearPickerOpen(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-muted transition-colors ${!selectedYear ? 'bg-muted text-foreground font-medium' : 'text-foreground'}`}
                >
                  Toți anii
                </button>
                {years.map((year) => {
                  const count = getYearCount(year);
                  return (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearPickerOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between ${selectedYear === year ? 'bg-muted font-medium' : ''}`}
                    >
                      <span className={count > 0 ? 'text-foreground' : 'text-muted-foreground'}>{year}</span>
                      {count > 0 ? (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">{count} modele</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">neîncărcat</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          {isProfessor && (
            <Button variant="gold" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Adaugă Model
            </Button>
          )}
        </div>

        {/* Models List */}
        <div className="space-y-4 animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-foreground">
              Modele BAC - {subjectNames[selectedSubject]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {materials.length} modele încărcate
            </p>
          </div>
          
          {isLoading ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <p className="text-muted-foreground">Se încarcă...</p>
            </div>
          ) : displayModels.length === 0 ? (
            <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">Niciun rezultat găsit</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || selectedYear ? 'Încearcă să modifici criteriile de căutare' : 'Nu există modele încărcate încă'}
              </p>
              {(searchQuery || selectedYear) && (
                <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedYear(null); }}>
                  Resetează filtrele
                </Button>
              )}
            </div>
          ) : (
            displayModels.map((model, index) => {
              const isEmpty = (model as any)._isEmpty;
              return (
                <div 
                  key={model.id}
                  className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${isEmpty ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${!isEmpty ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        {isEmpty ? (
                          <h3 className="font-medium text-muted-foreground italic">Modelul nu a fost încărcat</h3>
                        ) : (
                          <>
                            <h3 className="font-medium text-foreground">{model.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {model.year && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {model.year}
                                </span>
                              )}
                              <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded flex items-center gap-1">
                                {getFileIcon(model.file_type)}
                                {getFileTypeLabel(model.file_type)}
                              </span>
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
                            Încarcă Model
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" size="sm" className="gap-1"
                              onClick={() => setViewingFile({ url: model.file_url, name: model.file_name, type: model.file_type })}
                            >
                              <Eye className="w-4 h-4" />
                              Vezi
                            </Button>
                            <Button 
                              variant="outline" size="sm" className="gap-1"
                              onClick={() => setEditingMaterial(model)}
                            >
                              <Pencil className="w-4 h-4" />
                              Editează
                            </Button>
                            <Button 
                              variant="ghost" size="icon" className="text-destructive"
                              onClick={() => handleDeleteMaterial(model)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )
                      ) : (
                        !isEmpty && (
                          <Button 
                            variant="gold" size="sm" className="gap-1"
                            onClick={() => setViewingFile({ url: model.file_url, name: model.file_name, type: model.file_type })}
                          >
                            <Eye className="w-4 h-4" />
                            Deschide
                          </Button>
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
          title="Încarcă Model BAC"
          category="bac_model"
          subject={selectedSubject}
          showYear={true}
        />

        {/* Edit Modal */}
        <EditMaterialModal
          isOpen={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={handleEditMaterial}
          material={editingMaterial}
          showYear={true}
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

export default ModeleBac;
