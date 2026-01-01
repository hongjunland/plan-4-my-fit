/**
 * Performance monitoring dashboard component
 * Displays real-time performance metrics and recommendations
 */

import { useState, useEffect } from 'react';
import { performanceMonitor, PerformanceReport, PerformanceMetric } from '../../utils/performance';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className = '' }: PerformanceDashboardProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Only show in development mode
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (!isDevelopment) return;

    const updateReport = () => {
      const newReport = performanceMonitor.getReport();
      setReport(newReport);
    };

    // Initial load
    updateReport();

    // Auto refresh every 5 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateReport, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDevelopment, autoRefresh]);

  // Don't render in production
  if (!isDevelopment) return null;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
        >
          📊 성능
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto ${className}`}>
      <Card className="bg-white shadow-xl border border-gray-200">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">성능 모니터링</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs px-2 py-1 ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? '🔄 자동' : '⏸️ 수동'}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                ✕
              </Button>
            </div>
          </div>

          {report && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">평균 로딩</div>
                  <div className="text-lg font-bold text-blue-900">
                    {report.summary.averageLoadTime.toFixed(0)}ms
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">메모리</div>
                  <div className="text-lg font-bold text-green-900">
                    {report.summary.memoryUsage.toFixed(1)}MB
                  </div>
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Core Web Vitals</h4>
                <div className="space-y-2">
                  {renderWebVital('LCP', report.metrics.find(m => m.name === 'lcp'), 'ms', 2500)}
                  {renderWebVital('FID', report.metrics.find(m => m.name === 'fid'), 'ms', 100)}
                  {renderWebVital('CLS', report.metrics.find(m => m.name === 'cls'), '', 0.1)}
                </div>
              </div>

              {/* Recent Metrics */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">최근 메트릭</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {report.metrics.slice(-5).reverse().map((metric, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate">{metric.name}</span>
                      <span className="text-gray-900 font-mono">
                        {metric.value.toFixed(1)}{metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">권장사항</h4>
                  <div className="space-y-1">
                    {report.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const newReport = performanceMonitor.getReport();
                    setReport(newReport);
                  }}
                  className="flex-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  새로고침
                </Button>
                <Button
                  onClick={() => {
                    performanceMonitor.clear();
                    setReport(performanceMonitor.getReport());
                  }}
                  className="flex-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                >
                  초기화
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function renderWebVital(
  name: string, 
  metric: PerformanceMetric | undefined, 
  unit: string,
  threshold: number
) {
  const value = metric?.value || 0;
  const isGood = value <= threshold;
  const colorClass = isGood ? 'text-green-600' : 'text-red-600';
  const bgClass = isGood ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`flex justify-between items-center p-2 rounded ${bgClass}`}>
      <span className="text-xs font-medium">{name}</span>
      <span className={`text-xs font-mono ${colorClass}`}>
        {value.toFixed(value < 1 ? 3 : 0)}{unit}
      </span>
    </div>
  );
}