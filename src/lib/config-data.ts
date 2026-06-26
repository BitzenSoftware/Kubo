import { getSupabase } from "./supabase";

export type Row = { id: string } & Record<string, unknown>;

export async function listRows(table: string): Promise<Row[]> {
  const { data, error } = await getSupabase()
    .from(table)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function insertRow(
  table: string,
  values: Record<string, unknown>,
): Promise<void> {
  const { error } = await getSupabase().from(table).insert(values);
  if (error) throw error;
}

export async function updateRow(
  table: string,
  id: string,
  values: Record<string, unknown>,
): Promise<void> {
  const { error } = await getSupabase().from(table).update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await getSupabase().from(table).delete().eq("id", id);
  if (error) throw error;
}
