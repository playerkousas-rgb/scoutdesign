import { cn } from './utils'

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/60">{subtitle}</p> : null}
    </div>
  )
}

export function FieldLabel({ children }: React.PropsWithChildren) {
  return <div className="text-xs font-medium text-white/70">{children}</div>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-white/20 focus:bg-white/7',
        props.className,
      )}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20 focus:bg-white/7',
        props.className,
      )}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'mt-1 w-full appearance-none rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-white outline-none focus:border-white/30 focus:bg-white/10',
        props.className,
      )}
    />
  )
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' },
) {
  const variant = props.variant ?? 'primary'
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
        variant === 'primary' &&
          'bg-white text-slate-900 hover:bg-white/90 disabled:bg-white/40 disabled:text-slate-900/70',
        variant === 'ghost' &&
          'border border-white/12 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50',
        variant === 'danger' && 'bg-rose-500 text-white hover:bg-rose-500/90',
        props.className,
      )}
    />
  )
}

export function Pill({ children, tone }: React.PropsWithChildren<{ tone: 'red' | 'yellow' | 'blue' }>) {
  const toneClass =
    tone === 'red'
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
      : tone === 'yellow'
        ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
        : 'border-sky-300/30 bg-sky-400/10 text-sky-100'

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', toneClass)}>
      {children}
    </span>
  )
}

export function Divider() {
  return <div className="my-4 h-px w-full bg-white/10" />
}

export function FadeIn({ children }: React.PropsWithChildren) {
  return (
    <div>
      {children}
    </div>
  )
}
