'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

const features = [
  { icon: '👥', title: 'Shoulder Surfing Detection', desc: 'Real-time detection of multiple faces. Automatically hides sensitive notifications when unauthorized persons are present.' },
  { icon: '👁️', title: 'Smart Attention Detection', desc: 'MediaPipe-powered gaze tracking detects where you\'re looking. Hides notifications when you\'re not at your screen.' },
  { icon: '🏷️', title: 'Notification Classification', desc: 'Intelligent app sensitivity rules. Classify apps as sensitive, moderate, or public with customizable filtering.' },
  { icon: '⚡', title: 'Performance Optimization', desc: 'Lightweight and efficient with CPU usage under 10%. Real-time performance monitoring and adaptive frame skipping.' },
  { icon: '📹', title: 'Live Camera Preview', desc: 'Real-time video streaming with face detection overlays. Monitor what the system sees with 15-30 fps streaming.' },
  { icon: '🔒', title: '100% Local Processing', desc: 'All processing happens on your device. No data sent to cloud. Your privacy is completely protected.' }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export default function IntelligentPrivacyFeatures({ 
  featureData = features 
}: { 
  featureData?: typeof features 
}) {
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Intelligent Privacy Features
        </h2>
      </motion.div>
      
      {featureData.length === 0 ? (
        <div className="text-center text-slate-400 p-8 border border-dashed border-slate-700 rounded-2xl">
          <p>Analyzing system features...</p>
        </div>
      ) : (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {featureData.map((feature) => (
            <motion.div 
              key={feature.title}
              variants={itemVariants}
              whileHover={{ 
                y: -10, 
                scale: 1.02
              }}
              className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-cyan-400/40 hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.15)] rounded-2xl p-8 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Highlight gradient that follows mouse might be overkill, sticking to a nice glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <motion.div 
                className="text-4xl mb-6 inline-block bg-slate-900/50 p-4 rounded-xl shadow-inner border border-slate-800"
                whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
