const { Client } = require('pg');

async function createDatabase() {
  // Connect to default postgres database to create our new database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'GALZ2BOYZ',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Create the new database
    const result = await client.query('CREATE DATABASE sms');
    console.log('Database "sms" created successfully');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database "sms" already exists');
    } else {
      console.error('Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
}

createDatabase();














