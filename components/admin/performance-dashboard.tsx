'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { performanceMonitor, PerformanceAlert, PERFORMANCE_THRESHOLDS } from '@/lib/performance-monitor'

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
  throughput: number
  errorRate: number
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const updateMetrics = () => {
    const currentMetrics = performanceMonitor.getMetrics()
    const currentReport = performanceMonitor.getReport()
    setMetrics(currentMetrics)
    setReport(currentReport)

    // Check for performance alerts
    const newAlerts: string[] = []
    const operationsByType = performanceMonitor.getOperationsByType()

    for (const [operation, operationMetrics] of Object.entries(operationsByType)) {
      const operationReport = performanceMonitor.getReport(operation)
      const operationAlerts = PerformanceAlert.checkThresholds(
        operation,
        operationReport.averageDuration,
        operationReport.errorRate
      )
      newAlerts.push(...operationAlerts)
    }

    setAlerts(newAlerts)
  }

  useEffect(() => {
    updateMetrics()

    if (autoRefresh) {
      const interval = setInterval(updateMetrics, 2000) // Update every 2 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const clearMetrics = () => {
    performanceMonitor.clear()
    updateMetrics()
  }

  const exportMetrics = () => {
    const data = performanceMonitor.exportMetrics()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatThroughput = (opsPerSecond: number) => {
    return `${opsPerSecond.toFixed(2)} ops/sec`
  }

  const getStatusColor = (operation: string, duration: number) => {
    if (operation.startsWith('API:') && duration > PERFORMANCE_THRESHOLDS.API_CALL_SLOW) return 'destructive'
    if (operation.startsWith('DB:') && duration > PERFORMANCE_THRESHOLDS.DB_QUERY_SLOW) return 'destructive'
    if (operation === 'FILE_UPLOAD' && duration > PERFORMANCE_THRESHOLDS.FILE_UPLOAD_SLOW) return 'destructive'
    if (operation.startsWith('CHALLENGE:') && duration > PERFORMANCE_THRESHOLDS.CHALLENGE_OPERATION_SLOW) return 'destructive'
    if (duration > 1000) return 'warning'
    return 'default'
  }

  const getOperationType = (operation: string) => {
    if (operation.startsWith('API:')) return 'API Call'
    if (operation.startsWith('DB:')) return 'Database'
    if (operation === 'FILE_UPLOAD') return 'File Upload'
    if (operation.startsWith('CHALLENGE:')) return 'Challenge'
    if (operation.startsWith('USER:')) return 'User'
    return 'Other'
  }

  const operationsByType = performanceMonitor.getOperationsByType()
  const slowestOperations = performanceMonitor.getSlowestOperations(10)
  const failedOperations = performanceMonitor.getFailedOperations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time performance monitoring and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button variant="outline" onClick={clearMetrics}>
            Clear Metrics
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Performance Alerts:</strong>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index} className="text-sm">• {alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.totalOperations}</div>
              <p className="text-xs text-muted-foreground">
                {report.successfulOperations} successful, {report.failedOperations} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(report.averageDuration)}</div>
              <p className="text-xs text-muted-foreground">
                Min: {formatDuration(report.minDuration)}, Max: {formatDuration(report.maxDuration)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatThroughput(report.throughput)}</div>
              <p className="text-xs text-muted-foreground">
                Operations per second
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(report.errorRate * 100).toFixed(2)}%</div>
              <Progress value={report.errorRate * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground">
                {report.failedOperations} failed out of {report.totalOperations}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations by Type</TabsTrigger>
          <TabsTrigger value="slowest">Slowest Operations</TabsTrigger>
          <TabsTrigger value="failed">Failed Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Percentiles</CardTitle>
              <CardDescription>Response time distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {report && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>P95 (95th percentile):</span>
                    <Badge variant={report.p95Duration > 1000 ? 'destructive' : 'default'}>
                      {formatDuration(report.p95Duration)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>P99 (99th percentile):</span>
                    <Badge variant={report.p99Duration > 2000 ? 'destructive' : 'default'}>
                      {formatDuration(report.p99Duration)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations by Type</CardTitle>
              <CardDescription>Performance breakdown by operation category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(operationsByType).map(([operation, operationMetrics]) => {
                  const operationReport = performanceMonitor.getReport(operation)
                  return (
                    <div key={operation} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{getOperationType(operation)}</h4>
                          <p className="text-sm text-muted-foreground">{operation}</p>
                        </div>
                        <Badge variant={getStatusColor(operation, operationReport.averageDuration)}>
                          {formatDuration(operationReport.averageDuration)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Count:</span> {operationReport.totalOperations}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span> {((1 - operationReport.errorRate) * 100).toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-muted-foreground">Throughput:</span> {formatThroughput(operationReport.throughput)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slowest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slowest Operations</CardTitle>
              <CardDescription>Top 10 slowest operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {slowestOperations.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{metric.operation}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(metric.operation, metric.duration)}>
                      {formatDuration(metric.duration)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Operations</CardTitle>
              <CardDescription>Operations that encountered errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {failedOperations.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{metric.operation}</div>
                      <div className="text-sm text-muted-foreground">
                        {metric.error}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {formatDuration(metric.duration)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 