import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { createHash } from 'crypto';

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'Missing API key' });
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  try {
    const result = await prisma.$queryRaw<Array<{ tenant_id: string; schema: string }>>`
      SELECT t.id as tenant_id, t.schema
      FROM public."ApiKey" ak
      JOIN public."Tenant" t ON t.id = ak."tenantId"
      WHERE ak."keyHash" = ${keyHash}
    `;

    if (!result || result.length === 0) {
      return reply.status(403).send({ error: 'Invalid API key' });
    }

    request.tenantId = result[0].tenant_id;
    request.tenantSchema = result[0].schema;

    await prisma.$executeRaw`SET search_path TO ${request.tenantSchema}, public`;
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}
