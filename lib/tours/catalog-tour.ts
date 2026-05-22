import type { DriveStep } from 'driver.js'

export const catalogTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Catálogo de materiales',
      description:
        'Aquí se registran todos los materiales activos en el sistema — cada artículo tiene su código, proveedor, stock mínimo y stock actual. Es el punto de partida para órdenes, recepciones e inventario.',
    },
  },
  {
    element: '#catalog-search',
    popover: {
      title: 'Buscar',
      description:
        'Filtra por nombre, código o código de color. El resultado se actualiza en tiempo real conforme escribes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#catalog-stock-filter',
    popover: {
      title: 'Filtro de stock',
      description:
        'Muestra solo artículos según su nivel de stock: OK (en o sobre el mínimo), Stock bajo (por debajo del mínimo) o Sin stock (en cero).',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#catalog-page-size',
    popover: {
      title: 'Resultados por página',
      description:
        'Controla cuántas tarjetas se muestran por página. Acepta cualquier valor entre 1 y 100.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#catalog-new-btn',
    popover: {
      title: 'Agregar artículo',
      description:
        'Registra un nuevo material en el catálogo. Solo disponible para usuarios con rol Administrador o Jefe de almacén.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#catalog-grid',
    popover: {
      title: 'Tarjetas del catálogo',
      description:
        'Cada tarjeta muestra el código, nombre, proveedor y nivel de stock del material. Haz clic en una tarjeta para ver todos sus detalles o editarla.',
      side: 'top',
      align: 'start',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces los controles del catálogo. Puedes reiniciar este tour en cualquier momento desde el botón Tutorial en la barra inferior.',
    },
  },
]
