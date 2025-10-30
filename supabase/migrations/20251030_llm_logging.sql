-- LLM mapping run logging tables
-- Creates a single table to log each mapping with summary stats and optional diagnostics

create table if not exists public.llm_mapping_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  anon_id text null,
  model text not null,
  prompt_version text null,
  evaluator_version text null,
  experience text null,
  latency_ms integer null,
  confidence numeric null,
  success boolean not null default true,
  answers_excerpt text null,
  answers_hash text null,
  checks jsonb null,
  error text null
);

-- Indexes to support common queries
create index if not exists llm_mapping_runs_created_at_idx on public.llm_mapping_runs (created_at desc);
create index if not exists llm_mapping_runs_user_idx on public.llm_mapping_runs (user_id);
create index if not exists llm_mapping_runs_model_idx on public.llm_mapping_runs (model);

-- RLS: allow service role to insert/select; default deny others
alter table public.llm_mapping_runs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'llm_mapping_runs' and policyname = 'service_role_full_access'
  ) then
    create policy service_role_full_access on public.llm_mapping_runs
      for all
      using (true)
      with check (true);
  end if;
end $$;


