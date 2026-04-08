import { prisma } from '../index';

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://chatwoot.centraltizze.com';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || '';

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
        try {
          if (action.type === 'n8n_webhook') {
            await this.executeN8nWebhook(action.url, context);
          } else if (action.type === 'chatwoot_send_message') {
            await this.sendChatwootMessage(context.leadId, action.message, action.accountId || 1);
          } else if (action.type === 'chatwoot_add_tag') {
            await this.addChatwootTag(context.leadId, action.tag, action.accountId || 1);
          }
        } catch (err) {
          console.error(`[Automation] Action ${action.type} failed:`, err);
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
  },

  async sendChatwootMessage(leadId: string, message: string, accountId: number) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead?.chatwootConversationId) {
      console.log('[Automation] Lead has no chatwoot conversation, skipping message');
      return;
    }

    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${lead.chatwootConversationId}/messages`;
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_TOKEN,
        },
        body: JSON.stringify({
          content: message,
          message_type: 'outgoing',
          private: false,
        })
      });
      console.log(`[Automation] Sent Chatwoot message to conversation ${lead.chatwootConversationId}`);
    } catch (err) {
      console.error('[Automation] Chatwoot message failed:', err);
    }
  },

  async addChatwootTag(leadId: string, tag: string, accountId: number) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead?.chatwootConversationId) return;

    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${lead.chatwootConversationId}/labels`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_TOKEN,
        },
        body: JSON.stringify({ labels: [tag] })
      });
      console.log(`[Automation] Added tag "${tag}" to conversation ${lead.chatwootConversationId}`);
    } catch (err) {
      console.error('[Automation] Chatwoot tag failed:', err);
    }
  }
};
