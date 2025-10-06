// Database connection test for local PostgreSQL setup
import { Pool } from 'pg';

async function testDatabaseConnection() {
  // Default local PostgreSQL connection
  const defaultConnectionString = 'postgresql://postgres:password@localhost:5432/student_nursing_center';
  
  // Use environment variable or default to local PostgreSQL
  const connectionString = process.env.DATABASE_URL || defaultConnectionString;
  
  console.log('🧪 Testing database connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));
  
  const pool = new Pool({ 
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT version();');
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Test if we can create a simple table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await client.query(`
        INSERT INTO connection_test DEFAULT VALUES;
      `);
      
      const testResult = await client.query(`
        SELECT COUNT(*) as test_count FROM connection_test;
      `);
      
      console.log('✅ Database write test successful!');
      console.log('Test records in database:', testResult.rows[0].test_count);
      
      // Clean up test table
      await client.query('DROP TABLE IF EXISTS connection_test;');
      console.log('✅ Database cleanup successful!');
      
    } catch (writeError) {
      console.error('❌ Database write test failed:', writeError.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL is installed and running');
      console.log('2. Check if the database exists');
      console.log('3. Verify username and password');
      console.log('4. Run the setup script: npm run setup');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);