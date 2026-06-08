import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton'

export default function ItemsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-28 ml-auto" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
