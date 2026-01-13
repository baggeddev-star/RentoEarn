export default function Loading() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <div className="h-4 w-32 bg-white/10 animate-pulse mb-8" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-white/10 animate-pulse mb-2" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-white/10 animate-pulse" />
              <div className="h-6 w-16 bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-24 bg-white/10 animate-pulse" />
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-white/10 p-6">
            <div className="h-4 w-16 bg-white/10 animate-pulse mb-3" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 animate-pulse" />
              <div className="h-5 w-24 bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="border border-white/10 p-6">
            <div className="h-4 w-16 bg-white/10 animate-pulse mb-3" />
            <div className="h-5 w-32 bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* Timeline */}
        <div className="border border-white/10 p-6 mb-6">
          <div className="h-5 w-24 bg-white/10 animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-3 h-3 bg-white/10 animate-pulse" />
                <div className="h-4 w-32 bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Banner preview */}
        <div className="border border-white/10 p-6">
          <div className="h-5 w-28 bg-white/10 animate-pulse mb-4" />
          <div className="h-40 bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
