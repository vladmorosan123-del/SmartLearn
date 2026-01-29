import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

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
  answer_key?: string[] | null;
  oficiu?: number | null;
  has_answer_key?: boolean; // New field to indicate if answer key exists without exposing it
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
  const { role } = useAuthContext();
  
  const isPrivilegedUser = role === 'profesor' || role === 'admin';

  // Helper to convert Supabase data to Material type
  // For non-privileged users, we hide the actual answer_key but indicate if it exists
  const mapToMaterial = (data: any, hideAnswerKey: boolean): Material => {
    const hasAnswerKey = Array.isArray(data.answer_key) && data.answer_key.length > 0;
    
    return {
      ...data,
      // Only include actual answer_key for privileged users
      answer_key: hideAnswerKey ? null : (Array.isArray(data.answer_key) ? data.answer_key : null),
      // Always indicate if answer key exists (for UI display)
      has_answer_key: hasAnswerKey,
    };
  };

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use materials_public view for non-privileged users to hide answer_key at database level
      // Privileged users (professors/admins) can access the full materials table
      if (isPrivilegedUser) {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('subject', subject)
          .eq('category', category)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMaterials((data || []).map(d => mapToMaterial(d, false)));
      } else {
        // Students use the secure view that excludes answer_key
        const { data, error } = await supabase
          .from('materials_public')
          .select('*')
          .eq('subject', subject)
          .eq('category', category)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // For students, also fetch question count securely via RPC
        const materialsWithQuestionCount = await Promise.all(
          (data || []).map(async (material) => {
            const { data: questionCount } = await supabase
              .rpc('get_material_question_count', { _material_id: material.id });
            return {
              ...material,
              answer_key: null,
              has_answer_key: (questionCount || 0) > 0,
            };
          })
        );
        
        setMaterials(materialsWithQuestionCount as Material[]);
      }
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
  }, [subject, category, toast, isPrivilegedUser]);

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
      
      // When adding, we're a privileged user, so don't hide answer_key
      setMaterials(prev => [mapToMaterial(data, false), ...prev]);
      return mapToMaterial(data, false);
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
      
      // When updating, we're a privileged user, so don't hide answer_key
      setMaterials(prev => prev.map(m => m.id === id ? mapToMaterial(data, false) : m));
      return mapToMaterial(data, false);
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
