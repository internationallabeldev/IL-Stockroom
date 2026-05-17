'use client'

import { StockOverviewWidget } from './widgets/stock-overview-widget'
import { ActiveOrdersWidget } from './widgets/active-orders-widget'

export function UserDashboard({ userName }: { userName: string }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-8 pb-16 space-y-8">
      <header>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">Panel</h1>
        <p className="text-lg text-muted-foreground mt-1">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <StockOverviewWidget materialType="INK" />
        </div>
        <div className="col-span-4">
          <StockOverviewWidget materialType="PAPER" />
        </div>
        <div className="col-span-4">
          <ActiveOrdersWidget />
        </div>
      </div>
    </div>
  )
}
