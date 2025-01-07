export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode: number, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // 业务错误类
  export class BusinessError extends AppError {
    constructor(message: string) {
      super(message, 400, true);
    }
  }
  
  // 数据库错误类
  export class DatabaseError extends AppError {
    constructor(message: string) {
      super(message, 500, true);
    }
  }
  
  // 认证错误类
  export class AuthError extends AppError {
    constructor(message: string) {
      super(message, 401, true);
    }
  } 