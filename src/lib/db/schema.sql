-- Chairpeople Database Schema

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('openrouter', 'opencode', 'custom')),
  name TEXT NOT NULL,
  api_key TEXT,
  base_url TEXT,
  default_model TEXT,
  enabled_models TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  structure TEXT NOT NULL DEFAULT '{"departments":[],"employees":[],"interactionRules":[]}',
  orchestrator_model TEXT,
  orchestrator_provider TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  parent_id TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  personality TEXT NOT NULL DEFAULT '',
  specialties TEXT NOT NULL DEFAULT '[]',
  memory_instructions TEXT NOT NULL DEFAULT '',
  reporting_to TEXT,
  interaction_rules TEXT NOT NULL DEFAULT '[]',
  model_id TEXT,
  provider TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connectors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK(owner_type IN ('company', 'employee', 'department', 'shared')),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  total_chunks INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('orchestration', 'group', 'dm')),
  participant_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'orchestrator', 'employee')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('recurring', 'triggered', 'one-time')),
  action TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run TEXT,
  next_run TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mcp_configs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_memory_owner ON memory(company_id, owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(company_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_cron_company ON cron_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_company ON skills(company_id);
CREATE INDEX IF NOT EXISTS idx_connectors_company ON connectors(company_id);