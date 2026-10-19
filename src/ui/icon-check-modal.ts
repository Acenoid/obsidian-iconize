import { App, Modal } from 'obsidian';
import {
  IconCheckReport,
  getReportSections,
  getReportSummary,
} from '@app/lib/icon-check';

/**
 * Shows the report of the icon check: a summary, warnings and a collapsible
 * list of the affected paths per kind of change or problem.
 */
export default class IconCheckModal extends Modal {
  constructor(app: App, report: IconCheckReport) {
    super(app);

    this.modalEl.classList.add('iconize-custom-modal');
    this.titleEl.setText('Check and repair icons');

    for (const sentence of getReportSummary(report)) {
      this.contentEl.createEl('p', { text: sentence });
    }

    for (const warning of report.warnings) {
      this.contentEl.createEl('p', { text: warning, cls: 'mod-warning' });
    }

    for (const section of getReportSections(report)) {
      const details = this.contentEl.createEl('details');
      details.createEl('summary', {
        text: `${section.title} (${section.items.length})`,
      });
      const list = details.createEl('ul');
      for (const item of section.items) {
        list.createEl('li', { text: item });
      }
    }
  }
}
