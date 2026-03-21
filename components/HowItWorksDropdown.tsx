'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Camera Detection',
    description: 'Monitors external feeds with OpenCV to detect faces.'
  },
  {
    number: 2,
    title: 'Face Recognition',
    description: 'Compares detected faces against your secure local profile.'
  },
  {
    number: 3,
    title: 'Attention Detection',
    description: 'Tracks eye gaze and head pose to ensure you are watching.'
  },
  {
    number: 4,
    title: 'Privacy Protection',
    description: 'Instantly blurs OS notifications if a stranger is detected.'
  }
];

export default function HowItWorksDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 rounded-xl font-semibold transition-all flex items-center gap-2"
        aria-expanded={isOpen}
      >
        How It Works
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="absolute left-1/2 -translate-x-1/2 mt-4 w-80 sm:w-96 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden"
          >
            <div className="p-2">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.1, type: 'spring' }}
                  className="p-4 hover:bg-slate-800/60 rounded-xl transition-colors cursor-default flex gap-4 items-start group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-semibold mb-1 group-hover:text-cyan-400 transition-colors">{step.title}</h4>
                    <p className="text-slate-400 text-sm leading-snug">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
              <motion.div 
                className="mt-2 p-3 border-t border-slate-800/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                 <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full block text-center text-sm font-medium text-cyan-500 hover:text-cyan-400 transition-colors"
                 >
                   View Full Architecture &rarr;
                 </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900/90 backdrop-blur p-4 border-b border-slate-800 flex justify-between items-center z-10">
                <h3 className="text-xl font-bold text-white">System Architecture</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="aspect-video bg-slate-800/50 rounded-xl mb-6 flex items-center justify-center border border-slate-700">
                    <span className="text-slate-500 font-mono text-sm">[Architecture Diagram Renders Here]</span>
                </div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-2">How data flows locally:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                  <li><strong>Camera Feed</strong> captured directly using lightweight OpenCV routines.</li>
                  <li><strong>MediaPipe & face_recognition</strong> compute eye-gaze and face embeddings in an isolated Python thread.</li>
                  <li><strong>WebSocket JSON Payloads</strong> are emitted locally on <code className="text-cyan-400">ws://localhost:8765</code>.</li>
                  <li><strong>Next.js Client</strong> ingests the stream instantly without SSR delay.</li>
                  <li><strong>Electron Overlay</strong> triggers macOS Do-Not-Disturb automatically when threats are detected.</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
