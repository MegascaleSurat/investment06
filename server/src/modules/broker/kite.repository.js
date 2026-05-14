import { db } from '../../db/index.js';
import { kiteCredentials, kiteSessions } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

class KiteRepository {
  async getCredentials(userId) {
    const [creds] = await db.select()
      .from(kiteCredentials)
      .where(eq(kiteCredentials.userId, userId))
      .limit(1);
    return creds;
  }

  async saveSession(userId, sessionData) {
    return await db.insert(kiteSessions)
      .values({
        userId,
        accessToken: sessionData.access_token,
        publicToken: sessionData.public_token,
        loginTime: new Date(sessionData.login_time),
        expiresAt: sessionData.expires_at ? new Date(sessionData.expires_at) : null,
      })
      .onConflictDoUpdate({
        target: kiteSessions.userId,
        set: {
          accessToken: sessionData.access_token,
          publicToken: sessionData.public_token,
          loginTime: new Date(sessionData.login_time),
          expiresAt: sessionData.expires_at ? new Date(sessionData.expires_at) : null,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  async getSession(userId) {
    const [session] = await db.select()
      .from(kiteSessions)
      .where(eq(kiteSessions.userId, userId))
      .limit(1);
    return session;
  }

  async deleteSession(userId) {
    return await db.delete(kiteSessions)
      .where(eq(kiteSessions.userId, userId));
  }
}

export default new KiteRepository();
