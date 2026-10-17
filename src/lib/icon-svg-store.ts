import type IconizePlugin from '@app/main';
import {
  getSvgFromLoadedIcon,
  nextIdentifier,
} from '@app/icon-pack-manager/util';

const splitIconName = (iconNameWithPrefix: string): [string, string] => {
  const identifier = nextIdentifier(iconNameWithPrefix);
  return [
    iconNameWithPrefix.substring(0, identifier),
    iconNameWithPrefix.substring(identifier),
  ];
};

/**
 * Returns the SVG of each icon in use, keyed by its prefixed name. The local
 * SVG wins over the stored one, which is kept for icons not available locally.
 * Unused and native Lucide icons are left out.
 */
export const collectIconSvgs = (
  plugin: IconizePlugin,
  stored: Record<string, string>,
): Record<string, string> => {
  const svgs: Record<string, string> = {};
  for (const iconName of plugin.getUsedIcons()) {
    const [prefix, name] = splitIconName(iconName);
    if (prefix === 'Li' && plugin.doesUseNativeLucideIconPack()) {
      continue;
    }

    const svg = getSvgFromLoadedIcon(plugin, prefix, name) || stored[iconName];
    if (svg) {
      svgs[iconName] = svg;
    }
  }

  return svgs;
};

/**
 * Makes the stored SVGs render for icons that aren't available locally, and
 * returns the prefixed names of the icons it added.
 */
export const addStoredIcons = (
  plugin: IconizePlugin,
  stored: Record<string, string>,
): string[] => {
  const added: string[] = [];
  for (const [iconName, svgElement] of Object.entries(stored)) {
    const [prefix, name] = splitIconName(iconName);
    if (getSvgFromLoadedIcon(plugin, prefix, name)) {
      continue;
    }

    plugin.getIconPackManager().getPreloadedIcons().push({
      name,
      prefix,
      displayName: name,
      iconPackName: null,
      filename: name,
      svgContent: '',
      svgViewbox: '',
      svgElement,
    });
    added.push(iconName);
  }

  return added;
};
