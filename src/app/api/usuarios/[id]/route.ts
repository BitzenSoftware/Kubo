import { requireAdmin } from "@/lib/supabase-admin";
import { emailFromNome } from "@/lib/email-nome";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.msg }, { status: guard.status });
  const sb = guard.sb;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const patch: Record<string, unknown> = {};
  if (typeof body?.nome === "string") {
    patch.nome = body.nome.trim();
    patch.email = emailFromNome(body.nome);
  }
  if (typeof body?.is_admin === "boolean") patch.is_admin = body.is_admin;
  if (Array.isArray(body?.permissoes)) patch.permissoes = body.permissoes;
  if (typeof body?.ativo === "boolean") patch.ativo = body.ativo;

  // Atualiza auth.users (e-mail e/ou senha)
  const authPatch: { email?: string; password?: string } = {};
  if (patch.email) authPatch.email = patch.email as string;
  const senha = body?.senha ? String(body.senha) : "";
  if (senha) {
    if (senha.length < 6)
      return Response.json({ error: "Senha muito curta (mín. 6)." }, { status: 400 });
    authPatch.password = senha;
    patch.must_change_password = true;
  }
  if (Object.keys(authPatch).length) {
    const { error } = await sb.auth.admin.updateUserById(id, authPatch);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  if (Object.keys(patch).length) {
    const { error } = await sb.from("usuarios").update(patch).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.msg }, { status: guard.status });
  const { id } = await params;
  const { error } = await guard.sb.auth.admin.deleteUser(id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
