import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { tenantPlugin } from '../plugins/tenant.plugin.js';
import type { ProviderConfig } from '../services/agent-process-manager.js';
import {
  mapProviderIdToType,
  getDefaultProviderConfig,
  isValidSuperpowerConfig,
  maskApiKey,
  SuperpowerConfig,
  AIProvider,
} from '../constants/provider.js';

interface JwtPayload {
  id: string;
  email: string;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

interface SaveBody {
  providers: AIProvider[];
  selectedProvider: string | null;
  selectedModel: string | null;
}

export async function superpowerRouter(fastify: FastifyInstance) {
  await fastify.register(tenantPlugin);

  fastify.post<{ Body: SaveBody }>(
    '/',
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authRequest = request as unknown as AuthenticatedRequest;
      const userId = authRequest.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const body = request.body as SaveBody;
      const { providers, selectedProvider, selectedModel } = body;

      const config: SuperpowerConfig = {
        providers,
        selectedProvider,
        selectedModel,
      };

      if (!isValidSuperpowerConfig(config)) {
        return reply.code(400).send({ error: 'Invalid config' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { apiKeys: config as any },
      });

      return { success: true };
    }
  );

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authRequest = request as unknown as AuthenticatedRequest;
      const userId = authRequest.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const config = user.apiKeys as unknown as SuperpowerConfig | null;

      if (!config) {
        return {
          providers: [],
          selectedProvider: null,
          selectedModel: null,
        };
      }

      return {
        ...config,
        providers: config.providers.map((p) => ({
          ...p,
          apiKey: maskApiKey(p.apiKey),
        })),
      };
    }
  );

  fastify.get(
    '/active',
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authRequest = request as unknown as AuthenticatedRequest;
      const userId = authRequest.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const config = user.apiKeys as unknown as SuperpowerConfig | null;

      if (!config || !isValidSuperpowerConfig(config) || !config.selectedProvider || !config.providers?.length) {
        return getDefaultProviderConfig();
      }

      const selectedProvider = config.providers.find(
        (p) => p.id === config.selectedProvider
      );

      if (!selectedProvider) {
        return getDefaultProviderConfig();
      }

      const providerConfig: ProviderConfig = {
        type: mapProviderIdToType(selectedProvider.id),
        apiKey: selectedProvider.apiKey,
      };

      if (selectedProvider.apiEndpoint) {
        providerConfig.baseUrl = selectedProvider.apiEndpoint;
      }

      if (config.selectedModel) {
        providerConfig.model = config.selectedModel;
      }

      return providerConfig;
    }
  );
}
