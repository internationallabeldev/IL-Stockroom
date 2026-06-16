/**
 * Cross-component signal to open the floating chat widget. The widget and the
 * notification bell are independent siblings with no shared state, so a typed
 * window CustomEvent is the lightest bridge (matching the existing `focus`
 * listeners in both components). `channelId` optionally switches the widget to
 * the channel of a mention.
 */
export const OPEN_CHAT_EVENT = 'il:open-chat'

export type OpenChatDetail = { channelId?: number }

/** Fire-and-forget: ask the ChatWidget to open (optionally on a given channel). */
export function openChat(detail?: OpenChatDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail }))
}
