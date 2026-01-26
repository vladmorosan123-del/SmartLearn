import { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, User, Calendar, CheckCircle, XCircle, Loader2, Search, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Subject = 'informatica' | 'romana' | 'matematica' | 'fizica';

const subjectNames: Record<Subject, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

interface TVCSubmission {
  id: string;
  user_id: string;
  material_id: string;
  answers: string[];
  score: number;
  total_questions: number;
  submitted_at: string;
  profile?: {
    username: string;
    full_name: string | null;
  };
  material?: {
    title: string;
    answer_key: unknown;
    subject: string;
  };
}

const TVCSubmissionsViewer = () => {
  const [submissions, setSubmissions] = useState<TVCSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TVCSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('tvc_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        return;
      }

      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        return;
      }

      // Fetch profiles for all users
      const userIds = [...new Set(submissionsData.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', userIds);

      // Fetch materials for all submissions
      const materialIds = [...new Set(submissionsData.map(s => s.material_id))];
      const { data: materials } = await supabase
        .from('materials')
        .select('id, title, answer_key, subject')
        .in('id', materialIds);

      // Combine data
      const enrichedSubmissions = submissionsData.map(submission => ({
        ...submission,
        answers: submission.answers as string[],
        profile: profiles?.find(p => p.user_id === submission.user_id),
        material: materials?.find(m => m.id === submission.material_id),
      }));

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };

  // Filter submissions based on search and subject
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const studentName = submission.profile?.full_name || submission.profile?.username || '';
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || submission.material?.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [submissions, searchQuery, selectedSubject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg text-foreground">Răspunsuri TVC de la Elevi</h3>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Caută după numele elevului..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Subject Filter */}
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Toate materiile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate materiile</SelectItem>
                {Object.entries(subjectNames).map(([key, name]) => (
                  key !== 'romana' && (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elev</TableHead>
                  <TableHead>Subiect TVC</TableHead>
                  <TableHead>Materie</TableHead>
                  <TableHead className="text-center">Scor</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead className="text-center">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {submission.profile?.full_name || submission.profile?.username || 'Necunoscut'}
                      </div>
                    </TableCell>
                    <TableCell>{submission.material?.title || 'Material șters'}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {subjectNames[submission.material?.subject as Subject] || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getScoreColor(submission.score, submission.total_questions)}`}>
                        {submission.score}/{submission.total_questions}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(submission.submitted_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        Vezi Detalii
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : submissions.length > 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nu s-au găsit rezultate pentru căutarea ta.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => { setSearchQuery(''); setSelectedSubject('all'); }}
            >
              Resetează filtrele
            </Button>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nu există răspunsuri TVC salvate încă.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-gold" />
              Detalii Răspunsuri
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission?.profile?.full_name || selectedSubmission?.profile?.username} - {selectedSubmission?.material?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Score Summary */}
              <div className={`p-4 rounded-lg text-center ${
                (selectedSubmission.score / selectedSubmission.total_questions) >= 0.7 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : (selectedSubmission.score / selectedSubmission.total_questions) >= 0.5 
                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                  : 'bg-destructive/20 border border-destructive/50'
              }`}>
                <p className="text-lg font-bold">
                  Scor: {selectedSubmission.score} / {selectedSubmission.total_questions} puncte
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round((selectedSubmission.score / selectedSubmission.total_questions) * 100)}%
                </p>
              </div>

              {/* Answers Detail */}
              <div className="space-y-2">
                <h4 className="font-medium">Răspunsuri:</h4>
                {selectedSubmission.answers.map((answer, index) => {
                  const answerKeyArray = selectedSubmission.material?.answer_key as string[] | null;
                  const correctAnswer = answerKeyArray?.[index];
                  const isCorrect = answer === correctAnswer;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        isCorrect ? 'bg-green-500/10' : 'bg-destructive/10'
                      }`}
                    >
                      <span className="font-medium">Întrebarea {index + 1}:</span>
                      <div className="flex items-center gap-2">
                        <span className={isCorrect ? 'text-green-500' : 'text-destructive'}>
                          {answer || '-'}
                        </span>
                        {!isCorrect && correctAnswer && (
                          <span className="text-muted-foreground text-sm">
                            (corect: {correctAnswer})
                          </span>
                        )}
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submission Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Trimis la: {formatDate(selectedSubmission.submitted_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TVCSubmissionsViewer;
