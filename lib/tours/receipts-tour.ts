import type { DriveStep } from 'driver.js'

export const receiptsTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Módulo de Recepciones',
      description:
        'Bienvenido al módulo de recepciones. Aquí gestionas la entrada de material al almacén: evalúas la calidad de cada lote recibido y consultas el historial completo de recepciones.',
    },
  },
  {
    element: '#receipts-search',
    popover: {
      title: 'Buscar recepciones',
      description:
        'Filtra por lote interno, lote proveedor, nombre del material, número de OC o nombre del proveedor. El resultado se actualiza en tiempo real.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#receipts-tabs',
    popover: {
      title: 'Pestañas de navegación',
      description:
        '"Pendientes" muestra los lotes que aún no tienen evaluación de calidad. "Historial" lista todas las recepciones ya registradas. El badge amarillo indica cuántos lotes esperan evaluación.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#receipts-bulk-actions',
    popover: {
      title: 'Evaluación masiva',
      description:
        'Selecciona varios lotes con los checkboxes de la tabla y luego activa un estado aquí (Aprobado, Rechazado o Condicional). Pulsa "Aplicar" para guardar la calidad en todos los seleccionados de una vez.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#receipts-pending-table',
    popover: {
      title: 'Tabla de pendientes',
      description:
        'Cada fila es un lote recibido sin evaluar. Las columnas muestran lote interno, material, número de OC, fecha de recepción, días transcurridos (en rojo si supera 3 días) y la cantidad recibida.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#receipts-inline-evaluator',
    popover: {
      title: 'Evaluador de calidad por fila',
      description:
        'Desde aquí puedes asignar la calidad directamente en la fila: selecciona Aprobado, Rechazado o Condicional. Si apruebas, puedes adjuntar el certificado (PDF o imagen). Agrega notas opcionales y pulsa "Guardar". Si la fila está seleccionada junto con otras, el guardado se aplica a todas.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#receipts-quality-filter',
    popover: {
      title: 'Filtro de calidad (Historial)',
      description:
        'En la pestaña Historial puedes filtrar por estado de calidad: Todos, Pendiente, Aprobado, Rechazado o Condicional. Combínalo con la búsqueda para localizar recepciones específicas.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#receipts-page-size',
    popover: {
      title: 'Resultados por página',
      description:
        'Controla cuántos lotes se muestran por página. Funciona tanto en la vista de Pendientes como en Historial.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    popover: {
      title: 'Registrar una recepción',
      description:
        'Para registrar material nuevo ve al módulo de Órdenes de compra, localiza la orden (estado Pendiente o Parcial) y haz clic en "Recibir". Esto abre el formulario de recepción múltiple.',
    },
  },
  {
    popover: {
      title: 'Formulario: datos comunes',
      description:
        'Al abrir el formulario de recepción, los primeros campos son compartidos por todos los artículos del lote: fecha de recepción, número de remisión o factura, y el estado inicial de calidad (Pendiente, Aprobado o Rechazado). Si seleccionas Aprobado, puedes adjuntar el archivo del certificado en ese mismo momento.',
    },
  },
  {
    popover: {
      title: 'Formulario: generador de lotes internos',
      description:
        'Escribe un prefijo (ej. IL-TINT-2025) y pulsa "Generar". El sistema asigna automáticamente lotes secuenciales a todos los artículos activos: IL-TINT-2025-001, IL-TINT-2025-002, etc. Ahorra tiempo cuando recibes múltiples artículos de la misma orden.',
    },
  },
  {
    popover: {
      title: 'Formulario: sincronización de lote proveedor',
      description:
        'Selecciona varias filas con el checkbox (columna azul) antes de escribir el lote del proveedor. Al tipear en cualquiera de las filas seleccionadas, el mismo valor se copia automáticamente a todas las demás seleccionadas.',
    },
  },
  {
    popover: {
      title: 'Formulario: artículos que no llegaron',
      description:
        'Cada artículo de la orden tiene un switch "Llegó" activado por defecto. Desactívalo en los artículos que no llegaron en esta entrega — quedarán excluidos del registro y la orden permanecerá en estado Parcial para recepciones futuras.',
    },
  },
  {
    popover: {
      title: '¡Tour completado!',
      description:
        'Ya conoces el módulo de recepciones. Puedes reiniciar este tour en cualquier momento desde el botón Tutorial en la barra inferior.',
    },
  },
]
