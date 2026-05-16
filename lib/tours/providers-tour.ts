import type { DriveStep } from 'driver.js'

export const providersTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Módulo de Proveedores',
      description:
        'Bienvenido al módulo de gestión de proveedores. Aquí administras todos los contactos de suministro de la imprenta — tintas, papel y más. Te guiaremos por los elementos principales.',
    },
  },
  {
    element: '#providers-search',
    popover: {
      title: 'Buscar proveedores',
      description:
        'Escribe en este campo para filtrar proveedores por nombre, correo electrónico o persona de contacto. El resultado se actualiza en tiempo real.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#providers-type-filter',
    popover: {
      title: 'Filtrar por tipo',
      description:
        'Usa estos botones para ver solo proveedores de Tintas, de Papel, los que suministran Ambos, o el catálogo completo con "Todos".',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#providers-page-size',
    popover: {
      title: 'Resultados por página',
      description:
        'Controla cuántos proveedores se muestran por página. Puedes ingresar cualquier número entre 1 y 100.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#providers-new-btn',
    popover: {
      title: 'Agregar proveedor',
      description:
        'Los usuarios con permisos de administrador o compras pueden registrar nuevos proveedores desde aquí, incluyendo datos de contacto, tipo, dirección y ubicación en mapa.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#providers-grid',
    popover: {
      title: 'Lista de proveedores',
      description:
        'Cada tarjeta muestra el nombre, tipo, persona de contacto, correo y teléfono del proveedor. Haz clic en una tarjeta para ver todos los detalles o editarla.',
      side: 'top',
      align: 'start',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces los elementos principales del módulo de Proveedores. Puedes reiniciar este tour en cualquier momento desde el botón de ayuda en la esquina inferior izquierda.',
    },
  },
]
