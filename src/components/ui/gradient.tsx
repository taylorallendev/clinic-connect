import { clsx } from 'clsx'

export function Gradient({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'bg-gradient-to-br from-[#e6f7f5] from-28% via-[#7dd3d8] via-70% to-[#31aba3]',
      )}
    />
  )
}

export function GradientBackground() {
  return (
    <div className="relative mx-auto max-w-7xl">
      <div
        className={clsx(
          'absolute -top-44 -right-60 h-60 w-xl transform-gpu md:right-0',
          'bg-gradient-to-br from-[#e6f7f5] from-28% via-[#7dd3d8] via-70% to-[#31aba3]',
          'rotate-[-10deg] rounded-full blur-3xl',
        )}
      />
    </div>
  )
}