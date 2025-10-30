-- Daily rollups for LLM mapping runs

create table if not exists public.llm_daily_stats (
  day date primary key,
  created_at timestamptz not null default now(),
  total_runs integer not null default 0,
  avg_latency_ms integer not null default 0,
  avg_confidence numeric not null default 0,
  failure_rate numeric not null default 0,
  models jsonb not null default '[]'::jsonb
);

alter table public.llm_daily_stats enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'llm_daily_stats' and policyname = 'service_role_full_access'
  ) then
    create policy service_role_full_access on public.llm_daily_stats
      for all using (true) with check (true);
  end if;
end $$;


