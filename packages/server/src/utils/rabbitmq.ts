import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

let connection: any = null;
let channel: any = null;

export const rabbitmq = {
  async getChannel(): Promise<any> {
    if (!channel) {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

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
