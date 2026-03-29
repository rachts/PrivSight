'use client';

import React, { useRef, useEffect, useState } from 'react';
import { usePrivSightSocket } from '@/hooks/usePrivSightSocket';

export default function WebcamPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { presenceData, sendFrame, isConnected } = usePrivSightSocket();
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    // Start WebRTC camera stream
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      })
      .catch((err) => {
        console.error('Error accessing webcam via WebRTC:', err);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame streaming loop for cloud processing
  useEffect(() => {
    if (!streamActive || !isConnected || !videoRef.current) return;

    // Create offscreen canvas for frame capture if it doesn't exist
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 320; // Lower res for faster upload
      offscreenCanvasRef.current.height = 240;
    }

    const captureInterval = setInterval(() => {
      if (videoRef.current && offscreenCanvasRef.current) {
        const ctx = offscreenCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          const frameData = offscreenCanvasRef.current.toDataURL('image/jpeg', 0.7);
          sendFrame(frameData);
        }
      }
    }, 150); // ~7 FPS (balanced for latency vs performance)

    return () => clearInterval(captureInterval);
  }, [streamActive, isConnected, sendFrame]);

  useEffect(() => {
    // Draw face bounding boxes over the WebRTC stream
    if (!canvasRef.current || !videoRef.current || !streamActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video size
    canvas.width = videoRef.current.clientWidth;
    canvas.height = videoRef.current.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (presenceData && presenceData.faces && presenceData.faces.length > 0) {
      // The Python backend is scaling frames. Default webcam handler frame size is usually 640x480.
      // But we are sending 320x240 frames now.
      const scaleX = canvas.width / 320;
      const scaleY = canvas.height / 240;

      presenceData.faces.forEach((face) => {
        const { x, y, width, height } = face.position;
        const mappedX = x * scaleX;
        const mappedY = y * scaleY;
        const mappedW = width * scaleX;
        const mappedH = height * scaleY;

        ctx.lineWidth = 3;
        
        let color = 'rgba(74, 222, 128, 0.8)'; // Green (Registered user)
        let label = 'Authorized';

        if (!face.isRegisteredUser) {
          color = 'rgba(248, 113, 113, 0.8)'; // Red (Unknown user / Shoulder surfing)
          label = 'Unknown / Threat';
        }

        ctx.strokeStyle = color;
        ctx.strokeRect(mappedX, mappedY, mappedW, mappedH);

        // Draw label background
        ctx.fillStyle = color;
        ctx.fillRect(mappedX, mappedY - 25, mappedW, 25);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mappedX + 5, mappedY - 12);
      });
    } else if (presenceData?.status === 'no_face') {
      // Grey state when no face detected
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; // Slate 400 with 0.2 opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Face Detected', canvas.width / 2, canvas.height / 2);
    }
  }, [presenceData, streamActive]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl aspect-video w-full flex items-center justify-center">
      {!streamActive && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="flex flex-col items-center space-y-3">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Starting WebRTC Camera...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror effect
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
