#!/usr/bin/env node

/**
 * CLEANUP DUPLICATE STUDENTS SCRIPT
 * 
 * This script identifies and removes duplicate students based on:
 * - Same name (case insensitive)
 * - Same class
 * - Same parent name
 * 
 * It keeps the oldest record (first created) and removes newer duplicates.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateStudents() {
  console.log('🧹 Starting duplicate students cleanup...');
  
  try {
    // Get all active students
    const allStudents = await prisma.student.findMany({
      where: {
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${allStudents.length} active students to analyze`);

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    // Group students by name, class, and parent
    const studentGroups = new Map();
    
    for (const student of allStudents) {
      const key = `${student.name.toLowerCase()}|${student.class}|${student.parentName?.toLowerCase() || ''}`;
      
      if (!studentGroups.has(key)) {
        studentGroups.set(key, []);
      }
      studentGroups.get(key).push(student);
    }

    // Process each group
    for (const [key, students] of studentGroups) {
      if (students.length > 1) {
        duplicatesFound += students.length - 1; // Keep one, remove others
        
        console.log(`\n🔍 DUPLICATE GROUP FOUND: ${key}`);
        console.log(`   Found ${students.length} duplicates:`);
        
        // Sort by creation date (keep oldest)
        students.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keepStudent = students[0];
        const removeStudents = students.slice(1);
        
        console.log(`   ✅ KEEPING: ${keepStudent.name} (${keepStudent.accessNumber}) - Created: ${keepStudent.createdAt.toISOString()}`);
        
        for (const duplicate of removeStudents) {
          console.log(`   🗑️ REMOVING: ${duplicate.name} (${duplicate.accessNumber}) - Created: ${duplicate.createdAt.toISOString()}`);
          
          // Delete the duplicate
          await prisma.student.delete({
            where: { id: duplicate.id }
          });
          
          duplicatesRemoved++;
        }
      }
    }

    console.log(`\n📈 CLEANUP SUMMARY:`);
    console.log(`   📊 Students analyzed: ${allStudents.length}`);
    console.log(`   🔍 Duplicate groups found: ${Array.from(studentGroups.values()).filter(group => group.length > 1).length}`);
    console.log(`   🗑️ Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   ✅ Cleanup completed successfully!`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function showDuplicateGroups() {
  console.log('🔍 Analyzing duplicate groups (dry run)...');
  
  try {
    const allStudents = await prisma.student.findMany({
      where: {
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const studentGroups = new Map();
    
    for (const student of allStudents) {
      const key = `${student.name.toLowerCase()}|${student.class}|${student.parentName?.toLowerCase() || ''}`;
      
      if (!studentGroups.has(key)) {
        studentGroups.set(key, []);
      }
      studentGroups.get(key).push(student);
    }

    console.log(`\n📊 Found ${allStudents.length} active students in ${studentGroups.size} groups`);
    
    let duplicateGroups = 0;
    let totalDuplicates = 0;

    for (const [key, students] of studentGroups) {
      if (students.length > 1) {
        duplicateGroups++;
        totalDuplicates += students.length;
        
        console.log(`\n🔍 DUPLICATE GROUP: ${key}`);
        console.log(`   Total duplicates: ${students.length}`);
        students.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.name} | Access: ${student.accessNumber} | Created: ${student.createdAt.toISOString()}`);
        });
      }
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`   🔍 Duplicate groups: ${duplicateGroups}`);
    console.log(`   📊 Total duplicates: ${totalDuplicates}`);
    
    if (duplicateGroups > 0) {
      console.log(`\n💡 Run 'node cleanup-duplicate-students.js --clean' to remove duplicates`);
    } else {
      console.log(`\n✅ No duplicates found!`);
    }

  } catch (error) {
    console.error('❌ Error analyzing duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧹 DUPLICATE STUDENTS CLEANUP SCRIPT

Usage:
  node cleanup-duplicate-users.js [options]

Options:
  --dry-run, --analyze    Show duplicate groups without removing (default)
  --clean, --remove       Remove duplicate students (keeps oldest records)
  --help, -h             Show this help message

Examples:
  node cleanup-duplicate-students.js                # Show duplicates (dry run)
  node cleanup-duplicate-students.js --dry-run      # Show duplicates (dry run)
  node cleanup-duplicate-students.js --analyze      # Show duplicates (dry run)
  node cleanup-duplicate-students.js --clean        # Remove duplicates
  node cleanup-duplicate-students.js --remove       # Remove duplicates
`);
  process.exit(0);
}

// Execute based on arguments
if (args.includes('--clean') || args.includes('--remove')) {
  cleanupDuplicateStudents();
} else {
  showDuplicateGroups();
}
