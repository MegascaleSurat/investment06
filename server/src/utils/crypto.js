const crypto = require('node:crypto');

const { env } = require('../config');

function getKey() {
  const raw = env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error('Missing MASTER_ENCRYPTION_KEY');
  // Derive a 32-byte key from the provided secret string.
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function encrypt(plainText) {
  if (typeof plainText !== 'string' || !plainText) throw new Error('encrypt() expects a non-empty string');

  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM recommended 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // payload = iv.tag.ciphertext (base64)
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decrypt(encryptedText) {
  if (typeof encryptedText !== 'string' || !encryptedText) {
    throw new Error('decrypt() expects a non-empty string');
  }

  const raw = Buffer.from(encryptedText, 'base64');
  if (raw.length < 12 + 16 + 1) throw new Error('Invalid encrypted payload');

  const key = getKey();
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };

