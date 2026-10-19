/**
 * Id of the original Iconize plugin this fork was created from. Both plugins
 * must never be enabled at the same time, otherwise every icon is rendered
 * twice.
 */
export const ORIGINAL_PLUGIN_ID = 'obsidian-icon-folder';

/**
 * Returns warnings about leftovers of the original Iconize plugin that need
 * the user's attention after switching to this fork: the original plugin
 * still being enabled, and settings copied from the original plugin whose
 * icon packs folder still points into the original plugin's folder.
 */
export function getOriginalPluginWarnings(
  enabledPlugins: Set<string>,
  iconPacksPath: string,
  configDir: string,
): string[] {
  const warnings: string[] = [];

  if (enabledPlugins.has(ORIGINAL_PLUGIN_ID)) {
    warnings.push(
      'The original Iconize plugin is enabled as well. Disable it, otherwise icons are shown twice.',
    );
  }

  // Paths starting with `/` are the same as without a slash.
  const normalizedPath = `${iconPacksPath.replace(/^\/+/, '')}/`;
  if (
    normalizedPath.startsWith(`${configDir}/plugins/${ORIGINAL_PLUGIN_ID}/`)
  ) {
    warnings.push(
      `The icon packs folder still points to the folder of the original Iconize plugin (${iconPacksPath}). Change "Icon packs folder path" in the settings, otherwise the icon packs are lost when the original plugin is removed.`,
    );
  }

  return warnings;
}
