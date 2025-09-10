'use client'

import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export function BentoCard({
  dark = false,
  className = '',
  eyebrow,
  title,
  description,
  graphic,
  fade = [],
}: {
  dark?: boolean
  className?: string
  eyebrow: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  graphic: React.ReactNode
  fade?: ('top' | 'bottom')[]
}) {
  return (
    <motion.div
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
      data-dark={dark ? 'true' : undefined}
      className={clsx(
        className,
        'group relative flex flex-col overflow-hidden rounded-lg',
        'bg-white shadow-sm ring-1 ring-black/5',
        'data-[dark=true]:bg-gray-800 data-[dark=true]:ring-white/15',
      )}
    >
      <div className="relative h-80 shrink-0">
        {graphic}
        {fade.includes('top') && (
          <div className="absolute inset-0 bg-gradient-to-b from-white to-50% group-data-[dark=true]:from-gray-800 group-data-[dark=true]:from-[-25%]" />
        )}
        {fade.includes('bottom') && (
          <div className="absolute inset-0 bg-gradient-to-t from-white to-50% group-data-[dark=true]:from-gray-800 group-data-[dark=true]:from-[-25%]" />
        )}
      </div>
      <div className="relative p-10">
        <h4 className="text-sm/6 font-medium text-gray-500 group-data-[dark=true]:text-gray-400">
          {eyebrow}
        </h4>
        <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-[dark=true]:text-white">
          {title}
        </p>
        <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-[dark=true]:text-gray-400">
          {description}
        </p>
      </div>
    </motion.div>
  )
}