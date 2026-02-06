import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

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
  timer_minutes?: number | null;
  has_answer_key?: boolean;
  publish_at?: string | null;
  subject_config?: Record<string, { questionCount: number; answerKey: string[]; oficiu: number; files?: Array<{ url: string; name: string; type: string; size: number }>; fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number }> | null;
  created_at: string;
  updated_at: string;
}

interface UseMaterialsProps {
  subject?: string;
  category: string;
}

export const useMaterials = ({ subject, category }: UseMaterialsProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { role: authRole } = useAuthContext();
  const { role: appRole } = useApp();
  
  // Use whichever role source has resolved — authRole from DB, or appRole from localStorage
  const effectiveRole = authRole || appRole;
  const isPrivilegedUser = effectiveRole === 'profesor' || effectiveRole === 'admin';

  // Helper to convert Supabase data to Material type
  // For non-privileged users, we hide the actual answer_key but indicate if it exists
  const mapToMaterial = (data: any, hideAnswerKey: boolean): Material => {
    // Robustly parse answer_key from JSONB — handle string, array, or other forms
    let parsedAnswerKey: string[] | null = null;
    if (data.answer_key != null) {
      try {
        const raw = typeof data.answer_key === 'string' ? JSON.parse(data.answer_key) : data.answer_key;
        if (Array.isArray(raw) && raw.length > 0) {
          parsedAnswerKey = raw.map((v: any) => String(v ?? ''));
        }
      } catch {
        parsedAnswerKey = null;
      }
    }

    const hasAnswerKey = (parsedAnswerKey !== null && parsedAnswerKey.length > 0) ||
      (data.subject_config && Object.values(data.subject_config as Record<string, any>).some(
        (cfg: any) => Array.isArray(cfg.answerKey) && cfg.answerKey.some((a: string) => a !== '')
      ));
    
    return {
      ...data,
      answer_key: hideAnswerKey ? null : parsedAnswerKey,
      subject_config: hideAnswerKey ? null : (data.subject_config || null),
      has_answer_key: hasAnswerKey,
    };
  };

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (isPrivilegedUser) {
        let query = supabase
          .from('materials')
          .select('*')
          .eq('category', category);
        
        // Only filter by subject if provided
        if (subject) {
          query = query.eq('subject', subject);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setMaterials((data || []).map(d => mapToMaterial(d, false)));
      } else {
        // Students use a backend function that returns materials WITHOUT answer_key
        // (prevents exposing answer_key while keeping the base table SELECT locked down)
        const { data, error } = await supabase.rpc('get_materials_for_students');
        if (error) throw error;

        const filtered = (data || [])
          .filter((m: any) => m.category === category)
          .filter((m: any) => (subject ? m.subject === subject : true))
          .sort((a: any, b: any) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

        // For students, also fetch question count securely via RPC
        const materialsWithQuestionCount = await Promise.all(
          filtered.map(async (material: any) => {
            const { data: questionCount } = await supabase
              .rpc('get_material_question_count', { _material_id: material.id });
            
            // subject_config is returned from RPC (with answerKey stripped for security)
            // but we need to keep it so TVCTimerComplet knows about multi-subject structure
            return {
              ...material,
              answer_key: null,
              subject_config: material.subject_config || null,
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
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // When updating, we're a privileged user, so don't hide answer_key
        setMaterials(prev => prev.map(m => m.id === id ? mapToMaterial(data, false) : m));
        return mapToMaterial(data, false);
      }
      
      // Refresh materials if no data returned
      await fetchMaterials();
      return null;
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
