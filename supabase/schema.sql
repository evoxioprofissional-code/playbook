-- J2A Sales Machine — esquema opcional para persistência no Supabase.
-- O app funciona com dados simulados; rode este script quando quiser persistir.

create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  type        text check (type in ('Revenda', 'Fardamento')) default 'Revenda',
  qty         integer not null default 100,
  value       numeric not null default 0,
  column_id   text not null default 'novo',
  hot         boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists creatives (
  id          uuid primary key default gen_random_uuid(),
  month       integer not null,
  title       text not null,
  angle       text,
  format      text,
  status      text check (status in ('ideia','gravando','edicao','no_ar')) default 'ideia',
  created_at  timestamptz not null default now()
);

-- Progresso do playbook por tarefa (checkbox marcado no Dashboard).
create table if not exists playbook_progress (
  task_id     text primary key,
  done        boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table leads enable row level security;
alter table creatives enable row level security;
alter table playbook_progress enable row level security;
