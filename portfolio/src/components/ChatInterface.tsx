// components/ChatInterface.tsx
// Main chat panel — renders messages and the input box

'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Code2, Loader2, FileDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { addMessage, setLoading } from '@/store/slices/chatSlice';
import { ChatMessage } from '@/types';
import dynamic from 'next/dynamic';

// Load Mermaid renderer only on the client (it uses browser APIs)
const MermaidDiagram = dynamic(() => import('@/components/MermaidDiagram'), { ssr: false });

// Renders a single chat message bubble
function MessageBubble({ message, repoName }: { message: ChatMessage; repoName: string }) {
  const isUser = message.role === 'user';
  const [exporting, setExporting] = useState(false);

  const handleExportDocx = async () => {
    setExporting(true);
    try {
      const { exportMessageAsDocx } = await import('@/utils/exportDocx');
      await exportMessageAsDocx(message, repoName);
    } finally {
      setExporting(false);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-violet-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-2xl">
      {/* Assistant label + export button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
            <Code2 size={11} className="text-white" />
          </div>
          <span className="text-xs font-medium text-slate-400">RepoBrainAI</span>
        </div>
        <button
          onClick={handleExportDocx}
          disabled={exporting}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-40"
        >
          <FileDown size={11} />
          <span>{exporting ? 'Exporting…' : 'Export .docx'}</span>
        </button>
      </div>

      {/* Answer text */}
      <div className="bg-[#161b22] border border-white/10 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>

      {/* Mermaid diagram */}
      {message.mermaidDiagram && (
        <MermaidDiagram chart={message.mermaidDiagram} />
      )}

      {/* Code block */}
      {message.codeBlock && (
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {message.codeBlock.language}
            </span>
          </div>
          <pre className="px-4 py-3 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
            <code>{message.codeBlock.code}</code>
          </pre>
        </div>
      )}

      {/* Citation pills */}
      {message.citations && message.citations.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {message.citations.map((c) => (
            <span
              key={c}
              className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/10"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Animated typing indicator while waiting for AI response
function TypingIndicator() {
  return (
    <div className="flex flex-col gap-2 max-w-2xl">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
          <Code2 size={11} className="text-white" />
        </div>
        <span className="text-xs font-medium text-slate-400">RepoBrainAI</span>
      </div>
      <div className="bg-[#161b22] border border-white/10 rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
        <Loader2 size={13} className="text-violet-400 animate-spin" />
        <span className="text-xs text-slate-500">Searching codebase…</span>
      </div>
    </div>
  );
}

// Full chat interface with message list and input bar
export default function ChatInterface() {
  const dispatch = useAppDispatch();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSessionId = useAppSelector((s) => s.chat.activeSessionId);
  const isLoading = useAppSelector((s) => s.chat.isLoading);
  const sessions = useAppSelector((s) => s.chat.sessions);
  const indexedFiles = useAppSelector((s) => s.repo.indexedFiles);
  const activeRepo = useAppSelector((s) => s.repo.activeRepo);
  const repositories = useAppSelector((s) => s.repo.repositories);
  const repoName = (activeRepo ?? repositories[0])?.name ?? 'codebase';
  const session = sessions.find((s) => s.id === activeSessionId);
  const messages = session?.messages ?? [];

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send a user message and get AI reply
  const handleSend = async () => {
    if (!input.trim() || !activeSessionId || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage({ sessionId: activeSessionId, message: userMsg }));
    setInput('');
    dispatch(setLoading(true));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.content,
          indexedFiles,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'API error');

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        codeBlock: data.codeBlock ?? undefined,
        mermaidDiagram: data.mermaidDiagram ?? undefined,
        citations: data.citations?.length > 0 ? data.citations : undefined,
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage({ sessionId: activeSessionId, message: assistantMsg }));
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't get a response. ${err instanceof Error ? err.message : 'Please check your API key in .env.local and restart the dev server.'}`,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage({ sessionId: activeSessionId, message: errorMsg }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Submit on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Code2 size={18} className="text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">Ask anything about your codebase</p>
            <p className="text-xs text-slate-600 max-w-xs">
              Try: "Explain the architecture", "Draw a sequence diagram", or "How does auth work?"
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MessageBubble message={msg} repoName={repoName} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={isLoading ? 'Waiting for response…' : 'Ask anything about your codebase…'}
          className="flex-1 bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
        >
          {isLoading ? (
            <Loader2 size={15} className="text-white animate-spin" />
          ) : (
            <Send size={15} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}