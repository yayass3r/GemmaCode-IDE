import { NextRequest, NextResponse } from 'next/server'

// ─── Direct HTTP AI Client (No SDK Dependency) ───
// This approach bypasses z-ai-web-dev-sdk entirely and makes direct HTTP calls
// to the AI server. This eliminates all config file issues and works reliably
// in both development and production (Vercel) environments.
//
// Configuration is done entirely through environment variables:
//   ZAI_BASE_URL  - AI server endpoint (default: internal dev server)
//   ZAI_API_KEY   - API key for Authorization header (default: "Z.ai")
//   ZAI_TOKEN     - Auth token for X-Token header (REQUIRED by the server)

interface AIConfig {
  baseUrl: string
  apiKey: string
  token: string
  chatId: string
  userId: string
}

function getAIConfig(): AIConfig {
  const baseUrl = process.env.ZAI_BASE_URL || 'http://172.25.136.193:8080/v1'
  const apiKey = process.env.ZAI_API_KEY || 'Z.ai'
  const token = process.env.ZAI_TOKEN || process.env.ZAI_TOKEN_HEADER || ''
  const chatId = process.env.ZAI_CHAT_ID || ''
  const userId = process.env.ZAI_USER_ID || ''

  return { baseUrl, apiKey, token, chatId, userId }
}

// Build headers for AI API requests
function buildHeaders(config: AIConfig, isJson: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Z-AI-From': 'Z',
  }

  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }

  if (config.token) {
    headers['X-Token'] = config.token
  }

  if (config.chatId) {
    headers['X-Chat-Id'] = config.chatId
  }

  if (config.userId) {
    headers['X-User-Id'] = config.userId
  }

  headers['Authorization'] = `Bearer ${config.apiKey}`

  return headers
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

    // ─── Load AI Configuration ───
    const config = getAIConfig()

    // Check if token is available
    if (!config.token) {
      console.error('[AI Chat] ZAI_TOKEN environment variable is not set. The AI server requires an X-Token header.')
      return NextResponse.json(
        {
          error: 'خدمة الذكاء الاصطناعي غير متوفرة حالياً. يجب تعيين ZAI_TOKEN في متغيرات البيئة.',
          hint: 'قم بتعيين متغير البيئة ZAI_TOKEN في إعدادات المشروع أو على Vercel.'
        },
        { status: 503 }
      )
    }

    // Build messages array with system prompt
    const allMessages = [
      { role: 'system' as const, content: FULLSTACK_SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const requestBody = {
      messages: allMessages,
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: 8192,
      thinking: { type: 'disabled' as const },
    }

    const url = `${config.baseUrl}/chat/completions`
    const headers = buildHeaders(config)

    // ─── Streaming Response ───
    if (stream) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...requestBody, stream: true }),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          console.error(`[AI Chat] AI server error ${response.status}:`, errorBody)

          // Handle specific error codes
          if (response.status === 401) {
            return NextResponse.json(
              { error: 'خطأ في مصادقة الذكاء الاصطناعي. تأكد من صحة ZAI_TOKEN.' },
              { status: 502 }
            )
          }
          if (response.status === 429) {
            return NextResponse.json(
              { error: 'تم تجاوز حد الطلبات على خادم الذكاء الاصطناعي. يرجى الانتظار قليلاً.' },
              { status: 429, headers: { 'Retry-After': '30' } }
            )
          }

          return NextResponse.json(
            { error: `خطأ من خادم الذكاء الاصطناعي (${response.status}). يرجى المحاولة لاحقاً.` },
            { status: 502 }
          )
        }

        // Forward the SSE stream from AI server to client
        const encoder = new TextEncoder()
        const aiStream = response.body!

        const sseStream = new ReadableStream({
          async start(controller) {
            try {
              const reader = aiStream.getReader()
              let buffer = ''

              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += new TextDecoder().decode(value, { stream: true })
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
              console.error('[AI Chat] Stream forwarding error:', err)
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
      } catch (fetchError) {
        console.error('[AI Chat] Fetch error (streaming):', fetchError)
        const message = fetchError instanceof Error ? fetchError.message : 'Connection failed'
        return NextResponse.json(
          { error: `تعذر الاتصال بخادم الذكاء الاصطناعي: ${message}` },
          { status: 502 }
        )
      }
    }

    // ─── Non-Streaming Fallback ───
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[AI Chat] AI server error ${response.status}:`, errorBody)
        return NextResponse.json(
          { error: `خطأ من خادم الذكاء الاصطناعي (${response.status})` },
          { status: 502 }
        )
      }

      const data = await response.json()
      const messageContent = data.choices?.[0]?.message?.content

      if (!messageContent) {
        return NextResponse.json({ error: 'لم يتم تلقي رد من الذكاء الاصطناعي.' }, { status: 500 })
      }

      return NextResponse.json({ content: messageContent })
    } catch (fetchError) {
      console.error('[AI Chat] Fetch error (non-streaming):', fetchError)
      const message = fetchError instanceof Error ? fetchError.message : 'Connection failed'
      return NextResponse.json(
        { error: `تعذر الاتصال بخادم الذكاء الاصطناعي: ${message}` },
        { status: 502 }
      )
    }
  } catch (error: unknown) {
    console.error('[AI Chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
