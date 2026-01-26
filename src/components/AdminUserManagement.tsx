import { useState, useEffect } from 'react';
import { 
  Users, Key, UserX, Lock, Unlock, Pencil, Trash2, Copy, 
  CheckCircle, Loader2, AlertTriangle, RefreshCw, Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  is_blocked: boolean;
  created_at: string;
  role: 'student' | 'profesor' | 'admin';
}

interface GeneratedCode {
  code: string;
  expiresAt: string;
}

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // Dialog states
  const [editPasswordDialog, setEditPasswordDialog] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
  const [editUsernameDialog, setEditUsernameDialog] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
  
  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { action: 'get-all-users' },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca utilizatorii",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { action: 'generate-code' },
      });

      if (error) throw error;
      
      setGeneratedCode({
        code: data.code,
        expiresAt: data.expiresAt,
      });

      toast({
        title: "Cod generat",
        description: "Codul a fost generat cu succes",
      });
    } catch (err) {
      console.error('Error generating code:', err);
      toast({
        title: "Eroare",
        description: "Nu s-a putut genera codul",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      toast({
        title: "Copiat",
        description: "Codul a fost copiat în clipboard",
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!editPasswordDialog.user || !newPassword) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { 
          action: 'update-password',
          targetUserId: editPasswordDialog.user.user_id,
          newPassword,
        },
      });

      if (error || data.error) throw new Error(data?.error || error?.message);
      
      toast({
        title: "Succes",
        description: `Parola pentru ${editPasswordDialog.user.username} a fost schimbată`,
      });
      setEditPasswordDialog({ open: false, user: null });
      setNewPassword('');
    } catch (err: any) {
      toast({
        title: "Eroare",
        description: err.message || "Nu s-a putut schimba parola",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!editUsernameDialog.user || !newUsername) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { 
          action: 'update-username',
          targetUserId: editUsernameDialog.user.user_id,
          newUsername,
        },
      });

      if (error || data.error) throw new Error(data?.error || error?.message);
      
      toast({
        title: "Succes",
        description: `Numele de utilizator a fost schimbat în ${newUsername}`,
      });
      setEditUsernameDialog({ open: false, user: null });
      setNewUsername('');
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Eroare",
        description: err.message || "Nu s-a putut schimba numele",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async (user: UserWithRole, block: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { 
          action: 'block-user',
          targetUserId: user.user_id,
          block,
        },
      });

      if (error || data.error) throw new Error(data?.error || error?.message);
      
      toast({
        title: block ? "Cont blocat" : "Cont deblocat",
        description: `${user.username} a fost ${block ? 'blocat' : 'deblocat'}`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Eroare",
        description: err.message || "Operațiunea a eșuat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { 
          action: 'delete-user',
          targetUserId: deleteDialog.user.user_id,
        },
      });

      if (error || data.error) throw new Error(data?.error || error?.message);
      
      toast({
        title: "Cont șters",
        description: `Contul ${deleteDialog.user.username} a fost șters`,
      });
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Eroare",
        description: err.message || "Nu s-a putut șterge contul",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Admin</Badge>;
      case 'profesor':
        return <Badge className="bg-gold/20 text-gold border-gold/30">Profesor</Badge>;
      default:
        return <Badge variant="secondary">Elev</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Invitation Code */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Ticket className="w-6 h-6 text-gold" />
          <h3 className="font-display text-lg text-foreground">Generare Cod de Invitație</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Generează un cod de 6 caractere pentru ca un profesor să-și poată crea cont. Codul este valabil 1 oră.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="gold" 
            onClick={handleGenerateCode}
            disabled={isGeneratingCode}
          >
            {isGeneratingCode ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se generează...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Generează Cod Nou
              </>
            )}
          </Button>

          {generatedCode && (
            <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/20">
              <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                {generatedCode.code}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Expiră: {new Date(generatedCode.expiresAt).toLocaleTimeString('ro-RO')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-display text-lg text-foreground">Gestionare Utilizatori</h3>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reîmprospătează
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizator</TableHead>
                <TableHead>Nume</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.is_blocked ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge variant="destructive">Blocat</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Activ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ro-RO')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setNewUsername(user.username);
                          setEditUsernameDialog({ open: true, user });
                        }}
                        title="Schimbă utilizator"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditPasswordDialog({ open: true, user })}
                        title="Schimbă parola"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleBlockUser(user, !user.is_blocked)}
                        title={user.is_blocked ? 'Deblochează' : 'Blochează'}
                        disabled={user.role === 'admin'}
                      >
                        {user.is_blocked ? (
                          <Unlock className="w-4 h-4 text-primary" />
                        ) : (
                          <Lock className="w-4 h-4 text-gold" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, user })}
                        className="text-destructive hover:text-destructive"
                        disabled={user.role === 'admin'}
                        title="Șterge cont"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nu există utilizatori înregistrați
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Password Dialog */}
      <Dialog open={editPasswordDialog.open} onOpenChange={(open) => {
        if (!open) {
          setEditPasswordDialog({ open: false, user: null });
          setNewPassword('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schimbă Parola</DialogTitle>
            <DialogDescription>
              Introdu noua parolă pentru {editPasswordDialog.user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Noua parolă</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minim 6 caractere"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditPasswordDialog({ open: false, user: null })}>
                Anulează
              </Button>
              <Button 
                variant="gold" 
                onClick={handleUpdatePassword}
                disabled={actionLoading || newPassword.length < 6}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Username Dialog */}
      <Dialog open={editUsernameDialog.open} onOpenChange={(open) => {
        if (!open) {
          setEditUsernameDialog({ open: false, user: null });
          setNewUsername('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schimbă Numele de Utilizator</DialogTitle>
            <DialogDescription>
              Introdu noul nume pentru {editUsernameDialog.user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Noul nume de utilizator</Label>
              <Input
                id="new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Minim 3 caractere"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUsernameDialog({ open: false, user: null })}>
                Anulează
              </Button>
              <Button 
                variant="gold" 
                onClick={handleUpdateUsername}
                disabled={actionLoading || newUsername.length < 3}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!open) setDeleteDialog({ open: false, user: null });
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmare Ștergere
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi contul <strong>{deleteDialog.user?.username}</strong>? 
              Această acțiune este ireversibilă și toate datele asociate vor fi pierdute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Șterge Contul'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserManagement;
