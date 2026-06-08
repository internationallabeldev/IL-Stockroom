import type { DriveStep } from 'driver.js'

export const ordersTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Órdenes de compra',
      description:
        'Aquí se gestionan todas las órdenes de compra del material. Cada orden registra proveedor, artículos, cantidades, fechas y su estado de recepción.',
    },
  },
  {
    element: '#orders-search',
    popover: {
      title: 'Buscar',
      description:
        'Filtra por número de orden (ej. #42) o por nombre del proveedor. El resultado se actualiza al instante.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#orders-status-filter',
    popover: {
      title: 'Filtro de estado',
      description:
        'Muestra órdenes según su estado: Pendiente (sin recepción), Parcial (recepción incompleta), Completada o Cancelada.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#orders-filters-btn',
    popover: {
      title: 'Filtros avanzados',
      description:
        'Abre un panel para filtrar por rango de cantidad, fecha de solicitud y fecha de entrega esperada. El contador muestra cuántos filtros están activos.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#orders-page-size',
    popover: {
      title: 'Resultados por página',
      description:
        'Controla cuántas órdenes se muestran por página.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#orders-new-btn',
    popover: {
      title: 'Nueva orden',
      description:
        'Registra una nueva orden de compra. Solo disponible para usuarios con rol Administrador o Compras.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#orders-table',
    popover: {
      title: 'Tabla de órdenes',
      description:
        'Cada columna es ordenable — haz clic en el encabezado para cambiar el criterio y la dirección de orden.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#orders-row-actions',
    popover: {
      title: 'Ver detalle',
      description:
        'El botón "Ver" abre el detalle completo de la orden: artículos, cantidades ordenadas, recepciones registradas y el estado de cada ítem.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#orders-row-actions',
    popover: {
      title: 'Hacer recepción',
      description:
        'El botón "Recibir" aparece únicamente en órdenes Pendientes o Parciales, y solo para usuarios con permiso de recepción. Al hacer clic se abre el formulario para registrar el material que llegó.',
      side: 'left',
      align: 'start',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces el módulo de órdenes de compra. Puedes reiniciar este tour en cualquier momento desde el botón Tutorial en la barra inferior.',
    },
  },
]
