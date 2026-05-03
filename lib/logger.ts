const RESET  = '\x1b[0m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const GRAY   = '\x1b[90m'

function ts() {
  return new Date().toISOString().slice(11, 23) // HH:MM:SS.mmm
}

function fmt(level: string, color: string, ctx: string, data?: unknown) {
  const extra = data !== undefined
    ? typeof data === 'string' ? ` ${data}` : ` ${JSON.stringify(data)}`
    : ''
  return `${GRAY}${ts()}${RESET} ${color}${level}${RESET} ${CYAN}[${ctx}]${RESET}${extra}`
}

export const logger = {
  info(ctx: string, data?: unknown)  { console.log(fmt('INFO ', CYAN,   ctx, data)) },
  warn(ctx: string, data?: unknown)  { console.warn(fmt('WARN ', YELLOW, ctx, data)) },
  error(ctx: string, data?: unknown) { console.error(fmt('ERROR', RED,   ctx, data)) },
}
