import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { FileManager } from './file-manager';
import { IconPack } from './icon-pack';
import { getExtraPath } from '@app/icon-packs';
import IconizePlugin from '@app/main';

vi.mock('obsidian', () => ({
  Notice: vi.fn(),
}));

const SVG = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>';

const loadIconNames = async (
  iconPackName: string,
  fileNames: string[],
): Promise<string[]> => {
  const zip = new JSZip();
  fileNames.forEach((fileName) => zip.file(fileName, SVG));
  const files = Object.values(zip.files).filter((file) => !file.dir);

  const plugin = {} as IconizePlugin;
  const iconPack = new IconPack(plugin, iconPackName, false);
  const icons = await new FileManager(plugin).getIconsFromZipFile(
    iconPack,
    files,
  );
  return icons.map((icon) => icon.name);
};

describe('getIconsFromZipFile', () => {
  it('should only load the icons in the extra path', async () => {
    const names = await loadIconNames('tabler-icons', [
      `${getExtraPath('tabler-icons')}outline/home.svg`,
      'tabler-icons-3.49.0/.github/icons-stroke.svg',
    ]);

    expect(names).toEqual(['Home']);
  });

  it('should load the icons of an older zip file from a legacy path', async () => {
    const names = await loadIconNames('tabler-icons', [
      'svg/outline/home.svg',
      'other/svg/star.svg',
    ]);

    expect(names).toEqual(['Home']);
  });

  it('should not use legacy paths of other icon packs', async () => {
    const names = await loadIconNames('simple-icons', ['svg/outline/home.svg']);

    expect(names).toEqual([]);
  });
});
