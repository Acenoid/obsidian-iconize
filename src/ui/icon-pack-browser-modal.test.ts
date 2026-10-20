import { describe, expect, it, vi } from 'vitest';
import { App } from 'obsidian';
import IconPackBrowserModal from './icon-pack-browser-modal';
import IconizePlugin from '@app/main';
import predefinedIconPacks from '@app/icon-packs';
import { downloadZipFile } from '@app/zip-util';
import { redrawIconsInOpenNotes } from '@app/lib/redraw-open-notes';

vi.mock('obsidian', () => {
  class FuzzySuggestModal {
    resultContainerEl = document.createElement('div');
    inputEl = document.createElement('input');
    contentEl = document.createElement('div');
  }

  return { FuzzySuggestModal, Notice: vi.fn() };
});

vi.mock('@app/zip-util', () => ({ downloadZipFile: vi.fn() }));
vi.mock('@app/lib/redraw-open-notes', () => ({
  redrawIconsInOpenNotes: vi.fn(),
}));

const makeModal = () => {
  const calls: string[] = [];
  vi.mocked(redrawIconsInOpenNotes).mockImplementation(() => {
    calls.push('redrawIconsInOpenNotes');
  });
  const iconPackManager = {
    getPath: () => '.obsidian/icons',
    getFileManager: () => ({
      createZipFile: vi.fn(async () => {
        calls.push('createZipFile');
      }),
    }),
    registerIconPack: vi.fn(async () => {
      calls.push('registerIconPack');
    }),
  };
  const plugin = { getIconPackManager: () => iconPackManager };
  const modal = new IconPackBrowserModal(
    {} as App,
    plugin as unknown as IconizePlugin,
  );
  modal.onAddedIconPack = () => {
    calls.push('onAddedIconPack');
  };
  return { modal, plugin, iconPackManager, calls };
};

describe('onChooseItem', () => {
  it('redraws the open notes after the icon pack was registered', async () => {
    const arrayBuffer = new ArrayBuffer(8);
    vi.mocked(downloadZipFile).mockResolvedValue(arrayBuffer);
    const { modal, plugin, iconPackManager, calls } = makeModal();

    await modal.onChooseItem(
      predefinedIconPacks.tablerIcons,
      new MouseEvent('click'),
    );

    expect(iconPackManager.registerIconPack).toHaveBeenCalledWith(
      'tabler-icons',
      arrayBuffer,
    );
    expect(redrawIconsInOpenNotes).toHaveBeenCalledWith(plugin);
    expect(calls).toEqual([
      'createZipFile',
      'registerIconPack',
      'redrawIconsInOpenNotes',
      'onAddedIconPack',
    ]);
  });

  it('does not redraw the open notes if the download fails', async () => {
    vi.mocked(downloadZipFile).mockRejectedValue(new Error('offline'));
    const { modal, calls } = makeModal();

    await expect(
      modal.onChooseItem(
        predefinedIconPacks.tablerIcons,
        new MouseEvent('click'),
      ),
    ).rejects.toThrow('offline');

    expect(redrawIconsInOpenNotes).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});
