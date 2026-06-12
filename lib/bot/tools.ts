import type Groq from 'groq-sdk'

/** Tools the inventory bot may call. Read-only — every handler does only SELECT.
 *  Schemas mirror the real database (stock levels live on the *_catalog tables;
 *  supplies are `supply_items`; movements are split per material). */
export const botTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_ink_stock',
      description:
        'Consulta el stock actual de tintas. Puede filtrar por nombre/código o traer todas. ' +
        'Devuelve stock actual (kg), mínimo (kg), si está bajo el mínimo y el proveedor que la surte.',
      parameters: {
        type: 'object',
        properties: {
          ink_name: { type: 'string', description: 'Nombre o código de la tinta. Opcional.' },
          only_low_stock: { type: 'boolean', description: 'Si true, solo tintas bajo el mínimo.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_paper_stock',
      description:
        'Consulta el stock actual de papel (bobinas). Devuelve stock actual (m²), mínimo (m²), ' +
        'si está bajo el mínimo y el proveedor que lo surte.',
      parameters: {
        type: 'object',
        properties: {
          paper_name: { type: 'string', description: 'Nombre o código del papel. Opcional.' },
          only_low_stock: { type: 'boolean', description: 'Si true, solo papeles bajo el mínimo.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_supply_stock',
      description:
        'Consulta el stock de consumibles y suministros. Devuelve cantidad actual, mínima y unidad.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Nombre de la categoría. Opcional.' },
          only_critical: {
            type: 'boolean',
            description: 'Si true, solo suministros en o bajo su cantidad mínima.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_requisitions',
      description: 'Obtiene las requisiciones de producción pendientes de atender.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'PARTIAL'],
            description: 'Filtrar por status específico. Opcional.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_purchase_orders',
      description: 'Consulta las órdenes de compra y su estado.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'],
          },
          material_type: { type: 'string', enum: ['INK', 'PAPER'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock_alerts',
      description:
        'Obtiene todos los materiales (tintas, papel y suministros) que están bajo su nivel mínimo.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_movements',
      description:
        'Obtiene movimientos recientes de inventario (recepciones y salidas de tinta/papel, ' +
        'movimientos de suministros).',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Últimos N días. Default: 7.' },
          material_type: { type: 'string', enum: ['INK', 'PAPER', 'SUPPLY'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_providers',
      description: 'Consulta la lista de proveedores.',
      parameters: {
        type: 'object',
        properties: {
          provider_type: {
            type: 'string',
            enum: ['INK_SUPPLIER', 'PAPER_SUPPLIER', 'SUPPLY_SUPPLIER', 'BOTH'],
          },
        },
      },
    },
  },
]
