// components/Navbar.tsx
// Top navigation bar shared across all pages

'use client';

import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Renders the top navbar with logo, nav links, and sign-in button
export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d1117]">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
          <Code2 size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white">RepoBrainAI</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
          Docs
        </Link>
        <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
          GitHub
        </Link>
      </div>

      <Button
        size="sm"
        className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 rounded-md"
      >
        Sign In
      </Button>
    </nav>
  );
}