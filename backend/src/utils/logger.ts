import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  requestId: string;
  timestamp: string;
  userId?: string;
  studentId?: string;
  action: string;
}

export interface PerformanceMetrics {
  totalTime: number;
  fileWriteTime?: number;
  databaseTime?: number;
}

export class PhotoUploadLogger {
  private requestId: string;
  private timestamp: string;
  private startTime: number;

  constructor(action: string, userId?: string, studentId?: string) {
    this.requestId = uuidv4().substring(0, 8);
    this.timestamp = new Date().toISOString();
    this.startTime = Date.now();
    
    // Log request initiation
    this.info(`📸 ${action} request initiated`);
    if (userId) this.info(`👤 User ID: ${userId}`);
    if (studentId) this.info(`👤 Student ID: ${studentId}`);
  }

  private formatMessage(message: string): string {
    return `[${this.timestamp}] [${this.requestId}] ${message}`;
  }

  info(message: string): void {
    console.log(this.formatMessage(message));
  }

  success(message: string): void {
    console.log(this.formatMessage(`✅ ${message}`));
  }

  warning(message: string): void {
    console.warn(this.formatMessage(`⚠️ ${message}`));
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage(`❌ ${message}`));
    if (error) {
      console.error(this.formatMessage(`📋 Error details:`), {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        meta: error.meta
      });
    }
  }

  requestDetails(req: any): void {
    this.info(`📊 Request body size: ${JSON.stringify(req.body).length} characters`);
    this.info(`🌐 User agent: ${req.get('User-Agent') || 'Unknown'}`);
    this.info(`🌍 IP address: ${req.ip || req.connection.remoteAddress || 'Unknown'}`);
  }

  validationFailed(message: string, req: any): void {
    this.error(`Validation failed: ${message}`);
    this.error(`📋 Request body keys: ${Object.keys(req.body).join(', ')}`);
  }

  fileTypeValidation(fileType: string, allowedTypes: string[]): void {
    this.info(`🖼️ File type: ${fileType}`);
    if (!allowedTypes.includes(fileType)) {
      this.error(`Invalid file type: ${fileType}`);
      this.error(`✅ Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  fileProcessing(fileName: string, filePath: string, fileExtension: string): void {
    this.info(`📁 Generated filename: ${fileName}`);
    this.info(`📁 Full file path: ${filePath}`);
    this.info(`📁 File extension: ${fileExtension}`);
  }

  directoryCheck(uploadsDir: string): void {
    if (!require('fs').existsSync(uploadsDir)) {
      this.info(`📁 Creating uploads directory: ${uploadsDir}`);
      require('fs').mkdirSync(uploadsDir, { recursive: true });
      this.success(`Uploads directory created successfully`);
    } else {
      this.success(`Uploads directory already exists: ${uploadsDir}`);
    }
  }

  fileDataInfo(base64Data: string, buffer: Buffer): void {
    this.info(`📊 Base64 data length: ${base64Data.length} characters`);
    this.info(`📊 Base64 data preview: ${base64Data.substring(0, 50)}...`);
    this.info(`📊 Buffer size: ${buffer.length} bytes`);
    this.info(`📊 Buffer size in MB: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);
  }

  fileWrite(writeTime: number, stats: any): void {
    this.success(`File written successfully in ${writeTime}ms`);
    this.success(`File verification: ${stats.size} bytes written`);
    this.info(`📅 File created at: ${stats.birthtime.toISOString()}`);
  }

  databaseUpdate(userId?: string, studentId?: string): number {
    const target = userId ? `user: ${userId}` : `student: ${studentId}`;
    this.info(`🗄️ Updating database for ${target}`);
    return Date.now();
  }

  databaseSuccess(dbTime: number, userData?: any): void {
    this.success(`Database updated successfully in ${dbTime}ms`);
    if (userData) {
      if (userData.email) {
        this.info(`👤 User updated: ${userData.id} - ${userData.email}`);
      } else if (userData.firstName && userData.lastName) {
        this.info(`👤 Student updated: ${userData.id} - ${userData.firstName} ${userData.lastName}`);
      }
    }
  }

  databaseError(dbTime: number, error: any): void {
    this.error(`Database update failed after ${dbTime}ms`, error);
  }

  uploadComplete(totalTime: number, action: string, isNew = false): void {
    const prefix = isNew ? '🆕 New' : '🎉';
    this.success(`${prefix} ${action} completed successfully in ${totalTime}ms`);
  }

  uploadFailed(totalTime: number, action: string, error: any): void {
    this.error(`${action} failed after ${totalTime}ms`, error);
  }

  getRequestId(): string {
    return this.requestId;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const totalTime = Date.now() - this.startTime;
    return { totalTime };
  }

  addFileWriteTime(writeTime: number): PerformanceMetrics {
    const metrics = this.getPerformanceMetrics();
    metrics.fileWriteTime = writeTime;
    return metrics;
  }

  addDatabaseTime(dbTime: number): PerformanceMetrics {
    const metrics = this.getPerformanceMetrics();
    metrics.databaseTime = dbTime;
    return metrics;
  }

  // Static utility methods
  static logRequestStart(action: string, userId?: string, studentId?: string): PhotoUploadLogger {
    return new PhotoUploadLogger(action, userId, studentId);
  }

  static formatErrorResponse(error: string, requestId: string, timestamp: string, performance?: PerformanceMetrics): any {
    const response: any = {
      error,
      requestId,
      timestamp
    };
    
    if (performance) {
      response.performance = performance;
    }
    
    return response;
  }

  static formatSuccessResponse(data: any, requestId: string, timestamp: string, performance: PerformanceMetrics): any {
    return {
      ...data,
      requestId,
      timestamp,
      performance
    };
  }
}

// Export convenience functions
export const createLogger = PhotoUploadLogger.logRequestStart;
export const formatErrorResponse = PhotoUploadLogger.formatErrorResponse;
export const formatSuccessResponse = PhotoUploadLogger.formatSuccessResponse;















