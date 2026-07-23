export type Category = "top" | "tech" | "ai" | "world";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  source: string;
  sourceUrl: string;
  category: Category;
  imageUrl: string | null;
  publishedAt: string;
}

export interface DailySummary {
  date: string;
  generatedAt: string;
  articles: NewsArticle[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  top: "Top Stories",
  tech: "Technology",
  ai: "AI & ML",
  world: "World",
};

export const CATEGORIES: Category[] = ["top", "tech", "ai", "world"];
