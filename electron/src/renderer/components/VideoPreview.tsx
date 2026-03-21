import React, { useEffect, useRef, useState } from 'react';
import type { FaceInfo } from '../../../shared/types';

interface VideoPreviewProps {
  frameData?: string; // Base64 JPEG data
  width?: number;
  height?: number;
  showDetectionBoxes?: boolean;
  enabled?: boolean;
  detectedFaces?: FaceInfo[];
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  frameData,
  width = 640,
  height = 480,
  showDetectionBoxes = true,
  enabled = true,
  detectedFaces = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!enabled || !frameData || !canvasRef.current) {
      return;
    }

    try {
      // Create image from base64
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size based on image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);
      };

      img.crossOrigin = 'anonymous';
      img.src = `data:image/jpeg;base64,${frameData}`;
      imgRef.current = img;
    } catch (error) {
      console.error('[VideoPreview] Error rendering frame:', error);
    }
  }, [frameData, enabled]);

  if (!enabled) {
    return (
      <div className="video-preview disabled">
        <div className="preview-placeholder">
          <p>Live preview disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-preview">
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
        }}
      />
    </div>
  );
};

export default VideoPreview;
