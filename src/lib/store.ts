import { supabase, isSupabaseEnabled } from "./supabase";

export type Role = "vendedor" | "gestor";

export type Employee = {
  id: string;
  name: string;
  pin: string;
  role: Role;
};

export type Completion = {
  task_id: string;
  employee_id: string;
  completed_at: string; // ISO
};

/**
 * Equipe padrão usada quando o Supabase ainda não está conectado.
 * Quando o Supabase está ligado, a lista vem da tabela `employees`.
 * Renomeie e troque os PINs direto no Supabase (ou aqui, no modo local).
 */
export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "func-1", name: "Funcionário 1", pin: "1111", role: "vendedor" },
  { id: "func-2", name: "Funcionário 2", pin: "2222", role: "vendedor" },
  { id: "func-3", name: "Funcionário 3", pin: "3333", role: "vendedor" },
  { id: "gestor", name: "Gestor", pin: "9999", role: "gestor" },
];

const LS_COMPLETIONS = "j2a_completions";

function readLocal(): Completion[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_COMPLETIONS) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(rows: Completion[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_COMPLETIONS, JSON.stringify(rows));
}

export async function fetchEmployees(): Promise<Employee[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, pin, role")
      .order("role", { ascending: false })
      .order("name");
    if (!error && data?.length) return data as Employee[];
  }
  return DEFAULT_EMPLOYEES;
}

export async function fetchCompletions(): Promise<Completion[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("task_completions")
      .select("task_id, employee_id, completed_at");
    if (!error && data) return data as Completion[];
  }
  return readLocal();
}

export async function addCompletion(
  taskId: string,
  employeeId: string
): Promise<Completion> {
  const row: Completion = {
    task_id: taskId,
    employee_id: employeeId,
    completed_at: new Date().toISOString(),
  };
  if (supabase) {
    await supabase
      .from("task_completions")
      .upsert(row, { onConflict: "task_id,employee_id" });
  } else {
    const rows = readLocal().filter(
      (r) => !(r.task_id === taskId && r.employee_id === employeeId)
    );
    rows.push(row);
    writeLocal(rows);
  }
  return row;
}

export async function removeCompletion(
  taskId: string,
  employeeId: string
): Promise<void> {
  if (supabase) {
    await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("employee_id", employeeId);
  } else {
    writeLocal(
      readLocal().filter(
        (r) => !(r.task_id === taskId && r.employee_id === employeeId)
      )
    );
  }
}

export { isSupabaseEnabled };
