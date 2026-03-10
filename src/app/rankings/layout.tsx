import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글로벌 랭킹 | BatonHub",
  description: "해커톤 참가 팀의 글로벌 랭킹을 확인하세요.",
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
