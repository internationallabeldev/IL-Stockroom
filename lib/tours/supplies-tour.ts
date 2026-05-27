import type { DriveStep } from 'driver.js'

export const suppliesTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Semáforo de Consumibles',
      description:
        'Bienvenido al módulo de inventario de consumibles. Aquí controlas el stock de todo lo que se consume en la imprenta: cintas, tóner, adhesivos, suajes y más. El sistema te avisa antes de que algo falte.',
    },
  },
  {
    element: '#supplies-status-filter',
    popover: {
      title: 'Filtros de estado',
      description:
        'Filtra por estado de stock. "Solo críticos" muestra los que ya están por debajo del mínimo, "Solo por agotarse" muestra los que están en zona amarilla de advertencia.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#supplies-new-item-btn',
    popover: {
      title: 'Agregar item',
      description:
        'Registra un nuevo consumible o complemento. Puedes asignarle categoría, unidad, stock mínimo, nivel de alerta y un proveedor sugerido.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#supplies-new-category-btn',
    popover: {
      title: 'Nueva categoría',
      description:
        'Organiza los consumibles en categorías como Tintas UV, Suajes, Adhesivos, Material de empaque, etc. Cada categoría puede tener su propio color de acento.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#supplies-categories',
    popover: {
      title: 'Categorías de consumibles',
      description:
        'Cada sección agrupa los items de una categoría. El header muestra badges con la cantidad de items críticos (rojo) y por agotarse (amarillo). Haz clic para expandir o colapsar.',
      side: 'top',
      align: 'start',
    },
  },
  {
    popover: {
      title: 'Semáforo de stock',
      description:
        'Cada item muestra un círculo de color: 🟢 Verde = stock ok, 🟡 Amarillo = por agotarse (abajo del nivel de alerta), 🔴 Rojo = bajo el mínimo y se enviará un correo automático, ⚫ Negro = sin stock.',
    },
  },
  {
    popover: {
      title: 'Registrar movimientos',
      description:
        'Desde cada fila puedes: [+] registrar una entrada de material, [-] registrar un uso o salida, o [...] para ajuste de inventario, ver historial completo, editar o deshabilitar el item.',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces el módulo de consumibles. Recuerda que el sistema envía alertas por correo automáticamente cuando el stock baja del mínimo, respetando el tiempo de espera configurado en Ajustes.',
    },
  },
]
