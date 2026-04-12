import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "AI Log Analysis | Command Center",
  description: "Real-time AI-powered forensic log analysis platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg-primary min-h-screen text-text-primary selection:bg-accent-cyan/30 flex overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 ml-32 pr-8 py-8 min-h-screen w-full">
          <main className="max-w-[1400px] mx-auto animate-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
