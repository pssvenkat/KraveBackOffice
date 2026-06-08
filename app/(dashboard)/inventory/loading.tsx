import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton'

export default function InventoryLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl p-1 w-fit">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <SkeletonTable rows={7} cols={5} />
    </div>
  )
}
