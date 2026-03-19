export type ProviderType = 'openrouter' | 'opencode' | 'custom';

export interface AIModel {
  id: string;
  name: string;
  provider: ProviderType;
}

export interface Provider {
  id: string;
  type: ProviderType;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  enabledModels: AIModel[];
}

export interface Memory {
  id: string;
  companyId: string;
  ownerId: string;
  ownerType: 'company' | 'employee' | 'department' | 'shared';
  content: string;
  chunkIndex: number;
  totalChunks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  companyId: string;
  name: string;
  description: string;
  instructions: string;
  provider: ProviderType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Connector {
  id: string;
  companyId: string;
  name: string;
  type: string;
  config: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  role: string;
  department: string;
  personality: string;
  specialties: string[];
  memoryInstructions: string;
  reportingTo: string | null;
  interactionRules: string[];
  modelId?: string;
  provider?: ProviderType;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description: string;
  parentId?: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  structure: CompanyStructure;
  orchestratorModel?: string;
  orchestratorProvider?: ProviderType;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyStructure {
  departments: Department[];
  employees: Employee[];
  interactionRules: InteractionRule[];
}

export interface InteractionRule {
  id: string;
  from: string;
  to: string;
  type: 'report' | 'dm' | 'group' | 'broadcast';
  allowed: boolean;
}

export interface Message {
  id: string;
  companyId: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'orchestrator' | 'employee';
  senderName: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  companyId: string;
  type: 'orchestration' | 'group' | 'dm';
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CronJob {
  id: string;
  companyId: string;
  employeeId?: string;
  name: string;
  description: string;
  schedule: string;
  type: 'recurring' | 'triggered' | 'one-time';
  action: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export interface MCPConfig {
  id: string;
  companyId: string;
  name: string;
  type: string;
  config: Record<string, string>;
  enabled: boolean;
}

export interface WebSearchConfig {
  enabled: boolean;
  chunkSize: number;
  chunkOverlap: number;
}