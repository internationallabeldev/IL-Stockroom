'use client'

import { NextStep, NextStepProvider } from 'nextstepjs'
import { providersTour } from '@/lib/tours/providers-tour'

const tours = [providersTour]

export function DashboardNextStepProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep steps={tours}>{children}</NextStep>
    </NextStepProvider>
  )
}
