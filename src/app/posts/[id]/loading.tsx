export default function PostDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-safe py-6 sm:py-8">
      <div className="h-4 w-32 rounded bg-muted animate-pulse mb-6" />
      <div className="h-40 rounded-xl bg-muted/40 animate-pulse mb-6" />
      <div className="border rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-video bg-muted" />
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}
