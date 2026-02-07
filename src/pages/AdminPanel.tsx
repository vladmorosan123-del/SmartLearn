import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Settings, Users, BookOpen, FileText, 
  Award, TrendingUp, Calendar, Clock, BarChart3, PieChart,
  CheckCircle2, AlertCircle, Upload, Eye, Trash2, Plus,
  GraduationCap, Target, Activity, Layers, Loader2, ClipboardCheck,
  Search, X, UserPlus, Timer, UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TVCSubmissionsViewer from '@/components/TVCSubmissionsViewer';
import CreateStudentForm from '@/components/CreateStudentForm';
import AdminUserManagement from '@/components/AdminUserManagement';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const subjectNames: Record<Subject, string> = {
  informatica: 'Informatică',
  romana: 'Limba Română',
  matematica: 'Matematică',
  fizica: 'Fizică',
};

interface StudentProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  created_at: string;
}

interface MaterialStats {
  informatica: { lessons: number; bacModels: number; tvcMaterials: number };
  romana: { lessons: number; bacModels: number; tvcMaterials: number };
  matematica: { lessons: number; bacModels: number; tvcMaterials: number };
  fizica: { lessons: number; bacModels: number; tvcMaterials: number };
}

interface RecentMaterial {
  id: string;
  title: string;
  subject: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const AdminPanel = () => {
  const { role } = useApp();
  const { role: authRole } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'students' | 'activity' | 'submissions' | 'admin'>('overview');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const isAdmin = authRole === 'admin';
  const [materialStats, setMaterialStats] = useState<MaterialStats | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<RecentMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const { students: progressStudents, stats: progressStats, isLoading: isProgressLoading, refetch: refetchProgress, formatTime } = useStudentProgress();

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // First, get all user IDs with the 'student' role
        const { data: studentRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');

        const studentUserIds = studentRoles?.map(r => r.user_id) || [];

        // Fetch only student profiles (exclude professors and admins)
        if (studentUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', studentUserIds)
            .order('created_at', { ascending: false });

          if (profiles) {
            setStudents(profiles as StudentProfile[]);
          }
        } else {
          setStudents([]);
        }

        // Fetch materials count by category and subject + recent materials
        const { data: materials } = await supabase
          .from('materials')
          .select('id, title, category, subject, created_at, updated_at')
          .order('updated_at', { ascending: false });

        if (materials) {
          const stats: MaterialStats = {
            informatica: { lessons: 0, bacModels: 0, tvcMaterials: 0 },
            romana: { lessons: 0, bacModels: 0, tvcMaterials: 0 },
            matematica: { lessons: 0, bacModels: 0, tvcMaterials: 0 },
            fizica: { lessons: 0, bacModels: 0, tvcMaterials: 0 },
          };

          materials.forEach((m) => {
            const subject = m.subject as Subject;
            if (stats[subject]) {
              if (m.category === 'lectie') stats[subject].lessons++;
              else if (m.category === 'bac') stats[subject].bacModels++;
              else if (m.category === 'tvc') stats[subject].tvcMaterials++;
            }
          });

          setMaterialStats(stats);
          
          // Set recent materials (last 10)
          setRecentMaterials(materials.slice(0, 10) as RecentMaterial[]);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate platform stats from real data
  const platformStats = {
    totalStudents: students.length,
    totalProfessors: 1, // Hardcoded for now
    totalLessons: materialStats ? Object.values(materialStats).reduce((sum, s) => sum + s.lessons, 0) : 0,
    totalBacModels: materialStats ? Object.values(materialStats).reduce((sum, s) => sum + s.bacModels, 0) : 0,
    totalTvcMaterials: materialStats ? Object.values(materialStats).reduce((sum, s) => sum + s.tvcMaterials, 0) : 0,
    averageProgress: Math.round(progressStats.averageScore),
    averageTimePerTest: progressStats.averageTimePerTest,
    averageTimePerLesson: progressStats.averageTimePerLesson,
    activeToday: progressStats.totalActiveStudents,
    weeklyGrowth: 0,
  };

  // Calculate subject stats with uploaded counts
  const subjectStats: Record<Subject, { lessons: number; uploaded: number; bacModels: number; tvcMaterials: number; students: number }> = {
    informatica: { 
      lessons: 10, 
      uploaded: materialStats?.informatica.lessons || 0, 
      bacModels: materialStats?.informatica.bacModels || 0, 
      tvcMaterials: materialStats?.informatica.tvcMaterials || 0, 
      students: Math.ceil(students.length / 4) 
    },
    romana: { 
      lessons: 10, 
      uploaded: materialStats?.romana.lessons || 0, 
      bacModels: materialStats?.romana.bacModels || 0, 
      tvcMaterials: materialStats?.romana.tvcMaterials || 0, 
      students: Math.ceil(students.length / 4) 
    },
    matematica: { 
      lessons: 10, 
      uploaded: materialStats?.matematica.lessons || 0, 
      bacModels: materialStats?.matematica.bacModels || 0, 
      tvcMaterials: materialStats?.matematica.tvcMaterials || 0, 
      students: Math.ceil(students.length / 4) 
    },
    fizica: { 
      lessons: 10, 
      uploaded: materialStats?.fizica.lessons || 0, 
      bacModels: materialStats?.fizica.bacModels || 0, 
      tvcMaterials: materialStats?.fizica.tvcMaterials || 0, 
      students: Math.ceil(students.length / 4) 
    },
  };

  // Redirect if not professor
  if (role !== 'profesor' && authRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Acces Restricționat</h1>
          <p className="text-muted-foreground mb-6">Doar profesorii au acces la panoul de administrare.</p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
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
              <Settings className="w-8 h-8 text-gold" />
              <h1 className="font-display text-3xl md:text-4xl">Panou de Administrare</h1>
            </div>
            <p className="text-primary-foreground/70">
              Gestionează conținutul platformei și monitorizează activitatea
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-4 border-b border-border overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'overview', label: 'Privire de ansamblu', shortLabel: 'Ansamblu', icon: BarChart3 },
            { id: 'content', label: 'Gestionare Conținut', shortLabel: 'Conținut', icon: Layers },
            { id: 'students', label: 'Elevi', shortLabel: 'Elevi', icon: GraduationCap },
            { id: 'submissions', label: 'Răspunsuri TVC', shortLabel: 'TVC', icon: ClipboardCheck },
            { id: 'activity', label: 'Activitate Recentă', shortLabel: 'Activitate', icon: Activity },
            ...(isAdmin ? [{ id: 'admin', label: 'Admin', shortLabel: 'Admin', icon: UserCog }] : []),
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="gap-2 whitespace-nowrap"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </Button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-up">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Users} 
                value={platformStats.totalStudents} 
                label="Elevi Înscriși" 
                color="text-primary"
                bgColor="bg-primary/10"
              />
              <StatCard 
                icon={BookOpen} 
                value={platformStats.totalLessons} 
                label="Lecții Totale" 
                color="text-gold"
                bgColor="bg-gold/10"
              />
              <StatCard 
                icon={FileText} 
                value={platformStats.totalBacModels} 
                label="Modele BAC" 
                color="text-emerald-500"
                bgColor="bg-emerald-500/10"
              />
              <StatCard 
                icon={Award} 
                value={platformStats.totalTvcMaterials} 
                label="Materiale TVC" 
                color="text-violet-500"
                bgColor="bg-violet-500/10"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Progres Mediu</h3>
                  <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">{platformStats.averageProgress}%</span>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-500"
                    style={{ width: `${platformStats.averageProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Scor mediu la teste TVC</p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Timp Mediu/Test</h3>
                  <Timer className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {formatTime(platformStats.averageTimePerTest)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Timpul petrecut pe un test TVC</p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Timp Mediu/Lecție</h3>
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {formatTime(platformStats.averageTimePerLesson)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Timpul petrecut pe o lecție</p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Elevi Activi</h3>
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">{platformStats.activeToday}</span>
                  <span className="text-muted-foreground text-sm mb-1">/ {platformStats.totalStudents}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Elevi cu activitate pe platformă</p>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display text-lg text-foreground">Statistici pe Materii</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Materie</TableHead>
                      <TableHead className="text-center">Lecții Încărcate</TableHead>
                      <TableHead className="text-center">Modele BAC</TableHead>
                      <TableHead className="text-center">Materiale TVC</TableHead>
                      <TableHead className="text-center">Elevi</TableHead>
                      <TableHead className="text-center">Completare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(subjectStats).map(([key, stats]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{subjectNames[key as Subject]}</TableCell>
                        <TableCell className="text-center">
                          <span className={stats.uploaded >= 5 ? 'text-emerald-500' : 'text-amber-500'}>
                            {stats.uploaded}/{stats.lessons}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{stats.bacModels}</TableCell>
                        <TableCell className="text-center">
                          {key === 'romana' ? (
                            <span className="text-muted-foreground">N/A</span>
                          ) : (
                            stats.tvcMaterials
                          )}
                        </TableCell>
                        <TableCell className="text-center">{stats.students}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gold rounded-full"
                                style={{ width: `${(stats.uploaded / stats.lessons) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((stats.uploaded / stats.lessons) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(subjectStats).map(([key, stats]) => (
                <div key={key} className="bg-card rounded-xl p-6 border border-border shadow-card hover:border-gold/50 transition-colors">
                  <h3 className="font-display text-lg text-foreground mb-4">{subjectNames[key as Subject]}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Lecții</span>
                      <div className="flex items-center gap-2">
                        {stats.uploaded === stats.lessons ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">{stats.uploaded}/{stats.lessons}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Modele BAC</span>
                      <span className="text-sm font-medium">{stats.bacModels}/10</span>
                    </div>
                    
                    {key !== 'romana' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">TVC</span>
                        <span className="text-sm font-medium">{stats.tvcMaterials}/10</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => navigate('/dashboard')}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Lecții
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => navigate('/modele-bac')}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      BAC
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-card">
              <h3 className="font-display text-lg text-foreground mb-4">Acțiuni Rapide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="gold" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard')}>
                  <Plus className="w-5 h-5" />
                  <span>Adaugă Lecție</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/modele-bac')}>
                  <Upload className="w-5 h-5" />
                  <span>Încarcă Model BAC</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/teste-academii')}>
                  <Award className="w-5 h-5" />
                  <span>Material TVC</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 opacity-50 cursor-not-allowed" disabled>
                  <Settings className="w-5 h-5" />
                  <span>Setări Platformă</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fade-up">
            {/* Create Student Form */}
            <CreateStudentForm onStudentCreated={() => {
              // Refetch students after creation
              supabase.from('profiles').select('*').order('created_at', { ascending: false })
                .then(({ data }) => {
                  if (data) setStudents(data as StudentProfile[]);
                });
              refetchProgress();
            }} />

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-foreground">Elevi Înregistrați</h3>
                  <span className="text-sm text-muted-foreground">{students.length} elevi</span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Caută după nume sau utilizator..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                  />
                  {studentSearchQuery && (
                    <button 
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {(() => {
                  // Merge students with progress data
                  const studentsWithProgress = students.map(student => {
                    const progress = progressStudents.find(p => p.userId === student.user_id);
                    return { ...student, progress };
                  });

                  const filteredStudents = studentsWithProgress.filter((student) => {
                    const searchLower = studentSearchQuery.toLowerCase();
                    return (
                      student.username.toLowerCase().includes(searchLower) ||
                      (student.full_name?.toLowerCase().includes(searchLower) ?? false)
                    );
                  });
                  
                  if (filteredStudents.length > 0) {
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Utilizator</TableHead>
                            <TableHead>Nume Complet</TableHead>
                            <TableHead className="text-center">Teste</TableHead>
                            <TableHead className="text-center">Scor Mediu</TableHead>
                            <TableHead className="text-center">Timp Total</TableHead>
                            <TableHead className="text-center">Data Înregistrării</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student, index) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index === 0 ? 'bg-gold/20 text-gold' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{student.username}</TableCell>
                              <TableCell>{student.full_name || '-'}</TableCell>
                              <TableCell className="text-center">
                                {student.progress?.totalTests || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.progress?.averageScore ? (
                                  <span className={`font-medium ${
                                    student.progress.averageScore >= 70 ? 'text-primary' :
                                    student.progress.averageScore >= 50 ? 'text-gold' :
                                    'text-destructive'
                                  }`}>
                                    {Math.round(student.progress.averageScore)}%
                                  </span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.progress?.totalTimeSpent ? formatTime(student.progress.totalTimeSpent) : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {new Date(student.created_at).toLocaleDateString('ro-RO')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  } else if (students.length > 0) {
                    return (
                      <div className="p-8 text-center text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nu s-au găsit elevi pentru "{studentSearchQuery}"</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setStudentSearchQuery('')}
                        >
                          Resetează căutarea
                        </Button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nu există elevi înregistrați încă.</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Student Distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <p className="text-3xl font-bold text-foreground">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Elevi</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <p className="text-3xl font-bold text-foreground">{platformStats.totalLessons}</p>
                <p className="text-sm text-muted-foreground">Lecții Disponibile</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <p className="text-3xl font-bold text-foreground">{platformStats.totalBacModels}</p>
                <p className="text-sm text-muted-foreground">Modele BAC</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <p className="text-3xl font-bold text-foreground">{platformStats.totalTvcMaterials}</p>
                <p className="text-sm text-muted-foreground">Materiale TVC</p>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="animate-fade-up">
            <TVCSubmissionsViewer />
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fade-up">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display text-lg text-foreground">Activitate Recentă - Ultimele Materiale</h3>
              </div>
              {recentMaterials.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentMaterials.map((material) => {
                    const isNew = new Date(material.created_at).getTime() === new Date(material.updated_at).getTime();
                    const categoryLabel = material.category === 'lectie' ? 'Lecție' : 
                                         material.category === 'bac' ? 'Model BAC' : 
                                         material.category === 'tvc' ? 'Material TVC' : 
                                         material.category === 'eseu' ? 'Eseu' : 
                                         material.category === 'portofoliu' ? 'Portofoliu' : 'Material';
                    
                    const formatRelativeTime = (dateStr: string) => {
                      const date = new Date(dateStr);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 60) return `Acum ${diffMins} minute`;
                      if (diffHours < 24) return `Acum ${diffHours} ore`;
                      if (diffDays === 1) return 'Ieri';
                      if (diffDays < 7) return `Acum ${diffDays} zile`;
                      return date.toLocaleDateString('ro-RO');
                    };
                    
                    return (
                      <div key={material.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isNew ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'
                        }`}>
                          {isNew ? <Plus className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {isNew ? `${categoryLabel} adăugat` : `${categoryLabel} modificat`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {material.title} • {subjectNames[material.subject as Subject]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatRelativeTime(material.updated_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nu există activitate recentă încă.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Tab - Only visible for admins */}
        {activeTab === 'admin' && isAdmin && (
          <div className="animate-fade-up">
            <AdminUserManagement />
          </div>
        )}
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  bgColor 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  color: string;
  bgColor: string;
}) => (
  <div className="bg-card rounded-xl p-6 border border-border shadow-card">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

export default AdminPanel;
