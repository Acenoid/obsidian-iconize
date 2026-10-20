import { MarkdownView } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import type IconizePlugin from '@app/main';
import { refreshIconPositions } from '@app/editor/live-preview/state';
import { LUCIDE_ICON_PACK_NAME } from '@app/icon-pack-manager/lucide';

/**
 * Redraws the icons in open notes, because icons from the icon packs were not
 * available yet when the notes were rendered at startup or before an icon pack
 * was downloaded.
 */
export const redrawIconsInOpenNotes = (plugin: IconizePlugin): void => {
  const hasIconPacksFromFiles = plugin
    .getIconPackManager()
    .getIconPacks()
    .some(
      (iconPack) =>
        iconPack.getName() !== LUCIDE_ICON_PACK_NAME ||
        plugin.doesUseCustomLucideIconPack(),
    );
  if (!hasIconPacksFromFiles) {
    return;
  }

  for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
    // Deferred views are rendered later with all icons.
    if (!(leaf.view instanceof MarkdownView)) {
      continue;
    }

    if (leaf.view.getMode() === 'preview') {
      leaf.view.previewMode.rerender(true);
    }

    const editorView = (leaf.view.editor as unknown as { cm?: EditorView }).cm;
    editorView?.dispatch({ effects: refreshIconPositions.of(null) });
  }
};
