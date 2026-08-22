import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')
