import type { Metadata } from "next";
import Providers from "@/app/providers";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "MAC CMS 管理后台", template: "%s | MAC CMS 管理后台" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem={false}>
      <Providers>
        <div className="h-screen overflow-hidden bg-background-gray-secondary_alt_2 text-text-primary">
          {children}
        </div>
      </Providers>
      <Toaster />
    </ThemeProvider>
  );
}