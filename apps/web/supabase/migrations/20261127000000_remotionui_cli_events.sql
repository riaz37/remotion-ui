-- Anonymous CLI usage events, written by apps/web/functions/api/telemetry.ts
-- with the secret key. No IP, path or user id is stored.
create table if not exists public.remotionui_cli_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  command text not null check (char_length(command) <= 20),
  components text[] not null default '{}' check (cardinality(components) <= 20),
  ok boolean not null,
  cli_version text not null check (char_length(cli_version) <= 40)
);

-- Only the secret key (which bypasses RLS) may read or write. With RLS on and
-- no policies, the publishable/anon key gets nothing.
alter table public.remotionui_cli_events enable row level security;

create index if not exists remotionui_cli_events_created_at_idx
  on public.remotionui_cli_events (created_at desc);

comment on table public.remotionui_cli_events is 'Anonymous CLI usage events from remotion-ui, written by /api/telemetry with the secret key.';
