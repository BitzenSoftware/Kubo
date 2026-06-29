import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente Supabase com a service role (somente no servidor). */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no servidor.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type Guard =
  | { ok: true; sb: SupabaseClient }
  | { ok: false; status: number; msg: string };

/** Valida o token Bearer e exige que o chamador seja admin. */
export async function requireAdmin(req: Request): Promise<Guard> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { ok: false, status: 401, msg: "Sem token." };
  const sb = adminClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user)
    return { ok: false, status: 401, msg: "Token inválido." };
  const { data: perfil } = await sb
    .from("usuarios")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!perfil?.is_admin)
    return { ok: false, status: 403, msg: "Apenas administradores." };
  return { ok: true, sb };
}
