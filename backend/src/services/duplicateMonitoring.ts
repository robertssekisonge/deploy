/**
 * BACKGROUND DUPLICATE MONITORING SERVICE
 * 
 * This service runs background checks to identify potential duplicates
 * and provides proactive monitoring of the database
 */

import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

interface MonitoringResult {
  timestamp: Date;
  totalStudents: number;
  duplicateGroups: number;
  totalDuplicates: number;
  overseerDuplicates: number;
  cleanupActions: string[];
}

class DuplicateMonitoringService {
  private isRunning = false;
  private lastCheck: Date | null = null;
  private checkResults: MonitoringResult[] = [];

  /**
   * Start the background monitoring service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Duplicate monitoring service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting duplicate prevention monitoring service...');

    // Run checks every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.performDuplicateCheck();
    });

    // Run cleanup checks every hour
    cron.schedule('0 * * * *', async () => {
      await this.performAutoCleanup();
    });

    // Initial check
    setTimeout(() => {
      this.performDuplicateCheck();
    }, 5000); // Wait 5 seconds after startup

    console.log('✅ Duplicate monitoring service started successfully');
  }

  /**
   * Perform comprehensive duplicate check
   */
  private async performDuplicateCheck() {
    try {
      console.log('🔍 Performing automatic duplicate check...');

      const students = await prisma.student.findMany({
        where: {
          status: {
            in: ['active', 'pending', 'sponsored']
          }
        }
      });

      // Group students by potential duplicates
      const duplicateGroups = this.findDuplicateGroups(students);
      const overseerDuplicates = this.findOverseerDuplicates(students);

      const result: MonitoringResult = {
        timestamp: new Date(),
        totalStudents: students.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.length, 0),
        overseerDuplicates,
        cleanupActions: []
      };

      this.checkResults.push(result);
      
      // Keep only last 10 results
      if (this.checkResults.length > 10) {
        this.checkResults = this.checkResults.slice(-10);
      }

      this.lastCheck = new Date();

      // Log results
      if (duplicateGroups.length > 0) {
        console.log(`⚠️ AUTOMATIC DUPLICATE CHECK: Found ${duplicateGroups.length} duplicate groups with ${result.totalDuplicates} total duplicates`);
        console.log(`📊 Current database: ${result.totalStudents} students, ${overseerDuplicates} overseer duplicates`);
      } else {
        console.log(`✅ AUTOMATIC DUPLICATE CHECK: No duplicates found. Database clean with=${result.totalStudents} students`);
      }

      // Store monitoring data in database for tracking
      await this.storeMonitoringData(result);

    } catch (error) {
      console.error('❌ Error in automatic duplicate check:', error);
    }
  }

  /**
   * Find duplicate groups in students
   */
  private findDuplicateGroups(students: any[]) {
    const groups = new Map<string, any[]>();

    students.forEach(student => {
      if (!student.name || !student.class) return;

      const key = `${student.name.toLowerCase().trim()}|${student.class}|${student.age}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(student);
    });

    // Return only groups with more than one student
    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  /**
   * Find overseer-specific duplicates
   */
  private findOverseerDuplicates(students: any[]) {
    return students.filter(student => 
      student.name &&
      student.class &&
      (
        student.accessNumber?.startsWith('None-') ||
        student.admissionId?.startsWith('None-') ||
        student.admittedBy === 'overseer'
      )
    ).length;
  }

  /**
   * Perform automatic cleanup of obvious duplicates
   */
  private async performAutoCleanup() {
    try {
      console.log('🧹 Performing automatic duplicate cleanup...');

      const students = await prisma.student.findMany({
        where: {
          status: {
            in: ['active', 'pending', 'sponsored']
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const duplicateGroups = this.findDuplicateGroups(students);
      let cleanedCount = 0;

      for (const group of duplicateGroups) {
        if (group.length > 1) {
          // Sort by creation date and keep the earliest
          group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          const keepStudent = group[0];
          const removeStudents = group.slice(1);

          // Only auto-cleanup if very recent duplicates (within last hour)
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          const recentDuplicates = removeStudents.filter(student => 
            new Date(student.createdAt) >= hourAgo
          );

          for (const duplicate of recentDuplicates) {
            await prisma.student.delete({
              where: { id: duplicate.id }
            });
            cleanedCount++;
            
            console.log(`🗑️ AUTO-CLEANUP: Removed duplicate ${duplicate.name} (${duplicate.accessNumber})`);
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`✅ AUTO-CLEANUP: Removed ${cleanedCount} recent duplicates`);
      }

    } catch (error) {
      console.error('❌ Error in automatic cleanup:', error);
    }
  }

  /**
   * Store monitoring data in database
   */
  private async storeMonitoringData(result: MonitoringResult) {
    try {
      // Create a simple monitoring record
      await prisma.$queryRaw`
        INSERT INTO monitoring_data (check_type, timestamp, total_students, duplicate_groups, total_duplicates, overseer_duplicates, cleanup_actions)
        VALUES ('duplicate_check', ${result.timestamp}, ${result.totalStudents}, ${result.duplicateGroups}, ${result.totalDuplicates}, ${result.overseerDuplicates}, ${JSON.stringify(result.cleanupActions)})
      `.catch(() => {
        // Table might not exist, that's okay for now
        console.log('ℹ️ Monitoring data table not found - skipping data storage');
      });
    } catch (error) {
      // Ignore errors for monitoring data storage
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      recentResults: this.checkResults.slice(-5),
      totalChecks: this.checkResults.length
    };
  }

  /**
   * Force immediate check
   */
  async forceCheck() {
    if (!this.isRunning) {
      throw new Error('Monitoring service is not running');
    }
    
    await this.performDuplicateCheck();
    return this.lastCheck;
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Duplicate monitoring service stopped');
  }
}

// Export singleton instance
export const duplicateMonitoringService = new DuplicateMonitoringService();

// Auto-start when imported
duplicateMonitoringService.start();

