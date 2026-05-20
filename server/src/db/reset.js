import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const resetDb = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
  }

  console.log('🗑️ Dropping schema public CASCADE...');
  const client = postgres(connectionString, { max: 1 });

  try {
    await client`DROP SCHEMA IF EXISTS public CASCADE`;
    await client`CREATE SCHEMA public`;
    await client`GRANT ALL ON SCHEMA public TO public`;
    console.log('✅ Database schema clean successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetDb();
