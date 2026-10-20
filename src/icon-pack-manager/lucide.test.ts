import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { requestUrl } from 'obsidian';
import { IconPackManager } from '.';
import { LUCIDE_ICON_PACK_NAME } from './lucide';
import IconizePlugin from '@app/main';

vi.mock('obsidian', () => ({
  Notice: vi.fn(),
  requestUrl: vi.fn(),
  getIconIds: (): string[] => [],
  getIcon: vi.fn(),
}));

const ICONS_PATH = '.obsidian/icons';

/**
 * Starts the icon pack manager like Obsidian does with the Lucide setting `None`, so
 * no Lucide icon pack exists.
 */
const startWithoutLucide = async (
  adapterOverrides: Record<string, unknown> = {},
) => {
  const plugin = {
    app: {
      vault: {
        adapter: {
          list: vi.fn().mockResolvedValue({ files: [], folders: [] }),
          exists: vi.fn().mockResolvedValue(false),
          writeBinary: vi.fn(),
          rmdir: vi.fn(),
          remove: vi.fn(),
          ...adapterOverrides,
        },
      },
    },
    doesUseNativeLucideIconPack: vi.fn(() => false),
    doesUseCustomLucideIconPack: vi.fn(() => false),
    getIconPackManager: vi.fn(),
  } as unknown as IconizePlugin;
  const manager = new IconPackManager(plugin, ICONS_PATH);
  vi.mocked(plugin.getIconPackManager).mockReturnValue(manager);
  await manager.init();
  return { plugin, manager };
};

describe('LucideIconPack', () => {
  it('should download the custom Lucide icon pack after a start without it', async () => {
    const zip = new JSZip();
    zip.file(
      'icons/funnel.svg',
      '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>',
    );
    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    vi.mocked(requestUrl).mockResolvedValue({ arrayBuffer } as never);
    const { plugin, manager } = await startWithoutLucide();

    await manager.getLucideIconPack().addCustom();

    expect(plugin.app.vault.adapter.writeBinary).toHaveBeenCalledWith(
      `${ICONS_PATH}/${LUCIDE_ICON_PACK_NAME}.zip`,
      arrayBuffer,
    );
    const icons = manager.getIconPackByName(LUCIDE_ICON_PACK_NAME).getIcons();
    expect(icons.map((icon) => icon.name)).toEqual(['Funnel']);
  });

  it('should remove a downloaded Lucide zip file after a start without the icon pack', async () => {
    const { plugin, manager } = await startWithoutLucide({
      exists: vi.fn().mockResolvedValue(true),
    });

    await manager.getLucideIconPack().removeCustom();

    expect(plugin.app.vault.adapter.remove).toHaveBeenCalledWith(
      `${ICONS_PATH}/${LUCIDE_ICON_PACK_NAME}.zip`,
    );
  });
});
