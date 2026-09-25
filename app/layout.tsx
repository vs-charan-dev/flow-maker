import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Flow Companion — Make boring work feel shorter",
  description: "Transform long, intimidating work sessions into engaging, bite-sized missions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
