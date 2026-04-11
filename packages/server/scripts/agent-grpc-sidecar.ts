/**
 * 在 Bun 内运行 @grpc/grpc-js 客户端，与 Bun 托管的 OpenClaude gRPC 服务通信。
 * Node 的 grpc-js 与 Bun 的 gRPC HTTP/2 栈不兼容（UNAVAILABLE / Protocol error），
 * IDE Server 通过本进程的 stdin/stdout JSON 行桥接 Chat 双向流。
 *
 * 协议（每行一条 JSON，UTF-8）：
 * - 侧车 → 父进程首行：{ "t": "r" } ready
 * - 侧车 → 父进程：{ "t": "d", "m": <ServerMessage 对象> } | { "t": "e", "c"?, "m" } | { "t": "n" } end
 * - 父进程 → 侧车：{ "op": "w", "msg": <ClientMessage> } 写流 | { "op": "x" } cancel
 */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as readline from 'node:readline';
import process from 'node:process';

const host = process.env.AGENT_GRPC_HOST || '127.0.0.1';
const port = process.env.AGENT_GRPC_PORT;
const protoPath = process.env.OPENCLAUDE_PROTO_PATH;

async function main(): Promise<void> {
  if (!port || !protoPath) {
    process.stderr.write('agent-grpc-sidecar: missing AGENT_GRPC_PORT or OPENCLAUDE_PROTO_PATH\n');
    process.exit(1);
  }

  const packageDefinition = await protoLoader.load(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const AgentService = protoDescriptor.openclaude.v1.AgentService as any;

  const client = new AgentService(
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );
  const call = client.Chat();

  call.on('data', (msg: unknown) => {
    process.stdout.write(`${JSON.stringify({ t: 'd', m: msg })}\n`);
  });
  call.on('error', (err: Error & { code?: number }) => {
    process.stdout.write(
      `${JSON.stringify({ t: 'e', c: err?.code, m: String(err?.message ?? err) })}\n`
    );
  });
  call.on('end', () => {
    process.stdout.write(`${JSON.stringify({ t: 'n' })}\n`);
  });

  process.stdout.write(`${JSON.stringify({ t: 'r' })}\n`);

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const p = JSON.parse(trimmed) as { op: string; msg?: Record<string, unknown> };
      if (p.op === 'w' && p.msg) {
        call.write(p.msg);
      } else if (p.op === 'x') {
        call.cancel();
      }
    } catch {
      /* ignore malformed lines */
    }
  });
}

main().catch((err) => {
  process.stderr.write(`agent-grpc-sidecar: ${String(err)}\n`);
  process.exit(1);
});
