import { SkeletonTable, Skeleton, SkeletonKpi } from '@/components/ui/Skeleton'

export default function ReceivablesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-60" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
      <SkeletonTable rows={5} cols={7} />
    </div>
  )
}
