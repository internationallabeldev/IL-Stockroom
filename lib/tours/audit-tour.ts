import type { DriveStep } from 'driver.js'

export const auditTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Módulo de Auditoría',
      description:
        'Bienvenido al historial de auditoría. Aquí queda registrada cada mutación del sistema — creaciones, ediciones y bajas — con su autor, fecha y los campos modificados. Solo los administradores pueden ver esta página. Te guiamos por los elementos principales.',
    },
  },
  {
    element: '#audit-search',
    popover: {
      title: 'Búsqueda rápida',
      description:
        'Busca por nombre del usuario que ejecutó la acción o por el ID numérico del registro modificado. Si escribes un número se filtra por ID exacto; si escribes texto se busca dentro del nombre del autor.',
      side:  'bottom',
      align: 'start',
    },
  },
  {
    element: '#audit-op-filter',
    popover: {
      title: 'Filtro por operación',
      description:
        'Restringe el listado a un solo tipo de operación: Creación (INSERT), Edición (UPDATE) o Baja (DELETE). "Todas" quita el filtro.',
      side:  'bottom',
      align: 'start',
    },
  },
  {
    element: '#audit-page-size',
    popover: {
      title: 'Registros por página',
      description:
        'Ajusta cuántos registros se muestran por página, entre 10 y 200. Útil para revisar bloques grandes sin tener que paginar tanto.',
      side:  'bottom',
      align: 'end',
    },
  },
  {
    element: '#audit-filters-btn',
    popover: {
      title: 'Filtros avanzados',
      description:
        'Abre el panel para filtrar por Tabla afectada, Usuario específico y rango de fechas (Desde / Hasta). El badge numérico indica cuántos filtros avanzados están activos.',
      side:  'bottom',
      align: 'end',
    },
  },
  {
    element: '#audit-stats-bar',
    popover: {
      title: 'KPIs en tiempo real',
      description:
        'Muestra el total de registros, el desglose por operación (Creación / Edición / Baja con sus colores), la cantidad de usuarios distintos, una mini barra de distribución y la tabla más modificada. Estos números respetan los filtros activos.',
      side:  'top',
      align: 'start',
    },
  },
  {
    element: '#audit-table',
    popover: {
      title: 'Tabla de registros',
      description:
        'Cada fila representa una mutación: fecha y hora, tabla afectada, tipo de operación, ID del registro, autor y los campos que cambiaron. Haz clic en cualquier fila para ver el detalle completo con los valores antes y después.',
      side:  'top',
      align: 'start',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces el módulo de Auditoría. Recuerda que la auditoría es la fuente de verdad para investigar cambios — si algo no cuadra en el inventario, una orden o un catálogo, aquí encontrarás quién, cuándo y qué se modificó.',
    },
  },
]
