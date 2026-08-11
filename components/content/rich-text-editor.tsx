'use client'

import * as React from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Type,
  Underline,
  Undo2,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type ToolKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'h3'
  | 'paragraph'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'left'
  | 'center'
  | 'right'
  | 'link'
  | 'clear'
  | 'undo'
  | 'redo'

const TOOLS: { key: ToolKey; label: string; icon: React.ElementType }[] = [
  { key: 'bold', label: '加粗', icon: Bold },
  { key: 'italic', label: '斜体', icon: Italic },
  { key: 'underline', label: '下划线', icon: Underline },
  { key: 'h3', label: '小标题', icon: Type },
  { key: 'paragraph', label: '正文段落', icon: AlignLeft },
  { key: 'ul', label: '无序列表', icon: List },
  { key: 'ol', label: '有序列表', icon: ListOrdered },
  { key: 'quote', label: '引用', icon: Quote },
  { key: 'center', label: '居中对齐', icon: AlignCenter },
  { key: 'right', label: '右对齐', icon: AlignRight },
  { key: 'link', label: '插入链接', icon: Link2 },
  { key: 'clear', label: '清除格式', icon: Eraser },
  { key: 'undo', label: '撤销', icon: Undo2 },
  { key: 'redo', label: '重做', icon: Redo2 },
]

/**
 * 资讯正文富文本编辑器：内容以 HTML 片段形式受控输出。
 * 采用 contentEditable + document.execCommand，兼容各主流浏览器且无需额外依赖。
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入正文内容，可使用上方工具栏设置格式',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [empty, setEmpty] = React.useState(true)

  // 仅在外部值与编辑器内容不一致时回填，避免打断输入光标
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.innerHTML !== value) el.innerHTML = value
    setEmpty(!el.textContent?.trim())
  }, [value])

  function emit() {
    const el = ref.current
    if (!el) return
    setEmpty(!el.textContent?.trim())
    onChange(el.innerHTML)
  }

  function exec(key: ToolKey) {
    const el = ref.current
    if (!el) return
    el.focus()
    const run = (cmd: string, arg?: string) => document.execCommand(cmd, false, arg)
    switch (key) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'undo':
      case 'redo':
        run(key)
        break
      case 'h3':
        run('formatBlock', '<h3>')
        break
      case 'paragraph':
        run('formatBlock', '<p>')
        break
      case 'quote':
        run('formatBlock', '<blockquote>')
        break
      case 'ul':
        run('insertUnorderedList')
        break
      case 'ol':
        run('insertOrderedList')
        break
      case 'left':
        run('justifyLeft')
        break
      case 'center':
        run('justifyCenter')
        break
      case 'right':
        run('justifyRight')
        break
      case 'link': {
        const url = window.prompt('请输入链接地址', 'https://')
        if (url) run('createLink', url)
        break
      }
      case 'clear':
        run('removeFormat')
        run('formatBlock', '<p>')
        break
    }
    emit()
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-surface focus-within:border-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-1.5 py-1">
        {TOOLS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(key)}
            className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-brand"
          >
            <Icon className="size-3.5" />
          </button>
        ))}
      </div>

      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-3 top-2.5 text-[13px] text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label="资讯正文"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className={cn(
            'scroll-thin max-h-[420px] min-h-64 overflow-y-auto px-3 py-2.5 text-[13px] leading-relaxed text-foreground outline-none',
            'rich-text',
          )}
        />
      </div>
    </div>
  )
}

/** 富文本只读渲染（预览、阅读页共用同一套排版） */
export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn('rich-text text-[13px] leading-relaxed text-foreground', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
