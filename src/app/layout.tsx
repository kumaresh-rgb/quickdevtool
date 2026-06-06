import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quick Notes — the developer & BI workspace",
  description:
    "Quick Notes, DAX Insight, DAX Studio, Mermaid Studio, JSON tools and a Kanban board in one ultra-fast workspace for Power BI, Fabric and .NET developers.",
};

// Set the theme before paint to avoid a flash of the wrong theme. This mutates
// <html>, so the element carries suppressHydrationWarning to stay deterministic.
const themeScript = `(function(){try{var t=localStorage.getItem('qdn-theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
