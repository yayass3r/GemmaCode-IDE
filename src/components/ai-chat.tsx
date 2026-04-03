'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
  Code,
  Zap,
  Bug,
  Server,
  Database,
  Layout,
  Shield,
  Globe,
  Copy,
  Check,
  FilePlus,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react'
import { useIDEStore, type ChatMessage } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'

/* ─── Quick Actions ─── */
interface QuickActionCategory {
  label: string
  icon: React.ReactNode
  actions: QuickAction[]
}

interface QuickAction {
  label: string
  icon: React.ReactNode
  prompt: string
}

const quickActionCategories: QuickActionCategory[] = [
  {
    label: 'التحرير',
    icon: <Code className="size-3" />,
    actions: [
      { label: 'شرح الكود', icon: <Code className="size-3.5" />, prompt: 'قم بشرح الكود الحالي في المحرر بشكل مبسط مع شرح كل جزء ووظيفته' },
      { label: 'تحسين الكود', icon: <Zap className="size-3.5" />, prompt: 'قم بتحسين الكود الحالي لجعله أكثر كفاءة وأفضل، مع توضيح التغييرات التي أجريتها ولماذا' },
      { label: 'إصلاح الأخطاء', icon: <Bug className="size-3.5" />, prompt: 'ابحث عن الأخطاء في الكود الحالي واقترح إصلاحات مع شرح سبب الخطأ' },
    ],
  },
  {
    label: 'Full-Stack',
    icon: <Layers className="size-3" />,
    actions: [
      { label: 'توليد API', icon: <Server className="size-3.5" />, prompt: 'قم بتوليد endpoint API احترافي (REST API) مع التحقق من البيانات ومعالجة الأخطاء. اكتب الكود الكامل لكل من الـ backend و frontend integration' },
      { label: 'قاعدة بيانات', icon: <Database className="size-3.5" />, prompt: 'قم بتصميم schema لقاعدة بيانات احترافي مع العلاقات المناسبة وأمثلة الاستعلامات (queries). استخدم أفضل الممارسات في التصميم' },
      { label: 'إنشاء مكون', icon: <Layout className="size-3.5" />, prompt: 'قم بإنشاء مكون React/Next.js احترافي و responsive مع TypeScript، Tailwind CSS، و proper props typing' },
      { label: 'مصادقة وأمان', icon: <Shield className="size-3.5" />, prompt: 'قم بتطبيق نظام مصادقة وأمان (Authentication & Authorization) كامل مع JWT أو NextAuth.js، يشمل login, signup, protected routes, و middleware' },
    ],
  },
  {
    label: 'مشروع',
    icon: <FilePlus className="size-3" />,
    actions: [
      { label: 'مشروع جديد', icon: <Globe className="size-3.5" />, prompt: 'ساعدني في إنشاء مشروع جديد كامل. أخبرني عن نوع المشروع الذي تريده (Next.js, React, Express, etc.) وسأقوم بتوليد الكود الكامل مع هيكل الملفات' },
    ],
  },
]

