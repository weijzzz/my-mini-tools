import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gran Canaria Price Comparator",
  description: "Compare supermarket prices across Las Palmas instantly. Mercadona, HiperDino, Carrefour & Spar.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "GC Prices",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0F1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // System fonts: no Google Fonts request, so the page renders immediately
  // on a slow mobile connection and works offline once installed.
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
