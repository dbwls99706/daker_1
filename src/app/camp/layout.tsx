import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "팀원 모집 | BatonHub",
  description: "해커톤 팀을 만들거나, 모집중인 팀에 합류하세요.",
};

export default function CampLayout({ children }: { children: React.ReactNode }) {
  return children;
}
