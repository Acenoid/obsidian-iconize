import { beforeEach, describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { Notice } from 'obsidian';
import { IconPackManager } from '.';
import { IconPack } from './icon-pack';
import { LUCIDE_ICON_PACK_NAME } from './lucide';
import IconizePlugin from '@app/main';
import { EventEmitter } from '@app/lib/event/event';
import { IconPackLoadedEvent } from '@app/lib/event/events';
import { logger } from '@app/lib/logger';

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
    getEventEmitter: vi.fn(() => eventEmitter),
  }) as unknown as IconizePlugin;

let eventEmitter: EventEmitter;
let loadedIconPackEvents: IconPackLoadedEvent['payload'][];

beforeEach(() => {
  eventEmitter = new EventEmitter();
  loadedIconPackEvents = [];
  eventEmitter.on('iconPackLoaded', (event) =>
    loadedIconPackEvents.push(event.payload),
  );
});

const SVG_CONTENT = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>';

const FAILED_NOTICE = '[iconize26] One or more icon packs could not be loaded.';

const createZipFile = async (fileName: string) => {
  const zip = new JSZip();
  zip.file(fileName, SVG_CONTENT);
  return zip.generateAsync({ type: 'arraybuffer' });
};

/**
 * Expects that the icon pack `broken` could not be read and that the icon pack
 * `working` was still loaded.
 */
const expectBrokenIconPackSkipped = (manager: IconPackManager) => {
  expect(manager.getIconPackLoadState('broken')).toBe('failed');
  expect(manager.getIconPackLoadState('working')).toBe('loaded');
  expect(manager.getIconPackByName('working').getIcons()).toHaveLength(1);
  expect(manager.hasLoadedAll()).toBe(true);
  expect(loadedIconPackEvents).toEqual([
    { iconPackName: 'broken', success: false, error: expect.anything() },
    { iconPackName: 'working', success: true },
  ]);
  expect(Notice).toHaveBeenCalledTimes(1);
  expect(Notice).toHaveBeenCalledWith(FAILED_NOTICE);
};

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
    expect(manager.hasLoadedAll()).toBe(false);
    await manager.loadAll();
    expect(manager.hasLoadedAll()).toBe(true);

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

  it('should emit an event for each icon pack as soon as its icons were read', async () => {
    let resolveSecondIcon: (content: string) => void;
    const secondIcon = new Promise<string>((resolve) => {
      resolveSecondIcon = resolve;
    });
    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [],
            folders: [`${ICONS_PATH}/first`, `${ICONS_PATH}/second`],
          });
        }
        return Promise.resolve({ files: [`${path}/Icon.svg`], folders: [] });
      }),
      read: vi.fn((path: string) =>
        path.startsWith(`${ICONS_PATH}/second/`)
          ? secondIcon
          : Promise.resolve(SVG_CONTENT),
      ),
    });
    const manager = new IconPackManager(plugin, ICONS_PATH);
    const firstLoaded = new Promise<void>((resolve) =>
      eventEmitter.once('iconPackLoaded', () => resolve()),
    );

    const loading = manager.loadAll();
    await firstLoaded;

    expect(loadedIconPackEvents).toEqual([
      { iconPackName: 'first', success: true },
    ]);
    expect(manager.getIconPackLoadState('first')).toBe('loaded');
    expect(manager.getIconPackByName('first').getIcons()).toHaveLength(1);
    expect(manager.getIconPackLoadState('second')).toBe('loading');

    resolveSecondIcon(SVG_CONTENT);
    await loading;

    expect(loadedIconPackEvents).toEqual([
      { iconPackName: 'first', success: true },
      { iconPackName: 'second', success: true },
    ]);
    expect(manager.getIconPackLoadState('second')).toBe('loaded');
    expect(Notice).not.toHaveBeenCalled();
  });

  it('should report icon packs without their own event as loaded once all icon packs were read', async () => {
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    });
    const manager = new IconPackManager(plugin, ICONS_PATH);

    expect(manager.getIconPackLoadState(LUCIDE_ICON_PACK_NAME)).toBe('loading');
    await manager.loadAll();
    expect(manager.getIconPackLoadState(LUCIDE_ICON_PACK_NAME)).toBe('loaded');
    expect(loadedIconPackEvents).toEqual([]);
  });

  it('should skip an icon pack whose zip file cannot be read and load the other icon packs', async () => {
    const workingZip = await createZipFile('icon.svg');
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [`${ICONS_PATH}/broken.zip`, `${ICONS_PATH}/working.zip`],
        folders: [`${ICONS_PATH}/broken`],
      }),
      readBinary: vi.fn((path: string) =>
        Promise.resolve(
          path.endsWith('broken.zip') ? new ArrayBuffer(8) : workingZip,
        ),
      ),
    });
    const loggerError = vi.spyOn(logger, 'error');
    const manager = new IconPackManager(plugin, ICONS_PATH);

    await manager.loadAll();

    expectBrokenIconPackSkipped(manager);
    expect(loggerError).toHaveBeenCalledWith(
      "Could not load icon pack 'broken'",
      undefined,
      expect.anything(),
    );
    // The directory of the broken icon pack is not loaded as a custom icon pack.
    expect(manager.getIconPackByName('broken')).toBeUndefined();
    expect(plugin.app.vault.adapter.read).not.toHaveBeenCalled();
  });

  it('should skip an icon pack whose icons cannot be read from its zip file', async () => {
    const zip = await createZipFile('icon.svg');
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [`${ICONS_PATH}/broken.zip`, `${ICONS_PATH}/working.zip`],
        folders: [],
      }),
      readBinary: vi.fn().mockResolvedValue(zip),
    });
    const manager = new IconPackManager(plugin, ICONS_PATH);
    const fileManager = manager.getFileManager();
    const getIconsFromZipFile =
      fileManager.getIconsFromZipFile.bind(fileManager);
    vi.spyOn(fileManager, 'getIconsFromZipFile').mockImplementation(
      (iconPack, files) =>
        iconPack.getName() === 'broken'
          ? Promise.reject(new Error('Invalid icon'))
          : getIconsFromZipFile(iconPack, files),
    );

    await manager.loadAll();

    expectBrokenIconPackSkipped(manager);
  });

  it('should skip a custom icon pack whose icons cannot be read', async () => {
    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [],
            folders: [`${ICONS_PATH}/broken`, `${ICONS_PATH}/working`],
          });
        }
        return Promise.resolve({ files: [`${path}/Icon.svg`], folders: [] });
      }),
      read: vi.fn((path: string) =>
        path.startsWith(`${ICONS_PATH}/broken/`)
          ? Promise.reject(new Error('Cannot read file'))
          : Promise.resolve(SVG_CONTENT),
      ),
    });
    const manager = new IconPackManager(plugin, ICONS_PATH);

    await manager.loadAll();

    expectBrokenIconPackSkipped(manager);
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

