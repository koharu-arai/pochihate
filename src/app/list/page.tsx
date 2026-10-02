import type { Metadata } from "next";
import { ListView } from "@/components/ListView";

export const metadata: Metadata = { title: "30日リスト | ポチハテ" };

export default function Page() {
  return <ListView />;
}
