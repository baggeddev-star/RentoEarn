export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Skeleton */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-8 w-48 bg-white/10 mx-auto mb-8 animate-pulse" />
          <div className="h-20 w-3/4 bg-white/10 mx-auto mb-4 animate-pulse" />
          <div className="h-20 w-2/3 bg-white/10 mx-auto mb-6 animate-pulse" />
          <div className="h-6 w-1/2 bg-white/5 mx-auto mb-12 animate-pulse" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-20 bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Skeleton */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 lg:row-span-2 h-96 bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-48 bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-48 bg-white/5 border border-white/10 animate-pulse" />
            <div className="lg:col-span-2 h-48 bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-48 bg-white/5 border border-white/10 animate-pulse" />
            <div className="lg:col-span-2 h-48 bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-48 bg-white/5 border border-white/10 animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}
