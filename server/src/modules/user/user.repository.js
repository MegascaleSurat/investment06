import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

class UserRepository {
  async findById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async update(id, data) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }
}

export default new UserRepository();
