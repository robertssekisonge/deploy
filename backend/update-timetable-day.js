const http = require('http');

// Update the timetable to use lowercase day format
const updateData = {
  day: 'monday' // Change from 'Monday' to 'monday' to match frontend
};

const postData = JSON.stringify(updateData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/timetables/1', // Update timetable with ID 1
  method: 'PUT',
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
      console.log(`\nTimetable updated successfully:`);
      console.log(`ID: ${timetable.id}`);
      console.log(`Subject: ${timetable.subject}`);
      console.log(`Day: ${timetable.day}`);
      console.log(`Time: ${timetable.startTime}-${timetable.endTime}`);
      console.log(`Class: ${timetable.className} - ${timetable.streamName}`);
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
