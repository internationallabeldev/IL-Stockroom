// Shared visual for every primary auth action (submit button or plain link
// styled as one, e.g. the "Ir al inicio de sesión" link on the error page).
export const AUTH_BUTTON_CLASS =
  'flex h-[52px] w-full items-center justify-center gap-2 rounded-none bg-[#F5F2EA] text-[11px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] transition-colors duration-150 hover:bg-transparent hover:text-[#F5F2EA] border border-transparent hover:border-[#F5F2EA]/30'

type AuthSubmitButtonProps = {
  pending: boolean
  label: string
  loadingLabel?: string
}

// El botón nunca se ve "deshabilitado" — solo cambia el texto a
// "VERIFICANDO" con puntos que aparecen uno por uno en loop.
export function AuthSubmitButton({ pending, label, loadingLabel = 'VERIFICANDO' }: AuthSubmitButtonProps) {
  return (
    <button type="submit" disabled={pending} className={`mt-1 ${AUTH_BUTTON_CLASS}`}>
      {pending ? (
        <span className="inline-flex items-center">
          {loadingLabel}
          <span className="dot-loader ml-1 inline-flex">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      ) : (
        label
      )}
    </button>
  )
}
