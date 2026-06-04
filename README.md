# J2A Sales Machine

Playbook comercial + CRM Kanban da fábrica **J2A Bonés**. Dark mode, premium, foco em performance (laranja/dourado sobre preto).

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- @dnd-kit (drag-and-drop do Kanban)
- Supabase (opcional — o app roda com dados simulados)

## Abas
1. **Dashboard Mensal** — playbook interativo dos 4 meses (Alicerce → Escala), com checkboxes de execução, métricas, promoção do mês e o **checklist obrigatório de criativos** (9:16 + revisão ortográfica) que trava a publicação.
2. **CRM Kanban** — 6 colunas (Lead Novo → Fechado/Ganho) com arrastar-e-soltar, KPIs de pipeline e cadastro de novo lead.
3. **Biblioteca de Scripts** — falas prontas por fase, com botão copiar.
4. **Central de Criativos** — ritmo de postagem por mês e pipeline de produção (Ideia → Gravando → Edição → No ar).

## Rodar
```bash
npm install
npm run dev
```
Abra http://localhost:3000

## Supabase (opcional)
Copie `.env.local.example` para `.env.local`, preencha as credenciais e rode `supabase/schema.sql` no seu projeto. Sem isso, o app usa dados em memória.
