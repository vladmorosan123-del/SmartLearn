import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHasSubmission = (materialId: string | undefined) => {
  const [hasSubmission, setHasSubmission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubmission = async () => {
      if (!materialId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { count, error } = await supabase
          .from('tvc_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('material_id', materialId)
          .eq('user_id', user.id);

        if (!error && count !== null) {
          setHasSubmission(count > 0);
        }
      } catch (err) {
        console.error('Error checking submission:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubmission();
  }, [materialId]);

  return { hasSubmission, isLoading };
};

// Hook to check submissions for multiple materials at once
export const useHasSubmissions = (materialIds: string[]) => {
  const [submissions, setSubmissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubmissions = async () => {
      if (materialIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('tvc_submissions')
          .select('material_id')
          .eq('user_id', user.id)
          .in('material_id', materialIds);

        if (!error && data) {
          const submissionMap: Record<string, boolean> = {};
          materialIds.forEach(id => {
            submissionMap[id] = data.some(s => s.material_id === id);
          });
          setSubmissions(submissionMap);
        }
      } catch (err) {
        console.error('Error checking submissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubmissions();
  }, [materialIds.join(',')]);

  return { submissions, isLoading };
};
