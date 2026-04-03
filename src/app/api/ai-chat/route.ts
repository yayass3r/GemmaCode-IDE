import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs/promises'
import path from 'path'

// ─── Z-AI SDK Initialization (Serverless-Safe) ───
// Strategy: Write .z-ai-config to process.cwd() before calling ZAI.create()
// This works on Vercel because the function filesystem is writable at runtime.
// Fallback: If file write fails, bypass private constructor via runtime.
// The config is sourced entirely from environment variables — no file needed in repo.

interface SDKConfig {
  baseUrl: string
  apiKey: string
  chatId?: string
  userId?: string
  token?: string
}

function getEnvConfig(): SDKConfig {
  return {
    baseUrl: process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1',
    apiKey: process.env.ZAI_API_KEY || 'Z.ai',
    chatId: process.env.ZAI_CHAT_ID || '',
    userId: process.env.ZAI_USER_ID || '',
    token: process.env.ZAI_TOKEN || '',
  }
}

// Cache the SDK instance to avoid re-initializing per request
let _sdkInstance: ZAI | null = null
let _initAttempted = false

async function initSDK(): Promise<ZAI> {
  if (_sdkInstance) return _sdkInstance

  const config = getEnvConfig()

  // Strategy 1: Write config file then use ZAI.create()
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    '/tmp/.z-ai-config',
  ]

  for (const configPath of configPaths) {
    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      console.log(`[AI Chat] Wrote .z-ai-config to ${configPath}`)
    } catch {
      // Try next path
      continue
    }
  }

  // Strategy 2: Try ZAI.create() — it scans cwd(), homedir(), /etc/
  try {
    _sdkInstance = await ZAI.create()
    _initAttempted = true
    console.log('[AI Chat] SDK initialized via ZAI.create()')
    return _sdkInstance
  } catch (err) {
    console.warn('[AI Chat] ZAI.create() failed, using direct instantiation:', err)
  }

  // Strategy 3: Bypass private constructor — works because JS runtime allows it
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new (ZAI as any)(config) as ZAI
    _sdkInstance = instance
    _initAttempted = true
    console.log('[AI Chat] SDK initialized via direct constructor bypass')
    return _sdkInstance
  } catch (directErr) {
    console.error('[AI Chat] All SDK init strategies failed:', directErr)
    throw new Error('Could not initialize AI SDK. Please try again later.')
  }
}

// ─── Rate Limiting (in-memory, per-IP) ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30

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

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) rateLimitMap.delete(key)
    }
  }, 60_000)
}

// ─── Input Validation ───
const MAX_MESSAGE_LENGTH = 50_000
const MAX_MESSAGES_COUNT = 50

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

