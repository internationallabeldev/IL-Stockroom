// Grid de rombos 20×20 casi invisible (stroke-opacity 0.06) que deriva
// lentamente en diagonal — ver .animate-pattern-drift en app/globals.css.
function diamondPoints(cx: number, cy: number, half: number) {
  return `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`
}

const CMYK = ['#00AEEF', '#EC008C', '#FFE600', '#6B6B6B'] as const

export function CmykPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -inset-10 animate-pattern-drift">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="cmyk-diamonds" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon points={diamondPoints(10, 10, 10)} fill="none" stroke={CMYK[0]} strokeWidth={0.5} strokeOpacity={0.06} />
              <polygon points={diamondPoints(30, 10, 10)} fill="none" stroke={CMYK[1]} strokeWidth={0.5} strokeOpacity={0.06} />
              <polygon points={diamondPoints(10, 30, 10)} fill="none" stroke={CMYK[2]} strokeWidth={0.5} strokeOpacity={0.06} />
              <polygon points={diamondPoints(30, 30, 10)} fill="none" stroke={CMYK[3]} strokeWidth={0.5} strokeOpacity={0.06} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cmyk-diamonds)" />
        </svg>
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.75) 100%)',
        }}
      />
    </div>
  )
}
