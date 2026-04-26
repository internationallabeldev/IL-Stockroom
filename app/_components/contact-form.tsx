'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 border border-[#1A1A1A]/15">
        <CheckCircle className="size-8 text-[#008dc2]" />
        <div className="text-center">
          <p className="font-heading text-xl font-medium">Mensaje enviado</p>
          <p className="text-sm text-[#5f5e59] mt-1">Nos pondremos en contacto pronto.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'first', label: 'Nombre',   placeholder: 'Juan' },
          { id: 'last',  label: 'Apellido', placeholder: 'García' },
        ].map(({ id, label, placeholder }) => (
          <div key={id} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
              {label}
            </label>
            <input
              id={id}
              type="text"
              placeholder={placeholder}
              required
              className="h-10 border border-[#1A1A1A]/20 bg-transparent px-3 text-sm outline-none transition-colors focus:border-[#1A1A1A]/50 placeholder:text-[#1A1A1A]/30"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Correo electrónico
        </label>
        <input
          id="contact-email"
          type="email"
          placeholder="tu@empresa.com"
          required
          className="h-10 border border-[#1A1A1A]/20 bg-transparent px-3 text-sm outline-none transition-colors focus:border-[#1A1A1A]/50 placeholder:text-[#1A1A1A]/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Mensaje
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Cuéntanos sobre tu proyecto..."
          required
          className="border border-[#1A1A1A]/20 bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#1A1A1A]/50 placeholder:text-[#1A1A1A]/30 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 items-center justify-center gap-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="size-3.5 animate-spin" />Enviando…</>
        ) : (
          'Enviar mensaje'
        )}
      </button>
    </form>
  )
}
