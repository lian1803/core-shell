interface JobStatusBadgeProps {
  status: string
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const styles: Record<string, string> = {
    PENDING: 'bg-slate-100 text-slate-600',
    RUNNING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  }

  const labels: Record<string, string> = {
    PENDING: '대기',
    RUNNING: '진행중',
    COMPLETED: '완료',
    FAILED: '실패',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        styles[status] || styles.PENDING
      }`}
    >
      {status === 'RUNNING' && (
        <span className="animate-pulse mr-1">●</span>
      )}
      {labels[status] || status}
    </span>
  )
}
