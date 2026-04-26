'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ContactForm } from './contact-form'

/* ─── constants ─────────────────────────────────────── */
const E = [0.16, 1, 0.3, 1] as const   // snappy ease-out

const HEADLINE_LINES = ['EXPERIENCIA', 'Y CALIDAD', 'CON LA MEJOR']

const products = [
  { num: '01', name: 'Etiquetas',           desc: 'Etiquetas de alta precisión para todo tipo de envase y empaque industrial o comercial.' },
  { num: '02', name: 'Booklet Label',        desc: 'Etiquetas tipo booklet con múltiples páginas para información técnica y regulatoria extensa.' },
  { num: '03', name: 'Plegadizo',            desc: 'Cajas plegadizas con diseño estructural y acabados que comunican calidad en el punto de venta.' },
  { num: '04', name: 'Manga Termoencogible', desc: 'Mangas de contracción térmica de cobertura total para branding de 360° sobre el envase.' },
]

const specialties = [
  { name: 'Hot Stamping', desc: 'Estampado en caliente para acabados metálicos de lujo sobre cualquier sustrato.' },
  { name: 'Cold Foil',    desc: 'Aplicación de foil en frío con resolución de imagen de alta definición.' },
  { name: 'Embossing',    desc: 'Relieve y grabado en bajo o alto relieve para tactilidad y distinción visual.' },
  { name: 'Laminado',     desc: 'Laminación brillante, mate o soft-touch que protege e intensifica los colores.' },
]

const partners = ['Gallus', 'Siegwerk Group', 'SGS — GMI Certified']

const certifications = ['ISO 9001', 'PROFEPA — Industria Limpia', 'GMI Certified Printer']

const navLinks = [
  { href: '#nosotros',       label: 'Nosotros' },
  { href: '#servicios',      label: 'Servicios' },
  { href: '#especialidades', label: 'Tecnología' },
  { href: '#contacto',       label: 'Contacto' },
]

/* ─── shared variants ───────────────────────────────── */
const fadeUp = {
  hidden:   { opacity: 0, y: 28 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.7, ease: E } },
}

const fadeIn = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { duration: 0.7, ease: E } },
}

const stagger = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1 } },
}

const staggerFast = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.07 } },
}

const heroLine = {
  hidden:   { y: 80 },
  visible:  (i: number) => ({
    y: 0,
    transition: { duration: 0.9, ease: E, delay: 0.2 + i * 0.12 },
  }),
}

const vp = { once: true, margin: '-80px' } as const

