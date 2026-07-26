import { Fragment } from 'react'

function inline(text, keyPrefix) {
  const parts = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let match
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${i++}`

    if (token.startsWith('**')) {
      parts.push(
        <strong key={key} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={key}
          className="rounded-md surface-inset px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else {
      parts.push(
        <em key={key} className="italic text-muted">
          {token.slice(1, -1)}
        </em>
      )
    }
    last = match.index + token.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function RichText({ text, className }) {
  const lines = String(text).split('\n')
  const blocks = []
  let list = null

  const flush = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={
          list.ordered
            ? 'ml-4 list-decimal space-y-2 marker:font-medium marker:text-[rgb(var(--accent))]'
            : 'ml-1 space-y-1.5'
        }
      >
        {list.items.map((item, i) => (
          <li key={i} className={list.ordered ? 'pl-1' : 'flex gap-2'}>
            {list.ordered ? null : (
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
            )}
            <span>{inline(item, `li-${blocks.length}-${i}`)}</span>
          </li>
        ))}
      </Tag>
    )
    list = null
  }

  lines.forEach((raw, index) => {
    const line = raw.trim()
    if (!line) {
      flush()
      return
    }

    const bullet = line.match(/^[•\-*]\s+(.*)$/)
    const numbered = line.match(/^(\d+)\.\s+(.*)$/)

    if (bullet) {
      if (!list || list.ordered) flush()
      list = list ?? { ordered: false, items: [] }
      list.items.push(bullet[1])
      return
    }
    if (numbered) {
      if (!list || !list.ordered) flush()
      list = list ?? { ordered: true, items: [] }
      list.items.push(numbered[2])
      return
    }

    flush()
    blocks.push(
      <p key={`p-${index}`} className="leading-relaxed">
        {inline(line, `p-${index}`)}
      </p>
    )
  })

  flush()

  return (
    <div className={className}>
      <div className="space-y-2.5">
        {blocks.map((block, i) => (
          <Fragment key={i}>{block}</Fragment>
        ))}
      </div>
    </div>
  )
}

export default RichText
