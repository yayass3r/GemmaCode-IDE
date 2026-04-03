import { create } from 'zustand'

// ─── User & Auth Types ────────────────────────────────────────
export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  bio: string
  isOnline?: boolean
  lastSeen?: string
  createdAt?: string
}

// Alias used by auth forms
export type AuthUser = UserProfile

export interface Project {
  id: string
  title: string
  description: string
  files: string
  coverImage: string
  isPublished: boolean
  isFeatured: boolean
  isHidden: boolean
  stars: number
  views: number
  forks: number
  tags: string
  authorId: string
  author?: { id: string; name: string; avatar: string }
  createdAt: string
  updatedAt: string
}

export type AppView = 'ide' | 'login' | 'register' | 'profile' | 'admin' | 'explore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'info'
  content: string
}

export type MobileView = 'editor' | 'preview' | 'terminal' | 'aichat' | 'files'

interface IDEStore {
  // ── Auth state ──
  user: UserProfile | null
  token: string | null
  currentView: AppView

  // ── Auth actions ──
  setUser: (user: UserProfile, token: string) => void
  logout: () => void
  setCurrentView: (view: AppView) => void

  // ── File state ──
  files: Record<string, string>
  activeFile: string | null
  openTabs: string[]

  // ── Panel visibility ──
  showPreview: boolean
  showTerminal: boolean
  showAIChat: boolean
  showFileExplorer: boolean
  showDeployPanel: boolean

  // ── Mobile active view ──
  mobileActiveView: MobileView

  // ── Terminal state ──
  terminalLines: TerminalLine[]

  // ── Chat state ──
  chatMessages: ChatMessage[]
  isChatLoading: boolean

  // ── Preview key ──
  previewKey: number

  // ── File actions ──
  createFile: (path: string, content?: string) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  updateFileContent: (path: string, content: string) => void
  setActiveFile: (path: string | null) => void
  openTab: (path: string) => void
  closeTab: (path: string) => void

  // ── Panel toggle actions ──
  togglePreview: () => void
  toggleTerminal: () => void
  toggleAIChat: () => void
  toggleFileExplorer: () => void
  toggleDeployPanel: () => void

  // ── Mobile view action ──
  setMobileView: (view: MobileView) => void

  // ── Terminal actions ──
  addTerminalLine: (type: TerminalLine['type'], content: string) => void
  clearTerminal: () => void

  // ── Chat actions ──
  addChatMessage: (role: 'user' | 'assistant', content: string) => void
  updateLastAssistantMessage: (content: string) => void
  finishStreaming: () => void
  setChatLoading: (loading: boolean) => void
  clearChat: () => void

  // ── Preview actions ──
  refreshPreview: () => void
}

const defaultFiles: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>🚀 Welcome to GemmaCode</h1>
    <p>Edit this project and see live changes in the preview panel!</p>
    <div class="card">
      <h2>Getting Started</h2>
      <p>Start editing <code>index.html</code>, <code>style.css</code>, and <code>script.js</code> to build your project.</p>
    </div>
    <button id="actionBtn" class="btn">Click Me!</button>
    <div id="output" class="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  max-width: 600px;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
}

.card h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #e2e8f0;
}

code {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
}

.btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.btn:active {
  transform: translateY(0);
}

.output {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  min-height: 2rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  text-align: left;
  display: none;
}

.output.visible {
  display: block;
}`,
  'script.js': `// GemmaCode Project Script
const actionBtn = document.getElementById('actionBtn');
const output = document.getElementById('output');

let clickCount = 0;

