import { X, FileText, Upload, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subject2Template {
  id: number;
  title: string | null;
  description?: string;
  status: 'uploaded' | 'not-uploaded';
}

interface Subject2SectionProps {
  templates: Subject2Template[];
  isProfessor: boolean;
  onAdd: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (title: string) => void;
}

const Subject2Section = ({ templates, isProfessor, onAdd, onDelete, onView }: Subject2SectionProps) => {
  return (
    <section className="animate-fade-up delay-500 mt-10">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-gold" />
        <h2 className="font-display text-2xl text-foreground">Subiectul II BAC - Șabloane</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Șabloane și modele pentru rezolvarea subiectului II la Limba și literatura română.
      </p>
      <div className="space-y-4">
        {templates.map((template, index) => (
          <div 
            key={template.id}
            className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${template.status === 'not-uploaded' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  template.status === 'uploaded' ? 'bg-rose-500/20 text-rose-500' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="font-bold">{index + 1}</span>
                </div>
                <div>
                  {template.status === 'not-uploaded' ? (
                    <h3 className="font-medium text-muted-foreground italic">Șablonul nu a fost încărcat</h3>
                  ) : (
                    <>
                      <h3 className="font-medium text-foreground">{template.title}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isProfessor ? (
                  template.status === 'not-uploaded' ? (
                    <Button 
                      variant="gold" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => onAdd(template.id)}
                    >
                      <Plus className="w-4 h-4" />
                      Încarcă Șablon
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => template.title && onView(template.title)}
                      >
                        <Eye className="w-4 h-4" />
                        Vezi
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => onDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )
                ) : (
                  template.status === 'uploaded' && (
                    <Button 
                      variant="gold" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => template.title && onView(template.title)}
                    >
                      <Eye className="w-4 h-4" />
                      Deschide
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Subject2Section;
