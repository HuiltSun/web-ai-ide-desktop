import { randomUUID } from 'crypto';
import { rabbitmq } from '../utils/rabbitmq.js';

export interface AITask {
  taskId: string;
  sessionId: string;
  tenantId: string;
  prompt: string;
  tools: unknown[];
  model: string;
  timestamp: number;
}

export const queueService = {
  async publishAITask(task: Omit<AITask, 'taskId' | 'timestamp'>): Promise<string> {
    const channel = await rabbitmq.getChannel();
    const taskId = randomUUID();
    const fullTask: AITask = {
      ...task,
      taskId,
      timestamp: Date.now(),
    };

    channel.sendToQueue(
      'ai.tasks',
      Buffer.from(JSON.stringify(fullTask)),
      { persistent: true }
    );

    return taskId;
  },

  async subscribeToResults(
    sessionId: string,
    callback: (result: unknown) => void
  ): Promise<void> {
    const channel = await rabbitmq.getChannel();

    await channel.consume('ai.results', async (msg) => {
      if (msg) {
        const result = JSON.parse(msg.content.toString());
        if (result.sessionId === sessionId) {
          callback(result);
        }
        channel.ack(msg);
      }
    });
  },
};
