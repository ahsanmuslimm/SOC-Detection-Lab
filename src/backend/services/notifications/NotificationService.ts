/**
 * Notification Service
 *
 * Orchestrates Email + Slack notifications for security events.
 * Only fires for CRITICAL and HIGH severity alerts.
 * Gracefully disabled when credentials are not configured.
 *
 * Usage:
 *   const notifier = NotificationService.getInstance();
 *   await notifier.alertCreated(alert);
 *   await notifier.caseOpened(caseData);
 *   await notifier.caseClosed(caseData);
 */

import { EmailProvider } from './EmailProvider';
import { SlackProvider }  from './SlackProvider';

const NOTIFY_SEVERITIES = new Set(['critical', 'high']);

export class NotificationService {
  private static instance: NotificationService | null = null;

  private email: EmailProvider;
  private slack: SlackProvider;

  private constructor() {
    this.email = new EmailProvider();
    this.slack = new SlackProvider();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Call after a new alert is persisted to the database.
   */
  async alertCreated(alert: Record<string, unknown>): Promise<void> {
    const severity = String(alert.severity ?? '').toLowerCase();
    if (!NOTIFY_SEVERITIES.has(severity)) return;

    const data = {
      id:           String(alert.id          ?? ''),
      title:        String(alert.title        ?? 'Untitled Alert'),
      severity,
      status:       String(alert.status       ?? 'open'),
      alertType:    String(alert.alertType    ?? alert.alert_type ?? 'unknown'),
      sourceSystem: String(alert.sourceSystem ?? alert.source_system ?? 'unknown'),
      sourceIp:     alert.sourceIp  != null ? String(alert.sourceIp)  :
                    alert.source_ip != null ? String(alert.source_ip) : null,
      description:  alert.description != null ? String(alert.description) : null,
      createdAt:    String(alert.createdAt    ?? alert.created_at ?? new Date().toISOString()),
    };

    // Fire both in parallel — failure of one doesn't block the other
    await Promise.allSettled([
      this.email.sendAlertNotification(data),
      this.slack.sendAlertNotification(data),
    ]);
  }

  /**
   * Call after a new case is opened.
   */
  async caseOpened(caseData: Record<string, unknown>): Promise<void> {
    const severity = String(caseData.severity ?? '').toLowerCase();
    if (!NOTIFY_SEVERITIES.has(severity)) return;

    const data = {
      id:          String(caseData.id          ?? ''),
      caseNumber:  String(caseData.caseNumber  ?? caseData.case_number ?? 'UNKNOWN'),
      title:       String(caseData.title        ?? 'Untitled Case'),
      severity,
      status:      String(caseData.status       ?? 'open'),
      description: caseData.description != null ? String(caseData.description) : null,
    };

    await Promise.allSettled([
      this.email.sendCaseNotification(data, 'opened'),
      this.slack.sendCaseNotification(data, 'opened'),
    ]);
  }

  /**
   * Call after a case is closed.
   */
  async caseClosed(caseData: Record<string, unknown>): Promise<void> {
    const severity = String(caseData.severity ?? '').toLowerCase();
    if (!NOTIFY_SEVERITIES.has(severity)) return;

    const data = {
      id:          String(caseData.id          ?? ''),
      caseNumber:  String(caseData.caseNumber  ?? caseData.case_number ?? 'UNKNOWN'),
      title:       String(caseData.title        ?? 'Untitled Case'),
      severity,
      status:      String(caseData.status       ?? 'closed'),
      description: caseData.description != null ? String(caseData.description) : null,
    };

    await Promise.allSettled([
      this.email.sendCaseNotification(data, 'closed'),
      this.slack.sendCaseNotification(data, 'closed'),
    ]);
  }
}
