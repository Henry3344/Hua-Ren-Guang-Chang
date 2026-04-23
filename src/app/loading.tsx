export default function AppLoading() {
  return (
    <div className="max-w-6xl mx-auto px-safe py-10">
      <div className="rounded-2xl border bg-muted/30 animate-pulse min-h-[200px] mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    </div>
  )
}
