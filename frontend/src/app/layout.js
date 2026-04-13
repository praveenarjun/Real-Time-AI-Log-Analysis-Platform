import ClientLayout from "./ClientLayout";
import "./globals.css";

export const metadata = {
  title: "AI Log Analysis | Command Center",
  description: "Real-time AI-powered forensic log analysis platform",
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
