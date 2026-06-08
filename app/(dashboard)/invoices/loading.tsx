import { SkeletonTable, Skeleton, SkeletonKpi } from '@/components/ui/Skeleton'

export default function InvoicesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}
