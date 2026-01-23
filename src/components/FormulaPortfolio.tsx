import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Calculator, Atom, BookMarked, X, Eye, FileText, Image as ImageIcon, File, FileSpreadsheet, Presentation, FileType as FileTypeIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import FileViewer from '@/components/FileViewer';

interface FormulaPortfolioProps {
  subject: 'matematica' | 'fizica';
  isProfessor: boolean;
}

const categoryDefinitions: Record<'matematica' | 'fizica', { id: string; name: string }[]> = {
  matematica: [
    { id: 'algebra', name: 'Algebră' },
    { id: 'geometrie', name: 'Geometrie' },
    { id: 'analiza', name: 'Analiză Matematică' },
    { id: 'trigonometrie', name: 'Trigonometrie' },
    { id: 'probabilitati', name: 'Probabilități și Statistică' },
    { id: 'combinatorica', name: 'Combinatorică' },
  ],
  fizica: [
    { id: 'mecanica', name: 'Mecanică' },
    { id: 'termodinamica', name: 'Termodinamică' },
    { id: 'electricitate', name: 'Electricitate și Magnetism' },
    { id: 'optica', name: 'Optică' },
    { id: 'nucleara', name: 'Fizică Nucleară' },
    { id: 'unde', name: 'Unde și Oscilații' },
  ],
};

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

const FormulaPortfolio = ({ subject, isProfessor }: FormulaPortfolioProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject,
    category: 'formula',
  });

  const SubjectIcon = subject === 'matematica' ? Calculator : Atom;
  const subjectName = subject === 'matematica' ? 'Matematică' : 'Fizică';
  const categories = categoryDefinitions[subject];

  // Group materials by genre (category id)
  const materialsByCategory = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    materials.forEach(m => {
      const cat = m.genre || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });
    return grouped;
  }, [materials]);

  const handleUploadImage = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleSaveFormula = async () => {
    if (!uploadedFile || !selectedCategoryId) return;

    const categoryName = categories.find(c => c.id === selectedCategoryId)?.name || '';

    try {
      await addMaterial({
        title: `Formule ${categoryName}`,
        description: categoryName,
        file_name: uploadedFile.name,
        file_type: uploadedFile.type,
        file_url: uploadedFile.url,
        file_size: uploadedFile.size,
        subject,
        category: 'formula',
        lesson_number: null,
        author: null,
        genre: selectedCategoryId,
        year: null,
      });
      toast({ title: 'Formule salvate', description: 'Formulele au fost salvate cu succes.' });
      setIsModalOpen(false);
      setUploadedFile(null);
      setSelectedCategoryId(null);
    } catch (error) {
      console.error('Error saving formula:', error);
    }
  };

  const handleDeleteFormula = async (material: Material) => {
    await deleteMaterial(material.id, material.file_url);
  };

  const handleEditFormula = (material: Material) => {
    setEditingMaterial(material);
    setEditTitle(material.title);
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial || !editTitle.trim()) return;

    try {
      await updateMaterial(editingMaterial.id, { title: editTitle.trim() });
      toast({ title: 'Actualizat', description: 'Titlul a fost modificat cu succes.' });
      setEditingMaterial(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error updating formula:', error);
    }
  };

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFile({ url: fileUrl, name: fileName, type: fileType, size: fileSize });
  };

  const uploadedCategories = categories.filter(c => materialsByCategory[c.id]?.length > 0);

  return (
    <section className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/70 rounded-lg flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-navy-dark" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Portofoliu Formule</h2>
            <p className="text-sm text-muted-foreground">Formule esențiale pentru {subjectName} - organizate pe categorii</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-gold">{uploadedCategories.length}</p>
          <p className="text-xs text-muted-foreground">Categorii cu fișiere</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{materials.length}</p>
          <p className="text-xs text-muted-foreground">Total fișiere încărcate</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const categoryMaterials = materialsByCategory[category.id] || [];
            const hasFiles = categoryMaterials.length > 0;

            return (
              <div
                key={category.id}
                className={`bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-gold ${!hasFiles ? 'opacity-70' : ''}`}
              >
                {/* Category Header */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SubjectIcon className="w-5 h-5 text-gold" />
                      <h3 className="font-display text-lg text-foreground">{category.name}</h3>
                    </div>
                    {isProfessor && hasFiles && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUploadImage(category.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Files List */}
                <div className="p-4">
                  {hasFiles ? (
                    <div className="space-y-2">
                      {categoryMaterials.map(material => (
                        <div key={material.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getFileIcon(material.file_type)}
                            <span className="text-sm text-foreground truncate">{material.file_name}</span>
                            <span className="text-xs text-muted-foreground">{getFileTypeLabel(material.file_type)}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setViewingFile({ url: material.file_url, name: material.file_name, type: material.file_type })}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {isProfessor && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditFormula(material)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteFormula(material)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Niciun fișier încărcat</p>
                    </div>
                  )}
                </div>

                {/* Upload Button for Professors */}
                {isProfessor && !hasFiles && (
                  <div className="p-4 border-t border-border">
                    <Button variant="gold" className="w-full gap-2" onClick={() => handleUploadImage(category.id)}>
                      <Plus className="w-4 h-4" />
                      Încarcă fișier
                    </Button>
                  </div>
                )}

                {/* View Button for Students */}
                {!isProfessor && hasFiles && (
                  <div className="p-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const first = categoryMaterials[0];
                        setViewingFile({ url: first.file_url, name: first.file_name, type: first.file_type });
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Vezi formule
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Încarcă fișier pentru {categories.find(c => c.id === selectedCategoryId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {uploadedFile ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadedFile.type)}
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeLabel(uploadedFile.type)} • {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <FileUpload
                onUploadComplete={handleUploadComplete}
                category="formula"
                subject={subject}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Anulează
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSaveFormula} disabled={!uploadedFile}>
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pencil className="w-5 h-5 text-gold" />
              Editează fișier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-formula-title">Titlu</Label>
              <Input
                id="edit-formula-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titlul fișierului..."
              />
            </div>
            
            {editingMaterial && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {getFileIcon(editingMaterial.file_type)}
                <div>
                  <p className="text-sm font-medium text-foreground truncate">{editingMaterial.file_name}</p>
                  <p className="text-xs text-muted-foreground">{getFileTypeLabel(editingMaterial.file_type)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingMaterial(null)}>
                Anulează
              </Button>
              <Button variant="gold" className="flex-1 gap-2" onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                <Save className="w-4 h-4" />
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          fileUrl={viewingFile.url}
          fileName={viewingFile.name}
          fileType={viewingFile.type}
        />
      )}
    </section>
  );
};

export default FormulaPortfolio;
