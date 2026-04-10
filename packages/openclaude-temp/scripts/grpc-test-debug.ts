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
  console.log('\n--- Server Message Received ---')
  console.log(JSON.stringify(serverMessage, null, 2))
  console.log('------------------------------\n')

  if (serverMessage.text_chunk) {
    process.stdout.write(`[TEXT CHUNK]: ${serverMessage.text_chunk.text}`)
  } else if (serverMessage.tool_start) {
    console.log(`[Tool Call] ${serverMessage.tool_start.tool_name}`)
    console.log('Auto-replying with "yes"...')
    call.write({
      input: {
        prompt_id: serverMessage.action_required?.prompt_id,
        reply: 'yes'
      }
    })
  } else if (serverMessage.action_required) {
    console.log(`[Action Required] ${serverMessage.action_required.question}`)
    console.log('Auto-replying with "yes"...')
    call.write({
      input: {
        prompt_id: serverMessage.action_required.prompt_id,
        reply: 'yes'
      }
    })
  } else if (serverMessage.done) {
    console.log('[Generation Complete]')
    call.end()
    process.exit(0)
  } else if (serverMessage.error) {
    console.error(`[Server Error] ${serverMessage.error.message}`)
    call.end()
    process.exit(1)
  }
})

call.on('end', () => {
  console.log('[Stream ended]')
  process.exit(0)
})

call.on('error', (err: Error) => {
  console.error('[Stream Error]', err.message)
  process.exit(1)
})

call.write({
  request: {
    session_id: 'test-session-1',
    message: 'Say hello world in 5 words',
    working_directory: process.cwd()
  }
})

setTimeout(() => {
  console.log('Timeout - closing connection')
  call.end()
  process.exit(0)
}, 30000)
