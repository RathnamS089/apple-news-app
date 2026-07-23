import { promises as fs } from "fs";
import path from "path";
import type { DailySummary, Category, NewsArticle } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SUMMARIES_FILE = path.join(DATA_DIR, "summaries.json");

export async function getLatestSummary(): Promise<DailySummary | null> {
  try {
    const raw = await fs.readFile(SUMMARIES_FILE, "utf-8");
    const summaries: DailySummary[] = JSON.parse(raw);
    if (summaries.length === 0) return null;
    return summaries[summaries.length - 1];
  } catch {
    return null;
  }
}

export async function getAllSummaries(): Promise<DailySummary[]> {
  try {
    const raw = await fs.readFile(SUMMARIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function filterByCategory(
  articles: NewsArticle[],
  category: Category | "all"
): NewsArticle[] {
  if (category === "all") return articles;
  return articles.filter((a) => a.category === category);
}

export async function saveSummary(summary: DailySummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let summaries: DailySummary[] = [];
  try {
    const raw = await fs.readFile(SUMMARIES_FILE, "utf-8");
    summaries = JSON.parse(raw);
  } catch {
    // File doesn't exist yet
  }
  const existingIndex = summaries.findIndex((s) => s.date === summary.date);
  if (existingIndex >= 0) {
    summaries[existingIndex] = summary;
  } else {
    summaries.push(summary);
  }
  // Keep last 30 days
  if (summaries.length > 30) {
    summaries = summaries.slice(-30);
  }
  await fs.writeFile(SUMMARIES_FILE, JSON.stringify(summaries, null, 2));
}
