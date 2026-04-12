// components/StatsBar.tsx
// Bottom stats bar showing key product metrics

'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

// Renders the 3-stat footer row
export default function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="w-full max-w-3xl mx-auto border-t border-white/10 pt-6 grid grid-cols-3 gap-4 text-center"
    >
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-emerald-400">30+</span>
        <span className="text-xs text-slate-500">Languages Supported</span>
      </div>
      <div className="flex flex-col gap-1 items-center">
        <Zap size={22} className="text-slate-400" />
        <span className="text-xs text-slate-500">Popular Repository</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-emerald-400">Fast</span>
        <span className="text-xs text-slate-500">Local Embeddings</span>
      </div>
    </motion.div>
  );
}