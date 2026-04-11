# gRPC 连接问题排查与修复报告

**日期**: 2026-04-11  
**范围**: `packages/server` 与 `packages/openclaude-temp` 之间的本机 gRPC（Agent 子进程）  
**相关错误**: `14 UNAVAILABLE: No connection established. Last error: Protocol error`

---

## 1. 执行摘要

`@grpc/grpc-js` 在 Node 侧通过 **明文 HTTP/2（`createInsecure`）** 连接子进程中的 OpenClaude gRPC 服务。原先存在两类与「协议是否真正就绪」弱相关的问题：

1. **就绪判定过弱**：仅用 TCP `connect` 判断端口可用，再固定休眠 1s，既不能保证对端已是合法 gRPC/HTTP2，也无法在慢启动时自适应等待。  
2. **回环地址不一致风险（尤其 Windows）**：客户端与 TCP 探测使用 `localhost`，子进程默认 `GRPC_HOST=localhost`。在部分环境下 `localhost` 可能在 **IPv4（127.0.0.1）与 IPv6（::1）** 间解析顺序不同，导致 **TCP 探测连到的栈** 与 **gRPC 实际监听栈** 不一致，进而连到错误套接字或非预期服务，表现为 **HTTP/2 层的 Protocol error**，映射为 gRPC `UNAVAILABLE`。

本次修复：**统一使用 `127.0.0.1`**（子进程设置 `GRPC_HOST`，服务端 TCP 探测与 gRPC 目标地址一致）。TCP 就绪后增加 **约 800ms** settle 再 `createGrpcClient`；**不使用 `waitForReady`**（避免在 Bun 服务 + Node 客户端组合下误判超时）。子进程创建失败时在同一 `try/catch` 中 **kill 子进程并 `releasePort`**。

**Agent 子进程必须用 Bun 启动**（`bun run dev:grpc`）：`openclaude-temp` 在业务代码中广泛 `import { feature } from 'bun:bundle'` 等 **Bun 专有 URL 协议**。若用 Node+tsx 跑 `scripts/start-grpc.ts`，会在加载阶段抛出 **`ERR_UNSUPPORTED_ESM_URL_SCHEME`（Received protocol 'bun:'）**，无法在不大规模替换/打桩的前提下用 Node 替代。

**IDE Server（Node）与 Agent（Bun gRPC）之间的 Chat 流**：Node 内置的 `@grpc/grpc-js` 客户端与 Bun 托管的 gRPC 服务在 cleartext HTTP/2 上易出现 **`14 UNAVAILABLE` / `Protocol error`**（与 `grpc-cli` 在 **Bun** 下直连正常形成对照）。当前实现为再启动 **Bun 侧车** `packages/server/scripts/agent-grpc-sidecar.ts`，在侧车内使用 `grpc-js` 连接 Agent，与 Node 之间用 **stdin/stdout JSON 行**桥接（见 `bun-grpc-chat-bridge.ts`）。

---

## 2. 第一性原理（简述）

gRPC（grpc-js）依赖 **TCP + HTTP/2 + gRPC 帧语义**。`UNAVAILABLE` + `Protocol error` 表示在建立可用会话前，HTTP/2 层认为对端字节流不合法（例如连到 HTTP/1.1、TLS 与明文混用、或「同端口不同 IP 族上的不同监听」等）。

因此：**「端口能 telnet」≠「gRPC 已可调用」**；应保证 **地址族一致**。**`waitForReady`** 仅反映 Node 侧通道状态，在 Bun 托管的 `grpc-js` 对端上可能长期非 `READY`，不宜作为子进程就绪的硬门槛（当前用 **TCP + 短延时**，首条业务流由 `Chat()` 建立）。

---

## 3. 仓库内事实对齐

| 组件 | 行为 |
|------|------|
| Agent | 父进程 **`bun run dev:grpc`**，读取 `GRPC_PORT`、`GRPC_HOST`（`127.0.0.1`），`createInsecure()` |
| IDE Server | **Node** + `@grpc/grpc-js` 客户端，同上 |

两端均为 **明文 gRPC**。Agent 侧运行时 **固定为 Bun**（源码依赖 `bun:`）。

---

## 4. 代码变更说明

**文件**: `packages/server/src/services/agent-process-manager.ts`

- 常量 `GRPC_LOOPBACK = '127.0.0.1'`，子进程 `GRPC_HOST`、TCP 探测、gRPC 目标一致。  
- 子进程 **始终** `bun run dev:grpc`（不可改为 Node+tsx，原因见上文 `bun:`）。  
- TCP 就绪后 **`GRPC_POST_TCP_SETTLE_MS`（800ms）** 再 `createGrpcClient`；**不使用 `waitForReady`**。  
- **创建 client + 注册进程** 在同一 `try` 中，失败时 **kill 子进程并 `releasePort`**；`crossSpawn` 空值检查保留。

---

## 5. 验证建议

1. **正常路径**: 日志中应出现 `Spawning: bun run dev:grpc` 与 `gRPC Server running at 127.0.0.1:...`；本机需已安装 **`bun`** 且在 PATH 中。  
2. **失败路径**: 故意错误 API Key 或触发 `validateProviderEnvOrExit` 失败，确认子进程退出后服务端 **释放端口**。  
3. **手动 CLI**: 在 `openclaude-temp` 下 `bun run dev:grpc:cli` 时仍可设 `GRPC_HOST=127.0.0.1`；README 中关于勿用错误方式跑 CLI 的说明仍然适用。

---

## 6. 若问题仍出现时的排查顺序

1. 若出现 **`ERR_UNSUPPORTED_ESM_URL_SCHEME` / `Received protocol 'bun:'`**：说明 Agent 被用 **Node** 去跑依赖 **`bun:`** 的包；应恢复为 **`bun run dev:grpc`**，勿用 `node`/`tsx` 直接执行 `openclaude-temp` 的入口脚本。  
2. 确认 **50052–50151**（端口池）未被其他 HTTP/HTTPS 服务占用。  
3. 查看 Agent **stderr/stdout**：`init()` 或 `validateProviderEnvOrExit` 是否在 `bind` 前退出。  
4. 确认本机 **仅一个** 进程占用当前 `GRPC_PORT`，且 **`bun` 在 PATH 中**。  
5. 企业代理 / 安全软件是否对 **本地回环** 注入非 HTTP/2 流量（少见，可临时排除后复测）。

---

## 7. 结论

**回环固定为 `127.0.0.1`** 减轻 IPv4/IPv6 解析分裂带来的 **Protocol error**。**Agent 仅能以 Bun 启动**（`bun:` 依赖），IDE Server 仍以 Node 连接；**不使用 `waitForReady`**，改用 **TCP + 短 settle**，避免误判超时。若需纯 IPv6，可后续引入 `GRPC_LOOPBACK` 等配置项替代写死常量。
