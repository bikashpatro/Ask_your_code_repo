// components/Navbar.tsx
// Top navigation bar with LLM provider settings access

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Code2, Settings } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppStore';
import dynamic from 'next/dynamic';

const LLMSettings = dynamic(() => import('@/components/LLMSettings'), { ssr: false });

const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq · LLaMA',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
};

export default function Navbar() {
  const [showSettings, setShowSettings] = useState(false);
  const provider = useAppSelector((s) => s.llm.provider);
  const model = useAppSelector((s) => s.llm.model);

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d1117]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">RepoBrainAI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
          <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</Link>

          {/* Active provider badge */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 bg-[#161b22] border border-white/10 rounded-lg px-3 py-1.5 hover:border-violet-500/50 transition-all group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-slate-300 group-hover:text-white">
              {PROVIDER_LABELS[provider]} · {model.split('-').slice(0, 2).join('-')}
            </span>
            <Settings size={11} className="text-slate-500 group-hover:text-violet-400" />
          </button>
        </div>
      </nav>

      {showSettings && <LLMSettings onClose={() => setShowSettings(false)} />}
    </>
  );
}
