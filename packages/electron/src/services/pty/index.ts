/**
 * PTY 服务模块
 * 提供基于 WebSocket 的 PTY 终端连接功能
 */

export {
  WebSocketClient,
  type WebSocketEventMap,
} from './websocket-client';

export {
  MessageType,
  parseMessage,
  createCreateMessage,
  createInputMessage,
  createOutputMessage,
  createResizeMessage,
  createKillMessage,
  createListMessage,
  createExitMessage,
  isCreateMessage,
  isInputMessage,
  isOutputMessage,
  isResizeMessage,
  isKillMessage,
  isListMessage,
  isExitMessage,
  isErrorMessage,
  type PTYMessage,
  type BaseMessage,
  type CreateMessage,
  type InputMessage,
  type OutputMessage,
  type ResizeMessage,
  type KillMessage,
  type ListMessage,
  type ExitMessage,
  type ErrorMessage,
} from './message-parser';

export {
  PTYConnection,
  type PTYConnectionState,
  type PTYConnectionOptions,
} from './pty-connection';
