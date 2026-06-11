// Leave type definitions matching the backend LEAVE_TYPE enum.
// `requiresReason` reflects an HR policy (configurable): types that explain themselves
// (annual, statutory leave) don't need a written reason; discretionary or sensitive
// types do, so the manager has context to decide.

export const LEAVE_TYPES = [
  { value: 'annual',      label: 'Annual',      requiresReason: false, description: 'Paid vacation time' },
  { value: 'sick',        label: 'Sick',        requiresReason: false, description: 'Illness or medical appointment' },
  { value: 'personal',    label: 'Personal',    requiresReason: true,  description: 'Discretionary personal time' },
  { value: 'unpaid',      label: 'Unpaid',      requiresReason: true,  description: 'Unpaid time off' },
  { value: 'maternity',   label: 'Maternity',   requiresReason: false, description: 'Maternity leave' },
  { value: 'paternity',   label: 'Paternity',   requiresReason: false, description: 'Paternity leave' },
  { value: 'bereavement', label: 'Bereavement', requiresReason: false, description: 'Loss of a family member' },
  { value: 'other',       label: 'Other',       requiresReason: true,  description: 'Anything not listed above' },
]

export const LEAVE_TYPE_VALUES = LEAVE_TYPES.map((t) => t.value)
export const REASON_REQUIRED_TYPES = LEAVE_TYPES.filter((t) => t.requiresReason).map((t) => t.value)

export function getLeaveType(value) {
  return LEAVE_TYPES.find((t) => t.value === value) || null
}

export function leaveTypeRequiresReason(value) {
  return REASON_REQUIRED_TYPES.includes(value)
}
