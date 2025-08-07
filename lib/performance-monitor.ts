interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface PerformanceReport {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  p95Duration: number
  p99Duration: number
  throughput: number // operations per second
  errorRate: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private startTime: number = Date.now()

  /**
   * Track a performance metric
   */
  track(operation: string, fn: () => Promise<any>, metadata?: Record<string, any>): Promise<any> {
    const start = performance.now()
    const timestamp = Date.now()

    return fn()
      .then((result) => {
        const duration = performance.now() - start
        this.metrics.push({
          operation,
          duration,
          timestamp,
          success: true,
          metadata
        })
        return result
      })
      .catch((error) => {
        const duration = performance.now() - start
        this.metrics.push({
          operation,
          duration,
          timestamp,
          success: false,
          error: error.message,
          metadata
        })
        throw error
      })
  }

  /**
   * Track a synchronous operation
   */
  trackSync(operation: string, fn: () => any, metadata?: Record<string, any>): any {
    const start = performance.now()
    const timestamp = Date.now()

    try {
      const result = fn()
      const duration = performance.now() - start
      this.metrics.push({
        operation,
        duration,
        timestamp,
        success: true,
        metadata
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.metrics.push({
        operation,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata
      })
      throw error
    }
  }

  /**
   * Get performance report for a specific operation or all operations
   */
  getReport(operation?: string): PerformanceReport {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        throughput: 0,
        errorRate: 0
      }
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b)
    const successfulOperations = filteredMetrics.filter(m => m.success).length
    const failedOperations = filteredMetrics.length - successfulOperations
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0)
    const averageDuration = totalDuration / filteredMetrics.length
    const minDuration = durations[0]
    const maxDuration = durations[durations.length - 1]
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)
    const p95Duration = durations[p95Index] || 0
    const p99Duration = durations[p99Index] || 0

    const runtime = (Date.now() - this.startTime) / 1000 // seconds
    const throughput = filteredMetrics.length / runtime
    const errorRate = failedOperations / filteredMetrics.length

    return {
      totalOperations: filteredMetrics.length,
      successfulOperations,
      failedOperations,
      averageDuration,
      minDuration,
      maxDuration,
      p95Duration,
      p99Duration,
      throughput,
      errorRate
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.startTime = Date.now()
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsForTimeRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
  }

  /**
   * Get operations by type
   */
  getOperationsByType(): Record<string, PerformanceMetrics[]> {
    const operations: Record<string, PerformanceMetrics[]> = {}
    
    for (const metric of this.metrics) {
      if (!operations[metric.operation]) {
        operations[metric.operation] = []
      }
      operations[metric.operation].push(metric)
    }

    return operations
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): PerformanceMetrics[] {
    return this.metrics.filter(m => !m.success)
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      report: this.getReport(),
      operationsByType: this.getOperationsByType(),
      slowestOperations: this.getSlowestOperations(),
      failedOperations: this.getFailedOperations()
    }, null, 2)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Utility functions for common operations
export const trackApiCall = async (endpoint: string, fn: () => Promise<any>, metadata?: Record<string, any>) => {
  return performanceMonitor.track(`API:${endpoint}`, fn, metadata)
}

export const trackDatabaseQuery = async (query: string, fn: () => Promise<any>, metadata?: Record<string, any>) => {
  return performanceMonitor.track(`DB:${query}`, fn, metadata)
}

export const trackFileUpload = async (fileName: string, fileSize: number, fn: () => Promise<any>) => {
  return performanceMonitor.track('FILE_UPLOAD', fn, {
    fileName,
    fileSize,
    fileSizeMB: fileSize / (1024 * 1024)
  })
}

export const trackChallengeOperation = async (operation: string, challengeId: number, fn: () => Promise<any>) => {
  return performanceMonitor.track(`CHALLENGE:${operation}`, fn, { challengeId })
}

export const trackUserOperation = async (operation: string, userId: number, fn: () => Promise<any>) => {
  return performanceMonitor.track(`USER:${operation}`, fn, { userId })
}

// Performance thresholds for alerts
export const PERFORMANCE_THRESHOLDS = {
  API_CALL_SLOW: 1000, // 1 second
  DB_QUERY_SLOW: 500,  // 500ms
  FILE_UPLOAD_SLOW: 5000, // 5 seconds
  CHALLENGE_OPERATION_SLOW: 2000, // 2 seconds
  ERROR_RATE_HIGH: 0.05, // 5%
  THROUGHPUT_LOW: 10 // 10 operations per second
}

// Performance alert system
export class PerformanceAlert {
  static checkThresholds(operation: string, duration: number, errorRate: number) {
    const alerts: string[] = []

    if (operation.startsWith('API:') && duration > PERFORMANCE_THRESHOLDS.API_CALL_SLOW) {
      alerts.push(`Slow API call: ${operation} took ${duration.toFixed(2)}ms`)
    }

    if (operation.startsWith('DB:') && duration > PERFORMANCE_THRESHOLDS.DB_QUERY_SLOW) {
      alerts.push(`Slow database query: ${operation} took ${duration.toFixed(2)}ms`)
    }

    if (operation === 'FILE_UPLOAD' && duration > PERFORMANCE_THRESHOLDS.FILE_UPLOAD_SLOW) {
      alerts.push(`Slow file upload: took ${duration.toFixed(2)}ms`)
    }

    if (operation.startsWith('CHALLENGE:') && duration > PERFORMANCE_THRESHOLDS.CHALLENGE_OPERATION_SLOW) {
      alerts.push(`Slow challenge operation: ${operation} took ${duration.toFixed(2)}ms`)
    }

    if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_HIGH) {
      alerts.push(`High error rate: ${(errorRate * 100).toFixed(2)}% for ${operation}`)
    }

    return alerts
  }
}

export default PerformanceMonitor 