import { Suspense } from "react";
import Header from "@/components/Header";
import NewsFeed from "@/components/NewsFeed";
import LoadingState from "@/components/LoadingState";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<LoadingState />}>
        <NewsFeed />
      </Suspense>
    </div>
  );
}
