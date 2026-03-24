export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
      <div className="space-y-4 mt-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
