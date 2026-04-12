import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "AI Log Analysis | Command Center",
  description: "Real-time AI-powered forensic log analysis platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg-primary min-h-screen text-text-primary selection:bg-accent-cyan/30">
        <Sidebar />
        <div className="pl-32 pr-8 py-8 min-h-screen">
          <main className="max-w-[1600px] mx-auto animate-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
