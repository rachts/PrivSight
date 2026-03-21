import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col gap-8 sticky top-0">
      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        PrivSight
      </div>
      <nav className="flex flex-col gap-4 flex-1">
        <Link href="/dashboard" className="text-slate-300 hover:text-cyan-400 hover:bg-slate-800 p-3 rounded-lg transition-colors">
          Dashboard
        </Link>
        <Link href="/settings" className="text-slate-300 hover:text-cyan-400 hover:bg-slate-800 p-3 rounded-lg transition-colors">
          Settings
        </Link>
        <Link href="/logs" className="text-slate-300 hover:text-cyan-400 hover:bg-slate-800 p-3 rounded-lg transition-colors">
          Security Logs
        </Link>
      </nav>
      <div className="text-xs text-slate-500 text-center">
        Fully Local Processing
      </div>
    </aside>
  );
}
