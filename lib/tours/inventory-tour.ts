import type { DriveStep } from 'driver.js'

type InventoryTourOpts = {
  /** 'tintas' | 'papel' */
  material:   string
  /** 'kg' | 'm²' */
  unit:       string
  /** 'lote' | 'bobina' */
  lotWord:    string
  /** plural of lotWord: 'lotes' | 'bobinas' */
  lotWordPl:  string
  /** 'ink-inv' | 'paper-inv' */
  idPrefix:   string
  /** view toggle labels, e.g. ['Lista', 'Grupo'] or ['Por bobina', 'Por papel'] */
  viewLabels: [string, string]
}

export function createInventoryTourSteps(opts: InventoryTourOpts): DriveStep[] {
  const { material, unit, lotWord, lotWordPl, idPrefix, viewLabels } = opts

  return [
    {
      popover: {
        title: `Inventario de ${material}`,
        description: `Bienvenido al módulo de inventario de ${material}. Aquí puedes consultar todos los ${lotWordPl} activos, su disponibilidad en ${unit}, el estado de calidad y gestionar solicitudes de material.`,
      },
    },
    {
      element: `#${idPrefix}-stats`,
      popover: {
        title: 'KPIs del inventario',
        description: `Resumen en tiempo real: ${lotWordPl} activos, total de ${unit} disponibles, ${lotWordPl} bajo el mínimo de stock, consumo promedio diario, ${lotWordPl} sin movimiento y el ${lotWord} prioritario según FIFO.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: `#${idPrefix}-search`,
      popover: {
        title: `Buscar ${lotWordPl}`,
        description: `Filtra por ${lotWord} interno, nombre o código de ${material === 'tintas' ? 'tinta' : material}, o lote del proveedor. El resultado se actualiza en tiempo real.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: `#${idPrefix}-low-stock`,
      popover: {
        title: 'Filtro: stock bajo',
        description: `Muestra únicamente los ${lotWordPl} cuyo stock disponible está por debajo del mínimo configurado en el catálogo. El badge naranja indica cuántos ${lotWordPl} están en esta condición.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: `#${idPrefix}-show-disabled`,
      popover: {
        title: `${lotWordPl.charAt(0).toUpperCase() + lotWordPl.slice(1)} deshabilitados`,
        description: `Activa esta opción para incluir en la vista los ${lotWordPl} que han sido dados de baja. Por defecto solo se muestran ${lotWordPl} activos.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: `#${idPrefix}-page-size`,
      popover: {
        title: 'Resultados por página',
        description: `Controla cuántos ${lotWordPl} se muestran por página en la vista de lista. Escribe el número deseado y se aplica al instante.`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: `#${idPrefix}-view-toggle`,
      popover: {
        title: `Vista: ${viewLabels[0]} vs ${viewLabels[1]}`,
        description: `"${viewLabels[0]}" muestra cada ${lotWord} en su propia fila. "${viewLabels[1]}" agrupa los ${lotWordPl} por catálogo para ver el stock consolidado por tipo. La preferencia se guarda automáticamente.`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: `#${idPrefix}-table`,
      popover: {
        title: `Tabla de ${lotWordPl}`,
        description: `Cada fila es un ${lotWord}. Muestra el lote interno, el lote del proveedor, el material (código y nombre), los ${unit} disponibles con barra visual, la fecha de recepción y el estado de calidad.`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: `#${idPrefix}-row-actions`,
      popover: {
        title: `Acciones por ${lotWord}`,
        description: `El ícono de reloj abre el historial de movimientos del ${lotWord}. El ícono de frasco permite crear una solicitud de material preseleccionando ese ${material === 'tintas' ? 'tinta' : 'papel'}. El ícono de apagado deshabilita el ${lotWord} (solo administradores y encargados de almacén).`,
        side: 'left',
        align: 'start',
      },
    },
    {
      popover: {
        title: 'Indicador FIFO',
        description: `El badge naranja "FIFO" marca el ${lotWord} más antiguo con stock disponible dentro de cada catálogo. Es el ${lotWord} que debe consumirse primero para mantener la rotación correcta.`,
      },
    },
    {
      popover: {
        title: '¡Tour completado!',
        description: `Ya conoces el inventario de ${material}. Puedes reiniciar este tour en cualquier momento desde el botón Tutorial en la barra inferior.`,
      },
    },
  ]
}
