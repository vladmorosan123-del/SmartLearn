import { useState } from 'react';
import { Lock, Loader2, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiChangePassword } from '@/lib/api';
import { hashPassword } from '@/lib/hashPassword';

interface ChangePasswordDialogProps {
  trigger?: React.ReactNode;
}

const ChangePasswordDialog = ({ trigger }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Parola curentă este obligatorie';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Noua parolă este obligatorie';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Parola trebuie să aibă cel puțin 6 caractere';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Parola trebuie să conțină cel puțin o literă mare';
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Parola trebuie să conțină cel puțin un caracter special (!@#$%...)';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmarea parolei este obligatorie';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const hashedCurrent = await hashPassword(currentPassword);
      const hashedNew = await hashPassword(newPassword);
      
      const { error } = await apiChangePassword(hashedCurrent, hashedNew);

      if (error) {
        if (error.includes('incorectă')) {
          setErrors({ currentPassword: error });
        } else {
          toast({
            title: 'Eroare',
            description: error,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Parolă schimbată',
          description: 'Parola ta a fost actualizată cu succes!',
        });
        setOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      }
    } catch (err) {
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare. Încearcă din nou.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setErrors({}); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent">
            <KeyRound className="w-4 h-4 mr-2" />
            Schimbă parola
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gold" />
            Schimbare Parolă
          </DialogTitle>
          <DialogDescription>
            Introdu parola curentă și noua parolă
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Parola curentă</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Introdu parola curentă"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: undefined })); }}
                className={`pl-10 pr-10 ${errors.currentPassword ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPasswordDialog">Parola nouă</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="newPasswordDialog"
                type={showNewPassword ? "text" : "password"}
                placeholder="Introdu noua parolă"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined })); }}
                className={`pl-10 pr-10 ${errors.newPassword ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPasswordDialog">Confirmă parola</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPasswordDialog"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmă noua parolă"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
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
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
