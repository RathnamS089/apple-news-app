import type { NewsArticle } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  return (
    <article
      className={`group rounded-2xl border border-neutral-200 bg-white transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 ${
        featured ? "col-span-full" : ""
      }`}
    >
      <div className={`p-5 ${featured ? "sm:p-7" : ""}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {CATEGORY_LABELS[article.category] ?? article.category}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        <h2
          className={`font-bold leading-snug tracking-tight text-neutral-900 group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400 ${
            featured
              ? "text-2xl sm:text-3xl"
              : "text-lg sm:text-xl"
          }`}
        >
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0"
          >
            {article.title}
          </a>
        </h2>

        <p
          className={`mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400 ${
            featured ? "text-base" : "text-sm"
          }`}
        >
          {article.summary}
        </p>

        <ul className="mt-4 space-y-2">
          {article.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
              <span className="leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {article.source}
          </span>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Read Full Story &rarr;
          </a>
        </div>
      </div>
    </article>
  );
}
