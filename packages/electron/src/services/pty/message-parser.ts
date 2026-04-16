/**
 * PTY 消息解析器
 * 处理 WebSocket 消息的序列化和反序列化
 */

export enum MessageType {
  CREATE = 'create',
  INPUT = 'input',
  OUTPUT = 'output',
  RESIZE = 'resize',
  KILL = 'kill',
  LIST = 'list',
  EXIT = 'exit',
  ERROR = 'error',
}

export interface BaseMessage {
  type: MessageType;
}

export interface CreateMessage extends BaseMessage {
  type: MessageType.CREATE;
  id: string;
  cols: number;
  rows: number;
  cwd?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface InputMessage extends BaseMessage {
  type: MessageType.INPUT;
  id: string;
  data: string;
}

export interface OutputMessage extends BaseMessage {
  type: MessageType.OUTPUT;
  id: string;
  data: string;
}

export interface ExitMessage extends BaseMessage {
  type: MessageType.EXIT;
  id: string;
  code?: number;
  signal?: number;
}

export interface ListMessage extends BaseMessage {
  type: MessageType.LIST;
}

export interface ResizeMessage extends BaseMessage {
  type: MessageType.RESIZE;
  cols: number;
  rows: number;
}

export interface KillMessage extends BaseMessage {
  type: MessageType.KILL;
  signal?: number;
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  message: string;
}

export type PTYMessage =
  | CreateMessage
  | InputMessage
  | OutputMessage
  | ResizeMessage
  | KillMessage
  | ListMessage
  | ExitMessage
  | ErrorMessage;

export function parseMessage(raw: string): PTYMessage {
  try {
    const parsed = JSON.parse(raw);
    
    if (!isValidMessage(parsed)) {
      throw new Error(`无效的消息格式：${raw}`);
    }
    
    return parsed;
  } catch (error) {
    return {
      type: MessageType.ERROR,
      message: error instanceof Error ? error.message : '未知错误',
    };
  }
}

export function createCreateMessage(
  id: string,
  cols: number,
  rows: number,
  options?: { cwd?: string; command?: string; args?: string[]; env?: Record<string, string> }
): CreateMessage {
  return { type: MessageType.CREATE, id, cols, rows, ...options };
}

export function createInputMessage(id: string, data: string): InputMessage {
  return { type: MessageType.INPUT, id, data };
}

export function createOutputMessage(id: string, data: string): OutputMessage {
  return { type: MessageType.OUTPUT, id, data };
}

export function createResizeMessage(cols: number, rows: number): ResizeMessage {
  return { type: MessageType.RESIZE, cols, rows };
}

export function createKillMessage(signal?: number): KillMessage {
  return { type: MessageType.KILL, signal };
}

export function createListMessage(): ListMessage {
  return { type: MessageType.LIST };
}

export function createExitMessage(id: string, code?: number, signal?: number): ExitMessage {
  return { type: MessageType.EXIT, id, code, signal };
}

export function isCreateMessage(msg: PTYMessage): msg is CreateMessage {
  return msg.type === MessageType.CREATE;
}

export function isInputMessage(msg: PTYMessage): msg is InputMessage {
  return msg.type === MessageType.INPUT;
}

export function isOutputMessage(msg: PTYMessage): msg is OutputMessage {
  return msg.type === MessageType.OUTPUT;
}

export function isResizeMessage(msg: PTYMessage): msg is ResizeMessage {
  return msg.type === MessageType.RESIZE;
}

export function isKillMessage(msg: PTYMessage): msg is KillMessage {
  return msg.type === MessageType.KILL;
}

export function isListMessage(msg: PTYMessage): msg is ListMessage {
  return msg.type === MessageType.LIST;
}

export function isExitMessage(msg: PTYMessage): msg is ExitMessage {
  return msg.type === MessageType.EXIT;
}

export function isErrorMessage(msg: PTYMessage): msg is ErrorMessage {
  return msg.type === MessageType.ERROR;
}

function isValidMessage(msg: unknown): msg is PTYMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  
  if (!m.type || typeof m.type !== 'string') return false;
  
  switch (m.type) {
    case MessageType.CREATE:
      return typeof m.id === 'string' && typeof m.cols === 'number' && typeof m.rows === 'number';
    case MessageType.INPUT:
      return typeof m.id === 'string' && typeof m.data === 'string';
    case MessageType.OUTPUT:
      return typeof m.id === 'string' && typeof m.data === 'string';
    case MessageType.RESIZE:
      return typeof m.cols === 'number' && typeof m.rows === 'number';
    case MessageType.KILL:
      return m.signal === undefined || typeof m.signal === 'number';
    case MessageType.LIST:
      return true;
    case MessageType.EXIT:
      return typeof m.id === 'string' && (m.code === undefined || typeof m.code === 'number') && (m.signal === undefined || typeof m.signal === 'number');
    case MessageType.ERROR:
      return typeof m.message === 'string';
    default:
      return false;
  }
}
