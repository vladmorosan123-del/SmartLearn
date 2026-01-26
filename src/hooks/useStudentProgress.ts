import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentProgress {
  userId: string;
  username: string;
  fullName: string | null;
  totalTests: number;
  averageScore: number;
  totalTimeSpent: number; // in seconds
  averageTimePerTest: number; // in seconds
  totalLessonsViewed: number;
  averageTimePerLesson: number; // in seconds
  subjectBreakdown: Record<string, {
    tests: number;
    avgScore: number;
    lessonsViewed: number;
    totalTime: number;
  }>;
}

interface ProgressStats {
  averageTimePerTest: number;
  averageTimePerLesson: number;
  averageScore: number;
  totalActiveStudents: number;
}

export const useStudentProgress = () => {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    averageTimePerTest: 0,
    averageTimePerLesson: 0,
    averageScore: 0,
    totalActiveStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      if (!profiles) {
        setIsLoading(false);
        return;
      }

      // Fetch all TVC submissions with material info
      const { data: submissions } = await supabase
        .from('tvc_submissions')
        .select(`
          *,
          materials:material_id (subject)
        `);

      // Fetch all lesson views with material info
      const { data: lessonViews } = await supabase
        .from('lesson_views')
        .select(`
          *,
          materials:material_id (subject, category)
        `);

      const studentProgressMap = new Map<string, StudentProgress>();

      // Initialize progress for each student
      profiles.forEach((profile) => {
        studentProgressMap.set(profile.user_id, {
          userId: profile.user_id,
          username: profile.username,
          fullName: profile.full_name,
          totalTests: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          averageTimePerTest: 0,
          totalLessonsViewed: 0,
          averageTimePerLesson: 0,
          subjectBreakdown: {},
        });
      });

      // Process TVC submissions
      let totalTestTime = 0;
      let totalTestCount = 0;
      let totalScore = 0;

      submissions?.forEach((submission) => {
        const progress = studentProgressMap.get(submission.user_id);
        if (!progress) return;

        const subject = (submission.materials as any)?.subject || 'unknown';
        const timeSpent = submission.time_spent_seconds || 0;
        const scorePercent = (submission.score / submission.total_questions) * 100;

        progress.totalTests++;
        progress.totalTimeSpent += timeSpent;
        totalTestTime += timeSpent;
        totalTestCount++;
        totalScore += scorePercent;

        // Update subject breakdown
        if (!progress.subjectBreakdown[subject]) {
          progress.subjectBreakdown[subject] = {
            tests: 0,
            avgScore: 0,
            lessonsViewed: 0,
            totalTime: 0,
          };
        }
        progress.subjectBreakdown[subject].tests++;
        progress.subjectBreakdown[subject].totalTime += timeSpent;
        progress.subjectBreakdown[subject].avgScore = 
          (progress.subjectBreakdown[subject].avgScore * (progress.subjectBreakdown[subject].tests - 1) + scorePercent) / 
          progress.subjectBreakdown[subject].tests;
      });

      // Process lesson views
      let totalLessonTime = 0;
      let totalLessonCount = 0;

      lessonViews?.forEach((view) => {
        const progress = studentProgressMap.get(view.user_id);
        if (!progress) return;

        const subject = (view.materials as any)?.subject || 'unknown';
        const timeSpent = view.time_spent_seconds || 0;

        progress.totalLessonsViewed++;
        progress.totalTimeSpent += timeSpent;
        totalLessonTime += timeSpent;
        totalLessonCount++;

        // Update subject breakdown
        if (!progress.subjectBreakdown[subject]) {
          progress.subjectBreakdown[subject] = {
            tests: 0,
            avgScore: 0,
            lessonsViewed: 0,
            totalTime: 0,
          };
        }
        progress.subjectBreakdown[subject].lessonsViewed++;
        progress.subjectBreakdown[subject].totalTime += timeSpent;
      });

      // Calculate averages for each student
      studentProgressMap.forEach((progress) => {
        if (progress.totalTests > 0) {
          // Calculate average score from submissions
          const studentSubmissions = submissions?.filter(s => s.user_id === progress.userId) || [];
          const totalStudentScore = studentSubmissions.reduce((sum, s) => 
            sum + (s.score / s.total_questions) * 100, 0);
          progress.averageScore = totalStudentScore / progress.totalTests;
          
          // Calculate average time per test
          const studentTestTime = studentSubmissions.reduce((sum, s) => 
            sum + (s.time_spent_seconds || 0), 0);
          progress.averageTimePerTest = studentTestTime / progress.totalTests;
        }

        if (progress.totalLessonsViewed > 0) {
          const studentLessons = lessonViews?.filter(l => l.user_id === progress.userId) || [];
          const studentLessonTime = studentLessons.reduce((sum, l) => 
            sum + (l.time_spent_seconds || 0), 0);
          progress.averageTimePerLesson = studentLessonTime / progress.totalLessonsViewed;
        }
      });

      const studentsArray = Array.from(studentProgressMap.values());
      const activeStudents = studentsArray.filter(s => s.totalTests > 0 || s.totalLessonsViewed > 0);

      setStudents(studentsArray);
      setStats({
        averageTimePerTest: totalTestCount > 0 ? totalTestTime / totalTestCount : 0,
        averageTimePerLesson: totalLessonCount > 0 ? totalLessonTime / totalLessonCount : 0,
        averageScore: totalTestCount > 0 ? totalScore / totalTestCount : 0,
        totalActiveStudents: activeStudents.length,
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}min`;
  };

  return {
    students,
    stats,
    isLoading,
    refetch: fetchProgress,
    formatTime,
  };
};
