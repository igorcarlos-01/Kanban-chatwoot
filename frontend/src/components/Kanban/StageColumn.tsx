"use client";

import React, { useState } from "react";
import LeadCard from "./LeadCard";

type Lead = {
  id: string;
  name: string;
  stageId: string;
  phoneNumber?: string;
  lastMessagePreview: string;
  aiSummary?: { shortSummary: string; temperature: string };
  avatarUrl?: string;
  tags?: string[];
  chatwootConversationId?: number;
  movedAt?: string;
};

type Stage = {
  id: string;
  name: string;
  color: string;
};

interface StageColumnProps {
  stage: Stage;
  leads: Lead[];
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onRename: (stageId: string, newName: string) => void;
  onDelete: (stageId: string) => void;
  onConfigureAutomation: (stageId: string) => void;
}

const STAGE_DOT_COLORS = [
  "bg-blue-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-green-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-cyan-400",
  "bg-red-400",
];

export default function StageColumn({
  stage,
  leads,
  onDragStart,
  onDrop,
  onRename,
  onDelete,
  onConfigureAutomation,
}: StageColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(stage.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const stageLeads = leads.filter((l) => l.stageId === stage.id);
  const dotColor = STAGE_DOT_COLORS[stage.name.charCodeAt(0) % STAGE_DOT_COLORS.length];

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== stage.name) {
      onRename(stage.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      className={`flex flex-col min-w-[280px] w-[280px] rounded-xl bg-white shadow-column transition-all duration-200 ${
        isDragOver ? "ring-2 ring-brand/40 bg-brand-50/30" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, stage.id);
      }}
    >
      {/* Column Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`} />

          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-brand w-full"
            />
          ) : (
            <h3 className="text-sm font-semibold text-gray-700 truncate">{stage.name}</h3>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Lead Count Badge */}
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
            {stageLeads.length}
          </span>

          {/* Options Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-modal py-1 animate-scale-in">
                  <button
                    onClick={() => { setIsRenaming(true); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Renomear
                  </button>
                  <button
                    onClick={() => { onConfigureAutomation(stage.id); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Automações
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { onDelete(stage.id); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Excluir Etapa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lead Cards */}
      <div className="flex-1 p-2.5 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar min-h-[200px]">
        {stageLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
        ))}

        {stageLeads.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl text-xs font-medium transition-colors ${
            isDragOver ? "border-brand text-brand bg-brand-50/50" : "border-gray-200 text-gray-400"
          }`}>
            <svg className="w-5 h-5 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  );
}
