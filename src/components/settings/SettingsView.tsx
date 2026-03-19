import * as React from 'react';
import { useSettingsStore } from '@/stores/settings';
import { Header } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { OPENROUTER_MODELS, OPENCODE_MODELS } from '@/lib/ai/providers';
import { Key, Globe, Database, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsView() {
  const {
    providers,
    activeProvider,
    activeModel,
    webSearch,
    setProvider,
    setActiveModel,
    updateProvider,
    addModel,
    removeModel,
    setWebSearch,
  } = useSettingsStore();

  const [customModelInput, setCustomModelInput] = React.useState('');
  const [newModelId, setNewModelId] = React.useState('');
  const [newModelName, setNewModelName] = React.useState('');

  const currentProvider = providers.find((p) => p.type === activeProvider);

  const handleAddCustomModel = () => {
    if (!newModelId.trim() || !newModelName.trim()) return;

    addModel(activeProvider, {
      id: newModelId.trim(),
      name: newModelName.trim(),
      provider: activeProvider,
    });

    setNewModelId('');
    setNewModelName('');
  };

  const availableModels = activeProvider === 'openrouter' 
    ? OPENROUTER_MODELS 
    : activeProvider === 'opencode' 
    ? OPENCODE_MODELS 
    : [];

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Configure your AI providers and preferences" />

      <Tabs defaultValue="providers" className="flex-1 overflow-auto">
        <div className="px-4 border-b">
          <TabsList>
            <TabsTrigger value="providers">
              <Key className="h-4 w-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="models">
              <Database className="h-4 w-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="search">
              <Globe className="h-4 w-4 mr-2" />
              Web Search
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="providers" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">AI Provider</h3>
            <p className="text-sm text-muted-foreground">
              Select which AI provider to use for your agents. You can configure API keys below.
            </p>

            <div className="grid gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.type}
                  className={cn(
                    'rounded-lg border p-4 cursor-pointer transition-colors',
                    activeProvider === provider.type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                  onClick={() => setProvider(provider.type)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{provider.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {provider.type === 'openrouter' && 'Access to multiple AI models via OpenRouter'}
                        {provider.type === 'opencode' && 'OpenCode AI models'}
                        {provider.type === 'custom' && 'Custom OpenAI-compatible API'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2',
                        activeProvider === provider.type
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    />
                  </div>

                  {activeProvider === provider.type && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`api-key-${provider.type}`}>API Key</Label>
                        <Input
                          id={`api-key-${provider.type}`}
                          type="password"
                          placeholder="sk-..."
                          value={provider.apiKey || ''}
                          onChange={(e) => updateProvider(provider.type, { apiKey: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {provider.type === 'custom' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="custom-base-url">Base URL</Label>
                            <Input
                              id="custom-base-url"
                              placeholder="https://api.example.com/v1"
                              value={provider.baseUrl || ''}
                              onChange={(e) => updateProvider(provider.type, { baseUrl: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-default-model">Default Model</Label>
                            <Input
                              id="custom-default-model"
                              placeholder="gpt-4"
                              value={provider.defaultModel || ''}
                              onChange={(e) => updateProvider(provider.type, { defaultModel: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Model Selection</h3>
            <p className="text-sm text-muted-foreground">
              Choose which model to use for AI agents. Custom models can be added below.
            </p>

            <div className="space-y-2">
              {currentProvider?.enabledModels.map((model) => (
                <div
                  key={model.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    activeModel === model.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <p className="text-sm text-muted-foreground">{model.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={activeModel === model.id ? 'default' : 'outline'}
                      onClick={() => setActiveModel(model.id)}
                    >
                      {activeModel === model.id ? 'Active' : 'Select'}
                    </Button>
                    {availableModels.some(m => m.id === model.id) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeModel(activeProvider, model.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Add Custom Model</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model ID</Label>
                  <Input
                    placeholder="provider/model-name"
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    placeholder="My Custom Model"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddCustomModel} disabled={!newModelId.trim() || !newModelName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Web Search & Chunking</h3>
            <p className="text-sm text-muted-foreground">
              Configure how agents access and process web search results.
            </p>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Web Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow agents to search the web for information
                  </p>
                </div>
                <Switch
                  checked={webSearch.enabled}
                  onCheckedChange={(checked) => setWebSearch({ enabled: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chunk Size: {webSearch.chunkSize} characters</Label>
                  <p className="text-sm text-muted-foreground">
                    Size of text chunks for memory and search results
                  </p>
                  <Slider
                    value={[webSearch.chunkSize]}
                    onValueChange={([value]) => setWebSearch({ chunkSize: value })}
                    min={100}
                    max={2000}
                    step={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chunk Overlap: {webSearch.chunkOverlap} characters</Label>
                  <p className="text-sm text-muted-foreground">
                    Overlap between adjacent chunks for context preservation
                  </p>
                  <Slider
                    value={[webSearch.chunkOverlap]}
                    onValueChange={([value]) => setWebSearch({ chunkOverlap: value })}
                    min={0}
                    max={200}
                    step={10}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}