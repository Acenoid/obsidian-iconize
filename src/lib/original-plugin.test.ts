import { describe, expect, it } from 'vitest';
import {
  ORIGINAL_PLUGIN_ID,
  getOriginalPluginWarnings,
} from './original-plugin';

describe('getOriginalPluginWarnings', () => {
  it('should return no warnings when nothing refers to the original plugin', () => {
    expect(
      getOriginalPluginWarnings(
        new Set(['obsidian-icon26-folder']),
        '.obsidian/plugins/obsidian-icon26-folder/icons',
        '.obsidian',
      ),
    ).toEqual([]);
  });

  it('should warn when the original plugin is enabled', () => {
    const warnings = getOriginalPluginWarnings(
      new Set([ORIGINAL_PLUGIN_ID]),
      '.obsidian/icons',
      '.obsidian',
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('enabled as well');
  });

  it('should warn when the icon packs folder is inside the original plugin folder', () => {
    const warnings = getOriginalPluginWarnings(
      new Set(),
      '/.obsidian/plugins/obsidian-icon-folder/icons',
      '.obsidian',
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(
      '/.obsidian/plugins/obsidian-icon-folder/icons',
    );
  });

  it('should warn when the icon packs folder is the original plugin folder', () => {
    expect(
      getOriginalPluginWarnings(
        new Set(),
        '.obsidian/plugins/obsidian-icon-folder',
        '.obsidian',
      ),
    ).toHaveLength(1);
  });

  it('should not warn for folders that only start with the original plugin id', () => {
    expect(
      getOriginalPluginWarnings(
        new Set(),
        '.obsidian/plugins/obsidian-icon-folder-backup/icons',
        '.obsidian',
      ),
    ).toEqual([]);
  });

  it('should respect a custom config folder', () => {
    expect(
      getOriginalPluginWarnings(
        new Set(),
        '.config/plugins/obsidian-icon-folder/icons',
        '.config',
      ),
    ).toHaveLength(1);
  });
});
