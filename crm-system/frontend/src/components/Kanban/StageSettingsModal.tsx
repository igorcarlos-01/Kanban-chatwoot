"use client";

import React, { useState, useEffect } from "react";
import AutomationRuleForm from "./AutomationRuleForm";

interface Automation {
  id: string;
  triggerType: string;
  actions: any;
  stage?: { name: string };
  isActive: boolean;
}

interface StageSettingsModalProps {
  isOpen: boolean;
  stageId: string;
  stageName: string;
  pipelineId: string;
  onClose: () => void;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/api$/, "");

export default function StageSettingsModal({
  isOpen,
  stageId,
  stageName,
  pipelineId,
  onClose,
}: StageSettingsModalProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && pipelineId) {
      setLoading(true);
      fetch(`${API_URL}/api/pipelines/${pipelineId}/automations`)
        .then((r) => r.json())
        .then((data) => {
          setAutomations(data.filter((a: Automation) => a.stage?.name === stageName || !a.stage));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, pipelineId, stageName]);

  const handleSaveRule = async (rule: { triggerType: string; actions: any[] }) => {
    try {
      const res = await fetch(`${API_URL}/api/automations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId,
          stageId,
          triggerType: rule.triggerType,
          actions: rule.actions,
        }),
      });
      const newRule = await res.json();
      setAutomations((prev) => [...prev, { ...newRule, stage: { name: stageName } }]);
    } catch (err) {
      console.error("Error saving automation:", err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/automations/${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting automation:", err);
    }
  };

  if (!isOpen) return null;

  const ACTION_LABELS: Record<string, string> = {
    chatwoot_send_message: "💬 Enviar mensagem",
    n8n_webhook: "🔗 Webhook n8n",
    chatwoot_add_tag: "🏷️ Adicionar tag",
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Panel (slide from right) */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white z-50 shadow-modal animate-slide-in flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-800">Configurações</h3>
            <p className="text-xs text-gray-400">Etapa: {stageName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Existing Automations */}
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Automações Ativas
          </h4>

          {loading && <p className="text-xs text-gray-400 mb-4">Carregando...</p>}

          {!loading && automations.length === 0 && (
            <p className="text-xs text-gray-400 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
              Nenhuma automação configurada para esta etapa.
            </p>
          )}

          <div className="flex flex-col gap-2 mb-6">
            {automations.map((auto) => {
              const actionsList = Array.isArray(auto.actions) ? auto.actions : [];
              return (
                <div key={auto.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between group">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-700">
                      Ao entrar → {actionsList.map((a: any) => ACTION_LABELS[a.type] || a.type).join(", ")}
                    </span>
                    {actionsList[0]?.message && (
                      <span className="text-[10px] text-gray-400 truncate">&quot;{actionsList[0].message}&quot;</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRule(auto.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remover regra"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <hr className="border-gray-100 mb-4" />

          {/* Add new rule */}
          <AutomationRuleForm
            pipelineId={pipelineId}
            stageId={stageId}
            stageName={stageName}
            onSave={handleSaveRule}
          />
        </div>
      </div>
    </>
  );
}
