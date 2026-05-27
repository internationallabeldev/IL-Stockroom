import type { DriveStep } from 'driver.js'

type RequisitionsTourOpts = {
  /** 'tinta' | 'papel' */
  material: string
  /** 'kg' | 'm²' */
  unit: string
}

export function createRequisitionsTourSteps({ material, unit }: RequisitionsTourOpts): DriveStep[] {
  return [
    {
      popover: {
        title: `Requisiciones de ${material}`,
        description: `Bienvenido al módulo de requisiciones de ${material}. Aquí puedes consultar, gestionar y crear solicitudes de material vinculadas a órdenes de producción.`,
      },
    },
    {
      element: '#req-stats',
      popover: {
        title: 'KPIs en tiempo real',
        description: `Indicadores clave: requisiciones pendientes de autorización, en proceso de surtido, creadas hoy, críticas (más de 24 h sin atender) y el tiempo promedio de surtido en horas.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#req-search',
      popover: {
        title: 'Buscar requisiciones',
        description: 'Filtra por número de requisición (#), orden de producción o nombre del solicitante. El resultado se actualiza en tiempo real al escribir.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#req-tabs',
      popover: {
        title: 'Filtrar por estado',
        description: '"Pendientes" muestra las que esperan autorización. "En proceso" agrupa las aprobadas y parcialmente surtidas. "Cerradas" incluye las completadas, rechazadas y canceladas. "Todas" no aplica ningún filtro de estado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#req-page-size',
      popover: {
        title: 'Resultados por página',
        description: 'Controla cuántas requisiciones se muestran por página. Escribe el número deseado y se aplica de inmediato.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#req-new-btn',
      popover: {
        title: 'Nueva requisición',
        description: `Abre el formulario para solicitar ${material}. Ingresa la orden de producción, selecciona el material y la cantidad requerida en ${unit}.`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#req-table',
      popover: {
        title: 'Tabla de requisiciones',
        description: `Cada fila es una requisición. Muestra el número interno, la orden de producción, el solicitante, la fecha y el estado con su barra de progreso de flujo. Las filas con borde rojo llevan más de 24 h pendientes.`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#req-row',
      popover: {
        title: 'Detalle inline',
        description: `Haz clic en cualquier fila para expandirla. Verás el avance de cada ${material} con una barra de progreso (${unit} entregados / ${unit} solicitados). Usa "Ver completo →" para abrir el panel lateral con el historial de surtidos y las acciones disponibles.`,
        side: 'top',
        align: 'start',
      },
    },
    {
      popover: {
        title: '¡Tour completado!',
        description: `Ya conoces el módulo de requisiciones de ${material}. Puedes reiniciar este tour en cualquier momento desde el botón Tutorial en la barra inferior.`,
      },
    },
  ]
}
