import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, PenTool, Plus, Trash2, Edit, Eye, BookOpen, FolderPlus, X, FileText, Image as ImageIcon, File, FileSpreadsheet, Presentation, FileType as FileTypeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '@/components/FileUpload';
import FileViewer from '@/components/FileViewer';
import MultiFileViewer, { extractSubjectFiles } from '@/components/MultiFileViewer';

interface GenreDefinition {
  id: string;
  name: string;
  isCustom?: boolean;
}

const defaultGenres: GenreDefinition[] = [
  { id: 'poezie_modernista', name: 'Poezie modernistă' },
  { id: 'poezie_romantica', name: 'Poezie romantică' },
  { id: 'poezie_simbolista', name: 'Poezie simbolistă' },
  { id: 'proza_realista', name: 'Proză realistă' },
  { id: 'proza_psihologica', name: 'Proză psihologică' },
  { id: 'drama', name: 'Dramă' },
  { id: 'basm_cult', name: 'Basm cult' },
  { id: 'nuvela', name: 'Nuvelă' },
  { id: 'roman', name: 'Roman' },
];

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="w-4 h-4" />;
  const type = fileType.toLowerCase();
  if (type === 'jpg' || type === 'jpeg' || type === 'png') return <ImageIcon className="w-4 h-4" />;
  if (type === 'pdf') return <FileText className="w-4 h-4" />;
  if (type === 'xls' || type === 'xlsx' || type === 'csv') return <FileSpreadsheet className="w-4 h-4" />;
  if (type === 'doc' || type === 'docx') return <FileTypeIcon className="w-4 h-4" />;
  if (type === 'ppt' || type === 'pptx') return <Presentation className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
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

