import type { DriveStep } from 'driver.js'

export const outputsHistoryTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Historial de Salidas',
      description:
        'Bienvenido al historial de salidas. Aquí ves todas las requisiciones que ya tuvieron entrega de material — completas (FULFILLED) o parciales (PARTIAL) — con el detalle de lo entregado y lo devuelto.',
    },
  },
  {
    element: '#outputs-search',
    popover: {
      title: 'Búsqueda rápida',
      description:
        'Busca por número de requisición (#), orden de producción o nombre del solicitante. El filtro se aplica en tiempo real sobre el listado.',
      side:  'bottom',
      align: 'start',
    },
  },
  {
    element: '#outputs-mat-tabs',
    popover: {
      title: 'Filtro por material',
      description:
        '"Todos" muestra tinta y papel juntos, "Tinta" solo salidas de tinta (en kg) y "Papel" solo salidas de papel (en m²). El filtro afecta tanto la tabla como los KPIs de la barra inferior.',
      side:  'bottom',
      align: 'start',
    },
  },
  {
    element: '#outputs-date-range',
    popover: {
      title: 'Rango de fechas',
      description:
        'Acota el listado por la fecha en que la requisición fue completada (campo Completado). Define Desde, Hasta o ambos. La X limpia el rango.',
      side:  'bottom',
      align: 'start',
    },
  },
  {
    element: '#outputs-page-size',
    popover: {
      title: 'Resultados por página',
      description:
        'Ajusta cuántas requisiciones se muestran por página. Útil cuando revisas bloques grandes y prefieres ver más sin paginar.',
      side:  'bottom',
      align: 'end',
    },
  },
  {
    element: '#outputs-stats-bar',
    popover: {
      title: 'KPIs de salidas',
      description:
        'Resumen en vivo respetando los filtros activos: Completadas (total), OPs (órdenes de producción únicas), Parciales (con material pendiente), Tinta (kg) y Papel (m²) entregados, Devuelto (con % de merma sobre lo entregado), Entrega prom. (tiempo promedio entre solicitud y entrega), Hoy (salidas del día), Tinta y Papel ppal (material más entregado con su %) y Almacenista (quien entregó más, con el número de salidas).',
      side:  'top',
      align: 'start',
    },
  },
  {
    element: '#outputs-table',
    popover: {
      title: 'Tabla de salidas',
      description:
        'Cada fila es una requisición entregada. Las columnas #, Tipo, O. Prod. y Completado son ordenables (clic en el encabezado). Entregado y Devuelto cambian de unidad automáticamente: kg para tinta, m² para papel.',
      side:  'top',
      align: 'start',
    },
  },
  {
    popover: {
      title: 'Ver detalle',
      description:
        'El botón "Ver" de cada fila abre el panel completo de la requisición: artículos solicitados, lotes asignados, cantidades entregadas y devueltas por lote, fechas y responsable de la entrega.',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces el historial de salidas. Recuerda que aquí solo aparecen requisiciones con material efectivamente entregado — las requisiciones pendientes o aprobadas se gestionan desde el módulo de Requisiciones.',
    },
  },
]
