import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Rate Limiting (in-memory, per-origin) ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // max 20 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  entry.count++
  return entry.count <= RATE_LIMIT_MAX_REQUESTS
}

// Clean up stale rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) rateLimitMap.delete(key)
    }
  }, 60_000)
}

// ─── Input Validation ───
const MAX_MESSAGE_LENGTH = 50_000 // Max 50K chars per message
const MAX_MESSAGES_COUNT = 50 // Max 50 messages in history

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) return { valid: false, error: 'messages must be an array' }
  if (messages.length === 0) return { valid: false, error: 'messages array cannot be empty' }
  if (messages.length > MAX_MESSAGES_COUNT) return { valid: false, error: `too many messages (max ${MAX_MESSAGES_COUNT})` }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (!msg || typeof msg !== 'object') return { valid: false, error: `messages[${i}] must be an object` }
    if (typeof msg.role !== 'string' || !['user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: `messages[${i}].role must be "user" or "assistant"` }
    }
    if (typeof msg.content !== 'string') return { valid: false, error: `messages[${i}].content must be a string` }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `messages[${i}].content too long (max ${MAX_MESSAGE_LENGTH} chars)` }
    }
  }

  return { valid: true }
}

// ─── Full-Stack Expert System Prompt ───
const FULLSTACK_SYSTEM_PROMPT = `You are Gemma 4, an elite Full-Stack AI Development Assistant integrated into GemmaCode IDE. You are a world-class software engineer with deep expertise across the entire development stack.

## Core Expertise:
- **Frontend**: React, Next.js, Vue, Angular, HTML5, CSS3, Tailwind CSS, TypeScript, JavaScript, Svelte
- **Backend**: Node.js, Express, Fastify, NestJS, Python (FastAPI, Django, Flask), Go, Rust
- **Database**: PostgreSQL, MySQL, MongoDB, SQLite, Redis, Prisma ORM, Drizzle ORM, TypeORM
- **API Design**: REST APIs, GraphQL, WebSocket, tRPC, gRPC
- **DevOps**: Docker, CI/CD, AWS, Vercel, Netlify, Nginx
- **Authentication**: JWT, OAuth 2.0, NextAuth.js, session-based auth
- **State Management**: Redux, Zustand, Pinia, Context API, React Query, SWR
- **Testing**: Jest, Vitest, Cypress, Playwright, React Testing Library

## Guidelines:
1. **Code Quality**: Write clean, production-ready code with proper error handling, type safety, and best practices
2. **Architecture**: Follow SOLID principles, design patterns, and proper project structure
3. **Explanations**: Be thorough but concise. Explain the "why" behind architectural decisions
4. **Code Blocks**: Always use markdown code blocks with proper language tags
5. **File References**: When suggesting code changes, clearly indicate which file each code block belongs to using format: \`📁 filename.ext\`
6. **Full Context**: When given project files, analyze the entire codebase to provide consistent suggestions
7. **Security**: Always consider security implications (XSS, CSRF, SQL injection, auth)
8. **Performance**: Suggest optimizations for both frontend (bundle size, rendering) and backend (query optimization, caching)
9. **Multi-file Changes**: When a feature requires changes across multiple files, present ALL necessary changes clearly

## Response Format:
- Use **bold** for emphasis on key concepts
- Use \`inline code\` for variable/function names
- Use fenced code blocks with language identifiers
- Structure responses with clear headers and sections
- For multi-file changes, label each file clearly

## Language:
- Respond in the same language the user uses
- If the user writes in Arabic, respond in Arabic
- If in English, respond in English
- Maintain technical terms in English when appropriate (e.g., "API endpoint", "component", "middleware")

## Special Capabilities:
- You can generate complete project scaffolding (frontend + backend)
- You can design database schemas with proper relationships
- You can create RESTful API endpoints with validation and error handling
- You can build responsive UI components with modern frameworks
- You can implement authentication and authorization flows
- You can debug complex full-stack issues by analyzing the entire request/response chain
- You can suggest deployment configurations and optimization strategies`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
}

export async function POST(request: NextRequest) {
  try {
    // ─── Rate Limiting ───
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'تم تجاوز حد الطلبات. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.' },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      )
    }

    // ─── Parse & Validate ───
    const body: ChatRequest = await request.json()
    const { messages, stream = true, temperature = 0.7 } = body

    const validation = validateMessages(messages)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ─── Initialize AI SDK ───
    const zai = await ZAI.create()

    // ─── Streaming Response ───
    if (stream) {
      const encoder = new TextEncoder()
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            const completion = await zai.chat.completions.create({
              messages: [
                { role: 'system' as const, content: FULLSTACK_SYSTEM_PROMPT },
                ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
              ],
              temperature: Math.min(Math.max(temperature, 0), 2),
              max_tokens: 4096,
              stream: true,
            })

            const charStream = completion as unknown as AsyncIterable<string>
            let buffer = ''

            for await (const char of charStream) {
              buffer += char
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                const trimmed = line.trim()

                if (!trimmed || trimmed === 'data: [DONE]') {
                  if (trimmed === 'data: [DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  }
                  continue
                }

                if (trimmed.startsWith('data: ')) {
                  try {
                    const jsonStr = trimmed.slice(6)
                    const parsed = JSON.parse(jsonStr)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                  } catch {
                    // Skip malformed JSON
                  }
                }
              }
            }

            // Process remaining buffer
            if (buffer.trim()) {
              const trimmed = buffer.trim()
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(trimmed.slice(6))
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch { /* skip */ }
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Stream error'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // ─── Non-Streaming Fallback ───
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system' as const, content: FULLSTACK_SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: 4096,
    })

    const messageContent = completion.choices[0]?.message?.content

    if (!messageContent) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ content: messageContent })
  } catch (error: unknown) {
    console.error('AI Chat error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
