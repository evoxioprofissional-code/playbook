import { supabase, isSupabaseEnabled } from "./supabase";

export type Role = "vendedor" | "gestor";

/** Áreas do playbook que um funcionário cobre. Vazio/null = vê todas. */
export type Area = "vendas" | "instagram" | "criativos";

export const AREAS: { key: Area; label: string }[] = [
  { key: "vendas", label: "Vendas" },
  { key: "instagram", label: "Instagram" },
  { key: "criativos", label: "Criativos" },
];

export type Employee = {
  id: string;
  name: string;
  email?: string | null;
  pin?: string | null;
  role: Role;
  areas?: Area[] | null;
};

/**
 * Um log = uma caixa marcada por um funcionário.
 * `slot` identifica a caixa dentro da tarefa:
 *   - diária  → data do dia 'YYYY-MM-DD'
 *   - contagem → índice da unidade '1'..'N'
 *   - once     → 'done'
 * `marked_at` é quando foi marcado de fato (registro de quem/quando).
 */
export type TaskLog = {
  task_id: string;
  employee_id: string;
  slot: string;
  marked_at: string; // ISO
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "func-1", name: "Funcionário 1", pin: "1111", role: "vendedor" },
  { id: "func-2", name: "Funcionário 2", pin: "2222", role: "vendedor" },
  { id: "func-3", name: "Funcionário 3", pin: "3333", role: "vendedor" },
  { id: "gestor", name: "Gestor", pin: "9999", role: "gestor" },
];

const LS_LOGS = "j2a_logs";

function readLocal(): TaskLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_LOGS) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(rows: TaskLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_LOGS, JSON.stringify(rows));
}

export async function fetchEmployees(): Promise<Employee[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, role, areas")
      .order("role", { ascending: false })
      .order("name");
    if (!error && data?.length) return data as Employee[];
  }
  return DEFAULT_EMPLOYEES;
}

/** Cria o usuário de login (e-mail/senha) sem mexer na sessão do admin. */
async function createAuthUser(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, error: "Supabase não configurado." };
  // Cliente isolado (não persiste sessão) pra não deslogar o admin.
  const { createClient } = await import("@supabase/supabase-js");
  const tmp = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await tmp.auth.signUp({ email: email.trim(), password });
  if (error && !/already registered/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function saveEmployee(
  emp: Partial<Employee> & { name: string; role: Role; email: string },
  password?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase não conectado." };
  const email = emp.email.trim().toLowerCase();

  // Novo funcionário: cria o login (e-mail/senha) antes de salvar.
  if (!emp.id) {
    if (!password || password.length < 6) {
      return { ok: false, error: "Defina uma senha de pelo menos 6 caracteres." };
    }
    const auth = await createAuthUser(email, password);
    if (!auth.ok) return auth;
  }

  const payload = {
    name: emp.name.trim(),
    email,
    role: emp.role,
    areas: emp.areas && emp.areas.length ? emp.areas : null,
  };
  const res = emp.id
    ? await supabase.from("employees").update(payload).eq("id", emp.id)
    : await supabase.from("employees").insert(payload);
  return res.error ? { ok: false, error: res.error.message } : { ok: true };
}

export async function deleteEmployee(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase não conectado." };
  const { error } = await supabase.from("employees").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Login por e-mail e senha (Supabase Auth) + papel/áreas vindos da tabela employees. */
export async function signInEmail(
  email: string,
  password: string
): Promise<{
  ok: boolean;
  user?: { id: string; name: string; role: Role; areas?: Area[] | null };
  error?: string;
}> {
  if (!supabase) return { ok: false, error: "Supabase não conectado." };
  const mail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
  if (error) {
    return {
      ok: false,
      error:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
    };
  }
  // Só entra quem está cadastrado na equipe (allowlist + papel/áreas).
  const { data: emp } = await supabase
    .from("employees")
    .select("id, name, role, areas")
    .eq("email", mail)
    .maybeSingle();
  if (!emp) {
    await supabase.auth.signOut();
    return { ok: false, error: "Acesso não autorizado. Fale com o gestor." };
  }
  return {
    ok: true,
    user: { id: emp.id, name: emp.name, role: emp.role, areas: emp.areas ?? null },
  };
}

export async function fetchLogs(): Promise<TaskLog[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("task_logs")
      .select("task_id, employee_id, slot, marked_at");
    if (!error && data) return data as TaskLog[];
  }
  return readLocal();
}

export async function addLog(
  taskId: string,
  employeeId: string,
  slot: string
): Promise<TaskLog> {
  const row: TaskLog = {
    task_id: taskId,
    employee_id: employeeId,
    slot,
    marked_at: new Date().toISOString(),
  };
  if (supabase) {
    await supabase
      .from("task_logs")
      .upsert(row, { onConflict: "task_id,employee_id,slot" });
  } else {
    const rows = readLocal().filter(
      (r) =>
        !(r.task_id === taskId && r.employee_id === employeeId && r.slot === slot)
    );
    rows.push(row);
    writeLocal(rows);
  }
  return row;
}

export async function removeLog(
  taskId: string,
  employeeId: string,
  slot: string
): Promise<void> {
  if (supabase) {
    await supabase
      .from("task_logs")
      .delete()
      .eq("task_id", taskId)
      .eq("employee_id", employeeId)
      .eq("slot", slot);
  } else {
    writeLocal(
      readLocal().filter(
        (r) =>
          !(
            r.task_id === taskId &&
            r.employee_id === employeeId &&
            r.slot === slot
          )
      )
    );
  }
}

export { isSupabaseEnabled };
