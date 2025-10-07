const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTimetables() {
  try {
    console.log('🌱 Starting timetable seeding...');

    // Sample timetable data
    const sampleTimetables = [
      {
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Mathematics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Physics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Monday',
        startTime: '11:00',
        endTime: '12:00',
        subject: 'Chemistry',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Tuesday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Mathematics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Biology',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Wednesday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Physics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Wednesday',
        startTime: '11:00',
        endTime: '12:00',
        subject: 'Mathematics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Thursday',
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Chemistry',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Friday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Physics',
        teacherId: '18',
        teacherName: 'Teacher Rose',
        classId: '1',
        streamId: 's1a',
        className: 'Senior 1',
        streamName: 'A',
        room: 'Room 101',
        duration: 60
      },
      {
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'English',
        teacherId: '2',
        teacherName: 'Teacher John',
        classId: '2',
        streamId: 's1b',
        className: 'Senior 1',
        streamName: 'B',
        room: 'Room 102',
        duration: 60
      },
      {
        day: 'Tuesday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'History',
        teacherId: '2',
        teacherName: 'Teacher John',
        classId: '2',
        streamId: 's1b',
        className: 'Senior 1',
        streamName: 'B',
        room: 'Room 102',
        duration: 60
      }
    ];

    // Clear existing timetables
    await prisma.timeTable.deleteMany({});
    console.log('🗑️  Cleared existing timetables');

    // Insert sample timetables
    for (const timetable of sampleTimetables) {
      await prisma.timeTable.create({
        data: timetable
      });
    }

    console.log(`✅ Successfully seeded ${sampleTimetables.length} timetable entries`);
    
    // Verify the data
    const count = await prisma.timeTable.count();
    console.log(`📊 Total timetables in database: ${count}`);

  } catch (error) {
    console.error('❌ Error seeding timetables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTimetables();






