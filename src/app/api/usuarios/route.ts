import { requireAdmin } from "@/lib/supabase-admin";
import { emailFromNome } from "@/lib/email-nome";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.msg }, { status: guard.status });
  const sb = guard.sb;

  const body = await req.json().catch(() => null);
  const nome = String(body?.nome ?? "").trim();
  const senha = String(body?.senha ?? "");
  const is_admin = !!body?.is_admin;
  const permissoes: string[] = Array.isArray(body?.permissoes) ? body.permissoes : [];

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
    return Response.json({ error: error?.message ?? "Erro ao criar usuário." }, { status: 400 });
  }

  const { error: e2 } = await sb.from("usuarios").insert({
    id: created.user.id,
    nome,
    email,
    is_admin,
    permissoes,
    must_change_password: true,
    ativo: true,
  });
  if (e2) {
    await sb.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: e2.message }, { status: 400 });
  }

  return Response.json({ id: created.user.id });
}
