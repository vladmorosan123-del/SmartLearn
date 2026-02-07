import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Lock, ArrowRight, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AuthView = 'login' | 'change-password';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, signInWithUsername, user } = useAuthContext();
  
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; newPassword?: string; confirmPassword?: string }>({});

  // Redirect if already authenticated (only for login view, and not while checking role)
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isCheckingRole && view === 'login') {
      navigate('/materii');
    }
  }, [isAuthenticated, authLoading, isCheckingRole, navigate, view]);

  const validateLoginForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = 'Numele de utilizator este obligatoriu';
    } else if (username.length < 3) {
      newErrors.username = 'Numele de utilizator trebuie să aibă cel puțin 3 caractere';
    }
    
    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    } else if (password.length < 6) {
      newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Noua parolă este obligatorie';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Parola trebuie să aibă cel puțin 6 caractere';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmarea parolei este obligatorie';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setIsLoading(true);
    setIsCheckingRole(true);
    
    try {
      const { error } = await signInWithUsername(username.trim(), password);
      
      if (error) {
        setIsCheckingRole(false);
        toast({
          title: "Eroare de autentificare",
          description: error.message === 'Invalid login credentials' 
            ? 'Nume de utilizator sau parolă incorectă'
            : error.message,
          variant: "destructive",
        });
        return;
      }

      // Check role - only students allowed here
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
        if (role === 'profesor' || role === 'admin') {
          // Block professors/admins - sign them out
          await supabase.auth.signOut();
          setIsCheckingRole(false);
          toast({
            title: "Acces restricționat",
            description: "Contul tău este de profesor/admin. Folosește secțiunea dedicată profesorilor.",
            variant: "destructive",
          });
          return;
        }
      }

      setIsCheckingRole(false);
      toast({
        title: "Autentificare reușită",
        description: "Bine ai venit!",
      });
      navigate('/materii');
    } catch (err) {
      setIsCheckingRole(false);
      toast({
        title: "Eroare",
        description: "A apărut o eroare. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          title: "Eroare",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Parolă schimbată",
          description: "Parola ta a fost actualizată cu succes!",
        });
        setNewPassword('');
        setConfirmPassword('');
        navigate('/materii');
      }
    } catch (err) {
      toast({
        title: "Eroare",
        description: "A apărut o eroare. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-hero rounded-full mb-4">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl text-foreground">
            Colegiul Național Militar „Ștefan cel Mare"
          </h1>
          <p className="text-muted-foreground mt-1">Platformă Educațională</p>
        </div>

        {view === 'login' ? (
          <Card className="border-border shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Autentificare Elev</CardTitle>
              <CardDescription>
                Introdu datele tale de autentificare pentru a accesa platforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nume de utilizator</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Introdu numele de utilizator"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                      }}
                      className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parolă</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Introdu parola"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Se autentifică...
                    </>
                  ) : (
                    <>
                      Autentificare
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <button 
                  onClick={() => setView('change-password')}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <KeyRound className="w-4 h-4 inline mr-2" />
                  Schimbă parola
                </button>
                <p className="text-sm text-center text-muted-foreground">
                  Ești profesor?{' '}
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gold hover:underline font-medium"
                  >
                    Accesează ca profesor
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5 text-gold" />
                Schimbare Parolă
              </CardTitle>
              <CardDescription>
                {user ? 'Introdu noua ta parolă' : 'Autentifică-te mai întâi pentru a schimba parola'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Parola nouă</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Introdu noua parolă"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }}
                        className={`pl-10 ${errors.newPassword ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-destructive">{errors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmă parola</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirmă noua parolă"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }}
                        className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    variant="gold" 
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Salvează parola nouă
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    Pentru a schimba parola, trebuie să fii autentificat.
                  </p>
                  <Button variant="gold" onClick={() => setView('login')}>
                    Înapoi la autentificare
                  </Button>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <button 
                  onClick={() => setView('login')}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Înapoi la autentificare
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Colegiul Național Militar „Ștefan cel Mare" • Toate drepturile rezervate
        </p>
      </div>
    </div>
  );
};

export default Auth;
