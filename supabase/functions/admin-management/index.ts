import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCodeRequest {
  action: 'generate-code';
}

interface VerifyCodeRequest {
  action: 'verify-code';
  code: string;
}

interface UpdatePasswordRequest {
  action: 'update-password';
  targetUserId: string;
  newPassword: string;
}

interface UpdateUsernameRequest {
  action: 'update-username';
  targetUserId: string;
  newUsername: string;
}

interface DeleteUserRequest {
  action: 'delete-user';
  targetUserId: string;
}

interface BlockUserRequest {
  action: 'block-user';
  targetUserId: string;
  block: boolean;
}

interface GetAllUsersRequest {
  action: 'get-all-users';
}

interface RegisterProfessorRequest {
  action: 'register-professor';
  code: string;
  username: string;
  password: string;
  fullName?: string;
}

type AdminRequest = 
  | GenerateCodeRequest 
  | VerifyCodeRequest 
  | UpdatePasswordRequest 
  | UpdateUsernameRequest
  | DeleteUserRequest 
  | BlockUserRequest
  | GetAllUsersRequest
  | RegisterProfessorRequest;

// Generate random 6-character code
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const request: AdminRequest = await req.json();

    // Actions that don't require admin auth
    if (request.action === 'verify-code') {
      const { code } = request;
      
      // Use the secure database function to verify code without exposing sensitive data
      const { data, error } = await supabaseAdmin.rpc('verify_invitation_code', {
        _code: code
      });

      if (error) {
        console.error('Error verifying code:', error);
        return new Response(
          JSON.stringify({ valid: false, error: 'Eroare la verificarea codului' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0];
      if (!result || !result.is_valid) {
        return new Response(
          JSON.stringify({ valid: false, error: result?.error_message || 'Cod invalid sau deja folosit' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.action === 'register-professor') {
      const { code, username, password, fullName } = request;
      
      // Verify code first
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('invitation_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        return new Response(
          JSON.stringify({ error: 'Cod invalid sau deja folosit' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(codeData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Codul a expirat' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if username already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: 'Numele de utilizator este deja folosit' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user
      const email = `${username}@lm.local`;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError) {
        console.error('Error creating user:', userError);
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = userData.user.id;

      // Create profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        user_id: userId,
        username,
        full_name: fullName || username,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: profileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign profesor role
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role: 'profesor',
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        return new Response(
          JSON.stringify({ error: roleError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark code as used
      await supabaseAdmin
        .from('invitation_codes')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          used_by_user_id: userId,
        })
        .eq('id', codeData.id);

      console.log(`Professor ${username} registered successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cont de profesor creat cu succes'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All other actions require admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle admin actions
    switch (request.action) {
      case 'generate-code': {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        const { error } = await supabaseAdmin.from('invitation_codes').insert({
          code,
          expires_at: expiresAt.toISOString(),
          created_by_user_id: user.id,
        });

        if (error) {
          console.error('Error generating code:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Invitation code ${code} generated by admin ${user.id}`);

        return new Response(
          JSON.stringify({ code, expiresAt: expiresAt.toISOString() }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-all-users': {
        // Get all profiles with their roles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          return new Response(
            JSON.stringify({ error: profilesError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all roles
        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('*');

        if (rolesError) {
          return new Response(
            JSON.stringify({ error: rolesError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Merge data
        const users = profiles.map(profile => ({
          ...profile,
          role: roles.find(r => r.user_id === profile.user_id)?.role || 'student',
        }));

        return new Response(
          JSON.stringify({ users }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-password': {
        const { targetUserId, newPassword } = request;

        const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: newPassword,
        });

        if (error) {
          console.error('Error updating password:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Password updated for user ${targetUserId} by admin ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-username': {
        const { targetUserId, newUsername } = request;

        // Check if username is taken
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('username', newUsername)
          .neq('user_id', targetUserId)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Numele de utilizator este deja folosit' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update profile username
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ username: newUsername })
          .eq('user_id', targetUserId);

        if (profileError) {
          console.error('Error updating username:', profileError);
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update email too (for login purposes)
        const newEmail = `${newUsername}@lm.local`;
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          email: newEmail,
        });

        if (emailError) {
          console.error('Error updating email:', emailError);
          return new Response(
            JSON.stringify({ error: emailError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Username updated for user ${targetUserId} by admin ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-user': {
        const { targetUserId } = request;

        // Don't allow deleting yourself
        if (targetUserId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Nu poți șterge propriul cont' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

        if (error) {
          console.error('Error deleting user:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`User ${targetUserId} deleted by admin ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'block-user': {
        const { targetUserId, block } = request;

        // Don't allow blocking yourself
        if (targetUserId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Nu poți bloca propriul cont' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_blocked: block })
          .eq('user_id', targetUserId);

        if (error) {
          console.error('Error blocking user:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`User ${targetUserId} ${block ? 'blocked' : 'unblocked'} by admin ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
