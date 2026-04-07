import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const INPUT_QUEUE = 'ai.tasks';
const OUTPUT_QUEUE = 'ai.results';

interface AITask {
  taskId: string;
  sessionId: string;
  tenantId: string;
  prompt: string;
  tools: unknown[];
  model: string;
  timestamp: number;
}

async function processAITask(task: AITask): Promise<string> {
  console.log(`Processing task ${task.taskId} with model ${task.model}`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  return `Simulated AI response for: ${task.prompt.substring(0, 50)}...`;
}

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(INPUT_QUEUE, { durable: true });
  await channel.assertQueue(OUTPUT_QUEUE, { durable: true });
  channel.prefetch(1);

  console.log('Worker started, waiting for tasks...');

  channel.consume(INPUT_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const task: AITask = JSON.parse(msg.content.toString());
      console.log(`Received task ${task.taskId}`);

      const result = await processAITask(task);

      channel.sendToQueue(
        OUTPUT_QUEUE,
        Buffer.from(JSON.stringify({
          taskId: task.taskId,
          sessionId: task.sessionId,
          status: 'success',
          result,
        })),
        { persistent: true }
      );

      channel.ack(msg);
      console.log(`Task ${task.taskId} completed`);
    } catch (error) {
      console.error('Task failed:', error);
      const task = JSON.parse(msg.content.toString());
      channel.sendToQueue(
        OUTPUT_QUEUE,
        Buffer.from(JSON.stringify({
          taskId: task.taskId,
          sessionId: task.sessionId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })),
        { persistent: true }
      );
      channel.ack(msg);
    }
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down worker...');
    await channel.close();
    await connection.close();
    process.exit(0);
  });
}

main().catch(console.error);
