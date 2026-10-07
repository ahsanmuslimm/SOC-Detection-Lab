/**
 * Email Notification Provider
 * Sends alert notifications via Gmail SMTP using nodemailer.
 */

import nodemailer from 'nodemailer';

interface AlertEmailData {
  title: string;
  severity: string;
  status: string;
  sourceSystem: string;
  sourceIp: string | null;
  alertType: string;
  description: string | null;
  createdAt: string;
  id: string;
}

interface CaseEmailData {
  caseNumber: string;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  id: string;
}

export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean = false;
  private to: string;
  private from: string;

  constructor() {
    this.to   = process.env.ALERT_EMAIL_TO ?? '';
    this.from = process.env.SMTP_FROM      ?? 'SOC Detection Lab <noreply@soc.lab>';

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (host && user && pass && this.to) {
      this.transporter = nodemailer.createTransport({
        host,
        port:   parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user, pass },
      });
      this.enabled = true;
      console.log('[Notifications] ✓ Email provider configured');
    } else {
      console.log('[Notifications] Email provider disabled (SMTP_HOST/USER/PASSWORD not set)');
    }
  }

  async sendAlertNotification(alert: AlertEmailData): Promise<void> {
    if (!this.enabled || !this.transporter) return;

    const severityColor: Record<string, string> = {
      critical: '#dc2626',
      high:     '#ea580c',
      medium:   '#ca8a04',
      low:      '#16a34a',
    };
    const color = severityColor[alert.severity.toLowerCase()] ?? '#6b7280';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🚨 SOC Detection Lab — Security Alert</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <div style="display: inline-block; background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
            ${alert.severity}
          </div>
          <h2 style="color: #1e293b; margin: 0 0 16px 0;">${alert.title}</h2>
          ${alert.description ? `<p style="color: #475569; margin: 0 0 16px 0;">${alert.description}</p>` : ''}
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; width: 140px;">Alert Type</td>
              <td style="padding: 8px 12px; color: #1e293b;">${alert.alertType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">Source System</td>
              <td style="padding: 8px 12px; color: #1e293b;">${alert.sourceSystem ?? 'Unknown'}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">Source IP</td>
              <td style="padding: 8px 12px; color: #1e293b;">${alert.sourceIp ?? 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">Status</td>
              <td style="padding: 8px 12px; color: #1e293b;">${alert.status}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b;">Time</td>
              <td style="padding: 8px 12px; color: #1e293b;">${new Date(alert.createdAt).toUTCString()}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 6px; border-left: 4px solid ${color};">
            <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
              ⚠️ This alert requires immediate attention. Log in to the SOC Detection Lab to investigate.
            </p>
          </div>
          <p style="margin-top: 16px; color: #94a3b8; font-size: 12px;">Alert ID: ${alert.id}</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from:    this.from,
        to:      this.to,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title} — SOC Detection Lab`,
        html,
      });
      console.log(`[Notifications] ✓ Email sent for alert: ${alert.title}`);
    } catch (err) {
      console.error('[Notifications] Email send failed:', (err as Error).message);
    }
  }

  async sendCaseNotification(caseData: CaseEmailData, event: 'opened' | 'closed'): Promise<void> {
    if (!this.enabled || !this.transporter) return;

    const emoji  = event === 'opened' ? '📂' : '✅';
    const action = event === 'opened' ? 'Opened' : 'Closed';

    try {
      await this.transporter.sendMail({
        from:    this.from,
        to:      this.to,
        subject: `[CASE ${action.toUpperCase()}] ${caseData.caseNumber}: ${caseData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2>${emoji} Case ${action}: ${caseData.caseNumber}</h2>
            <p><strong>Title:</strong> ${caseData.title}</p>
            <p><strong>Severity:</strong> ${caseData.severity}</p>
            <p><strong>Status:</strong> ${caseData.status}</p>
            ${caseData.description ? `<p><strong>Description:</strong> ${caseData.description}</p>` : ''}
            <p style="color: #94a3b8; font-size: 12px;">Case ID: ${caseData.id}</p>
          </div>
        `,
      });
      console.log(`[Notifications] ✓ Email sent for case ${action}: ${caseData.caseNumber}`);
    } catch (err) {
      console.error('[Notifications] Case email failed:', (err as Error).message);
    }
  }
}
