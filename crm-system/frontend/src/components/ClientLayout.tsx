"use client";

import "../app/globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-extrabold text-gray-800 tracking-tight">CRM Tizze</span>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 h-14">
            <Link
              href="/"
              className={`relative px-4 h-14 flex items-center text-sm font-semibold transition-colors ${
                pathname === "/" ? "text-brand tab-active" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              QUADRO
            </Link>
            <Link
              href="/dashboard"
              className={`relative px-4 h-14 flex items-center text-sm font-semibold transition-colors ${
                pathname === "/dashboard" ? "text-brand tab-active" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              DASHBOARD
            </Link>
          </nav>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            A
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </>
  );
}
