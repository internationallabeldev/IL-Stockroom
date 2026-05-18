import { z } from 'zod'

const ROLES = ['ADMIN', 'PURCHASER', 'WAREHOUSE_MANAGER', 'PRODUCER', 'USER'] as const

export const inviteUserSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(ROLES),
})

export const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().nullable().optional(),
})

export const updateOwnProfileSchema = z.object({
  nickname:  z.string().max(30, 'Máx. 30 caracteres').nullable().optional(),
  phone:     z.string().nullable().optional(),
  job_title: z.string().max(50, 'Máx. 50 caracteres').nullable().optional(),
})

export const notificationPreferencesSchema = z.object({
  pending_requisitions:  z.boolean().optional(),
  quality_pending:       z.boolean().optional(),
  low_stock:             z.boolean().optional(),
  order_overdue:         z.boolean().optional(),
  requisition_approved:  z.boolean().optional(),
  requisition_rejected:  z.boolean().optional(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.newPassword === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
})

export type InviteUserValues = z.infer<typeof inviteUserSchema>
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
export type UpdateOwnProfileValues = z.infer<typeof updateOwnProfileSchema>
export type NotificationPreferencesValues = z.infer<typeof notificationPreferencesSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type ChangeOwnPasswordValues = z.infer<typeof changeOwnPasswordSchema>