const EseuriBAC = () => {
  const { role, subject } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProfessor = role === 'profesor' || authRole === 'admin';
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [viewingMultiFiles, setViewingMultiFiles] = useState<{ title: string; subjectFiles: Record<string, any[]> } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string; type: string; size: number }[]>([]);
  const [essayTitle, setEssayTitle] = useState('');
  const [essayAuthor, setEssayAuthor] = useState('');
  const [essayDescription, setEssayDescription] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [isAddGenreModalOpen, setIsAddGenreModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [customGenres, setCustomGenres] = useState<GenreDefinition[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject: 'romana',
    category: 'eseu',
  });

  // Fetch custom genres
  useEffect(() => {
    const fetchCustomGenres = async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, genre')
        .eq('subject', 'romana')
        .eq('category', 'eseu_genre')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCustomGenres(
          data.map(g => ({
            id: g.genre || g.id,
            name: g.title,
            isCustom: true,
          }))
        );
      }
    };
    fetchCustomGenres();
  }, []);

  // Merge default and custom genres
  const genres = useMemo(() => {
    return [...defaultGenres, ...customGenres];
  }, [customGenres]);

  // Group materials by genre
  const materialsByGenre = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    materials.forEach(m => {
      const genreId = m.genre || 'other';
      if (!grouped[genreId]) grouped[genreId] = [];
      grouped[genreId].push(m);
    });
    return grouped;
  }, [materials]);

  // Stats calculations
  const genresWithEssays = genres.filter(g => materialsByGenre[g.id]?.length > 0);
  const genreCounts = genres.reduce((acc, g) => {
    const count = materialsByGenre[g.id]?.length || 0;
    if (count > 0) acc[g.id] = count;
    return acc;
  }, {} as Record<string, number>);

  // Filter
  const filteredGenres = filterGenre 
    ? genres.filter(g => g.id === filterGenre)
    : genres;

  // Only for Romanian - check after all hooks
  if (subject !== 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <PenTool className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Eseuri indisponibile</h1>
          <p className="text-muted-foreground mb-6">Această secțiune este disponibilă doar pentru Limba Română.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleUploadEssay = (genreId: string) => {
    setSelectedGenreId(genreId);
    setUploadedFiles([]);
    setEssayTitle('');
    setEssayAuthor('');
    setEssayDescription('');
    setIsUploadModalOpen(true);
  };

  const handleSaveEssay = async () => {
    if (uploadedFiles.length === 0 || !selectedGenreId || !essayTitle.trim()) return;

    try {
      for (const file of uploadedFiles) {
        await addMaterial({
          title: uploadedFiles.length > 1 ? `${essayTitle.trim()} - ${file.name}` : essayTitle.trim(),
          description: essayDescription.trim() || null,
          file_name: file.name,
          file_type: file.type,
          file_url: file.url,
          file_size: file.size,
          subject: 'romana',
          category: 'eseu',
          lesson_number: null,
          author: essayAuthor.trim() || null,
          genre: selectedGenreId,
          year: null,
        });
      }
      toast({ title: 'Eseuri salvate', description: `${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'eseu salvat' : 'eseuri salvate'} cu succes.` });
      setIsUploadModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving essay:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva eseul.', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setEssayTitle('');
    setEssayAuthor('');
    setEssayDescription('');
    setSelectedGenreId(null);
  };

  const handleDeleteEssay = async (material: Material) => {
    await deleteMaterial(material.id, material.file_url);
    toast({ title: 'Eseu șters', description: 'Eseul a fost șters.' });
  };

  const handleEditEssay = (material: Material) => {
    setEditingMaterial(material);
    setEssayTitle(material.title);
    setEssayAuthor(material.author || '');
    setEssayDescription(material.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial || !essayTitle.trim()) return;

    try {
      await updateMaterial(editingMaterial.id, {
        title: essayTitle.trim(),
        author: essayAuthor.trim() || null,
        description: essayDescription.trim() || null,
      });
      toast({ title: 'Actualizat', description: 'Eseul a fost modificat cu succes.' });
      setEditingMaterial(null);
      resetForm();
    } catch (error) {
      console.error('Error updating essay:', error);
    }
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFiles(prev => [...prev, { url: fileUrl, name: fileName, type: fileType, size: fileSize }]);
  };

  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return;

    const genreId = `custom_${Date.now()}`;
    
    try {
      const { error } = await supabase
        .from('materials')
        .insert([{
          title: newGenreName.trim(),
          description: 'Custom genre',
          file_name: 'genre_placeholder',
          file_type: 'genre',
          file_url: '',
          subject: 'romana',
          category: 'eseu_genre',
          genre: genreId,
        }]);

      if (error) throw error;

      setCustomGenres(prev => [...prev, {
        id: genreId,
        name: newGenreName.trim(),
        isCustom: true,
      }]);

      toast({ title: 'Gen literar adăugat', description: `Genul "${newGenreName}" a fost creat.` });
      setNewGenreName('');
      setIsAddGenreModalOpen(false);
    } catch (error) {
      console.error('Error adding genre:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga genul literar.', variant: 'destructive' });
    }
  };

  const handleDeleteGenre = async (genreId: string) => {
    try {
      // Delete the genre marker
      const { error: genreError } = await supabase
        .from('materials')
        .delete()
        .eq('subject', 'romana')
        .eq('category', 'eseu_genre')
        .eq('genre', genreId);

      if (genreError) throw genreError;

      // Also delete all essays in this genre
      const genreMaterials = materialsByGenre[genreId] || [];
      for (const material of genreMaterials) {
        await deleteMaterial(material.id, material.file_url);
      }

      setCustomGenres(prev => prev.filter(g => g.id !== genreId));
      toast({ title: 'Gen șters', description: 'Genul și toate eseurile au fost șterse.' });
    } catch (error) {
      console.error('Error deleting genre:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge genul.', variant: 'destructive' });
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
              <PenTool className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Eseuri BAC - Subiectul III</h1>
            </div>
            <p className="text-primary-foreground/70">
              Colecție de eseuri model pentru pregătirea examenului de Bacalaureat
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-gold">{materials.length}</p>
            <p className="text-xs text-muted-foreground">Eseuri încărcate</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{genresWithEssays.length}</p>
            <p className="text-xs text-muted-foreground">Genuri cu eseuri</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{genres.length}</p>
            <p className="text-xs text-muted-foreground">Total genuri</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-accent">
              {genres.length > 0 ? Math.round((genresWithEssays.length / genres.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Genuri completate</p>
          </div>
        </div>

        {/* Filter by Genre */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-up delay-100">
          <Button 
            variant={!filterGenre ? 'gold' : 'outline'} 
            size="sm"
            onClick={() => setFilterGenre('')}
          >
            Toate
          </Button>
          {Object.entries(genreCounts).map(([genreId, count]) => {
            const genre = genres.find(g => g.id === genreId);
            return (
              <Button 
                key={genreId}
                variant={filterGenre === genreId ? 'gold' : 'outline'} 
                size="sm"
                onClick={() => setFilterGenre(genreId)}
              >
                {genre?.name} ({count})
              </Button>
            );
          })}
        </div>

        {/* Add Genre Button for Professors */}
        {isProfessor && (
          <div className="mb-6 animate-fade-up delay-200">
            <Button variant="gold" className="gap-2" onClick={() => setIsAddGenreModalOpen(true)}>
              <FolderPlus className="w-4 h-4" />
              Adaugă gen literar
            </Button>
          </div>
        )}

        {/* Genres Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Se încarcă...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-300">
            {filteredGenres.map(genre => {
              const genreMaterials = materialsByGenre[genre.id] || [];
              const hasEssays = genreMaterials.length > 0;

              return (
                <div
                  key={genre.id}
                  className={`bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-gold ${!hasEssays ? 'opacity-70' : ''}`}
                >
                  {/* Genre Header */}
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-gold" />
                        <h3 className="font-display text-lg text-foreground">{genre.name}</h3>
                        {genre.isCustom && (
                          <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">Custom</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isProfessor && hasEssays && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUploadEssay(genre.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                        {isProfessor && genre.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGenre(genre.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Essays List */}
                  <div className="p-4">
                    {hasEssays ? (
                      <div className="space-y-3">
                        {genreMaterials.map(material => (
                          <div key={material.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getFileIcon(material.file_type)}
                                  <span className="text-sm font-medium text-foreground truncate">{material.title}</span>
                                </div>
                                {material.author && (
                                  <p className="text-xs text-muted-foreground">{material.author}</p>
                                )}
                                {material.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{material.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (material.subject_config && Object.keys(material.subject_config).length > 0) {
                                      setViewingMultiFiles({ title: material.title, subjectFiles: extractSubjectFiles(material.subject_config) });
                                    } else {
                                      setViewingFile({ url: material.file_url, name: material.file_name, type: material.file_type });
                                    }
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                {isProfessor && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEditEssay(material)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => handleDeleteEssay(material)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Niciun eseu încărcat</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Button for Professors */}
                  {isProfessor && !hasEssays && (
                    <div className="p-4 border-t border-border">
                      <Button variant="gold" className="w-full gap-2" onClick={() => handleUploadEssay(genre.id)}>
                        <Plus className="w-4 h-4" />
                        Încarcă eseu
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Încarcă eseu - {genres.find(g => g.id === selectedGenreId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titlu *</Label>
              <Input
                id="title"
                placeholder="ex: Eseu - Luceafărul"
                value={essayTitle}
                onChange={e => setEssayTitle(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                placeholder="ex: Mihai Eminescu"
                value={essayAuthor}
                onChange={e => setEssayAuthor(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                placeholder="Descriere scurtă..."
                value={essayDescription}
                onChange={e => setEssayDescription(e.target.value)}
                rows={2}
                className="bg-background resize-none"
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getFileTypeLabel(file.type)} • {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <FileUpload
              onUploadComplete={handleUploadComplete}
              category="eseu"
              subject="romana"
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setIsUploadModalOpen(false); resetForm(); }}>
                Anulează
              </Button>
              <Button 
                variant="gold" 
                className="flex-1" 
                onClick={handleSaveEssay} 
                disabled={uploadedFiles.length === 0 || !essayTitle.trim()}
              >
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => { if (!open) { setEditingMaterial(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Editează eseu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titlu *</Label>
              <Input
                id="edit-title"
                value={essayTitle}
                onChange={e => setEssayTitle(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-author">Autor</Label>
              <Input
                id="edit-author"
                value={essayAuthor}
                onChange={e => setEssayAuthor(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descriere</Label>
              <Textarea
                id="edit-description"
                value={essayDescription}
                onChange={e => setEssayDescription(e.target.value)}
                rows={2}
                className="bg-background resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setEditingMaterial(null); resetForm(); }}>
                Anulează
              </Button>
              <Button 
                variant="gold" 
                className="flex-1" 
                onClick={handleSaveEdit} 
                disabled={!essayTitle.trim()}
              >
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Genre Modal */}
      <Dialog open={isAddGenreModalOpen} onOpenChange={setIsAddGenreModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Adaugă gen literar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="genre-name">Numele genului</Label>
              <Input
                id="genre-name"
                placeholder="ex: Poezie avangardistă"
                value={newGenreName}
                onChange={e => setNewGenreName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setIsAddGenreModalOpen(false); setNewGenreName(''); }}>
                Anulează
              </Button>
              <Button 
                variant="gold" 
                className="flex-1" 
                onClick={handleAddGenre}
                disabled={!newGenreName.trim()}
              >
                Adaugă
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer */}
      <FileViewer
        isOpen={!!viewingFile}
        fileUrl={viewingFile?.url || ''}
        fileName={viewingFile?.name || ''}
        fileType={viewingFile?.type || ''}
        onClose={() => setViewingFile(null)}
      />
      <MultiFileViewer
        isOpen={!!viewingMultiFiles}
        onClose={() => setViewingMultiFiles(null)}
        title={viewingMultiFiles?.title || ''}
        subjectFiles={viewingMultiFiles?.subjectFiles}
      />
    </div>
  );
};

export default EseuriBAC;
