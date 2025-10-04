/**
 * Performance monitoring and metrics collection
 */

import { logger } from '../utils/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Navigation timing
    this.observeNavigationTiming();
    
    // Resource timing
    this.observeResourceTiming();
    
    // Long tasks
    this.observeLongTasks();
    
    // Layout shifts
    this.observeLayoutShifts();
  }

  private observeNavigationTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'ms');
            this.recordMetric('first_byte', navEntry.responseStart - navEntry.fetchStart, 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe navigation timing', { error });
    }
  }

  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric('slow_resource', resourceEntry.duration, 'ms', {
              name: resourceEntry.name,
              type: this.getResourceType(resourceEntry.name)
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe resource timing', { error });
    }
  }

  private observeLongTasks(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration, 'ms', {
            startTime: entry.startTime
          });
          
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe long tasks', { error });
    }
  }

  private observeLayoutShifts(): void {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.recordMetric('cumulative_layout_shift', clsValue, 'count');
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe layout shifts', { error });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    };

    this.metrics.push(metric);
    
    // Log significant performance issues
    if (this.isSignificantMetric(metric)) {
      logger.warn(`Performance issue: ${name}`, {
        value,
        unit,
        context
      });
    }

    // Send to analytics if available
    this.sendToAnalytics(metric);
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    switch (metric.name) {
      case 'page_load_time':
        return metric.value > 3000; // > 3 seconds
      case 'first_byte':
        return metric.value > 1000; // > 1 second
      case 'long_task':
        return metric.value > 50; // > 50ms
      case 'slow_resource':
        return metric.value > 2000; // > 2 seconds
      default:
        return false;
    }
  }

  private sendToAnalytics(metric: PerformanceMetric): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        custom_map: metric.context
      });
    }
  }

  // AI-specific performance tracking
  trackAIOperation(operation: string, startTime: number): void {
    const duration = performance.now() - startTime;
    this.recordMetric(`ai_${operation}`, duration, 'ms', {
      operation
    });
  }

  // Image processing performance tracking
  trackImageProcessing(operation: string, fileSize: number, duration: number): void {
    this.recordMetric(`image_${operation}`, duration, 'ms', {
      operation,
      fileSize,
      throughput: fileSize / duration
    });
  }

  // Database operation tracking
  trackDatabaseOperation(operation: string, duration: number, recordCount?: number): void {
    this.recordMetric(`db_${operation}`, duration, 'ms', {
      operation,
      recordCount
    });
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
    }
  }

  // Get performance summary
  getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    });

    return summary;
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getPerformanceSummary(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Clean up observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals tracking
export function trackWebVitals(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Track Core Web Vitals when available
  import('web-vitals').then((webVitals: any) => {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals
    getCLS((metric: any) => {
      performanceMonitor.recordMetric('cls', metric.value, 'count', {
        rating: metric.rating
      });
    });

    getFID((metric: any) => {
      performanceMonitor.recordMetric('fid', metric.value, 'ms', {
        rating: metric.rating
      });
    });

    getFCP((metric: any) => {
      performanceMonitor.recordMetric('fcp', metric.value, 'ms', {
        rating: metric.rating
      });
    });

    getLCP((metric: any) => {
      performanceMonitor.recordMetric('lcp', metric.value, 'ms', {
        rating: metric.rating
      });
    });

    getTTFB((metric: any) => {
      performanceMonitor.recordMetric('ttfb', metric.value, 'ms', {
        rating: metric.rating
      });
    });
  }).catch(() => {
    // web-vitals not available, skip tracking
  });
}