import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Settings, Users, BookOpen, FileText, 
  Award, TrendingUp, Calendar, Clock, BarChart3, PieChart,
  CheckCircle2, AlertCircle, Upload, Eye, Trash2, Plus,
  GraduationCap, Target, Activity, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Subject } from '@/contexts/AppContext';
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

// Mock data for admin statistics
const platformStats = {
  totalStudents: 156,
  totalProfessors: 8,
  totalLessons: 47,
  totalBacModels: 32,
  totalTvcMaterials: 18,
  averageProgress: 68,
  activeToday: 42,
  weeklyGrowth: 12,
};

const subjectStats: Record<Subject, { lessons: number; uploaded: number; bacModels: number; tvcMaterials: number; students: number }> = {
  informatica: { lessons: 10, uploaded: 5, bacModels: 8, tvcMaterials: 6, students: 45 },
  romana: { lessons: 10, uploaded: 3, bacModels: 10, tvcMaterials: 0, students: 38 },
  matematica: { lessons: 10, uploaded: 2, bacModels: 7, tvcMaterials: 5, students: 42 },
  fizica: { lessons: 10, uploaded: 4, bacModels: 7, tvcMaterials: 7, students: 31 },
};

const recentActivity = [
  { id: 1, action: 'Lecție adăugată', subject: 'informatica', title: 'Algoritmi de sortare', time: 'Acum 2 ore', type: 'add' },
  { id: 2, action: 'Model BAC încărcat', subject: 'romana', title: 'Subiect BAC 2024', time: 'Acum 5 ore', type: 'add' },
  { id: 3, action: 'Material TVC șters', subject: 'fizica', title: 'Probleme mecanică', time: 'Ieri', type: 'delete' },
  { id: 4, action: 'Lecție modificată', subject: 'matematica', title: 'Funcții trigonometrice', time: 'Ieri', type: 'edit' },
  { id: 5, action: 'Model BAC adăugat', subject: 'informatica', title: 'Varianta 2023 - II', time: 'Acum 2 zile', type: 'add' },
];

const topStudents = [
  { id: 1, name: 'Alexandru M.', progress: 95, lessonsCompleted: 12, subject: 'informatica' },
  { id: 2, name: 'Maria I.', progress: 88, lessonsCompleted: 10, subject: 'romana' },
  { id: 3, name: 'Andrei P.', progress: 82, lessonsCompleted: 9, subject: 'matematica' },
  { id: 4, name: 'Elena D.', progress: 78, lessonsCompleted: 8, subject: 'fizica' },
  { id: 5, name: 'Mihai C.', progress: 75, lessonsCompleted: 8, subject: 'informatica' },
];

const AdminPanel = () => {
  const { role } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'students' | 'activity'>('overview');

  // Redirect if not professor
  if (role !== 'profesor') {
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
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Privire de ansamblu', icon: BarChart3 },
            { id: 'content', label: 'Gestionare Conținut', icon: Layers },
            { id: 'students', label: 'Elevi', icon: GraduationCap },
            { id: 'activity', label: 'Activitate Recentă', icon: Activity },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Progres Mediu</h3>
                  <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">{platformStats.averageProgress}%</span>
                  <span className="text-emerald-500 text-sm mb-1">+{platformStats.weeklyGrowth}% săptămâna asta</span>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-500"
                    style={{ width: `${platformStats.averageProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Activi Astăzi</h3>
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">{platformStats.activeToday}</span>
                  <span className="text-muted-foreground text-sm mb-1">din {platformStats.totalStudents} elevi</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round((platformStats.activeToday / platformStats.totalStudents) * 100)}% rată de activitate
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Profesori</h3>
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-foreground">{platformStats.totalProfessors}</span>
                  <span className="text-muted-foreground text-sm mb-1">profesori activi</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ~{Math.round(platformStats.totalStudents / platformStats.totalProfessors)} elevi/profesor
                </p>
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
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display text-lg text-foreground">Top Elevi după Progres</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nume</TableHead>
                      <TableHead>Materie Principală</TableHead>
                      <TableHead className="text-center">Lecții Finalizate</TableHead>
                      <TableHead className="text-center">Progres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-gold/20 text-gold' :
                            index === 1 ? 'bg-gray-300/20 text-gray-500' :
                            index === 2 ? 'bg-amber-600/20 text-amber-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{subjectNames[student.subject as Subject]}</TableCell>
                        <TableCell className="text-center">{student.lessonsCompleted}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-gold to-emerald-500 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{student.progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Student Distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(subjectStats).map(([key, stats]) => (
                <div key={key} className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                  <p className="text-3xl font-bold text-foreground">{stats.students}</p>
                  <p className="text-sm text-muted-foreground">{subjectNames[key as Subject]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fade-up">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-display text-lg text-foreground">Activitate Recentă</h3>
              </div>
              <div className="divide-y divide-border">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'add' ? 'bg-emerald-500/10 text-emerald-500' :
                      activity.type === 'delete' ? 'bg-destructive/10 text-destructive' :
                      'bg-gold/10 text-gold'
                    }`}>
                      {activity.type === 'add' ? <Plus className="w-5 h-5" /> :
                       activity.type === 'delete' ? <Trash2 className="w-5 h-5" /> :
                       <Eye className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.title} • {subjectNames[activity.subject as Subject]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
