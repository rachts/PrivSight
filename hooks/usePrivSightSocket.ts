import { useState, useEffect, useCallback } from 'react';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceInfo {
  id: string;
  position: Box;
  isRegisteredUser: boolean;
  registeredFaceId: string | null;
  confidence: number;
}

export interface AttentionData {
  status: string;
  gazeX?: number;
  gazeY?: number;
  eyesOpen?: boolean;
}

export interface PerformanceData {
  cpuUsage: number;
  memoryUsage: number;
  fps: number;
  latency: number;
}

export interface PresenceUpdate {
  status: 'user_detected' | 'unknown_detected' | 'multiple_faces' | 'no_face' | 'error' | 'shoulder_surfing_active' | 'multiple_faces_safe';
  timestamp: number;
  confidence: number;
  detectedFaces: number;
  faces: FaceInfo[];
  attention: AttentionData;
  performanceMetrics?: PerformanceData;
  framePreview?: string;
}

export function usePrivSightSocket(url: string = 'ws://localhost:8765') {
  const [presenceData, setPresenceData] = useState<PresenceUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Prevent SSR WebSocket errors

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let reconnectAttempts = 0;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;
      
      try {
        ws = new WebSocket(url);
        
        ws.onopen = () => {
          if (!isComponentMounted) return;
          setConnectionStatus('connected');
          setSocket(ws);
          reconnectAttempts = 0; // reset
          
          ws.send(JSON.stringify({
            type: 'init',
            payload: { enableLivePreview: true, previewFrameRate: 15 }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (['privacy_mode_active', 'face_detected', 'unknown_user', 'no_face'].includes(data.type)) {
              setPresenceData(data.payload);
            } else if (data.type === 'fps_update') {
              setPresenceData(prev => prev ? { 
                  ...prev, 
                  performanceMetrics: { ...(prev.performanceMetrics || { cpuUsage: 0, memoryUsage: 0, latency: 0 }), fps: data.payload.fps } 
              } as PresenceUpdate : null);
            } else if (data.type === 'cpu_usage_update') {
              setPresenceData(prev => prev ? { 
                  ...prev, 
                  performanceMetrics: { ...(prev.performanceMetrics || { memoryUsage: 0, fps: 0, latency: 0 }), cpuUsage: data.payload.cpu } 
              } as PresenceUpdate : null);
            }
          } catch (err) {
            // silent catch
          }
        };

        ws.onclose = () => {
          if (!isComponentMounted) return;
          setConnectionStatus('reconnecting');
          setSocket(null);
          
          if (reconnectAttempts < 10) {
             const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
             reconnectAttempts++;
             reconnectTimeout = setTimeout(connect, delay);
          } else {
             setConnectionStatus('disconnected');
          }
        };

        ws.onerror = (error) => {
          // ws.onclose handles the reconnect
        };
      } catch (err) {
         if (!isComponentMounted) return;
         setConnectionStatus('reconnecting');
         reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // prevent reconnect trigger
        ws.close();
      }
    };
  }, [url]);

  const sendCommand = useCallback((type: string, payload: any) => {
    if (socket && connectionStatus === 'connected') {
      socket.send(JSON.stringify({ type, payload }));
    }
  }, [socket, connectionStatus]);

  return { presenceData, connectionStatus, isConnected: connectionStatus === 'connected', sendCommand };
}
