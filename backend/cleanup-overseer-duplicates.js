#!/usr/bin/env node

/**
 * CLEANUP OVERSEER DUPLICATE STUDENTS SCRIPT
 * 
 * This script specifically identifies and removes duplicate students 
 * created by overseers who often have similar patterns:
 * - Same name with variations
 * - Access numbers like "None-" prefixed
 * - Same sponsorship status
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOverseerDuplicates() {
  console.log('🔍 Starting overseer duplicates cleanup...');
  
  try {
    // Get all students created by overseers
    const overseerStudents = await prisma.student.findMany({
      where: {
        OR: [
          { admittedBy: 'overseer' },
          { admittedBy: 'SPONSORSHIPS_OVERSEER' },
          { accessNumber: { startsWith: 'None-' } },
          { admissionId: { startsWith: 'None-' } }
        ],
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${overseerStudents.length} overseer/inactive students to analyze`);

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    // Group students by name and class (case insensitive)
    const studentGroups = new Map();
    
    for (const student of overseerStudents) {
      const key = `${student.name.toLowerCase().trim()}|${student.class}|${student.age}`;
      
      if (!studentGroups.has(key)) {
        studentGroups.set(key, []);
      }
      studentGroups.get(key).push(student);
    }

    // Process each group
    for (const [key, students] of studentGroups) {
      if (students.length > 1) {
        duplicatesFound += students.length - 1;
        
        const [name, className, age] = key.split('|');
        console.log(`\n🔍 OVERSEER DUPLICATE GROUP: ${name} (${className}, Age: ${age})`);
        console.log(`   Found ${students.length} duplicates:`);
        
        // Sort by creation date (keep oldest/first one)
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

    console.log(`\n📈 OVERSEER CLEANUP SUMMARY:`);
    console.log(`   📊 Overseer students analyzed: ${overseerStudents.length}`);
    console.log(`   🔍 Duplicate groups found: ${Array.from(studentGroups.values()).filter(group => group.length > 1).length}`);
    console.log(`   🗑️ Duplicates removed: ${duplicatesRemoved}`);
    
    if (duplicatesRemoved > 0) {
      console.log(`   ✅ Cleanup completed successfully!`);
    } else {
      console.log(`   ✅ No overseer duplicates found!`);
    }

  } catch (error) {
    console.error('❌ Error during overseer cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function showOverseerDuplicates() {
  console.log('🔍 Analyzing overseer duplicate groups (dry run)...');
  
  try {
    const overseerStudents = await prisma.student.findMany({
      where: {
        OR: [
          { admittedBy: 'overseer' },
          { admittedBy: 'SPONSORSHIPS_OVERSEER' },
          { accessNumber: { startsWith: 'None-' } },
          { admissionId: { startsWith: 'None-' } }
        ],
        status: {
          in: ['active', 'pending', 'sponsored']
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const studentGroups = new Map();
    
    for (const student of overseerStudents) {
      const key = `${student.name.toLowerCase().trim()}|${student.class}|${student.age}`;
      
      if (!studentGroups.has(key)) {
        studentGroups.set(key, []);
      }
      studentGroups.get(key).push(student);
    }

    console.log(`\n📊 Found ${overseerStudents.length} overseer/inactive students in ${studentGroups.size} groups`);
    
    let duplicateGroups = 0;
    let totalDuplicates = 0;

    for (const [key, students] of studentGroups) {
      if (students.length > 1) {
        duplicateGroups++;
        totalDuplicates += students.length;
        
        const [name, className, age] = key.split('|');
        console.log(`\n🔍 OVERSEE DUPLICATE GROUP: ${name} (${className}, Age ${age})`);
        console.log(`   Total duplicates: ${students.length}`);
        students.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.name} | Access: ${student.accessNumber} | Admission: ${student.admissionId} | Created: ${student.createdAt.toISOString()}`);
          console.log(`      Parent: ${student.parent?.name || 'N/A'} | Village: ${student.village || 'N/A'} | Status: ${student.sponsorshipStatus}`);
        });
      }
    }

    console.log(`\n📈 OVERSEER SUMMARY:`);
    console.log(`   🔍 Overseer duplicate groups: ${duplicateGroups}`);
    console.log(`   📊 Total overseer duplicates: ${totalDuplicates}`);
    console.log(`   👥 Total overseer students: ${overseerStudents.length}`);
    
    if (duplicateGroups > 0) {
      console.log(`\n💡 Run 'node cleanup-overseer-duplicates.js --clean' to remove duplicates`);
      
      // Show some statistics
      console.log(`\n📊 OVERSEER STUDENT STATISTICS:`);
      const admittedByCounts = {};
      const accessPatterns = {};
      
      overseerStudents.forEach(student => {
        const admittedBy = student.admittedBy || 'unknown';
        admittedByCounts[admittedBy] = (admittedByCounts[admittedBy] || 0) + 1;
        
        const pattern = student.accessNumber?.startsWith('None-') ? 'None-prefixed' : 
                       student.accessNumber === 'None' ? 'None-exact' : 'Real-access';
        accessPatterns[pattern] = (accessPatterns[pattern] || 0) + 1;
      });
      
      console.log(`   📊 By Admitted By:`);
      Object.entries(admittedByCounts).forEach(([key, count]) => {
        console.log(`      ${key}: ${count}`);
      });
      
      console.log(`   🔑 By Access Pattern:`);
      Object.entries(accessPatterns).forEach(([key, count]) => {
        console.log(`      ${key}: ${count}`);
      });
    } else {
      console.log(`\n✅ No overseer duplicates found!`);
    }

  } catch (error) {
    console.error('❌ Error analyzing overseer duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔍 OVERSEER DUPLICATES CLEANUP SCRIPT

Usage:
  node cleanup-overseer-duplicates.js [options]

Options:
  --dry-run, --analyze    Show overseer duplicate groups without removing (default)
  --clean, --remove       Remove duplicate overseer students (keeps oldest records)
  --help, -h             Show this help message

This script specifically targets:
  - Students created by overseers
  - Students with "None-" prefixed access numbers  
  - Students with "None-" prefixed admission IDs

Examples:
  node cleanup-overseer-duplicates.js                # Show overseer duplicates (dry run)
  node cleanup-overseer-duplicates.js --analyze      # Show overseer duplicates (dry run)
  node cleanup-overseer-duplicates.js --clean        # Remove overseer duplicates
  node cleanup-overseer-duplicates.js --remove       # Remove overseer duplicates
`);
  process.exit(0);
}

// Execute based on arguments
if (args.includes('--clean') || args.includes('--remove')) {
  cleanupOverseerDuplicates();
} else {
  showOverseerDuplicates();
}
