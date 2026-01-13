export default function Loading() {
  return (
    <div className="min-h-screen bg-black pt-24">
      {/* Header Skeleton */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="h-4 w-24 bg-white/10 animate-pulse mb-4" />
              <div className="h-10 w-40 bg-white/10 animate-pulse mb-3" />
              <div className="h-5 w-48 bg-white/10 animate-pulse" />
            </div>
            <div className="h-12 w-32 bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* KPI Strip Skeleton */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-white/10 p-6 text-center animate-pulse">
                <div className="h-8 w-12 bg-white/10 mx-auto mb-2" />
                <div className="h-4 w-16 bg-white/10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-6 w-40 bg-white/10 animate-pulse mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
