'use client'

import { HelpCircle } from 'lucide-react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { providersTourSteps } from '@/lib/tours/providers-tour'

const tourStepsMap: Record<string, typeof providersTourSteps> = {
  'providers-tour': providersTourSteps,
}

type Props = {
  tourName: string
}

export function TourButton({ tourName }: Props) {
  function startTour() {
    const steps = tourStepsMap[tourName]
    if (!steps) return

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
    })

    driverObj.drive()
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 group">
      <button
        onClick={startTour}
        className="size-12 rounded-full bg-[#1A1A1A] text-[#F5F2EA] flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
        aria-label="Iniciar tour"
      >
        <HelpCircle className="size-5" />
      </button>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-[#F5F2EA] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Iniciar tour
      </span>
    </div>
  )
}
