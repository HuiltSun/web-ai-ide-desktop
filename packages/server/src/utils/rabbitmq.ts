import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

interface AmqpChannel {
  assertQueue(queue: string, options?: { durable: boolean }): Promise<void>;
  sendToQueue(queue: string, content: Buffer, options?: { persistent: boolean }): boolean;
  consume(queue: string, onMessage: (msg: any) => void): Promise<void>;
  ack(msg: any): void;
  close(): Promise<void>;
}

interface AmqpConnection {
  createChannel(): Promise<AmqpChannel>;
  close(): Promise<void>;
}

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;

export const rabbitmq = {
  async getChannel(): Promise<AmqpChannel> {
    if (!channel) {
      const conn = await amqp.connect(RABBITMQ_URL);
      connection = conn as unknown as AmqpConnection;
      channel = await (conn as any).createChannel() as AmqpChannel;

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