/* ─── component ─────────────────────────────────────── */
export function LandingContent() {
  return (
    <div className="bg-[#F5F2EA] text-[#1A1A1A]">

      {/* ── NAV ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: E }}
        className="fixed top-0 z-50 w-full h-16 bg-[#F5F2EA] border-b border-[#1A1A1A]/15 flex items-center justify-between px-8 md:px-16"
      >
        <span className="font-heading font-bold text-base tracking-tighter select-none">
          INTERNATIONAL LABEL
        </span>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors duration-100"
            >
              {label}
            </a>
          ))}
        </nav>
        <Link
          href="/login"
          className="hidden md:flex items-center px-4 py-2 border border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-[#F5F2EA] transition-colors duration-100"
        >
          Acceso al sistema
        </Link>
      </motion.header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] text-[#F5F2EA] min-h-screen flex flex-col justify-between pt-16 px-8 md:px-16 pb-12">
        <div className="flex-1 flex items-center py-16">
          <div className="max-w-5xl">

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 mb-10"
            >
              Empresa 100% Mexicana — Materiales de Empaque
            </motion.p>

            {/* Staggered line-by-line headline reveal */}
            <h1 className="font-heading text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.92] mb-12">
              {HEADLINE_LINES.map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.div custom={i} initial="hidden" animate="visible" variants={heroLine}>
                    {line}
                  </motion.div>
                </div>
              ))}
              <div className="overflow-hidden">
                <motion.div custom={3} initial="hidden" animate="visible" variants={heroLine}>
                  <span className="text-[#008dc2]">TECNOLOGÍA</span>
                </motion.div>
              </div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: E, delay: 0.82 }}
              className="text-base text-[#F5F2EA]/50 max-w-xl mb-10 leading-relaxed"
            >
              Fabricamos materiales de empaque con tecnología de vanguardia
              para ser parte integral del proceso productivo de nuestros clientes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: E, delay: 1.02 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="#contacto"
                className="px-7 py-3 bg-[#F5F2EA] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                Platícanos tu proyecto
              </a>
              <a
                href="#servicios"
                className="px-7 py-3 border border-[#F5F2EA]/25 text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:border-[#F5F2EA]/60 transition-colors"
              >
                Ver servicios →
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="flex flex-wrap justify-between items-end border-t border-[#F5F2EA]/10 pt-6 gap-6"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerFast}
            transition={{ delayChildren: 1.3 }}
            className="flex gap-10"
          >
            {[['+20', 'Años de experiencia'], ['ISO', '9001 Certificados'], ['GMI', 'Certified Printer']].map(([val, label]) => (
              <motion.div key={val} variants={fadeUp}>
                <p className="font-heading text-2xl font-bold text-[#008dc2]">{val}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20">
            Guadalajara, México
          </p>
        </motion.div>
      </section>

      {/* ── NOSOTROS ─────────────────────────────────────── */}
      <section id="nosotros" className="px-8 md:px-16 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="mb-12"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-3">
            01 — Nosotros
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl font-bold tracking-tight">
            ¿Quiénes Somos?
          </motion.h2>
        </motion.div>

        <motion.p
          initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
          className="text-lg text-[#5f5e59] max-w-2xl mb-14 leading-relaxed"
        >
          Somos una empresa 100% mexicana con la más avanzada tecnología para ofrecer
          productos y servicios de alta calidad en materiales de empaque.
        </motion.p>

        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 border border-[#1A1A1A]/15"
        >
          {[
            { label: 'Misión', text: 'Ser parte integral del proceso productivo de nuestros clientes, fabricando materiales de empaque con la más alta calidad y tecnología de vanguardia.' },
            { label: 'Visión', text: 'Ser empresa líder en el mercado de materiales de empaque, enfocados en el desarrollo de nuevas tecnologías y alineados a las necesidades de nuestros clientes y valores.' },
            { label: 'Valores', text: 'Responsabilidad Social Ambiental. Calidad como una forma de vida. Servicio al cliente orientado a la excelencia y la confianza.' },
          ].map(({ label, text }, i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className={`p-8 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#1A1A1A]/15' : ''}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#008dc2] mb-5">{label}</p>
              <p className="text-sm leading-relaxed text-[#5f5e59]">{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── SERVICIOS ────────────────────────────────────── */}
      <section id="servicios" className="bg-[#1A1A1A] text-[#F5F2EA] px-8 md:px-16 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="mb-12"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 mb-3">
            02 — Servicios
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl font-bold tracking-tight">
            Nuestros Productos
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 border border-[#F5F2EA]/10"
        >
          {products.map(({ num, name, desc }, i) => (
            <motion.div
              key={name}
              variants={fadeUp}
              whileHover={{ backgroundColor: 'rgba(245,242,234,0.06)', transition: { duration: 0.2 } }}
              className={`p-8 group cursor-default
                ${i % 2 === 0 ? 'md:border-r border-[#F5F2EA]/10' : ''}
                ${i < 2 ? 'border-b border-[#F5F2EA]/10' : ''}`}
            >
              <p className="font-heading text-5xl font-bold text-[#F5F2EA]/[0.06] group-hover:text-[#008dc2]/20 transition-colors mb-4 select-none">
                {num}
              </p>
              <h3 className="font-heading text-2xl font-medium mb-3">{name}</h3>
              <p className="text-sm text-[#F5F2EA]/45 leading-relaxed">{desc}</p>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-[#008dc2] opacity-0 group-hover:opacity-100 transition-opacity">
                Más información →
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── ESPECIALIDADES ───────────────────────────────── */}
      <section id="especialidades" className="px-8 md:px-16 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="mb-12"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-3">
            03 — Tecnología
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl font-bold tracking-tight">
            Especialidades y Acabados
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={staggerFast}
          className="grid grid-cols-2 md:grid-cols-4 border border-[#1A1A1A]/15"
        >
          {specialties.map(({ name, desc }, i) => (
            <motion.div
              key={name}
              variants={fadeUp}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              className={`p-6 hover:bg-[#E5E1D8] transition-colors ${i < 3 ? 'border-r border-[#1A1A1A]/15' : ''}`}
            >
              <div className="size-8 border border-[#1A1A1A]/20 flex items-center justify-center mb-5">
                <span className="text-[10px] font-bold text-[#008dc2]">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-heading text-lg font-medium mb-2">{name}</h3>
              <p className="text-xs text-[#5f5e59] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── SOCIOS ───────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] text-[#F5F2EA] px-8 md:px-16 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="mb-12"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 mb-3">
            04 — Socios
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl font-bold tracking-tight">
            Socios Comerciales
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={staggerFast}
          className="flex flex-wrap border border-[#F5F2EA]/10"
        >
          {partners.map((name, i) => (
            <motion.div
              key={name}
              variants={fadeIn}
              whileHover={{ color: 'rgba(245,242,234,0.85)', transition: { duration: 0.2 } }}
              className={`flex-1 min-w-48 px-10 py-12 flex items-center justify-center cursor-default
                ${i < partners.length - 1 ? 'border-r border-[#F5F2EA]/10' : ''}`}
            >
              <span className="font-heading text-xl font-bold text-[#F5F2EA]/40 tracking-tight text-center">
                {name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CONTACTO ─────────────────────────────────────── */}
      <section id="contacto" className="px-8 md:px-16 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
          className="mb-12"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-3">
            05 — Contacto
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl font-bold tracking-tight">
            Platícanos tu proyecto
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left — from left */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={vp}
            transition={{ duration: 0.7, ease: E }}
          >
            <p className="text-base text-[#5f5e59] leading-relaxed mb-10">
              Cuéntanos sobre tu proyecto y nuestro equipo de ventas te contactará
              a la brevedad para asesorarte y preparar una cotización.
            </p>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">Email</p>
                <a
                  href="mailto:ventas@internationallabel.com.mx"
                  className="font-heading text-base font-medium text-[#008dc2] hover:underline underline-offset-4"
                >
                  ventas@internationallabel.com.mx
                </a>
              </div>
              <div className="border-t border-[#1A1A1A]/10 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-4">Certificaciones</p>
                <div className="flex flex-col gap-2">
                  {certifications.map(cert => (
                    <span key={cert} className="text-xs font-medium text-[#1A1A1A]/60 flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-[#008dc2] inline-block shrink-0" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — from right */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={vp}
            transition={{ duration: 0.7, ease: E, delay: 0.1 }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <motion.footer
        initial="hidden" whileInView="visible" viewport={vp} variants={fadeIn}
        className="bg-[#1A1A1A] text-[#F5F2EA] px-8 md:px-16 py-12"
      >
        <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-[#F5F2EA]/10 pb-8 mb-8">
          <div>
            <p className="font-heading font-bold text-base tracking-tighter">INTERNATIONAL LABEL</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 mt-1">
              Materiales de Empaque · México
            </p>
          </div>
          <div className="flex gap-6 items-center">
            {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map(social => (
              <a
                key={social}
                href="#"
                className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 hover:text-[#F5F2EA] transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            {certifications.map(cert => (
              <span
                key={cert}
                className="px-3 py-1.5 border border-[#F5F2EA]/15 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40"
              >
                {cert}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/25 shrink-0">
            © {new Date().getFullYear()} International Label
          </p>
        </div>
      </motion.footer>

    </div>
  )
}
