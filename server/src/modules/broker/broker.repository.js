import { db } from '../../db/index.js';
import { brokerCredentials, kiteSessions, brokers } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

class BrokerRepository {
  async findCredentialsByUserId(userId) {
    const [record] = await db.select({
      id: brokerCredentials.id,
      userId: brokerCredentials.userId,
      brokerId: brokerCredentials.brokerId,
      apiKey: brokerCredentials.apiKey,
      apiSecretEncrypted: brokerCredentials.apiSecretEncrypted,
      isActive: brokerCredentials.isActive,
      createdAt: brokerCredentials.createdAt,
      updatedAt: brokerCredentials.updatedAt,
      brokerName: brokers.name
    })
    .from(brokerCredentials)
    .leftJoin(brokers, eq(brokerCredentials.brokerId, brokers.id))
    .where(eq(brokerCredentials.userId, userId))
    .limit(1);
    return record;
  }

  async saveCredentials(data) {
    const brokerName = data.brokerName || 'ZERODHA';
    let [broker] = await db.select().from(brokers).where(eq(brokers.name, brokerName)).limit(1);
    if (!broker) {
      // Auto seed broker if missing
      [broker] = await db.insert(brokers).values({
        name: brokerName,
        displayName: brokerName.charAt(0) + brokerName.slice(1).toLowerCase(),
        isActive: true
      }).returning();
    }

    const dbPayload = {
      userId: data.userId,
      brokerId: broker.id,
      apiKey: data.apiKey,
      apiSecretEncrypted: data.apiSecretEncrypted,
      isActive: data.isActive !== undefined ? data.isActive : true
    };

    const existing = await db.select().from(brokerCredentials).where(eq(brokerCredentials.userId, data.userId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(brokerCredentials)
        .set({ ...dbPayload, updatedAt: new Date() })
        .where(eq(brokerCredentials.userId, data.userId))
        .returning();
      
      return { ...updated, brokerName };
    }
    const [inserted] = await db.insert(brokerCredentials).values(dbPayload).returning();
    return { ...inserted, brokerName };
  }

  async deleteCredentials(userId) {
    await db.delete(brokerCredentials).where(eq(brokerCredentials.userId, userId));
  }

  async findSessionByUserId(userId) {
    const [session] = await db.select().from(kiteSessions).where(eq(kiteSessions.userId, userId)).limit(1);
    return session;
  }

  async saveSession(data) {
    const existing = await this.findSessionByUserId(data.userId);
    if (existing) {
      const [updated] = await db.update(kiteSessions)
        .set({
          publicToken: data.publicToken,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          updatedAt: new Date()
        })
        .where(eq(kiteSessions.userId, data.userId))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(kiteSessions).values({
      userId: data.userId,
      publicToken: data.publicToken,
      accessToken: data.accessToken,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    }).returning();
    return inserted;
  }
}

export default new BrokerRepository();
