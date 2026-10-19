import IconizePlugin from '@app/main';
import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { buildLinkDecorations } from '@app/editor/live-preview/decorations';
import { refreshIconPositions } from '@app/editor/live-preview/state';

export const buildIconInLinksPlugin = (plugin: IconizePlugin) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      plugin: IconizePlugin;

      constructor(view: EditorView) {
        this.plugin = plugin;
        this.decorations = buildLinkDecorations(view, plugin);
      }

      destroy() {}

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.transactions.some((transaction) =>
            transaction.effects.some((effect) =>
              effect.is(refreshIconPositions),
            ),
          )
        ) {
          this.decorations = buildLinkDecorations(update.view, this.plugin);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
};
