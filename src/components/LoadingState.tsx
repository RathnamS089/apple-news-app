export default function LoadingState() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        {/* Featured card skeleton */}
        <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="h-8 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-2 h-5 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-1 h-5 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-4 space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2.5">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 flex-1 rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Regular card skeletons */}
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="h-6 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-4 flex-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
