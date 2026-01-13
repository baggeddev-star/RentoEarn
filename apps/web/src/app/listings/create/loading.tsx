export default function Loading() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="h-4 w-32 bg-white/10 animate-pulse mb-8" />
        <div className="h-10 w-48 bg-white/10 animate-pulse mb-4" />
        <div className="h-5 w-64 bg-white/10 animate-pulse mb-12" />
        <div className="space-y-8">
          <div className="h-32 bg-white/5 animate-pulse" />
          <div className="h-24 bg-white/5 animate-pulse" />
          <div className="h-20 bg-white/5 animate-pulse" />
          <div className="h-32 bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
