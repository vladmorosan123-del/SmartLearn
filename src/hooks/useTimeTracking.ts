import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseTimeTrackingProps {
  materialId: string;
  category: 'lectie' | 'bac' | 'tvc';
}

export const useTimeTracking = ({ materialId, category }: UseTimeTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewIdRef = useRef<string | null>(null);

  const startTracking = useCallback(async () => {
    if (isTracking) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    startTimeRef.current = new Date();
    setIsTracking(true);

    // Only track lesson_views for lessons, not for TVC (which has tvc_submissions)
    if (category === 'lectie' || category === 'bac') {
      // Create a view record
      const { data, error } = await supabase.from('lesson_views').insert({
        user_id: user.id,
        material_id: materialId,
        view_started_at: startTimeRef.current.toISOString(),
      }).select('id').single();

      if (!error && data) {
        viewIdRef.current = data.id;
      }
    }

    // Start elapsed time counter
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);
  }, [isTracking, materialId, category]);

  const stopTracking = useCallback(async () => {
    if (!isTracking || !startTimeRef.current) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update the view record with end time and duration
    if (viewIdRef.current && (category === 'lectie' || category === 'bac')) {
      await supabase.from('lesson_views').update({
        view_ended_at: endTime.toISOString(),
        time_spent_seconds: timeSpent,
      }).eq('id', viewIdRef.current);
    }

    setIsTracking(false);
    startTimeRef.current = null;
    viewIdRef.current = null;

    return timeSpent;
  }, [isTracking, category]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save time when component unmounts
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        stopTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTracking, stopTracking]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isTracking,
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    startTracking,
    stopTracking,
  };
};
