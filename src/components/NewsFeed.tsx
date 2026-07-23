"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { NewsArticle, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import CategoryNav from "./CategoryNav";
import NewsCard from "./NewsCard";
import LoadingState from "./LoadingState";
import ErrorBoundary from "./ErrorBoundary";

interface FeedData {
  date: string;
  articles: NewsArticle[];
}

function parseCategoryParam(value: string | null): Category | "all" {
  if (!value || value === "all") return "all";
  if ((CATEGORIES as readonly string[]).includes(value)) return value as Category;
  return "all";
}

export default function NewsFeed() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = parseCategoryParam(searchParams.get("category"));

  const setCategory = useCallback(
    (cat: Category | "all") => {
      const params = new URLSearchParams(searchParams.toString());
      if (cat === "all") {
        params.delete("category");
      } else {
        params.set("category", cat);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    },
    [searchParams, router]
  );

  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load news"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const filteredArticles = data
    ? category === "all"
      ? data.articles
      : data.articles.filter((a) => a.category === category)
    : [];

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  return (
    <ErrorBoundary>
      <CategoryNav active={category} onSelect={setCategory} />

      {loading && <LoadingState />}

      {error && (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
            <svg
              className="h-8 w-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636a9 9 0 0 1 0 12.728M5.636 18.364a9 9 0 0 1 0-12.728m12.728 0L5.636 18.364"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Unable to load news
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredArticles.length === 0 && (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="text-neutral-500 dark:text-neutral-400">
            No articles found for this category.
          </p>
        </div>
      )}

      {!loading && !error && filteredArticles.length > 0 && (
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="space-y-5">
            {featured && (
              <NewsCard article={featured} featured />
            )}

            {rest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {rest.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          {data && (
            <footer className="mt-10 border-t border-neutral-200 py-6 text-center dark:border-neutral-800">
              <p className="text-xs text-neutral-400 dark:text-neutral-600">
                AI-generated summaries &middot; Last updated{" "}
                {new Date(data.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </footer>
          )}
        </main>
      )}
    </ErrorBoundary>
  );
}
