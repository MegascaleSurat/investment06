import { db } from '../../db/index.js';
import { brokerCredentials, brokerSessions } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

class BrokerRepository {
  async findCredentialsByUserId(userId) {
    const [record] = await db.select().from(brokerCredentials).where(eq(brokerCredentials.userId, userId));
    return record;
  }

  async saveCredentials(data) {
    const existing = await this.findCredentialsByUserId(data.userId);
    if (existing) {
      const [updated] = await db.update(brokerCredentials)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(brokerCredentials.userId, data.userId))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(brokerCredentials).values(data).returning();
    return inserted;
  }

  async deleteCredentials(userId) {
    await db.delete(brokerCredentials).where(eq(brokerCredentials.userId, userId));
  }

  async findSessionByUserId(userId) {
    const [session] = await db.select().from(brokerSessions).where(eq(brokerSessions.userId, userId));
    return session;
  }

  async saveSession(data) {
    const existing = await this.findSessionByUserId(data.userId);
    if (existing) {
      const [updated] = await db.update(brokerSessions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(brokerSessions.userId, data.userId))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(brokerSessions).values(data).returning();
    return inserted;
  }
}

export default new BrokerRepository();
