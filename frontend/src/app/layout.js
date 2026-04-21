import ClientLayout from "./ClientLayout";
import "./globals.css";

export const metadata = {
  title: "AI Forensic Command Center | Real-Time Log Intelligence",
  description: "Next-gen AI log analysis platform for real-time forensic auditing, predictive anomaly detection, and distributed system observability.",
  openGraph: {
    title: "AI Forensic Command Center | Real-Time Log Intelligence",
    description: "Architecting a production-grade AI forensic telemetry stack with Go, Python, and gRPC. Real-time observability for high-scale distributed systems.",
    url: "https://praveen-challa.tech",
    siteName: "AI Forensic Platform",
    images: [
      {
        url: "/ai_forensic_platform_hero.png", // I will suggest the user upload the generated graphic to this path or provide the relative one
        width: 1200,
        height: 630,
        alt: "AI Forensic Platform Command Center Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Forensic Command Center",
    description: "Real-time AI-powered forensic log analysis platform",
    images: ["/ai_forensic_platform_hero.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg-primary min-h-screen text-text-primary selection:bg-accent-cyan/30">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
