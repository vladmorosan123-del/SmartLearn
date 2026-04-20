import { useState, useEffect, useCallback } from 'react';
import { apiClient as supabase } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export interface Chapter {
  id: string;
  name: string;
  subject: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useChapters = (subject?: string) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchChapters = useCallback(async () => {
    if (!subject) {
      setChapters([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject', subject)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setChapters((data as Chapter[]) || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca capitolele.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [subject, toast]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const addChapter = async (name: string) => {
    if (!subject || !name.trim()) return null;
    try {
      const nextOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order_index)) + 1 : 0;
      const { data, error } = await supabase
        .from('chapters')
        .insert([{ name: name.trim(), subject, order_index: nextOrder }])
        .select()
        .single();

      if (error) throw error;
      setChapters(prev => [...prev, data as Chapter]);
      toast({ title: 'Capitol adăugat', description: `"${name}" a fost adăugat.` });
      return data as Chapter;
    } catch (error) {
      console.error('Error adding chapter:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga capitolul.', variant: 'destructive' });
      return null;
    }
  };

  const updateChapter = async (id: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setChapters(prev => prev.map(c => c.id === id ? (data as Chapter) : c));
      toast({ title: 'Capitol actualizat' });
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut actualiza capitolul.', variant: 'destructive' });
    }
  };

  const deleteChapter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setChapters(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Capitol șters', description: 'Lecțiile asociate au rămas, dar fără capitol.' });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge capitolul.', variant: 'destructive' });
    }
  };

  return { chapters, isLoading, fetchChapters, addChapter, updateChapter, deleteChapter };
};
