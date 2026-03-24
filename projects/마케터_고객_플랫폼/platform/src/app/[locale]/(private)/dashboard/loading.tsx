export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="h-4 w-80 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}
