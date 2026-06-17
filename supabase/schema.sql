-- J2A Sales Machine — esquema do Supabase.
-- Rode este script no SQL Editor do seu projeto Supabase.
-- O app também funciona em modo local (sem Supabase), mas aí não há
-- fiscalização compartilhada entre os 3 funcionários.

-- ─────────────────────────────────────────────────────────────
-- Fábricas (organizações) — multi-tenant. Cada fábrica tem seu gestor
-- e seus vendedores; o "master" (dono do sistema) cria as fábricas.
-- ─────────────────────────────────────────────────────────────
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Funcionários
-- ─────────────────────────────────────────────────────────────
create table if not exists employees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin         text,
  role        text not null default 'vendedor' check (role in ('vendedor','gestor','master')),
  org_id      uuid references organizations(id),
  created_at  timestamptz not null default now()
);

-- Seed dos 3 funcionários + gestor. TROQUE os nomes e PINs.
insert into employees (name, pin, role) values
  ('Funcionário 1', '1111', 'vendedor'),
  ('Funcionário 2', '2222', 'vendedor'),
  ('Funcionário 3', '3333', 'vendedor'),
  ('Gestor',        '9999', 'gestor')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Logs de execução: 1 linha por CAIXA marcada por funcionário.
-- task_id  = id da tarefa em src/lib/playbook.ts (ex.: 'm1-v1')
-- slot     = identifica a caixa dentro da tarefa:
--              diária   → data do dia 'YYYY-MM-DD'
--              contagem → índice da unidade '1'..'N'
--              once     → 'done'
-- marked_at = quando a caixa foi marcada (quem/quando).
-- ─────────────────────────────────────────────────────────────
create table if not exists task_logs (
  id            uuid primary key default gen_random_uuid(),
  task_id       text not null,
  employee_id   uuid not null references employees(id) on delete cascade,
  slot          text not null,
  marked_at     timestamptz not null default now(),
  unique (task_id, employee_id, slot)
);

create index if not exists idx_logs_employee on task_logs (employee_id);

-- ─────────────────────────────────────────────────────────────
-- CRM (opcional) — leads e criativos
-- ─────────────────────────────────────────────────────────────
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  type        text check (type in ('Revenda', 'Marca própria')) default 'Revenda',
  qty         integer not null default 100,
  value       numeric not null default 0,
  column_id   text not null default 'novo',
  hot         boolean not null default false,
  created_at  timestamptz not null default now(),
  -- conversa do WhatsApp de origem (quando o lead entrou automaticamente).
  wa_jid      text,
  -- fábrica dona do lead (multi-tenant).
  org_id      uuid references organizations(id)
);

-- Cada conversa do WhatsApp vira no máximo 1 lead. NULLs são distintos no
-- Postgres, então leads manuais (wa_jid NULL) não conflitam entre si.
create unique index if not exists idx_leads_wa_jid on leads (wa_jid);

create table if not exists creatives (
  id          uuid primary key default gen_random_uuid(),
  month       integer not null,
  title       text not null,
  angle       text,
  format      text,
  status      text check (status in ('ideia','gravando','edicao','no_ar')) default 'ideia',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- WhatsApp — apelidos das conversas.
-- O WhatsApp esconde nome/telefone de quem não está salvo (privacidade @lid).
-- A equipe renomeia a conversa aqui e o nome aparece pra todos.
-- jid = identificador da conversa (ex.: '55…@s.whatsapp.net' ou '…@lid').
-- ─────────────────────────────────────────────────────────────
create table if not exists wa_aliases (
  jid         text primary key,
  name        text not null,
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Config do app (chave/valor JSON). Hoje guarda o playbook editável
-- (key = 'playbook'), que o gestor altera pelo /admin.
-- ─────────────────────────────────────────────────────────────
create table if not exists app_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Campanha de recuperação em massa (WhatsApp).
-- Envia 1 mensagem a cada `interval_min` minutos pra não derrubar o número.
-- O envio é processado pelo app (enquanto alguém estiver com ele aberto).
-- ─────────────────────────────────────────────────────────────
create table if not exists wa_campaigns (
  id           uuid primary key default gen_random_uuid(),
  message      text not null,
  interval_min integer not null default 8,        -- legado (mantido p/ compatibilidade)
  interval_sec integer not null default 480,       -- intervalo real entre envios, em segundos
  instance     text,                                -- WhatsApp (vendedor) dono da campanha
  status       text not null default 'running' check (status in ('running','done','canceled')),
  created_at   timestamptz not null default now()
);
-- migrações p/ bancos já criados:
alter table wa_campaigns add column if not exists interval_sec integer not null default 480;
alter table wa_campaigns add column if not exists instance text;

create table if not exists wa_campaign_targets (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references wa_campaigns(id) on delete cascade,
  jid          text not null,
  name         text,
  status       text not null default 'pending' check (status in ('pending','sending','sent','error')),
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_camp_targets on wa_campaign_targets (campaign_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — ferramenta interna de equipe pequena.
-- Liberamos leitura/escrita pela anon key. Para produção pública,
-- troque por Supabase Auth + policies por usuário.
-- ─────────────────────────────────────────────────────────────
alter table employees  enable row level security;
alter table task_logs  enable row level security;
alter table leads      enable row level security;
alter table creatives  enable row level security;
alter table organizations enable row level security;
alter table employees  enable row level security;
alter table wa_aliases enable row level security;
alter table app_config enable row level security;
alter table wa_campaigns enable row level security;
alter table wa_campaign_targets enable row level security;
create policy "anon full organizations" on organizations for all using (true) with check (true);

create policy "anon full employees"   on employees   for all using (true) with check (true);
create policy "anon full task_logs"   on task_logs   for all using (true) with check (true);
create policy "anon full leads"       on leads       for all using (true) with check (true);
create policy "anon full creatives"   on creatives   for all using (true) with check (true);
create policy "anon full wa_aliases"  on wa_aliases  for all using (true) with check (true);
create policy "anon full app_config"  on app_config  for all using (true) with check (true);
create policy "anon full wa_campaigns" on wa_campaigns for all using (true) with check (true);
create policy "anon full wa_camp_tgts" on wa_campaign_targets for all using (true) with check (true);
