"use client";

import React, { useState } from "react";

interface AddStageButtonProps {
  onAdd: (name: string) => void;
}

export default function AddStageButton({ onAdd }: AddStageButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="min-w-[280px] w-[280px] flex-shrink-0">
        <div className="bg-white rounded-xl shadow-column p-4 animate-scale-in">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") setIsAdding(false);
            }}
            placeholder="Nome da etapa..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Criar
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[280px] w-[280px] flex-shrink-0">
      <button
        onClick={() => setIsAdding(true)}
        className="w-full h-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-semibold hover:border-brand hover:text-brand hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Nova Etapa
      </button>
    </div>
  );
}
