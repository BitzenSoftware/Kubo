import { adminClient } from "@/lib/supabase-admin";
import { emailFromNome } from "@/lib/email-nome";

/**
 * Cria o PRIMEIRO usuário admin — só funciona enquanto não houver nenhum
 * usuário cadastrado (uso único para inicializar o sistema).
 */
export async function POST(req: Request) {
  const sb = adminClient();
  const { count, error: countErr } = await sb
    .from("usuarios")
    .select("*", { count: "exact", head: true });
  if (countErr) return Response.json({ error: countErr.message }, { status: 400 });
  if ((count ?? 0) > 0) {
    return Response.json({ error: "Já existem usuários cadastrados." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const nome = String(body?.nome ?? "").trim();
  const senha = String(body?.senha ?? "");
  if (!nome || senha.length < 6) {
    return Response.json(
      { error: "Informe o nome e uma senha de pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const email = emailFromNome(nome);
  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error || !created.user) {
    return Response.json({ error: error?.message ?? "Erro ao criar admin." }, { status: 400 });
  }

  const { error: e2 } = await sb.from("usuarios").insert({
    id: created.user.id,
    nome,
    email,
    is_admin: true,
    permissoes: [],
    must_change_password: false,
    ativo: true,
  });
  if (e2) {
    await sb.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: e2.message }, { status: 400 });
  }

  return Response.json({ ok: true, nome, email });
}
