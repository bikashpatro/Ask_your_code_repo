// app/page.tsx
// Home page — repository selection, recent repos, and stats

import Navbar from '@/components/Navbar';
import HomeHero from '@/components/HomeHero';

// Root page — entry point for the RepoBrainAI app
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117]">
      <Navbar />
      <HomeHero />
    </div>
  );
}