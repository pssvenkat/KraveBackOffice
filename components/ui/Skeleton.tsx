import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[#1a2235] border border-[#1e2d45]/50',
        className
      )}
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonKpi() {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-[#1e2d45]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-2.5 flex-1 ${i === 0 ? 'max-w-[120px]' : ''}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-[#1e2d45] last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-3 flex-1 ${c === 0 ? 'max-w-[160px]' : c === cols - 1 ? 'max-w-[60px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
