import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Trash2, Edit, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { getSignedFileUrl } from '@/lib/storage';
import { downloadFile } from '@/lib/downloadFile';
import UploadMaterialModal from '@/components/UploadMaterialModal';
import EditMaterialModal from '@/components/EditMaterialModal';
import FileViewer from '@/components/FileViewer';

const Subiect2BAC = () => {
  const { role, subject } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProfessor = role === 'profesor' || authRole === 'admin';

  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial } = useMaterials({
    subject: 'romana',
    category: 'subiect2',
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);

  // Only for Romanian
  if (subject !== 'romana') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Subiectul II indisponibil</h1>
          <p className="text-muted-foreground mb-6">Această secțiune este disponibilă doar pentru Limba Română.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async (data: {
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    publishAt?: string;
  }) => {
    try {
      await addMaterial({
        title: data.title,
        description: data.description || null,
        file_name: data.fileName,
        file_type: data.fileType,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        subject: 'romana',
        category: 'subiect2',
        lesson_number: null,
        author: null,
        genre: null,
        year: null,
        publish_at: data.publishAt || null,
      });
      toast({ title: 'Șablon salvat', description: 'Șablonul a fost salvat cu succes.' });
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (material: Material) => {
    await deleteMaterial(material.id, material.file_url);
  };

  const handleView = async (material: Material) => {
    const signedUrl = await getSignedFileUrl(material.file_url);
    if (signedUrl) {
      setViewingFile({ url: signedUrl, name: material.file_name, type: material.file_type });
    }
  };

  const handleDownload = async (material: Material) => {
    const signedUrl = await getSignedFileUrl(material.file_url);
    if (signedUrl) {
      downloadFile(signedUrl, material.file_name);
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
              <FileText className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Subiectul II BAC - Șabloane</h1>
            </div>
            <p className="text-primary-foreground/70">
              Modele și structuri pentru comentariul literar și caracterizări
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-up">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-gold">{materials.length}</p>
            <p className="text-xs text-muted-foreground">Șabloane încărcate</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">
              {materials.filter(m => m.file_type === 'pdf').length}
            </p>
            <p className="text-xs text-muted-foreground">Documente PDF</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-up delay-100">
          <h3 className="font-display text-lg text-foreground mb-2">Ce este Subiectul II?</h3>
          <p className="text-muted-foreground">
            Subiectul II la Bacalaureat - Limba Română testează capacitatea de a scrie un text argumentativ pe o temă dată, 
            pornind de la un fragment literar. Aici găsești șabloane și modele pentru diferite tipuri de opere.
          </p>
        </div>

        {/* Add button for professors */}
        {isProfessor && (
          <div className="mb-6 animate-fade-up delay-150">
            <Button variant="gold" className="gap-2" onClick={() => setIsUploadOpen(true)}>
              <FileText className="w-4 h-4" />
              Adaugă Șablon
            </Button>
          </div>
        )}

        {/* Templates List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Se încarcă...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 animate-fade-up delay-200">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nu există șabloane încărcate.</p>
            {isProfessor && (
              <p className="text-sm text-muted-foreground mt-2">Apasă „Adaugă Șablon" pentru a încărca primul.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 animate-fade-up delay-200">
            {materials.map((material, index) => (
              <div 
                key={material.id}
                className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold/20 text-gold">
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{material.title}</h3>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                      )}
                      <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded mt-2 inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {material.file_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {isProfessor ? (
                      <>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleView(material)}>
                          <Eye className="w-4 h-4" />
                          Vezi
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownload(material)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingMaterial(material)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(material)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="gold" size="sm" className="gap-2" onClick={() => handleView(material)}>
                        <Eye className="w-4 h-4" />
                        Vizualizează
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={handleSave}
        title="Adaugă Șablon Subiectul II"
        category="subiect2"
        subject="romana"
      />

      {/* Edit Modal */}
      {editingMaterial && (
        <EditMaterialModal
          isOpen={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          material={editingMaterial}
          onSave={async (updates) => {
            await updateMaterial(editingMaterial.id, updates);
            setEditingMaterial(null);
          }}
        />
      )}

      {/* File Viewer */}
      {viewingFile && (
        <FileViewer
          isOpen={!!viewingFile}
          fileUrl={viewingFile.url}
          fileName={viewingFile.name}
          fileType={viewingFile.type}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
};

export default Subiect2BAC;
