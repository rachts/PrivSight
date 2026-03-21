'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivSightSocket } from '@/hooks/usePrivSightSocket';

export default function PrivacyShield() {
  const { presenceData } = usePrivSightSocket();

  if (!presenceData) return null;

  const shouldShield = 
    presenceData.status === 'shoulder_surfing_active' || 
    presenceData.status === 'unknown_detected';

  return (
    <AnimatePresence>
      {shouldShield && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-slate-950/80"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl text-center max-w-md shadow-[0_0_100px_rgba(239,68,68,0.2)] backdrop-blur-md"
          >
            <motion.div 
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 2, duration: 1 }}
              className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Privacy Shield Active
            </h2>
            <p className="text-red-200">
              {presenceData.status === 'shoulder_surfing_active' 
                ? 'Multiple faces detected. Shoulder surfing protection enabled.'
                : 'Unknown person detected. Screen hidden for privacy.'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
