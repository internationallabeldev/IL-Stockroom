import type { DriveStep } from 'driver.js'
import { providersTourSteps }           from './providers-tour'
import { catalogTourSteps }             from './catalog-tour'
import { ordersTourSteps }              from './orders-tour'
import { receiptsTourSteps }            from './receipts-tour'
import { createInventoryTourSteps }     from './inventory-tour'
import { createRequisitionsTourSteps }  from './requisitions-tour'
import { suppliesTourSteps }            from './supplies-tour'

export const TOURS: Record<string, DriveStep[]> = {
  '/dashboard/providers':        providersTourSteps,
  '/dashboard/catalog/inks':     catalogTourSteps,
  '/dashboard/catalog/papers':   catalogTourSteps,
  '/dashboard/orders/ink':       ordersTourSteps,
  '/dashboard/orders/paper':     ordersTourSteps,
  '/dashboard/receipts/ink':     receiptsTourSteps,
  '/dashboard/receipts/paper':   receiptsTourSteps,
  '/dashboard/requisitions/inks':  createRequisitionsTourSteps({ material: 'tinta', unit: 'kg' }),
  '/dashboard/requisitions/paper': createRequisitionsTourSteps({ material: 'papel', unit: 'm²' }),
  '/dashboard/inventory/inks':   createInventoryTourSteps({
    material:    'tintas',
    unit:        'kg',
    lotWord:     'lote',
    lotWordPl:   'lotes',
    idPrefix:    'ink-inv',
    viewLabels:  ['Lista', 'Grupo'],
  }),
  '/dashboard/inventory/paper':  createInventoryTourSteps({
    material:    'papel',
    unit:        'm²',
    lotWord:     'bobina',
    lotWordPl:   'bobinas',
    idPrefix:    'paper-inv',
    viewLabels:  ['Por bobina', 'Por papel'],
  }),
  '/dashboard/supplies': suppliesTourSteps,
}
