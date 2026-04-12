// components/Sidebar.tsx
// Left sidebar — resizable width + resizable split between files/history

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileCode2, RefreshCw, Code2, MessageSquare, Trash2, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppStore';
import { setActiveSession, deleteSession } from '@/store/slices/chatSlice';
import { setIndexedFiles, setRepoPath, addRepository } from '@/store/slices/repoSlice';
import { IndexedFile } from '@/types';

// ── File System helpers ──────────────────────────────────────────────────────
interface FSDirHandle {
  kind: 'directory';
  name: string;
  entries(): AsyncIterable<[string, { kind: string; name: string }]>;
}

async function collectFiles(dirHandle: FSDirHandle, prefix = ''): Promise<IndexedFile[]> {
  const results: IndexedFile[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file') {
      results.push({ id: '', name, path: prefix ? `${prefix}/${name}` : name });
    } else if (handle.kind === 'directory') {
      const sub = await collectFiles(handle as unknown as FSDirHandle, prefix ? `${prefix}/${name}` : name);
      results.push(...sub);
    }
  }
  return results;
}

function detectLanguage(files: IndexedFile[]): string {
  const extCount: Record<string, number> = {};
  files.forEach((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    extCount[ext] = (extCount[ext] ?? 0) + 1;
  });
  const top = Object.entries(extCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const map: Record<string, string> = { py: 'Python', ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', go: 'Go', rs: 'Rust', java: 'Java', cpp: 'C++', c: 'C', cs: 'C#', h: 'C/C++' };
  return map[top] ?? 'Unknown';
}

const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 224; // w-56

const MIN_FILES_HEIGHT = 60;
const MIN_HISTORY_HEIGHT = 60;

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const activeRepo = useAppSelector((s) => s.repo.activeRepo);
  const repositories = useAppSelector((s) => s.repo.repositories);
  const indexedFiles = useAppSelector((s) => s.repo.indexedFiles);
  const sessions = useAppSelector((s) => s.chat.sessions);
  const activeSessionId = useAppSelector((s) => s.chat.activeSessionId);

  const repo = activeRepo ?? repositories[0];

  const [showFiles, setShowFiles] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  // Re-index state
  const [reindexStatus, setReindexStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [reindexCount, setReindexCount] = useState(0);

  const handleReindex = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support folder picker. Use Chrome or Edge.');
      return;
    }
    setReindexStatus('scanning');
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (o?: { mode?: string }) => Promise<FSDirHandle>;
      }).showDirectoryPicker({ mode: 'read' });

      const files = await collectFiles(dirHandle);
      const indexed = files.map((f, i) => ({ ...f, id: String(i + 1) }));
      const language = detectLanguage(indexed);

      dispatch(setIndexedFiles(indexed));
      dispatch(setRepoPath(dirHandle.name));
      dispatch(addRepository({
        id: Date.now().toString(),
        name: dirHandle.name,
        path: dirHandle.name,
        language,
        status: 'indexed',
        filesIndexed: indexed.length,
      }));

      setReindexCount(indexed.length);
      setReindexStatus('done');
      setTimeout(() => setReindexStatus('idle'), 3000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setReindexStatus('error');
        setTimeout(() => setReindexStatus('idle'), 3000);
      } else {
        setReindexStatus('idle');
      }
    }
  };

  // Sidebar width — drag right edge
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDraggingWidth = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Files section height — drag the divider between sections
  const [filesHeight, setFilesHeight] = useState(192); // ~12rem default
  const isDraggingHeight = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Width drag handlers ──────────────────────────────────────────────────
  const onWidthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingWidth.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // ── Height drag handlers ─────────────────────────────────────────────────
  const onHeightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHeight.current = true;
    startY.current = e.clientY;
    startHeight.current = filesHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [filesHeight]);

  // ── Global mouse move / up ───────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingWidth.current) {
        const delta = e.clientX - startX.current;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
        setSidebarWidth(next);
      }
      if (isDraggingHeight.current) {
        const delta = e.clientY - startY.current;
        const contentH = contentRef.current?.clientHeight ?? 400;
        const next = Math.min(
          contentH - MIN_HISTORY_HEIGHT - 8,
          Math.max(MIN_FILES_HEIGHT, startHeight.current + delta)
        );
        setFilesHeight(next);
      }
    };

    const onMouseUp = () => {
      isDraggingWidth.current = false;
      isDraggingHeight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const sessionTitle = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    const firstUser = s?.messages.find((m) => m.role === 'user');
    return firstUser?.content.slice(0, 42) ?? 'New session';
  };

  const sessionDate = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    const last = s?.messages.at(-1);
    if (!last) return '';
    return new Date(last.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="relative shrink-0 flex flex-col bg-[#0d1117] border-r border-white/10 h-full overflow-hidden"
    >
      {/* ── Repo header ── */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0">
          <Code2 size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-white truncate">
          {repo?.name ?? 'No repo selected'}
        </span>
      </div>

      {/* ── Scrollable content area ── */}
      <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden">

        {/* ── INDEXED FILES section ── */}
        <button
          onClick={() => setShowFiles((v) => !v)}
          className="px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors shrink-0"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Indexed Files</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
              {indexedFiles.length}
            </span>
            {showFiles
              ? <ChevronDown size={10} className="text-slate-600" />
              : <ChevronRight size={10} className="text-slate-600" />}
          </div>
        </button>

        {showFiles && (
          <div
            style={{ height: filesHeight }}
            className="overflow-y-auto px-2 pb-1 flex flex-col gap-0.5 shrink-0"
          >
            {indexedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 group">
                <FileCode2 size={12} className="text-slate-500 group-hover:text-violet-400 shrink-0" />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate">
                  {file.name}
                </span>
              </div>
            ))}
            {indexedFiles.length === 0 && (
              repo
                ? (
                  <div className="mx-2 my-1 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-amber-300 font-medium">Re-index needed</p>
                      <p className="text-[10px] text-amber-400/70 leading-relaxed">
                        File list is not saved across sessions. Click <span className="font-semibold">Re-index</span> below to reload.
                      </p>
                    </div>
                  </div>
                )
                : <p className="text-[10px] text-slate-600 px-2 py-1">No files indexed yet</p>
            )}
          </div>
        )}

        {/* ── Drag handle between files and history ── */}
        {showFiles && showHistory && (
          <div
            onMouseDown={onHeightMouseDown}
            className="h-2 flex items-center justify-center cursor-row-resize group shrink-0 border-t border-white/10 hover:border-violet-500/50 transition-colors"
            title="Drag to resize sections"
          >
            <div className="w-8 h-0.5 rounded-full bg-white/10 group-hover:bg-violet-500/50 transition-colors" />
          </div>
        )}

        {!showFiles && <div className="border-t border-white/10 shrink-0" />}

        {/* ── CHAT HISTORY section ── */}
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors shrink-0"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Chat History</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
              {sessions.length}
            </span>
            {showHistory
              ? <ChevronDown size={10} className="text-slate-600" />
              : <ChevronRight size={10} className="text-slate-600" />}
          </div>
        </button>

        {showHistory && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5 min-h-0">
            {sessions.length === 0 && (
              <p className="text-[10px] text-slate-600 px-2 py-1">No sessions yet</p>
            )}
            {[...sessions].reverse().map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  className={`group flex items-start justify-between gap-1 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                    isActive ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-white/5'
                  }`}
                  onClick={() => dispatch(setActiveSession(s.id))}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <MessageSquare size={11} className={`mt-0.5 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-600'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11px] leading-tight truncate ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                        {sessionTitle(s.id)}
                      </span>
                      <span className="text-[9px] text-slate-600 mt-0.5">
                        {s.messages.length} msg · {sessionDate(s.id)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch(deleteSession(s.id)); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Re-index button ── */}
      <div className="p-3 border-t border-white/10 shrink-0 flex flex-col gap-2">
        {/* Status feedback */}
        {reindexStatus === 'done' && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 size={11} />
            <span>{reindexCount} files re-indexed</span>
          </div>
        )}
        {reindexStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400">
            <AlertCircle size={11} />
            <span>Re-index failed</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleReindex}
          disabled={reindexStatus === 'scanning'}
          className="w-full border-white/10 bg-transparent text-slate-400 hover:text-white text-xs gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={11} className={reindexStatus === 'scanning' ? 'animate-spin' : ''} />
          {reindexStatus === 'scanning' ? 'Scanning…' : 'Re-index'}
        </Button>
      </div>

      {/* ── Right edge drag handle (resize sidebar width) ── */}
      <div
        onMouseDown={onWidthMouseDown}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize group flex items-center justify-center z-10"
        title="Drag to resize sidebar"
      >
        <div className="w-0.5 h-8 rounded-full bg-white/10 group-hover:bg-violet-500/60 group-hover:w-1 transition-all" />
      </div>
    </aside>
  );
}