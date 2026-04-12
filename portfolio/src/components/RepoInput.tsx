// components/RepoInput.tsx
// Repository path input — uses File System Access API (no upload dialog)

'use client';

import { useState } from 'react';
import { Folder, FolderSearch, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { setRepoPath, addRepository, setIndexedFiles } from '@/store/slices/repoSlice';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IndexedFile } from '@/types';

// Extended type for File System Access API (not fully typed in TS lib yet)
interface FSHandle {
  kind: 'file' | 'directory';
  name: string;
}
interface FSDirHandle extends FSHandle {
  kind: 'directory';
  entries(): AsyncIterable<[string, FSHandle]>;
}

// Recursively collect all files from a directory handle
async function collectFiles(
  dirHandle: FSDirHandle,
  prefix = ''
): Promise<IndexedFile[]> {
  const results: IndexedFile[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file') {
      results.push({
        id: '',
        name,
        path: prefix ? `${prefix}/${name}` : name,
      });
    } else if (handle.kind === 'directory') {
      const sub = await collectFiles(
        handle as unknown as FSDirHandle,
        prefix ? `${prefix}/${name}` : name
      );
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

export default function RepoInput() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const repoPath = useAppSelector((s) => s.repo.repoPath);

  const [pendingFiles, setPendingFiles] = useState<IndexedFile[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  // Use File System Access API — no browser upload dialog
  const handleBrowse = async () => {
    // Fallback: browser doesn't support showDirectoryPicker
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support the folder picker. Please use Chrome or Edge.');
      return;
    }

    setBrowsing(true);
    try {
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (opts?: { mode?: string }) => Promise<FSDirHandle>;
      }).showDirectoryPicker({ mode: 'read' });

      dispatch(setRepoPath(dirHandle.name));

      // Recursively gather all files — no upload dialog
      const files = await collectFiles(dirHandle);
      // Re-number ids after recursion
      const indexed = files.map((f, i) => ({ ...f, id: String(i + 1) }));
      setPendingFiles(indexed);
    } catch (err: unknown) {
      // User cancelled — not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      setBrowsing(false);
    }
  };

  // Start indexing: populate Redux and navigate to Q&A
  const handleStartIndexing = async () => {
    if (!repoPath.trim()) return;
    setIsIndexing(true);

    await new Promise((r) => setTimeout(r, 600));

    const language = detectLanguage(pendingFiles);
    dispatch(setIndexedFiles(pendingFiles));
    dispatch(
      addRepository({
        id: Date.now().toString(),
        name: repoPath,
        path: repoPath,
        language,
        status: 'indexed',
        filesIndexed: pendingFiles.length,
      })
    );

    setIsIndexing(false);
    router.push('/qa');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="bg-[#161b22] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
        <label className="text-xs text-slate-400 font-medium">Repository Path</label>

        {/* Path input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Folder size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={repoPath}
              onChange={(e) => {
                dispatch(setRepoPath(e.target.value));
                setPendingFiles([]);
              }}
              placeholder="Select a folder or type a path…"
              className="pl-8 bg-[#0d1117] border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus-visible:ring-violet-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBrowse}
            disabled={browsing}
            className="border-white/10 bg-[#0d1117] text-slate-300 hover:text-white text-xs gap-1.5 shrink-0"
          >
            {browsing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FolderSearch size={13} />
            )}
            {browsing ? 'Reading…' : 'Browse'}
          </Button>
        </div>

        {/* File count preview */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} found — ready to index
          </div>
        )}

        {/* Start indexing button */}
        <Button
          onClick={handleStartIndexing}
          disabled={!repoPath.trim() || isIndexing || browsing}
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