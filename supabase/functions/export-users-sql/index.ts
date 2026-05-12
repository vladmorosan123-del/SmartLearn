import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // List all auth users (paginate)
  const all: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
    all.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  // We also need encrypted_password — admin API does NOT return it.
  // So we read it via a SECURITY DEFINER RPC (created in migration).
  const { data: pwRows, error: pwErr } = await supabase.rpc("export_auth_passwords");
  if (pwErr) return new Response(JSON.stringify({ error: pwErr.message }), { status: 500, headers: cors });
  const pwMap = new Map<string, string>();
  for (const r of pwRows as any[]) pwMap.set(r.id, r.encrypted_password);

  const esc = (s: string) => s.replace(/'/g, "''");
  const lines: string[] = [];
  lines.push("-- Exported users for SmartLearning self-hosted server");
  lines.push("-- Target table: public.users (id, email, password_hash, email_confirmed, created_at, updated_at)");
  lines.push("BEGIN;");
  for (const u of all) {
    const pw = pwMap.get(u.id) ?? "";
    if (!pw) continue;
    const confirmed = !!u.email_confirmed_at;
    lines.push(
      `INSERT INTO users (id, email, password_hash, email_confirmed, created_at, updated_at) VALUES ('${u.id}', '${esc(u.email ?? "")}', '${esc(pw)}', ${confirmed}, '${u.created_at}', '${u.updated_at ?? u.created_at}') ON CONFLICT (id) DO NOTHING;`
    );
  }
  lines.push("COMMIT;");

  return new Response(lines.join("\n"), {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
  });
});
