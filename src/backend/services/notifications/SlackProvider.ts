/**
 * Slack Notification Provider
 * Posts alert notifications to a Slack channel via Incoming Webhook.
 */

interface AlertSlackData {
  title: string;
  severity: string;
  status: string;
  sourceSystem: string;
  sourceIp: string | null;
  alertType: string;
  description: string | null;
  id: string;
}

interface CaseSlackData {
  caseNumber: string;
  title: string;
  severity: string;
  status: string;
  id: string;
}

export class SlackProvider {
  private webhookUrl: string | null = null;
  private enabled: boolean = false;

  constructor() {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (url && url.startsWith('https://hooks.slack.com/')) {
      this.webhookUrl = url;
      this.enabled    = true;
      console.log('[Notifications] ✓ Slack provider configured');
    } else {
      console.log('[Notifications] Slack provider disabled (SLACK_WEBHOOK_URL not set)');
    }
  }

  private async post(payload: Record<string, unknown>): Promise<void> {
    if (!this.webhookUrl) return;
    try {
      const res = await fetch(this.webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(`[Notifications] Slack webhook failed: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error('[Notifications] Slack post error:', (err as Error).message);
    }
  }

  async sendAlertNotification(alert: AlertSlackData): Promise<void> {
    if (!this.enabled) return;

    const severityEmoji: Record<string, string> = {
      critical: '🔴',
      high:     '🟠',
      medium:   '🟡',
      low:      '🟢',
    };
    const severityColor: Record<string, string> = {
      critical: '#dc2626',
      high:     '#ea580c',
      medium:   '#ca8a04',
      low:      '#16a34a',
    };

    const emoji = severityEmoji[alert.severity.toLowerCase()] ?? '⚪';
    const color = severityColor[alert.severity.toLowerCase()] ?? '#6b7280';

    await this.post({
      attachments: [{
        color,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} Security Alert — ${alert.severity.toUpperCase()}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.title}*\n${alert.description ?? ''}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Type:*\n${alert.alertType}` },
              { type: 'mrkdwn', text: `*Source System:*\n${alert.sourceSystem ?? 'Unknown'}` },
              { type: 'mrkdwn', text: `*Source IP:*\n${alert.sourceIp ?? 'N/A'}` },
              { type: 'mrkdwn', text: `*Status:*\n${alert.status}` },
            ],
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `Alert ID: \`${alert.id}\` • SOC Detection Lab` },
            ],
          },
        ],
      }],
    });

    console.log(`[Notifications] ✓ Slack message sent for alert: ${alert.title}`);
  }

  async sendCaseNotification(caseData: CaseSlackData, event: 'opened' | 'closed'): Promise<void> {
    if (!this.enabled) return;

    const emoji  = event === 'opened' ? '📂' : '✅';
    const action = event === 'opened' ? 'Case Opened' : 'Case Closed';

    await this.post({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${action}* — ${caseData.caseNumber}\n*${caseData.title}*\nSeverity: *${caseData.severity.toUpperCase()}* | Status: ${caseData.status}`,
          },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `Case ID: \`${caseData.id}\` • SOC Detection Lab` },
          ],
        },
      ],
    });

    console.log(`[Notifications] ✓ Slack message sent for case: ${caseData.caseNumber}`);
  }
}
