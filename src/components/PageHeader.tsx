import type { ReactNode } from 'react'

type PageHeaderProps = {
  action?: ReactNode
  eyebrow?: string
  title: string
}

export function PageHeader({ action, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  )
}
