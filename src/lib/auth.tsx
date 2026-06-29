"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "./supabase";
import { emailFromNome } from "./email-nome";

export type Usuario = {
  id: string;
  nome: string;
  is_admin: boolean;
  must_change_password: boolean;
  permissoes: string[];
  ativo: boolean;
};

type AuthCtx = {
  user: Usuario | null;
  loading: boolean;
  login: (nome: string, senha: string) => Promise<string | null>;
  logout: () => Promise<void>;
  changePassword: (novaSenha: string) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function fetchPerfil(id: string): Promise<Usuario | null> {
  const { data } = await getSupabase()
    .from("usuarios")
    .select("id, nome, is_admin, must_change_password, permissoes, ativo")
    .eq("id", id)
    .maybeSingle();
  return (data as Usuario | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFromSession() {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    if (data.session?.user) {
      setUser(await fetchPerfil(data.session.user.id));
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFromSession();
    const { data: sub } = getSupabase().auth.onAuthStateChange((_e, session) => {
      if (!session) setUser(null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(nome: string, senha: string): Promise<string | null> {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email: emailFromNome(nome),
      password: senha,
    });
    if (error || !data.user) return "Usuário ou senha inválidos.";
    const perfil = await fetchPerfil(data.user.id);
    if (!perfil) {
      await sb.auth.signOut();
      return "Perfil de usuário não encontrado.";
    }
    if (!perfil.ativo) {
      await sb.auth.signOut();
      return "Usuário inativo.";
    }
    setUser(perfil);
    return null;
  }

  async function logout() {
    await getSupabase().auth.signOut();
    setUser(null);
  }

  async function changePassword(novaSenha: string): Promise<string | null> {
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password: novaSenha });
    if (error) return error.message;
    await sb.rpc("marcar_senha_alterada");
    const { data } = await sb.auth.getSession();
    if (data.session?.user) setUser(await fetchPerfil(data.session.user.id));
    return null;
  }

  async function refresh() {
    await loadFromSession();
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, changePassword, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
