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

interface VerifyQuizRequest {
  materialId: string;
  answers: string[];
  timeSpentSeconds: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create admin client to access answer_key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Trebuie să fii autentificat' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify user
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Autentificare invalidă' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: VerifyQuizRequest = await req.json();
    const { materialId, answers, timeSpentSeconds } = request;

    // Validate input
    if (!materialId || !answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: 'Date invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the answer key from the material (using admin client to bypass RLS)
    const { data: material, error: materialError } = await supabaseAdmin
      .from('materials')
      .select('answer_key, title')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      console.error('Error fetching material:', materialError);
      return new Response(
        JSON.stringify({ error: 'Materialul nu a fost găsit' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const answerKey = material.answer_key as string[] | null;
    if (!answerKey || !Array.isArray(answerKey)) {
      return new Response(
        JSON.stringify({ error: 'Acest material nu are cheie de răspunsuri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate answers array length
    if (answers.length !== answerKey.length) {
      return new Response(
        JSON.stringify({ error: 'Număr incorect de răspunsuri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate results
    const results = answers.map((answer, index) => ({
      questionIndex: index,
      userAnswer: answer,
      correctAnswer: answerKey[index],
      isCorrect: answer === answerKey[index],
    }));

    const score = results.filter(r => r.isCorrect).length;
    const totalQuestions = answerKey.length;

    // Save submission to database
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
      // Continue anyway - we still want to return results
    }

    console.log(`Quiz verified for user ${user.id}: ${score}/${totalQuestions} on material ${materialId}`);

    return new Response(
      JSON.stringify({
        success: true,
        score,
        totalQuestions,
        results,
        timeSpentSeconds,
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
