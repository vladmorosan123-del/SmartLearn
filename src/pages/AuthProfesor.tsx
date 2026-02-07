import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, ArrowRight, Loader2, KeyRound, CheckCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type AuthView = 'login' | 'signup' | 'verify-code';

const AuthProfesor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, signInWithUsername, role: authRole } = useAuthContext();
  const { setRole } = useApp();
  
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated as profesor or admin
  useEffect(() => {
    if (isAuthenticated && !authLoading && (authRole === 'profesor' || authRole === 'admin')) {
      // Set the role in AppContext so Dashboard can use it
      setRole(authRole);
      navigate('/materii');
    }
  }, [isAuthenticated, authLoading, authRole, navigate, setRole]);

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = 'Numele de utilizator este obligatoriu';
    }
    
    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = 'Numele de utilizator este obligatoriu';
    } else if (username.length < 3) {
      newErrors.username = 'Numele trebuie să aibă cel puțin 3 caractere';
    }
    
    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    } else if (password.length < 6) {
      newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signInWithUsername(username.trim(), password);
      
      if (error) {
        toast({
          title: "Eroare de autentificare",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check role - only professors/admins allowed here
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
        if (role === 'student') {
          await supabase.auth.signOut();
          toast({
            title: "Secțiune greșită",
            description: "Contul tău este de elev. Te rugăm să te autentifici din secțiunea Elev.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Autentificare reușită",
        description: "Bine ai venit!",
      });
      // Role will be set by the useEffect when authRole changes
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

  const handleVerifyCode = async () => {
    if (invitationCode.length !== 6) {
      toast({
        title: "Cod incomplet",
        description: "Codul trebuie să aibă 6 caractere",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { action: 'verify-code', code: invitationCode },
      });

      if (error || !data.valid) {
        toast({
          title: "Cod invalid",
          description: data?.error || "Codul introdus nu este valid sau a expirat",
          variant: "destructive",
        });
        setInvitationCode('');
      } else {
        setCodeVerified(true);
        setView('signup');
        toast({
          title: "Cod verificat",
          description: "Poți continua cu crearea contului",
        });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignupForm()) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { 
          action: 'register-professor',
          code: invitationCode,
          username: username.trim(),
          password,
          fullName: fullName.trim() || undefined,
        },
      });

      if (error || data.error) {
        toast({
          title: "Eroare la înregistrare",
          description: data?.error || error?.message || "A apărut o eroare",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cont creat cu succes",
          description: "Te poți autentifica acum",
        });
        setView('login');
        setPassword('');
        setConfirmPassword('');
        setCodeVerified(false);
        setInvitationCode('');
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-gold rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-navy-dark" />
          </div>
          <h1 className="font-display text-2xl text-foreground">
            Colegiul Național Militar „Ștefan cel Mare"
          </h1>
          <p className="text-muted-foreground mt-1">Portal Profesori</p>
        </div>

        {view === 'login' && (
          <Card className="border-border shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Autentificare Profesor</CardTitle>
              <CardDescription>
                Introdu datele tale de autentificare
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
                        if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
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
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
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
                  variant="navy" 
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
                  onClick={() => setView('verify-code')}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Ticket className="w-4 h-4 inline mr-2" />
                  Am un cod de înregistrare
                </button>
                <p className="text-sm text-center text-muted-foreground">
                  Ești elev?{' '}
                  <button 
                    onClick={() => navigate('/auth')}
                    className="text-gold hover:underline font-medium"
                  >
                    Autentifică-te aici
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'verify-code' && (
          <Card className="border-border shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5 text-gold" />
                Cod de Înregistrare
              </CardTitle>
              <CardDescription>
                Introdu codul de 6 caractere primit de la administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <InputOTP
                  maxLength={6}
                  value={invitationCode}
                  onChange={(value) => setInvitationCode(value.toUpperCase())}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <Button 
                  onClick={handleVerifyCode}
                  variant="gold" 
                  className="w-full"
                  disabled={isLoading || invitationCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Se verifică...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verifică codul
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <button 
                  onClick={() => {
                    setView('login');
                    setInvitationCode('');
                  }}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Înapoi la autentificare
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'signup' && codeVerified && (
          <Card className="border-border shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Creare Cont Profesor</CardTitle>
              <CardDescription>
                Completează datele pentru noul tău cont
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nume de utilizator</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Alege un nume de utilizator"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
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
                  <Label htmlFor="fullName">Nume complet (opțional)</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="ex: Prof. Ion Popescu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Parolă</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Alege o parolă"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmă parola</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirmă parola"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
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
                      Se creează contul...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Creează cont
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <button 
                  onClick={() => {
                    setView('login');
                    setCodeVerified(false);
                    setInvitationCode('');
                    setUsername('');
                    setPassword('');
                    setConfirmPassword('');
                    setFullName('');
                  }}
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

export default AuthProfesor;
