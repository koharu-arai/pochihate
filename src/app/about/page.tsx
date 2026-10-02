import type { Metadata } from "next";
import { AboutView } from "@/components/AboutView";

export const metadata: Metadata = { title: "しくみ | ポチハテ" };

export default function Page() {
  return <AboutView />;
}
