"use client";

import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="h-full p-2 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Seu Funil de Vendas</h2>
        <button className="bg-blue-600 text-white px-3 md:px-4 py-2 text-sm md:text-base rounded-md shadow hover:bg-blue-700 transition font-bold" onClick={() => alert("Essa função vai abrir uma janela para adicionar contatos manualmente!")}>
          + Novo Lead
        </button>
      </div>
      <div className="h-[calc(100%-80px)]">
         <KanbanBoard />
      </div>
    </div>
  );
}
