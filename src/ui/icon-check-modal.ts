import { App, Keymap, Modal, TFile } from 'obsidian';
import {
  IconCheckReport,
  IconCheckSegment,
  getReportSections,
  getReportSummary,
} from '@app/lib/icon-check';

/**
 * Shows the report of the icon check: a summary, warnings and a collapsible
 * list of the affected paths per kind of change or problem. Paths of files are
 * links that open the file. The window can be resized.
 */
export default class IconCheckModal extends Modal {
  constructor(app: App, report: IconCheckReport) {
    super(app);

    this.titleEl.setText('Check and repair icons');
    Object.assign(this.modalEl.style, {
      width: 'min(700px, 90vw)',
      minWidth: '320px',
      minHeight: '160px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      resize: 'both',
      overflow: 'auto',
    });
    this.contentEl.style.userSelect = 'text';

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
        this.renderLine(list.createEl('li'), item);
      }
    }
  }

  private renderLine(lineEl: HTMLElement, segments: IconCheckSegment[]): void {
    for (const segment of segments) {
      if (typeof segment === 'string') {
        lineEl.appendText(segment);
        continue;
      }

      const file = this.app.vault.getAbstractFileByPath(segment.path);
      if (!(file instanceof TFile)) {
        lineEl.appendText(segment.path);
        continue;
      }

      const link = lineEl.createEl('a', {
        text: segment.path,
        cls: 'internal-link',
        href: '#',
      });
      link.addEventListener('click', (event) => {
        event.preventDefault();
        // Ctrl or Cmd opens the file in a new tab.
        this.app.workspace.getLeaf(Keymap.isModEvent(event)).openFile(file);
      });
    }
  }
}
