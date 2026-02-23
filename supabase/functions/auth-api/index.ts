import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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

    const body = await req.json();
    const { action } = body;

    // ─── LOGIN ───
    if (action === 'login') {
      const { username, password } = body;
      if (!username || !password) {
        return jsonResponse({ error: 'Username și parola sunt obligatorii' }, 400);
      }

      const email = `${username}@lm.local`;

      // Sign in using admin client to get tokens
      const supabaseAnon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return jsonResponse({ error: 'Nume de utilizator sau parolă incorectă' }, 401);
      }

      const userId = signInData.user.id;

      // Check if blocked
      const { data: isBlocked } = await supabaseAdmin.rpc('is_user_blocked', { _user_id: userId });
      if (isBlocked) {
        return jsonResponse({ error: 'Contul tău este blocat' }, 403);
      }

      // Fetch profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, username, full_name')
        .eq('user_id', userId)
        .single();

      // Fetch role
      const { data: role } = await supabaseAdmin.rpc('get_user_role', { _user_id: userId });

      return jsonResponse({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user: { id: userId, email },
        profile,
        role,
      });
    }

    // ─── REFRESH ───
    if (action === 'refresh') {
      const { refresh_token } = body;
      if (!refresh_token) {
        return jsonResponse({ error: 'Refresh token lipsă' }, 400);
      }

      const supabaseAnon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: refreshData, error: refreshError } = await supabaseAnon.auth.refreshSession({
        refresh_token,
      });

      if (refreshError || !refreshData.session) {
        return jsonResponse({ error: 'Sesiune expirată, re-autentifică-te' }, 401);
      }

      const userId = refreshData.user!.id;

      // Check if blocked
      const { data: isBlocked } = await supabaseAdmin.rpc('is_user_blocked', { _user_id: userId });
      if (isBlocked) {
        return jsonResponse({ error: 'Contul tău este blocat' }, 403);
      }

      // Fetch profile & role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, username, full_name')
        .eq('user_id', userId)
        .single();

      const { data: role } = await supabaseAdmin.rpc('get_user_role', { _user_id: userId });

      return jsonResponse({
        access_token: refreshData.session.access_token,
        refresh_token: refreshData.session.refresh_token,
        user: { id: userId, email: refreshData.user!.email },
        profile,
        role,
      });
    }

    // ─── Authenticated actions below ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    if (claimsError || !claimsData.user) {
      return jsonResponse({ error: 'Token invalid' }, 401);
    }

    const userId = claimsData.user.id;

    // ─── GET PROFILE ───
    if (action === 'get-profile') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, username, full_name')
        .eq('user_id', userId)
        .single();

      const { data: role } = await supabaseAdmin.rpc('get_user_role', { _user_id: userId });

      // Check if blocked
      const { data: isBlocked } = await supabaseAdmin.rpc('is_user_blocked', { _user_id: userId });
      if (isBlocked) {
        return jsonResponse({ error: 'Contul tău este blocat' }, 403);
      }

      return jsonResponse({ profile, role });
    }

    // ─── CHANGE PASSWORD ───
    if (action === 'change-password') {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return jsonResponse({ error: 'Parolele sunt obligatorii' }, 400);
      }

      // Verify current password
      const email = claimsData.user.email!;
      const supabaseAnon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: verifyError } = await supabaseAnon.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        return jsonResponse({ error: 'Parola curentă este incorectă' }, 400);
      }

      // Update password via admin
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 400);
      }

      return jsonResponse({ success: true });
    }

    // ─── SIGN OUT ───
    if (action === 'sign-out') {
      // Server-side sign out using admin
      await supabaseAdmin.auth.admin.signOut(token, 'global');
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);

  } catch (err) {
    console.error('Auth API error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
