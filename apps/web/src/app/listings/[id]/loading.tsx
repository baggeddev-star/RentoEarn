export default function Loading() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <div className="h-4 w-24 bg-white/10 animate-pulse mb-8" />
        
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="h-8 w-48 bg-white/10 animate-pulse mb-2" />
            <div className="h-5 w-32 bg-white/10 animate-pulse" />
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mb-8">
          <div className="h-8 w-24 bg-white/10 animate-pulse" />
          <div className="h-8 w-20 bg-white/10 animate-pulse" />
        </div>

        {/* Description */}
        <div className="border border-white/10 p-6 mb-6">
          <div className="h-5 w-24 bg-white/10 animate-pulse mb-4" />
          <div className="h-4 w-full bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-white/10 animate-pulse" />
        </div>

        {/* Price section */}
        <div className="border border-white/10 p-6 mb-6">
          <div className="h-5 w-20 bg-white/10 animate-pulse mb-4" />
          <div className="h-10 w-32 bg-white/10 animate-pulse" />
        </div>

        {/* CTA */}
        <div className="h-14 w-full bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