actionBtn.addEventListener('click', () => {
  clickCount++;
  output.classList.add('visible');
  output.innerHTML = \`
    <div style="color: #10b981;">✨ Click #\${clickCount}</div>
    <div style="color: #94a3b8; margin-top: 0.5rem;">
      Time: \${new Date().toLocaleTimeString()}
    </div>
    <div style="color: #fbbf24; margin-top: 0.25rem;">
      \${clickCount >= 5 ? '🎉 You clicked 5+ times! Amazing!' : 'Keep clicking for a surprise!'}
    </div>
  \`;
  
  // Add a fun animation
  actionBtn.style.transform = \`scale(\${1 + Math.random() * 0.2})\`;
  setTimeout(() => {
    actionBtn.style.transform = 'scale(1)';
  }, 200);
});

console.log('🚀 GemmaCode project loaded successfully!');
console.log('Welcome to the interactive demo!');`,
  'README.md': `# My GemmaCode Project

Welcome to your new project built with **GemmaCode**!

## Features
- 🖥️ Live preview of HTML/CSS/JS
- 📁 File explorer with context menus
- 💬 AI-powered code assistant (Gemma 4)
- 🖥️ Built-in terminal

## Getting Started
1. Edit \`index.html\`, \`style.css\`, or \`script.js\`
2. See live changes in the preview panel
3. Use the AI chat for coding help

## Project Structure
\`\`\`
├── index.html    # Main HTML file
├── style.css     # Stylesheet
├── script.js     # JavaScript logic
└── README.md     # This file
\`\`\`

Built with ❤️ using GemmaCode IDE`
}

let idCounter = 0
const generateId = () => `id-${Date.now()}-${idCounter++}`

export const useIDEStore = create<IDEStore>((set, get) => ({
  // ── Auth state ──
  user: null,
  token: null,
  currentView: 'ide' as AppView,

  // ── Auth actions ──
  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemmacode_token', token)
      localStorage.setItem('gemmacode_user', JSON.stringify(user))
    }
    set({ user, token })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gemmacode_token')
      localStorage.removeItem('gemmacode_user')
    }
    set({ user: null, token: null, currentView: 'ide' as AppView })
  },
  setCurrentView: (view) => set({ currentView: view }),

  // ── File state ──
  files: defaultFiles,
  activeFile: 'index.html',
  openTabs: ['index.html'],

  // ── Panel visibility ──
  showPreview: true,
  showTerminal: true,
  showAIChat: false,
  showFileExplorer: true,
  showDeployPanel: false,

  // ── Mobile active view ──
  mobileActiveView: 'editor' as MobileView,

  // ── Terminal state ──
  terminalLines: [
    { id: generateId(), type: 'info', content: 'Welcome to GemmaCode Terminal v1.0' },
    { id: generateId(), type: 'info', content: 'Type "help" for available commands.' },
    { id: generateId(), type: 'output', content: '' },
  ],

  // ── Chat state ──
  chatMessages: [
    {
      id: generateId(),
      role: 'assistant',
      content: 'مرحبًا! أنا جيما 4، مساعدك البرمجي الذكي. كيف يمكنني مساعدتك اليوم؟ 🚀',
      timestamp: Date.now()
    }
  ],
  isChatLoading: false,

  // ── Preview key ──
  previewKey: 0,

  // ── File actions ──
  createFile: (path, content = '') => {
    set((state) => {
      if (state.files[path]) return state
      return {
        files: { ...state.files, [path]: content },
        openTabs: [...state.openTabs, path],
        activeFile: path,
      }
    })
  },

  deleteFile: (path) => {
    set((state) => {
      const newFiles = { ...state.files }
      delete newFiles[path]
      const newTabs = state.openTabs.filter((t) => t !== path)
      const newActive =
        state.activeFile === path
          ? newTabs[newTabs.length - 1] || null
          : state.activeFile
      return {
        files: newFiles,
        openTabs: newTabs,
        activeFile: newActive,
      }
    })
  },

  renameFile: (oldPath, newPath) => {
    set((state) => {
      const newFiles = { ...state.files }
      const content = newFiles[oldPath]
      delete newFiles[oldPath]
      newFiles[newPath] = content

      const newTabs = state.openTabs.map((t) => (t === oldPath ? newPath : t))
      const newActive = state.activeFile === oldPath ? newPath : state.activeFile

      return {
        files: newFiles,
        openTabs: newTabs,
        activeFile: newActive,
      }
    })
  },

  updateFileContent: (path, content) => {
    set((state) => ({
      files: { ...state.files, [path]: content },
    }))
  },

  setActiveFile: (path) => {
    set({ activeFile: path })
    if (path) {
      const state = get()
      if (!state.openTabs.includes(path)) {
        set({ openTabs: [...state.openTabs, path] })
      }
    }
  },

  openTab: (path) => {
    set((state) => {
      const newTabs = state.openTabs.includes(path)
        ? state.openTabs
        : [...state.openTabs, path]
      return { openTabs: newTabs, activeFile: path }
    })
  },

  closeTab: (path) => {
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t !== path)
      let newActive = state.activeFile
      if (state.activeFile === path) {
        const idx = state.openTabs.indexOf(path)
        newActive = newTabs[Math.min(idx, newTabs.length - 1)] || null
      }
      return { openTabs: newTabs, activeFile: newActive }
    })
  },

  // ── Panel toggles ──
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
  toggleAIChat: () => set((state) => ({ showAIChat: !state.showAIChat })),
  toggleFileExplorer: () => set((state) => ({ showFileExplorer: !state.showFileExplorer })),
  toggleDeployPanel: () => set((state) => ({ showDeployPanel: !state.showDeployPanel })),

  // ── Mobile view ──
  setMobileView: (view) => set({ mobileActiveView: view }),

  // ── Terminal actions ──
  addTerminalLine: (type, content) =>
    set((state) => ({
      terminalLines: [
        ...state.terminalLines,
        { id: generateId(), type, content },
      ],
    })),
  clearTerminal: () => set({ terminalLines: [] }),

  // ── Chat actions ──
  addChatMessage: (role, content) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { id: generateId(), role, content, timestamp: Date.now(), isStreaming: role === 'assistant' },
      ],
    })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.chatMessages]
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], content, isStreaming: true }
          break
        }
      }
      return { chatMessages: messages }
    }),
  finishStreaming: () =>
    set((state) => {
      const messages = [...state.chatMessages]
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant' && messages[i].isStreaming) {
          messages[i] = { ...messages[i], isStreaming: false }
          break
        }
      }
      return { chatMessages: messages, isChatLoading: false }
    }),
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  clearChat: () =>
    set({
      chatMessages: [
        {
          id: generateId(),
          role: 'assistant',
          content: 'مرحبًا! أنا جيما 4، مساعدك البرمجي الذكي. كيف يمكنني مساعدتك اليوم؟ 🚀',
          timestamp: Date.now()
        }
      ],
    }),

  // ── Preview actions ──
  refreshPreview: () => set((state) => ({ previewKey: state.previewKey + 1 })),
}))

// ─── Hydrate auth from localStorage ──────────────────────────
export function hydrateAuth(store: IDEStore) {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('gemmacode_token')
  const userStr = localStorage.getItem('gemmacode_user')
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr) as UserProfile
      store.setState({ user, token })
    } catch {
      localStorage.removeItem('gemmacode_token')
      localStorage.removeItem('gemmacode_user')
    }
  }
}
