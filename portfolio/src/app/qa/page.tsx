// app/qa/page.tsx
// Q&A Interface — 3-panel layout: sidebar, chat, top bar

'use client';

import { Plus, Search, FileText, Loader2, Code2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { newSession } from '@/store/slices/chatSlice';

// Top bar for the Q&A interface
function QATopBar() {
  const dispatch = useAppDispatch();
  const activeRepo = useAppSelector((s) => s.repo.activeRepo);
  const repositories = useAppSelector((s) => s.repo.repositories);
  const repo = activeRepo ?? repositories[0];
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleNewSession = () => {
    dispatch(
      newSession({
        id: `session-${Date.now()}`,
        repoId: repo?.id ?? 'default',
        messages: [],
      })
    );
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const { generateCapstoneReport } = await import('@/utils/generateReport');
      await generateCapstoneReport();
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0d1117] shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
          <Code2 size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-white">CodeSearch AI</span>
      </Link>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-[#161b22] border border-white/10 rounded-lg px-3 py-1.5 w-64">
        <Search size={12} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500 truncate">
          {repo?.name ?? 'No repository'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Generate Report button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateReport}
          disabled={generatingReport}
          className="border-white/10 bg-transparent text-slate-400 hover:text-white text-xs gap-1.5 h-7"
        >
          {generatingReport
            ? <Loader2 size={11} className="animate-spin" />
            : <FileText size={11} />
          }
          {generatingReport ? 'Generating…' : 'Report'}
        </Button>

        {/* New Session button */}
        <Button
          size="sm"
          onClick={handleNewSession}
          className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5 h-7"
        >
          <Plus size={11} />
          New Session
        </Button>
      </div>
    </header>
  );
}

// Full Q&A interface page
export default function QAPage() {
  const router = useRouter();
  const repositories = useAppSelector((s) => s.repo.repositories);

  // Redirect to home if no repo has been indexed yet
  useEffect(() => {
    if (repositories.length === 0) {
      router.replace('/');
    }
  }, [repositories, router]);

  if (repositories.length === 0) return null;

  return (
    <div className="flex flex-col h-screen bg-[#0d1117]">
      <QATopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden bg-[#0d1117]">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}