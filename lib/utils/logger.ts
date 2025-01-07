type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data } = entry
    const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : ''
    return `[${timestamp}] ${level}: ${message}${dataString}`
  }

  error(message: string, error?: unknown): void {
    try {
      const entry: LogEntry = {
        timestamp: this.getTimestamp(),
        level: 'ERROR',
        message,
        data: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
      console.error(this.formatLog(entry))
    } catch (e) {
      console.error('[Logger Failed]', message, error)
    }
  }

  warn(message: string, data?: unknown): void {
    try {
      const entry: LogEntry = {
        timestamp: this.getTimestamp(),
        level: 'WARN',
        message,
        data
      }
      console.warn(this.formatLog(entry))
    } catch (e) {
      console.warn('[Logger Failed]', message, data)
    }
  }

  info(message: string, data?: unknown): void {
    try {
      const entry: LogEntry = {
        timestamp: this.getTimestamp(),
        level: 'INFO',
        message,
        data
      }
      console.info(this.formatLog(entry))
    } catch (e) {
      console.info('[Logger Failed]', message, data)
    }
  }

  debug(message: string, data?: unknown): void {
    try {
      const entry: LogEntry = {
        timestamp: this.getTimestamp(),
        level: 'DEBUG',
        message,
        data
      }
      console.debug(this.formatLog(entry))
    } catch (e) {
      console.debug('[Logger Failed]', message, data)
    }
  }
}

export const logger = new Logger()

// 导出便捷方法
export const logError = (message: string, error?: unknown) => logger.error(message, error)
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data)
export const logInfo = (message: string, data?: unknown) => logger.info(message, data)
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data) 
