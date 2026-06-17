/* gota CMYK — extraída del landing original, sin cambios visuales */
export function CMYKDrop({ className = 'h-[75vh] w-auto' }: { className?: string }) {
  const pw = 38
  const dw = pw * Math.SQRT2
  const periodY = 4 * dw

  const colors = ['#00AEEF', '#EC008C', '#FFE600', '#1A1A1A']

  const yTop = -(periodY + 20)
  const yBottom = 260 + periodY + 20
  const shiftTop = 260 - yTop
  const shiftBottom = 260 - yBottom

  const polys: { color: string; points: string }[] = []
  let ci = 0
  for (let x0 = -500; x0 < 700; x0 += dw) {
    polys.push({
      color: colors[ci % 4],
      points: [
        `${x0 + shiftBottom},${yBottom}`,
        `${x0 + dw + shiftBottom},${yBottom}`,
        `${x0 + dw + shiftTop},${yTop}`,
        `${x0 + shiftTop},${yTop}`,
      ].join(' '),
    })
    ci++
  }

  const dropPath =
    'M100,10 C80,105 30,125 30,190 C30,228 65,250 100,250 C135,250 170,228 170,190 C170,125 120,105 100,10 Z'

  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))' }}
    >
      <defs>
        <clipPath id="cmyk-drop-clip">
          <path d={dropPath} />
        </clipPath>
        <filter id="drop-inset-shadow" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feFlood floodColor="black" floodOpacity="1" result="flood" />
          <feComposite in="flood" in2="SourceAlpha" operator="out" result="outside" />
          <feGaussianBlur in="outside" stdDeviation="7" result="blurred" />
          <feOffset in="blurred" dx="-6" dy="-9" result="shifted" />
          <feComposite in="shifted" in2="SourceAlpha" operator="in" result="shadow" />
          <feComponentTransfer in="shadow">
            <feFuncA type="linear" slope="0.88" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g clipPath="url(#cmyk-drop-clip)">
        <g>
          {polys.map(({ color, points }, i) => (
            <polygon key={i} fill={color} points={points} />
          ))}
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to={`0 ${periodY}`}
            dur="5s"
            repeatCount="indefinite"
          />
        </g>
        <path d={dropPath} fill="black" filter="url(#drop-inset-shadow)" />
      </g>
      <path d={dropPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
    </svg>
  )
}
