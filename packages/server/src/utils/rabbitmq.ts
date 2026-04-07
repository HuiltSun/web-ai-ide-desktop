import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const rabbitmq = {
  async getChannel(): Promise<amqp.Channel> {
    if (!channel) {
      const conn = await amqp.connect(RABBITMQ_URL);
      connection = conn as unknown as amqp.Connection;
      channel = await (conn as any).createChannel() as amqp.Channel;
      await channel.assertQueue('ai.tasks', { durable: true });
      await channel.assertQueue('ai.results', { durable: true });
    }
    return channel;
  },

  async close(): Promise<void> {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await (connection as any).close();
      connection = null;
    }
  }
};
