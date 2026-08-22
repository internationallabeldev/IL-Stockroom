'use client'

import { Document, Page, Text, View, StyleSheet, Svg, Path, Image as PdfImage } from '@react-pdf/renderer'
import type { PurchaseOrderDetail } from '@/actions/purchase-orders.actions'
import type { AppSettings } from '@/types/app-settings.types'

// ─── Fallback constants (used when settings are not provided) ─────────────────
const DEFAULT_COMPANY_NAME    = 'INTERNATIONAL LABEL S.A. DE C.V.'
const DEFAULT_COMPANY_ADDRESS = 'GALEANA NO. 45 COL. ACAPANTZINGO'
const DEFAULT_COMPANY_CITY    = 'CUERNAVACA, MORELOS'
const DEFAULT_COMPANY_ZIP     = 'C.P. 62440'
const DEFAULT_COMPANY_PHONE   = 'TEL: (777) 312-5897'
const DEFAULT_FISCAL_ADDRESS  = 'GALEANA NO. 45 COL. ACAPANTZINGO, MOR. C.P. 62440 CUERNAVACA, MORELOS'
const DEFAULT_RFC             = 'ILA000101XXX'
const DEFAULT_BODEGA          = 'GALEANA NO. 45 COL. ACAPANTZINGO CUERNAVACA, MORELOS'
const DEFAULT_FOOTER_LEGAL    = 'FAVOR DE FACTURAR A: INTERNATIONAL LABEL S.A. DE C.V.'
const DEFAULT_RECEPTION_NOTES = 'RECEPCIÓN DE MATERIALES LUNES A VIERNES DE 08:30 A 16:30 HRS.\nNO SE RECIBIRÁN MATERIALES SI ESTOS NO VIENEN ACOMPAÑADOS DE FACTURA QUE INDIQUE N° DE ORDEN DE COMPRA, TIPO DE CAMBIO (SOLO PARA FACTURAS EN PESOS), ASÍ COMO CERTIFICADOS DE CALIDAD.'
const DEFAULT_REVISION        = 'Rev: 3'

// ─── Logo SVG paths ───────────────────────────────────────────────────────────
const IL_PATH_RING = 'M213.923 2388.74C282.581 3417.81 1113.34 4238.28 2146.76 4290.73V4501.45C997.068 4448.59 72.2259 3534.1 3.01465 2388.74H213.923ZM4500.99 2388.74C4431.77 3534.1 3506.93 4448.59 2357.24 4501.45V4290.73C3390.66 4238.28 4221.42 3417.81 4290.08 2388.74H4500.99ZM2357.24 0C3528.79 53.8645 4466.85 1002.43 4504 2178.27H4293.4C4256.46 1118.69 3412.51 264.279 2357.24 210.724V0ZM2146.76 210.724C1091.49 264.279 247.537 1118.69 210.596 2178.27H0C37.1487 1002.43 975.215 53.8654 2146.76 0V210.724Z'
const IL_PATH_INNER = 'M1004.68 1159L1060.43 1173.11L1116.24 1220.18L1176.77 1297.96L1207.02 1349.78L1218.64 1385.05L1223.29 1479.31L1218.63 1609.02L1148.72 2444.07L1074.15 3262.62V3262.63L1074.15 3262.64L1067.16 3397.1L1067.16 3397.13L1067.16 3397.16L1071.82 3458.5L1071.83 3458.6L1071.88 3458.7L1113.83 3536.54L1113.86 3536.6L1113.91 3536.65L1162.85 3586.19L1162.91 3586.25L1162.99 3586.29L1260.86 3633.47L1260.9 3633.49L1260.95 3633.5L1330.86 3652.37L1330.92 3652.39H1391.61L1391.65 3652.39L1496.51 3638.23L1496.58 3638.22L1496.64 3638.2L3025.34 3001.29L3097.58 2972.98L3097.58 2972.98L3197.79 2932.88L3256.03 2911.66L3328.18 2885.74H3430.6L3500.36 2897.51L3560.81 2937.52L3616.64 2998.75L3663.19 3095.34L3677.15 3175.43V3281.49L3663.18 3359.27L3646.89 3411.11L3616.61 3486.56L3584 3559.64L3557.69 3596.27C3222.92 3936.53 2761.87 4146.75 2252.86 4146.75C1230.02 4146.75 400.833 3297.87 400.833 2250.73C400.833 1932.81 477.263 1633.17 612.337 1370.01L622.953 1354.61L667.192 1307.47L727.751 1250.88L788.266 1206.12L858.108 1177.84L916.267 1159H1004.68ZM2252.86 354.703C3275.71 354.703 4104.89 1203.58 4104.89 2250.73C4104.89 2258.42 4104.85 2266.11 4104.76 2273.79L4099.94 2234.11L4099.94 2234.1L4099.94 2234.08L4083.62 2144.45L4083.62 2144.43L4083.62 2144.42L4069.64 2087.8L4069.63 2087.78L4069.62 2087.76L4039.33 2000.48L4039.32 2000.45L4039.31 2000.43L4011.34 1941.45L4011.31 1941.38L4011.25 1941.32L3966.97 1896.5L3966.92 1896.44L3966.85 1896.41L3908.59 1865.74L3908.52 1865.7L3908.44 1865.69L3850.18 1856.25L3850.1 1856.24L3850.01 1856.25L3780.1 1868.05L3780.04 1868.06L3779.99 1868.08L2871.15 2269.1L2540.29 2410.61L2437.85 2431.83H2351.76L2282.02 2410.65L2223.9 2361.23L2193.69 2311.83L2182.07 2257.7L2179.74 2196.41V2135.15L2193.71 2069.15L2193.71 2069.14L2224 1908.74L2223.51 1908.64L2224.01 1908.74V1908.73L2398.78 929.776L2398.79 929.732V847.077L2398.78 847.029L2382.47 764.467L2382.46 764.44L2382.46 764.415L2324.12 660.471L2324.04 660.359L2323.91 660.308L2288.95 646.154L2288.94 646.15L2251.66 631.996L2251.57 631.964H2162.88L2162.83 631.974L2090.59 646.127L2090.57 646.131L1971.72 674.438L1838.89 705.104L1838.88 705.106L1664.11 749.926L1664.1 749.929L1664.08 749.932L1524.28 792.387L1407.77 820.692L1407.77 820.694L1288.93 851.357L1146.79 884.38L1013.96 912.688L1013.93 912.692L1013.91 912.7L907.984 947.164C1245.53 582.299 1723.24 354.703 2252.86 354.703Z'
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    padding: 6,
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

  // Order notes
  notesBox: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: '4pt 6pt',
    marginBottom: 5,
  },
  notesLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#5f5e59',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 8,
    lineHeight: 1.4,
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
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function dateParts(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return { day: day ?? '—', month: m ?? '—', year: y ?? '—' }
}

