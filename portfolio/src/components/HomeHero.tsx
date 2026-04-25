// components/HomeHero.tsx
// Hero section of the home page — headline, badge, repo input, recent repos, stats

'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import RepoInput from '@/components/RepoInput';
import RecentRepositories from '@/components/RecentRepositories';
import StatsBar from '@/components/StatsBar';

// Full hero section assembled from smaller components
export default function HomeHero() {
  return (
    <main className="flex flex-col flex-1 items-center justify-start gap-10 px-6 py-16">
      {/* Badge row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs px-3 py-1 gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
          AI-Powered · RAG Pipeline
        </Badge>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center flex flex-col gap-3"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Ask Your Codebase Anything
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
          Index any repository and get instant, citation-backed answers powered by Claude AI.
        </p>
      </motion.div>

      {/* Repo input */}
      <div className="w-full max-w-xl">
        <RepoInput />
      </div>

      {/* Recent repos */}
      <div className="w-full max-w-3xl">
        <RecentRepositories />
      </div>

      {/* Stats */}
      <div className="w-full max-w-3xl mt-auto">
        <StatsBar />
      </div>
    </main>
  );
}