import React, { useState, useEffect } from 'react';
import type { PerformanceData } from '../../../shared/types';
import '../styles/PerformanceMonitor.css';

interface PerformanceMonitorProps {
  metrics?: PerformanceData;
  targetCpu?: number;
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  targetCpu = 10,
  enabled = true,
}) => {
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!metrics || !enabled) return;

    // Keep last 30 data points
    setCpuHistory((prev) => [...prev.slice(-29), metrics.cpuUsage]);
    setFpsHistory((prev) => [...prev.slice(-29), metrics.fps]);
  }, [metrics, enabled]);

  if (!enabled || !metrics) {
    return (
      <div className="performance-monitor disabled">
        <p>Performance monitoring disabled or no data available</p>
      </div>
    );
  }

  const getCpuStatus = (): string => {
    if (metrics.cpuUsage < 5) return 'excellent';
    if (metrics.cpuUsage < 10) return 'good';
    if (metrics.cpuUsage < 20) return 'moderate';
    return 'high';
  };

  const getCpuStatusColor = (): string => {
    const status = getCpuStatus();
    switch (status) {
      case 'excellent':
        return '#10b981';
      case 'good':
        return '#3b82f6';
      case 'moderate':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getMemoryStatus = (): string => {
    if (metrics.memoryUsage < 100) return 'good';
    if (metrics.memoryUsage < 200) return 'moderate';
    return 'high';
  };

  const maxCpuHistory = Math.max(...cpuHistory, 20);
  const maxFpsHistory = Math.max(...fpsHistory, 30);

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>Performance Metrics</h3>
      </div>

      <div className="monitor-content">
        {/* Main Metrics Grid */}
        <div className="metrics-grid">
          {/* CPU Usage */}
          <div className="metric-card cpu-card">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-value" style={{ color: getCpuStatusColor() }}>
              {metrics.cpuUsage.toFixed(1)}%
            </div>
            <div className="metric-bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(metrics.cpuUsage, 100)}%`,
                  backgroundColor: getCpuStatusColor(),
                }}
              />
            </div>
            <div className="metric-target">
              Target: {targetCpu}% (Status: {getCpuStatus()})
            </div>
          </div>

          {/* Memory Usage */}
          <div className="metric-card memory-card">
            <div className="metric-label">Memory Usage</div>
            <div className="metric-value">{metrics.memoryUsage.toFixed(0)} MB</div>
            <div className="metric-bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((metrics.memoryUsage / 300) * 100, 100)}%`,
                  backgroundColor:
                    getMemoryStatus() === 'good'
                      ? '#3b82f6'
                      : getMemoryStatus() === 'moderate'
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              />
            </div>
            <div className="metric-target">Status: {getMemoryStatus()}</div>
          </div>

          {/* FPS */}
          <div className="metric-card fps-card">
            <div className="metric-label">Processing FPS</div>
            <div className="metric-value">{metrics.fps.toFixed(1)}</div>
            <div className="metric-bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((metrics.fps / 30) * 100, 100)}%`,
                  backgroundColor: '#10b981',
                }}
              />
            </div>
            <div className="metric-target">Target: 15-30 fps</div>
          </div>

          {/* Processing Time */}
          <div className="metric-card latency-card">
            <div className="metric-label">Latency</div>
            <div className="metric-value">{metrics.processingTime.toFixed(1)}ms</div>
            <div className="metric-bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((metrics.processingTime / 100) * 100, 100)}%`,
                  backgroundColor: metrics.processingTime < 100 ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
            <div className="metric-target">Target: &lt;100ms</div>
          </div>
        </div>

        {/* Frame Skip Rate */}
        <div className="frame-skip-section">
          <div className="frame-skip-label">Frame Skip Rate</div>
          <div className="frame-skip-bar">
            <div
              className="frame-skip-fill"
              style={{
                width: `${metrics.frameSkipRate * 100}%`,
                backgroundColor: metrics.frameSkipRate < 0.2 ? '#10b981' : '#f59e0b',
              }}
            />
          </div>
          <div className="frame-skip-value">{(metrics.frameSkipRate * 100).toFixed(1)}% skipped</div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {/* CPU Chart */}
          <div className="chart">
            <div className="chart-title">CPU Trend</div>
            <div className="chart-area">
              <svg viewBox={`0 0 ${cpuHistory.length} ${maxCpuHistory}`} preserveAspectRatio="none">
                <polyline
                  points={cpuHistory
                    .map((val, idx) => `${idx},${maxCpuHistory - val}`)
                    .join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <line x1="0" y1={maxCpuHistory - targetCpu} x2={cpuHistory.length} y2={maxCpuHistory - targetCpu} stroke="#10b981" strokeDasharray="4" />
              </svg>
            </div>
          </div>

          {/* FPS Chart */}
          <div className="chart">
            <div className="chart-title">FPS Trend</div>
            <div className="chart-area">
              <svg viewBox={`0 0 ${fpsHistory.length} ${maxFpsHistory}`} preserveAspectRatio="none">
                <polyline
                  points={fpsHistory
                    .map((val, idx) => `${idx},${maxFpsHistory - val}`)
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <line x1="0" y1={maxFpsHistory - 15} x2={fpsHistory.length} y2={maxFpsHistory - 15} stroke="#f59e0b" strokeDasharray="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="status-message">
          {data.cpuUsage > targetCpu * 1.5 && (
            <div className="warning">
              ⚠️ CPU usage is elevated. Consider disabling features or reducing update frequency.
            </div>
          )}
          {data.fps < 10 && (
            <div className="warning">⚠️ Processing FPS is low. Frame skipping may be enabled.</div>
          )}
          {data.cpuUsage <= targetCpu && data.fps >= 15 && (
            <div className="success">✓ Performance is optimal</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
