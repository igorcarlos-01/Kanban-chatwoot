import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Pipeline CRM",
  description: "AI CRM integrated with Chatwoot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900 bg-gray-50 h-screen overflow-hidden flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand to-sky-500 bg-clip-text text-transparent">Multi-Pipeline CRM</h1>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
           {children}
        </main>
      </body>
    </html>
  );
}
