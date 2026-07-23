const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "AppleNewsDigest/1.0",
  },
});

const FEEDS = {
  top: [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.reuters.com/reuters/topNews",
    "https://feeds.npr.org/1001/rss.xml",
  ],
  tech: [
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
    "https://www.wired.com/feed/rss",
  ],
  ai: [
    "https://techcrunch.com/category/artificial-intelligence/feed/",
    "https://feeds.arstechnica.com/arstechnica/technology-lab",
    "https://www.marktechpost.com/feed/",
    "https://syncedreview.com/feed/",
  ],
  world: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://feeds.reuters.com/Reuters/worldNews",
  ],
};

const MAX_PER_CATEGORY = 5;

function makeId(category, title) {
  const hash = crypto.createHash("md5").update(title).digest("hex").slice(0, 8);
  return `${category}-${hash}`;
}

function extractSource(feedUrl) {
  try {
    const host = new URL(feedUrl).hostname.replace("www.", "").replace("feeds.", "");
    const map = {
      "bbci.co.uk": "BBC News",
      "nytimes.com": "The New York Times",
      "reuters.com": "Reuters",
      "npr.org": "NPR",
      "arstechnica.com": "Ars Technica",
      "theverge.com": "The Verge",
      "techcrunch.com": "TechCrunch",
      "wired.com": "Wired",
      "marktechpost.com": "MarkTechPost",
      "syncedreview.com": "Synced Review",
      "aljazeera.com": "Al Jazeera",
    };
    return map[host] || host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Unknown";
  }
}

function truncate(text, maxLen) {
  if (!text) return "";
  const clean = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s\S*$/, "") + "...";
}

function makeBullets(content, summary) {
  const raw = (content || summary || "").replace(/<[^>]*>/g, "");
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200);

  const unique = [...new Set(sentences)];
  return unique.slice(0, 4).map((s) => truncate(s, 150));
}

async function fetchCategory(category, feedUrls) {
  const articles = [];
  const seenTitles = new Set();

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      const source = feed.title || extractSource(url);

      for (const item of feed.items || []) {
        if (!item.title || seenTitles.has(item.title)) continue;
        if (item.title === "[Removed]") continue;
        seenTitles.add(item.title);

        const summary = truncate(
          item.contentSnippet || item.content || item.description || item.summary || "",
          250
        );
        if (!summary) continue;

        const bullets = makeBullets(item.content || item.description || "", summary);

        articles.push({
          id: makeId(category, item.title),
          title: truncate(item.title, 120),
          summary,
          bullets: bullets.length > 0 ? bullets : [summary],
          source,
          sourceUrl: item.link || "",
          category,
          imageUrl: item.enclosure?.url || null,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        });

        if (articles.length >= MAX_PER_CATEGORY) break;
      }
    } catch (err) {
      console.error(`  Failed to fetch ${url}: ${err.message}`);
    }

    if (articles.length >= MAX_PER_CATEGORY) break;
  }

  return articles;
}

async function main() {
  console.log("Fetching news from RSS feeds...\n");

  const allArticles = [];

  for (const [category, urls] of Object.entries(FEEDS)) {
    console.log(`[${category}] Fetching from ${urls.length} feeds...`);
    const articles = await fetchCategory(category, urls);
    console.log(`[${category}] Got ${articles.length} articles`);
    allArticles.push(...articles);
  }

  if (allArticles.length === 0) {
    console.error("\nNo articles fetched from any feed. Exiting without overwriting.");
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0];
  const summary = {
    date: today,
    generatedAt: new Date().toISOString(),
    articles: allArticles,
  };

  const dataDir = path.join(__dirname, "..", "data");
  const summariesFile = path.join(dataDir, "summaries.json");

  fs.mkdirSync(dataDir, { recursive: true });

  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(summariesFile, "utf-8"));
  } catch {
    // fresh start
  }

  const idx = existing.findIndex((s) => s.date === today);
  if (idx >= 0) {
    existing[idx] = summary;
  } else {
    existing.push(summary);
  }

  if (existing.length > 30) {
    existing = existing.slice(-30);
  }

  fs.writeFileSync(summariesFile, JSON.stringify(existing, null, 2));
  console.log(`\nSaved ${allArticles.length} articles to ${summariesFile}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
