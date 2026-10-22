import { PRIORITY_LABELS, type TaskPriority } from './types'

interface PrioritySelectProps {
  value: TaskPriority | null
  onChange: (priority: TaskPriority | null) => void
  disabled?: boolean
  label?: string
}

const NO_PRIORITY_VALUE = ''
const PRIORITIES: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW']

export function PrioritySelect({ value, onChange, disabled, label = '우선순위' }: PrioritySelectProps) {
  return (
    <select
      aria-label={label}
      value={value ?? NO_PRIORITY_VALUE}
      onChange={(event) =>
        onChange(event.target.value === NO_PRIORITY_VALUE ? null : (event.target.value as TaskPriority))
      }
      disabled={disabled}
      className="rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
    >
      <option value={NO_PRIORITY_VALUE}>우선순위 없음</option>
      {PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {PRIORITY_LABELS[priority]}
        </option>
      ))}
    </select>
  )
}
