/** 視覺維護原則：以既有黑白中性色、細緻卡片比例與響應式欄位結構，呈現不改變最終頁面風格的工具頁骨架屏。 */

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`tool-skeleton ${className}`} aria-hidden="true" />;
}

export default function ToolsLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="工具頁載入中"
    >
      <span className="sr-only">工具頁內容載入中</span>

      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-40" />
        <SkeletonBlock className="h-5 w-full max-w-md" />
      </div>

      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-10 w-20" />
        <SkeletonBlock className="h-10 w-24" />
        <SkeletonBlock className="h-10 w-20" />
        <SkeletonBlock className="h-10 w-24" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}
