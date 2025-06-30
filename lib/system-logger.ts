// Simple system logger for admin dashboard
interface LogEntry {
  id: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  timestamp: string
  service: string
  metadata?: any
}

class SystemLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs

  log(level: LogEntry['level'], message: string, service: string, metadata?: any) {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      service,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.logs.unshift(logEntry) // Add to beginning
    
    // Keep only max logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Also log to console
    console.log(`[${level.toUpperCase()}] ${service}: ${message}`, metadata || '')
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(0, limit)
  }

  info(message: string, service: string, metadata?: any) {
    this.log('info', message, service, metadata)
  }

  warning(message: string, service: string, metadata?: any) {
    this.log('warning', message, service, metadata)
  }

  error(message: string, service: string, metadata?: any) {
    this.log('error', message, service, metadata)
  }

  debug(message: string, service: string, metadata?: any) {
    this.log('debug', message, service, metadata)
  }
}

// Export singleton instance
export const systemLogger = new SystemLogger()

// Add some initial logs
systemLogger.info('System logger initialized', 'system')
systemLogger.info('Admin dashboard logs active', 'admin')
