// components/RepoInput.tsx
// Repository input — supports local folder (File System Access API) and GitHub URL

'use client';

import { useState } from 'react';
import { Folder, FolderSearch, Plus, Loader2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/hooks/useAppStore';
import { setRepoPath, addRepository, setIndexedFiles } from '@/store/slices/repoSlice';
import { newSession } from '@/store/slices/chatSlice';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IndexedFile } from '@/types';

// Extended type for File System Access API
interface FSHandle { kind: 'file' | 'directory'; name: string; }
interface FSDirHandle extends FSHandle {
  kind: 'directory';
  entries(): AsyncIterable<[string, FSHandle]>;
}

// Recursively collect all files from a local directory handle
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

// Detect dominant language from file extensions
function detectLanguage(files: IndexedFile[]): string {
  const extCount: Record<string, number> = {};
  files.forEach((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    extCount[ext] = (extCount[ext] ?? 0) + 1;
  });
  const top = Object.entries(extCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const map: Record<string, string> = {
    py: 'Python', ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript',
    jsx: 'JavaScript', go: 'Go', rs: 'Rust', java: 'Java', rb: 'Ruby',
    cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP', swift: 'Swift', h: 'C/C++',
  };
  return map[top] ?? 'Unknown';
}

type Tab = 'local' | 'github';

export default function RepoInput() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('local');
  const [repoName, setRepoName] = useState('');
  const [pendingFiles, setPendingFiles] = useState<IndexedFile[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubError, setGithubError] = useState('');

  // Handle local folder browse via File System Access API
  const handleBrowse = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support the folder picker. Please use Chrome or Edge.');
      return;
    }
    setBrowsing(true);
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (opts?: { mode?: string }) => Promise<FSDirHandle>;
      }).showDirectoryPicker({ mode: 'read' });

      setRepoName(dirHandle.name);
      dispatch(setRepoPath(dirHandle.name));
      const files = await collectFiles(dirHandle);
      setPendingFiles(files.map((f, i) => ({ ...f, id: String(i + 1) })));
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') console.error(err);
    } finally {
      setBrowsing(false);
    }
  };

  // Fetch file tree from GitHub API via backend route
  const handleGithubFetch = async () => {
    if (!githubUrl.trim()) return;
    setGithubError('');
    setBrowsing(true);
    setPendingFiles([]);
    try {
      const res = await fetch('/api/github-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGithubError(data.error ?? 'Failed to fetch repository');
        return;
      }
      setRepoName(data.repoName);
      dispatch(setRepoPath(data.repoName));
      setPendingFiles(data.files);
      if (data.truncated) {
        setGithubError('Repository is very large — only first 100,000 files shown.');
      }
    } catch {
      setGithubError('Network error. Please check your connection.');
    } finally {
      setBrowsing(false);
    }
  };

  // Dispatch indexed files to Redux and navigate to Q&A
  const handleStartIndexing = async () => {
    if (!repoName.trim() || pendingFiles.length === 0) return;
    setIsIndexing(true);
    await new Promise((r) => setTimeout(r, 600));

    const language = detectLanguage(pendingFiles);
    dispatch(setIndexedFiles(pendingFiles));
    dispatch(addRepository({
      id: Date.now().toString(),
      name: repoName,
      path: tab === 'github' ? githubUrl : repoName,
      language,
      status: 'indexed',
      filesIndexed: pendingFiles.length,
    }));
    dispatch(newSession({
      id: Date.now().toString(),
      repoId: repoName,
      messages: [],
    }));

    setIsIndexing(false);
    router.push('/qa');
  };

  // Switch tab and reset state
  const handleTabSwitch = (t: Tab) => {
    setTab(t);
    setPendingFiles([]);
    setRepoName('');
    setGithubError('');
    setBrowsing(false);
    dispatch(setRepoPath(''));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="bg-[#161b22] border border-white/10 rounded-xl p-5 flex flex-col gap-4">

        {/* Tab toggle */}
        <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1">
          <button
            onClick={() => handleTabSwitch('local')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all ${
              tab === 'local'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder size={12} /> Local Folder
          </button>
          <button
            onClick={() => handleTabSwitch('github')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all ${
              tab === 'github'
                ? 'bg-violet-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch size={12} /> GitHub URL
          </button>
        </div>

        {/* Local folder tab */}
        {tab === 'local' && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Folder size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={repoName}
                readOnly
                placeholder="Select a local folder…"
                className="pl-8 bg-[#0d1117] border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus-visible:ring-violet-500 cursor-default"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowse}
              disabled={browsing}
              className="border-white/10 bg-[#0d1117] text-slate-300 hover:text-white text-xs gap-1.5 shrink-0"
            >
              {browsing ? <Loader2 size={13} className="animate-spin" /> : <FolderSearch size={13} />}
              {browsing ? 'Reading…' : 'Browse'}
            </Button>
          </div>
        )}

        {/* GitHub URL tab */}
        {tab === 'github' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => { setGithubUrl(e.target.value); setGithubError(''); setPendingFiles([]); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGithubFetch(); }}
                placeholder="https://github.com/owner/repo"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-[#0d1117] border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={handleGithubFetch}
                disabled={browsing || !githubUrl.trim()}
                className="flex items-center gap-1.5 border border-white/10 bg-[#0d1117] text-slate-300 hover:text-white text-xs px-3 py-2 rounded-lg shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {browsing ? <Loader2 size={13} className="animate-spin" /> : <GitBranch size={13} />}
                {browsing ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            {githubError && (
              <p className="text-[11px] text-red-400">{githubError}</p>
            )}
          </div>
        )}

        {/* File count preview */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} found — ready to index
            {repoName && <span className="text-slate-500">· {repoName}</span>}
          </div>
        )}

        {/* Start indexing button */}
        <Button
          onClick={handleStartIndexing}
          disabled={pendingFiles.length === 0 || isIndexing || browsing}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium gap-2"
        >
          {isIndexing ? (
            <><Loader2 size={15} className="animate-spin" />Indexing…</>
          ) : (
            <><Plus size={15} />Start Indexing</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
