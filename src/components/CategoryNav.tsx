"use client";

import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

interface CategoryNavProps {
  active: Category | "all";
  onSelect: (category: Category | "all") => void;
}

export default function CategoryNav({ active, onSelect }: CategoryNavProps) {
  const allCategories: Array<Category | "all"> = ["all", ...CATEGORIES];
  const labels: Record<string, string> = {
    all: "For You",
    ...CATEGORY_LABELS,
  };

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${
                active === cat
                  ? "border-b-2 border-red-500 text-red-600 dark:border-red-400 dark:text-red-400"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {labels[cat]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
