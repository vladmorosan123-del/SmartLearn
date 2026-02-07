import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-supabase-client-platform',
    'x-supabase-client-platform-version',
    'x-supabase-client-runtime',
    'x-supabase-client-runtime-version',
  ].join(', '),
};

const SUBJECT_WEIGHTS: Record<string, number> = {
  matematica: 0.5,
  informatica: 0.3,
  fizica: 0.2,
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Trebuie să fii autentificat' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Autentificare invalidă' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request = await req.json();
    const { materialId, answers, timeSpentSeconds, isMultiSubject, multiSubjectAnswers } = request;

    if (!materialId) {
      return new Response(
        JSON.stringify({ error: 'Date invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get material data
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('answer_key, title, oficiu, subject_config')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      console.error('Error fetching material:', materialError);
      return new Response(
        JSON.stringify({ error: 'Materialul nu a fost găsit' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== MULTI-SUBJECT MODE =====
    if (isMultiSubject && multiSubjectAnswers && material.subject_config) {
      const subjectConfig = material.subject_config as Record<string, { questionCount: number; answerKey: string[]; oficiu: number }>;
      const subjectResults: any[] = [];
      let totalScore = 0;
      let totalQuestions = 0;

      for (const [subject, config] of Object.entries(subjectConfig)) {
        const userAnswersForSubject = multiSubjectAnswers[subject] || [];
        const answerKey = config.answerKey || [];
        
        const results = answerKey.map((correct: string, index: number) => ({
          questionIndex: index,
          userAnswer: userAnswersForSubject[index] || '',
          correctAnswer: correct,
          isCorrect: (userAnswersForSubject[index] || '') === correct,
        }));

        const score = results.filter((r: any) => r.isCorrect).length;
        const oficiu = config.oficiu || 0;
        const baseGrade = score;
        const finalGrade = baseGrade + oficiu;

        subjectResults.push({
          subject,
          score,
          totalQuestions: answerKey.length,
          oficiu,
          baseGrade,
          finalGrade,
          results,
        });

        totalScore += score;
        totalQuestions += answerKey.length;
      }

      // Calculate weighted average
      let weightedAverage = 0;
      for (const result of subjectResults) {
        const weight = SUBJECT_WEIGHTS[result.subject] || 0;
        weightedAverage += result.finalGrade * weight;
      }

      // Save submission
      const allAnswers = Object.values(multiSubjectAnswers).flat();
      const { error: insertError } = await supabaseAdmin.from('tvc_submissions').insert({
        user_id: user.id,
        material_id: materialId,
        answers: multiSubjectAnswers,
        score: totalScore,
        total_questions: totalQuestions,
        time_spent_seconds: timeSpentSeconds,
      });

      if (insertError) {
        console.error('Error saving submission:', insertError);
      }

      console.log(`Multi-subject quiz verified for user ${user.id} on material ${materialId}. Weighted average: ${weightedAverage.toFixed(2)}`);

      return new Response(
        JSON.stringify({
          success: true,
          isMultiSubject: true,
          subjectResults,
          weightedAverage,
          totalScore,
          totalQuestions,
          timeSpentSeconds,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== SINGLE-SUBJECT MODE (legacy) =====
    if (!answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: 'Date invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const answerKey = material.answer_key as string[] | null;
    if (!answerKey || !Array.isArray(answerKey)) {
      return new Response(
        JSON.stringify({ error: 'Acest material nu are cheie de răspunsuri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (answers.length !== answerKey.length) {
      return new Response(
        JSON.stringify({ error: 'Număr incorect de răspunsuri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = answers.map((answer: string, index: number) => ({
      questionIndex: index,
      userAnswer: answer,
      correctAnswer: answerKey[index],
      isCorrect: answer === answerKey[index],
    }));

    const score = results.filter((r: any) => r.isCorrect).length;
    const totalQuestions = answerKey.length;
    const oficiu = material.oficiu || 0;
    const baseGrade = score;
    const finalGrade = baseGrade + oficiu;

    const { error: insertError } = await supabaseAdmin.from('tvc_submissions').insert({
      user_id: user.id,
      material_id: materialId,
      answers: answers,
      score,
      total_questions: totalQuestions,
      time_spent_seconds: timeSpentSeconds,
    });

    if (insertError) {
      console.error('Error saving submission:', insertError);
    }

    console.log(`Quiz verified for user ${user.id}: ${score}/${totalQuestions} on material ${materialId}. Base grade: ${baseGrade}, Oficiu: ${oficiu}, Final: ${finalGrade}`);

    return new Response(
      JSON.stringify({
        success: true,
        score,
        totalQuestions,
        results,
        timeSpentSeconds,
        oficiu,
        baseGrade,
        finalGrade,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Eroare internă a serverului' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
