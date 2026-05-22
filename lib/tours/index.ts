import type { DriveStep } from 'driver.js'
import { providersTourSteps } from './providers-tour'
import { catalogTourSteps }   from './catalog-tour'
import { ordersTourSteps }    from './orders-tour'

export const TOURS: Record<string, DriveStep[]> = {
  '/dashboard/providers':      providersTourSteps,
  '/dashboard/catalog/inks':   catalogTourSteps,
  '/dashboard/catalog/papers': catalogTourSteps,
  '/dashboard/orders/ink':     ordersTourSteps,
  '/dashboard/orders/paper':   ordersTourSteps,
}
