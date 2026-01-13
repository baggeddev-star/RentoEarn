export default function Loading() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <div className="h-4 w-24 bg-white/10 animate-pulse mb-8" />
        
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-white/10 animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-white/10 animate-pulse" />
            <div className="h-6 w-20 bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* Description */}
        <div className="border border-white/10 p-6 mb-6">
          <div className="h-5 w-24 bg-white/10 animate-pulse mb-4" />
          <div className="h-4 w-full bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-full bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-white/10 animate-pulse" />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-white/10 p-4">
            <div className="h-4 w-20 bg-white/10 animate-pulse mb-2" />
            <div className="h-6 w-16 bg-white/10 animate-pulse" />
          </div>
          <div className="border border-white/10 p-4">
            <div className="h-4 w-20 bg-white/10 animate-pulse mb-2" />
            <div className="h-6 w-24 bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* Applications */}
        <div className="border border-white/10 p-6">
          <div className="h-5 w-32 bg-white/10 animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
