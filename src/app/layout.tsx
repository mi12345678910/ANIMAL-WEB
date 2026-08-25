import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Body Language Lab — Learn to read animals",
  description:
    "An interactive 3D guide to animal body language. Play a behaviour, watch the posture change, and learn what it means and how to respond.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
  ],
};

/**
 * Applied before paint so the saved theme never flashes the wrong palette.
 */
const themeInit = `(function(){try{
  var s = localStorage.getItem('bll-theme');
  var t = s || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <div className="app-backdrop" />
        {children}
      </body>
    </html>
  );
}
