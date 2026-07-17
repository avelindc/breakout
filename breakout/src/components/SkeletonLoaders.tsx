// Shared skeleton component for reuse
export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded-full w-1/3" />
      <div className="h-8 bg-gray-100 rounded-full w-2/3" />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-3">
        <div className="h-7 bg-gray-200 rounded-full w-48 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded-full w-72 animate-pulse" />
      </div>
      
      {/* Table rows */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded-full w-40 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="w-16 h-4 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded-full w-32 animate-pulse" />
              </div>
              <div className="h-4 bg-gray-100 rounded-full w-40 animate-pulse" />
              <div className="h-6 bg-blue-100 rounded-lg w-20 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10 animate-pulse space-y-2">
            <div className="w-6 h-6 bg-white/10 rounded-full" />
            <div className="h-8 bg-white/10 rounded-full w-20" />
            <div className="h-3 bg-white/5 rounded-full w-16" />
          </div>
        ))}
      </div>
      
      {/* Content area */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 animate-pulse">
        <div className="h-6 bg-white/10 rounded-full w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded-full w-48" />
                <div className="h-3 bg-white/5 rounded-full w-32" />
              </div>
              <div className="h-6 bg-white/10 rounded-lg w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
