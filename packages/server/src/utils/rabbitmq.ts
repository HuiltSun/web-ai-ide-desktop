import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

interface AmqpChannel {
  assertQueue(queue: string, options?: { durable: boolean }): Promise<{ queue: string; messageCount: number; consumerCount: number }>;
  sendToQueue(queue: string, content: Buffer, options?: { persistent: boolean }): boolean;
  consume(queue: string, onMessage: (msg: AmqpMessage | null) => void): Promise<{ consumerTag: string }>;
  ack(msg: AmqpMessage): void;
  close(): Promise<void>;
}

interface AmqpMessage {
  content: Buffer;
}

let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
let channel: AmqpChannel | null = null;

export const rabbitmq = {
  async getChannel(): Promise<AmqpChannel> {
    if (!channel) {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel() as unknown as AmqpChannel;

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
      await connection.close();
      connection = null;
    }
  }
};
