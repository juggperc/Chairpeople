import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Provider, ProviderType, AIModel, WebSearchConfig } from '@/types';

interface SettingsState {
  providers: Provider[];
  activeProvider: ProviderType;
  activeModel: string;
  mcpConfigs: Record<string, unknown>;
  webSearch: WebSearchConfig;
  setProvider: (type: ProviderType) => void;
  setActiveModel: (modelId: string) => void;
  updateProvider: (type: ProviderType, updates: Partial<Provider>) => void;
  addModel: (type: ProviderType, model: AIModel) => void;
  removeModel: (type: ProviderType, modelId: string) => void;
  setMcpConfig: (key: string, config: unknown) => void;
  removeMcpConfig: (key: string) => void;
  setWebSearch: (config: Partial<WebSearchConfig>) => void;
}

const defaultProviders: Provider[] = [
  {
    id: 'openrouter',
    type: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    enabledModels: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' },
    ],
  },
  {
    id: 'opencode',
    type: 'opencode',
    name: 'OpenCode',
    baseUrl: 'https://opencode.ai/api/v1',
    defaultModel: 'opencode',
    enabledModels: [
      { id: 'opencode', name: 'OpenCode', provider: 'opencode' },
    ],
  },
  {
    id: 'custom',
    type: 'custom',
    name: 'Custom Provider',
    baseUrl: '',
    defaultModel: '',
    enabledModels: [],
  },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      providers: defaultProviders,
      activeProvider: 'openrouter',
      activeModel: 'anthropic/claude-3.5-sonnet',
      mcpConfigs: {},
      webSearch: {
        enabled: true,
        chunkSize: 500,
        chunkOverlap: 50,
      },

      setProvider: (type) => {
        set((state) => {
          state.activeProvider = type;
          const provider = state.providers.find(p => p.type === type);
          if (provider?.defaultModel) {
            state.activeModel = provider.defaultModel;
          }
        });
      },

      setActiveModel: (modelId) => {
        set((state) => {
          state.activeModel = modelId;
        });
      },

      updateProvider: (type, updates) => {
        set((state) => {
          const provider = state.providers.find(p => p.type === type);
          if (provider) {
            Object.assign(provider, updates);
          }
        });
      },

      addModel: (type, model) => {
        set((state) => {
          const provider = state.providers.find(p => p.type === type);
          if (provider && !provider.enabledModels.find(m => m.id === model.id)) {
            provider.enabledModels.push(model);
          }
        });
      },

      removeModel: (type, modelId) => {
        set((state) => {
          const provider = state.providers.find(p => p.type === type);
          if (provider) {
            provider.enabledModels = provider.enabledModels.filter(m => m.id !== modelId);
          }
        });
      },

      setMcpConfig: (key, config) => {
        set((state) => {
          state.mcpConfigs[key] = config;
        });
      },

      removeMcpConfig: (key) => {
        set((state) => {
          delete state.mcpConfigs[key];
        });
      },

      setWebSearch: (config) => {
        set((state) => {
          Object.assign(state.webSearch, config);
        });
      },
    })),
    {
      name: 'chairpeople-settings',
    }
  )
);