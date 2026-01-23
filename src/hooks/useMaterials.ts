import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  subject: string;
  category: string;
  lesson_number: number | null;
  author: string | null;
  genre: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
}

interface UseMaterialsProps {
  subject: string;
  category: string;
}

export const useMaterials = ({ subject, category }: UseMaterialsProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('subject', subject)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca materialele.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [subject, category, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addMaterial = async (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();

      if (error) throw error;
      
      setMaterials(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error adding material:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga materialul.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<Material>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setMaterials(prev => prev.map(m => m.id === id ? data : m));
      return data;
    } catch (error: any) {
      console.error('Error updating material:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza materialul.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteMaterial = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/materials/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('materials').remove([filePath]);
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMaterials(prev => prev.filter(m => m.id !== id));
      
      toast({
        title: 'Șters',
        description: 'Materialul a fost șters cu succes.',
      });
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge materialul.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    materials,
    isLoading,
    fetchMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  };
};
