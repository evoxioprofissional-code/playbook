import { supabase, isSupabaseEnabled } from "./supabase";

export type Role = "vendedor" | "gestor";

export type Employee = {
  id: string;
  name: string;
  pin: string;
  role: Role;
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
      .select("id, name, pin, role")
      .order("role", { ascending: false })
      .order("name");
    if (!error && data?.length) return data as Employee[];
  }
  return DEFAULT_EMPLOYEES;
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
