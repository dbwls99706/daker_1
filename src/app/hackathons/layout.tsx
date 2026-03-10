import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "해커톤 목록 | BatonHub",
  description: "진행중, 예정, 종료된 해커톤을 탐색하고 필터링하세요.",
};

export default function HackathonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