describe('IconPackManager with custom icon packs', () => {
  const svgContent = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>';

  it('should register custom icon packs at startup without reading their icons', async () => {
    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [`${ICONS_PATH}/remix-icons.zip`],
            folders: [
              `${ICONS_PATH}/remix-icons`,
              `${ICONS_PATH}/landon`,
              `${ICONS_PATH}/lucide-icons`,
            ],
          });
        }
        return Promise.resolve({ files: [], folders: [] });
      }),
      read: vi.fn().mockResolvedValue(svgContent),
    });

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.init();

    expect(
      manager.getIconPacks().map((iconPack) => iconPack.getName()),
    ).toEqual(['remix-icons', 'landon']);
    expect(manager.getIconPackByName('landon').getIsCustom()).toBe(true);
    expect(plugin.app.vault.adapter.read).not.toHaveBeenCalled();

    await manager.loadUsedIcons(['LaCalendarTuesday']);

    expect(Notice).not.toHaveBeenCalled();
    expect(manager.getPreloadedIcons()).toHaveLength(1);
    expect(plugin.app.vault.adapter.read).toHaveBeenCalledWith(
      `${ICONS_PATH}/landon/CalendarTuesday.svg`,
    );
  });

  it('should load the icons into the custom icon pack registered at startup', async () => {
    const plugin = makePlugin({
      list: vi.fn((path: string) => {
        if (path === ICONS_PATH) {
          return Promise.resolve({
            files: [],
            folders: [`${ICONS_PATH}/landon`],
          });
        }
        return Promise.resolve({
          files: [`${ICONS_PATH}/landon/CalendarTuesday.svg`],
          folders: [],
        });
      }),
      read: vi.fn().mockResolvedValue(svgContent),
    });

    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.init();
    const iconPack = manager.getIconPackByName('landon');
    await manager.loadAll();

    expect(manager.getIconPacks()).toEqual([iconPack]);
    expect(iconPack.getIcons()).toHaveLength(1);
  });
});

describe('IconPackManager.loadUsedIcons', () => {
  it('should not report an icon without an SVG file as missing before the zip files were read', async () => {
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [`${ICONS_PATH}/remix-icons.zip`],
        folders: [],
      }),
      exists: vi.fn().mockResolvedValue(false),
    });
    const loggerError = vi.spyOn(logger, 'error');
    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.init();

    await manager.loadUsedIcons(['RiUserFill']);

    expect(manager.getPreloadedIcons()).toHaveLength(0);
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('should report an icon as missing that is not in its zip file', async () => {
    const zip = await createZipFile('walk-line.svg');
    const plugin = makePlugin({
      list: vi.fn().mockResolvedValue({
        files: [`${ICONS_PATH}/remix-icons.zip`],
        folders: [],
      }),
      exists: vi.fn().mockResolvedValue(false),
      readBinary: vi.fn().mockResolvedValue(zip),
    });
    const loggerError = vi.spyOn(logger, 'error');
    const manager = new IconPackManager(plugin, ICONS_PATH);
    await manager.init();
    await manager.loadAll();

    await manager.loadUsedIcons(['RiWalkLine', 'RiUserFill']);

    expect(
      manager.getPreloadedIcons().map((icon) => icon.prefix + icon.name),
    ).toEqual(['RiWalkLine']);
    expect(loggerError).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      `Icon with name 'UserFill' was not found (full path: ${ICONS_PATH}/remix-icons/UserFill.svg)`,
    );
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
