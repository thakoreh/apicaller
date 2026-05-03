import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "apicaller.dev — API endpoint to curl & fetch(), instantly",
  description:
    "Paste any API URL and get ready-to-copy curl commands and JavaScript fetch() code for every HTTP method. Supports GitHub, OpenAI, Anthropic, Stripe, and more. Free, no account needed.",
  keywords: ["api", "curl", "fetch", "rest", "http", "developer tools", "curl generator", "fetch generator", "api tester", "api debugger"],
  openGraph: {
    title: "apicaller.dev — API to curl & fetch(), instantly",
    description: "Paste any API URL and get ready-to-copy curl commands and JavaScript fetch() code. No docs digging.",
    type: "website",
    url: "https://thakoreh.github.io/apicaller/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230d1117'/><text y='70' x='15' font-size='60' font-family='monospace' fill='%2300d4ff'>$</text></svg>" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
