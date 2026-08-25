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
 *
 * Defaults to light rather than following the system preference: the models are
 * dark-furred and read far better on a light background, so a first-time visitor
 * on a dark-mode OS would otherwise land on the worst-case pairing. The toggle
 * still switches to dark and that choice is remembered.
 */
const themeInit = `(function(){try{
  var s = localStorage.getItem('bll-theme');
  document.documentElement.setAttribute('data-theme', s || 'light');
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      {/*
        The ambient backdrop lives inside the page, not here: it is tinted by
        the selected species' accent, and that variable is scoped to <main>.
      */}
      <body>{children}</body>
    </html>
  );
}
