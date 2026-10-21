import type { ReactNode } from 'react'

interface HighlightProps {
  text: string
  query: string
}

// 대소문자 무시로 일치한 부분을 <mark>로 감싼다. 정규식을 쓰지 않아 특수문자 이스케이프가 필요 없다.
export function Highlight({ text, query }: HighlightProps) {
  const needle = query.trim().toLowerCase()
  if (!needle) return <>{text}</>

  const lower = text.toLowerCase()
  const parts: ReactNode[] = []
  let cursor = 0
  let index = lower.indexOf(needle, cursor)
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index))
    parts.push(
      <mark key={index} className="rounded bg-yellow-200 px-0.5 text-foreground">
        {text.slice(index, index + needle.length)}
      </mark>,
    )
    cursor = index + needle.length
    index = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}
