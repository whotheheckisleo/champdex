import { Link } from 'react-router-dom'

type BreadcrumbItem = {
  label: string
  to?: string
}

type Props = {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        {items.map((item, index) => (
          <li className="flex items-center gap-1.5" key={index}>
            {index > 0 && (
              <span aria-hidden="true" className="text-slate-600">
                ›
              </span>
            )}
            {item.to ? (
              <Link className="transition hover:text-amber-400" to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-200">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
