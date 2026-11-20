import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "影视 - 在线影视大全",
    template: "%s - 影视",
  },
  description: "提供最新最快的影视资源在线观看",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}