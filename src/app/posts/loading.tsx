export default function PostsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-safe py-6 sm:py-8">
      <div className="h-4 w-24 rounded bg-muted animate-pulse mb-6" />
      <div className="h-24 rounded-xl bg-muted/40 animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[140px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden animate-pulse row-span-2 bg-muted/30">
            <div className="aspect-[16/9] bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
