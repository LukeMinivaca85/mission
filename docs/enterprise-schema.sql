-- Lukintosh Mission Control Enterprise schema draft.
-- Use as the first migration when moving the current local-first runtime to SQLite/PostgreSQL.

create table if not exists organizations (
  id text primary key,
  slug text not null unique,
  name text not null,
  plan text not null default 'free',
  owner_email text not null,
  deleted_at text,
  created_at text not null,
  updated_at text
);

create table if not exists workspaces (
  id text primary key,
  organization_id text not null references organizations(id),
  name text not null,
  purpose text,
  archived_at text,
  created_at text not null,
  updated_at text
);

create index if not exists idx_workspaces_org on workspaces(organization_id);

create table if not exists organization_members (
  id text primary key,
  organization_id text not null references organizations(id),
  email text not null,
  name text not null,
  role text not null check (role in ('owner', 'admin', 'operator', 'analyst', 'viewer')),
  status text not null check (status in ('active', 'invited', 'disabled', 'removed')),
  joined_at text,
  last_seen_at text,
  removed_at text,
  created_at text not null,
  unique (organization_id, email)
);

create index if not exists idx_members_org_role on organization_members(organization_id, role);

create table if not exists governance_policies (
  id text primary key,
  organization_id text not null references organizations(id),
  workspace_id text references workspaces(id),
  allowed_models text not null,
  blocked_models text not null,
  mission_cost_limit_usd real not null default 0,
  daily_cost_limit_usd real not null default 0,
  monthly_cost_limit_usd real not null default 0,
  allowed_tools text not null,
  blocked_tools text not null,
  require_human_approval integer not null default 1,
  sensitive_actions text not null,
  history_retention_days integer not null default 365,
  export_policy text not null,
  sharing_policy text not null,
  data_training_opt_out integer not null default 1,
  created_at text not null,
  updated_at text
);

create table if not exists approval_requests (
  id text primary key,
  organization_id text not null references organizations(id),
  workspace_id text not null references workspaces(id),
  mission_id text,
  action text not null,
  context text,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  requested_by text not null,
  requested_at text not null,
  decided_by text,
  decided_at text,
  justification text
);

create index if not exists idx_approvals_org_status on approval_requests(organization_id, status);

create table if not exists audit_events (
  id text primary key,
  organization_id text not null references organizations(id),
  workspace_id text references workspaces(id),
  user_email text,
  action text not null,
  resource text not null,
  resource_id text,
  occurred_at text not null,
  ip text,
  user_agent text,
  correlation_id text not null,
  metadata text,
  result text not null
);

create index if not exists idx_audit_org_time on audit_events(organization_id, occurred_at);
create index if not exists idx_audit_correlation on audit_events(correlation_id);

create table if not exists integrations (
  id text primary key,
  organization_id text not null references organizations(id),
  provider text not null,
  status text not null,
  encrypted_credentials_ref text,
  connected_by text,
  connected_at text,
  scopes text,
  last_test_at text,
  last_result text
);

create table if not exists api_keys (
  id text primary key,
  organization_id text not null references organizations(id),
  name text not null,
  prefix text not null,
  secret_hash text not null unique,
  scopes text not null,
  created_by text not null,
  created_at text not null,
  last_used_at text,
  expires_at text,
  revoked_at text
);

create table if not exists budgets (
  id text primary key,
  organization_id text not null references organizations(id),
  workspace_id text references workspaces(id),
  scope text not null,
  period text not null,
  limit_usd real not null,
  alert_thresholds text not null,
  block_at_limit integer not null default 1,
  created_at text not null,
  updated_at text
);

create table if not exists usage_events (
  id text primary key,
  organization_id text not null references organizations(id),
  workspace_id text references workspaces(id),
  agent_id text,
  mission_id text,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd real not null default 0,
  latency_ms integer,
  status text not null,
  occurred_at text not null
);

create index if not exists idx_usage_org_time on usage_events(organization_id, occurred_at);

create table if not exists enterprise_settings (
  id text primary key,
  organization_id text not null references organizations(id),
  sso_status text not null default 'pilot',
  sso_provider text,
  sso_domain text,
  enforce_sso integer not null default 0,
  owner_fallback integer not null default 1,
  scim_status text not null default 'pilot',
  scim_token_hash text,
  privacy_settings text not null,
  created_at text not null,
  updated_at text
);

create table if not exists sales_leads (
  id text primary key,
  name text not null,
  email text not null,
  company text not null,
  role text,
  team_size text,
  use_case text,
  message text,
  consent integer not null default 0,
  created_at text not null
);
