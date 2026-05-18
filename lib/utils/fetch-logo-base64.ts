// Fetches a logo URL and converts it to a base64 data URI for use in @react-pdf/renderer,
// which cannot load external URLs directly.
export async function fetchLogoAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const mime   = res.headers.get('content-type') ?? 'image/png'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}
