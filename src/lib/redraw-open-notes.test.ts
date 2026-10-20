import { describe, expect, it, vi } from 'vitest';
import { MarkdownView } from 'obsidian';
import IconizePlugin from '@app/main';
import { redrawIconsInOpenNotes } from './redraw-open-notes';
import { refreshIconPositions } from '@app/editor/live-preview/state';
import { LUCIDE_ICON_PACK_NAME } from '@app/icon-pack-manager/lucide';

vi.mock('obsidian', () => ({ MarkdownView: class MarkdownView {} }));

const makeLeaf = (mode: 'preview' | 'source', hasEditorView = true) => {
  const view = Object.assign(Object.create(MarkdownView.prototype), {
    getMode: () => mode,
    previewMode: { rerender: vi.fn() },
    editor: hasEditorView ? { cm: { dispatch: vi.fn() } } : {},
  });
  return { view };
};

const makePlugin = (
  iconPackNames: string[],
  leaves: unknown[],
  usesCustomLucideIconPack = false,
) => {
  const plugin = {
    app: { workspace: { getLeavesOfType: vi.fn(() => leaves) } },
    getIconPackManager: () => ({
      getIconPacks: () =>
        iconPackNames.map((name) => ({ getName: () => name })),
    }),
    doesUseCustomLucideIconPack: () => usesCustomLucideIconPack,
  };
  return plugin as unknown as IconizePlugin & typeof plugin;
};

describe('redrawIconsInOpenNotes', () => {
  it('rerenders notes in reading view and refreshes the icons in the editor', () => {
    const readingLeaf = makeLeaf('preview');
    const editingLeaf = makeLeaf('source');
    const plugin = makePlugin(
      [LUCIDE_ICON_PACK_NAME, 'tabler-icons'],
      [readingLeaf, editingLeaf],
    );

    redrawIconsInOpenNotes(plugin);

    expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(
      'markdown',
    );
    expect(readingLeaf.view.previewMode.rerender).toHaveBeenCalledWith(true);
    expect(editingLeaf.view.previewMode.rerender).not.toHaveBeenCalled();
    for (const leaf of [readingLeaf, editingLeaf]) {
      expect(leaf.view.editor.cm.dispatch).toHaveBeenCalledTimes(1);
      const [{ effects }] = leaf.view.editor.cm.dispatch.mock.calls[0];
      expect(effects.is(refreshIconPositions)).toBe(true);
    }
  });

  it('rerenders notes in reading view without an editor', () => {
    const leaf = makeLeaf('preview', false);
    const plugin = makePlugin(['tabler-icons'], [leaf]);

    redrawIconsInOpenNotes(plugin);

    expect(leaf.view.previewMode.rerender).toHaveBeenCalledWith(true);
  });

  it('skips deferred views, which are rendered later with all icons', () => {
    const deferredView = { getMode: vi.fn() };
    const plugin = makePlugin(['tabler-icons'], [{ view: deferredView }]);

    redrawIconsInOpenNotes(plugin);

    expect(deferredView.getMode).not.toHaveBeenCalled();
  });

  it('does nothing if only the native Lucide icons are available', () => {
    const leaf = makeLeaf('preview');
    const plugin = makePlugin([LUCIDE_ICON_PACK_NAME], [leaf]);

    redrawIconsInOpenNotes(plugin);

    expect(plugin.app.workspace.getLeavesOfType).not.toHaveBeenCalled();
    expect(leaf.view.previewMode.rerender).not.toHaveBeenCalled();
    expect(leaf.view.editor.cm.dispatch).not.toHaveBeenCalled();
  });

  it('redraws the notes if the Lucide icons come from the downloaded zip file', () => {
    const leaf = makeLeaf('preview');
    const plugin = makePlugin([LUCIDE_ICON_PACK_NAME], [leaf], true);

    redrawIconsInOpenNotes(plugin);

    expect(leaf.view.previewMode.rerender).toHaveBeenCalledWith(true);
  });
});
