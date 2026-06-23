type Props = {
  number: string
  size?: string
}

// Cada capa de color se superpone a la negra (mix-blend-multiply simula tinta
// real); el desplazamiento entre capas lo anima el padre vía GSAP, scopeado
// a estas clases (.layer-cyan/.layer-magenta/.layer-yellow/.color-layer).
const LAYERS = [
  { cls: 'layer-cyan', color: '#00AEEF' },
  { cls: 'layer-magenta', color: '#EC008C' },
  { cls: 'layer-yellow', color: '#FFE600' },
] as const

export function CMYKNumber({ number, size = 'text-[120px] sm:text-[180px] md:text-[220px]' }: Props) {
  return (
    <div
      role="img"
      aria-label={number}
      className={`relative inline-block font-display font-black leading-none select-none ${size}`}
    >
      {LAYERS.map(({ cls, color }) => (
        <span
          key={cls}
          aria-hidden
          className={`${cls} color-layer absolute inset-0 mix-blend-multiply`}
          style={{ color }}
        >
          {number}
        </span>
      ))}
      <span aria-hidden className="relative text-[#1A1A1A]">
        {number}
      </span>
    </div>
  )
}