/* ─── Code Block Component with Copy Button ─── */
function CodeBlockWithCopy({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between bg-[#0d0d14] px-3 py-1.5 rounded-t-md border-b border-white/5">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
        </Button>
      </div>
      <pre className="!mt-0 !rounded-t-none bg-[#0d0d14] p-3 overflow-x-auto text-[13px] leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

/* ─── File Label Component ─── */
function FileLabel({ filename }: { filename: string }) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const colorMap: Record<string, string> = {
    html: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    css: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    js: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    ts: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    jsx: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    tsx: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    py: 'text-green-400 bg-green-500/10 border-green-500/20',
    json: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sql: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    prisma: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    md: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  }

  const colorClass = colorMap[ext || ''] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
      📁 {filename}
    </span>
  )
}

/* ─── Chat Message Bubble ─── */
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isMobile = useIsMobile()
  const isUser = message.role === 'user'

  const avatarSize = isMobile ? 'size-7' : 'size-8'
  const iconSize = isMobile ? 'size-3.5' : 'size-4'
  const contentMaxWidth = isMobile ? 'max-w-[90%]' : 'max-w-[85%]'
  const contentTextSize = isMobile ? 'text-[13px]' : 'text-sm'

  // Custom components for markdown rendering
  const components = useMemo(() => ({
    pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement> & { children?: React.ReactNode }) {
      // Extract code content from the pre element
      let codeContent = ''
      let codeClassName = ''
      if (React.isValidElement(children)) {
        const codeProps = children.props as React.HTMLAttributes<HTMLElement>
        codeContent = typeof codeProps.children === 'string' ? codeProps.children : ''
        codeClassName = codeProps.className || ''
      }
      return <CodeBlockWithCopy className={codeClassName}>{codeContent}</CodeBlockWithCopy>
    },
    code({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
      // Inline code (not inside a pre block)
      if (!className) {
        return (
          <code className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded text-[12px] font-mono border border-emerald-500/20" {...props}>
            {children}
          </code>
        )
      }
      return <code className={className} {...props}>{children}</code>
    },
    p({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
      return <p className="text-gray-200 mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>
    },
    h1({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
      return <h1 className="text-base font-bold text-white mt-3 mb-1.5" {...props}>{children}</h1>
    },
    h2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
      return <h2 className="text-sm font-bold text-white mt-3 mb-1" {...props}>{children}</h2>
    },
    h3({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
      return <h3 className="text-xs font-semibold text-white mt-2 mb-1" {...props}>{children}</h3>
    },
    ul({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
      return <ul className="text-gray-200 list-disc list-inside space-y-0.5 mb-2" {...props}>{children}</ul>
    },
    ol({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) {
      return <ol className="text-gray-200 list-decimal list-inside space-y-0.5 mb-2" {...props}>{children}</ol>
    },
    li({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) {
      return <li className="text-gray-200 leading-relaxed" {...props}>{children}</li>
    },
    strong({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
      return <strong className="text-white font-semibold" {...props}>{children}</strong>
    },
    a({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2" {...props}>
          {children}
        </a>
      )
    },
    blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
      return (
        <blockquote className="border-r-2 border-emerald-500/50 pr-3 my-2 text-gray-300 italic" {...props}>
          {children}
        </blockquote>
      )
    },
    table({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse" {...props}>{children}</table>
        </div>
      )
    },
    th({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
      return <th className="border border-white/10 px-2 py-1 bg-white/5 text-white font-semibold text-left" {...props}>{children}</th>
    },
    td({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
      return <td className="border border-white/10 px-2 py-1 text-gray-300" {...props}>{children}</td>
    },
    hr(...props: unknown[]) {
      return <hr className="border-white/10 my-3" />
    },
  }), [])

  // Process message content to highlight file references like 📁 filename.ext
  const processedContent = message.content.replace(/📁\s*([\w.-]+\.\w+)/g, (match, filename) => {
    return `\n\n[FILE:${filename}]\n\n`
  })

  // Split content by [FILE:xxx] markers and render
  const parts = processedContent.split(/\[FILE:(\w[^\]]*)\]/)

  const renderContent = () => {
    return parts.map((part, i) => {
      // Check if this part is a filename (odd indices)
      if (i % 2 === 1 && part) {
        return <FileLabel key={`file-${i}`} filename={part} />
      }
      // Render markdown for content parts
      if (part.trim()) {
        return <ReactMarkdown key={`md-${i}`} components={components}>{part}</ReactMarkdown>
      }
      return null
    })
  }

  return (
    <div className={isUser ? 'flex gap-2 flex-row-reverse' : 'flex gap-2'}>
      <div className={'shrink-0 ' + avatarSize + ' rounded-lg flex items-center justify-center ' +
        (isUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-blue-400')}>
        {isUser ? <User className={iconSize} /> : <Bot className={iconSize} />}
      </div>

      <div className={contentMaxWidth + ' rounded-lg px-3 py-2 ' + contentTextSize + ' ' +
        (isUser ? 'bg-emerald-500/20 text-emerald-50' : 'bg-[#1e1e2e] text-gray-200')}
        dir="auto">
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
            {renderContent()}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Welcome Screen ─── */
function WelcomeScreen({ onAction }: { onAction: (prompt: string) => void }) {
  const isMobile = useIsMobile()

  const capabilities = [
    { icon: <Server className="size-4" />, label: 'تطوير Backend', desc: 'APIs, Databases, Auth' },
    { icon: <Layout className="size-4" />, label: 'تطوير Frontend', desc: 'React, Next.js, Components' },
    { icon: <Database className="size-4" />, label: 'قواعد البيانات', desc: 'Schema, Queries, ORM' },
    { icon: <Shield className="size-4" />, label: 'الأمان', desc: 'JWT, OAuth, Security' },
    { icon: <Globe className="size-4" />, label: 'DevOps', desc: 'Docker, CI/CD, Deploy' },
    { icon: <Zap className="size-4" />, label: 'تحسين الأداء', desc: 'Optimization, Caching' },
  ]

  const suggestions = [
    'أنشئ لي REST API لإدارة المستخدمين مع قاعدة بيانات',
    'صمم مكون React لوحة تحكم Dashboard',
    'أنشئ نظام مصادقة كامل مع JWT',
    'حسّن أداء تطبيقي الحالي',
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
      {/* Hero Section */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mb-3">
          <Sparkles className="size-7 text-emerald-400" />
        </div>
        <h2 className="text-base font-bold text-foreground mb-1">Gemma 4 Full-Stack Assistant</h2>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          مساعدك البرمجي الذكي لتطوير المشاريع المتكاملة — من الواجهة إلى الخادم
        </p>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {capabilities.map((cap) => (
          <div
            key={cap.label}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-colors cursor-default"
          >
            <div className="shrink-0 text-emerald-400">{cap.icon}</div>
            <div>
              <div className="text-[11px] font-medium text-foreground">{cap.label}</div>
              <div className="text-[9px] text-muted-foreground">{cap.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="mb-4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">اقتراحات سريعة</div>
        <div className="space-y-1.5">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onAction(suggestion)}
              className="w-full text-right px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all text-xs text-gray-300 hover:text-foreground leading-relaxed"
              dir="auto"
            >
              <span className="text-emerald-400 ml-1.5">→</span>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">
          Powered by <Badge variant="secondary" className="text-[9px] h-3 px-1 font-normal">Gemma 4</Badge>
        </p>
      </div>
    </div>
  )
}

/* ─── Main AI Chat Component ─── */
export default function AIChat() {
  const {
    chatMessages, isChatLoading, addChatMessage, setChatLoading,
    clearChat, files, activeFile, updateLastAssistantMessage, finishStreaming,
  } = useIDEStore()
  const isMobile = useIsMobile()
  const [input, setInput] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('التحرير')
  const [showQuickActions, setShowQuickActions] = useState(!isMobile)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Auto-detect technology stack from files
  const detectedStack = useMemo(() => {
    const stack: string[] = []
    const fileNames = Object.keys(files)
    if (fileNames.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) stack.push('React')
    if (fileNames.some(f => f.includes('next'))) stack.push('Next.js')
    if (fileNames.some(f => f.endsWith('.py'))) stack.push('Python')
    if (fileNames.some(f => f.endsWith('.sql') || f.endsWith('.prisma'))) stack.push('Database')
    if (fileNames.some(f => f.endsWith('.css') || f.endsWith('.scss'))) stack.push('CSS')
    if (fileNames.some(f => f.endsWith('.ts') && !f.endsWith('.tsx'))) stack.push('TypeScript')
    return stack
  }, [files])

  // Build multi-file context
  const buildProjectContext = useCallback(() => {
    const fileNames = Object.keys(files)
    let context = '\n\n[Project Context — All files in the project]\n'

    fileNames.forEach(name => {
      const ext = name.split('.').pop()?.toLowerCase()
      if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'json', 'sql', 'prisma', 'md', 'env'].includes(ext || '')) {
        const isActive = name === activeFile ? ' (currently active)' : ''
        context += `\n📁 ${name}${isActive}\n\`\`\`${ext}\n${files[name]}\n\`\`\`\n`
      }
    })

    if (detectedStack.length > 0) {
      context += `\n[Detected Tech Stack: ${detectedStack.join(', ')}]`
    }

    return context
  }, [files, activeFile, detectedStack])

  const sendMessage = useCallback(
    async (content: string, useFullContext = false) => {
      if (!content.trim() || isChatLoading) return

      const trimmedContent = content.trim()

      // Build context
      let messageContent = trimmedContent
      if (useFullContext) {
        messageContent += buildProjectContext()
      } else if (activeFile && files[activeFile]) {
        const ext = activeFile.split('.').pop()?.toLowerCase()
        if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'json', 'sql', 'prisma'].includes(ext || '')) {
          messageContent += '\n\n[Context: Currently editing "' + activeFile + '" with the following content]\n```' + ext + '\n' + files[activeFile] + '\n```'
        }
      }

      addChatMessage('user', trimmedContent)
      setInput('')
      setChatLoading(true)

      // Add empty assistant message for streaming
      addChatMessage('assistant', '')

      try {
        const messages = chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const apiMessages = [
          ...messages.slice(1), // Skip initial greeting
          { role: 'user' as const, content: messageContent },
        ]

        // Use streaming
        abortRef.current = new AbortController()

        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, stream: true, temperature: 0.7 }),
          signal: abortRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          updateLastAssistantMessage('⚠️ خطأ: ' + (errorData.error || 'حدث خطأ غير متوقع'))
          finishStreaming()
          return
        }

        // Handle SSE stream
        const reader = response.body?.getReader()
        if (!reader) {
          updateLastAssistantMessage('⚠️ خطأ: لا يمكن قراءة الاستجابة')
          finishStreaming()
          return
        }

        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()

              if (data === '[DONE]') {
                continue
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.error) {
                  fullContent = '⚠️ خطأ: ' + parsed.error
                  break
                }
                if (parsed.content) {
                  fullContent += parsed.content
                  updateLastAssistantMessage(fullContent)
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        finishStreaming()
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          finishStreaming()
          return
        }
        updateLastAssistantMessage('⚠️ حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
        finishStreaming()
      }
    },
    [chatMessages, isChatLoading, addChatMessage, setChatLoading, activeFile, files, buildProjectContext, updateLastAssistantMessage, finishStreaming]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickAction = (prompt: string, useFullContext = false) => {
    sendMessage(prompt, useFullContext)
  }

  const toggleCategory = (label: string) => {
    setExpandedCategory(prev => prev === label ? null : label)
  }

  const headerPadding = isMobile ? 'px-3 py-2' : 'px-3 py-2'
  const inputPadding = isMobile ? 'p-2' : 'p-3'
  const textSize = isMobile ? 'text-sm' : 'text-xs'
  const textMinH = isMobile ? 'min-h-[40px]' : 'min-h-[36px]'
  const sendBtnSize = isMobile ? 'size-9' : 'size-8'

  const hasOnlyWelcome = chatMessages.length <= 1

  return (
    <div className="h-full flex flex-col bg-[#181825]">
      {/* Chat header */}
      <div className={'flex items-center justify-between border-b border-border ' + headerPadding}>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">Full-Stack AI Assistant</span>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1.5 font-normal bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-emerald-500/20">
                Gemma 4
              </Badge>
              {detectedStack.length > 0 && !isMobile && (
                <div className="flex items-center gap-0.5">
                  {detectedStack.map(tech => (
                    <Badge key={tech} variant="outline" className="text-[8px] h-3 px-1 font-normal text-muted-foreground">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setShowQuickActions(!showQuickActions)}
            title="الإجراءات السريعة"
          >
            <Zap className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={clearChat}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Quick Actions (collapsible) */}
      {showQuickActions && (
        <div className="border-b border-border overflow-y-auto max-h-[180px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
          {quickActionCategories.map((category) => (
            <div key={category.label}>
              <button
                onClick={() => toggleCategory(category.label)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  {category.icon}
                  <span>{category.label}</span>
                </div>
                {expandedCategory === category.label ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {expandedCategory === category.label && (
                <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto">
                  {category.actions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className={(isMobile ? 'h-7 text-[10px] gap-1 px-2' : 'h-7 text-[10px] gap-1 px-2.5') + ' shrink-0 border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/[0.05]'}
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={isChatLoading}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat messages or Welcome Screen */}
      {hasOnlyWelcome ? (
        <WelcomeScreen onAction={(prompt) => handleQuickAction(prompt, true)} />
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
        >
          {chatMessages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {/* Chat input */}
      <form onSubmit={handleSubmit} className={inputPadding + ' border-t border-border'}>
        <div className="flex items-end gap-2 bg-[#11111b] border border-border rounded-lg p-2 focus-within:border-emerald-500/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن أي شيء... (Shift+Enter لسطر جديد)"
            className={'flex-1 bg-transparent ' + textSize + ' text-foreground outline-none resize-none placeholder:text-muted-foreground ' + textMinH + ' max-h-[100px]'}
            rows={1}
            disabled={isChatLoading}
            dir="auto"
          />
          <Button
            type="submit"
            size="icon"
            className={sendBtnSize + ' shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white'}
            disabled={!input.trim() || isChatLoading}
          >
            {isChatLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[9px] text-muted-foreground">
            {isChatLoading ? 'جارٍ التوليد...' : `${Object.keys(files).length} ملف في المشروع`}
          </span>
          {!isMobile && (
            <span className="text-[9px] text-muted-foreground">
              Enter لإرسال • Shift+Enter لسطر جديد
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
