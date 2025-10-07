const http = require('http');

// Create timetable with correct format for frontend
const timetableData = {
  day: 'monday', // lowercase to match frontend
  startTime: '08:00',
  endTime: '09:00',
  subject: 'Mathematics',
  teacherId: '7', // Rose's user ID
  teacherName: 'rose',
  classId: 'senior1',
  streamId: 'streamA',
  className: 'Senior 1',
  streamName: 'A',
  room: 'Room 101',
  duration: 60
};

const postData = JSON.stringify(timetableData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/timetables',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const timetable = JSON.parse(data);
      console.log(`\nTimetable created successfully:`);
      console.log(`ID: ${timetable.id}`);
      console.log(`Subject: ${timetable.subject}`);
      console.log(`Day: ${timetable.day}`);
      console.log(`Time: ${timetable.startTime}-${timetable.endTime}`);
      console.log(`Teacher ID: ${timetable.teacherId}`);
      console.log(`Class: ${timetable.className} - ${timetable.streamName}`);
      console.log(`Room: ${timetable.room}`);
    } catch (error) {
      console.log('Raw response:', data);
      console.error('Error parsing JSON:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();
