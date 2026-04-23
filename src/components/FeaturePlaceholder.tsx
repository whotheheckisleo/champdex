import type { ReactNode } from 'react'

type FeaturePlaceholderProps = {
  title: string
  eyebrow: string
  description: string
  items: string[]
  note: ReactNode
}

export function FeaturePlaceholder({
  title,
  eyebrow,
  description,
  items,
  note,
}: FeaturePlaceholderProps) {
  return (
    <section className="placeholder-card">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <ul className="placeholder-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="callout">{note}</div>
    </section>
  )
}