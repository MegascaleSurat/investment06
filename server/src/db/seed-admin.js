import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from './schema/index.js';
import * as relations from './relations/index.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema: { ...schema, ...relations } });

const seedAdmin = async () => {
  const email = 'admin@zerothinking.com';
  const plainPassword = 'admin123';
  const fullName = 'Super Administrator';
  const role = 'ADMIN';
  const status = 'ACTIVE';

  try {
    console.log(`⏳ Checking if administrator account (${email}) exists...`);
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    if (existingUser) {
      console.log(`⚠️ User ${email} already exists. Updating role to ADMIN and resetting password...`);
      await db
        .update(schema.users)
        .set({
          fullName,
          role,
          status,
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingUser.id));

      console.log(`✅ Administrator account updated successfully!`);
    } else {
      console.log(`✨ Creating brand new administrator account...`);
      await db
        .insert(schema.users)
        .values({
          email,
          fullName,
          role,
          status,
          passwordHash: hashedPassword,
        });

      console.log(`✅ Administrator account registered successfully!`);
    }

    console.log(`
==================================================
🔑 ADMINISTRATOR CREDENTIALS:
==================================================
📧 Email:     ${email}
🔒 Password:  ${plainPassword}
==================================================
`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding administrator failed:', error);
    process.exit(1);
  }
};

seedAdmin();
