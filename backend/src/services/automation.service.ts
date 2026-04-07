import { prisma } from '../index';

export const AutomationService = {
  async triggerEvent(eventType: string, context: { pipelineId: string; stageId?: string; leadId: string }) {
    console.log(`[Automation] Processing event ${eventType} for lead ${context.leadId}`);
    
    const rules = await prisma.automation.findMany({
      where: {
        pipelineId: context.pipelineId,
        isActive: true,
        triggerType: eventType,
        OR: [
          { stageId: null },
          { stageId: context.stageId }
        ]
      }
    });

    for (const rule of rules) {
      const actions = rule.actions as any[];
      if (!actions) continue;

      for (const action of actions) {
        if (action.type === 'n8n_webhook') {
          await this.executeN8nWebhook(action.url, context);
        } else if (action.type === 'chatwoot_add_tag') {
          // call Chatwoot API...
        }
      }
    }
  },

  async executeN8nWebhook(url: string, payload: any) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`[Automation] Triggered n8n webhook at ${url}`);
    } catch (err) {
      console.error('[Automation] n8n webhook failed:', err);
    }
  }
};
