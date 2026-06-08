'use client'

import { useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from 'next-themes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Props = {
  children: React.ReactNode
  onSelect: (emoji: string) => void
  align?: 'start' | 'center' | 'end'
}

export function EmojiPicker({ children, onSelect, align = 'start' }: Props) {
  const { resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        collisionPadding={8}
        style={{ zIndex: 70 }}
        className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
      >
        <Picker
          data={data}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          previewPosition="none"
          skinTonePosition="none"
          locale="es"
          onEmojiSelect={(e: { native: string }) => {
            onSelect(e.native)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
