import { NextResponse } from "next/server";
import { getLatestSummary } from "@/lib/news-data";

export async function GET() {
  const summary = await getLatestSummary();

  if (!summary) {
    return NextResponse.json(
      { error: "No news data available" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    date: summary.date,
    articles: summary.articles,
  });
}
