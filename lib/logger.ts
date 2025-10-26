/**
 * 统一的日志管理器
 * 提供结构化日志、级别控制、敏感信息过滤
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  AUTH = "auth",
  PAYMENT = "payment",
  VIDEO = "video",
  SYSTEM = "system",
}

interface LogContext {
  userId?: string;
  email?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    // 根据环境设置日志级别
    this.logLevel = process.env.NODE_ENV === "production" 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 过滤敏感信息
   */
  private sanitize(data: any): any {
    if (typeof data === "string") {
      // 保留完整邮箱用于内部审计和安全分析
      // 邮箱域名信息对于判断是否误伤用户至关重要
      return data;
    }
    
    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        // 过滤敏感字段
        if (["password", "token", "secret", "key"].includes(key.toLowerCase())) {
          sanitized[key] = "***";
        } else if (key === "email") {
          sanitized[key] = this.sanitize(data[key]);
        } else {
          sanitized[key] = this.sanitize(data[key]);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * 格式化错误对象
   */
  private formatError(error: any): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        // 仅在开发环境包含堆栈
        ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
      };
    }
    return error;
  }

  /**
   * 核心日志方法
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: any
  ) {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevel[level],
      category,
      message,
      ...(context && { context: this.sanitize(context) }),
      ...(error && { error: this.formatError(error) }),
    };

    // 根据级别选择输出方法
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.DEBUG:
        console.log(JSON.stringify(logEntry));
        break;
    }
  }

  // 公共方法
  debug(category: LogCategory, message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, category, message, context);
  }

  info(category: LogCategory, message: string, context?: LogContext) {
    this.log(LogLevel.INFO, category, message, context);
  }

  warn(category: LogCategory, message: string, context?: LogContext) {
    this.log(LogLevel.WARN, category, message, context);
  }

  error(category: LogCategory, message: string, context?: LogContext, error?: any) {
    this.log(LogLevel.ERROR, category, message, context, error);
  }

  /**
   * 认证专用日志方法
   */
  authAttempt(email: string, success: boolean, reason?: string) {
    const level = success ? LogLevel.INFO : LogLevel.INFO; // 失败也是INFO
    const message = success ? "Authentication successful" : "Authentication failed";
    
    this.log(level, LogCategory.AUTH, message, {
      email,
      action: "login",
      metadata: { success, reason },
    });
  }

  /**
   * 判断是否为系统错误
   */
  static isSystemError(error: any): boolean {
    const systemErrorPatterns = [
      /connection/i,
      /timeout/i,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /database/i,
      /supabase.*unavailable/i,
      /network/i,
    ];

    const errorMessage = error?.message || error?.toString() || "";
    return systemErrorPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * 判断是否为用户错误
   */
  static isUserError(error: any): boolean {
    const userErrorPatterns = [
      /invalid.*credentials/i,
      /invalid.*password/i,
      /user.*not.*found/i,
      /email.*not.*confirmed/i,
      /account.*locked/i,
      /incorrect.*password/i,
    ];

    const errorMessage = error?.message || error?.toString() || "";
    return userErrorPatterns.some(pattern => pattern.test(errorMessage));
  }
}

export const logger = Logger.getInstance();
export { Logger };