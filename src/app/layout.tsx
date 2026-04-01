import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";

export const metadata: Metadata = {
  title: {
    default: "BatonHub - 해커톤 통합 대시보드",
    template: "%s | BatonHub",
  },
  description: "해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드",
  keywords: ["해커톤", "DACON", "팀 빌딩", "대시보드", "BatonHub"],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "BatonHub - 해커톤 통합 대시보드",
    description: "해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드",
    type: "website",
    locale: "ko_KR",
    siteName: "BatonHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "BatonHub - 해커톤 통합 대시보드",
    description: "해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("batonhub_dark")==="true")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <Footer />
        <ScrollToTop />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