// ─── Gemma 4 Full-Stack Expert System Prompt ───
const FULLSTACK_SYSTEM_PROMPT = `You are Gemma 4, an elite Full-Stack AI Development Assistant integrated into GemmaCode IDE — an online IDE for building web applications. You are a world-class software engineer with deep expertise across the entire development stack.

## Core Expertise:
- **Frontend**: React, Next.js, Vue, Angular, HTML5, CSS3, Tailwind CSS, Bootstrap, TypeScript, JavaScript, Svelte
- **Backend**: Node.js, Express, Fastify, NestJS, Python (FastAPI, Django, Flask), Go, Rust, PHP (Laravel)
- **Database**: PostgreSQL, MySQL, MongoDB, SQLite, Redis, Prisma ORM, Drizzle ORM, TypeORM
- **API Design**: REST APIs, GraphQL, WebSocket, tRPC, gRPC
- **DevOps**: Docker, CI/CD, AWS, Vercel, Netlify, Nginx
- **Authentication**: JWT, OAuth 2.0, NextAuth.js, session-based auth, Firebase Auth
- **State Management**: Redux, Zustand, Pinia, Context API, React Query, SWR
- **Testing**: Jest, Vitest, Cypress, Playwright, React Testing Library
- **Mobile**: React Native, Flutter, Progressive Web Apps (PWA)

## CRITICAL RULES — Web Application Building:
1. When the user asks you to BUILD or CREATE a web application, you MUST generate complete, working code for ALL files needed
2. Always start with \`📁 index.html\` — the entry point of every web application
3. Generate ALL necessary files: HTML structure, CSS styling, and JavaScript logic
4. Every HTML file must be COMPLETE and SELF-CONTAINED — it must work when opened directly in a browser
5. Use modern, clean, responsive design with proper CSS (Flexbox/Grid)
6. Include ALL functionality in the code — no placeholders, no "TODO" comments, no stubs
7. Test every piece of code mentally before outputting — ensure it will run without errors
8. For complex apps, provide a clear file structure overview first, then generate each file

## Web App Building Template:
When building web applications, follow this structure:
- \`📁 index.html\` — Complete HTML with embedded or linked CSS/JS
- \`📁 style.css\` — All styles (responsive, animations, dark mode support)
- \`📁 script.js\` — All JavaScript logic (DOM manipulation, events, API calls)
- For each file, provide the COMPLETE code — never use "..." or "// rest of code"

## Code Quality Standards:
1. **No Syntax Errors**: Every bracket, tag, and semicolon must be correct
2. **Responsive Design**: All UI must work on mobile (320px) to desktop (1920px+)
3. **Modern JavaScript**: Use ES6+ features, async/await, optional chaining
4. **CSS Best Practices**: Use CSS variables for theming, flexbox/grid for layout
5. **Accessibility**: Proper semantic HTML, ARIA labels, keyboard navigation
6. **Performance**: Minimize DOM manipulation, use event delegation, lazy loading
7. **Security**: Sanitize user inputs, avoid eval(), use CSP-friendly patterns

## Response Format:
- Use **bold** for emphasis on key concepts
- Use \`inline code\` for variable/function names
- Use fenced code blocks with language identifiers (html, css, javascript, typescript, python, etc.)
- Structure responses with clear headers and sections
- ALWAYS label each file with \`📁 filename.ext\` before the code block
- For multi-file projects, present ALL files in order of dependency

## Language:
- Respond in the SAME LANGUAGE the user uses
- If Arabic → respond in Arabic (keep technical terms in English)
- If English → respond in English

## Special Capabilities:
- Generate complete, production-ready web applications from scratch
- Build interactive UIs with smooth animations and transitions
- Create full-stack applications with proper architecture
- Design and implement database schemas with Prisma
- Build RESTful APIs with complete CRUD operations
- Implement real-time features with WebSocket
- Create authentication systems (login, signup, protected routes)
- Debug complex issues by analyzing the full request/response chain
- Suggest deployment configurations for Vercel, Netlify, AWS`

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
    let zai: ZAI
    try {
      zai = await initSDK()
    } catch (configError) {
      console.error('[AI Chat] SDK initialization failed:', configError)
      return NextResponse.json(
        { error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً.' },
        { status: 503 }
      )
    }

    // Build messages array with system prompt
    const allMessages = [
      { role: 'system' as const, content: FULLSTACK_SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    // ─── Streaming Response ───
    if (stream) {
      const encoder = new TextEncoder()
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            const completion = await zai.chat.completions.create({
              messages: allMessages,
              temperature: Math.min(Math.max(temperature, 0), 2),
              max_tokens: 8192,
              stream: true,
            })

            // Handle streaming response — SDK returns SSE stream
            const rawStream = completion as unknown as AsyncIterable<string>
            let buffer = ''

            for await (const chunk of rawStream) {
              buffer += chunk
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
                    // Skip malformed JSON chunks — continue streaming
                  }
                }
              }
            }

            // Process any remaining buffer
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
            console.error('[AI Chat] Stream error:', err)
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
      messages: allMessages,
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: 8192,
    })

    const messageContent = completion.choices?.[0]?.message?.content

    if (!messageContent) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ content: messageContent })
  } catch (error: unknown) {
    console.error('[AI Chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
