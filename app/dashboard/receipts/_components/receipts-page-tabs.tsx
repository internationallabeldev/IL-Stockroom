'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  pendingCount:  number
  pendingPanel:  React.ReactNode
  historyPanel:  React.ReactNode
}

type Tab = 'pending' | 'history'

export function ReceiptsPageTabs({ pendingCount, pendingPanel, historyPanel }: Props) {
  const [tab, setTab] = useState<Tab>('pending')

  return (
    <div>
      <div className="flex border-b border-[#1A1A1A]/15 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2',
            tab === 'pending'
              ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A] -mb-px'
              : 'text-[#5f5e59] hover:text-[#1A1A1A]'
          )}
        >
          Pendientes de calidad
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center size-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('history')}
          className={cn(
            'px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
            tab === 'history'
              ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A] -mb-px'
              : 'text-[#5f5e59] hover:text-[#1A1A1A]'
          )}
        >
          Historial
        </button>
      </div>

      {tab === 'pending'
        ? <div key="pending">{pendingPanel}</div>
        : <div key="history">{historyPanel}</div>
      }
    </div>
  )
}
