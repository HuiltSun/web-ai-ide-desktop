import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.resolve(import.meta.dirname, '../src/proto/openclaude.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const openclaudeProto = protoDescriptor.openclaude.v1

const client = new openclaudeProto.AgentService(
  'localhost:50051',
  grpc.credentials.createInsecure()
)

console.log('Connected to gRPC server, sending test message...')

const call = client.Chat()

call.on('data', async (serverMessage: any) => {
  if (serverMessage.text_chunk) {
    process.stdout.write(serverMessage.text_chunk.text)
  } else if (serverMessage.tool_start) {
    console.log(`\n[Tool Call] ${serverMessage.tool_start.tool_name}`)
  } else if (serverMessage.tool_result) {
    console.log(`\n[Tool Result] ${serverMessage.tool_result.tool_name}`)
  } else if (serverMessage.action_required) {
    console.log(`\n[Action Required] ${serverMessage.action_required.question}`)
    console.log('Auto-replying with "yes" to approve tool call...')
    call.write({
      input: {
        prompt_id: serverMessage.action_required.prompt_id,
        reply: 'yes'
      }
    })
  } else if (serverMessage.done) {
    console.log('\n[Generation Complete]')
    call.end()
    process.exit(0)
  } else if (serverMessage.error) {
    console.error(`\n[Server Error] ${serverMessage.error.message}`)
    call.end()
    process.exit(1)
  }
})

call.on('end', () => {
  console.log('\n[Stream ended]')
})

call.on('error', (err: Error) => {
  console.error('[Stream Error]', err.message)
  process.exit(1)
})

call.write({
  request: {
    session_id: 'test-session-1',
    message: 'Hello, what can you help me with?',
    working_directory: process.cwd()
  }
})
