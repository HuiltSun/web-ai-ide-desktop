import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { register, login, getUserById } from '../services/auth.service.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRouter(fastify: FastifyInstance) {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      const user = await register(body);
      return reply.code(201).send({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await login(body);
      const token = fastify.jwt.sign({ id: user.id, email: user.email });
      return reply.send({ user, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      if (error instanceof Error) {
        return reply.code(401).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getUserById((request.user as { id: string }).id);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return reply.send({ user });
  });
}
