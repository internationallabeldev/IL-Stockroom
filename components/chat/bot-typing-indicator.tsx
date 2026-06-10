import { Bot } from 'lucide-react'

/** Three animated dots with the bot avatar, shown while the assistant is thinking. */
export function BotTypingIndicator() {
  return (
    <div className="flex shrink-0 items-center gap-2 px-3 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
        <Bot className="size-4" />
      </div>
      <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-2">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}
