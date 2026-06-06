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
  title: "Quick Dev Tools — the developer & BI workspace",
  description:
    "Quick Dev Tools: Notes, DAX Insight, DAX Studio, Mermaid Studio, JSON Toolkit, Text Compare and Kanban — all in one ultra-fast local-first workspace for developers.",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
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
