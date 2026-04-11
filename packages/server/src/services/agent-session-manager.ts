import * as grpc from '@grpc/grpc-js';
import { AgentProcessManager, type ProviderConfig } from './agent-process-manager.js';
import type { ClientMessage, ServerMessage } from '../types/grpc.js';

interface Session {
  call: grpc.ClientDuplexStream<ClientMessage, ServerMessage>;
  lastActivity: number;
  userId: string;
}

interface PendingRequest {
  sessionId: string;
}

export type WebSocketNotifyFn = (type: string, data: any) => void;

export class AgentSessionManager {
  private sessions: Map<string, Session> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private processManager: AgentProcessManager;

  constructor(processManager: AgentProcessManager) {
    this.processManager = processManager;
    setInterval(() => this.processManager.cleanup(), 5 * 60 * 1000);
  }

  async createSession(
    userId: string,
    sessionId: string,
    provider: ProviderConfig,
    notifyFrontend: WebSocketNotifyFn
  ): Promise<string> {
    const agentProcess = await this.processManager.getOrCreateProcess(userId, sessionId, provider);
    const call = agentProcess.client.Chat();

    call.on('data', (msg: any) => {
      this.updateActivity(sessionId);
      this.handleGrpcMessage(sessionId, msg, notifyFrontend);
    });

    call.on('error', (err: any) => {
      console.error('[AgentSessionManager] gRPC call error:', err);
    });

    call.on('end', () => {
      this.remove(sessionId);
    });

    this.sessions.set(sessionId, {
      call,
      lastActivity: Date.now(),
      userId,
    });

    return sessionId;
  }

  private handleGrpcMessage(
    sessionId: string,
    msg: any,
    notifyFrontend: WebSocketNotifyFn
  ): void {
    if (msg.action_required) {
      const { prompt_id, question, type } = msg.action_required;

      this.pendingRequests.set(prompt_id, { sessionId });

      notifyFrontend('action_required', {
        promptId: prompt_id,
        question,
        actionType: type,
      });
      return;
    }

    if (msg.text_chunk) {
      notifyFrontend('text', { content: msg.text_chunk.text });
      return;
    }

    if (msg.tool_start) {
      notifyFrontend('tool_call', {
        toolCallId: msg.tool_start.tool_use_id,
        toolName: msg.tool_start.tool_name,
        arguments: JSON.parse(msg.tool_start.arguments_json || '{}'),
      });
      return;
    }

    if (msg.tool_result) {
      notifyFrontend('tool_result', {
        toolCallId: msg.tool_result.tool_use_id,
        result: {
          success: !msg.tool_result.is_error,
          output: msg.tool_result.output,
          error: msg.tool_result.is_error ? msg.tool_result.output : undefined,
        },
      });
      return;
    }

    if (msg.done) {
      notifyFrontend('done', {});
      return;
    }

    if (msg.error) {
      notifyFrontend('error', {
        content: msg.error.message,
        code: msg.error.code,
      });
      return;
    }
  }

  async handleUserConfirm(promptId: string, approved: boolean): Promise<void> {
    const pending = this.pendingRequests.get(promptId);
    if (!pending) {
      console.warn(`[AgentSessionManager] No pending request for promptId: ${promptId}`);
      return;
    }

    this.pendingRequests.delete(promptId);

    const reply = approved ? 'yes' : 'no';
    const session = this.sessions.get(pending.sessionId);

    if (session) {
      session.call.write({ user_input: { prompt_id: promptId, reply } });
    }
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  send(sessionId: string, message: any): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.call.write(message);
    session.lastActivity = Date.now();
    return true;
  }

  remove(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.call.cancel();
      this.sessions.delete(sessionId);
    }
  }

  private updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  destroy(): void {
    for (const [id] of this.sessions) {
      this.remove(id);
    }
  }
}