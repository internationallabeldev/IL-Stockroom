'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PurchaseOrderDetail } from '@/actions/purchase-orders.actions'

// ─── Company constants — update with actual values ────────────────────────────
const COMPANY_NAME    = 'INTERNATIONAL LABEL S.A. DE C.V.'
const COMPANY_ADDRESS = 'CARR. MONTERREY-SALTILLO KM 14.5'
const COMPANY_CITY    = 'PARQUE INDUSTRIAL SANTA CATARINA, N.L.'
const COMPANY_ZIP     = 'C.P. 66350'
const COMPANY_PHONE   = 'TEL: (81) XXXX-XXXX'
const FISCAL_ADDRESS  = 'CARR. MONTERREY-SALTILLO KM 14.5, PARQUE INDUSTRIAL SANTA CATARINA, SANTA CATARINA, N.L., C.P. 66350'
const RFC             = 'ILA000101XXX'
const BODEGA          = 'MISMO DOMICILIO FISCAL'
const MIN_ROWS        = 10

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    color: '#1A1A1A',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 8,
    marginBottom: 4,
  },
  logoBox: {
    width: 68,
    height: 52,
    backgroundColor: '#E5E1D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  logoInitials: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#1A1A1A',
  },
  companyBlock: { flex: 1 },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 2,
  },
  companyInfo: {
    fontSize: 7,
    color: '#5f5e59',
    lineHeight: 1.5,
  },
  ocLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'right',
  },

  // Atención row
  attentionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  attentionText: {
    fontSize: 7,
    color: '#5f5e59',
    fontFamily: 'Helvetica-Bold',
  },

  // Data table
  dataTable: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 5,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  dataRowLast: { flexDirection: 'row' },
  dataCell: {
    padding: '3pt 5pt',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  dataCellLast: { padding: '3pt 5pt' },
  cellLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#5f5e59',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1.5,
  },
  cellValue: { fontSize: 8 },
  cellValueBold: { fontFamily: 'Helvetica-Bold', fontSize: 8 },

  // Order number highlighted cell
  ocCell: {
    width: 80,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4pt 5pt',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  ocCellLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#E5E1D8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  ocCellValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    color: '#F5F2EA',
  },

  // Conditions bar
  condRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 5,
  },
  condCell: {
    flex: 1,
    padding: '3pt 5pt',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  condCellLast: { flex: 1, padding: '3pt 5pt' },

  // Items table
  itemsTable: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 5,
    flex: 1,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E1D8',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  itemsRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D5D0C8',
    minHeight: 18,
  },
  itemsRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D5D0C8',
    backgroundColor: '#FDFAF3',
    minHeight: 18,
  },
  colQty: {
    width: 72,
    padding: '3pt 5pt',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  colCode: {
    width: 80,
    padding: '3pt 5pt',
    borderRightWidth: 1,
    borderRightColor: '#1A1A1A',
  },
  colArticle: { flex: 1, padding: '3pt 5pt' },
  itemHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textTransform: 'uppercase',
  },
  itemText: { fontSize: 8 },
  itemPresentation: {
    fontSize: 6.5,
    color: '#5f5e59',
    marginTop: 0.5,
  },
  itemNotes: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 6.5,
    color: '#3a3a3a',
    marginTop: 1,
  },
  codeText: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 7,
    color: '#5f5e59',
  },

  // Footer
  footer: { marginTop: 4 },
  footerBilling: {
    fontSize: 6,
    color: '#3a3a3a',
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 1.5,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#9a9a90',
    marginVertical: 4,
  },
  footerRules: {
    fontSize: 6,
    color: '#5f5e59',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 3,
  },
  revText: { fontSize: 6, color: '#9a9a90' },

  // Signatures
  sigRow: { flexDirection: 'row', marginTop: 12 },
  sigCol: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  sigSpace: { height: 28 },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    width: '85%',
    marginBottom: 4,
  },
  sigTopLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sigSubLabel: {
    fontSize: 6,
    color: '#5f5e59',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 1,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function dateParts(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return { day: day ?? '—', month: m ?? '—', year: y ?? '—' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderPDF({ order }: { order: PurchaseOrderDetail }) {
  const isInk    = order.material_type === 'INK'
  const provider = order.providers
  const { day, month, year } = dateParts(order.request_date)

  const items = isInk
    ? order.ink_items.map(i => ({
        qty:          `${(i.total_kg_ordered ?? 0).toFixed(2)} KG`,
        code:         i.ink_catalog?.code ?? '',
        name:         i.ink_catalog?.name ?? '',
        presentation: `${i.units_ordered} uds × ${i.kg_per_unit} kg c/u`,
        notes:        i.item_notes ?? null,
      }))
    : order.paper_items.map(i => ({
        qty:          `${i.units_ordered} ROLLOS`,
        code:         i.paper_catalog?.code ?? '',
        name:         i.paper_catalog?.name ?? '',
        presentation: `${i.length_m_per_unit} m × ${i.width_m} m c/u`,
        notes:        i.item_notes ?? null,
      }))

  const rows = [...items]
  while (rows.length < MIN_ROWS) {
    rows.push({ qty: '', code: '', name: '', presentation: '', notes: null })
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Text style={s.logoInitials}>IL</Text>
          </View>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>{COMPANY_NAME}</Text>
            <Text style={s.companyInfo}>{COMPANY_ADDRESS}</Text>
            <Text style={s.companyInfo}>{COMPANY_CITY} · {COMPANY_ZIP}</Text>
            <Text style={s.companyInfo}>{COMPANY_PHONE}</Text>
          </View>
          <Text style={s.ocLabel}>ORDEN DE COMPRA</Text>
        </View>

        {/* ATENCIÓN */}
        {provider?.contact_person && (
          <View style={s.attentionRow}>
            <Text style={s.attentionText}>ATENCIÓN: {provider.contact_person}</Text>
          </View>
        )}

        {/* PROVIDER + DATE TABLE */}
        <View style={s.dataTable}>
          {/* Row 1 — Provider + address */}
          <View style={s.dataRow}>
            <View style={[s.dataCell, { flex: 2 }]}>
              <Text style={s.cellLabel}>Proveedor</Text>
              <Text style={s.cellValueBold}>{provider?.name ?? '—'}</Text>
            </View>
            <View style={[s.dataCellLast, { flex: 2 }]}>
              <Text style={s.cellLabel}>Dirección del proveedor</Text>
              <Text style={s.cellValue}>{provider?.address ?? '—'}</Text>
            </View>
          </View>

          {/* Row 2 — Date / area / shipment / OC# / delivery */}
          <View style={s.dataRowLast}>
            <View style={[s.dataCell, { width: 90 }]}>
              <Text style={s.cellLabel}>Fecha</Text>
              <Text style={s.cellValue}>
                DÍA: {day}  MES: {month}  AÑO: {year}
              </Text>
            </View>
            <View style={[s.dataCell, { flex: 1 }]}>
              <Text style={s.cellLabel}>Área que requiere</Text>
              <Text style={s.cellValue}>{isInk ? 'COMPRAS' : 'ALMACÉN'}</Text>
            </View>
            <View style={[s.dataCell, { flex: 1 }]}>
              <Text style={s.cellLabel}>Embarque</Text>
              <Text style={s.cellValue}>{order.shipment_method}</Text>
            </View>
            <View style={s.ocCell}>
              <Text style={s.ocCellLabel}>Orden de compra</Text>
              <Text style={s.ocCellValue}>#{order.order_number}</Text>
            </View>
            <View style={[s.dataCellLast, { flex: 1 }]}>
              <Text style={s.cellLabel}>Entregar en</Text>
              <Text style={s.cellValue}>{order.delivery_place}</Text>
            </View>
          </View>
        </View>

        {/* CONDITIONS */}
        <View style={s.condRow}>
          <View style={s.condCell}>
            <Text style={s.cellLabel}>Condiciones de pago</Text>
            <Text style={s.cellValue}>{order.payment_method}</Text>
          </View>
          <View style={s.condCell}>
            <Text style={s.cellLabel}>Fecha de entrega</Text>
            <Text style={s.cellValue}>{fmtDate(order.expected_delivery_date)}</Text>
          </View>
          <View style={s.condCell}>
            <Text style={s.cellLabel}>Embarque</Text>
            <Text style={s.cellValue}>{order.shipment_method}</Text>
          </View>
          <View style={s.condCellLast}>
            <Text style={s.cellLabel}>Entregar en</Text>
            <Text style={s.cellValue}>{order.delivery_place}</Text>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={s.itemsTable}>
          <View style={s.itemsHeaderRow}>
            <View style={s.colQty}>
              <Text style={s.itemHeaderText}>Cantidad</Text>
            </View>
            <View style={s.colCode}>
              <Text style={s.itemHeaderText}>Código</Text>
            </View>
            <View style={s.colArticle}>
              <Text style={s.itemHeaderText}>Artículo</Text>
            </View>
          </View>

          {rows.map((row, i) => (
            <View key={i} style={i % 2 === 0 ? s.itemsRow : s.itemsRowAlt}>
              <View style={s.colQty}>
                <Text style={s.itemText}>{row.qty}</Text>
              </View>
              <View style={s.colCode}>
                <Text style={s.codeText}>{row.code}</Text>
              </View>
              <View style={s.colArticle}>
                {row.name ? (
                  <>
                    <Text style={s.itemText}>
                      {row.name}
                    </Text>
                    {row.presentation ? (
                      <Text style={s.itemPresentation}>({row.presentation})</Text>
                    ) : null}
                    {row.notes ? (
                      <Text style={s.itemNotes}>{row.notes}</Text>
                    ) : null}
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerBilling}>
            FAVOR DE FACTURAR A: {COMPANY_NAME} · DOMICILIO FISCAL: {FISCAL_ADDRESS} · R.F.C.: {RFC} · BODEGA: {BODEGA}
          </Text>
          <View style={s.separator} />
          <Text style={s.footerRules}>
            RECEPCIÓN DE MATERIALES LUNES A VIERNES DE 08:30 A 16:30 HRS.{'\n'}
            NO SE RECIBIRÁN MATERIALES SI ESTOS NO VIENEN ACOMPAÑADOS DE FACTURA QUE INDIQUE N° DE ORDEN DE COMPRA,
            TIPO DE CAMBIO (SOLO PARA FACTURAS EN PESOS), ASÍ COMO CERTIFICADOS DE CALIDAD.
          </Text>
          <Text style={s.revText}>Rev: 3</Text>
        </View>

        {/* SIGNATURES */}
        <View style={s.sigRow}>
          {[
            { top: 'ELABORÓ',  sub: 'COMPRAS' },
            { top: 'SOLICITÓ', sub: isInk ? 'TINTAS' : 'PAPEL' },
            { top: 'AUTORIZÓ', sub: 'OPERACIONES' },
            { top: 'FINANZAS', sub: '' },
          ].map((sig, i) => (
            <View key={i} style={s.sigCol}>
              <View style={s.sigSpace} />
              <View style={s.sigLine} />
              <Text style={s.sigTopLabel}>{sig.top}</Text>
              {sig.sub ? <Text style={s.sigSubLabel}>{sig.sub}</Text> : null}
            </View>
          ))}
        </View>

      </Page>
    </Document>
  )
}
