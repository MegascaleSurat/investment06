import { db } from '../../db/index.js';
import { users, settings } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

class AuthRepository {
  async findByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findByPhone(phone) {
    if (!phone) return null;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async findById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async create(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async createSettings(settingsData) {
    await db.insert(settings).values(settingsData);
  }

  async updateRefreshToken(id, refreshToken) {
    await db.update(users).set({ refreshToken }).where(eq(users.id, id));
  }

  async clearRefreshToken(id) {
    await db.update(users).set({ refreshToken: null }).where(eq(users.id, id));
  }

  async update(id, updateData) {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async updatePassword(id, hashedPassword) {
    await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, id));
  }

  async getUserWithSettings(id) {
    const user = await this.findById(id);
    if (!user) return null;

    const userSettings = await db.select().from(settings).where(eq(settings.userId, id));
    
    return {
      ...user,
      settings: userSettings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {}),
    };
  }
}

export default new AuthRepository();
