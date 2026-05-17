'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  firstName: string
  lastName:  string
  avatarUrl?: string | null
  size?:      Size
  className?: string
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'size-7  text-[9px]',
  md: 'size-10 text-[11px]',
  lg: 'size-20 text-2xl',
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function UserAvatar({ firstName, lastName, avatarUrl, size = 'md', className }: Props) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const bg       = avatarColor(firstName + lastName)
  const cls      = cn('shrink-0 flex items-center justify-center font-bold overflow-hidden', SIZE_CLASSES[size], className)

  if (avatarUrl) {
    return (
      <div className={cls}>
        <Image
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          width={size === 'lg' ? 80 : size === 'md' ? 40 : 28}
          height={size === 'lg' ? 80 : size === 'md' ? 40 : 28}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={cls} style={{ backgroundColor: bg }}>
      <span className="text-white leading-none">{initials}</span>
    </div>
  )
}
