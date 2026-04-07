import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const SALT_LENGTH = 16;

let cachedKey: Buffer | null = null;

export function clearEncryptionCache(): void {
  cachedKey = null;
}

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }

  const saltEnvVar = process.env.ENCRYPTION_SALT;
  if (saltEnvVar) {
    const salt = Buffer.from(saltEnvVar, 'hex');
    if (salt.length === SALT_LENGTH) {
      cachedKey = crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
      return cachedKey;
    }
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  cachedKey = crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return cachedKey;
}

export function encrypt(text: string): string {
  if (!text) return text;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
}

export function hashForIndex(value: string): string {
  if (!value) return value;
  return crypto.createHash('sha256').update(value).digest('hex');
}