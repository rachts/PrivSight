'use client';

import React, { useState } from 'react';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Camera Detection',
      icon: '📷',
      description: 'PRIVSIGHT continuously monitors your webcam with real-time face detection using OpenCV and deep learning models.',
      details: [
        'Captures frames at 15-30 fps depending on system load',
        'Processes frames locally on your device',
        'No data sent to any external servers',
        'Adaptive frame skipping for optimal performance'
      ]
    },
    {
      number: 2,
      title: 'Face Recognition',
      icon: '🔍',
      description: 'Detected faces are analyzed and compared against your registered face profile using 128-dimensional face embeddings.',
      details: [
        'Face landmarks extraction and validation',
        'Embedding generation using state-of-the-art models',
        'Confidence scoring for accuracy verification',
        'Multi-face detection and processing'
      ]
    },
    {
      number: 3,
      title: 'Attention Detection',
      icon: '👁️',
      description: 'Eye gaze tracking and head pose estimation determine if you\'re actively looking at your screen.',
      details: [
        'MediaPipe Face Mesh for facial landmarks',
        'Real-time gaze direction calculation',
        'Head rotation angles (pitch, yaw, roll)',
        'Eyes-open/closed detection'
      ]
    },
    {
      number: 4,
      title: 'Threat Analysis',
      icon: '⚠️',
      description: 'The system analyzes multiple data points to determine the privacy threat level in real-time.',
      details: [
        'Single vs. multiple faces detection',
        'Registered vs. unknown person identification',
        'Attention status verification',
        'System status and confidence metrics'
      ]
    },
    {
      number: 5,
      title: 'Notification Classification',
      icon: '🏷️',
      description: 'Incoming notifications are classified by sensitivity and filtered based on detected privacy threats.',
      details: [
        '40+ pre-classified applications by default',
        'Sensitivity levels: Public, Moderate, Sensitive',
        'Custom rules per application',
        'Context-aware filtering'
      ]
    },
    {
      number: 6,
      title: 'Privacy Protection',
      icon: '🛡️',
      description: 'Unauthorized viewers trigger automatic notification blur or hiding to protect your sensitive information.',
      details: [
        'Software overlay blur on notification areas',
        'Instant activation on threat detection',
        'Configurable blur intensity (0-100)',
        'Smooth animation transitions'
      ]
    }
  ];

  const performanceMetrics = [
    { metric: 'CPU Usage', value: '6-8%', target: '<10%', status: 'Excellent' },
    { metric: 'Memory Usage', value: '140-180 MB', target: '<200 MB', status: 'Excellent' },
    { metric: 'Detection Latency', value: '30-50 ms', target: '<100 ms', status: 'Excellent' },
    { metric: 'Processing FPS', value: '20-24 fps', target: '15-30 fps', status: 'Excellent' },
    { metric: 'Startup Time', value: '~2 seconds', target: '<3 seconds', status: 'Excellent' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            PRIVSIGHT
          </a>
          <a href="/" className="text-slate-300 hover:text-cyan-400 transition-colors">
            ← Back
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-in space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              How <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PRIVSIGHT</span> Works
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A comprehensive breakdown of our intelligent privacy protection system and how it keeps your notifications safe
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="animate-in stagger-1 opacity-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  onClick={() => setActiveStep(activeStep === step.number ? null : step.number)}
                  className="w-full group relative bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 text-left"
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-start gap-6">
                    <div className="text-4xl flex-shrink-0">{step.icon}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-slate-950">
                          {step.number}
                        </div>
                        <h3 className="text-xl font-semibold text-cyan-400">{step.title}</h3>
                      </div>
                      <p className="text-slate-300">{step.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      {activeStep === step.number ? '−' : '+'}
                    </div>
                  </div>
                </button>

                {/* Expandable Details */}
                {activeStep === step.number && (
                  <div className="animate-in bg-slate-800/50 border border-slate-700 border-t-0 rounded-b-lg p-6 space-y-4 backdrop-blur-sm">
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                          </div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-16 px-6 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Performance <span className="text-cyan-400">Metrics</span>
            </h2>
            <p className="text-slate-400 text-lg">
              PRIVSIGHT achieves enterprise-grade performance with minimal system resource usage
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {performanceMetrics.map((item, index) => (
              <div
                key={item.metric}
                className="animate-in stagger-1 opacity-0 group bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-cyan-400 rounded-lg transition-opacity"></div>
                <p className="text-slate-400 text-sm mb-2 relative z-10">{item.metric}</p>
                <p className="text-2xl font-bold text-cyan-400 mb-2 relative z-10">{item.value}</p>
                <p className="text-xs text-slate-500 mb-3 relative z-10">Target: {item.target}</p>
                <div className="inline-block px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400 relative z-10">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              System <span className="text-cyan-400">Architecture</span>
            </h2>
            <p className="text-slate-400 text-lg">
              How all components work together seamlessly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 animate-in">
            {/* Frontend */}
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-lg p-8 hover:border-blue-400/60 transition-all duration-300 group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg transition-opacity"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Frontend</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ Electron Desktop App</li>
                  <li>✓ React Components</li>
                  <li>✓ Real-time Dashboard</li>
                  <li>✓ Settings & Configuration</li>
                </ul>
              </div>
            </div>

            {/* IPC Layer */}
            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900 border border-cyan-500/30 rounded-lg p-8 hover:border-cyan-400/60 transition-all duration-300 group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-lg transition-opacity"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Communication</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ WebSocket IPC</li>
                  <li>✓ Type-Safe Protocol</li>
                  <li>✓ Real-time Updates</li>
                  <li>✓ Error Handling</li>
                </ul>
              </div>
            </div>

            {/* Backend */}
            <div className="bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-500/30 rounded-lg p-8 hover:border-green-400/60 transition-all duration-300 group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg transition-opacity"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-green-400 mb-4">Backend</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ Python AI Engine</li>
                  <li>✓ Face Recognition</li>
                  <li>✓ Attention Detection</li>
                  <li>✓ Local Processing Only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-time <span className="text-cyan-400">Detection Flow</span>
            </h2>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-8 backdrop-blur-sm overflow-x-auto animate-in">
            <div className="flex items-center justify-between gap-4 min-w-max md:min-w-full md:flex-wrap">
              {[
                { label: 'Capture Frame', time: '33ms' },
                { label: 'Face Detection', time: '15ms' },
                { label: 'Recognition', time: '20ms' },
                { label: 'Attention Check', time: '10ms' },
                { label: 'Threat Analysis', time: '5ms' },
                { label: 'Notification Filter', time: '2ms' },
                { label: 'Update UI', time: '5ms' }
              ].map((step, index) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center font-semibold text-slate-950">
                      {index + 1}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-cyan-400">{step.label}</p>
                      <p className="text-xs text-slate-400">{step.time}</p>
                    </div>
                  </div>
                  {index < 6 && (
                    <div className="hidden md:flex w-8 text-cyan-400 text-xl">→</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-sm mt-8">
              Total Processing Time: ~90ms per frame | Achieves 20-24 fps on average systems
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center animate-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Protect Your Privacy?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            PRIVSIGHT is production-ready and waiting for you to take control of your notifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </a>
            <a
              href="/docs"
              className="px-8 py-3 border border-cyan-500/50 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 transition-all duration-300"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-500">
        <p>PRIVSIGHT v2.0 - Created by Rachit | All processing happens locally on your device</p>
      </footer>
    </div>
  );
}
