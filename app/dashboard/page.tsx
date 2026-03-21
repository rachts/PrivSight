'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation, animate, Variants } from 'framer-motion';
import WebcamPreview from '@/components/WebcamPreview';
import PrivacyShield from '@/components/PrivacyShield';
import { usePrivSightSocket } from '@/hooks/usePrivSightSocket';

// Counter component for animated numbers
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.8,
      onUpdate(v) {
        setDisplayValue(v);
      },
    });
    return () => controls.stop();
  }, [value]);
  
  return <span>{displayValue.toFixed(0)}</span>;
};

// Layout variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

export default function DashboardPage() {
  const { presenceData, connectionStatus, isConnected, sendCommand } = usePrivSightSocket();

  return (
    <div className="flex-1 overflow-y-auto p-8 scene-container relative">
      <PrivacyShield />
      
      {/* Top Bar */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Security Dashboard</h2>
          <p className="text-slate-400 text-sm">Real-time local AI privacy monitoring</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center space-x-2 transition-colors duration-300 ${
            connectionStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
            connectionStatus === 'reconnecting' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
            'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 
              connectionStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' : 
              'bg-red-500'
            }`}></span>
            <span className="capitalize">{connectionStatus === 'connected' ? 'Backend Connected' : connectionStatus}</span>
          </div>
          <button 
            className="px-6 py-2 bg-white text-slate-950 rounded-full font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            onClick={() => {
              sendCommand('toggle_privacy_mode', { active: true }); // Example trigger
            }}
          >
            Sleep Mode
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Left Col - Video Feed */}
        <div className="lg:col-span-2 space-y-6">
          <motion.section 
            variants={cardVariants}
            className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span>Live Intelligence Feed</span>
              </h3>
              <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-cyan-400 border border-slate-700 shadow-inner">
                <AnimatedNumber value={presenceData?.performanceMetrics?.fps || 0} /> FPS
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 20 }}
              className="p-2 bg-black rounded-xl border-2 border-slate-800 relative z-10 transition-all duration-300 shadow-2xl"
            >
              <WebcamPreview />
            </motion.div>
          </motion.section>

          {/* Activity Log */}
          <motion.section variants={cardVariants} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-3 hover:bg-slate-800/50 rounded-xl transition-colors cursor-default">
                  <div className="mt-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">User Recognized</p>
                    <p className="text-xs text-slate-500">Authorized access granted. System monitoring active.</p>
                  </div>
                  <span className="text-xs text-slate-600 ml-auto font-mono">Just now</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right Col - Status Cards */}
        <div className="space-y-6">
          
          <motion.section variants={cardVariants} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-medium tracking-wide text-slate-400 uppercase mb-4">Presence State</h3>
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden group">
              
              {/* Status Logic */}
              {(() => {
                let color = "text-slate-400";
                let bgColor = "bg-slate-500/10";
                let borderColor = "border-slate-500/20";
                let glow = "shadow-none";
                let icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>;
                let title = "Syncing...";

                if (presenceData?.status === 'user_detected') {
                  color = "text-emerald-400";
                  bgColor = "bg-emerald-500/10";
                  borderColor = "border-emerald-500/20";
                  glow = "shadow-[0_0_30px_rgba(16,185,129,0.15)]";
                  icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>;
                  title = "Authorized User";
                } else if (presenceData?.status === 'multiple_faces') {
                  color = "text-red-400";
                  bgColor = "bg-red-500/10";
                  borderColor = "border-red-500/20";
                  glow = "shadow-[0_0_30px_rgba(239,68,68,0.2)]";
                  icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>;
                  title = "Shoulder Surfing!";
                } else if (presenceData?.status === 'unknown_detected') {
                  color = "text-amber-400";
                  bgColor = "bg-amber-500/10";
                  borderColor = "border-amber-500/20";
                  glow = "shadow-[0_0_30px_rgba(245,158,11,0.15)]";
                  icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>;
                  title = "Unknown Person";
                } else if (presenceData?.status === 'no_face') {
                  color = "text-slate-400";
                  bgColor = "bg-slate-500/10";
                  borderColor = "border-slate-500/20";
                  glow = "";
                  icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>;
                  title = "No Face Detected";
                }

                return (
                  <div className={`relative px-8 py-10 w-full rounded-xl border ${borderColor} ${bgColor} ${glow} transition-all duration-500 flex flex-col items-center justify-center text-center`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                    <svg className={`w-16 h-16 ${color} mb-4 relative z-10 transition-transform duration-500 group-hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icon}
                    </svg>
                    <h4 className={`text-xl font-bold ${color} relative z-10`}>{title}</h4>
                    <p className="text-slate-300 text-sm mt-2 relative z-10">
                      {presenceData?.status === 'multiple_faces' ? 'Screen blurred for safety.' : 'System is enforcing privacy limits.'}
                    </p>
                  </div>
                );
              })()}

            </div>
          </motion.section>

          <motion.section variants={cardVariants} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-sm font-medium tracking-wide text-slate-400 uppercase mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Face Recognition Confidence</span>
                  <span className="text-cyan-400 font-mono">
                    <AnimatedNumber value={presenceData?.confidence ? Math.round(presenceData.confidence * 100) : 0} />%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(presenceData?.confidence || 0) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">CPU Usage</span>
                  <span className="text-blue-400 font-mono"><AnimatedNumber value={presenceData?.performanceMetrics?.cpuUsage || 0} />%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, presenceData?.performanceMetrics?.cpuUsage || 0)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Processing Latency</span>
                  <span className="text-indigo-400 font-mono"><AnimatedNumber value={presenceData?.performanceMetrics?.latency || 0} />ms</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (presenceData?.performanceMetrics?.latency || 0) / 2)}%` }}></div>
                </div>
              </div>
            </div>
          </motion.section>

        </div>
      </motion.div>
    </div>
  );
}
