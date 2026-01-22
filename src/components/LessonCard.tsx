import { Clock, Plus, Edit, Trash2, Eye, FileText, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Lesson {
  id: number;
  title: string | null;
  duration: string | null;
  description?: string;
  pdfUrl?: string;
  status: 'completed' | 'in-progress' | 'locked' | 'not-uploaded';
}

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isProfessor: boolean;
  onAdd: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onViewPDF: (title: string) => void;
}

const LessonCard = ({ lesson, index, isProfessor, onAdd, onEdit, onDelete, onViewPDF }: LessonCardProps) => {
  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress':
        return <PlayCircle className="w-5 h-5 text-gold" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <span className="font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getStatusColor = () => {
    switch (lesson.status) {
      case 'completed':
        return 'bg-emerald-500/20';
      case 'in-progress':
        return 'bg-gold/20';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div 
      className={`bg-card rounded-xl p-6 shadow-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300 ${
        lesson.status === 'not-uploaded' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            {lesson.status === 'not-uploaded' ? (
              <h3 className="font-medium text-muted-foreground italic">Lecția nu a fost încărcată</h3>
            ) : (
              <>
                <h3 className="font-medium text-foreground">{lesson.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration}
                  </p>
                  {lesson.pdfUrl && (
                    <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      PDF atașat
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isProfessor ? (
            lesson.status === 'not-uploaded' ? (
              <Button 
                variant="gold" 
                size="sm" 
                className="gap-2"
                onClick={() => onAdd(lesson.id)}
              >
                <Plus className="w-4 h-4" />
                Adaugă lecție
              </Button>
            ) : (
              <>
                {lesson.pdfUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => lesson.title && onViewPDF(lesson.title)}
                  >
                    <Eye className="w-4 h-4" />
                    Vezi PDF
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => onEdit(lesson.id)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive"
                  onClick={() => onDelete(lesson.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )
          ) : (
            lesson.status !== 'not-uploaded' && (
              <div className="flex items-center gap-2">
                {lesson.pdfUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => lesson.title && onViewPDF(lesson.title)}
                  >
                    <Eye className="w-4 h-4" />
                    Vezi PDF
                  </Button>
                )}
                <Button 
                  variant={lesson.status === 'locked' ? 'outline' : 'gold'} 
                  size="sm"
                  disabled={lesson.status === 'locked'}
                >
                  {lesson.status === 'completed' ? 'Revizuiește' : 
                   lesson.status === 'in-progress' ? 'Continuă' : 'Blocat'}
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard;
