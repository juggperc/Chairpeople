import { openrouter } from '@openrouter/ai-sdk-provider';
import type { ProviderType } from '@/types';

export function createOpenRouterModel(modelId: string) {
  return openrouter(modelId);
}

export function getProviderModel(providerType: ProviderType, modelId: string) {
  switch (providerType) {
    case 'openrouter':
      return openrouter(modelId);
    case 'opencode':
      return openrouter(modelId);
    case 'custom':
      return openrouter(modelId);
    default:
      return openrouter(modelId);
  }
}