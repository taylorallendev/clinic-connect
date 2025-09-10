import { clsx } from 'clsx'
import Link from 'next/link'
import { ReactNode } from 'react'

const variants = {
  primary: clsx(
    'inline-flex items-center justify-center px-4 py-[calc(0.5rem-1px)]',
    'rounded-full border border-transparent bg-gray-950 shadow-md',
    'text-base font-medium whitespace-nowrap text-white',
    'hover:bg-gray-800 disabled:bg-gray-950 disabled:opacity-40'
  ),
  secondary: clsx(
    'relative inline-flex items-center justify-center px-4 py-[calc(0.5rem-1px)]',
    'rounded-full border border-transparent bg-white/15 shadow-md ring-1 ring-gray-950/15',
    'after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_2px_1px_#ffffff4d]',
    'text-base font-medium whitespace-nowrap text-gray-950',
    'hover:bg-white/20 disabled:bg-white/15 disabled:opacity-40'
  ),
  outline: clsx(
    'inline-flex items-center justify-center px-2 py-[calc(0.375rem-1px)]',
    'rounded-lg border border-transparent shadow-sm ring-1 ring-black/10',
    'text-sm font-medium whitespace-nowrap text-gray-950',
    'hover:bg-gray-50 disabled:bg-transparent disabled:opacity-40'
  ),
}

type RadiantButtonProps = {
  variant?: keyof typeof variants
  className?: string
  children: ReactNode
  disabled?: boolean
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick?: () => void }
)

export function RadiantButton({
  variant = 'primary',
  className,
  children,
  href,
  onClick,
  disabled = false,
  ...props
}: RadiantButtonProps) {
  const classes = clsx(className, variants[variant])

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button 
      className={classes} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}