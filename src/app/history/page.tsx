import type { Metadata } from "next";
import { HistoryView } from "@/components/HistoryView";

export const metadata: Metadata = { title: "履歴 | ポチハテ" };

export default function Page() {
  return <HistoryView />;
}
