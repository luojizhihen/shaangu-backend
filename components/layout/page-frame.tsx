'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb: string[]
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <nav aria-label="面包屑" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
        {breadcrumb.map((item, i) => (
          <span key={item} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" />}
            <span className={i === breadcrumb.length - 1 ? 'text-foreground' : ''}>
              {item}
            </span>
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Panel({
  title,
  extra,
  className,
  bodyClassName,
  children,
}: {
  title?: string
  extra?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface shadow-[0_1px_2px_rgba(23,32,43,0.04)]',
        className,
      )}
    >
      {title && (
        <header className="flex h-11 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="airflow-line h-3.5 w-[2px] rounded-full" />
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          {extra}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

export function NativeSelect({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  className?: string
  'aria-label'?: string
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 w-full rounded-md border border-input bg-surface px-2 text-[13px] text-foreground focus:border-ring focus:outline-none',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function StatusTag({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    info: 'border-brand/25 bg-brand/8 text-brand',
    success: 'border-brand-green/25 bg-brand-green/10 text-brand-green',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
    neutral: 'border-border bg-muted text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded border px-2 text-xs whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
