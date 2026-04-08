"use client";

import React, { useState } from "react";

interface AutomationRuleFormProps {
  pipelineId: string;
  stageId: string;
  stageName: string;
  onSave: (rule: { triggerType: string; actions: any[] }) => void;
}

const ACTION_TYPES = [
  { value: "chatwoot_send_message", label: "Enviar mensagem no Chatwoot" },
  { value: "n8n_webhook", label: "Disparar Webhook (n8n)" },
  { value: "chatwoot_add_tag", label: "Adicionar tag no Chatwoot" },
];

export default function AutomationRuleForm({ stageId, stageName, onSave }: AutomationRuleFormProps) {
  const [actionType, setActionType] = useState("chatwoot_send_message");
  const [message, setMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tagName, setTagName] = useState("");

  const handleSave = () => {
    let action: any = { type: actionType };

    if (actionType === "chatwoot_send_message") {
      if (!message.trim()) return;
      action.message = message.trim();
    } else if (actionType === "n8n_webhook") {
      if (!webhookUrl.trim()) return;
      action.url = webhookUrl.trim();
    } else if (actionType === "chatwoot_add_tag") {
      if (!tagName.trim()) return;
      action.tag = tagName.trim();
    }

    onSave({
      triggerType: "stage_entry",
      actions: [action],
    });

    setMessage("");
    setWebhookUrl("");
    setTagName("");
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-fade-in">
      <h4 className="text-sm font-semibold text-gray-700 mb-1">Nova Regra</h4>
      <p className="text-xs text-gray-400 mb-3">
        Quando um lead entrar em <strong className="text-gray-600">{stageName}</strong>:
      </p>

      {/* Action Type */}
      <label className="text-xs font-medium text-gray-500 mb-1 block">Ação</label>
      <select
        value={actionType}
        onChange={(e) => setActionType(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {ACTION_TYPES.map((at) => (
          <option key={at.value} value={at.value}>{at.label}</option>
        ))}
      </select>

      {/* Dynamic Field */}
      {actionType === "chatwoot_send_message" && (
        <>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Olá! Obrigado pelo seu interesse..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 resize-none h-20 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </>
      )}

      {actionType === "n8n_webhook" && (
        <>
          <label className="text-xs font-medium text-gray-500 mb-1 block">URL do Webhook</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://n8n.seudominio.com/webhook/..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </>
      )}

      {actionType === "chatwoot_add_tag" && (
        <>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Nome da Tag</label>
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Ex: qualificado, perdido..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-600 transition-colors"
      >
        Salvar Regra
      </button>
    </div>
  );
}