// ─── Component ────────────────────────────────────────────────────────────────

type OrderPDFProps = {
  order:    PurchaseOrderDetail
  settings?: AppSettings | null
  logoBase64?: string | null
}

export function OrderPDF({ order, settings, logoBase64 }: OrderPDFProps) {
  const isInk    = order.material_type === 'INK'

  const companyName    = settings?.company.name?.toUpperCase()             ?? DEFAULT_COMPANY_NAME
  const companyAddress = settings?.company.address?.toUpperCase()          ?? DEFAULT_COMPANY_ADDRESS
  const companyPhone   = settings?.company.phone
    ? `TEL: ${settings.company.phone}`
    : DEFAULT_COMPANY_PHONE
  const rfc            = settings?.company.rfc                             || DEFAULT_RFC
  const fiscalAddress  = settings?.company.fiscal_address?.toUpperCase()   || DEFAULT_FISCAL_ADDRESS
  const bodega         = settings?.company.warehouse_address?.toUpperCase() || DEFAULT_BODEGA
  const footerLegal    = settings?.pdf.footer_legal                        ?? DEFAULT_FOOTER_LEGAL
  const receptionNotes = settings?.pdf.reception_notes                     ?? DEFAULT_RECEPTION_NOTES
  const revision       = settings?.pdf.revision                            ?? DEFAULT_REVISION
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
            {logoBase64 ? (
              <PdfImage src={logoBase64} style={{ width: 44, height: 44, objectFit: 'contain' }} />
            ) : (
              <Svg viewBox="0 0 4504 4502" width={44} height={44}>
                <Path d={IL_PATH_RING} fill="#1A1A1A" />
                <Path d={IL_PATH_INNER} fill="#1A1A1A" />
              </Svg>
            )}
          </View>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>{companyName}</Text>
            <Text style={s.companyInfo}>{companyAddress}</Text>
            {!settings && (
              <Text style={s.companyInfo}>{DEFAULT_COMPANY_CITY} · {DEFAULT_COMPANY_ZIP}</Text>
            )}
            <Text style={s.companyInfo}>{companyPhone}</Text>
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
              {provider?.legal_name && provider.legal_name !== provider.name && (
                <Text style={s.cellValue}>{provider.legal_name}</Text>
              )}
              {/* El RFC es lo que permite casar esta OC con el CFDI que llegue. */}
              {provider?.rfc && <Text style={s.cellValue}>R.F.C.: {provider.rfc}</Text>}
              {provider?.customer_number && (
                <Text style={s.cellValue}>Nº de cliente: {provider.customer_number}</Text>
              )}
            </View>
            <View style={[s.dataCellLast, { flex: 2 }]}>
              <Text style={s.cellLabel}>Dirección del proveedor</Text>
              <Text style={s.cellValue}>{provider?.address ?? '—'}</Text>
            </View>
          </View>

          {/* Row 2 — Date / area / OC# */}
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
            <View style={s.ocCell}>
              <Text style={s.ocCellLabel}>Orden de compra</Text>
              <Text style={s.ocCellValue}>#{order.order_number}</Text>
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

        {/* ORDER NOTES */}
        {order.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notas</Text>
            <Text style={s.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerBilling}>
            {footerLegal} · DOMICILIO FISCAL: {fiscalAddress} · R.F.C.: {rfc} · BODEGA: {bodega}
          </Text>
          <View style={s.separator} />
          <Text style={s.footerRules}>{receptionNotes}</Text>
          <Text style={s.revText}>{revision}</Text>
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
