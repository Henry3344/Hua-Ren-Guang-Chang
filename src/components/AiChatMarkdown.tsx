'use client'

import type { ReactNode } from 'react'

type Props = {
  content: string
  variant?: 'default' | 'system'
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; code: string }

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```([\s\S]*?)```/g, (_, code: string) => code.trim())
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function AiChatMarkdown({ content, variant = 'default' }: Props) {
  const blocks = parseBlocks(content)
  const className =
    variant === 'system'
      ? 'space-y-3 text-[15px] leading-7 text-foreground [&>p:first-child]:font-semibold [&>p:first-child]:tracking-tight [&>ul]:rounded-xl [&>ul]:border [&>ul]:border-border/70 [&>ul]:bg-muted/35 [&>ul]:px-4 [&>ul]:py-3 [&>ul]:marker:text-primary/70 [&>p:last-child]:text-sm [&>p:last-child]:text-muted-foreground'
      : 'space-y-3 text-[15px] leading-7 text-foreground'

  return (
    <div className={className}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  )
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index++
      continue
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = []
      index++
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index++
      }
      if (index < lines.length) index++
      blocks.push({ type: 'code', code: codeLines.join('\n').trimEnd() })
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      })
      index++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index++
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') })
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ''))
        index++
      }
      blocks.push({ type: 'unordered-list', items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index++
      }
      blocks.push({ type: 'ordered-list', items })
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length) {
      const current = lines[index]
      const currentTrimmed = current.trim()
      if (
        !currentTrimmed ||
        currentTrimmed.startsWith('```') ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        /^>\s?/.test(currentTrimmed) ||
        /^[-*+]\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed)
      ) {
        break
      }
      paragraphLines.push(current)
      index++
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n').trim() })
  }

  return blocks
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      const className =
        block.level <= 2
          ? 'text-base font-semibold tracking-tight text-foreground'
          : 'text-sm font-semibold tracking-tight text-foreground/95'
      const Tag = block.level <= 2 ? 'h3' : 'h4'
      return (
        <Tag key={`heading-${index}`} className={className}>
          {renderInline(block.text)}
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p key={`p-${index}`} className="whitespace-pre-wrap text-sm leading-7 text-foreground">
          {renderInline(block.text)}
        </p>
      )
    case 'unordered-list':
      return (
        <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5 text-sm leading-7 marker:text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={`ul-item-${index}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ul>
      )
    case 'ordered-list':
      return (
        <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5 text-sm leading-7 marker:text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={`ol-item-${index}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ol>
      )
    case 'blockquote':
      return (
        <blockquote
          key={`quote-${index}`}
          className="border-l-2 border-border pl-3 text-sm leading-7 text-muted-foreground"
        >
          {renderInline(block.text)}
        </blockquote>
      )
    case 'code':
      return (
        <pre
          key={`code-${index}`}
          className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-6 text-foreground"
        >
          <code>{block.code}</code>
        </pre>
      )
  }
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern =
    /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const [raw, , linkLabel, linkHref, boldA, boldB, code, italicA, italicB] = match
    if (linkLabel && linkHref) {
      const href = normalizeHref(linkHref)
      nodes.push(
        href ? (
          <a
            key={`${match.index}-${href}`}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {linkLabel}
          </a>
        ) : (
          linkLabel
        ),
      )
    } else if (boldA || boldB) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-foreground">
          {boldA || boldB}
        </strong>,
      )
    } else if (code) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em] text-foreground"
        >
          {code}
        </code>,
      )
    } else if (italicA || italicB) {
      nodes.push(
        <em key={`${match.index}-em`} className="italic text-foreground/90">
          {italicA || italicB}
        </em>,
      )
    } else {
      nodes.push(raw)
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function normalizeHref(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return null
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || /^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return null
}
