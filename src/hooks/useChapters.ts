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
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChapters((data || []) as Chapter[]);
    } catch (error: any) {
      console.error('Error fetching chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const addChapter = async (name: string) => {
    if (!subject || !name.trim()) return null;
    try {
      const nextOrder = chapters.length;
      const { data, error } = await supabase
        .from('chapters')
        .insert([{ name: name.trim(), subject, order_index: nextOrder }])
        .select()
        .single();

      if (error) throw error;
      setChapters((prev) => [...prev, data as Chapter]);
      toast({ title: 'Capitol adăugat', description: `Capitolul "${name}" a fost creat.` });
      return data as Chapter;
    } catch (error: any) {
      console.error('Error adding chapter:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga capitolul.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const renameChapter = async (id: string, name: string) => {
    if (!name.trim()) return;
    try {
      const { data, error } = await supabase
        .from('chapters')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setChapters((prev) => prev.map((c) => (c.id === id ? (data as Chapter) : c)));
      }
    } catch (error: any) {
      console.error('Error renaming chapter:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut redenumi capitolul.',
        variant: 'destructive',
      });
    }
  };

  const deleteChapter = async (id: string) => {
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw error;
      setChapters((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: 'Capitol șters',
        description: 'Lecțiile din acest capitol au rămas necategorisite.',
      });
    } catch (error: any) {
      console.error('Error deleting chapter:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge capitolul.',
        variant: 'destructive',
      });
    }
  };

  return { chapters, isLoading, fetchChapters, addChapter, renameChapter, deleteChapter };
};
