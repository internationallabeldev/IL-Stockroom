'use client'

import { useRouter } from 'next/navigation'
import { RequisitionSheet } from './requisition-sheet'
import type { Requisition } from '@/actions/requisitions.actions'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

export function RequisitionSheetPage({
  requisition,
  userRole,
}: {
  requisition: Requisition
  userRole:    UserRole
}) {
  const router = useRouter()
  return (
    <RequisitionSheet
      open={true}
      onClose={() => router.back()}
      requisitionId={requisition.id}
      initialRequisition={requisition}
      userRole={userRole}
    />
  )
}
