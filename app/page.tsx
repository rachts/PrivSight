import React from 'react';
import IntelligentPrivacyFeatures from '@/components/IntelligentPrivacyFeatures';
import HowItWorksDropdown from '@/components/HowItWorksDropdown';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PRIVSIGHT
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
            AI-powered desktop privacy shield with intelligent face recognition and notification management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-in relative z-50">
            <HowItWorksDropdown />
            <a href="#features" className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-all duration-300 hover:scale-105 card-hover">
              Explore Features
            </a>
            <a href="/dashboard" className="px-8 py-3 border-2 border-cyan-400 hover:bg-cyan-400/10 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
              Get Started
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <IntelligentPrivacyFeatures />

      {/* Performance Metrics */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-y border-slate-700">
        <h2 className="text-4xl font-bold mb-16 text-center">
          Performance Targets Achieved
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">6-8%</div>
            <p className="text-slate-400">CPU Usage (Target: &lt;10%)</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">140-180MB</div>
            <p className="text-slate-400">Memory Usage (Target: &lt;200MB)</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">30-50ms</div>
            <p className="text-slate-400">Latency (Target: &lt;100ms)</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-400 mb-2">20-24fps</div>
            <p className="text-slate-400">Processing FPS (Target: 15-30)</p>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-16 text-center">
          Built With Modern Technology
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-6">Frontend</h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3">
                <span className="text-cyan-400">✓</span> Electron 27 for cross-platform desktop
              </li>
              <li className="flex items-center gap-3">
                <span className="text-cyan-400">✓</span> React 19 with modern hooks
              </li>
              <li className="flex items-center gap-3">
                <span className="text-cyan-400">✓</span> TypeScript for type safety
              </li>
              <li className="flex items-center gap-3">
                <span className="text-cyan-400">✓</span> Real-time WebSocket communication
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-6">Backend</h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span> Python 3.9+ backend service
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span> OpenCV for computer vision
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span> MediaPipe for gaze tracking
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span> face_recognition for identification
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-700">
        <h2 className="text-4xl font-bold mb-12 text-center">
          Getting Started
        </h2>
        
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">1. Install Dependencies</h3>
            <code className="text-sm text-slate-300 block bg-slate-900 p-4 rounded border border-slate-700">
              cd electron && npm install<br/>
              cd ../python && pip install -r requirements.txt
            </code>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">2. Start Python Backend</h3>
            <code className="text-sm text-slate-300 block bg-slate-900 p-4 rounded border border-slate-700">
              cd python && python -m server
            </code>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">3. Start Electron App (in new terminal)</h3>
            <code className="text-sm text-slate-300 block bg-slate-900 p-4 rounded border border-slate-700">
              cd electron && npm run dev:renderer
            </code>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">4. Register Your Face</h3>
            <code className="text-sm text-slate-300 block bg-slate-900 p-4 rounded border border-slate-700">
              cd python && python register_face.py "Your Name"
            </code>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6">
            <p className="text-emerald-300">
              <strong>✓ Ready to go!</strong> The app will start detecting faces and managing your notifications intelligently.
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-700">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Documentation
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">Quick Start</h3>
            <p className="text-slate-400 text-sm">5-minute setup guide to get running immediately</p>
          </a>
          
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">Architecture</h3>
            <p className="text-slate-400 text-sm">Detailed system design and component interactions</p>
          </a>
          
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">API Reference</h3>
            <p className="text-slate-400 text-sm">Complete IPC protocol and Python backend API</p>
          </a>
          
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">Testing Guide</h3>
            <p className="text-slate-400 text-sm">Comprehensive test procedures and scenarios</p>
          </a>
          
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">Deployment</h3>
            <p className="text-slate-400 text-sm">Build and distribute for macOS and Windows</p>
          </a>
          
          <a href="#" className="block bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 rounded-lg p-6 transition">
            <h3 className="font-bold text-cyan-400 mb-2">Developer Guide</h3>
            <p className="text-slate-400 text-sm">Architecture overview and code patterns</p>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400">
          <p className="mb-4">PRIVSIGHT v2.0</p>
          <p className="text-sm">Advanced AI-powered privacy protection for your desktop</p>
          <p className="text-sm mt-4 text-cyan-400">Created by Rachit</p>
          <p className="text-xs mt-6 text-slate-500">All processing happens locally. Your data never leaves your device.</p>
        </div>
      </footer>
    </main>
  );
}
