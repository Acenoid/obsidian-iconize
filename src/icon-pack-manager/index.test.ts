import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { IconPackManager } from '.';
import { IconPack } from './icon-pack';
import { LUCIDE_ICON_PACK_NAME } from './lucide';
import IconizePlugin from '@app/main';

vi.mock('obsidian', () => ({
  Notice: vi.fn(),
  getIconIds: () => ['lucide-wrench'],
  getIcon: () => ({
    removeClass: vi.fn(),
    outerHTML: '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>',
    innerHTML: '<path d="M1 1"/>',
  }),
}));

const ICONS_PATH = '.obsidian/icons';

const makePlugin = (adapterOverrides: Record<string, unknown> = {}) =>
  ({
    app: {
      vault: {
        adapter: {
          list: vi.fn(),
          exists: vi.fn().mockResolvedValue(true),
          read: vi.fn(),
          readBinary: vi.fn(),
          mkdir: vi.fn(),
          write: vi.fn(),
          ...adapterOverrides,
        },
      },
    },
    getSettings: vi.fn(() => ({ iconsBackgroundCheckEnabled: false })),
    doesUseNativeLucideIconPack: vi.fn(() => false),
    doesUseCustomLucideIconPack: vi.fn(() => false),
    getIconPackManager: vi.fn(),
  }) as unknown as IconizePlugin;

describe('IconPackManager.loadAll', () => {
  it('should load icons from a custom directory pack into the icon pack', async () => {
    const svgContent = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>';

    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [],
            folders: [`${ICONS_PATH}/landon`],
          });
        }
        if (path === `${ICONS_PATH}/landon`) {
          return Promise.resolve({
            files: [`${ICONS_PATH}/landon/CalendarTuesday.svg`],
            folders: [],
          });
        }
        return Promise.resolve({ files: [], folders: [] });
      }),
      read: vi.fn().mockResolvedValue(svgContent),
    });

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.loadAll();

    const landonPack = manager.getIconPackByName('landon');
    expect(landonPack).toBeDefined();
    expect(landonPack.getIcons()).toHaveLength(1);
    expect(landonPack.getIcons()[0].name).toBe('CalendarTuesday');
  });

  it('should load icons from a zip file of an older icon pack version', async () => {
    const svgContent = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>';
    const zip = new JSZip();
    zip.file(
      'fontawesome-free-6.5.1-web/svgs/regular/address-card.svg',
      svgContent,
    );
    zip.file(
      'fontawesome-free-6.5.1-web/svgs/solid/address-card.svg',
      svgContent,
    );
    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [`${ICONS_PATH}/font-awesome-regular.zip`],
        folders: [],
      }),
      readBinary: vi.fn().mockResolvedValue(arrayBuffer),
    });

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.loadAll();

    const iconPack = manager.getIconPackByName('font-awesome-regular');
    expect(iconPack.getIcons()).toHaveLength(1);
    expect(iconPack.getIcons()[0].prefix + iconPack.getIcons()[0].name).toBe(
      'FarAddressCard',
    );
  });

  it('should not read a downloaded Lucide zip file when the native Lucide icon pack is used', async () => {
    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [`${ICONS_PATH}/lucide-icons.zip`],
            folders: [`${ICONS_PATH}/lucide-icons`],
          });
        }
        return Promise.resolve({
          files: [`${ICONS_PATH}/lucide-icons/Wrench.svg`],
          folders: [],
        });
      }),
    });
    vi.mocked(plugin.doesUseNativeLucideIconPack).mockReturnValue(true);

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.loadAll();

    expect(plugin.app.vault.adapter.readBinary).not.toHaveBeenCalled();
    expect(plugin.app.vault.adapter.read).not.toHaveBeenCalled();
    expect(manager.getIconPacks()).toHaveLength(0);
  });
});

describe('IconPackManager.init', () => {
  it('should not add a downloaded Lucide zip file when the native Lucide icon pack is used', async () => {
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [
          `${ICONS_PATH}/lucide-icons.zip`,
          `${ICONS_PATH}/remix-icons.zip`,
        ],
        folders: [],
      }),
    });
    vi.mocked(plugin.doesUseNativeLucideIconPack).mockReturnValue(true);

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.init();

    const names = manager.getIconPacks().map((iconPack) => iconPack.getName());
    expect(names).toEqual(['remix-icons', LUCIDE_ICON_PACK_NAME]);
    expect(
      manager.getIconPackByName(LUCIDE_ICON_PACK_NAME).getIcons(),
    ).toHaveLength(1);
  });
});

describe('IconPackManager.removeIconPack', () => {
  it('should only remove the given icon pack', async () => {
    const plugin = makePlugin({
      rmdir: vi.fn(),
      remove: vi.fn(),
    });
    const manager = new IconPackManager(plugin, ICONS_PATH);
    vi.mocked(plugin.getIconPackManager).mockReturnValue(manager);
    const iconPacks = ['font-awesome-regular', 'icon-brew', 'remix-icons'].map(
      (name) => new IconPack(plugin, name, false),
    );
    iconPacks.forEach((iconPack) => manager.addIconPack(iconPack));

    await manager.removeIconPack(iconPacks[0]);

    expect(
      manager.getIconPacks().map((iconPack) => iconPack.getName()),
    ).toEqual(['icon-brew', 'remix-icons']);
    expect(plugin.app.vault.adapter.rmdir).toHaveBeenCalledWith(
      `${ICONS_PATH}/font-awesome-regular`,
      true,
    );
    expect(plugin.app.vault.adapter.remove).toHaveBeenCalledWith(
      `${ICONS_PATH}/font-awesome-regular.zip`,
    );
  });
});
