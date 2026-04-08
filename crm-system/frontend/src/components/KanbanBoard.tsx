"use client";

import { useEffect, useState, useCallback } from "react";
import { socket } from "../lib/socket";
import StageColumn from "./Kanban/StageColumn";
import AddStageButton from "./Kanban/AddStageButton";
import StageSettingsModal from "./Kanban/StageSettingsModal";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function KanbanBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [settingsModal, setSettingsModal] = useState<{ stageId: string; stageName: string } | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      const pipeRes = await fetch(`${API_URL}/api/pipelines`);
      const pipelines = await pipeRes.json();

      if (pipelines?.length > 0) {
        const main = pipelines[0];
        setPipelineId(main.id);
        setStages(
          main.stages.map((s: any) => ({
            id: s.id,
            name: s.name,
            color: "",
          }))
        );

        const boardRes = await fetch(`${API_URL}/api/pipelines/${main.id}/board`);
        const boardData = await boardRes.json();
        setLeads(
          boardData.map((pl: any) => ({
            id: pl.leadId,
            name: pl.lead.name || "Sem Nome",
            stageId: pl.stageId,
            phoneNumber: pl.lead.phoneNumber,
            lastMessagePreview: pl.lead.lastMessagePreview || "",
            aiSummary: pl.lead.aiSummary,
            avatarUrl: (pl.lead.customAttributes as any)?.avatarUrl || null,
            tags: pl.lead.tags || [],
            chatwootConversationId: pl.lead.chatwootConversationId,
            movedAt: pl.movedAt,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading board:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();

    socket.on("lead_updated", (updatedLead: any) => {
      setLeads((prev) => {
        const exists = prev.find((l) => l.id === updatedLead.id);
        if (exists) return prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l));
        return [...prev, updatedLead];
      });
    });

    socket.on("stages_updated", () => {
      loadBoard();
    });

    return () => {
      socket.off("lead_updated");
      socket.off("stages_updated");
    };
  }, [loadBoard]);

  // Filter leads by search
  const filteredLeads = searchTerm.trim()
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.phoneNumber?.includes(searchTerm) ||
          l.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : leads;

  // === DRAG & DROP ===
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;

    // Otimista
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stageId, movedAt: new Date().toISOString() } : l)));

    if (pipelineId) {
      try {
        await fetch(`${API_URL}/api/leads/${leadId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineId, newStageId: stageId }),
        });
      } catch (err) {
        console.error("Move error:", err);
        loadBoard();
      }
    }
  };

  // === STAGE MANAGEMENT ===
  const handleAddStage = async (name: string) => {
    if (!pipelineId) return;
    try {
      await fetch(`${API_URL}/api/pipelines/${pipelineId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      loadBoard();
    } catch (err) {
      console.error("Add stage error:", err);
    }
  };

  const handleRenameStage = async (stageId: string, newName: string) => {
    try {
      await fetch(`${API_URL}/api/stages/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, name: newName } : s)));
    } catch (err) {
      console.error("Rename stage error:", err);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etapa? Os leads serão movidos para a primeira etapa.")) return;
    try {
      await fetch(`${API_URL}/api/stages/${stageId}`, { method: "DELETE" });
      loadBoard();
    } catch (err) {
      console.error("Delete stage error:", err);
    }
  };

  // === LOADING SKELETON ===
  if (loading) {
    return (
      <div className="flex h-full p-4 gap-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[280px] w-[280px] rounded-xl bg-white shadow-column animate-pulse">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="p-2.5 space-y-2.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-20" />
                      <div className="h-2.5 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalLeads = leads.length;

  return (
    <>
      {/* Sub-header: search + stats */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/60 backdrop-blur-sm border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">
            {totalLeads} contato{totalLeads !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            {stages.map((s) => {
              const count = leads.filter((l) => l.stageId === s.id).length;
              return (
                <span key={s.id} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {s.name.split(" ")[0]}: {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar leads..."
            className="w-48 h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-gray-400"
          />
          <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 p-4 gap-3 overflow-x-auto custom-scrollbar">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            leads={filteredLeads}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onRename={handleRenameStage}
            onDelete={handleDeleteStage}
            onConfigureAutomation={(id) =>
              setSettingsModal({ stageId: id, stageName: stage.name })
            }
          />
        ))}

        <AddStageButton onAdd={handleAddStage} />
      </div>

      {/* Settings Panel */}
      {settingsModal && pipelineId && (
        <StageSettingsModal
          isOpen={true}
          stageId={settingsModal.stageId}
          stageName={settingsModal.stageName}
          pipelineId={pipelineId}
          onClose={() => setSettingsModal(null)}
        />
      )}
    </>
  );
}
