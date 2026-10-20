export interface PredefinedIconPack {
  name: string;
  displayName: string;
  path: string;
  /** Paths inside the zip files of older versions that have a different layout. */
  legacyPaths?: string[];
  downloadLink: string;
}

const predefinedIconPacks = {
  faBrands: {
    name: 'font-awesome-brands',
    displayName: 'FontAwesome Brands',
    path: 'fontawesome-free-7.3.1-web/svgs/brands/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/7.3.1/fontawesome-free-7.3.1-web.zip',
  },
  faRegular: {
    name: 'font-awesome-regular',
    displayName: 'FontAwesome Regular',
    path: 'fontawesome-free-7.3.1-web/svgs/regular/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/7.3.1/fontawesome-free-7.3.1-web.zip',
  },
  faSolid: {
    name: 'font-awesome-solid',
    displayName: 'FontAwesome Solid',
    path: 'fontawesome-free-7.3.1-web/svgs/solid/',
    downloadLink:
      'https://github.com/FortAwesome/Font-Awesome/releases/download/7.3.1/fontawesome-free-7.3.1-web.zip',
  },
  remixIcons: {
    name: 'remix-icons',
    displayName: 'Remix Icons',
    path: '',
    downloadLink:
      'https://github.com/Remix-Design/RemixIcon/releases/download/v4.9.1/RemixIcon_Svg_v4.9.1.zip',
  },
  iconBrew: {
    name: 'icon-brew',
    displayName: 'Icon Brew',
    path: '',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/icon-brew.zip',
  },
  /** @source https://simpleicons.org/ */
  simpleIcons: {
    name: 'simple-icons',
    displayName: 'Simple Icons',
    path: 'simple-icons-16.35.0/icons/',
    downloadLink:
      'https://github.com/simple-icons/simple-icons/archive/refs/tags/16.35.0.zip',
  },
  lucide: {
    name: 'lucide-icons',
    displayName: 'Lucide',
    path: '',
    downloadLink:
      'https://github.com/lucide-icons/lucide/releases/download/1.60.0/lucide-icons-1.60.0.zip',
  },
  tablerIcons: {
    name: 'tabler-icons',
    displayName: 'Tabler Icons',
    path: 'tabler-icons-3.49.0/icons/',
    // Up to version 3.28.1, the zip file was a release asset with this layout.
    legacyPaths: ['svg'],
    downloadLink:
      'https://github.com/tabler/tabler-icons/archive/refs/tags/v3.49.0.zip',
  },
  /** @source https://boxicons.com/ */
  boxicons: {
    name: 'boxicons',
    displayName: 'Boxicons',
    path: 'svg',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/boxicons.zip',
  },
  /** @source http://nagoshiashumari.github.io/Rpg-Awesome/ */
  rpgAwesome: {
    name: 'rpg-awesome',
    displayName: 'RPG Awesome',
    path: '',
    downloadLink:
      'https://github.com/FlorianWoelki/obsidian-iconize/raw/main/iconPacks/rpg-awesome.zip',
  },
  /** @source https://coolicons.cool/ */
  coolicons: {
    name: 'coolicons',
    displayName: 'Coolicons',
    path: 'cooliocns SVG',
    downloadLink:
      'https://github.com/krystonschwarze/coolicons/releases/download/v4.1/coolicons.v4.1.zip',
  },
  /** @source https://feathericons.com/ */
  feathericons: {
    name: 'feather-icons',
    displayName: 'Feather Icons',
    path: 'feather-4.29.2/icons/',
    downloadLink:
      'https://github.com/feathericons/feather/archive/refs/tags/v4.29.2.zip',
  },
  /** @source https://github.com/primer/octicons */
  octicons: {
    name: 'octicons',
    displayName: 'Octicons',
    path: 'octicons--primer-octicons-19.41.0/icons/',
    downloadLink:
      'https://github.com/primer/octicons/archive/refs/tags/@primer/octicons@19.41.0.zip',
  },
} as { [key: string]: PredefinedIconPack };

/**
 * Returns a possible path to the icon pack.
 * @param name String of the icon pack name.
 * @returns String of the path to the icon pack or undefined if the icon pack does not
 * exist.
 */
export const getExtraPath = (iconPackName: string): string | undefined => {
  const path: string | undefined = Object.values(predefinedIconPacks).find(
    (iconPack) => iconPack.name === iconPackName,
  )?.path;
  return path?.length === 0 ? undefined : path;
};

/**
 * Returns the paths inside the zip files of older versions of the icon pack, if their
 * layout differs from the current version.
 * @param iconPackName String of the icon pack name.
 * @returns Array of the legacy paths, which is empty if the icon pack has none.
 */
export const getLegacyPaths = (iconPackName: string): string[] => {
  return (
    Object.values(predefinedIconPacks).find(
      (iconPack) => iconPack.name === iconPackName,
    )?.legacyPaths ?? []
  );
};

/**
 * Checks if a file inside a downloaded zip file is located in the extra path of the
 * icon pack. The first directory of the extra path usually contains the version of the
 * icon pack (e.g. `fontawesome-free-7.3.1-web/`). Zip files downloaded with an older
 * version of the plugin have a different version there, so this directory is ignored
 * when the full path does not match.
 * @param fileName String of the file path inside the zip file.
 * @param extraPath String of the extra path of the icon pack.
 * @returns Boolean whether the file is located in the extra path.
 */
export const isInExtraPath = (fileName: string, extraPath: string): boolean => {
  if (fileName.startsWith(extraPath)) {
    return true;
  }

  const extraPathWithoutRoot = extraPath.split('/').slice(1).join('/');
  if (extraPathWithoutRoot.length === 0) {
    return false;
  }

  return fileName
    .split('/')
    .slice(1)
    .join('/')
    .startsWith(extraPathWithoutRoot);
};

export default predefinedIconPacks;
