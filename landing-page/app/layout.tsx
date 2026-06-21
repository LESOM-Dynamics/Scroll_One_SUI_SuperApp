import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scrollone.app';
const siteName = "Scroll One SuperApp";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Scroll One SuperApp - Your Gateway to the Sui Ecosystem",
    template: `%s | ${siteName}`,
  },
  description: "Scroll One SuperApp is built on the Sui blockchain—not Scroll L2. A unified wallet, identity, and mini-app marketplace powered by Sui Move and parallel execution.",
  keywords: [
    "Scroll One",
    "Sui",
    "SUI",
    "blockchain",
    "crypto wallet",
    "DeFi",
    "super app",
    "Web3",
    "Sui blockchain",
    "Sui Move",
    "object-centric",
    "cryptocurrency",
    "digital wallet",
    "decentralized identity",
    "mini-apps",
    "dApp",
    "blockchain ecosystem",
    "crypto trading",
    "NFT marketplace",
    "Mysten Labs",
  ],
  authors: [{ name: "Scroll One Tech Team" }],
  creator: "Scroll One",
  publisher: "Scroll One",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: "Scroll One SuperApp - Your Gateway to the Sui Ecosystem",
    description: "Experience Web3 reimagined on Sui. Wallet, identity, and 20+ mini-apps powered by object-centric architecture and parallel execution.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "Scroll One SuperApp Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scroll One SuperApp - Your Gateway to the Sui Ecosystem",
    description: "Experience Web3 reimagined on Sui. Wallet, identity, and 20+ mini-apps powered by object-centric architecture and parallel execution.",
    images: ["/logo.png"],
    creator: "@scrollone",
    site: "@scrollone",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Technology",
  classification: "Web3, Blockchain, Crypto, DeFi, Sui",
  other: {
    "theme-color": "#6E56CF",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Scroll One",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        <Script
          id="microsoft-clarity"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "urm2mxilup");
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
