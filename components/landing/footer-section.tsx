import { CERTIFICATIONS } from '@/lib/landing/data'

export function FooterSection() {
  return (
    <footer className="bg-[#1A1A1A] px-8 py-12 text-[#F5F2EA] md:px-16">
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#F5F2EA]/10 pb-8 md:flex-row">
        <div>
          <p className="font-heading text-base font-bold tracking-tighter">INTERNATIONAL LABEL</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">
            Materiales de Empaque · México
          </p>
        </div>
        <div className="flex items-center gap-6">
          {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map(social => (
            <a
              key={social}
              href="#"
              className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 transition-colors hover:text-[#F5F2EA]"
            >
              {social}
            </a>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-3">
          {CERTIFICATIONS.map(cert => (
            <span
              key={cert}
              className="border border-[#F5F2EA]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40"
            >
              {cert}
            </span>
          ))}
        </div>
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/25">
          © {new Date().getFullYear()} International Label
        </p>
      </div>
    </footer>
  )
}
