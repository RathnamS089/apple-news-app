import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Configuration ──────────────────────────────────────────────────────────

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const NEWS_API_BASE = "https://newsapi.org/v2";

const CATEGORY_QUERIES: Record<string, string[]> = {
  top: ["breaking news", "headlines"],
  tech: ["technology", "software", "hardware", "startups"],
  ai: [
    "artificial intelligence",
    "machine learning",
    "large language models",
    "AI regulation",
  ],
  world: ["international relations", "global politics", "world affairs"],
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage: string | null;
}

interface ProcessedArticle {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  source: string;
  sourceUrl: string;
  category: string;
  imageUrl: string | null;
  publishedAt: string;
}

// ─── News Fetching ──────────────────────────────────────────────────────────

async function fetchNewsForCategory(
  category: string,
  queries: string[]
): Promise<RawArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn(
      `No NEWS_API_KEY set. Using sample data for category: ${category}`
    );
    return [];
  }

  const allArticles: RawArticle[] = [];

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "5",
      apiKey: NEWS_API_KEY,
    });

    try {
      const res = await fetch(`${NEWS_API_BASE}/everything?${params}`);
      if (!res.ok) {
        console.error(
          `NewsAPI error for "${query}": ${res.status} ${res.statusText}`
        );
        continue;
      }
      const data = await res.json();
      allArticles.push(...(data.articles || []));
    } catch (err) {
      console.error(`Failed to fetch news for "${query}":`, err);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return allArticles.filter((a) => {
    if (!a.title || seen.has(a.title) || a.title === "[Removed]") return false;
    seen.add(a.title);
    return true;
  });
}

// ─── AI Summarization ───────────────────────────────────────────────────────

async function summarizeArticles(
  client: Anthropic,
  category: string,
  articles: RawArticle[]
): Promise<ProcessedArticle[]> {
  if (articles.length === 0) return [];

  const articleList = articles
    .slice(0, 5)
    .map(
      (a, i) =>
        `${i + 1}. Title: ${a.title}\n   Description: ${a.description || "No description"}\n   Source: ${a.source.name}\n   URL: ${a.url}\n   Published: ${a.publishedAt}`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a news editor for a premium news digest app (like Apple News Today). For each article below, create a concise, engaging summary with bullet points.

Articles:
${articleList}

For EACH article, respond in this exact JSON format (as an array):
[
  {
    "index": 1,
    "title": "Rewritten headline that is clear, engaging, and under 80 characters",
    "summary": "A 1-2 sentence summary capturing the key point and its significance",
    "bullets": ["Key detail 1", "Key detail 2", "Key detail 3", "Key detail 4"]
  }
]

Rules:
- Each bullet should be a single, specific fact or data point
- Write in a neutral, authoritative tone
- Avoid clickbait or sensationalism
- Each bullet should start with a specific detail, not "The article says..."
- Return ONLY valid JSON, no markdown fences`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: Array<{
    index: number;
    title: string;
    summary: string;
    bullets: string[];
  }>;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error(`Failed to parse AI response for ${category}:`, text);
    return [];
  }

  return parsed.map((item, i) => {
    const original = articles[item.index - 1] || articles[i];
    return {
      id: `${category}-${Date.now()}-${i}`,
      title: item.title,
      summary: item.summary,
      bullets: item.bullets,
      source: original.source.name,
      sourceUrl: original.url,
      category,
      imageUrl: original.urlToImage,
      publishedAt: original.publishedAt,
    };
  });
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main() {
  console.log("🗞️  Apple News Daily Summary Generator");
  console.log("─".repeat(50));

  const today = new Date().toISOString().split("T")[0];
  console.log(`Date: ${today}\n`);

  if (!ANTHROPIC_API_KEY) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is required.\n" +
        "Set it with: export ANTHROPIC_API_KEY=your-key-here"
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const allArticles: ProcessedArticle[] = [];

  for (const [category, queries] of Object.entries(CATEGORY_QUERIES)) {
    console.log(`Fetching ${category} news...`);
    const raw = await fetchNewsForCategory(category, queries);
    console.log(`  Found ${raw.length} articles`);

    if (raw.length > 0) {
      console.log(`  Generating AI summaries...`);
      const summarized = await summarizeArticles(client, category, raw);
      allArticles.push(...summarized);
      console.log(`  Created ${summarized.length} summaries`);
    }
  }

  if (allArticles.length === 0) {
    console.log("\nNo articles fetched. Check your NEWS_API_KEY.");
    console.log("The app will continue using existing seed data.");
    return;
  }

  const summary = {
    date: today,
    generatedAt: new Date().toISOString(),
    articles: allArticles,
  };

  // Save to data directory
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.join(__dirname, "..", "data");
  const summariesFile = path.join(dataDir, "summaries.json");

  await fs.mkdir(dataDir, { recursive: true });

  let existing: Array<typeof summary> = [];
  try {
    const raw = await fs.readFile(summariesFile, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    // Fresh start
  }

  const idx = existing.findIndex((s) => s.date === today);
  if (idx >= 0) {
    existing[idx] = summary;
  } else {
    existing.push(summary);
  }

  // Keep last 30 days
  if (existing.length > 30) {
    existing = existing.slice(-30);
  }

  await fs.writeFile(summariesFile, JSON.stringify(existing, null, 2));

  console.log(`\n✅ Saved ${allArticles.length} articles to ${summariesFile}`);
  console.log("Run the Next.js dev server to see them: npm run dev");
}

main().catch(console.error);
