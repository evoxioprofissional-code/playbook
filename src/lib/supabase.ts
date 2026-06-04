import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase opcional.
 *
 * O app roda 100% com dados simulados (estado local) para demonstração.
 * Quando as variáveis de ambiente estiverem definidas em `.env.local`,
 * este cliente fica disponível para persistir leads, criativos e progresso.
 * Veja `supabase/schema.sql` para o esquema das tabelas.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = Boolean(url && anonKey);
