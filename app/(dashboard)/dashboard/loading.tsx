import { SkeletonKpi, SkeletonTable, Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[180px] w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
