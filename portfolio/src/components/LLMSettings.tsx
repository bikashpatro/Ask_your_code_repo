// components/LLMSettings.tsx
// Modal for selecting LLM provider and entering API credentials

'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { setLLMConfig, LLMProvider } from '@/store/slices/llmSlice';

interface ModelInfo {
  name: string;
  pricing: string;
}

interface Provider {
  id: LLMProvider;
  name: string;
  subtitle: string;
  color: string;
  pricingBadge: string;
  pricingBadgeColor: string;
  pricingSummary: string;
  models: ModelInfo[];
  keyLabel: string;
  keyPlaceholder: string;
  keyCreateUrl: string;
  keyCreateLabel: string;
  showBaseUrl: boolean;
}

const PROVIDERS: Provider[] = [
  {
    id: 'groq',
    name: 'Groq',
    subtitle: 'LLaMA 3.3-70B',
    color: 'bg-green-800',
    pricingBadge: 'Free Tier',
    pricingBadgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30',
    pricingSummary: '14,400 req/day free · Paid plans for higher limits',
    models: [
      { name: 'llama-3.3-70b-versatile', pricing: 'Free tier' },
      { name: 'llama-3.1-8b-instant',    pricing: 'Free tier' },
      { name: 'mixtral-8x7b-32768',      pricing: 'Free tier' },
    ],
    keyLabel: 'Groq API Key',
    keyPlaceholder: 'gsk_...',
    keyCreateUrl: 'https://console.groq.com/keys',
    keyCreateLabel: 'Create Groq API Key',
    showBaseUrl: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    subtitle: 'GPT-4o / GPT-4',
    color: 'bg-blue-800',
    pricingBadge: 'Paid',
    pricingBadgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    pricingSummary: 'Pay-per-token · No free API tier · Credit card required',
    models: [
      { name: 'gpt-4o',          pricing: '$2.50 / $10 per 1M tokens' },
      { name: 'gpt-4',           pricing: '$30 / $60 per 1M tokens' },
      { name: 'gpt-4o-mini',     pricing: '$0.15 / $0.60 per 1M tokens' },
      { name: 'gpt-3.5-turbo',   pricing: '$0.50 / $1.50 per 1M tokens' },
    ],
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
    keyCreateUrl: 'https://platform.openai.com/api-keys',
    keyCreateLabel: 'Create OpenAI API Key',
    showBaseUrl: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    subtitle: 'Claude 3.5',
    color: 'bg-amber-900',
    pricingBadge: 'Paid',
    pricingBadgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    pricingSummary: 'Pay-per-token · No free API tier · Credit card required',
    models: [
      { name: 'claude-3-5-sonnet-20241022', pricing: '$3 / $15 per 1M tokens' },
      { name: 'claude-3-5-haiku-20241022',  pricing: '$0.80 / $4 per 1M tokens' },
      { name: 'claude-3-opus-20240229',     pricing: '$15 / $75 per 1M tokens' },
    ],
    keyLabel: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-...',
    keyCreateUrl: 'https://console.anthropic.com/settings/keys',
    keyCreateLabel: 'Create Anthropic API Key',
    showBaseUrl: false,
  },
];

export default function LLMSettings({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const llm = useAppSelector((s) => s.llm);

  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(llm.provider);
  const [apiKey, setApiKey] = useState(llm.apiKey);
  const [model, setModel] = useState(llm.model);
  const [baseUrl, setBaseUrl] = useState(llm.baseUrl);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const provider = PROVIDERS.find((p) => p.id === selectedProvider)!;
  const selectedModel = provider.models.find((m) => m.name === model) ?? provider.models[0];

  const handleProviderSelect = (id: LLMProvider) => {
    setSelectedProvider(id);
    const p = PROVIDERS.find((p) => p.id === id)!;
    setModel(p.models[0].name);
    setSaved(false);
  };

  const handleSave = () => {
    dispatch(setLLMConfig({ provider: selectedProvider, apiKey, model, baseUrl }));
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl mx-4 p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-base">LLM Provider Settings</h2>
            <p className="text-slate-400 text-xs mt-0.5">Choose your AI model and enter credentials</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Provider cards */}
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderSelect(p.id)}
              className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                selectedProvider === p.id ? 'border-violet-500' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`${p.color} px-3 py-2.5`}>
                <p className="text-white font-semibold text-xs">{p.name}</p>
                <p className="text-white/70 text-[10px]">{p.subtitle}</p>
              </div>
              <div className="bg-[#161b22] px-3 py-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.pricingBadgeColor}`}>
                  {p.pricingBadge}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Pricing info banner */}
        <div className="flex items-start gap-2 bg-[#161b22] border border-white/5 rounded-lg px-3 py-2.5">
          <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <span className={`font-medium px-1.5 py-0.5 rounded-full mr-1.5 ${provider.pricingBadgeColor}`}>
              {provider.pricingBadge}
            </span>
            {provider.pricingSummary}
          </p>
        </div>

        {/* Credentials form */}
        <div className="flex flex-col gap-3 bg-[#161b22] rounded-xl p-4">
          <p className="text-slate-300 text-xs font-medium">
            Configure <span className="text-violet-400">{provider.name}</span>
          </p>

          {/* Model selector with pricing */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-[#0d1117] border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {provider.models.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
            {/* Pricing for selected model */}
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pricing: <span className="text-slate-400">{selectedModel.pricing}</span>
            </p>
          </div>

          {/* API Key input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400">{provider.keyLabel}</label>
              <a
                href={provider.keyCreateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
              >
                {provider.keyCreateLabel} ↗
              </a>
            </div>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider.keyPlaceholder}
                className="pr-10 bg-[#0d1117] border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus-visible:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Base URL for Ollama */}
          {provider.showBaseUrl && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">Base URL</label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="bg-[#0d1117] border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus-visible:ring-violet-500"
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium gap-2"
        >
          {saved ? <><Check size={15} />Saved!</> : 'Save & Apply'}
        </Button>
      </div>
    </div>
  );
}
