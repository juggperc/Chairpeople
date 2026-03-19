import type { ProviderType } from '@/types';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

const providerConfigs: Record<ProviderType, Omit<ProviderConfig, 'apiKey'>> = {
  openrouter: {
    type: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
  opencode: {
    type: 'opencode',
    name: 'OpenCode',
    baseUrl: 'https://opencode.ai/api/v1',
    defaultModel: 'opencode',
  },
  custom: {
    type: 'custom',
    name: 'Custom Provider',
    baseUrl: '',
    defaultModel: '',
  },
};

export function getProviderConfig(type: ProviderType, apiKey?: string, customBaseUrl?: string, customDefaultModel?: string): ProviderConfig {
  const config = providerConfigs[type];
  return {
    ...config,
    apiKey,
    baseUrl: type === 'custom' && customBaseUrl ? customBaseUrl : config.baseUrl,
    defaultModel: type === 'custom' && customDefaultModel ? customDefaultModel : config.defaultModel,
  };
}

export function validateProviderConfig(config: ProviderConfig): string[] {
  const errors: string[] = [];
  
  if (!config.apiKey && config.type !== 'custom') {
    errors.push(`API key is required for ${config.name}`);
  }
  
  if (!config.baseUrl) {
    errors.push(`Base URL is required for ${config.name}`);
  }
  
  if (!config.defaultModel) {
    errors.push(`Default model is required for ${config.name}`);
  }
  
  return errors;
}

export const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' as const },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'openrouter' as const },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' as const },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openrouter' as const },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' as const },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'openrouter' as const },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'openrouter' as const },
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'openrouter' as const },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter' as const },
  { id: 'x-ai/grok-2', name: 'Grok 2', provider: 'openrouter' as const },
];

export const OPENCODE_MODELS = [
  { id: 'opencode', name: 'OpenCode', provider: 'opencode' as const },
  { id: 'opencode-gemma', name: 'OpenCode Gemma', provider: 'opencode' as const },
];