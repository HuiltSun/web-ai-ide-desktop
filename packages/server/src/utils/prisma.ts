import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption.js';

const FIELDS_TO_ENCRYPT = {
  user: ['apiKeys'],
  project: ['path'],
  session: ['cwd'],
  message: ['content', 'systemPayload'],
} as const;

type ModelName = keyof typeof FIELDS_TO_ENCRYPT;

function encryptFields(data: unknown, modelName: ModelName): unknown {
  if (!data || typeof data !== 'object') return data;

  const fields = FIELDS_TO_ENCRYPT[modelName] || [];

  if (Array.isArray(data)) {
    return data.map((item) => encryptFields(item, modelName));
  }

  const result: Record<string, unknown> = { ...data as Record<string, unknown> };

  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      if (typeof result[field] === 'string') {
        result[field] = encrypt(result[field] as string);
      } else if (typeof result[field] === 'object') {
        result[field] = encrypt(JSON.stringify(result[field]));
      }
    }
  }

  return result;
}

function decryptFields(data: unknown, modelName: ModelName): unknown {
  if (!data || typeof data !== 'object') return data;

  const fields = FIELDS_TO_ENCRYPT[modelName] || [];

  if (Array.isArray(data)) {
    return data.map((item) => decryptFields(item, modelName));
  }

  const result: Record<string, unknown> = { ...data as Record<string, unknown> };

  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      try {
        if (typeof result[field] === 'string' && (result[field] as string).includes(':')) {
          const decrypted = decrypt(result[field] as string);
          try {
            result[field] = JSON.parse(decrypted);
          } catch {
            result[field] = decrypted;
          }
        }
      } catch {
        // Field might not be encrypted, keep original
      }
    }
  }

  return result;
}

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  prisma.$use(async (params, next) => {
    const modelName = params.model as ModelName | undefined;

    if (modelName && modelName in FIELDS_TO_ENCRYPT) {
      if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
        if (params.args.data) {
          params.args.data = encryptFields(params.args.data, modelName as ModelName);
        }
      }

      if (params.action === 'findUnique' || params.action === 'findFirst' ||
          params.action === 'findMany' || params.action === 'update') {
        const result = await next(params);
        return decryptFields(result, modelName as ModelName);
      }
    }

    return next(params);
  });

  return prisma;
};

declare global {
  // eslint-disable-next-line no var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
