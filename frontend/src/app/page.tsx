"use client";

import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="h-full p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Sales Pipeline</h2>
        <button className="bg-brand text-white px-4 py-2 rounded-md shadow hover:bg-sky-600 transition">
          + Add Lead
        </button>
      </div>
      <div className="h-[calc(100%-80px)]">
         <KanbanBoard />
      </div>
    </div>
  );
}
