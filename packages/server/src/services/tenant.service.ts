import { prisma } from '../utils/prisma.js';
import { createHash, randomBytes } from 'crypto';

export interface CreateTenantInput {
  name: string;
  schemaName: string;
}

export interface CreateApiKeyInput {
  tenantId: string;
  name?: string;
}

const SCHEMA_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function isValidSchemaName(name: string): boolean {
  return SCHEMA_NAME_REGEX.test(name) && name.length <= 63;
}

export const tenantService = {
  async createTenant(data: CreateTenantInput) {
    if (!isValidSchemaName(data.schemaName)) {
      throw new Error('Invalid schema name. Must match: /^[a-zA-Z_][a-zA-Z0-9_]*$/ and max 63 chars');
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        schema: data.schemaName,
      },
    });

    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${data.schemaName}`;

    return tenant;
  },

  async createApiKey(data: CreateApiKeyInput) {
    const rawKey = `sk_${randomBytes(16).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        name: data.name || 'Default',
        tenantId: data.tenantId,
      },
    });

    return {
      apiKey,
      rawKey,
    };
  },

  async getTenantByApiKey(apiKey: string) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const result = await prisma.$queryRaw<Array<{ id: string; name: string; schema: string }>>`
      SELECT t.id, t.name, t.schema
      FROM public."ApiKey" ak
      JOIN public."Tenant" t ON t.id = ak."tenantId"
      WHERE ak."keyHash" = ${keyHash}
    `;

    return result[0] || null;
  },

  async setSearchPath(schema: string) {
    await prisma.$executeRaw`SET search_path TO ${schema}, public`;
  },
};
