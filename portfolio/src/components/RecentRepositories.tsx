// components/RecentRepositories.tsx
// Displays a list of recently indexed repositories

'use client';

import { motion } from 'framer-motion';
import { FileCode2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { clearRepositories, setActiveRepo } from '@/store/slices/repoSlice';
import { useRouter } from 'next/navigation';
import { Repository } from '@/types';

// Color map for language badges
const langColor: Record<string, string> = {
  Python: 'text-yellow-400',
  TypeScript: 'text-blue-400',
  JavaScript: 'text-yellow-300',
};

// Renders a single repository card
function RepoCard({ repo, onClick }: { repo: Repository; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-[#161b22] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-violet-500/40 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <FileCode2 size={14} className={langColor[repo.language] ?? 'text-slate-400'} />
          </div>
          <span className="text-sm font-medium text-white">{repo.name}</span>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
          Indexed
        </Badge>
      </div>
      <p className="text-xs text-slate-500 truncate">{repo.path}</p>
      {repo.filesIndexed !== undefined && (
        <p className="text-[11px] text-slate-600">{repo.filesIndexed} files indexed</p>
      )}
    </motion.div>
  );
}

// Renders the full recent repositories section
export default function RecentRepositories() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const repositories = useAppSelector((s) => s.repo.repositories);

  // Open a repository in the Q&A interface
  const handleOpen = (repo: Repository) => {
    dispatch(setActiveRepo(repo));
    router.push('/qa');
  };

  if (repositories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Recent Repositories</span>
        <button
          onClick={() => dispatch(clearRepositories())}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <X size={12} /> Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {repositories.map((repo) => (
          <RepoCard key={repo.id} repo={repo} onClick={() => handleOpen(repo)} />
        ))}
      </div>
    </motion.div>
  );
}