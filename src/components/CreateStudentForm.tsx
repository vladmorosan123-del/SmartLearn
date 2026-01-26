import { useState } from 'react';
import { UserPlus, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateStudentFormProps {
  onStudentCreated?: () => void;
}

const CreateStudentForm = ({ onStudentCreated }: CreateStudentFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: 'Eroare',
        description: 'Username-ul și parola sunt obligatorii.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Eroare',
        description: 'Parola trebuie să aibă cel puțin 6 caractere.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setCreatedUser(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username,
          password,
          fullName: fullName || username,
          role: 'student',
        },
      });

      if (error) {
        console.error('Error creating student:', error);
        toast({
          title: 'Eroare',
          description: error.message || 'Nu s-a putut crea contul.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.error) {
        toast({
          title: 'Eroare',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setCreatedUser(username);
      toast({
        title: 'Succes!',
        description: `Contul pentru ${username} a fost creat cu succes.`,
      });

      // Reset form
      setUsername('');
      setPassword('');
      setFullName('');
      
      onStudentCreated?.();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Creează Cont Elev</h3>
          <p className="text-sm text-muted-foreground">Adaugă un cont nou pentru un elev</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nume de utilizator *</Label>
          <Input
            id="username"
            type="text"
            placeholder="ex: ion.popescu"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '.'))}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Elevul se va autentifica cu acest nume de utilizator
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nume complet</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="ex: Ion Popescu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Parolă *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Cel puțin 6 caractere"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="gold" 
          className="w-full gap-2"
          disabled={isLoading || !username || !password}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Se creează...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Creează Cont
            </>
          )}
        </Button>
      </form>

      {createdUser && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <Check className="w-5 h-5" />
            <span className="font-medium">Cont creat cu succes!</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Elevul <strong>{createdUser}</strong> se poate autentifica acum cu username-ul și parola setate.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateStudentForm;
