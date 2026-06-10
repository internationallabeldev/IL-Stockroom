// One-off: crea el usuario del bot en auth.users + public.users con el service role.
// Evita el error "Database error creating new user" del dashboard (el trigger de
// perfil exige role/first_name en el metadata). Uso:  node scripts/setup-bot-user.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Carga simple de .env.local (split en el primer '=').
const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const EMAIL = 'claude-bot@internal.il'
const META = { first_name: 'Asistente', last_name: 'IA', role: 'USER' }

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// 1. Crear el usuario en auth vía invite-link (mismo mecanismo que inviteUser() de la
//    app; no depende del trigger de perfil que rompe a createUser). No envía email.
let userId
const { data: created, error: createErr } = await admin.auth.admin.generateLink({
  type: 'invite',
  email: EMAIL,
  options: { data: META },
})

if (createErr) {
  if (/already|registered|exists/i.test(createErr.message)) {
    // Buscar el existente paginando la lista de usuarios.
    let page = 1
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) { console.error('listUsers:', error.message); process.exit(1) }
      const hit = data.users.find(u => u.email === EMAIL)
      if (hit) { userId = hit.id; break }
      if (data.users.length < 1000) break
      page++
    }
    if (!userId) { console.error('No se pudo crear ni encontrar el usuario:', createErr.message); process.exit(1) }
    console.log('Usuario auth ya existía, reutilizando.')
  } else {
    console.error('createUser falló:', createErr.message)
    process.exit(1)
  }
} else {
  userId = created.user.id
  console.log('Usuario auth creado (invite).')
}

// 2. Asegurar la fila de perfil en public.users (el trigger pudo no poner nickname).
const { error: upErr } = await admin.from('users').upsert(
  {
    id: userId,
    email: EMAIL,
    first_name: META.first_name,
    last_name: META.last_name,
    nickname: 'Claude',
    role: 'USER',
    enabled: true,
  },
  { onConflict: 'id' },
)
if (upErr) { console.error('upsert public.users falló:', upErr.message); process.exit(1) }

console.log('\n✅ Bot listo. Agrega esto a .env.local:\n')
console.log(`NEXT_PUBLIC_BOT_USER_ID=${userId}`)
