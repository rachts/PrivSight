import React from 'react';
import { motion } from 'framer-motion';

export default function StatusCards({ fps, cpu, latency }: { fps: number, cpu: number, latency?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
        <h4 className="text-slate-400 text-sm">FPS</h4>
        <div className="text-2xl font-bold text-cyan-400">{fps?.toFixed(1) || 0}</div>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
        <h4 className="text-slate-400 text-sm">CPU Usage</h4>
        <div className="text-2xl font-bold text-blue-400">{cpu?.toFixed(1) || 0}%</div>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
        <h4 className="text-slate-400 text-sm">Latency</h4>
        <div className="text-2xl font-bold text-emerald-400">{latency || '< 50'}ms</div>
      </motion.div>
    </div>
  );
}
