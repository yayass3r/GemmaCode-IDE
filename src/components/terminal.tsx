'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal as TerminalIcon, Trash2 } from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

export default function Terminal() {
  const { terminalLines, addTerminalLine, clearTerminal, files } = useIDEStore()
  const isMobile = useIsMobile()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [terminalLines])

  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim()
      if (!trimmed) return

      addTerminalLine('input', `$ ${trimmed}`)
      setHistory((prev) => [...prev, trimmed])
      setHistoryIndex(-1)

      const parts = trimmed.split(' ')
      const command = parts[0].toLowerCase()
      const args = parts.slice(1)

      switch (command) {
        case 'help':
          addTerminalLine(
            'output',
            'Available commands:'
          )
          addTerminalLine('output', '  help     - Show this help message')
          addTerminalLine('output', '  clear    - Clear the terminal')
          addTerminalLine('output', '  ls       - List project files')
          addTerminalLine('output', '  echo     - Echo text back')
          addTerminalLine('output', '  date     - Show current date/time')
          addTerminalLine('output', '  cat      - Show file content')
          addTerminalLine('output', '  pwd      - Print working directory')
          addTerminalLine('output', '  whoami   - Show current user')
          addTerminalLine('output', '  neofetch - System info')
          addTerminalLine('output', '  run      - Trigger preview refresh')
          break

        case 'clear':
          clearTerminal()
          break

        case 'ls':
          const fileList = Object.keys(files)
          fileList.forEach((f) => {
            const ext = f.split('.').pop()
            const colors: Record<string, string> = {
              html: '\x1b[38;2;251;146;60m', css: '\x1b[38;2;96;165;250m',
              js: '\x1b[38;2;250;204;21m', json: '\x1b[38;2;74;222;128m',
              md: '\x1b[38;2;156;163;175m', py: '\x1b[38;2;134;239;172m',
            }
            addTerminalLine('output', `  ${f}`)
          })
          break

        case 'echo':
          addTerminalLine('output', args.join(' '))
          break

        case 'date':
          addTerminalLine('output', new Date().toString())
          break

        case 'cat':
          if (args.length > 0) {
            const filename = args[0]
            if (files[filename]) {
              const content = files[filename]
              content.split('\n').forEach((line) => {
                addTerminalLine('output', line)
              })
            } else {
              addTerminalLine('error', `cat: ${filename}: No such file`)
            }
          } else {
            addTerminalLine('error', 'Usage: cat <filename>')
          }
          break

        case 'pwd':
          addTerminalLine('output', '/home/gemma/project')
          break

        case 'whoami':
          addTerminalLine('output', 'gemma-coder')
          break

        case 'neofetch':
          addTerminalLine('output', '  ╭─────────────────╮')
          addTerminalLine('output', '  │  🟢 GemmaCode   │')
          addTerminalLine('output', '  │  IDE v1.0       │')
          addTerminalLine('output', '  ╰─────────────────╯')
          addTerminalLine('output', '  OS: GemmaCode OS')
          addTerminalLine('output', `  Files: ${Object.keys(files).length}`)
          addTerminalLine('output', `  Shell: gemmash 1.0`)
          addTerminalLine('output', `  Theme: Dark Emerald`)
          addTerminalLine('output', `  AI: Gemma 4 ✨`)
          break

        case 'run':
          addTerminalLine('info', '▶ Running project...')
          setTimeout(() => {
            addTerminalLine('output', '✅ Project running at localhost:3000')
          }, 500)
          break

        default:
          addTerminalLine(
            'error',
            `Command not found: ${command}. Type "help" for available commands.`
          )
      }
    },
    [addTerminalLine, clearTerminal, files]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
      }
    }
  }

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-emerald-400'
      case 'output': return 'text-gray-300'
      case 'error': return 'text-red-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-300'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#11111b] font-mono" dir="ltr">
      {/* Terminal header */}
      <div className={`flex items-center justify-between bg-[#181825] border-b border-border border-t border-border ${isMobile ? 'px-4 py-2' : 'px-3 py-1.5'}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TerminalIcon className="size-3.5" />
          <span>Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          onClick={clearTerminal}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'p-4 text-[13px]' : 'p-3 text-xs'} leading-relaxed`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {terminalLines.map((line) => (
          <div
            key={line.id}
            className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}
          >
            {line.content}
          </div>
        ))}
      </div>

      {/* Terminal input */}
      <form onSubmit={handleSubmit} className={`flex items-center border-t border-border ${isMobile ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <span className={`text-emerald-400 ${isMobile ? 'text-sm' : 'text-xs'} mr-2 shrink-0`}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent ${isMobile ? 'text-sm' : 'text-xs'} text-gray-200 outline-none font-mono placeholder:text-gray-600`}
          placeholder="Type a command..."
          autoFocus
          spellCheck={false}
        />
      </form>
    </div>
  )
}
