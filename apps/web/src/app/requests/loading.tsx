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
              <div className="h-5 w-64 bg-white/10 animate-pulse" />
            </div>
            <div className="h-12 w-36 bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-white/10 animate-pulse" />
            <div className="h-10 w-32 bg-white/10 animate-pulse" />
            <div className="h-10 w-28 bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-white/10 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-20 bg-white/10" />
                <div className="h-6 w-16 bg-white/10" />
              </div>
              <div className="h-5 w-3/4 bg-white/10 mb-2" />
              <div className="h-4 w-full bg-white/10 mb-2" />
              <div className="h-4 w-2/3 bg-white/10 mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-white/10" />
                <div className="h-6 w-20 bg-white/10" />
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between">
                <div className="h-6 w-20 bg-white/10" />
                <div className="h-4 w-16 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
