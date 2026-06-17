// Fully isolated layout — no sidebar, navbar or status bar. Just the
// cinematic experience. The root layout still provides <html>/<body>, fonts
// and the theme; this segment intentionally adds nothing else.
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
